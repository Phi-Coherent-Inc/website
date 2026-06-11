// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Error-Correction demo. Runs the real (heavy) surface-code
// Monte Carlo — bench::run_fib_surface_sweep — off the UI thread so the page
// stays responsive while the sweep computes. Module worker: instantiate with
//     new Worker('assets/js/ec-worker.js', { type: 'module' })
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
      k: p.k, fibQubits: p.fibQubits, physical: p.physical,
      fibPL: p.fibPL, fibLow: p.fibLow, fibHigh: p.fibHigh,
      singleD: p.singleD, singleQubits: p.singleQubits,
      singlePL: p.singlePL, singleLow: p.singleLow, singleHigh: p.singleHigh,
      gap: p.gap, winner: p.winner,
    });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const trajectories = (ev.data && ev.data.trajectories) || 600;
  try {
    const mod = await getModule();
    const points = vecToArray(mod.runFibSurfaceSweep(trajectories >>> 0));
    self.postMessage({ ok: true, points });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
