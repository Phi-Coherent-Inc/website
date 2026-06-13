// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Fibonacci string-net QEC demo. Runs the exact, dense
// code-capacity simulation — stringnet::compare_stringnet_vs_surface_sweep —
// off the UI thread. The genuine 2D Levin-Wen Fibonacci code (d=φ) on a torus
// vs the Z2 toric (= surface-equivalent) on identical machinery, plus the
// literal SurfaceQEC anchor. Module worker:
//     new Worker('assets/js/stringnet-worker.js', { type: 'module' })
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
    const r = v.get(i);
    out.push({
      physical: r.physical,
      fibPL: r.fibPL,
      z2PL: r.z2PL,
      surfacePL: r.surfacePL,
      competitive: r.competitive,
    });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const trajectories = (ev.data && ev.data.trajectories) || 1200;
  try {
    const mod = await getModule();
    const points = vecToArray(mod.runStringNetSurfaceSweep(trajectories >>> 0));
    self.postMessage({ ok: true, points });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
