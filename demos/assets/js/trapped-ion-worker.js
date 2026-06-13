// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for the Trapped-Ion QEC Companion demo. Runs the exact,
// code-capacity comparison off the UI thread: an abelian code (Z2 toric =
// surface-equivalent) vs our non-abelian Fibonacci string-net (d=φ) on
// identical machinery — scenarios::trapped_ion_qec_sweep — plus the device-level
// resource trade (scenarios::ion_device_info) for a real trapped-ion processor.
// Module worker:  new Worker('assets/js/trapped-ion-worker.js', { type: 'module' })
//
// Protocol:
//   main → worker:  { trajectories, device }     // device: "quantinuum_h2" | "ionq_forte"
//   worker → main:  { ok: true, points: [...], info: {...} }  |  { ok: false, error }

let modulePromise = null;

async function getModule() {
  if (!modulePromise) {
    modulePromise = import('../wasm/phi_quantum.js').then((m) => m.default());
  }
  return modulePromise;
}

function pointsToArray(v) {
  const out = [];
  const n = v.size();
  for (let i = 0; i < n; i++) {
    const r = v.get(i);
    out.push({
      physical: r.physical,
      fibPL: r.fibPL,
      z2PL: r.z2PL,
      surfacePL: r.surfacePL,
      fibCompetitive: r.fibCompetitive,
    });
  }
  if (typeof v.delete === 'function') v.delete();
  return out;
}

self.onmessage = async (ev) => {
  const trajectories = (ev.data && ev.data.trajectories) || 1200;
  const device = (ev.data && ev.data.device) || 'quantinuum_h2';
  try {
    const mod = await getModule();
    const points = pointsToArray(mod.runTrappedIonQECSweep(trajectories >>> 0));
    const di = mod.ionDeviceInfo(device);  // value_object → plain fields
    const info = {
      device,
      t2us: di.t2us,
      gateError2q: di.gateError2q,
      pEff: di.pEff,
      logicalDim: di.logicalDim,
      physicalEdges: di.physicalEdges,
      abelianDistillInputs: di.abelianDistillInputs,
      fibonacciDistillInputs: di.fibonacciDistillInputs,
    };
    self.postMessage({ ok: true, points, info });
  } catch (err) {
    self.postMessage({ ok: false, error: String((err && err.message) || err) });
  }
};
