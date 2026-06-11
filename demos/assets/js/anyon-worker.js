// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Anyon-Braiding demo. Runs the heavy Fibonacci-anyon
// code-capacity threshold sweep (runFibAnyonThreshold) off the UI thread.
// Module worker:  new Worker('assets/js/anyon-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { trajectories }
//   worker → main:  { ok: true, points: [...] }  |  { ok: false, error }

let modulePromise = null;

async function getModule() {
  if (!modulePromise) {
    modulePromise = import('../wasm/phi_quantum.js').then((m) => m.default());
  }
  return modulePromise;
}

function vecToArray(v) {
  const out = [];
  const n = v.size();
  for (let i = 0; i < n; i++) {
    const p = v.get(i);
    out.push({
      distance: p.distance, physical: p.physical,
      pL: p.pL, low: p.low, high: p.high,
    });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const trajectories = (ev.data && ev.data.trajectories) || 3000;
  try {
    const mod = await getModule();
    const points = vecToArray(mod.runFibAnyonThreshold(trajectories >>> 0));
    self.postMessage({ ok: true, points });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
