// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-quantum WASM module (compiled from
// phi-quantum-sim-cpp). Lazy-loads the Emscripten ES6 glue, then exposes three
// namespaces (PhiCoherent, PhiRecovery, PhiVQE) whose method names match the
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

import { createWasmRuntime, vecToArray, currentVersion } from './phi-wasm-runtime.js';

// Lazy-loaded WASM module (set on first ready()). The namespace methods below
// reference it directly; the load lifecycle, cache-busting, and vecToArray
// marshalling live in the shared phi-wasm-runtime.js (from phi-wasm-cpp).
let _module = null;
const _rt = createWasmRuntime('../wasm/phi_quantum.js', currentVersion(import.meta.url));

// Resolve (once) the WASM module; returns the namespace API.
export function ready() {
  return _rt.ready().then((m) => { _module = m; return api; });
}

export function isReady() { return _rt.isReady(); }

// ── Error Correction ─────────────────────────────────────────────────────────
export const PhiCoherent = {
  // Real surface-code Monte Carlo (Fibonacci-concatenated vs single surface code).
  // Returns [{ k, fibQubits, physical, fibPL, fibLow, fibHigh, singleD,
  //            singleQubits, singlePL, singleLow, singleHigh, gap, winner }].
  // HEAVY: prefer running via ec-worker.js. `trajectories` tunes accuracy.
  runFibSurfaceSweep(trajectories = 600) {
    return vecToArray(_module.runFibSurfaceSweep(trajectories >>> 0));
  },
};

// ── Time Reversal ─────────────────────────────────────────────────────────────
export const PhiRecovery = {
  // Fidelity of an Rx(θ) error against the original state (θ in degrees).
  computeFidelity(angleDeg) { return _module.computeFidelity(angleDeg); },
  // Fidelity after exact time-reversal (circuit_adjoint): the ≈1.000 headline.
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
  // Head-to-head exploit-step comparison on the SAME schedule and eval budget:
  // random-momentum vs Kiefer-optimal golden-section line search. Returns
  // { momentum:[best-so-far], golden:[best-so-far], exact, momentumErrMHa, goldenErrMHa }.
  exploitCompare(molecule, iterations) {
    const r = _module.runVqeExploitCompare(molecule, iterations >>> 0);
    return {
      momentum: vecToArray(r.momentum),
      golden: vecToArray(r.golden),
      exact: r.exact,
      momentumErrMHa: r.momentumErrMHa,
      goldenErrMHa: r.goldenErrMHa,
    };
  },
  // Reliability over N random restarts at a fixed eval budget: fraction reaching
  // chemical accuracy (1.6 mHa) with each exploit strategy. Returns
  // { goldenSuccess, momentumSuccess, goldenMedianMHa, momentumMedianMHa, nSeeds }.
  reliability(molecule, iterations, nSeeds) {
    return _module.runVqeReliability(molecule, iterations >>> 0, nSeeds >>> 0);
  },
  // The E8 critical-Ising spectrum (Zamolodchikov): 8 masses (units of m₁) that
  // split into four exact golden pairs. Returns
  // { masses:[8], pairs:[{a,b,ratio}], phi }.
  e8Spectrum() {
    const s = _module.e8GoldenSpectrum();
    const ratio = vecToArray(s.pairRatio), a = vecToArray(s.pairA), b = vecToArray(s.pairB);
    return {
      masses: vecToArray(s.masses),
      pairs: ratio.map((r, i) => ({ a: a[i], b: b[i], ratio: r })),
      phi: s.phi,
    };
  },
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
  // Real-world photonic Fibonacci mirror: transmission spectrum T(λ) of a
  // quarter-wave dielectric multilayer stacked in the Fibonacci word (same
  // Kohmoto trace map, now classical optics). Returns
  // [{ wavelength, transmission, halfTrace, allowed }] over [lmin,lmax] nm.
  photonicSpectrum(gen, nA = 2.30, nB = 1.45, lambda0 = 600,
                   lmin = 400, lmax = 1200, nLambda = 600) {
    return vecToArray(_module.runPhotonicSpectrum(
      gen >>> 0, nA, nB, lambda0, lmin, lmax, nLambda >>> 0));
  },
  // e-register dynamics: dissipative tunneling ⟨Z⟩(t) under a dephasing bath.
  // γφ=0 → coherent oscillation (reversible, recurs); γφ>0 → irreversible damping
  // (localization). Returns [{ t, imbalance, entropy }].
  dissipativeTunnel(delta = 1.0, gammaPhi = 0.0, dt = 0.05, steps = 400) {
    return vecToArray(_module.runDissipativeTunnel(delta, gammaPhi, dt, steps >>> 0));
  },
};

