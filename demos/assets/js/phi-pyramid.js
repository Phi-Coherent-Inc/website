// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi-pyramid WASM module (compiled from
// phi-pyramid-cpp/web → phi_pyramid.{js,wasm}). Lazy-loads the Emscripten ES6
// glue via the shared phi-wasm-runtime.js and exposes the PhiPyramid namespace
// — the φ-pyramid energy-device demo's drivers, all backed by the VERIFIED
// phi-pyramid-cpp transient simulator (one source of truth, no JS physics).
//
// Usage (in pyramid-energy.html's `<script type="module">`):
//     import { ready, PhiPyramid } from './assets/js/phi-pyramid.js';
//     await ready();                          // resolves once the WASM is live
//     const dev = PhiPyramid.createDemo();    // an Embind PyramidDemo

import { createWasmRuntime, vecToArray, currentVersion } from './phi-wasm-runtime.js';

// Lazy-loaded WASM module (set on first ready()). The lifecycle, cache-busting,
// and vecToArray marshalling live in the shared runtime (from phi-wasm-cpp).
let _module = null;
const _rt = createWasmRuntime('../wasm/phi_pyramid.js', currentVersion(import.meta.url));

// Resolve (once) the WASM module; returns the namespace API.
export function ready() {
  return _rt.ready().then((m) => { _module = m; return api; });
}

export function isReady() { return _rt.isReady(); }

// ── φPyramid Energy Device (transient startup + feedback loop) ────────────────
// The CORRECTED atmospheric-energy device: the DC atmospheric circuit drives a
// 50 Hz mercury slosh (obelisk parametric feedback ramps it, the e^{rt} growth);
// the slosh→MHD makes 50 Hz AC, which wirelessly drives a synchronous motor.
// A stateful driver wrapping the VERIFIED phi-pyramid-cpp transient simulator:
// one source of truth, no JS physics (so the demo can't drift from the C++).
export const PhiPyramid = {
  // Create a stateful device-demo driver (an Embind PyramidDemo). Methods:
  //   configure(fieldScale, obeliskKV, mode) → frame   (re-seed the device)
  //   reset() → frame                                   (cold start, same config)
  //   step(dtSeconds) → frame                           (advance the transient)
  // A frame = { t, sloshV, envelope, emf, acPower, motorRpm,
  //             stageDc, stageSeed, stageParametric, stageSaturate, stageAc,
  //             stageMotor, vSs, nSync, fHz, pumpReservoirW, seedReservoirW,
  //             selfSustaining }. Call .delete() on the driver when done.
  createDemo() { return new _module.PyramidDemo(); },
  // The Schumann chamber ladder: every void → its tuned harmonic (n=3, n=7 predicted).
  // Returns [{ n, freqHz, lengthM, predicted, host }] for n=2..8.
  chamberLadder() { return vecToArray(_module.chamberLadder()); },
  // The OBELISK-PAIR system (a self-contained coupled system, NOT the pyramid device).
  //   configure(separationM, apexHarvestUA, sunriseH, daylightH) → frame
  //   reset() → frame ; step(dtHours) → frame  (march the dawn → spin-up day)
  // A frame = { tHour, sun, currentUA, dumpHz, firing, bellHz, carrierMHz, floatMs,
  //             leakFloorUA, selfStarts, separationM, peakDumpHz, firstFireHour }.
  createObeliskPair() { return new _module.ObeliskPairDemo(); },
  // Coffer MHD core. configure(B_tesla) -> CofferMHDFrame (slosh + fill fixed at the
  // Giza self-started point: 2.5 mm/s, fill tuned to the 50 Hz bell). Frame:
  // { bTesla, sloshVelMms, sloshAmpUm, fillFrac, bellHzCheck, fHz, vPeak, emfPeak,
  //   hartmann, lorentzCoeff, internalROhm, powerDensity, hgMassKg, hgDepthM,
  //   cofferL, cofferW, cofferDepth }.
  createCofferMHD() { return new _module.CofferMHD(); },
};

const api = { ready, isReady, PhiPyramid };
export default api;
