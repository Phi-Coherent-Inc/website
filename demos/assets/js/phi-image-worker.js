// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the image-codec demo. Runs the phi-compress-image codec
// (phi_image_codec.{js,wasm}) OFF the UI thread, so encoding an image never
// freezes the page. Module worker:
//     new Worker(new URL('./phi-image-worker.js', import.meta.url), { type: 'module' })
//
// Protocol (request/response correlated by `id`):
//   main → worker: { id, op:'warm' }
//                | { id, op:'encode', rgb:Uint8Array, width, height, quality }
//                | { id, op:'decode', pei:Uint8Array }
//   worker → main: { id, ok:true, result?:Uint8Array } | { id, ok:false, error }
// Result buffers are transferred back (zero-copy); inputs are structure-cloned
// so the main thread keeps its copy for display / round-trip comparison.

let modulePromise = null;

async function getModule() {
  if (!modulePromise) modulePromise = import('../wasm/phi_image_codec.js').then((m) => m.default());
  return modulePromise;
}

self.onmessage = async (e) => {
  const { id, op } = e.data;
  try {
    const mod = await getModule();
    if (op === 'warm') {
      self.postMessage({ id, ok: true });
    } else if (op === 'encode') {
      const { rgb, width, height, quality } = e.data;
      const out = mod.encode(rgb, width >>> 0, height >>> 0, quality | 0);
      self.postMessage({ id, ok: true, result: out }, [out.buffer]);
    } else if (op === 'decode') {
      const out = mod.decode(e.data.pei);
      self.postMessage({ id, ok: true, result: out }, [out.buffer]);
    } else {
      self.postMessage({ id, ok: false, error: 'unknown op: ' + op });
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
