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
export function boot(base, onProgress) {
  return call({ op: 'boot', base }, onProgress);
}

// One conversational turn: a full cognitive step, words out.
export function ask(text) {
  return call({ op: 'ask', text });
}
