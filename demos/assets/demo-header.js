// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Shared chrome for the phicoherent.com demo pages:
//   • builds the brand header (logo → site home, title, prev/next, "All Demos")
//   • a light/dark theme toggle that reuses the site's `phi-theme` localStorage
//     key, so the choice persists across the site and every demo
//   • window.PhiTheme, which reads the active palette from CSS custom properties and
//     notifies subscribers on theme change, so canvas / Three.js visualizations
//     stay legible in both themes.
//
// A demo declares only its identity on the header element:
//   <header class="demo-header" data-demo="vqe-landscape"
//           data-title="VQE Energy Landscape: Variational Quantum Eigensolver"></header>
// Load this at the end of <body>:  <script src="assets/demo-header.js"></script>

(function () {
  'use strict';

  // Consent-gated analytics, shared with the rest of the site. Loaded once here
  // so every demo is covered without a per-file edit; analytics.js itself no-ops
  // inside embedded demos (?embed=1) and waits for consent before setting cookies.
  if (!document.getElementById('phi-analytics-js')) {
    var aj = document.createElement('script');
    aj.id = 'phi-analytics-js';
    aj.src = '/assets/analytics.js';
    (document.head || document.documentElement).appendChild(aj);
  }

  var DEMOS = [
    // ── Compression (Pillar I) ──
    { id: 'base-codec',           file: 'base-codec.html',           name: 'Base Codec: φ vs zlib' },
    { id: 'audio-codec',          file: 'audio-codec.html',          name: 'Audio Codec: φ vs FLAC (lossless)' },
    { id: 'image-codec',          file: 'image-codec.html',          name: 'Image Codec: φ vs PNG (lossless)' },
    { id: 'video-codec',          file: 'video-codec.html',          name: 'Video Codec: φ vs FFV1 (lossless)' },
    // ── Qudit Architecture (impact-ordered) ──
    { id: 'qudit-register',       file: 'qudit-register.html',       name: 'First-Class Qudit Register' },
    { id: 'dual-mode-core',       file: 'dual-mode-core.html',       name: 'Dual-Mode Core' },
    { id: 'fibonacci-anyons',     file: 'fibonacci-anyons.html',     name: 'Fibonacci Anyons: Braiding & Universality' },
    { id: 'qudit-mbqc',           file: 'qudit-mbqc.html',           name: 'Qudit MBQC (1D + 2D)' },
    // ── Topological order, error correction & beyond ──
    // (topological-qec is a unified host tabbing over standalone sub-demos kept
    //  embeddable via ?embed=1: trapped-ion-qec + string-net-qec.)
    { id: 'topological-qec',      file: 'topological-qec.html',      name: 'Topological QEC: Fibonacci vs Surface' },
    { id: 'tee-signature',        file: 'tee-signature.html',        name: 'Topological Entropy γ' },
    { id: 'vqe-landscape',        file: 'vqe-landscape.html',        name: 'VQE Landscape' },
    { id: 'tunneling',            file: 'tunneling.html',            name: 'Tunneling' },
    { id: 'quantum-cryptography', file: 'quantum-cryptography.html', name: 'Quantum Cryptography' },
    { id: 'pyramid-energy',         file: 'pyramid-energy.html',         name: 'Pyramid Energy Device' },
    { id: 'telluric-mhd-designer', file: 'telluric-mhd-designer.html', name: 'Telluric-Resonant MHD Designer' },
    // ── Artificial General Intelligence (Pillar IV) ──
    { id: 'agi-chat',             file: 'agi-chat.html',             name: 'Talk to the φAGI' },
  ];

  // ── PhiTheme: palette + change subscription ────────────────────────────────
  var subscribers = [];
  function readVar(cs, name, fallback) {
    var v = cs.getPropertyValue(name).trim();
    return v || fallback;
  }
  var PhiTheme = {
    isDark: function () {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    },
    palette: function () {
      var cs = getComputedStyle(document.documentElement);
      return {
        isDark: PhiTheme.isDark(),
        bg:      readVar(cs, '--bg', '#F3EDE2'),
        canvas:  readVar(cs, '--demo-canvas', '#ECE5D7'),
        panel:   readVar(cs, '--demo-panel', '#EBE4D6'),
        card:    readVar(cs, '--card', '#E4DBCA'),
        gold:    readVar(cs, '--gold', '#C9A830'),
        goldDim: readVar(cs, '--gold-dim', '#A07818'),
        text:    readVar(cs, '--text', '#1C1810'),
        textDim: readVar(cs, '--text-muted', '#5C5240'),
        grid:    readVar(cs, '--demo-grid-line', 'rgba(0,0,0,0.08)'),
        axis:    readVar(cs, '--demo-axis', '#8a7d63'),
        red:     readVar(cs, '--demo-red', '#c0392b'),
        green:   readVar(cs, '--demo-green', '#2f7d32'),
        blue:    readVar(cs, '--demo-blue', '#2d6cb0'),
        cyan:    readVar(cs, '--demo-cyan', '#1f8aa0'),
        border:  readVar(cs, '--gold-border', 'rgba(160,118,18,0.28)'),
      };
    },
    onChange: function (cb) { subscribers.push(cb); },
    _fire: function () {
      var p = PhiTheme.palette();
      subscribers.forEach(function (cb) { try { cb(p); } catch (e) { /* ignore */ } });
    },
  };
  window.PhiTheme = PhiTheme;

  function setTheme(dark) {
    var root = document.documentElement;
    if (dark) { root.setAttribute('data-theme', 'dark'); }
    else { root.removeAttribute('data-theme'); }
    try { localStorage.setItem('phi-theme', dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
    PhiTheme._fire();
  }

  // True when the page is embedded in a unified host via ?embed=1; the host
  // supplies the chrome (logo, title, nav, theme toggle), so the inner demo
  // hides its own header but keeps PhiTheme live for its canvases.
  function isEmbedded() {
    try { return new URLSearchParams(window.location.search).has('embed'); }
    catch (e) { return false; }
  }

  // ── Build the header ───────────────────────────────────────────────────────
  function build() {
    var header = document.querySelector('.demo-header');
    if (!header) return;
    if (isEmbedded()) { header.style.display = 'none'; return; }  // host provides the chrome

    var id = header.getAttribute('data-demo') || '';
    var title = header.getAttribute('data-title') || 'Interactive Demo';
    var idx = DEMOS.findIndex(function (d) { return d.id === id; });
    if (idx < 0) idx = 0;
    var prev = DEMOS[(idx - 1 + DEMOS.length) % DEMOS.length];
    var next = DEMOS[(idx + 1) % DEMOS.length];

    header.innerHTML =
      '<a class="demo-home" href="/" aria-label="φCoherent home">' +
        '<img src="/assets/coherent-logo-web.svg" alt="φCoherent Inc." width="176" height="40">' +
      '</a>' +
      '<div class="demo-title">' + title + '</div>' +
      '<nav class="demo-switch" aria-label="Demo navigation">' +
        '<a class="demo-nav-arrow" href="' + prev.file + '" title="Previous: ' + prev.name + '" aria-label="Previous demo: ' + prev.name + '">←</a>' +
        '<a class="demo-nav-link" href="/#demos">All Demos</a>' +
        '<a class="demo-nav-arrow" href="' + next.file + '" title="Next: ' + next.name + '" aria-label="Next demo: ' + next.name + '">→</a>' +
        '<button class="demo-toggle" id="demoThemeToggle" type="button" aria-label="Toggle light/dark theme">' +
          '<span class="toggle-icon" aria-hidden="true">☀</span>' +
          '<span class="toggle-track"><span class="toggle-thumb"></span></span>' +
          '<span class="toggle-icon" aria-hidden="true">☾</span>' +
        '</button>' +
      '</nav>';

    // Small screens truncate the inline title, so also render it as a full-width
    // line below the header (shown only on mobile via CSS), ahead of the content.
    var mobileTitle = document.createElement('div');
    mobileTitle.className = 'demo-title-mobile';
    mobileTitle.textContent = title;
    header.insertAdjacentElement('afterend', mobileTitle);

    document.getElementById('demoThemeToggle').addEventListener('click', function () {
      setTheme(!PhiTheme.isDark());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
