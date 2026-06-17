// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Fracton Topological Order demo. Computes two
// fingerprints of fracton order off the UI thread, from phi-quantum-*
// via WASM:
//   (1) ground-state degeneracy (GSD) vs lattice size L — X-cube k = 6L−3
//       (sub-extensive) vs 3D toric k = 3 (constant);
//   (2) excitation mobility — straight-Z-string syndrome weight vs string
//       length — 3D toric flat at 2 (mobile) vs X-cube 4·len (immobile).
// Module worker:
//     new Worker('assets/js/fracton-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { maxL }            (maxL clamped 2..7 in C++; default 6)
//   worker → main:  { ok: true, gsd: [...], mobility: [...] }
//                 | { ok: false, error }

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
  for (let i = 0; i < n; i++) {
    out.push(pick(v.get(i)));
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const maxL = (ev.data && ev.data.maxL) || 6;
  try {
    const mod = await getModule();
    const gsd = vecToArray(mod.runFractonGsd(maxL >>> 0), (r) => ({
      L: r.L,
      xcubeK: r.xcubeK,
      toric3dK: r.toric3dK,
      physicalQubits: r.physicalQubits,
    }));
    const mobility = vecToArray(mod.runFractonMobility(6, 5), (r) => ({
      len: r.len,
      toricWeight: r.toricWeight,
      xcubeWeight: r.xcubeWeight,
    }));
    self.postMessage({ ok: true, gsd, mobility });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
