// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-quantum WASM module (compiled from
// phi-quantum-sim-cpp). Lazy-loads the Emscripten ES6 glue, then exposes three
// namespaces — PhiCoherent, PhiRecovery, PhiVQE — whose method names match the
// demos' original shim functions, so wiring a demo to real computation is a
// near drop-in swap.
//
// Usage (in a demo's `<script type="module">`):
//     import { ready, PhiVQE } from './assets/js/phi-quantum.js';
//     await ready();                 // resolves once the WASM module is live
//     const e = PhiVQE.h2Energy(0.3, 0.4);
//
// The heavy Error-Correction sweep (PhiCoherent.runFibSurfaceSweep) is also
// available here, but the demo runs it in a Web Worker (assets/js/ec-worker.js)
// so the real surface-code Monte Carlo never blocks the UI thread.

let _module = null;
let _modulePromise = null;

async function loadModule() {
  const { default: createPhiQuantum } = await import('../wasm/phi_quantum.js');
  return createPhiQuantum();
}

// Resolve (once) the WASM module; returns the namespace API.
export function ready() {
  if (!_modulePromise) {
    _modulePromise = loadModule().then((m) => { _module = m; return api; });
  }
  return _modulePromise;
}

export function isReady() { return _module !== null; }

// Marshal an Embind register_vector handle into a plain JS array, freeing the
// handle afterwards. Elements that are value_objects are already plain objects.
function vecToArray(v) {
  const out = [];
  const n = v.size();
  for (let i = 0; i < n; i++) out.push(v.get(i));
  if (typeof v.delete === 'function') v.delete();
  return out;
}

// ── Error Correction ─────────────────────────────────────────────────────────
export const PhiCoherent = {
  // Real surface-code Monte Carlo (Fibonacci-concatenated vs single surface code).
  // Returns [{ k, fibQubits, physical, fibPL, fibLow, fibHigh, singleD,
  //            singleQubits, singlePL, singleLow, singleHigh, gap, winner }].
  // HEAVY — prefer running via ec-worker.js. `trajectories` tunes accuracy.
  runFibSurfaceSweep(trajectories = 600) {
    return vecToArray(_module.runFibSurfaceSweep(trajectories >>> 0));
  },
};

// ── Time Reversal ─────────────────────────────────────────────────────────────
export const PhiRecovery = {
  // Fidelity of an Rx(θ) error against the original state (θ in degrees).
  computeFidelity(angleDeg) { return _module.computeFidelity(angleDeg); },
  // Fidelity after exact time-reversal (circuit_adjoint) — the ≈1.000 headline.
  applyRecoveryFidelity(angleDeg) { return _module.applyRecoveryFidelity(angleDeg); },
  // Total PTM contraction 2p(k-1); order clamped to the theorem's {1,2,3} domain.
  contractionFactor(angleDeg, order) { return _module.contractionFactor(angleDeg, order >>> 0); },
  // PTM diagonal eigenvalue λ_α for the order-k φ-weighted Pauli channel.
  ptmEigenvalue(p, order, alpha) { return _module.ptmEigenvalue(p, order >>> 0, alpha >>> 0); },
  // Dense error-angle sweep → [{ angle, fidNoRecovery, fidAdjoint, lx, ly, lz, contraction }].
  runTrSweep(pChannel = 0.1, nQubits = 2) {
    return vecToArray(_module.runTrSweep(pChannel, nQubits >>> 0));
  },
};

// ── VQE ───────────────────────────────────────────────────────────────────────
export const PhiVQE = {
  // ⟨ψ(θ,φ)|H|ψ(θ,φ)⟩ for the 2-angle ansatz. molecule ∈ {"H2","LiH"}.
  h2Energy(theta, phi) { return _module.h2Energy(theta, phi); },
  lihEnergy(theta, phi) { return _module.lihEnergy(theta, phi); },
  // Batched NxN landscape (row-major) over θ∈[0,thetaMax], φ∈[0,phiMax].
  energyLandscape(molecule, n, thetaMax, phiMax) {
    return vecToArray(_module.energyLandscape(molecule, n >>> 0, thetaMax, phiMax));
  },
  // Real QuantumExplorer optimization trace.
  // Returns { trace:[{iteration,energy}], finalEnergy, exactEnergy, errorMHa, bestParams:[] }.
  runOptimization(molecule, iterations) {
    const r = _module.runOptimization(molecule, iterations >>> 0);
    return {
      trace: vecToArray(r.trace).map((p) => ({ iteration: p.iteration, energy: p.energy })),
      finalEnergy: r.finalEnergy,
      exactEnergy: r.exactEnergy,
      errorMHa: r.errorMHa,
      bestParams: vecToArray(r.bestParams),
    };
  },
  // Exact (FCI) ground-state energy of the molecule's Hamiltonian.
  exactEnergy(molecule) { return _module.exactEnergy(molecule); },
};

