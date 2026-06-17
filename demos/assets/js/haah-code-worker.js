// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Haah's-Code (type-II fracton) demo. Computes, via WASM:
//   • runHaahScaling — the ground-state degeneracy k(L) of Haah's cubic code
//     (irregular, non-monotonic, with the clean powers-of-two law k(2^m)=4L−2)
//     vs the X-cube code (smooth k=6L−3), on the same GF(2) stabilizer engine;
//   • runHaahValidation — the algebraic validators: CSS commutativity (defect 0),
//     the Frobenius fractal identity f₁²=1+x²+y²+z² over F₂, and f₁^L≡0 on the
//     L=2^m torus.
// Module worker:
//     new Worker('assets/js/haah-code-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { maxL }   (clamped 2..8 in C++)
//   worker → main:  { ok: true, scaling: [...], validation: {...} }
//                 | { ok: false, error }

let modulePromise = null;
async function getModule() {
  if (!modulePromise) modulePromise = import('../wasm/phi_quantum.js').then((m) => m.default());
  return modulePromise;
}
function vecToArray(v, pick) {
  const out = []; const n = v.size();
  for (let i = 0; i < n; i++) out.push(pick(v.get(i)));
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const maxL = (ev.data && ev.data.maxL) || 8;
  try {
    const mod = await getModule();
    const scaling = vecToArray(mod.runHaahScaling(maxL >>> 0), (r) => ({
      L: r.L, haahK: r.haahK, xcubeK: r.xcubeK, n: r.n, pow2Pred: r.pow2Pred, isPow2: r.isPow2,
    }));
    const v = mod.runHaahValidation();
    const validation = { cssDefect: v.cssDefect, frobeniusMatch: v.frobeniusMatch, frobTorusZero: v.frobTorusZero };
    self.postMessage({ ok: true, scaling, validation });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
