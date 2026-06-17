// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Topological Entanglement Entropy γ demo. Computes the
// measured TEE constant — Fibonacci γ = log(2 + φ) vs Z₂ γ = log 2 — and the
// bond-dimension collapse (γ → 0 at χ = 1, recovering log(2+φ) only at full
// rank) off the UI thread, from phi-quantum-* via WASM. Module worker:
//     new Worker('assets/js/tee-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  {}  (no params)
//   worker → main:  { ok: true, tee: {...}, collapse: [...] }
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
    out.push({ chi: r.chi, gamma: r.gamma });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async () => {
  try {
    const mod = await getModule();
    const t = mod.runTee();
    const tee = {
      fibGamma: t.fibGamma,
      fibAnalytic: t.fibAnalytic,
      z2Gamma: t.z2Gamma,
      z2Analytic: t.z2Analytic,
    };
    const collapse = vecToArray(mod.runTeeCollapse());
    self.postMessage({ ok: true, tee, collapse });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
