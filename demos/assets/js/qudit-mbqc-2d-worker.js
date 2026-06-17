// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the 2D Qudit MBQC demo. Computes, off the UI thread via WASM:
//   (1) the entangling power of the two-qudit target circuit (entropy of
//       U|0,0⟩) vs depth, WITH vertical CZ_d links vs WITHOUT — nonzero with
//       links, identically zero without (the cluster factorizes). The link is
//       load-bearing; this is the anti-wash, for d ∈ {2,3,5};
//   (2) the one-way computation across many Born branches for the selected d:
//       each branch has a different measurement record → a different local
//       generalized-Pauli feed-forward correction, yet the corrected output
//       matches the target with fidelity 1 (randomness in, determinism out).
// Module worker:
//     new Worker('assets/js/qudit-mbqc-2d-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { d, maxDepth, branches }   (d ∈ {2,3,5})
//   worker → main:  { ok: true, entangling: [...], branches: [...], d, lnD }
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
  const maxDepth = (ev.data && ev.data.maxDepth) || 4;
  const branches = (ev.data && ev.data.branches) || 120;
  try {
    const mod = await getModule();
    const entangling = vecToArray(mod.runQudit2dEntangling(maxDepth >>> 0), (r) => ({
      depth: r.depth,
      linkD2: r.linkD2, noLinkD2: r.noLinkD2,
      linkD3: r.linkD3, noLinkD3: r.noLinkD3,
      linkD5: r.linkD5, noLinkD5: r.noLinkD5,
    }));
    const branchRows = vecToArray(mod.runQudit2dBranches(d >>> 0, branches >>> 0), (r) => ({
      branch: r.branch, fidelity: r.fidelity, correction: r.correction,
    }));
    self.postMessage({ ok: true, entangling, branches: branchRows, d, lnD: Math.log(d) });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
