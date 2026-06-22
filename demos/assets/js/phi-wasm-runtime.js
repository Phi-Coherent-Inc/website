// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// phi-wasm-runtime.js — the shared lifecycle layer every phicoherent.com demo
// wrapper builds on. It lazy-loads an Emscripten ES6 module (once), exposes
// ready()/isReady(), carries cache-busting ?v= tokens onto the .js + .wasm, and
// marshals Embind register_vector handles into plain JS arrays.
//
// A per-package wrapper (e.g. phi-quantum.js, phi-pyramid.js) does:
//
//     import { createWasmRuntime, vecToArray, currentVersion }
//         from './phi-wasm-runtime.js';
//     const rt = createWasmRuntime('../wasm/phi_quantum.js',
//                                  currentVersion(import.meta.url));
//     let _module = null;
//     export function ready()   { return rt.ready().then((m) => { _module = m; return api; }); }
//     export function isReady() { return rt.isReady(); }
//     // ... namespaces using _module and vecToArray ...
//
// The wasmJsPath is resolved relative to THIS module's URL, so all demo
// wrappers and this runtime live together in demos/assets/js/ while the WASM
// artifacts live in demos/assets/wasm/.

// Read the ?v=TOKEN a wrapper was imported with (from its import.meta.url), so a
// new deploy never serves a stale binary. No token ⇒ '' (unchanged behavior).
export function currentVersion(metaUrl) {
  try { return new URL(metaUrl).search || ''; } catch (e) { return ''; }
}

// Marshal an Embind register_vector handle into a plain JS array, freeing the
// handle afterwards. Elements that are value_objects are already plain objects.
export function vecToArray(v) {
  const out = [];
  const n = v.size();
  for (let i = 0; i < n; i++) out.push(v.get(i));
  if (typeof v.delete === 'function') v.delete();
  return out;
}

// Create a one-shot loader for an Emscripten ES6 module. `wasmJsPath` is the
// glue path relative to this runtime module; `ver` (optional) is appended to
// the glue + .wasm URLs for cache-busting.
export function createWasmRuntime(wasmJsPath, ver = '') {
  let _module = null;
  let _modulePromise = null;

  async function loadModule() {
    const { default: createModule } = await import(wasmJsPath + ver);
    return createModule(ver ? { locateFile: (path, prefix) => prefix + path + ver } : undefined);
  }

  return {
    // Resolve (once) the WASM module; subsequent calls return the same promise.
    ready() {
      if (!_modulePromise) {
        _modulePromise = loadModule().then((m) => { _module = m; return m; });
      }
      return _modulePromise;
    },
    isReady() { return _module !== null; },
    getModule() { return _module; },
  };
}
