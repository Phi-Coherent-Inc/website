// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Dual-Mode Core demo. Runs the exact dual-mode
// comparison: one intent compiled to both the circuit (gate) and the anyonic
// (braiding) backend, off the UI thread, from phi-quantum-core-cpp via WASM.
// Module worker:
//     new Worker('assets/js/dual-mode-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  {}  (no params)
//   worker → main:  { ok: true, qubit: [...], entangler: {...}, totalDim }
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
    out.push({
      target: r.target,
      circuitFid: r.circuitFid,
      anyonicFid: r.anyonicFid,
      braidError: r.braidError,
      braidLength: r.braidLength,
      modeAgreement: r.modeAgreement,
    });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async () => {
  try {
    const mod = await getModule();
    const qubit = vecToArray(mod.runDualModeQubit());
    const e = mod.runDualModeEntangler();
    const entangler = {
      leakage: e.leakage,
      cnotDistance: e.cnotDistance,
      maxNegativity: e.maxNegativity,
      schmidtRank: e.schmidtRank,
      certified: e.certified,
    };
    // Entangling-weave frontier: CNOT-class distance vs allowed 6-anyon braid length.
    const fv = mod.runEntanglerFrontier();
    const frontier = [];
    for (let i = 0; i < fv.size(); i++) {
      const r = fv.get(i);
      frontier.push({
        len: r.len, leakage: r.leakage, cnotDistance: r.cnotDistance,
        maxNegativity: r.maxNegativity, schmidtRank: r.schmidtRank, certified: r.certified,
      });
    }
    if (typeof fv.delete === 'function') fv.delete();
    const totalDim = mod.fibTotalQuantumDim();
    // Qudit synthesis scoreboard: mean error per strategy on the D>2 fusion qudit,
    // at a matched node budget (exhaustive vs meet-in-the-middle vs co-adaptive).
    const sv = mod.runQuditSynthScoreboard();
    const scoreboard = [];
    for (let i = 0; i < sv.size(); i++) {
      const r = sv.get(i);
      scoreboard.push({ strategy: r.strategy, dim: r.dim, nStrands: r.nStrands,
                        error: r.error, braidLength: r.braidLength, nTargets: r.nTargets });
    }
    if (typeof sv.delete === 'function') sv.delete();
    self.postMessage({ ok: true, qubit, entangler, frontier, totalDim, scoreboard });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
