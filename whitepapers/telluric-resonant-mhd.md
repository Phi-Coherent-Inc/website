# The Great Pyramid as a Schumann-Tuned Telluric Transducer
### A first-principles physical and mathematical model of the complete device
*Phi-Coherent Inc. · phicoherent.com · June 2026*

> This is the markdown mirror of the paper. A typeset, citable LaTeX version with identical content and
> the same validated numbers is maintained alongside the implementation; the appendix lists the validation
> identifiers that bind the paper to the source. Equations are numbered (1)…(N) and shown in plain Unicode
> so they render in any viewer.

---

## Abstract

We ask whether the geometry of the Great Pyramid of Giza could, if outfitted as described, function as
a multi-stage electromechanical transducer, and we give the governing mathematics of every stage: the
geometry; the Earth–ionosphere cavity that sets the
operating frequency; the atmospheric and storm energy input (corona collection, resistance–capacitance
accumulation, and the conduction path to ground); the energy reservoirs; the input coupling chain; the
resonant acoustic core (chamber and coffer, the slosh alternator, the density-contrast flywheel, and
the buildup, pulsed, and self-sustain dynamics); the magnetohydrodynamic (MHD) conversion stage with
its magnetic circuit, lock-in gate, and reactor regime; the telluric "dam-shunt" chopper and its
electrochemical store; and the distribution stage (a near-field resonant link to a co-located receiver, and the
long-range broadcast verdict). The engineered components this would require — a magnetite ∩-yoke, a
mercury working fluid, a wet conductive base — are a design proposal, not an archaeological claim;
whether the structure was ever so outfitted is the subject of the conjectures, to be decided by field
measurement. Two results bound the feasibility: the always-available radiative coupling is
capped at ≈ 0.23 µW by the product of the footprint area and the Poynting flux, whereas a conditional
telluric chopper could deliver ≈ 438 kW (net of the thermal tax and gate drive — the field is a coil-free permanent lodestone magnet, so it draws no power) only if a regional source resistance below 42 mΩ obtains. We
close with two layered, falsifiable conjectures: the Badwal Conjecture (cavity index = φ) and the
Machine-C device conjecture. Every equation is checked against a reference implementation by the two
gates described in the Appendix.

Notation: c = light speed; c_s = sound/elastic speed; ω = 2πf; σ = conductivity; η = dynamic
viscosity; μ₀, ε₀ = vacuum permeability/permittivity; ρ = mass density; ρ_e = resistivity; B = flux
density; Q = quality factor (the cavity index n_cav² is written out when meant).

---

## 1. Introduction

This is a **feasibility study**, not an existence proof. We take the structure's measured geometry as
given and ask a conditional question: *if* the chambers were outfitted with the components each stage
requires, what physics would govern the result, and under what measurable conditions would it deliver
useful power? We do not assert that the Great Pyramid contained a magnetite yoke, mercury, or a wet
electrode; those are a design proposal, and whether the structure was ever so equipped is exactly what
the conjectures of §15 put to the test.

The geometry follows from a single slope constraint reproducing the casing angle, the apex height, and
a scale-free perimeter-to-height ratio close to 2π. The operating frequency follows from the Schumann
resonance, modified by a single dispersive factor. From these two anchors the paper develops, in
physical order, the energy input, the resonant core, the conversion stage, the conditional high-power
chopper, and the distribution stage. We separate *fact* (Table 1), *assumption* (Table 2), and
*derivation*. The golden ratio φ = (1+√5)/2 enters the geometry, the resonant-onset algebra, and,
conjecturally, the cavity index; it is written where it enters.

**Table 1 — Measured or documented inputs.**

| # | Quantity | Value | Source |
|---|---|---|---|
| F1 | Base side | ≈ 230.4 m | Petrie |
| F2 | Apex height | ≈ 146.6 m | Petrie |
| F3 | Casing angle | 51°50′40″ | Petrie |
| F4 | Royal cubit | 0.5236 m | standard |
| F5 | King's Chamber floor | 20 × 10 cubits (2:1) | Petrie |
| F6 | King's Chamber height | 11.18 cubits | Petrie |
| F7 | Coffer interior | 1.983 × 0.681 × 0.874 m | Petrie |
| F8 | Aswan granite | ρ ≈ 2650 kg/m³, ε_r ≈ 6 | materials |
| F9 | Tura limestone (dry) | σ ≈ 10⁻⁹ S/m | materials |
| F10 | Basalt | σ ≈ 10⁻³ S/m; c_s ≈ 6000 m/s | materials |
| F11 | Schumann modes | 7.83 … 50.0 Hz (8 observed) | NASA-cited |
| F12 | ELF heights | h_e ≈ 50–60 km, h_m ≈ 90–100 km | Mushtak–Williams |
| F13 | Atmospheric current | ~2 pA/m² fair; 10³–10⁴× storm | atmospheric electricity |
| F14 | Earth polar radius | 6,357,000 m | geodesy |
| F15 | Mercury (working fluid) | ρ ≈ 13534, σ ≈ 1.04×10⁶ S/m, η ≈ 1.53 mPa·s, c_s ≈ 1451 m/s | materials |
| F16 | Chamber salt | Queen's Chamber walls bear a halite efflorescence (~1 cm); King's Chamber essentially clean | Petrie; site reports |
| F17 | Shaft ventilation | Queen's air shafts sealed (do not reach the exterior); King's air shafts open to the exterior | Gantenbrink 1993 |

**Table 2 — Physical assumptions.**

| # | Assumption | Status |
|---|---|---|
| A1 | Cavity index n_cav² = φ | open conjecture (§3, §15) |
| A2 | Coffer mercury bell tuned ≈ 50 Hz by fill level | design postulate |
| A3 | Chamber air mode ↔ coffer slosh co-tune ≈ 50 Hz | design postulate |
| A4 | Mercury is the working fluid, displaced at 50 Hz in the imposed field | design choice |
| A5 | Limestone casing isolates the structure | derived (F9) |
| A6 | Regional telluric source R ≤ ~42 mΩ (the dam self-heats) | conditional, falsifiable (§11) |
| A7 | Ground = subsurface brine-saturated limestone (aquifer-coupled), kept conductive by evaporative salt concentration | derived + conditional (§11) |
| A8 | The transverse field is a mined-lodestone ∩-yoke over the sealed coffer — a permanent magnet, coil-free (≈ 0.16 T, pressurised) | design choice (§10) |
| A9 | The mercury arc is housed in an inner quartz/ceramic sleeve, isolating the structure from it | design choice (§10) |
| A10 | The mercury arc runs cool (electron temperature Te ≲ 1 eV) so the coil-free ≈ 0.16 T lodestone field clears the gate-trigger threshold in the pressurised cell | design choice (§10) |

