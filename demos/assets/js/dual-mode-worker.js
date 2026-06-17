// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Dual-Mode Yoga Core demo. Runs the exact dual-mode
// comparison — one intent compiled to both the circuit (gate) and the anyonic
// (braiding) backend — off the UI thread, from phi-quantum-core-cpp via WASM.
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
    const totalDim = mod.fibTotalQuantumDim();
    self.postMessage({ ok: true, qubit, entangler, totalDim });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
