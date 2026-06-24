// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-compress-audio WASM module (compiled from
// phi-compress-audio/web → phi_audio_codec.{js,wasm}). Lazy-loads the Emscripten
// ES6 glue via the shared phi-wasm-runtime.js and exposes the .pea audio codec:
// encode / decode, both backed by the VERIFIED phi-compress-audio codec (one
// source of truth, no JS codec). quality 1 = lossless (bit-exact round-trip).
//
// PCM marshalling: the codec's native format is interleaved signed 16-bit PCM,
// little-endian. The helpers here convert between the browser's Float32 audio
// (Web Audio / decoded WAV) and that Int16 PCM, so the page works in samples.
//
// Usage (in audio-codec.html's `<script type="module">`):
//     import { ready, PhiAudio } from './assets/js/phi-audio.js';
//     await ready();
//     const pea  = PhiAudio.encode(int16pcm, sampleRate, channels);  // -> Uint8Array (.pea)
//     const pcm  = PhiAudio.decode(pea);                             // -> Int16Array (exact)

import { createWasmRuntime, currentVersion } from './phi-wasm-runtime.js';

let _module = null;
const _rt = createWasmRuntime('../wasm/phi_audio_codec.js', currentVersion(import.meta.url));

// Resolve (once) the WASM module; returns the namespace API.
export function ready() {
  return _rt.ready().then((m) => { _module = m; return api; });
}

export function isReady() { return _rt.isReady(); }

export const PhiAudio = {
  // Encode interleaved Int16 PCM to a .pea frame (Uint8Array). quality 1 = lossless.
  encode(int16, sampleRate, channels, quality = 1) {
    const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
    return _module.encode(bytes, sampleRate >>> 0, channels >>> 0, 16, quality | 0);
  },
  // Decode a .pea frame back to interleaved Int16 PCM (exact original at quality 1).
  decode(pea) {
    const bytes = _module.decode(pea);            // Uint8Array of interleaved int16 LE
    return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 1);
  },
};

// ── PCM <-> Float32 helpers (interleaved) ────────────────────────────────────

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
