// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-compress-image codec, run in a module Web Worker
// (phi-image-worker.js) so encode/decode never block the UI thread. Backed by
// the VERIFIED phi-compress-image codec (one source of truth, no JS codec).
// quality 1 = lossless (bit-exact round-trip).
//
// Pixel marshalling: the codec's native format is packed RGB, 3 bytes/pixel
// (R,G,B), top-to-bottom, left-to-right. The browser hands us RGBA from a
// canvas; the helpers here strip/restore the alpha channel so the page works
// in canvas ImageData while the codec sees packed RGB.
//
// Usage (in image-codec.html's `<script type="module">`):
//     import { ready, PhiImage, rgbaToRgb, rgbToRgba } from './assets/js/phi-image.js';
//     await ready();
//     const pei = await PhiImage.encode(rgb, width, height);   // -> Uint8Array (.pei)
//     const rgb = await PhiImage.decode(pei);                  // -> Uint8Array (exact)

let _worker = null;
let _ready = false;
let _nextId = 1;
const _pending = new Map();

function getWorker() {
  if (!_worker) {
    _worker = new Worker(new URL('./phi-image-worker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (e) => {
      const m = e.data;
      const p = _pending.get(m.id);
      if (!p) return;
      _pending.delete(m.id);
      if (m.ok) p.resolve(m.result); else p.reject(new Error(m.error));
    };
    _worker.onerror = (e) => {
      const err = new Error(e.message || 'image codec worker failed to load');
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

export const PhiImage = {
  // Encode packed RGB (Uint8Array, 3 bytes/pixel) to a .pei frame
  // (Promise<Uint8Array>). quality 1 = lossless.
  encode(rgb, width, height, quality = 1) {
    const bytes = new Uint8Array(rgb.buffer, rgb.byteOffset, rgb.byteLength);
    return call({ op: 'encode', rgb: bytes, width, height, quality });
  },
  // Decode a .pei frame back to packed RGB (Promise<Uint8Array>; exact at quality 1).
  decode(pei) {
    return call({ op: 'decode', pei });
  },
};

// ── RGBA <-> RGB helpers (canvas ImageData is RGBA) — pure, main thread ───────

// Strip the alpha channel: RGBA Uint8ClampedArray (length 4·N) -> RGB Uint8Array (3·N).
export function rgbaToRgb(rgba) {
  const n = rgba.length >> 2;
  const rgb = new Uint8Array(n * 3);
  for (let i = 0, o = 0; i < n; i++) {
    const j = i << 2;
    rgb[o++] = rgba[j]; rgb[o++] = rgba[j + 1]; rgb[o++] = rgba[j + 2];
  }
  return rgb;
}

// Restore an opaque alpha channel: RGB Uint8Array (3·N) -> RGBA Uint8ClampedArray (4·N).
export function rgbToRgba(rgb) {
  const n = (rgb.length / 3) | 0;
  const rgba = new Uint8ClampedArray(n * 4);
  for (let i = 0, o = 0; i < n; i++) {
    const j = i * 3;
    rgba[o++] = rgb[j]; rgba[o++] = rgb[j + 1]; rgba[o++] = rgb[j + 2]; rgba[o++] = 255;
  }
  return rgba;
}

const api = { ready, isReady, PhiImage, rgbaToRgb, rgbToRgba };
export default api;
