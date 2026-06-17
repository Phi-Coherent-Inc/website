// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the MIPT Finite-Size Scaling demo. Computes, off the UI thread
// via WASM, the measurement-induced phase transition in the CLIFFORD setting
// (PauliTableau + GF(2)-rank stabilizer entropy), across several system sizes
// L ∈ {8,12,16,20}:
//   • half-chain entanglement entropy S(L/2) vs measurement rate p — volume-law
//     (fans out with L) below p_c, area-law (collapses) above;
//   • tripartite mutual information I₃ vs p — dimensionless, so its curves CROSS
//     at the critical point p_c ≈ 0.15 (the literature Clifford-MIPT value).
// Module worker:
//     new Worker('assets/js/mipt-scaling-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { trajectories }   (clamped 1..80 in C++; default 30)
//   worker → main:  { ok: true, rows: [...] } | { ok: false, error }

let modulePromise = null;

async function getModule() {
  if (!modulePromise) {
    modulePromise = import('../wasm/phi_quantum.js').then((m) => m.default());
  }
  return modulePromise;
}

function vecToArray(v, pick) {
  const out = [];
  const n = v.size();
  for (let i = 0; i < n; i++) out.push(pick(v.get(i)));
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const trajectories = (ev.data && ev.data.trajectories) || 40;
  try {
    const mod = await getModule();
    const rows = vecToArray(mod.runMiptScaling(trajectories >>> 0), (r) => ({
      p: r.p,
      s8: r.s8, s12: r.s12, s16: r.s16, s20: r.s20,
      i3_8: r.i3_8, i3_12: r.i3_12, i3_16: r.i3_16, i3_20: r.i3_20,
    }));
    self.postMessage({ ok: true, rows });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
