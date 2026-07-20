// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Cleanup stub. This used to be a coi-serviceworker (COOP/COEP-injecting
// Service Worker) unlocking multi-threaded WASM for φSign. Reverted: the
// pthread build's own worker-pool bootstrap (Emscripten's
// `new Worker(new URL(import.meta.url), {type:"module"})` pattern) doesn't
// reliably get its script fetch intercepted by a controlling Service Worker
// in Chromium, so it fails with net::ERR_BLOCKED_BY_RESPONSE /
// "SharedArrayBuffer is not defined". phi_crypt.wasm is single-threaded
// again (see phi-crypt-cpp/web/CMakeLists.txt).
//
// This file stays at the same URL, byte-different from the old version, so
// any browser that already registered the old Service Worker picks up this
// update on its next visit and self-unregisters — deleting the file outright
// would leave already-registered clients stuck running the stale, broken
// cached copy indefinitely.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil(
        self.registration.unregister().then(() => self.clients.matchAll())
            .then((clients) => clients.forEach((c) => c.navigate(c.url)))
    );
});
