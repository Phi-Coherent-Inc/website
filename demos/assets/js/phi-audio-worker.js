// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the audio-codec demo. Runs the phi-compress-audio codec
// (phi_audio_codec.{js,wasm}) OFF the UI thread, so encoding a clip never
// freezes the page. Module worker:
//     new Worker(new URL('./phi-audio-worker.js', import.meta.url), { type: 'module' })
//
// Protocol (request/response correlated by `id`):
//   main → worker: { id, op:'warm' }
//                | { id, op:'encode', pcm:Uint8Array, sampleRate, channels, quality }
//                | { id, op:'decode', pea:Uint8Array }
//   worker → main: { id, ok:true, result?:Uint8Array } | { id, ok:false, error }
// Result buffers are transferred back (zero-copy); inputs are structure-cloned
// so the main thread keeps its copy for playback / waveform.

let modulePromise = null;

async function getModule() {
  if (!modulePromise) modulePromise = import('../wasm/phi_audio_codec.js').then((m) => m.default());
  return modulePromise;
}

self.onmessage = async (e) => {
  const { id, op } = e.data;
  try {
    const mod = await getModule();
    if (op === 'warm') {
      self.postMessage({ id, ok: true });
    } else if (op === 'encode') {
      const { pcm, sampleRate, channels, quality } = e.data;
      const out = mod.encode(pcm, sampleRate >>> 0, channels >>> 0, 16, quality | 0);
      self.postMessage({ id, ok: true, result: out }, [out.buffer]);
    } else if (op === 'decode') {
      const out = mod.decode(e.data.pea);
      self.postMessage({ id, ok: true, result: out }, [out.buffer]);
    } else {
      self.postMessage({ id, ok: false, error: 'unknown op: ' + op });
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
