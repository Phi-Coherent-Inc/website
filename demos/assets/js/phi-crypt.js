// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Thin wrapper around the phi_crypt WASM module (compiled from
// phi-crypt-cpp/web, phi-crypt-cpp + phi-lattice-cpp). Exposes φHash,
// φCipher AEAD, φ-ROMix (passphrase KDF), φSign, φKEM, and φDSA as small
// JS-friendly namespaces.
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
  // NIST-KAT-validated FIPS-202 reference (32-byte digest) — the avalanche
  // widget's yardstick, not a suite primitive.
  sha3_256(text) { return _module.sha3_256(enc(text)); },
};

// ── φCipher (AEAD) ───────────────────────────────────────────────────────
// Takes a KEY directly, matching phi::cipher::aead_encrypt/decrypt's actual
// signature — this primitive has no notion of a "password". Deriving a key
// from a human passphrase is PhiKdf's job (below), never a bare hash: see
// PhiKdf's own doc comment for why.
export const PhiCipher = {
  encrypt(text, key, q = 0) { return _module.cipherAeadEncrypt(enc(text), key, q | 0); },
  // Throws on tamper / wrong key (AEAD auth failure).
  decrypt(ciphertext, key, q = 0) { return dec(_module.cipherAeadDecrypt(ciphertext, key, q | 0)); },
};

// ── φ-ROMix v2 — memory-hard passphrase KDF (NOT a bare hash) ───────────
// A single fast hash over a human-chosen passphrase is GPU/ASIC-parallelizable
// regardless of how good the hash is. φ-ROMix v2 (phi::kdf::derive_key) is a
// scrypt-style construction: fill + randomly-traverse a large buffer (forcing
// memory cost per guess), then one φHash call to extract. See
// phi_crypt/kdf/phi_kdf.hpp's own honest-scope note: "φHash has no published
// security reduction. Do NOT claim Argon2-equivalent assurance."
export const PhiKdf = {
  // nIndex/roundsIndex trade time for memory cost — defaults measured at
  // ~46ms in this single-threaded WASM build (see web/README.md).
  deriveKey(password, salt, q = 0, nIndex = 26, roundsIndex = 26) {
    return _module.kdfDeriveKey(enc(password), salt, nIndex | 0, roundsIndex | 0, q | 0);
  },
};

// Demo-side CSPRNG (e.g. a per-session salt) — not a φCrypt primitive itself.
export function randomBytes(n) { return _module.randomBytes(n | 0); }

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

const api = { ready, isReady, expiresOn, toHex, randomBytes, PhiHash, PhiCipher, PhiKdf, PhiSign, PhiKem, PhiDsa, licenseInfo };
export default api;
