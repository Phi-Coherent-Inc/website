// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the base-codec demo. Runs the phi-compress-cpp general-purpose
// codec (phi_compress.{js,wasm}) OFF the UI thread, so compressing a large file
// never freezes the page. Module worker:
//     new Worker(new URL('./phi-compress-worker.js', import.meta.url), { type: 'module' })
//
// Protocol (request/response correlated by `id`):
//   main → worker: { id, op:'warm' }
//                | { id, op:'compress',   data:Uint8Array }
//                | { id, op:'decompress', data:Uint8Array }
//   worker → main: { id, ok:true, result?:Uint8Array } | { id, ok:false, error }
// Result buffers are transferred back (zero-copy); inputs are structure-cloned
// so the main thread keeps its copy for the round-trip check.

let modulePromise = null;

async function getModule() {
  if (!modulePromise) modulePromise = import('../wasm/phi_compress.js').then((m) => m.default());
  return modulePromise;
}

self.onmessage = async (e) => {
  const { id, op } = e.data;
  try {
    const mod = await getModule();
    if (op === 'warm') {
      self.postMessage({ id, ok: true });
    } else if (op === 'compress') {
      const out = mod.compress(e.data.data);
      self.postMessage({ id, ok: true, result: out }, [out.buffer]);
    } else if (op === 'decompress') {
      const out = mod.decompress(e.data.data);
      self.postMessage({ id, ok: true, result: out }, [out.buffer]);
    } else {
      self.postMessage({ id, ok: false, error: 'unknown op: ' + op });
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
