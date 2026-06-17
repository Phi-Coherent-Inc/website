// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Modular Data & Universality demo. Runs the exact modular
// consistency checks (S/T data) and the braiding-universality gap — Fibonacci
// nearly reaches the T-gate, Ising is pinned far away — off the UI thread, from
// phi-quantum-* via WASM. Module worker:
//     new Worker('assets/js/modular-data-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { maxlen }
//   worker → main:  { ok: true, consistency: {...}, universality: {...} }
//                 | { ok: false, error }

let modulePromise = null;

async function getModule() {
  if (!modulePromise) {
    modulePromise = import('../wasm/phi_quantum.js').then((m) => m.default());
  }
  return modulePromise;
}

self.onmessage = async (ev) => {
  const maxlen = (ev.data && ev.data.maxlen) || 8;
  try {
    const mod = await getModule();
    const c = mod.runModularConsistency();
    const consistency = {
      sSymmetric: c.sSymmetric,
      sUnitary: c.sUnitary,
      sSquaredIdentity: c.sSquaredIdentity,
      verlindeTtt: c.verlindeTtt,
      verlindeTt1: c.verlindeTt1,
      dTauFromS: c.dTauFromS,
      centralCharge: c.centralCharge,
    };
    const u = mod.runUniversality(maxlen >>> 0);
    const universality = {
      fibMinDist: u.fibMinDist,
      isingMinDist: u.isingMinDist,
      fibReaches: u.fibReaches,
      isingBlocked: u.isingBlocked,
    };
    self.postMessage({ ok: true, consistency, universality });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
