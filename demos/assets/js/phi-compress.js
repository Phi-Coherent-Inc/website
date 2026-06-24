// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-compress codec, run in a module Web Worker
// (phi-compress-worker.js) so compress/decompress never block the UI thread.
// Backed by the VERIFIED phi-compress-cpp codec (one source of truth, no JS
// compression). zlib is supplied separately on the page (pako) purely as the
// comparison baseline.
//
// Usage (in base-codec.html's `<script type="module">`):
//     import { ready, PhiCompress } from './assets/js/phi-compress.js';
//     await ready();
//     const comp = await PhiCompress.compress(bytes);   // Uint8Array -> Uint8Array
//     const back = await PhiCompress.decompress(comp);   // exact original bytes

let _worker = null;
let _ready = false;
let _nextId = 1;
const _pending = new Map();

function getWorker() {
  if (!_worker) {
    _worker = new Worker(new URL('./phi-compress-worker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (e) => {
      const m = e.data;
      const p = _pending.get(m.id);
      if (!p) return;
      _pending.delete(m.id);
      if (m.ok) p.resolve(m.result); else p.reject(new Error(m.error));
    };
    _worker.onerror = (e) => {
      const err = new Error(e.message || 'compress worker failed to load');
      _pending.forEach((p) => p.reject(err));
      _pending.clear();
    };
  }
  return _worker;
}

function call(msg, transfer = []) {
  return new Promise((resolve, reject) => {
    const id = _nextId++;
    _pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...msg }, transfer);
  });
}

// Resolve (once) the WASM module inside the worker; returns the namespace API.
export function ready() {
  return call({ op: 'warm' }).then(() => { _ready = true; return api; });
}

export function isReady() { return _ready; }

export const PhiCompress = {
  // Compress raw bytes. Returns the full wire frame (Promise<Uint8Array>).
  compress(u8) { return call({ op: 'compress', data: u8 }); },
  // Decompress a frame produced by compress(). Returns the exact original bytes.
  decompress(u8) { return call({ op: 'decompress', data: u8 }); },
};

const api = { ready, isReady, PhiCompress };
export default api;
