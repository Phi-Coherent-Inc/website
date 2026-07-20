// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Web Worker for φSign (phi_crypt.wasm): runs SignSession construction and
// .sign() off the UI thread. Both are genuinely slow in this single-threaded
// WASM build — the hypertree's WOTS/FORS one-time-key fan-out has no
// parallelism here (GitHub Pages can't serve the COOP/COEP headers
// SharedArrayBuffer threading needs) — measured ~20s keygen, ~60s sign. See
// phi-crypt-cpp/web/README.md. verify() is fast (~0.3s) and runs on the main
// thread instead (see phi-crypt.js), so only the two slow ops live here.
//
// The worker holds ONE SignSession for its lifetime: keygen once, then any
// number of sign() calls advance the same one-time counter. A page reload
// (or calling PhiSign.newIdentity() again) tears down the worker and starts
// fresh — never reuses a counter across sessions.
//
// Protocol:
//   main → worker:  { cmd: 'keygen', q }
//   main → worker:  { cmd: 'sign', msg: Uint8Array }
//   worker → main:  { ok: true, cmd, ...result }  |  { ok: false, cmd, error }

let modulePromise = null;
let session = null;

async function getModule() {
  if (!modulePromise) {
    modulePromise = import('../wasm/phi_crypt.js').then((m) => m.default());
  }
  return modulePromise;
}

self.onmessage = async (ev) => {
  const { cmd } = ev.data || {};
  try {
    const M = await getModule();
    if (cmd === 'keygen') {
      if (session) session.delete();
      session = new M.SignSession(ev.data.q >>> 0);
      self.postMessage({ ok: true, cmd, pk: session.publicKey(), sigCount: session.sigCount() });
    } else if (cmd === 'sign') {
      if (!session) throw new Error('no φSign identity — call keygen first');
      const sig = session.sign(new Uint8Array(ev.data.msg));
      self.postMessage({ ok: true, cmd, sig, sigCount: session.sigCount() });
    } else {
      throw new Error('unknown command: ' + cmd);
    }
  } catch (err) {
    self.postMessage({ ok: false, cmd, error: String((err && err.message) || err) });
  }
};
