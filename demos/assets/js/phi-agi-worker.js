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
];

function post(id, payload) { self.postMessage({ id, ...payload }); }

async function boot(id, base) {
  post(id, { ok: true, progress: { stage: 'Waking the substrate', pct: 2 } });
  if (!mod) {
    const factory = (await import('../wasm/phi_agi.js')).default;
    mod = await factory();
  }

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
  post(id, { ok: true, progress: { stage: 'The spark of life: deriving the post-quantum identity (about a minute)', pct: 62 } });
  await new Promise((res) => setTimeout(res, 30));  // let the message paint
  chat = new mod.AgiChat();

  post(id, { ok: true, progress: { stage: 'Reading the memories: loading the trained brain (about a minute)', pct: 80 } });
  await new Promise((res) => setTimeout(res, 30));
  const err = chat.load('/brain');
  if (err) { post(id, { ok: false, error: 'brain load: ' + err }); return; }

  post(id, { ok: true, done: true, cortex: chat.hasCortex(),
             see: chat.hasSee(), hear: chat.hasHear(), voice: chat.hasVoice() });
}

self.onmessage = async (e) => {
  const { id, op } = e.data;
  try {
    if (op === 'boot') {
      await boot(id, e.data.base);
    } else if (op === 'ask') {
      if (!chat) { post(id, { ok: false, error: 'not booted' }); return; }
      const words = chat.ask(String(e.data.text));
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