We do not claim that the measured quality factor f/Δf equals φ (it is ≈ 5); that any single field
measurement equals φ; or that the device manufactures energy. Every stage respects conservation.

**Reasoning.** **A1** is the paper's one open conjecture (§3): admissible on the cited ELF heights and
motivated by a fixed-point / maximal-stability argument, but not proven; it is falsifiable. **A2–A4**
are design choices that place the resonant and conversion stages on the 50 Hz operating line — A2's
fill level is the tuning knob (added mass), and A3 rests on two *independent* ≈ 50 Hz quantities (the
room acoustics and the Schumann eighth mode) that coincide. **A5** follows from the dry-limestone
conductivity (F9): a grounded structure bleeds its charge, so the casing must isolate. **A6** is the
device's central conditional — the chopper delivers power only if a resistivity survey finds R ≤ 42 mΩ,
the cleanest falsifier. **A7** is the grounding mechanism, reconsidered: not a surface moat fought
against evaporation but the subsurface damp limestone coupled to the water table, whose pore
conductivity (Archie's law) clears the ceiling only when the brine is *evaporatively concentrated* —
the same rising damp that deposits the Queen's Chamber salt (§11); the required recharge is trivial.
**A8** is the period-plausible field: a mined-lodestone ∩-yoke joining two pole combs over the top of the
sealed, pin-locked coffer — the one return path that fits the chamber (nothing in the granite floor, walls,
or roof beams). It is a **permanent magnet** (lodestone, the original magnet), so the field costs no power
and there is no coil and no forced-cooling premise; the deliverable field is ≈ 0.16 T, capped by the hot-tip
saturation, which clears the gate in the pressurised cell (§10). A current-driven 0.6 T winding is kept only
as a dormant counterfactual. **A9**
houses the arc in a field-transparent quartz sleeve — precisely why the granite is never exposed to the
10⁴ K arc and stays pristine (§15). **A10** is the live contingency: because the coil-free lodestone field is weak (≈ 0.16 T), the gate clears its trigger threshold only if the mercury arc runs cool
(Te ≲ 1 eV) **and** the cell is pressurised, keeping the required slosh below cavitation; a hot arc, or 1 atm, loses the margin (§10). These are design
choices for a hypothetical outfitting, not claims about what the structure contained; their reality is what
the conjectures test.

## 2. Geometry of the structure

The shape descends from one root and one slope bound:

    φ² = φ + 1,     φ = (1 + √5)/2 = 1.618034                                   (1)

    h / (b/2) = √φ = 1.272020 = tan θ,     θ = 51.8273°                         (2)

realised with the seked 14/11 = 1.272727 (matching √φ to 0.056 %). The apex height is then forced — the
value that feeds the collector of §4:

    h = (b/2) √φ,     b = 230.4 m  ⇒  h = 146.54 m                              (3)

The base-perimeter-to-height ratio is scale-free and lands within 0.096 % of 2π — the one empirical
near-coincidence the geodetic reading rests on:

    perimeter/h = 4b / [(b/2)√φ] = 8/√φ = 6.28921 ≈ 2π                          (4)

Every φ-pyramid thus encodes a sphere of radius ≈ its own height. Fixing the size selects which sphere;
at Earth's polar radius (F14) and p = 34 the scale factor is a φ-power that sits ~8×10⁻⁸ from an integer:

    h = R_body/φ^p,   φ³⁴ ≈ F(34)√5 ≈ 12,752,043 = L(34),   h_C = R_polar/φ³⁴ = 498.508 mm   (5)

The remaining scale-free identities are exact consequences of (1):

    apothem = (b/2)φ,  face area = h²,  lateral/base = φ,
    R_circ/r_in = √2 φ^(3/2) = 2.910,  φ⁴ = 3φ + 2 = 6.854102                   (6)

These are algebraic geometry; they acquire physical content only through the mechanisms that follow.

## 3. The resonant cavity and the operating frequency

Assumption A1 sets the cavity index, from which the spectral correction follows:

    Q ≡ n_cav² = φ  ⇒  n_cav = √φ,     correction = 1/√φ = 0.786151             (7)

The corrected Schumann spectrum places the eighth mode on the operating line (the lossless baseline
drops the 1/√φ factor):

    f_n = [c/(2πR)] · (1/√φ) · √(n(n+1))  ⇒  f₈ = 49.96 Hz                      (8)

Against the eight observed modes (F11) the correction cuts the RMS error tenfold, from 8.20 to 0.82 Hz;
φ is not the raw minimiser (≈ 1.59) but lies within the ~0.5 Hz diurnal drift of it. Two mechanisms
would make φ the *ideal* index. A self-consistent fixed point:

    Q = a + b/Q  ⇒  Q* = (a + √(a²+4b))/2,     a = b = 1 ⇒ Q* = φ              (9)

a global attractor reached by iterating Q ← 1 + 1/Q. And maximal stability, via the irrationality
measure (Hurwitz bound 1/√5):

    M(x) = min over q ≤ Q_max of  q·|q·x − round(q·x)|,   argmax over [1.57,1.80] = φ   (10)

At Q = φ the 2:1 parametric (Mathieu) condition holds exactly, with a closed-form onset threshold:

    φ + 1/φ² = 2,     ε_c = 2/Q  →(Q=φ)  2/φ = √5 − 1 = 1.236068                (11)

The amplitude (dissipative) dynamics of any resonance are

    γ = ω/(2Q) = πf/Q,   τ = 1/γ = Q/(πf),   cycles = Q/π,   A(t) = A₀e^(rt),   ω_c = ω + iγ   (12)

Corroboration: the cited heights (F12) give the index as a two-height ratio containing φ, and inverting
the spectrum at fixed R (g_n = f_lossless(n)):

    Q = h_m/h_e ≈ 1.69 ∈ [1.50, 2.00],   Q(n) = (f_lossless(n)/f_obs(n))²,
    Q* = 1/x*²,  x* = Σ gₙ·obsₙ / Σ gₙ²                                         (13)

A wide implied-Q spread shows a single constant index is itself an imperfect model.

## 4. Energy input: collection, accumulation, and conduction

The isolated electrum apex is a conductor of self-capacitance C = 4πε₀ r_eff that taps the atmospheric
DC potential V = E_ambient·h_apex and banks charge Q_banked = CV. Point discharge at the sharp tip
follows Peek's law with density correction δ = (P/P₀)(T₀/T):

    E_onset(r) = E₀ δ (1 + K/√(δr)),   β = h/r,   ambient onset = E_onset(r)/β,
    i = a(F² − M²)  for F > M                                                   (14)

At a 1.5 mm tip β ≈ 10⁵; fair-weather corona is µW, rising to watts in storms and kW near a pre-strike
leader. Accumulation is a current-source-driven RC tank — the apex draws current onto the structure
capacitance while the bulk rock leaks it to ground:

    I_in = J·A_cap,   C = κ·4πε₀·r_eff,   R_leak = h/(σA),
    V_∞ = I_in·R_leak,   Q(t) = Q_∞(1 − e^(−t/RC))                              (15)

Dry rock (σ ≈ 10⁻⁹) limits a storm to ~10² V; the insulating casing (A5) is required for the MV range.
The conduction path obeys R = L/(σA): bare stone flashes over (MΩ), while an electrum facing of N
parallel strips carries the strike at a kV drop and survives if its energy stays below melting:

    R = L/(σA),   R_electrum = L/(σAN),   ΔV = IR,   P = I²R,   E_melt = m·c_p·ΔT   (16)

The full earth circuit (apex → down-conductor → ring → shaft → aquifer) sums these series resistances.

## 5. Energy reservoirs

The Schumann field provides a triggering seed only; its coupled power and stored energy follow from the
Poynting flux through the footprint, and no grounding exceeds the weak-source × fixed-area ceiling:

    S ≈ E²/Z₀,   P = S·A_fp·η,   E = QP/ω,
    P_ceiling = S·A_fp ≈ 0.23 µW (n=8),   R_gnd = 1/(2πσa)                      (17)

The cavity is filled instead by the global atmospheric DC circuit, sky to aquifer:

    I = σ·E·A_fp,   V = E·h,   P = IV  (~mW)                                    (18)

and the dominant energy is in storms, where the apex concentrates the field to near breakdown and the
resonant sink meters out each strike as a battery:

    E_apex = β·E,   V_storm = E·h ≈ MV,   P_storm = J_storm·A·E·h,
    P_batt = η·E_strike / t_interval                                           (19)

The parametric pump modulates the cavity stiffness through a Maxwell stress, with net growth rate:

    σ_M = ½ε₀ε_r E²,   ε = σ_M/k_cav,   net = (ω/4)(ε − 2/Q)                    (20)

## 6. Input coupling

The coupling efficiency decomposes into three series links; electrostrictive transduction is the lossy
one:

    η_total = η_tap·η_transduce·η_match,
    η_transduce = M/(M+2), M = k²Q,   η_match = 1 − |Γ|²                        (21)

The match uses a φ ladder of N tiers of impedance Z = ρc/A, with worst-case in-band reflection |Γ| from
the transmission-line transform over electrical lengths θ = (π/2)(f/f₀) and levels Z_S φ^(k/2). The
transducer is electrostrictive, not piezo, because bulk random quartz cancels as its coherence vanishes
with grain count:

    k²_eff = f_coh²·φ_quartz·k²_crystal,   f_coh ≈ 1/√N_grains                  (22)

leaving η_transduce ≈ 0.05 and η_total ≈ 0.014.

## 7. The resonant acoustic core

The chamber sets the acoustic operating line; its low longitudinal mode and the Schumann f₈ are two
independent ≈ 50 Hz quantities that coincide, with the exact identity (W/2 + H)/W = φ. The DC pump
drives a 50 Hz resonant slosh whose peak mass velocity follows from E = QP_in/ω:

    v = √(2E/(ρV)) = √(2QP_in/(ωρV)),     P_in = v²ωρV/(2Q)                     (23)

The velocity scales as √P_in, so it is a property of the *regime*, not a fixed number. The fair-weather
pump (P_in ~ mW) gives only a seed velocity v_seed ≈ 2.0×10⁻⁴ m/s; the running operating point at which
the MHD conversion is quoted is v = 0.1 m/s (§9). Crucially the quality factor in (23) is not the
acoustic-cavity Q: a conductor oscillating in the transverse field B sheds momentum to induced-current
braking with time constant τ_m = ρ/(σB²), so the *MHD-loaded* factor governs:

    Q_m = ωτ_m = ωρ/(σB²) ≈ 11 (mercury, 0.6 T),   P_gate = v²ωρV/(2Q_m) = ½σB²v²V ≈ 2.2 kW

The field, not viscosity, is the dominant damping, so the drive scales as B² — the same field that sets
the EMF vBL — and the honest gate drive is ~kW, an order of magnitude above the naive acoustic-Q estimate.
It is supplied by the storm reservoir, not fair weather, and is netted into the operating output (§18). The
flywheel below boosts the seed but does not bridge the two regimes (a ~500× velocity ratio against a ~6×
gain); the regime change does. Because displacement
scales as (ρV)^(−1/2) at fixed energy, the low-density chamber air amplifies the mercury's velocity:

    g = √(ρ_Hg·V_coffer / (ρ_air·V_KC)) ≈ 6.4×                                  (24)

amplifying velocity, hence EMF, but never power. **Placement [WP-§8.3].** The coupling of the drive to the
coffer scales with the local standing-wave pressure |cos(nπx/L)|, and the coffer rests against the **west
short wall** (x = 0), which is a pressure **antinode** of the n = 3 mode — maximal drive — while the room
centre (x = L/2) is a **node** for n = 3 (and every odd mode), where the 50 Hz drive would vanish. So the
placement maxes out the position factor of k_geom and avoids the dead spot. Honestly, though, a rigid wall is
an antinode for *every* longitudinal mode, so the wall corroborates that the coffer is pressure-driven but
does not by itself single out the 50 Hz mode (placement at L/3 or 2L/3 would have). The nonlinear channel grows the second harmonic as the
square of the fundamental:

    p₂(x) = β ω p₁² x / (2ρc³),   x̄ = ρc³/(βωp),   Γ = 1/(α x̄),   Ma = p/(ρc²)   (25)

and the standing-wave energy and the power to hold it are:

    E = p²V/(2ρc²),   P = ωE/Q                                                  (26)

Two resonators coupled at rate κ = k_geom·ω with losses γ_i = ω/2Q_i transfer energy with the
coupled-mode efficiency:

    U = 2 k_geom √(Q₁Q₂),   η(U) = U²/(1 + √(1+U²))²,
    g_eff = 1 + (g_ideal − 1)η ≈ 3.7×                                          (27)

Here Q₂ is the *MHD-loaded* mercury quality factor (the damped Q_m ≈ 11–20 of §10, not the unloaded
acoustic value), so g_eff is already evaluated in the heavily-damped regime. It is robust to that loading:
because η(U) saturates for U > 1 and U scales only as √Q₂, replacing Q₂ = 20 by the fully-loaded Q_m ≈ 11
moves g_eff only from 3.70 to 3.33 — a ~10 % change, not a collapse.

## 8. Buildup, pulsed, and self-sustain dynamics

At resonance the amplitude magnification is Q, and time-compression makes a burst peak far above the
input while the average equals it:

    magnification = Q,   E_ss = QP_in/ω,   P = E/V_gas,   τ_charge/τ_release    (28)

A high-Q store saturates at E_max = P_in·τ with τ = Q/(πf), giving the charge time and the Q for a
target ceiling:

    t = τ·ln[E_max/(E_max − E_target)],   Q = πf·E_target/P_in  (= ωE_target/2P_in)   (29)

The loaded oscillator dissipates ωE/Q, so the Barkhausen loop gain and the ceiling pressure are:

    P_diss = ωE/Q,   |A·β| = P_input/P_diss,   P_max = P_in·Q/(ωV)             (30)

with |A·β| ≈ 10⁻⁵ at 1 MPa: a re-kicked pulsed burst, not a self-oscillator. Self-sustenance would need
Q ≈ 10⁶ (superconducting, not granite).

## 9. Magnetohydrodynamic conversion

The slosh velocity is converted to electricity — the motional EMF per pair, the output power density
(maximal at load factor K = ½), the Hartmann organisation, and the credible low-frequency prime mover
(Rayleigh streaming):

    EMF = vBL = 52 mV  (v = 0.1 m/s running, B = 0.6 T magnetite reference, L = 0.87 m column)   (31)

    p_dens = σv²B²K(1−K)  →(K=½)  σv²B²/4,   P = p_dens·V_active                (32)

    Ha = √(σB²r²/η) ≈ 2350 (mercury),   u_R = (3/16)(P/ρc)²/c                    (33)

Two points fix the role of this stage. First, the v = 0.1 m/s at which (31) is quoted is the *running*
velocity of §7, reached against the MHD-loaded damping at a storm-class drive ≈ 2.2 kW (§7), not the
fair-weather seed; at the seed the EMF is µV-scale. Second, the Hartmann braking is the load, not a wall:
the steady velocity is the terminal value where the drive balances the J×B drag, F_drive = σB²v, so the
field brakes the flow to a finite velocity, not to rest — and that braking *is* the extraction, which
loads the resonator down to Q_m = ωρ/(σB²) ≈ 11 (the operative Q in (23)). Crucially, this EMF is the **gate control signal** that times the chopper, not the power
path: the deliverable (§13) is the chopped telluric DC, so it does not depend on the conversion reaching
0.1 m/s. The 0.6 T at which (31)–(33) are quoted is the magnetite-saturation reference (the material ceiling,
and the field of the dormant driven counterfactual); the **live field is the coil-free lodestone of §10 at
≈ 0.16 T**, so the operating gate signals scale down with B and the gate closes only in the pressurised cell —
a continuous **phase reference** (v ≈ 2.5 mm/s) plus a strike-class **commutation** pulse, both set in §10.

## 10. Magnetic circuit, gate, and reactor regime

The transverse field is supplied by a **mined-magnetite ∩-yoke**: two pole plates set against the
coffer's long walls, joined by a magnetite bar **over the top** of the sealed, pin-locked vessel. This
is the one return path that fits the King's Chamber as built — the granite floor, walls, and roof beams
are solid, so no closed iron loop can be buried in them, but the open volume above the ~1 m coffer holds
the ∩, which lifts off when looted and leaves a bare granite box. The choice of lodestone over smelted
iron is forced by period plausibility (the Old Kingdom had no bulk iron); its price is a hard saturation
cap. Modelled as a reluctance network (the pole-face area cancels):

    MMF = σ_leak·(B/μ₀)(g + L_yoke/μ_r),   B ≤ B_sat(magnetite) ≈ 0.6 T,   P_field = MMF·ℓ·J·ρ_cu(T)   (34)

A pole cannot project a gap field above its own saturation, so magnetite caps **B ≈ 0.6 T** (smelted iron's
≈ 2 T, hence 1.3 T, is simply unavailable here). Natural lodestone is also a *poor soft core*: its relative
permeability is low (μ_r ≈ 2–10, not iron's thousands), so the iron-path reluctance L_yoke/μ_r genuinely
competes with the gap, and fringing the 1D network misses adds a leakage factor σ_leak. We take a
conservative μ_r ≈ 5 and σ_leak ≈ 1.5; at the narrowed channel g ≈ 0.30 m this gives ≈ 5.5×10⁵ amp-turns.
A *driven* version of this field would be **self-excited**: those amp-turns supplied not by a dedicated coil
but by the telluric current the device already chops — ≈ 55 turns of the working bus at ≈ 10 kA — so there is
no separately-powered magnet dissipating its own I²R beside the cell, and no forced-cooling premise to defend.
The bus I²R is P_field ≈ 148 kW — already α-corrected, ρ_cu(T) = ρ₂₀[1 + α(T − T₂₀)], to a bus temperature
≈ 105 °C, justified *geometrically*: the winding rides the cool over-the-top bar of the ∩, removed from the
517 °C cell, so it sits near the structural fringe passively, not by active cooling. The surplus is robust to
**both** the bus temperature and the permeability: the worst-case bus at the full 517 °C cell temperature
(ρ ≈ 3×) draws ≈ 328 kW and still leaves the integrated net at ≈ +110 kW, and the net stays positive down to
μ_r ≈ 2 — it turns non-positive only in the *compounded* extreme of μ_r ≲ 2 **and** an uncooled bus **and**
heavy leakage. But that driven winding is a **dormant counterfactual** — retained for comparison the same way
the anachronistic 1.3 T iron path is, since a 10 kA bus winding is itself a stretch for ~2560 BCE. **The live
field is the coil-free permanent magnet below.**

**The live field: a coil-free permanent lodestone magnet.** That 148 kW is the price of a *driven* field, and
it never arises here. Lodestone is a permanent magnet, so the field is **permanent** at zero continuous power,
built the way ~2560 BCE actually could:
the same ∩-yoke assembled from two combs of tapered lodestone spokes (a north comb on one long wall, a south
comb on the other, joined only over the top), the taper acting as the flux concentrator. The deliverable gap
field follows the permanent-magnet circuit B_gap = Br / [ f·(A_gap/A_m) + μ_rec·(L_gap/L_m) ], with
μ_rec = Br/(μ₀·Hc) ≈ 9.5 for natural lodestone (Br ≈ 0.12 T, Hc ≈ 10 kA/m). At a 2× spoke taper across a
2 cm mercury channel this gives **≈ 0.16 T**, and the **517 °C pole tip caps it** at the thermally-suppressed
saturation Bs(517 °C) ≈ 0.20 T, so the field sits just under its hot-tip ceiling. That 0.16 T is too weak to
gate at 1 atm, but the sealed cell runs **pressurised** (≈ 1 MPa), which raises the cavitation cap to
v_cav ≈ 12 m/s and lets it clear the gate with ≈ 1.7× headroom. The payoff: the field draws **no power**, so
there is no field tax at all and the operating output is the clean **≈ 438 kW** (supply net of only the thermal
tax and gate drive) — built from a shaped lump of lodestone, not a 10 kA winding. The price is that this is
**conditional on the pressurisation** (it fails at 1 atm) and on lodestone's remanence being near 0.12 T rather
than a weak 0.05 T (at which the field never reaches gate threshold and the device makes **zero** output). The
driven winding is not a fallback for the actual monument — a 10 kA bus winding is anachronistic — so the device
is committed to lodestone: more period-plausible, more falsifiable, and with no safety net but the mineral itself.

**The gate has two complementary halves (A10) — amplitude and timing.** *Amplitude (commutation).* Because
the live lodestone field is weak (≈ 0.16 T), the live question is whether the motional EMF can **commutate** the
plasma gate. The trigger floor of a regenerative negative-resistance switch is the plasma thermal voltage
kTe/e ≈ Te[eV], so the slosh must reach v = V_trig/(B·L), capped by cavitation v_cav = √(2P/ρ):

    V_trig = kTe/e,   v_req = V_trig/(B·L),   v_cav = √(2P/ρ) ≈ 3.8 m/s (1 atm)         (34a)

At a cool arc (Te ≈ 1 eV) this is a ≈ 1 V pulse; at the live 0.16 T field that needs v_req ≈ 7 m/s, above the
1 atm cavitation cap, so the cell runs **pressurised** (≈ 1 MPa, v_cav ≈ 12 m/s), where it commutates with
≈ 1.7× headroom (the dormant 0.6 T driven counterfactual would gate even at 1 atm, v_req ≈ 1.9 m/s). At a hot
arc (Te ≈ 2 eV) the margin collapses. Steady-state acoustic streaming (Rayleigh/Eckart) at ~1 MPa is
mathematically **insufficient** to sustain that velocity — Prediction P8 remains the flagged open frontier
(§9) — so the ~7 m/s is not a continuous state but an **episodic, impulse-driven transient**: the storm
reservoir rocks the fluid into the gating regime. The device is therefore **storm-gated**. There is **no
bootstrap paradox** in the startup: the arc is struck by the ≈ 20 kV atmospheric input (the corona/charge-
accumulation stage, §5), *not* by the slosh, and the lodestone field is **permanent** — present at full
strength from the outset, with nothing to build up — so the slosh never has to light the arc from a weak
field. The pressurised cell sets the stable operating point.

*Timing (phase lock).* Commutation needs the strike pulse; staying **synchronised** to the 50 Hz needs only
the phase, and that is held continuously. A mercury-vapour arc switches cleanly only at low pressure while
the granite reads as a vessel only at high pressure, so the jobs are split into an inner (≤ 1 Pa) sleeve and
an outer (~1 MPa) shell (wall FOS ≈ 1.44). The liquid mercury never breaches that barrier: its slosh
couples to the sealed arc **electrically** — in series in the chopper loop through a sealed feedthrough, as
in every mercury-arc rectifier — so the motional EMF modulates the arc's operating point without any
mechanical interface across the pressure boundary. The fair-weather slosh's ≈ 0.35 mV phase signal
(v ≈ 2.5 mm/s, B ≈ 0.16 T, L ≈ 0.87 m) sits far below the ~0.1 V broadband arc noise but is recovered as a
50 Hz **phase reference** by the sealed cavity's high-Q lock-in — it tracks the phase, it does not commutate:

    V_phase = vBL,   Δf = f/Q ≈ 0.0054 Hz,   gain = √(B_noise/Δf) ≈ 1361,   SNR_in-band ≈ 18   (35)

This reference is *not* a control loop chasing the chaotic storm waveform. The 50 Hz timing **is the struck
mercury bell**: a Q ≈ 9320 mechanical resonator that, hit by a broadband strike impulse, rings cleanly at its
own eigenfrequency for thousands of cycles, filtering the storm's spectral chaos mechanically — a bell rings
at its tuned pitch however messy the clapper-strike. The storm is the kinetic trigger (it rings the bell and
delivers the commutation amplitude); the clock is the bell, tuned to the *global* Schumann line, not the
local leader.

**The inner sleeve survives its environment.** The two-envelope split makes the inner sleeve the single
most-stressed component: a vacuum capillary submerged in the ≈ 1 MPa, 517 °C, 50 Hz-sloshing mercury, under
crush, thermal gradient, and dynamic load at once. It is sized as a thick-walled small-bore corundum/sapphire
capillary (bore ≈ 25 mm, wall ≈ 1.5 mm, t/r ≈ 0.12), and each load clears with margin:

    P_cr = E/[4(1−ν²)]·(t/r)³,   σ_th = E·α·ΔT/[2(1−ν)],   v_req < v_cav (no cavitation)   (35a)

*Crush* is governed by ovalisation **buckling**, not compression: at t/r ≈ 0.12 the critical pressure is
P_cr ≈ 160 MPa, a factor ≈ 120 over the 1 MPa static plus cyclic head. *Thermal* is the sleeve's strong suit,
because it is a **heat-exchanger** into the near-isothermal boiling-mercury sink, not an insulator: the
operating through-wall gradient is only ≈ 16 K (the wall sheds ≈ 200 kW at its limit), the inner face stays far
below the strain point, and the gradient stress carries a factor ≈ 20. *Dynamic* hammering is **designed out**
by the very pressurisation that created the differential: the 1 MPa cell lifts the cavitation cap to
v_cav ≈ 12 m/s, above the commutation slosh v_req ≈ 7 m/s, so the fluid never cavitates and only the cyclic
dynamic head (≈ 33 % of the static) remains, inside the buckling margin. Corundum is chosen over fused quartz
for heat extraction (k ≈ 30 vs 1.4 W/m·K) and is period-plausible (emery; attested hard-stone lapidary
drilling); fused quartz is the thermal-shock-tolerant alternative. The sleeve is the most-stressed part, but
an engineerable pressure vessel, not a single-point-of-failure.

Extraction routes through the mercury and shafts, the iron floor barely raising its conductivity
(Maxwell–Garnett, below percolation):

    σ_eff = σ(1 + 2fβ)/(1 − fβ),   P_eddy = πσω²B²R⁴t/8,   R_shaft = L/(σA)      (36)

Reading the pressure off the hardware (6″ walls + locking pins ⇒ ~1 MPa) implies a hot, MW-class,
strike-charged reactor; with r ≡ the wall span/thickness aspect ratio:

    1/T = 1/T₀ − (R_sp/L)ln(P/P₀) ⇒ ≈ 517 °C,   σ_wall = kP(b/t)²,
    m_vap = P_avail/[f(L_vap + c_p ΔT)]                                        (37)

Holding the static pressure is free; the only continuous cost, if the MPa is hot vapour, is the wall
conduction leak P_thermal = kA·ΔT/t ≈ 59 kW.

**Continuous operation and the chamber's thermal steady state [WP-§13.3].** Because the device runs
continuously, that 59 kW is a *continuous* load, which raises a fair objection: would the room cook
itself, destroy the temperature-sensitive lodestone field, and detune the resonant mode? Solving the
steady state answers both. The leak **self-limits** (kA·ΔT/t shrinks as the chamber warms and the
gradient T_cell − T_chamber collapses), and the air shafts are a real **chimney** (a ~35 m flue whose
draft, and so its cooling, grows as ΔT^1.5). Their crossing, leak(T) = chimney(T), settles the chamber at
**≈ 150 °C** (the leak falling to ≈ 45 kW, met by the draft) — warm, not runaway. At that temperature
magnetite still holds ≈ 90% of its remanence, so the coil-free field is ≈ 0.157 T, comfortably above the
pressurised gate threshold ≈ 0.09 T: the **Curie objection fails**. The air sound speed is up ≈ 17%, so the
bare n=3 *air* mode drifts from ≈ 50 Hz cold to ≈ 59 Hz hot — but that is only the **upper bound**, because
the air mode is not the operating resonance. It is coupled to the coffer **mercury slosh**, which is heavy
(≈ 15× the chamber-air modal mass) and thermally pinned (the mercury is always at 517 °C). Solving the 2×2
coupled-oscillator bell, the operating mode is the **mercury-dominated** one, and the dense mercury anchors
it: it holds at **≈ 50.4 Hz (+0.8%)** at 150 °C, against the air mode's +18%, and stays inside ±1% across the
whole plausible range of coupling (ε = 0.02–0.2) and mass ratio (8–30). So the **detuning objection is
largely answered by the coupling**: the operating clock barely moves; what degrades slightly is the
air↔slosh drive *efficiency*, not the frequency. The geometry and heat-transfer coefficients are estimates;
the ordering (field survives, coupled bell holds) is robust to them.

## 11. The telluric chopper (Machine C)

In the high-power reading the running slosh switches a regional telluric supply across a resistive
geological dam. A two-electrode tap of separation L in field E, with electrode radius a:

    V_oc = EL,   R_source = 1/(πσa),   P = V_oc²/(4R_source)                    (38)

so V_oc ≈ 100 V at 1 V/km over 100 km. Self-consistency requires the Joule heat to pay the thermal tax
— a measurable geophysical condition:

    R_source ≤ V_oc²/(4·P_thermal) ≈ (100 V)²/(4·59 kW) = 42 mΩ                 (39)

met by electrode area: a wet footprint of radius a_eff ≈ 115 m in brackish water gives

    R_wet = 1/(πσ a_eff) ≈ 2.8 mΩ                                              (40)

In the running state the horizontal telluric field arises magnetotellurically through the Cagniard
surface impedance, with ρ_e = 1/σ the ground resistivity:

    Z = √(ωμ₀ρ_e),   E = Z(B/μ₀),   J = σE,   P_circ = ωE_ch/Q                  (41)

and the telluric power is far below the chamber power, so it is a phase clock, not the fuel.

**Maintaining the ground (and the salt that marks it).** The low source resistance is not a surface
pond fighting evaporation; it is the subsurface damp limestone coupled to the water table, whose pore
conductivity follows Archie's law, σ_rock = σ_water/F with formation factor F = φ^(−m) (φ = porosity,
m ≈ 2). This sharpens the question — fresh brackish saturation leaves the rock *above* the ceiling,
and only *concentrated* brine clears it:

    F ≈ 25,   R = 1/(πσ_rock a_eff):   ≈ 69 mΩ (fresh brackish, σ_w≈1) — fails;
                                       ≈ 3 mΩ  (concentrated brine, σ_w≈22) — works        (42)

The brine concentrates precisely because rising damp evaporates inside the rock, depositing salt — so
the salt is the mechanism, not decoration. The recharge to grow the observed ~1 cm Queen's-Chamber
halite over ~4500 yr is ≈ 0.5 mm/yr, a trivial capillary/vapour flux: the aquifer maintains the ground
and a moat would only help, not be required. This also yields a decisive forensic the retracted granite
test never was: the hypothesis predicts a halite efflorescence horizon at the rising-damp level,
concentrated in sealed (un-ventilated) voids and absent from ventilated ones — the observed
Queen's-Chamber-yes / King's-Chamber-no pattern (F16, F17) — and a chemical test (groundwater/marine vs
construction/mortar origin) decides it.

## 12. Energy storage and distribution

The subterranean reservoir banks a fraction of each strike and delivers on demand (a season banks
~MWh):

    capacity = m_water·(H₂ fraction)·HHV,   bank = η·E_strike,   P_burst = banked/t_draw   (42)

The 50 Hz output is a coherent *local* source; a near-field resonant link can carry it to a co-located
tuned receiver, conservation-bounded, with no specific terminal load asserted:

    k(d) = k₀a³/(d²+a²)^(3/2),   U = 2k√(Q_tx Q_rx),   P_rx = η(U)P_tx ≤ P_tx ≤ P_reservoir   (43)

The receiver and its end-use lie downstream of this model and are deliberately left unspecified.

Long-range broadcast fails on both paths — the structure is electrically tiny, and telluric delivery is
killed by skin depth and geometric spreading:

    λ = c/f ≈ 6000 km,   R_rad = 40π²(h/λ)² ≈ 0.24 µΩ,
    δ = √(2/(ωμσ)) ≈ 712 m,   ΔV = [I·L_rx/(2πσd²)]·e^(−d/δ)                    (44)

The device is a coherent local source, not a broadcaster.

## 13. System integration

The stages compose into one pipeline. The pressure the reservoir can hold is the inverse of the
sustain-power law:

    p_ach = √(2P ρ c² Q / (V ω))                                               (45)

The headline operating point is an input coupling η ≈ 0.014, a radiative ceiling ≈ 0.23 µW, a host
source resistance ≈ 2.8 mΩ, and a Machine-C output ≈ 438 kW — the ≈ 500 kW gated supply net of the
≈ 59 kW thermal tax and the ≈ 2.2 kW MHD-loaded gate drive (the permanent lodestone field draws no power, so
there is no field tax) — that sustains only when the dam holds and the field gates; the end-to-end conservation gate
(load ≤ reservoir) is satisfied. The always-on
device is a coherent µW–mW generator; the kW regime is conditional on §15.

## 14. Discussion and scope

The cavity-index conjecture says nothing about delivered energy. The always-available coupling is
µW-class; the kW regime is conditional on the unproven geophysical dam. The structural geometry is exact
algebra, not a physical result on its own. Every stage respects conservation: the flywheel, the buildup,
the link, and the chopper amplify peak, velocity, or coherence — never average power.

## 15. Conjectures

**The Badwal Conjecture (foundational).** The Earth–ionosphere ELF cavity has an effective
electromagnetic index that is not a free parameter but the self-consistent fixed point of its own
dispersive feedback — φ; equivalently, φ is the maximally-mode-stable operating point. Open and
admissible, not proven. Decisive test: the long-run time-average of the inverted index (Eq. 13)
converges to φ specifically. Free prediction: n_cav = √φ for any ELF cavity, independent of radius.

**The Machine-C device conjecture (system-level).** The pyramid is a Schumann-tuned host for a
plasma-gated telluric MHD chopper that delivers sub-megawatt power only when the regional source
resistance is low enough to self-heat. Its decisive falsifiers are two *geophysical* field tests with
model-derived thresholds (P = V_oc²/(4R) and required field √(4PR)/L): (1) a resistivity survey,
passing only if R ≤ 42 mΩ; (2) telluric monitoring — the field that keeps the gate lit (covering the
≈ 59 kW thermal tax) is ≈ 1 V/km, and because the lodestone field draws **no power**, net delivery adds only
the ≈ 2 kW gate drive, so the field to actually *run* is ≈ 1.05 V/km (a ≈ 61 kW total load) — still a
storm-level bar quiet fields (~5 mV/km) miss by orders of magnitude, making it a storm-gated burst source,
but the coil-free field removes the extra ≈ 0.9 V/km a driven winding would have demanded. (3) A third, *forensic*
test relocates from the coffer to the ground. A coffer forensic is not clean: the ~10⁴ K arc is
confined to the inner quartz/ceramic sleeve (the two-envelope cell, §10), and the bulk temperature
(≈ 517 °C) is below granite's α–β quartz inversion (573 °C), so **pristine granite is expected and does
not falsify the device** (correcting an earlier version). The decisive forensic is instead the salt the
grounding leaves behind: the rising brine that maintains the conductive footprint (§11, Eq. 42)
deposits a halite efflorescence horizon, concentrated in sealed voids and absent from ventilated ones —
the observed Queen's-Chamber-yes / King's-Chamber-no pattern (F16, F17) — whose chemistry (groundwater/marine vs
construction/mortar) is decidable. A clean, already-corroborated falsifier.

**Pricing the conjecture [WP-§19.2].** The ≈ 438 kW headline is conditional, and honesty requires
the *joint* odds, not just each link. We price them as a fault tree that separates three kinds of
term: the **premise** P(outfitted) — a prior, unfalsifiable by internal physics (the chamber's
looting in antiquity makes its emptiness uninformative, removing a point against and adding none
for); the **field-measurable** geophysics P(R ≤ 42 mΩ), P(storm field ≥ 1.9 V/km), which a survey
can drive toward 1 or refute; and the engineering **postulates** (cool arc, magnetite μ_r/leakage,
the 20 kV strike, period materials). With deliberately-explicit priors the technical feasibility
*given outfitting* is ≈ 0.3 %, **bottlenecked by the measurable ground resistance** — and a
successful resistivity-plus-telluric survey lifts it ≈ 67× to ≈ 22 %. The remaining cap is then the
premise prior: fieldwork moves the geophysics; only physical evidence moves the premise. The chamber
enters through **one computed likelihood ratio** — its functional **acoustic tuning**. The three
chambers whose inner dimensions are actually measured each carry a mode within ≈ 2 % of a **distinct**
Schumann harmonic: the **King's Chamber** at 49.1 Hz (3rd longitudinal mode) → n8 (50.0 Hz, ≈ 1.7 %),
the **Queen's Chamber** at its gabled apex 27.4 Hz (fundamental) → n4 (27.3 Hz, ≈ 0.4 %), and the
**Grand Gallery** at ≈ 21 Hz → n3 (20.8 Hz, ≈ 2.2 %). Those dimensions are not arbitrary: they are the
chambers' precise √5/√φ proportions read as a **resonator** rather than a shape — the proportion and
the tuning are the same design fact. The evidence is not "does one room have a mode near a line" — any
room does, the modes tile the band — but the **joint** event of three measured rooms landing on three
**distinct** lines. Its likelihood ratio is **computed, not assumed**, as the inverse of that joint
chance: from the band's 2 % coverage, granting each room one look-elsewhere overtone, the probability is
≈ **1 in 33** (`ladder_chance_probability`, a deterministic Monte Carlo over the distinct-line
assignment; the strict one-mode-per-room reading is rarer still, ≈ 1 in 230). The resulting **LR ≈ 33**
(clamped ≤ 50 so one coincidence cannot run away) lifts the premise ≈ 1.0 % → ≈ 25 %. A tomb has no
reason to proportion three chambers so their mechanical resonances land on a global electromagnetic
resonance, so this clue **favours the machine** — while the decisive remaining evidence is still the
geophysics, and the unfalsifiable outfitting premise is still the cap.

---

## Appendix A — Validation and completeness

The model is implemented as `phi-pyramid-cpp`. Two automated gates bind this paper to the code.

**Coverage gate** (`tests/check_whitepaper_coverage.py`), built on the same call-graph reachability
machinery as the package's device-wiring gate, computes the public symbols reachable from the single
device entry point `run_system()` — the device's entire mathematical surface (251 symbols) — and
requires each to be codified here under a validation identifier `[WP-§n.m]` (table below), failing if
the device uses a mechanism the paper omits.

**Numeric gate** (`tests/test_whitepaper.cpp`) recomputes each tabulated value from the live
implementation under `-Werror -Wconversion`, checking the closed-form relation (to 10⁻¹²–10⁻¹⁵) and the
operating value (within a band).

**What the gates do and do not establish.** These gates prove *internal consistency* — that the code
computes what the equations state, and that the paper omits no part of the device's mathematical
surface. They do *not* establish that the equations describe physical reality, or that the device ever
existed at Giza. A flawlessly tested model can still describe a machine that does not work or was never
built. The physical and historical claims are exactly the two conjectures (§15), settled by the field
tests there — the resistivity survey and the telluric duty cycle — not by these gates.

```
cmake -S . -B build -DPHI_PYRAMID_BUILD_TESTS=ON && cmake --build build -j
ctest --test-dir build --output-on-failure -R "whitepaper|coverage"
```

Status: **EXACT** = algebraic consequence of Eq. (1) or an exact textbook relation; **APPROX** = named
~0.1 % near-coincidence; **COMPUTED** = parameter-dependent model output.

| ID | Quantity | Status | Value |
|---|---|---|---|
| [WP-§3.3] | Height from base, h = (b/2)√φ | EXACT | 146.54 m |
| [WP-§4.2] | Schumann spectrum; f₈ | COMPUTED | 49.96 Hz |
| [WP-§4.4] | Fixed point Q = 1+1/Q | EXACT | φ (attractor) |
| [WP-§4.5] | Most-stable index in band | EXACT | φ |
| [WP-§4.7] | e-side dynamics γ, τ, Q/π | EXACT | — |
| [WP-§4.8] | Cited two-height index | COMPUTED | 1.69 ∈ [1.5,2.0] |
| [WP-§4.9] | Spectrum inversion Q(n), Q* | COMPUTED | wide spread |
| [WP-§5.1] | Capstone collector Q = CV | EXACT | — |
| [WP-§5.2] | Corona (Peek law, β, i) | COMPUTED | µW (fair) |
| [WP-§5.3] | RC accumulation tank | COMPUTED | MV (insulated) |
| [WP-§5.4] | Conduction path, earth circuit | EXACT | kV drop |
| [WP-§6.1] | Footprint × Poynting ceiling | COMPUTED | 0.23 µW |
| [WP-§6.2] | Atmospheric-circuit pump | COMPUTED | ~mW |
| [WP-§6.3] | Storm / strike reservoir | COMPUTED | MV tap |
| [WP-§6.4] | Maxwell-stress FM pump | EXACT | — |
| [WP-§7.1] | Coupling chain η | COMPUTED | 0.014 |
| [WP-§7.2] | φ impedance ladder | EXACT | — |
| [WP-§7.3] | Electrostriction vs piezo | COMPUTED | k²Q ≈ 0.1 |
| [WP-§8.1] | Chamber φ-identity; f₈ lock | EXACT | φ |
| [WP-§8.2] | Slosh alternator velocity | COMPUTED | 2.0×10⁻⁴ m/s |
| [WP-§8.3] | Density-contrast flywheel | COMPUTED | 6.38× |
| [WP-§8.4] | Nonlinear self-sustain | EXACT | — |
| [WP-§8.5] | Bootstrap energetics | COMPUTED | — |
| [WP-§9.1] | Coupled-mode η(U); g_eff | EXACT | 0.64; 3.70× |
| [WP-§10.1] | Resonant buildup | COMPUTED | — |
| [WP-§10.2] | Pulsed accumulation | EXACT | — |
| [WP-§10.3] | Self-sustain (Barkhausen) | COMPUTED | \|Aβ\| ≈ 10⁻⁵ |
| [WP-§10.4] | Steady-state maintenance | COMPUTED | — |
| [WP-§11.1] | MHD EMF, power density, Hartmann | EXACT/COMPUTED | 52 mV; Ha ≈ 2350 |
| [WP-§12.1] | ∩-yoke field (permanent lodestone, coil-free; driven winding dormant) | EXACT/COMPUTED | live ~0.16 T, 0 kW (pressurised); driven counterfactual 0.6 T / ~148 kW |
| [WP-§12.2] | Two-envelope wall FOS + inner-sleeve survivability (crush/thermal/slosh) | COMPUTED | wall 1.44; sleeve buckling ~120, thermal ~20, no cavitation |
| [WP-§12.3] | Phase-lock gate SNR (continuous timing) | COMPUTED | ~18; 1361× |
| [WP-§12.4] | Maxwell–Garnett extraction | COMPUTED | ~W |
| [WP-§13.1] | Pressure regime, sat. temp | COMPUTED | 517 °C |
| [WP-§13.2] | Reactor feasibility | COMPUTED | mg-scale |
| [WP-§13.3] | Sealed-hold thermal leak | COMPUTED | 59 kW |
| [WP-§14.1] | Telluric tap V, R, P | EXACT | 100 V |
| [WP-§14.2] | Dam self-heating threshold | COMPUTED | 42 mΩ |
| [WP-§14.3] | Wetted-base electrode | COMPUTED | 2.8 mΩ |
| [WP-§14.6] | Subsurface brine ground + salt | COMPUTED | 69→3 mΩ; 0.5 mm/yr |
| [WP-§14.4] | Gated micro-slosh tap | COMPUTED | µW–W |
| [WP-§14.5] | Magnetotelluric drive | COMPUTED | phase clock |
| [WP-§15.1] | Electrochemical store | COMPUTED | ~MWh |
| [WP-§16.1] | Near-field resonant link | EXACT | η ≈ 0.86 |
| [WP-§17.1] | Broadcast verdict | COMPUTED | λ ≈ 6000 km |
| [WP-§18.1] | Integrated pipeline (net of thermal tax + gate; field is free) | COMPUTED | 438 kW |
| [WP-§19.1] | Falsification thresholds | COMPUTED | 42 mΩ; 1 V/km; 517 °C |
| [WP-§19.2] | Feasibility pricing (premise vs fieldwork; acoustic ladder LR~33) | COMPUTED | given-built ~0.3%→~22% post-survey; premise ~1%→~25% |

## References

1. W. M. Flinders Petrie, *The Pyramids and Temples of Gizeh*, Field & Tuer (1883).
2. W. O. Schumann, *Z. Naturforsch. A* **7**, 149 (1952); NASA-cited modal values.
3. V. C. Mushtak and E. R. Williams, *J. Atmos. Sol.-Terr. Phys.* **64**, 1989 (2002).
4. C. Greifinger and P. Greifinger, *Radio Sci.* **13**, 831 (1978).
5. A. Kurs et al., *Science* **317**, 83 (2007).
6. F. W. Peek, *Dielectric Phenomena in High Voltage Engineering*, McGraw-Hill (1929).
7. L. D. Landau and E. M. Lifshitz, *Mechanics*, 3rd ed., §27, Pergamon (1976).
8. H. Rissik, *Mercury-Arc Current Convertors*, Pitman (1941).

---

*© 2026 Phi-Coherent Inc. All rights reserved. Published under AGPLv3, commercial licensing available. phicoherent.com*
