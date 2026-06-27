// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Phi-Coherent Inc.
//
// mhd-core-scene.js — the SHARED 3D builder for the MHD Core cut-away.
//
// One source of truth for the sealed-coffer cut-away so the two demos cannot drift:
//   - pyramid-energy.html        (the "Coffer: MHD core" zoom)
//   - telluric-mhd-designer.html (the "MHD Core" panel)
//
// It builds the coffer core ONLY (granite shell, working fluid, lodestone cage + crown,
// B-field, lid arc-electrodes, wireless rings, telluric clock, resonance halo + antinodes,
// plasma arc). The surrounding King's Chamber room is Giza-specific and stays in
// pyramid-energy.html as a thin add-on driven by the {res} this module returns.
//
// Classic script (no module): exposes a global `MhdCoreScene = { build, update }`. Both
// demos already load three.js r128 as a global, so THREE is passed in.

(function (root) {
  'use strict';

  // Petrie interior proportions (m), the canonical Giza coffer. The designer overrides
  // dims with its live vessel, but the visual language (aspect, cage, electrodes) is shared.
  var PETRIE = { L: 1.9827, H: 0.8743, W: 0.6810 };

  // Build the coffer-core group. Returns { group, handles, geom }.
  //   opts.scale      display scale (default 0.9)
  //   opts.dims       { L, H, W } interior metres (default Petrie)
  //   opts.fillFrac   working-fluid depth as a fraction of interior height (default 0.75)
  //   opts.fluidColor working-fluid slab colour (default mercury '#bfd3dd')
  //   opts.cyan       wireless-ring / palette cyan (default '#37b0c9')
  function build(THREE, opts) {
    opts = opts || {};
    var C = function (hex) { return new THREE.Color(hex); };
    var CFS  = opts.scale != null ? opts.scale : 0.9;
    var dims = opts.dims || PETRIE;
    var fillFrac = opts.fillFrac != null ? opts.fillFrac : 0.75;
    var fluidColor = opts.fluidColor || '#bfd3dd';
    var cyan = opts.cyan || '#37b0c9';

    var group = new THREE.Group();

    var cfIL = dims.L * CFS, cfIH = dims.H * CFS, cfIW = dims.W * CFS;  // interior L×H×W (x,y,z)
    var cfWT = 0.12;                                                    // granite wall thickness
    var cfEL = cfIL + 2 * cfWT, cfEH = cfIH + 2 * cfWT, cfEW = cfIW + 2 * cfWT;  // exterior
    var cfFillH = fillFrac * cfIH;                                      // working-fluid depth
    var cfHgTopY = -cfIH / 2 + cfFillH;                                 // fluid surface

    // granite shell: wireframe edges + translucent sealed lid/floor
    group.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(cfEL, cfEH, cfEW)),
      new THREE.LineBasicMaterial({ color: C('#9a7d56'), transparent: true, opacity: 0.7 })));
    var cfGranMat = new THREE.MeshBasicMaterial({ color: C('#8a7256'), transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    var cfLid   = new THREE.Mesh(new THREE.BoxGeometry(cfEL, cfWT, cfEW), cfGranMat); cfLid.position.y =  cfEH / 2 - cfWT / 2; group.add(cfLid);
    var cfFloor = new THREE.Mesh(new THREE.BoxGeometry(cfEL, cfWT, cfEW), cfGranMat); cfFloor.position.y = -cfEH / 2 + cfWT / 2; group.add(cfFloor);

    // working fluid: reflective slab, slosh-animated
    var cfHgMat = new THREE.MeshBasicMaterial({ color: C(fluidColor), transparent: true, opacity: 0.92 });
    var cfHg = new THREE.Mesh(new THREE.BoxGeometry(cfIL * 0.99, cfFillH, cfIW * 0.99), cfHgMat);
    cfHg.position.y = cfHgTopY - cfFillH / 2; group.add(cfHg);

    // LODESTONE CAGE: two combs of tapered spokes on the LONG walls (z=±), joined over the top.
    var cfLodeMat = new THREE.MeshBasicMaterial({ color: C('#33312e'), transparent: true, opacity: 0.42, side: THREE.DoubleSide });
    var cfNSpoke = 5, cfZwall = cfEW / 2 + 0.045;
    [-1, 1].forEach(function (sz) {
      for (var i = 0; i < cfNSpoke; i++) {
        var sx = (i - (cfNSpoke - 1) / 2) * (cfIL / cfNSpoke);
        var sp = new THREE.Mesh(new THREE.BoxGeometry(cfIL / (cfNSpoke * 1.7), cfEH * 0.98, 0.06), cfLodeMat);
        sp.position.set(sx, 0, sz * cfZwall); group.add(sp);
      }
    });
    // the CROWN: the two combs joined OVER THE TOP — the cool magnet body off the hot cell
    var cfCrown = new THREE.Mesh(new THREE.BoxGeometry(cfIL * 0.96, 0.07, cfEW + 0.18),
      new THREE.MeshBasicMaterial({ color: C('#45423d'), transparent: true, opacity: 0.5 }));
    cfCrown.position.y = cfEH / 2 + 0.07; group.add(cfCrown);

    // B field lines: ACROSS THE WIDTH (z), long wall → long wall, through the fluid
    var cfFieldMat = new THREE.LineBasicMaterial({ color: C('#cf6f5f'), transparent: true, opacity: 0.5 });
    for (var ix = -1; ix <= 1; ix++) for (var iy = -1; iy <= 1; iy++) {
      var fx = ix * cfIL * 0.3, fy = iy * cfIH * 0.28;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
        [new THREE.Vector3(fx, fy, -cfIW / 2), new THREE.Vector3(fx, fy, cfIW / 2)]), cfFieldMat.clone()));
      var head = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.07, 8),
        new THREE.MeshBasicMaterial({ color: C('#cf6f5f'), transparent: true, opacity: 0.7 }));
      head.position.set(fx, fy, cfIW / 2 - 0.035); head.rotation.x = Math.PI / 2; group.add(head);
    }

    // ARC / sense electrodes through the LID
    var cfElecMat = [];
    [-1, 1].forEach(function (sx) {
      var m = new THREE.MeshBasicMaterial({ color: C('#e7d9a8'), transparent: true, opacity: 0.95 });
      var e = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, cfWT * 2.4, 12), m);
      e.position.set(sx * cfIL * 0.26, cfEH / 2 - cfWT * 0.6, 0); group.add(e); cfElecMat.push(m);
    });

    // WIRELESS output: cyan wavefronts expand outward (Tesla-style link, no wires)
    var cfOut = [];
    for (var i = 0; i < 4; i++) {
      var ring = new THREE.Mesh(
        new THREE.RingGeometry(0.045, 0.055, 56),
        new THREE.MeshBasicMaterial({ color: C(cyan), transparent: true, opacity: 0, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = cfHgTopY - cfFillH / 2;
      group.add(ring); cfOut.push(ring);
    }

    // axis triad: slosh (x, gold) / B (z, red across width) / current (y, cyan)
    var cfTriad = new THREE.Group();
    cfTriad.position.set(-cfEL / 2 - 0.2, -cfEH / 2 - 0.2, -cfEW / 2 - 0.1); group.add(cfTriad);
    cfTriad.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.42, 0xC9A830));
    cfTriad.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 0.42, 0xc0432f));
    cfTriad.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.42, 0x37b0c9));

    // Telluric "clock" wavefronts: rise from the ground (below) up through the floor.
    var cfTel = [];
    for (var t = 0; t < 4; t++) {
      var tr = new THREE.Mesh(
        new THREE.RingGeometry(cfEL * 0.20, cfEL * 0.30, 48),
        new THREE.MeshBasicMaterial({ color: C('#49c39a'), transparent: true, opacity: 0, side: THREE.DoubleSide }));
      tr.rotation.x = -Math.PI / 2; tr.position.y = -cfEH / 2 - 0.6;
      group.add(tr); cfTel.push(tr);
    }

    // Resonance halo + antinode discs (the bell, high Q)
    var cfHaloMat = new THREE.LineBasicMaterial({ color: C('#C9A830'), transparent: true, opacity: 0 });
    var cfHalo = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(cfEL * 1.05, cfEH * 1.05, cfEW * 1.05)), cfHaloMat);
    group.add(cfHalo);
    var cfNodes = [];
    for (var n = 0; n < 3; n++) {
      var disc = new THREE.Mesh(
        new THREE.PlaneGeometry(cfIL * 0.96, cfIW * 0.96),
        new THREE.MeshBasicMaterial({ color: C('#C9A830'), transparent: true, opacity: 0, side: THREE.DoubleSide }));
      disc.rotation.x = -Math.PI / 2;
      disc.position.set((n - 1) * cfIL * 0.30, cfHgTopY + 0.006, 0);
      group.add(disc); cfNodes.push(disc);
    }

    // Plasma-arc gate: a hot flickering core + a vertical arc the slosh switches at 50 Hz
    var cfPlasma = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14),
      new THREE.MeshBasicMaterial({ color: C('#cfe8ff'), transparent: true, opacity: 0 }));
    cfPlasma.position.set(0, cfHgTopY - cfFillH * 0.35, 0); group.add(cfPlasma);
    var cfArc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(0, cfHgTopY, 0), new THREE.Vector3(0, cfHgTopY - cfFillH * 0.7, 0)]),
      new THREE.LineBasicMaterial({ color: C('#eaf5ff'), transparent: true, opacity: 0 }));
    group.add(cfArc);

    var geom = { cfEL: cfEL, cfEH: cfEH, cfEW: cfEW, cfIL: cfIL, cfIH: cfIH, cfIW: cfIW,
                 cfWT: cfWT, cfFillH: cfFillH, cfHgTopY: cfHgTopY };
    var handles = {
      group: group, C: C, fluidColor: fluidColor,
      cfHg: cfHg, cfHgMat: cfHgMat, cfElecMat: cfElecMat,
      cfOut: cfOut, cfTel: cfTel, cfHalo: cfHalo, cfHaloMat: cfHaloMat,
      cfNodes: cfNodes, cfPlasma: cfPlasma, cfArc: cfArc,
      geom: geom, _phase: 0,
    };
    return { group: group, handles: handles, geom: geom };
  }

  // Animate the core. st = { on, sustains, now, dt, cyan }. Returns { res, s, on, sustains }
  // so a caller (pyramid-energy) can drive its King's-Chamber add-on in step.
  function update(h, st) {
    var C = h.C, g = h.geom;
    var on = !!st.on, sustains = !!st.sustains, now = st.now || 0, dt = st.dt || 0;
    var cyan = st.cyan || '#37b0c9';

    // Telluric clock: ALWAYS present (touches the cell whether ignited or not).
    h.cfTel.forEach(function (ring, i) {
      var ph = (now * (on ? 0.55 : 0.30) + i / h.cfTel.length) % 1;
      ring.position.y = (-g.cfEH / 2 - 0.6) + ph * 0.6;
      ring.scale.setScalar(0.6 + ph * 0.8);
      var beat = on ? (0.45 + 0.55 * (0.5 + 0.5 * Math.cos(h._phase))) : 0.5;
      ring.material.opacity = (on ? 0.40 : 0.22) * (1 - ph) * beat;
    });

    if (!on) {
      // DORMANT: cool, still fluid; no slosh, plasma, or bell.
      h.cfHg.position.x = 0; h.cfHg.rotation.z = 0;
      h.cfHgMat.opacity = 0.9; h.cfHgMat.color.copy(C('#9fb6c4'));
      var base0 = C('#e7d9a8'); h.cfElecMat[0].color.copy(base0); h.cfElecMat[1].color.copy(base0);
      h.cfOut.forEach(function (r) { r.material.opacity = 0; });
      h.cfHaloMat.opacity = 0; h.cfNodes.forEach(function (d) { d.material.opacity = 0; });
      h.cfPlasma.material.opacity = 0; h.cfArc.material.opacity = 0;
      return { res: 0, s: 0, on: false, sustains: false };
    }

    // RUNNING: the full reactor.
    h._phase += dt * 4.0;                                   // viewable cadence (represents 50 Hz)
    var s = Math.sin(h._phase);
    h.cfHg.position.x = s * 0.05 * g.cfIL; h.cfHg.rotation.z = s * 0.045;
    h.cfHgMat.opacity = 0.85 + 0.12 * Math.abs(s);
    var hot = C('#ff7a5a'), cold = C('#5a9bff'), base = C('#e7d9a8');
    h.cfElecMat[1].color.copy(base.clone().lerp(s > 0 ? hot : cold, Math.min(1, Math.abs(s))));
    h.cfElecMat[0].color.copy(base.clone().lerp(s > 0 ? cold : hot, Math.min(1, Math.abs(s))));

    var res = 0;
    if (sustains) {
      h.cfOut.forEach(function (ring, i) {
        var ph = (now * 0.7 + i / h.cfOut.length) % 1;
        ring.scale.setScalar(1.0 + ph * 34.0);
        ring.material.color.set(cyan);
        ring.material.opacity = 0.5 * (1 - ph) * (0.5 + 0.5 * Math.abs(s));
      });
      res = 0.5 + 0.5 * Math.cos(h._phase);
      h.cfHaloMat.opacity = 0.12 + 0.48 * res; h.cfHalo.scale.setScalar(1.0 + 0.012 * res);
      h.cfNodes.forEach(function (d, i) { d.material.opacity = 0.05 + 0.34 * res * (i === 1 ? 1.0 : 0.55); });
      h.cfHgMat.color.copy(C(cyan).lerp(C('#ffb060'), 0.22 + 0.26 * res));   // hot glow
      var flick = 0.55 + 0.45 * Math.abs(Math.sin(now * 37.0) * Math.sin(now * 13.0));
      h.cfPlasma.material.opacity = 0.5 + 0.45 * flick; h.cfPlasma.scale.setScalar(0.8 + 0.5 * flick);
      h.cfArc.material.opacity = 0.28 + 0.6 * flick;
    } else {
      // STALLED: slosh runs, arc quenches; cool, no broadcast.
      h.cfOut.forEach(function (r) { r.material.opacity = 0; });
      h.cfHaloMat.opacity = 0; h.cfNodes.forEach(function (d) { d.material.opacity = 0; });
      h.cfPlasma.material.opacity = 0; h.cfArc.material.opacity = 0;
      h.cfHgMat.color.copy(C('#9fb6c4'));
    }
    return { res: res, s: s, on: true, sustains: sustains };
  }

  root.MhdCoreScene = { build: build, update: update, PETRIE: PETRIE };
})(typeof window !== 'undefined' ? window : this);
