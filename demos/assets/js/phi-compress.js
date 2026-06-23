// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-compress WASM module (compiled from
// phi-compress-cpp/web → phi_compress.{js,wasm}). Lazy-loads the Emscripten ES6
// glue via the shared phi-wasm-runtime.js and exposes the general-purpose
// ("base") lossless codec: compress / decompress, both backed by the VERIFIED
// phi-compress-cpp codec (one source of truth, no JS compression). zlib is
// supplied separately on the page (pako) purely as the comparison baseline.
//
// Usage (in base-codec.html's `<script type="module">`):
//     import { ready, PhiCompress } from './assets/js/phi-compress.js';
//     await ready();
//     const comp = PhiCompress.compress(bytes);   // Uint8Array -> Uint8Array
//     const back = PhiCompress.decompress(comp);   // exact original bytes

import { createWasmRuntime, currentVersion } from './phi-wasm-runtime.js';

let _module = null;
const _rt = createWasmRuntime('../wasm/phi_compress.js', currentVersion(import.meta.url));

// Resolve (once) the WASM module; returns the namespace API.
export function ready() {
  return _rt.ready().then((m) => { _module = m; return api; });
}

export function isReady() { return _rt.isReady(); }

export const PhiCompress = {
  // Compress raw bytes. Returns the full wire frame (Uint8Array).
  compress(u8) { return _module.compress(u8); },
  // Decompress a frame produced by compress(). Returns the exact original bytes.
  decompress(u8) { return _module.decompress(u8); },
};

const api = { ready, isReady, PhiCompress };
export default api;
