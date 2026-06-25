// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-compress-video codec, run in a module Web Worker
// (phi-video-worker.js) so encode/decode never block the UI thread. Backed by
// the VERIFIED phi-compress-video codec (one source of truth, no JS codec).
// quality 1 = lossless (bit-exact round-trip).
//
// Pixel marshalling: the codec's native format is packed RGB, 3 bytes/pixel
// (R,G,B), one frame after another. A clip is passed as ONE Uint8Array holding
// every frame's RGB concatenated. The browser hands us RGBA from a canvas; the
// helpers here strip/restore the alpha channel.
//
// Usage (in video-codec.html's `<script type="module">`):
//     import { ready, PhiVideo, rgbaToRgb, rgbToRgba } from './assets/js/phi-video.js';
//     await ready();
//     const pev = await PhiVideo.encode(rgbAll, width, height, nFrames, fps); // -> Uint8Array (.pev)
//     const rgbAll = await PhiVideo.decode(pev);                              // -> Uint8Array (exact)

let _worker = null;
let _ready = false;
let _nextId = 1;
const _pending = new Map();

function getWorker() {
  if (!_worker) {
    _worker = new Worker(new URL('./phi-video-worker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (e) => {
      const m = e.data;
      const p = _pending.get(m.id);
      if (!p) return;
      _pending.delete(m.id);
      if (m.ok) p.resolve(m.result); else p.reject(new Error(m.error));
    };
    _worker.onerror = (e) => {
      const err = new Error(e.message || 'video codec worker failed to load');
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

export const PhiVideo = {
  // Encode a clip (every frame's packed RGB concatenated) to a .pev bitstream
  // (Promise<Uint8Array>). quality 1 = lossless.
  encode(rgbAll, width, height, frames, fps = 30, quality = 1) {
    const bytes = new Uint8Array(rgbAll.buffer, rgbAll.byteOffset, rgbAll.byteLength);
    return call({ op: 'encode', rgb: bytes, width, height, frames, quality, fps });
  },
  // Decode a .pev bitstream back to the concatenated packed RGB of every frame
  // (Promise<Uint8Array>; exact at quality 1).
  decode(pev) {
    return call({ op: 'decode', pev });
  },
};

// ── RGBA <-> RGB helpers (canvas ImageData is RGBA) — pure, main thread ───────

// Strip the alpha channel: RGBA (length 4·N) -> packed RGB Uint8Array (3·N).
export function rgbaToRgb(rgba) {
  const n = rgba.length >> 2;
  const rgb = new Uint8Array(n * 3);
  for (let i = 0, o = 0; i < n; i++) {
    const j = i << 2;
    rgb[o++] = rgba[j]; rgb[o++] = rgba[j + 1]; rgb[o++] = rgba[j + 2];
  }
  return rgb;
}

// Restore an opaque alpha channel for one frame: packed RGB (3·N) -> RGBA (4·N).
export function rgbToRgba(rgb, offset = 0, pixels = (rgb.length / 3) | 0) {
  const rgba = new Uint8ClampedArray(pixels * 4);
  for (let i = 0, o = 0; i < pixels; i++) {
    const j = offset + i * 3;
    rgba[o++] = rgb[j]; rgba[o++] = rgb[j + 1]; rgba[o++] = rgb[j + 2]; rgba[o++] = 255;
  }
  return rgba;
}

const api = { ready, isReady, PhiVideo, rgbaToRgb, rgbToRgba };
export default api;
