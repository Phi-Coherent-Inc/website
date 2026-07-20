// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi_crypt WASM module (compiled from
// phi-crypt-cpp/web, phi-crypt-cpp + phi-lattice-cpp). Exposes φHash,
// φCipher AEAD, φSign, φKEM, and φDSA as small JS-friendly namespaces.
//
// Usage (in a demo's `<script type="module">`):
//     import { ready, PhiHash } from './assets/js/phi-crypt.js?v=...';
//     await ready();
//     const digest = PhiHash.hash('hello', 0);
//
// φSign's keygen/sign are genuinely slow in this single-threaded WASM build
// (~20s / ~60s — see phi-crypt-cpp/web/README.md) and run in a dedicated
// Worker (phi-sign-worker.js) so the page stays responsive; verify() is fast
// and runs on the main thread's own module instance.
//
// Two cheap, honest-about-their-limits deterrents on top of the demo-scoped
// WASM surface (see phi-crypt-cpp/web/bindings.cpp for the narrow API
// itself): an origin allowlist and a build expiry. Neither stops a
// determined reverse engineer — client-side checks never can — they exist
// so a stray copy of this page doesn't quietly keep working indefinitely
// off-site, and so the demo build has a natural redeploy cadence.

import { createWasmRuntime, currentVersion } from './phi-wasm-runtime.js';

const BUILD_DATE = '2026-07-20';
const EXPIRY_DAYS = 90;
const ALLOWED_HOSTS = new Set([
  'phicoherent.com', 'www.phicoherent.com',
  'phi.indinuity.ddnsfree.com',   // dev public host
  'localhost', '127.0.0.1', '',
]);

function expiryDate() {
  const d = new Date(BUILD_DATE + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + EXPIRY_DAYS);
  return d;
}

function checkGuards() {
  const host = (typeof location !== 'undefined' && location.hostname) || '';
  if (!ALLOWED_HOSTS.has(host)) {
    throw new Error('This demo build is scoped to phicoherent.com and will not run on "' + host + '".');
  }
  if (Date.now() > expiryDate().getTime()) {
    throw new Error('This demo build has expired (built ' + BUILD_DATE + ', ' + EXPIRY_DAYS +
      '-day window). Reload phicoherent.com for the current build.');
  }
}

let _module = null;
const _rt = createWasmRuntime('../wasm/phi_crypt.js', currentVersion(import.meta.url));

export function ready() {
  checkGuards();
  return _rt.ready().then((m) => { _module = m; return api; });
}

export function isReady() { return _rt.isReady(); }
export function expiresOn() { return expiryDate().toISOString().slice(0, 10); }

const enc = (s) => new TextEncoder().encode(s);
const dec = (b) => new TextDecoder().decode(b);
export function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ── φHash ─────────────────────────────────────────────────────────────────
export const PhiHash = {
  // chandas 0/1/2 -> 29/47/76-byte digest.
  hash(text, chandas = 0) { return _module.hash(enc(text), chandas | 0); },
};

// ── φCipher (AEAD) ───────────────────────────────────────────────────────
export const PhiCipher = {
  // password is run through φHash to derive an exact-length key (q selects
  // both the cipher's key width and φHash's tier).
  encrypt(text, password, q = 0) {
    const key = _module.hash(enc(password), q | 0);
    return _module.cipherAeadEncrypt(enc(text), key, q | 0);
  },
  // Throws on tamper / wrong password (AEAD auth failure).
  decrypt(ciphertext, password, q = 0) {
    const key = _module.hash(enc(password), q | 0);
    return dec(_module.cipherAeadDecrypt(ciphertext, key, q | 0));
  },
};

// ── φSign (hash-based, stateful) — Worker-backed keygen/sign ────────────
let _signWorker = null;
let _signPending = null;

function signWorker() {
  if (!_signWorker) _signWorker = new Worker('assets/js/phi-sign-worker.js', { type: 'module' });
  return _signWorker;
}

function signCall(msg) {
  if (_signPending) return Promise.reject(new Error('a φSign operation is already in flight'));
  const w = signWorker();
  _signPending = new Promise((resolve, reject) => {
    const onMessage = (ev) => {
      w.removeEventListener('message', onMessage);
      _signPending = null;
      ev.data.ok ? resolve(ev.data) : reject(new Error(ev.data.error));
    };
    w.addEventListener('message', onMessage);
    w.postMessage(msg);
  });
  return _signPending;
}

export const PhiSign = {
  // Generates a fresh hypertree identity in the Worker. ~20s single-threaded.
  async newIdentity(q = 2) {
    const r = await signCall({ cmd: 'keygen', q });
    return { publicKey: r.pk, sigCount: r.sigCount };
  },
  // Signs with the Worker's current identity, advancing its one-time
  // counter. ~60s single-threaded. Throws if newIdentity() hasn't run yet.
  async sign(text) {
    const r = await signCall({ cmd: 'sign', msg: enc(text) });
    return { signature: r.sig, sigCount: r.sigCount };
  },
  // Fast (~0.3s) — runs on the main thread's own module instance, no Worker.
  verify(text, signature, publicKey, q = 2) {
    return _module.SignSession.verify(enc(text), signature, publicKey, q | 0);
  },
  // Tear down the Worker (e.g. before generating a new identity from
  // scratch) — the old one-time counter is discarded, never reused.
  terminate() {
    if (_signWorker) { _signWorker.terminate(); _signWorker = null; _signPending = null; }
  },
};

// ── φKEM (Module-LWE, φ-KEM-304) + KEM-DEM public-key encryption ────────
export const PhiKem = {
  generateKeypair() {
    const h = new _module.KemKeypairHandle();
    return {
      publicKey: h.publicKey(),
      decaps: (ct) => h.decaps(ct),
      pkeDecrypt: (kemCt, dem) => dec(h.pkeDecrypt(kemCt, dem)),
      destroy: () => h.delete(),
    };
  },
  // Bare encapsulation to `publicKey` — the two-party shared-secret demo.
  encaps(publicKey) {
    const r = _module.KemKeypairHandle.encaps(publicKey);
    return { ct: r.ct, k: r.k };
  },
  // Public-key encryption: φKEM + φHash-derived DEM key + φCipher AEAD.
  pkeEncrypt(publicKey, text) {
    const r = _module.KemKeypairHandle.pkeEncrypt(publicKey, enc(text));
    return { kemCt: r.kemCt, dem: r.dem };
  },
};

// ── φDSA (Module-LWE/SIS, stateless) ─────────────────────────────────────
export const PhiDsa = {
  generateKeypair() {
    const h = new _module.DsaKeypairHandle();
    return {
      publicKey: h.publicKey(),
      sign: (text) => h.sign(enc(text)),
      destroy: () => h.delete(),
    };
  },
  verify(text, signature, publicKey) {
    return _module.DsaKeypairHandle.verify(enc(text), signature, publicKey);
  },
};

export function licenseInfo() { return _module.licenseInfo(); }

const api = { ready, isReady, expiresOn, toHex, PhiHash, PhiCipher, PhiSign, PhiKem, PhiDsa, licenseInfo };
export default api;
