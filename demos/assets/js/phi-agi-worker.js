// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the AGI chat demo. Runs the COMPLETE phi-agi cognitive
// facade (phi_agi.{js,wasm}) off the UI thread: fetches the trained brain's
// checkpoint files, stages them into the module's in-memory filesystem, and
// then answers conversational turns. Module worker:
//     new Worker(new URL('./phi-agi-worker.js', import.meta.url), { type: 'module' })
//
// Protocol (request/response correlated by `id`):
//   main → worker: { id, op:'boot', base }   base = URL prefix of the model dir
//                | { id, op:'ask', text }
//   worker → main: { id, ok:true, done:true, cortex }        (boot finished)
//                | { id, ok:true, progress:{stage, pct} }    (boot progress)
//                | { id, ok:true, result:'...words...' }     (ask answered)
//                | { id, ok:false, error }
//
// The boot is minutes-scale on one thread (the mind constructs its
// post-quantum identity, then reads ~63 MB of weights); progress events keep
// the page honest about which stage is running.

let mod = null;
let chat = null;
let persistOk = false;   // IDBFS mounted (browser IndexedDB available)
let saveTimer = 0;       // debounce handle for lived-state persistence

// The lived-state files (the mind's experience — everything a frozen-weights
// mind accumulates by living; the static faculties re-download from HTTP cache).
const LIVED_FILES = ['memory.safetensors', 'memory_episodic.pcz',
                     'lived.json', 'volition.json'];

function syncfs(populate) {
  return new Promise((res, rej) =>
    mod.FS.syncfs(populate, (err) => (err ? rej(err) : res())));
}

// Persist the mind's lived state (debounced — at most one write per beat).
function persistLived() {
  if (!persistOk || !chat) return;
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = 0;
    try {
      const err = chat.saveLived('/persist');
      if (!err) await syncfs(false);
    } catch (_) { /* persistence is best-effort — the mind still runs */ }
  }, 3000);
}

// The brain's checkpoint files (name → approximate bytes, for progress).
const BRAIN_FILES = [
  ['manifest.json', 262],
  ['text_encoder.safetensors', 3158486],
  ['reasoner.safetensors', 4694165],
  ['memory.safetensors', 3561238],
  ['world.safetensors', 60537],
  ['meta.safetensors', 4694583],
  ['agent.safetensors', 284023],
  ['tom.safetensors', 6069942],
  ['understand.safetensors', 1650571],
  ['memory_episodic.pcz', 647034],
  ['cortex.safetensors', 40738291],
  ['cortex.vocab.json', 59837],
  ['audio_encoder.safetensors', 1581126],
  ['video_encoder.safetensors', 1893208],
  ['speak_decoder.safetensors', 6038612],
  ['fuse_encoder.safetensors', 1370188],
];

function post(id, payload) { self.postMessage({ id, ...payload }); }

