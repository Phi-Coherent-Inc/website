// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Measurement-Induced Phase Transition (MIPT) demo. Sweeps
// the measurement rate p (0..0.7) and computes the trajectory-averaged
// half-chain entanglement entropy — the order parameter that collapses from
// volume-law to area-law as projective measurements win — off the UI thread,
// from phi-quantum-* via WASM. Module worker:
//     new Worker('assets/js/mipt-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { nQubits, depth, trajectories }
//   worker → main:  { ok: true, points: [{ p, entropy }, ...] }
//                 | { ok: false, error }

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
    const r = v.get(i);
    out.push({ p: r.p, entropy: r.entropy });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const nQubits = (ev.data && ev.data.nQubits) || 8;
  const depth = (ev.data && ev.data.depth) || 16;
  const trajectories = (ev.data && ev.data.trajectories) || 16;
  try {
    const mod = await getModule();
    const points = vecToArray(
      mod.runMipt(nQubits >>> 0, depth >>> 0, trajectories >>> 0)
    );
    self.postMessage({ ok: true, points });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