// ── Tunneling ───────────────────────────────────────────────────────────────
// φ-native quantum tunneling: the Fibonacci-superlattice Cantor band structure
// via the O(log N) Kohmoto trace map. The allowedFraction is a grid-sampled
// band-MEMBERSHIP estimate (not the exact Cantor/Lebesgue measure).
export const PhiTunnel = {
  // Per-generation Cantor metrics (the headline staircase / O(log N) reach).
  // Returns [{ gen, cells, allowedFraction, bandCount }] for gen = 2..maxGen.
  cantorStaircase(epsA = 0.5, epsB = -0.5, maxGen = 18, nEnergies = 1200) {
    return vecToArray(_module.runCantorStaircase(epsA, epsB, maxGen >>> 0, nEnergies >>> 0));
  },
  // Per-energy spectrum/transmission at a fixed generation, E ∈ [-2.5, 2.5].
  // Returns [{ energy, transmission, halfTrace, allowed }].
  superlatticeSpectrum(gen, epsA = 0.5, epsB = -0.5, nEnergies = 600) {
    return vecToArray(_module.runSuperlatticeSpectrum(gen >>> 0, epsA, epsB, nEnergies >>> 0));
  },
  // Kohmoto invariant of the on-site Fibonacci model (closed form ((εA−εB)/2)²).
  kohmotoInvariant(epsA = 0.5, epsB = -0.5) { return _module.kohmotoInvariant(epsA, epsB); },
  // e-register dynamics: dissipative tunneling ⟨Z⟩(t) under a dephasing bath.
  // γφ=0 → coherent oscillation (reversible, recurs); γφ>0 → irreversible damping
  // (localization). Returns [{ t, imbalance, entropy }].
  dissipativeTunnel(delta = 1.0, gammaPhi = 0.0, dt = 0.05, steps = 400) {
    return vecToArray(_module.runDissipativeTunnel(delta, gammaPhi, dt, steps >>> 0));
  },
};

// ── Quantum Cryptography ──────────────────────────────────────────────────────
// φCrypt under quantum attack — NIST PQC audit, BB84 QKD, and QRNG quality —
// computed live from phi-quantum-crypt-cpp (+ the sim Grover oracle) via WASM.
export const PhiCrypto = {
  // Per-chandas security audit. Returns [{ chandas, outputBytes, postGroverBits,
  // nist, physicalQubits, runtime, cat5 }] for chandas 0/1/2. The physicalQubits
  // and runtime are the derived Grover-attack cost (chandas 2 ≈ 1.05M qubits /
  // ~10^85 years), pinned against crypt-cpp's kChandasTable.
  securityAudit() {
    return vecToArray(_module.quantumSecurityAudit());
  },
  // One BB84 QKD session over a noiseless simulated channel; evePresent toggles an
  // intercept-resend eavesdropper. Returns { qber, sessionValid, eveDetected,
  // siftedBits, keyHex }. keyHex is the 47-byte derived key, or "" if aborted.
  bb84(evePresent = false, numRawBits = 512, seed = 1) {
    return _module.runBB84Demo(!!evePresent, numRawBits >>> 0, seed >>> 0);
  },
  // QRNG output quality on nBytes from the 4-stage Bell-pair pipeline. Returns
  // { bitBalance, chiSquared, passesMonobit, passesChi2 }.
  qrngStats(nBytes = 2560, seed = 1) {
    return _module.runQrngStatTest(nBytes >>> 0, seed >>> 0);
  },
};

// ── Topological QEC (Fibonacci-anyon node-win) ────────────────────────────────
// d_τ = φ ⇒ universal by braiding alone, distillation-free — the one genuinely
// load-bearing golden-ratio fact in QEC. HONEST SCOPE: node-win only; NO claim
// that Fibonacci-anyon QEC beats the surface code on threshold/overhead. The
// threshold is a small-instance code-capacity surrogate; anyons are simulated.
export const PhiTopo = {
  // The d=φ vs d=√2 node-axis comparison. Returns { fibUniversal, fibDistillFree,
  // fibTotalD, isingUniversal, isingDistillFree, isingTotalD, isingDistillInputs,
  // fibWinsNodeAxis, isingWinsSystemAxis }.
  nodeWinSummary() { return _module.nodeWinSummary(); },
  // (σ₁σ₂)^n applied to |0⟩ on the 3-strand fusion space; one row per generator.
  // Returns [{ generator, amp0Re, amp0Im, amp1Re, amp1Im, prob1 }].
  braidTrace(nPairs = 6) {
    return vecToArray(_module.braidTrace(nPairs >>> 0));
  },
  // Live code-capacity threshold curve (surrogate). d ∈ {3,5,7}, p ∈ 0.05..0.60;
  // curves cross near p ≈ 0.5. Returns [{ distance, physical, pL, low, high }].
  // HEAVY — prefer the Web Worker (anyon-worker.js). `trajectories` tunes accuracy.
  runFibAnyonThreshold(trajectories = 3000) {
    return vecToArray(_module.runFibAnyonThreshold(trajectories >>> 0));
  },
  // Anyonic interferometric read-out. Returns { vacuumVisibility, tauVisibility,
  // suppressionRatio (== 1/φ²), contrast (== 1/φ), phiInv2, phiInv }.
  interferometryReadout() {
    return _module.interferometryReadout();
  },
  // Braid fidelity decay vs length under a superconducting noise model (Track B).
  // n = 1..maxN at fixed per-gate error pPhys. gatesPerExchange models the real
  // string-net cost of one anyon braid (tens of physical gates, not one): at the
  // idealized 1 the curve is flatteringly shallow; at ~20 it collapses toward the
  // maximally-mixed floor 0.5. Returns [{ n, gates, pPhys, fidelity }].
  braidFidelitySweep(maxN = 12, pPhys = 0.001, gatesPerExchange = 1) {
    return vecToArray(
      _module.runBraidFidelitySweep(maxN >>> 0, pPhys, gatesPerExchange >>> 0));
  },
  // Per-logical-gate feasibility budget at 15 mK (the "does it fit in the car"
  // layer). Honest negative result: the budget does NOT close. Returns
  // { perGateBudget, thermal, poisoning, leakage, readout, total, requiredRatio,
  //   closingGapK15mK, closingGapK1mK, candidateGapK }.
  feasibilityBudget() {
    return _module.feasibilityBudget();
  },
};

const api = { ready, isReady, PhiCoherent, PhiRecovery, PhiVQE, PhiTunnel, PhiCrypto, PhiTopo };
export default api;