async function boot(id, base) {
  post(id, { ok: true, progress: { stage: 'Waking the substrate', pct: 2 } });
  if (!mod) {
    const factory = (await import('../wasm/phi_agi.js')).default;
    mod = await factory();
  }

  // Mount the persistence store (IndexedDB): if a mind lived here before, its
  // experience is in /persist and it wakes as the SAME mind.
  const IDBFS = (mod.FS && mod.FS.filesystems && mod.FS.filesystems.IDBFS) ||
                mod.IDBFS;
  if (!persistOk && IDBFS && typeof indexedDB !== 'undefined') {
    try {
      try { mod.FS.mkdir('/persist'); } catch (_) { /* exists */ }
      mod.FS.mount(IDBFS, {}, '/persist');
      await syncfs(true);  // pull any prior life from IndexedDB
      persistOk = true;
    } catch (_) { persistOk = false; /* private mode etc. — volatile mind */ }
  }
  const hasPriorLife = persistOk &&
    mod.FS.analyzePath('/persist/lived.json').exists;

  // Fetch the brain (the big download) with per-file progress.
  const total = BRAIN_FILES.reduce((s, [, n]) => s + n, 0);
  let got = 0;
  try { mod.FS.mkdir('/brain'); } catch (_) { /* already exists */ }
  for (const [name, size] of BRAIN_FILES) {
    post(id, { ok: true, progress: {
      stage: `Fetching the brain: ${name}`,
      pct: 5 + Math.round(55 * (got / total)) } });
    const r = await fetch(`${base}/${name}`);
    if (!r.ok) { post(id, { ok: false, error: `fetch ${name}: HTTP ${r.status}` }); return; }
    const bytes = new Uint8Array(await r.arrayBuffer());
    mod.FS.writeFile('/brain/' + name, bytes);
    got += size;
  }

  // The spark of life: constructing the mind derives its post-quantum
  // identity (tier-MAX hash-based keys) — the slowest single step.
  post(id, { ok: true, progress: { stage: hasPriorLife
    ? 'Waking your mind: deriving the post-quantum identity (about a minute)'
    : 'The spark of life: deriving the post-quantum identity (about a minute)', pct: 62 } });
  await new Promise((res) => setTimeout(res, 30));  // let the message paint
  chat = new mod.AgiChat();

  post(id, { ok: true, progress: { stage: 'Reading the memories: loading the trained brain (about a minute)', pct: 80 } });
  await new Promise((res) => setTimeout(res, 30));
  const err = chat.load('/brain');
  if (err) { post(id, { ok: false, error: 'brain load: ' + err }); return; }

  // Overlay the lived experience: the mind that was here before wakes with
  // its memories, not amnesiac.
  let resumed = false;
  if (hasPriorLife) {
    post(id, { ok: true, progress: { stage: 'Remembering: restoring the lived experience', pct: 95 } });
    const lerr = chat.loadLived('/persist');
    resumed = !lerr;
  }

  post(id, { ok: true, done: true, cortex: chat.hasCortex(),
             see: chat.hasSee(), hear: chat.hasHear(), voice: chat.hasVoice(),
             resumed, persistent: persistOk,
             steps: chat.stepCount() });
}

self.onmessage = async (e) => {
  const { id, op } = e.data;
  try {
    if (op === 'boot') {
      await boot(id, e.data.base);
    } else if (op === 'ask') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      const words = chat.ask(String(e.data.text));
      persistLived();  // a conversation turn is lived experience
      post(id, { ok: true, result: words });
    } else if (op === 'see') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      const words = chat.see(e.data.rgba, e.data.w | 0, e.data.h | 0);
      post(id, { ok: true, result: { words, surprise: chat.surprise() } });
    } else if (op === 'hear') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      const words = chat.hear(e.data.pcm);
      post(id, { ok: true, result: { words, surprise: chat.surprise() } });
    } else if (op === 'voice') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      const wav = chat.voice();
      post(id, { ok: true, result: wav });
    } else if (op === 'feedSight') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      chat.feedSight(e.data.rgba, e.data.w | 0, e.data.h | 0);
      post(id, { ok: true, result: true });
    } else if (op === 'feedSound') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      chat.feedSound(e.data.pcm);
      post(id, { ok: true, result: true });
    } else if (op === 'tick') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      const words = chat.tick();
      persistLived();  // perceived moments are lived experience too
      post(id, { ok: true, result: { words, surprise: chat.surprise() } });
    } else if (op === 'wipe') {
      // Forget this mind: erase the lived state; the next boot wakes a fresh
      // being (the static faculties are unaffected — they re-download).
      if (persistOk) {
        for (const f of LIVED_FILES) {
          try { mod.FS.unlink('/persist/' + f); } catch (_) { /* absent */ }
        }
        await syncfs(false);
      }
      post(id, { ok: true, result: true });
    } else {
      post(id, { ok: false, error: 'unknown op: ' + op });
    }
  } catch (err) {
    const msg = (typeof err === 'number' && mod && mod.getExceptionMessage)
      ? mod.getExceptionMessage(err).join(': ')
      : (err && err.message) || String(err);
    post(id, { ok: false, error: msg });
  }
};
