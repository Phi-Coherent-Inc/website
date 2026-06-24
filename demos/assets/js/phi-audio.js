// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-compress-audio codec, run in a module Web Worker
// (phi-audio-worker.js) so encode/decode never block the UI thread. Backed by
// the VERIFIED phi-compress-audio codec (one source of truth, no JS codec).
// quality 1 = lossless (bit-exact round-trip).
//
// PCM marshalling: the codec's native format is interleaved signed 16-bit PCM,
// little-endian. The helpers here convert between the browser's Float32 audio
// (Web Audio / decoded WAV) and that Int16 PCM, so the page works in samples.
//
// Usage (in audio-codec.html's `<script type="module">`):
//     import { ready, PhiAudio } from './assets/js/phi-audio.js';
//     await ready();
//     const pea = await PhiAudio.encode(int16pcm, sampleRate, channels);  // -> Uint8Array (.pea)
//     const pcm = await PhiAudio.decode(pea);                             // -> Int16Array (exact)

let _worker = null;
let _ready = false;
let _nextId = 1;
const _pending = new Map();

function getWorker() {
  if (!_worker) {
    _worker = new Worker(new URL('./phi-audio-worker.js', import.meta.url), { type: 'module' });
    _worker.onmessage = (e) => {
      const m = e.data;
      const p = _pending.get(m.id);
      if (!p) return;
      _pending.delete(m.id);
      if (m.ok) p.resolve(m.result); else p.reject(new Error(m.error));
    };
    _worker.onerror = (e) => {
      const err = new Error(e.message || 'audio codec worker failed to load');
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

export const PhiAudio = {
  // Encode interleaved Int16 PCM to a .pea frame (Promise<Uint8Array>). quality 1 = lossless.
  encode(int16, sampleRate, channels, quality = 1) {
    const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
    return call({ op: 'encode', pcm: bytes, sampleRate, channels, quality });
  },
  // Decode a .pea frame back to interleaved Int16 PCM (Promise<Int16Array>; exact at quality 1).
  decode(pea) {
    return call({ op: 'decode', pea }).then((bytes) =>
      new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 1));
  },
};

// ── PCM <-> Float32 helpers (interleaved) — pure, run on the main thread ──────

// Interleave per-channel Float32 buffers ([-1,1]) into one interleaved Int16Array.
export function floatToInt16(channelBuffers) {
  const ch = channelBuffers.length;
  const n = channelBuffers[0].length;
  const out = new Int16Array(n * ch);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      let s = channelBuffers[c][i];
      s = s < -1 ? -1 : s > 1 ? 1 : s;
      out[i * ch + c] = s < 0 ? (s * 32768) | 0 : (s * 32767) | 0;
    }
  }
  return out;
}

// Split interleaved Int16 PCM into per-channel Float32 buffers ([-1,1]).
export function int16ToFloat(int16, channels) {
  const n = (int16.length / channels) | 0;
  const out = [];
  for (let c = 0; c < channels; c++) out.push(new Float32Array(n));
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < channels; c++) {
      const v = int16[i * channels + c];
      out[c][i] = v < 0 ? v / 32768 : v / 32767;
    }
  }
  return out;
}

const api = { ready, isReady, PhiAudio, floatToInt16, int16ToFloat };
export default api;
