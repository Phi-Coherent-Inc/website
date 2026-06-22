// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Qudit MBQC demo. Computes, off the UI thread via WASM,
// the two halves of measurement-based computation generalized to d-level
// systems (qudits), for d ∈ {2,3,5}:
//   (1) the 2D qudit cluster RESOURCE state: left/right-half cut entropy of a
//       2×M grid is 2·ln d regardless of M: an AREA LAW, quantized in ln d
//       (entanglement = number of crossing edges × ln d, "the loom");
//   (2) one-way COMPUTATION on it: the fidelity of a measured J_d-chain output
//       vs the directly applied chain unitary, across chain depth (exact ≈ 1);
//   (3) headline scalars for the selected d: stabilizer defect (state is
//       fixed), cut-match error, and the entangling-gadget anti-wash
//       (link entropy ≈ ln d vs no-link entropy 0).
// Module worker:
//     new Worker('assets/js/qudit-mbqc-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { d, maxM, maxDepth }   (d ∈ {2,3,5}; maxM 2..4; maxDepth 1..6)
//   worker → main:  { ok: true, area: [...], fidelity: [...], stats: {...} }
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
  for (let i = 0; i < n; i++) out.push(pick(v.get(i)));
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const d = (ev.data && ev.data.d) || 3;
  const maxM = (ev.data && ev.data.maxM) || 4;
  const maxDepth = (ev.data && ev.data.maxDepth) || 6;
  try {
    const mod = await getModule();
    const area = vecToArray(mod.runQuditAreaLaw(maxM >>> 0), (r) => ({
      M: r.M, rank: r.rank, entD2: r.entD2, entD3: r.entD3, entD5: r.entD5,
    }));
    const fidelity = vecToArray(mod.runQuditChainFidelity(maxDepth >>> 0), (r) => ({
      depth: r.depth, fidD2: r.fidD2, fidD3: r.fidD3, fidD5: r.fidD5,
    }));
    const s = mod.runQuditClusterStats(d >>> 0);
    const stats = {
      d,
      defect: s.defect,
      cutMatchError: s.cutMatchError,
      linkEntropy: s.linkEntropy,
      noLinkEntropy: s.noLinkEntropy,
      lnD: s.lnD,
    };
    self.postMessage({ ok: true, area, fidelity, stats });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
