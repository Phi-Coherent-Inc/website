// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-agi cognitive facade, run in a module Web Worker
// (phi-agi-worker.js) so the minutes-scale boot and the seconds-scale thinking
// never block the UI thread. Backed by the VERIFIED phi-agi-cpp facade — the
// same C++ that trains and converses natively (one source of truth).
//
// Usage (in agi-chat.html's `<script type="module">`):
//     import { boot, ask } from './assets/js/phi-agi.js';
//     await boot('assets/models/agi', (p) => render(p.stage, p.pct));
//     const words = await ask('hello');

let _worker = null;
let _nextId = 1;
const _pending = new Map();     // id -> {resolve, reject, onProgress}

function getWorker() {
  if (!_worker) {
    _worker = new Worker(new URL('./phi-agi-worker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (e) => {
      const m = e.data;
      const p = _pending.get(m.id);
      if (!p) return;
      if (m.ok && m.progress) { if (p.onProgress) p.onProgress(m.progress); return; }
      _pending.delete(m.id);
      if (!m.ok) p.reject(new Error(m.error));
      else p.resolve(m.done ? { cortex: m.cortex } : m.result);
    };
  }
  return _worker;
}

function call(msg, onProgress) {
  const id = _nextId++;
  return new Promise((resolve, reject) => {
    _pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, ...msg });
  });
}

// Boot the mind: fetch + stage the brain, derive the identity, load the
// weights. `onProgress({stage, pct})` narrates. Resolves {cortex:boolean}.
// `base` is resolved against the PAGE's URL here — inside the worker a
// relative fetch would resolve against the worker script's directory.
export function boot(base, onProgress) {
  const absBase = new URL(base, document.baseURI).href.replace(/\/$/, '');
  return call({ op: 'boot', base: absBase }, onProgress);
}

// One conversational turn: a full cognitive step, words out.
export function ask(text) {
  return call({ op: 'ask', text });
}

// SEE: one RGBA frame (Uint8Array, w*h*4) through the trained visual encoder
// into perceive(); resolves the mind's spontaneous words (often '').
export function see(rgba, w, h) {
  return call({ op: 'see', rgba, w, h });
}

// HEAR: one ~130 ms mono Float32 PCM window (44.1 kHz, 5733 samples) through
// the trained audio encoder into perceive(); words as above.
export function hear(pcm) {
  return call({ op: 'hear', pcm });
}

// The mind's OWN voice: Float32Array waveform (44.1 kHz) of its last response.
export function voice() {
  return call({ op: 'voice' });
}