// ── Quantum Cryptography ──────────────────────────────────────────────────────
// φCrypt under quantum attack (NIST PQC audit, BB84 QKD, and QRNG quality),
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
  // Live structural cryptanalysis of φHash: Simon's hidden-XOR-period circuit and
  // QFT period-finding on a small truncation, each with a positive control that
  // recovers a planted period. Returns { n, m, simonHashPeriod, simonRank,
  // simonControlOk, simonPlanted, simonRecovered, periodHashFound, periodControlOk,
  // periodPlanted, periodRecovered, serialCorrelation, uncorrelated }.
  structuralAudit(chandas = 2) {
    return _module.runHashStructuralAudit(chandas | 0);
  },
  // One live roundtrip of the suite's ACTUAL post-quantum primitives, from
  // phi-lattice-cpp: φ-KEM-304 (FO-CCA module-LWE) keygen→encaps→decaps and
  // φDSA (ML-DSA-87) keygen→sign→verify, both SHAKE-driven. Returns
  // { kemName, kemAgree, kemRejectTamper, kemPkBytes, kemCtBytes, kemSsBytes,
  //   kemSecretHex, kemKeygenMs, kemEncapsMs, kemDecapsMs,
  //   dsaName, dsaVerify, dsaRejectForgery, dsaPkBytes, dsaSigBytes,
  //   dsaKeygenMs, dsaSignMs, dsaVerifyMs }.
  latticeRoundtrip(seed = 1) {
    return _module.runLatticePqcRoundtrip(seed >>> 0);
  },
};

// ── Topological QEC (Fibonacci-anyon node-win) ────────────────────────────────
// d_τ = φ ⇒ universal by braiding alone, distillation-free: the one genuinely
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
  // HEAVY: prefer the Web Worker (anyon-worker.js). `trajectories` tunes accuracy.
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

// ── First-class SU(d) Qudit Register (the dimension-flexible substrate) ───────
// A d-level qudit register (10-state and 12-state modes) driven by
// the real phi-quantum-types qudit engine. `ops` is a ';'-separated op-script:
//   X (shift X_d) · Z (clock Z_d) · F / Fi (Fourier / inverse) · P:θ0,…,θ{d-1}.
export const PhiQudit = {
  // The register mode for dimension d. Returns { dimension }.
  modeInfo(d = 10) {
    const m = _module.runQuditModeInfo(d >>> 0);
    // surface only the dimension; internal physical fields are intentionally withheld
    return { dimension: m.dimension };
  },
  // Level amplitudes after the op-script on basis state |start>. Returns
  // [{ level, re, im, prob }].
  amplitudes(d = 10, start = 0, ops = '') {
    return vecToArray(_module.runQuditAmplitudes(d >>> 0, start >>> 0, String(ops)))
      .map((a) => ({ level: a.level, re: a.re, im: a.im, prob: a.prob }));
  },
  // Born-rule measurement histogram. Returns [{ level, count }] over `shots`.
  measure(d = 10, start = 0, ops = '', shots = 1000, seed = 1) {
    return vecToArray(_module.runQuditMeasure(d >>> 0, start >>> 0, String(ops),
                                              shots >>> 0, seed >>> 0));
  },
  // Generalized Bell pair |Φ_d> = SUM_d (F_d ⊗ I)|0,0> joint distribution.
  // Returns [{ a, b, prob }] over the d×d outcomes (mass on the diagonal a==b).
  bellJoint(d = 10) { return vecToArray(_module.runQuditBellJoint(d >>> 0)); },
  // The pair's measured entanglement: { entropy, lnD, purity }  (entropy → ln d).
  bellStats(d = 10) { return _module.runQuditBellStats(d >>> 0); },
};

// ── Eigenvalue Atlas (the unifying lens) ─────────────────────────────────────
export const PhiAtlas = {
  // Four physics objects classified by one law (phi::classify_eigenvalue): each
  // eigenvalue's position on the unit circle names its identity gate. Returns
  // [{ system, systemName, param, re, im, modulus, gate, gateName, gateConstant,
  //    firstClassPole }]. Systems: 0 fusion · 1 tunnel · 2 decoherence · 3 braid.
  // Gates: 0 ENTROPY(e) · 1 ORDER(phi) · 2 IRREGULARITY(delta) · 3 PHASE(pi) · 4 FLOOR(gamma).
  run(tunnelGen = 8, epsA = 0.5, epsB = -0.5, nEnergies = 480, p = 0.1, order = 2) {
    return vecToArray(_module.runEigenvalueAtlas(
      tunnelGen >>> 0, epsA, epsB, nEnergies >>> 0, p, order >>> 0));
  },
};

// The φPyramid energy-device demo now lives in its own module (phi_pyramid.wasm,
// built from phi-pyramid-cpp/web) and its own wrapper, ./phi-pyramid.js, which
// exposes the PhiPyramid namespace. pyramid-energy.html imports from there.

const api = { ready, isReady, PhiCoherent, PhiRecovery, PhiVQE, PhiTunnel, PhiCrypto, PhiTopo, PhiQudit, PhiAtlas };
export default api;
