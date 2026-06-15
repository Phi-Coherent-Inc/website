// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// Shared chrome for the phicoherent.com demo pages:
//   • builds the brand header (logo → site home, title, prev/next, "All Demos")
//   • a light/dark theme toggle that reuses the site's `phi-theme` localStorage
//     key, so the choice persists across the site and every demo
//   • window.PhiTheme — reads the active palette from CSS custom properties and
//     notifies subscribers on theme change, so canvas / Three.js visualizations
//     stay legible in both themes.
//
// A demo declares only its identity on the header element:
//   <header class="demo-header" data-demo="vqe-landscape"
//           data-title="VQE Energy Landscape — Variational Quantum Eigensolver"></header>
// Load this at the end of <body>:  <script src="assets/demo-header.js"></script>

(function () {
  'use strict';

  var DEMOS = [
    { id: 'trapped-ion-qec',      file: 'trapped-ion-qec.html',      name: 'Trapped-Ion QEC Companion' },
    { id: 'string-net-qec',       file: 'string-net-qec.html',       name: 'String-Net QEC' },
    { id: 'anyon-braiding',       file: 'anyon-braiding.html',       name: 'Anyon Braiding' },
    { id: 'time-reversal',        file: 'time-reversal.html',        name: 'Time Reversal' },
    { id: 'vqe-landscape',        file: 'vqe-landscape.html',        name: 'VQE Landscape' },
    { id: 'tunneling',            file: 'tunneling.html',            name: 'Tunneling' },
    { id: 'quantum-cryptography', file: 'quantum-cryptography.html', name: 'Quantum Cryptography' },
    { id: 'pyramid-energy',       file: 'pyramid-energy.html',       name: 'Pyramid Energy Device' },
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

  // ── Build the header ───────────────────────────────────────────────────────
  function build() {
    var header = document.querySelector('.demo-header');
    if (!header) return;

    var id = header.getAttribute('data-demo') || '';
    var title = header.getAttribute('data-title') || 'Interactive Demo';
    var idx = DEMOS.findIndex(function (d) { return d.id === id; });
    if (idx < 0) idx = 0;
    var prev = DEMOS[(idx - 1 + DEMOS.length) % DEMOS.length];
    var next = DEMOS[(idx + 1) % DEMOS.length];

    header.innerHTML =
      '<a class="demo-home" href="/" aria-label="φCoherent — home">' +
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
