// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the interactive MIPT Data-Collapse demo. Computes, via WASM
// (runMiptCollapse): the tripartite-mutual-information data points I₃(p,L) for
// L ∈ {12,16,20,24} on a near-critical p-grid, plus the auto-fitted (p_c, ν)
// that best collapses them under I₃(p,L)=F((p−p_c)·L^{1/ν}). The page then
// re-scales the points live as the user drags p_c / ν, and can snap to the fit.
// Module worker:
//     new Worker('assets/js/mipt-collapse-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { trajectories }   (clamped 1..200 in C++; default 100)
//   worker → main:  { ok: true, points: [...], fit: {pc,nu,cost,costBad} }
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
  const trajectories = (ev.data && ev.data.trajectories) || 120;
  try {
    const mod = await getModule();
    const res = mod.runMiptCollapse(trajectories >>> 0);
    const points = vecToArray(res.points, (r) => ({ L: r.L, p: r.p, i3: r.i3 }));
    const fit = { pc: res.pcFit, nu: res.nuFit, cost: res.cost, costBad: res.costBad };
    self.postMessage({ ok: true, points, fit });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
