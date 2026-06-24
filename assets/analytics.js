// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Shared, consent-gated Google Analytics 4 for phicoherent.com.
//   • GA4 via gtag.js, loaded on every page (index + demos).
//   • Google Consent Mode v2: analytics_storage and all ad_* signals default to
//     DENIED, so no analytics cookies are set until the visitor accepts. This is
//     the GDPR / PECR-compliant default; ads_data_redaction stays on while denied.
//   • A site-wide Accept / Decline banner (injected once) records the choice in
//     localStorage('phi-consent') and flips analytics_storage to granted on
//     Accept. Decline is exactly as prominent as Accept, per PECR.
//   • Does nothing inside an embedded demo (?embed=1): the host page owns
//     analytics and consent, so the iframe must not double-count or re-prompt.
//   • Fires a `demo_open` event on clicks to demo pages, for homepage→demo funnels.
//
// Load early in <head> on the index; the demo pages inject it from demo-header.js.

(function () {
  'use strict';

  if (window.__phiAnalytics) return;            // load once per page
  window.__phiAnalytics = true;

  // Embedded demo: the host page counts the view and shows the banner.
  try {
    if (new URLSearchParams(window.location.search).has('embed')) return;
  } catch (e) { /* no URLSearchParams support: proceed */ }

  var GA_ID = 'G-EPZH9B6P66';                    // phicoherent.com GA4 Measurement ID
  var STORE = 'phi-consent';                     // 'granted' | 'denied'

  // ── gtag bootstrap ──────────────────────────────────────────────────────────
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  var stored = null;
  try { stored = localStorage.getItem(STORE); } catch (e) { /* ignore */ }

  // Consent Mode v2 defaults: deny until the visitor opts in. A returning
  // visitor who already accepted starts granted.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    ads_data_redaction: true,
  });

  gtag('js', new Date());
  gtag('config', GA_ID);

  // Load the GA library after the consent defaults are queued.
  var lib = document.createElement('script');
  lib.async = true;
  lib.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  (document.head || document.documentElement).appendChild(lib);

  // ── consent API ───────────────────────────────────────────────────────────────
  function setConsent(granted) {
    gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
    try { localStorage.setItem(STORE, granted ? 'granted' : 'denied'); } catch (e) { /* ignore */ }
  }
  window.PhiConsent = {
    grant: function () { setConsent(true); hideBanner(); },
    deny:  function () { setConsent(false); hideBanner(); },
    reset: function () { try { localStorage.removeItem(STORE); } catch (e) { /* ignore */ } },
  };

  // ── consent banner ──────────────────────────────────────────────────────────
  var bar;
  function hideBanner() { if (bar) bar.classList.add('hidden'); }

  function buildBanner() {
    if (stored === 'granted' || stored === 'denied') return;   // already decided

    // Self-contained styling for pages that don't define .cookie-bar (the demos);
    // the index's own .cookie-bar rules also apply there and stay consistent.
    if (!document.getElementById('phiConsentStyle')) {
      var st = document.createElement('style');
      st.id = 'phiConsentStyle';
      st.textContent =
        '#phiConsentBar{position:fixed;bottom:0;left:0;right:0;z-index:9000;' +
        'display:flex;align-items:center;justify-content:space-between;gap:16px;' +
        'padding:12px 40px;background:var(--surface,var(--panel,#1a1a1a));' +
        'border-top:1px solid var(--row-border,var(--border,rgba(160,118,18,0.28)));' +
        'transition:transform .3s ease}' +
        '#phiConsentBar.hidden{transform:translateY(100%)}' +
        '#phiConsentBar p{font:300 12px/1.5 Inter,sans-serif;' +
        'color:var(--text-dim,var(--text-muted,#9a9a9a));margin:0}' +
        '#phiConsentBar a{color:inherit;text-decoration:underline}' +
        '#phiConsentBar .pc-btns{display:flex;gap:8px;flex-shrink:0}' +
        '#phiConsentBar button{background:none;border:1px solid var(--gold-border,rgba(160,118,18,0.4));' +
        'color:var(--text-dim,var(--text-muted,#bbb));font:400 11px/1 Inter,sans-serif;' +
        'letter-spacing:.06em;padding:6px 14px;border-radius:3px;cursor:pointer;' +
        'white-space:nowrap;transition:background .2s,color .2s}' +
        '#phiConsentBar button:hover{background:var(--gold-subtle,rgba(201,168,48,0.15));color:var(--text,#fff)}' +
        '#phiConsentBar button.pc-accept{border-color:var(--gold,#C9A830);color:var(--gold,#C9A830)}' +
        '@media(max-width:600px){#phiConsentBar{padding:12px 20px;flex-wrap:wrap}}';
      document.head.appendChild(st);
    }

    bar = document.createElement('div');
    bar.id = 'phiConsentBar';
    bar.className = 'cookie-bar';                  // inherit the index's styling where present
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML =
      '<p>We use Google Analytics to understand how visitors use this site. ' +
      'No analytics cookies are set until you accept. ' +
      'See our <a href="/privacy.html">privacy notice</a>.</p>' +
      '<span class="pc-btns">' +
        '<button type="button" class="pc-decline">Decline</button>' +
        '<button type="button" class="pc-accept">Accept</button>' +
      '</span>';
    document.body.appendChild(bar);
    bar.querySelector('.pc-accept').addEventListener('click', window.PhiConsent.grant);
    bar.querySelector('.pc-decline').addEventListener('click', window.PhiConsent.deny);
  }

  // ── demo-link click tracking ──────────────────────────────────────────────────
  function trackClicks() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      // index links demos as "demos/x.html"; cross-demo nav uses "x.html".
      if (/(^|\/)demos\/[\w-]+\.html/.test(href) || /^[\w-]+\.html(\?|#|$)/.test(href)) {
        gtag('event', 'demo_open', {
          link_url: href,
          link_text: (a.textContent || '').trim().slice(0, 100),
        });
      }
    }, true);
  }

  function init() { buildBanner(); trackClicks(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
