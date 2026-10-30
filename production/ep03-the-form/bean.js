// Bean People v2 — one construction system for the whole cast.
// A character is one smooth egg ("bean") + a face kit (eyes, capsule brows, parametric mouth, blush, sweat)
// + stubby stroked arms + tiny feet. Every surface feature is placed on the bean by longitude (φ) so the same
// code draws front, 3/4 and side views. All lengths are fractions of the character height H.
import { P, SKIN, HAIR, SHADE, mix, rgba, dark, light, formed, ell, smooth, poly, contact, rr } from './kit.js';
import { lerp, clamp } from '/core/lib.js';

const PI = Math.PI;
export const CAST = {
  youssef: { id: 'youssef', H: 300, a: .352, taper: .11, n: 2.5, skin: SKIN.youssef, hair: HAIR.youssef, brow: HAIR.youssef,
    band: P.navy, sleeve: P.navy, cuff: dark(P.navy, .3), shoe: '#3B2C34', hairE: .035, blush: '#E2564E', blushA: .5, lash: P.ink, accent: P.navy },
  // mia = Sara, the teacher (design v3): the internal id stays `mia` (timeline who / talk / mouth); only the displayed name changed
  mia: { id: 'mia', H: 276, a: .352, taper: .15, n: 2.4, skin: SKIN.mia, hair: HAIR.mia, brow: '#94381C',
    band: P.mustard, sleeve: P.mustard, cuff: dark(P.mustard, .18), shoe: P.red, hairE: .045, blush: '#FF7E76', blushA: .55, lash: P.ink, accent: P.mustard },
  // episode 3: Mrs. Lopez, the school receptionist (≈ 60): a silver bun on the crown, red round glasses, a cream blouse with a collar
  // under a sage-teal cardigan (teal + leaf, the palette mix), a navy-pastel skirt. Same egg, a touch wider and rounder.
  lopez: { id: 'lopez', H: 270, a: .368, taper: .14, n: 2.35, skin: '#D69A6E', hair: '#C9C3D6', brow: '#8C8499',
    band: mix(P.teal, P.leaf, .42), sleeve: mix(P.teal, P.leaf, .42), cuff: dark(mix(P.teal, P.leaf, .42), .2), shoe: P.navy, hairE: .04,
    blush: '#E8786C', blushA: .45, lash: P.ink, accent: P.red, glasses: P.red },
};

// ---------------- expressions (face kit presets; all numeric so they can be blended) ----------------
const F0 = { bLy: 0, bLr: .05, bRy: 0, bRr: .05, eye: 1, lid: 0, lidT: 0, happy: 0, lx: 0, ly: 0, pupil: 1,
  mw: .075, mo: 0, ms: .4, mwob: 0, mt: 0, masym: 0, mround: 0, mlip: 0, mtng: 0, blush: .35, lines: 0, sweat: 0 };
export const EXPR = {
  neutral:     { ...F0 },
  happy:       { ...F0, bLy: .55, bRy: .55, bLr: .12, bRr: .12, happy: .45, mw: .13, mo: .065, ms: 1, mt: .45, blush: .6 },
  joy:         { ...F0, bLy: .7, bRy: .7, bLr: .15, bRr: .15, happy: 1, mw: .13, mo: .07, ms: 1, mt: .4, blush: .7 },
  talk:        { ...F0, bLy: .35, bRy: .35, mw: .1, mo: .07, ms: .45, mt: .35, blush: .45 },
  talkE:       { ...F0, bLy: .3, bRy: .3, mw: .125, mo: .04, ms: .55, mt: .7, blush: .45 },
  talkO:       { ...F0, bLy: .45, bRy: .45, mw: .055, mo: .06, ms: 0, mt: 0, blush: .45 },
  nervous:     { ...F0, bLy: .45, bRy: .45, bLr: .6, bRr: .6, pupil: .8, lx: -.3, mw: .13, mo: .042, ms: .55, mt: 1, blush: .45, sweat: .7 },
  worried:     { ...F0, bLy: .2, bRy: .2, bLr: .6, bRr: .6, lid: .1, mw: .085, ms: -.25, mwob: 1, blush: .4 },
  puzzled:     { ...F0, bLy: .95, bLr: -.05, bRy: -.35, bRr: -.32, lx: .25, ly: -.2, mw: .06, ms: -.15, masym: .55, blush: .35 },
  embarrassed: { ...F0, bLy: .5, bRy: .5, bLr: .8, bRr: .8, happy: .38, lx: -.5, ly: .5, pupil: .9, mw: .1, ms: .3, mwob: 1, blush: 1, lines: 1, sweat: 1 },
  surprised:   { ...F0, bLy: 1, bRy: 1, bLr: .1, bRr: .1, pupil: .8, mw: .055, mo: .07, ms: 0, blush: .4 },
};
export function blendFace(a, b, t) { const o = {}; for (const k in F0) o[k] = lerp(a[k] ?? F0[k], b[k] ?? F0[k], t); return o; }

// ---------------- v2 arm poses (the stick arm, kept for ARMS = 'v2'): hand offset from the shoulder, bend, wave ----------------
export const ARMV2 = {
  rest:    { dx: .075, dy: .165, bend: .12, w: 0 },
  out:     { dx: .17, dy: .07, bend: .1, w: 0 },          // holding a suitcase handle
  wave:    { dx: .15, dy: -.24, bend: -.18, w: 1 },
  up:      { dx: .1, dy: -.3, bend: -.12, w: 0 },
  chest:   { dx: -.27, dy: .07, bend: -.32, w: 0 },          // across the body onto the chest
  scratch: { dx: -.03, dy: -.37, bend: .42, w: 0 },          // up to the side of the head
  shrug:   { dx: .17, dy: -.02, bend: .45, w: 0 },
  hip:     { dx: .1, dy: .13, bend: -.6, w: 0 },
};
// an arm pose blend that carries the A2 fields: bend (min elbow bend, deg), flex, elv (elbow-side hint), front (drawn in front:
// switches at the midpoint), el. Missing fields take the A2 defaults so a bare {dx, dy, w} pose blends like any other.
const ARMDEF = { dx: 0, dy: 0, w: 0, bend: 35, flex: .8, elv: [1, .5], front: 0 };
export const normArm = A => ({ ...ARMDEF, ...A, elv: A.elv || ARMDEF.elv, front: +(A.front || 0) });
// front is a 0..1 amount (A3 cross-fades the far arm between behind and in front of the body); tau = the follow time of a snap pose
export const blendArm = (a, b, t) => {
  const A = normArm(a), B = normArm(b);
  const o = { dx: lerp(A.dx, B.dx, t), dy: lerp(A.dy, B.dy, t), w: lerp(A.w, B.w, t), bend: lerp(A.bend, B.bend, t), flex: lerp(A.flex, B.flex, t),
    elv: [lerp(A.elv[0], B.elv[0], t), lerp(A.elv[1], B.elv[1], t)], front: lerp(A.front, B.front, t) };
  const tau = t > .5 ? B.tau : A.tau; if (tau) o.tau = tau;
  const el = t > .5 ? B.el : A.el; if (el) o.el = el;
  return o;
};

export function pose(o = {}) {
  return Object.assign({ x: 0, y: 0, k: 1, turn: 0, sq: 1, lean: 0, lift: 0, face: EXPR.neutral, armL: ARM.rest, armR: ARM.rest,
    wave: 0, footL: 0, footR: 0, pony: 0, quiff: 0, breathe: 0, shadow: 1 }, o);
}

// ======================================================================================================================
// Design v3 — arm options. ARMS = 'v2' (the episode 1/2 stick arm) | 'A' (jointed, tapered, 2-bone IK elbow) |
// 'B' (bendy S-curved tube, no elbow) | 'C' (short stubby jointed). All three share: a fixed shoulder anchor on the
// silhouette at .375 H (with a shoulder bump drawn into the body), a taper from the shoulder to the wrist, a cuff in the
// sleeve colour, the round skin hand 15 % bigger, and both arms always visible (the far arm's hand comes out in front).
export let ARMS = 'A3';   // the episodes use A3: the A2 look on one smooth curve with a biased, never-flipping elbow (see armGeoA3)
export function setArms(m) { ARMS = m; }
export const ARMCFG = {
  A: { L1: .175, L2: .165, wS: .076, wW: .046, elbow: true, stretch: 1.12, name: 'A · jointed tapered arm' },
  B: { L1: .175, L2: .165, wS: .076, wW: .046, elbow: false, stretch: 1.12, name: 'B · bendy sleeve arm' },
  C: { L1: .125, L2: .115, wS: .08, wW: .052, elbow: true, stretch: 1.1, name: 'C · short stubby jointed arm' },
  // A2: the revision of A. Shoulder on the egg's widest band (.43 H) with a sleeve cap ON the silhouette (the far cap peeks at
  // the far edge), bones .17 + .16 H, a per-pose minimum elbow bend (the hand is pulled in rather than the arm straightened),
  // elbow-side hints, the hold pose with both forearms in front of the body, a 20 % bigger hand with a thumb bump, the sleeve
  // with a drawn crescent + rim light (form: 'drawn'; form: true runs the real blur pass, which costs ≈ 5 ms per character)
  // and a soft overlap shadow on the body.
  A2: { L1: .17, L2: .16, wS: .076, wW: .046, elbow: true, stretch: 1.0, sy: .43, cap: 1.3, form: 'drawn', x2: true, name: 'A2 · jointed tapered arm (revised)' },
  // A3: the hybrid. A2's shoulder cap on the silhouette, taper (.07 → .045 H), cuff, bigger hand with the thumb, drawn shading and
  // overlap shadow — but the arm is ONE cubic from the cap to the hand whose bend point is a continuous "elbow bias" per pose
  // (never a solved joint, so it can never flip), with a reach of .33 H and a minimum bend per pose. Arm state is smoothed over
  // time in act.js (smoothArms), and a far arm cross-fades between behind and in front of the body (front 0..1).
  A3: { L: .33, wS: .07, wW: .045, sy: .43, cap: 1.3, form: 'drawn', x2: true, a3: true, name: 'A3 · smooth biased-elbow arm' },
};
// A2 pose extras: bend = minimum elbow bend (degrees), elv = elbow side hint in (outward, down), front = drawn in front of the body
const X2 = {
  rest: { bend: 14, elv: [-1, .35], flex: 0 },    // owner's review: at rest the upper arm hangs near-vertical from the cap, the elbow sits low and points
                                                   // down/slightly back (into the body, never up-out), the forearm continues down with a small natural bend out: { bend: 30, elv: [1, .6], flex: .6 }, wave: { bend: 55, elv: [1, 1], flex: 1 },
  up: { bend: 35, elv: [1, .4], flex: 1 }, chest: { bend: 45, elv: [.2, 1], flex: .8, front: true },   // the hand on the chest is drawn in front even from the far shoulder scratch: { dx: -.02, dy: -.4, bend: 60, elv: [1, -.5], flex: 1 },
  shrug: { bend: 45, elv: [1, .8], flex: 1 }, hip: { bend: 60, elv: [1, .2], flex: 1 },
  hold: { dx: -.03, dy: .05, bend: 70, elv: [1, 1], flex: 1, front: true },   // elbows at the body, forearms up across the chest
  point: { bend: 35, elv: [.1, 1], flex: 1 }, door: { bend: 35, elv: [1, .5], flex: 1 },
};
export const X2P = X2;
// A3 elbow biases (outward, down) where they differ from the A2 hints: rest hangs with the elbow down/back against the body,
// holds go out/down, scratch and the facepalm up/back, the wave out/up (upper arm out, forearm up)
const X3 = { wave: { elv: [1, -.2] }, up: { elv: [1, -.1] }, scratch: { elv: [.8, -.6] }, point: { elv: [.3, 1], tau: .08 }, hold: { elv: [1, 1] }, door: { elv: [1, .2] } };
// the episodes' pose table: every A2 pose (hand target + its extras) under the old names, so ARM.rest / ARM.wave… work everywhere
export const ARM = {};
// v3 poses: hand target from the shoulder (dx outward, dy down, fractions of H); el = elbow side override (+1 outward / -1);
// app = the direction the forearm arrives from, for the bendy arm (B); the v2 poses are reused when a v3 one is missing
export const ARM3 = {
  rest:    { dx: .03, dy: .2, w: 0, app: [.2, 1], flex: .25 },    // hanging ≤ 15° from vertical, the hand resting beside the hip
  out:     { dx: .17, dy: .08, w: 0, app: [.4, 1], flex: .5 },
  wave:    { dx: .17, dy: -.21, w: 1, app: [.15, -1], flex: 1 },
  up:      { dx: .1, dy: -.3, w: 0, app: [.2, -1], flex: .8 },
  chest:   { dx: -.21, dy: .06, w: 0, app: [-1, .3], flex: .5 },
  scratch: { dx: -.03, dy: -.395, w: 0, app: [-.4, -1], flex: 1 },
  shrug:   { dx: .19, dy: -.02, w: 0, app: [.6, -1], flex: .8 },
  hip:     { dx: .1, dy: .14, w: 0, app: [-1, .6], flex: .9 },
  hold:    { dx: .17, dy: -.04, w: 0, app: [.25, -1], flex: .6 },      // a cup held in front, forearm up
  point:   { dx: .3, dy: -.1, w: 0, app: [1, -.1], flex: 1 },
  door:    { dx: .18, dy: -.5, w: 0, app: [.2, -1], flex: .8 },
};
for (const k in ARM3) ARM[k] = { ...ARM3[k], ...(X2[k] || {}), ...(X3[k] || {}) };
// A3 geometry: one cubic from the shoulder cap to the hand. The bend point E sits off the chord's midpoint along the pose's elbow
// bias by `lat`: at least the pose's minimum bend (bend°, as if two .165 H bones), more with flex (0 = the minimum, 1 = the full
// bones). The hand is pulled in to the reach of that minimum bend. Everything is continuous in the pose fields, so smoothing the
// fields over time (act.js) gives continuous motion with no IK side flips.
function armGeoA3(sp, p, G) {
  const cfg = ARMCFG.A3, H = G.H, ys = -cfg.sy * H, L = cfg.L * H, out = [];
  for (const s of [-1, 1]) {
    const A = normArm(s < 0 ? p.armL : p.armR);
    const phi = s * PI / 2, ps = phi + G.th, c = Math.cos(ps), sn = Math.sin(ps), sg = Math.sign(sn) || s;
    const far = c < -.2, fk = far ? clamp(A.front) : 1;   // fk: how much of the arm is drawn in front of the body
    // the anchor on the silhouette: the far cap at the far edge, sliding to the near-arm anchor as the arm comes in front
    const sx = G.hw(ys) * lerp(.95, .72 + .28 * Math.abs(sn), fk) * sg;
    const S = G.D(sx, ys);
    let dx = A.dx * H * s, dy = A.dy * H + .004 * H * (p.breathe || 0);   // the idle arm breathes with the body
    if (far) { dx += s * .03 * H * (1 - fk); dy += .06 * H * (1 - fk); }   // a hanging far arm sits a touch forward so its hand peeks past the body edge
    let drag = 0;
    if (A.w > .001) {   // the wave: the hand swings, the elbow follows a little behind (sleeve drag)
      const ph = p.wave * 2 * PI, ang = Math.sin(ph) * .45 * A.w, r = Math.hypot(dx, dy) * .35;
      dx += Math.sin(ang) * r * s; dy += (1 - Math.cos(ang)) * r * .5; drag = Math.sin(ph - .7) * .03 * H * A.w * s;
    }
    let T = [S[0] + dx, S[1] + dy];
    const b = clamp(A.bend, 4, 150) * PI / 180, dmax = L * Math.cos(b / 2), dmin = .06 * H;
    let d = Math.hypot(T[0] - S[0], T[1] - S[1]) || 1;
    if (d > dmax) { T = [S[0] + (T[0] - S[0]) * dmax / d, S[1] + (T[1] - S[1]) * dmax / d]; d = dmax; }
    if (d < dmin) { T = [S[0] + (T[0] - S[0]) * dmin / d, S[1] + (T[1] - S[1]) * dmin / d]; d = dmin; }
    const latMin = L / 2 * Math.sin(b / 2), latFull = Math.sqrt(Math.max(0, L * L / 4 - d * d / 4)), lat = lerp(latMin, Math.max(latMin, latFull), clamp(A.flex));
    let ex = A.elv[0] * s, ey = A.elv[1]; const en = Math.hypot(ex, ey); if (en < 1e-3) { ex = 0; ey = 1; } else { ex /= en; ey /= en; }
    const M = [(S[0] + T[0]) / 2, (S[1] + T[1]) / 2], E = [M[0] + ex * lat + drag, M[1] + ey * lat];
    const c1 = [lerp(S[0], E[0], .85), lerp(S[1], E[1], .85)], c2 = [lerp(T[0], E[0], .85), lerp(T[1], E[1], .85)];
    const fl = Math.hypot(T[0] - c2[0], T[1] - c2[1]) || 1, fdir = [(T[0] - c2[0]) / fl, (T[1] - c2[1]) / fl];
    const dir = [(T[0] - S[0]) / d, (T[1] - S[1]) / d];
    out.push({ s, S, E: null, Ec: E, Hd: T, far, frontK: fk, wave: A.w, c1, c2, cfg, dir, front: fk > .5, fdir });
  }
  return out;
}
function armGeo3(sp, p, G) {
  const cfg = ARMCFG[ARMS], H = G.H, ys = -(cfg.sy ?? .375) * H, out = [];
  if (cfg.a3) return armGeoA3(sp, p, G);
  for (const s of [-1, 1]) {
    let A = s < 0 ? p.armL : p.armR;
    if (cfg.x2 && A.x2) A = { ...A, ...A.x2 };
    const phi = s * PI / 2, ps = phi + G.th, c = Math.cos(ps), sn = Math.sin(ps), sg = Math.sign(sn) || s;
    let far = c < -.2;
    if (A.front) far = false;                             // holding in front: both forearms cross the chest, drawn in front
    // A2: the anchor sits on the silhouette (the near shoulder slides inward a little in a 3/4 view, the far cap peeks at the far edge)
    const sx = G.hw(ys) * (cfg.x2 ? (far ? .95 * sg : (.72 + .28 * Math.abs(sn)) * sg) : .92 * sn);
    const S = G.D(sx, ys);
    let dx = A.dx * H * s, dy = A.dy * H;
    if (far) { dx += s * (cfg.x2 ? .03 : .13) * H; if (cfg.x2) dy += .06 * H; }   // the far arm hangs too, a touch forward so its hand peeks past the body edge
    if (A.w) { const ang = Math.sin(p.wave * 2 * PI) * .45 * A.w; const r = Math.hypot(dx, dy) * .35; dx += Math.sin(ang) * r * s; dy += (1 - Math.cos(ang)) * r * .5; }
    let T = [S[0] + dx, S[1] + dy];
    // reach: the two bones stretch up to `stretch`, then the hand is pulled in
    const L1 = cfg.L1 * H, L2 = cfg.L2 * H, Ls = L1 + L2;
    let d = Math.hypot(T[0] - S[0], T[1] - S[1]) || 1;
    const st = clamp(d / Ls, 1, cfg.stretch); let l1 = L1 * st, l2 = L2 * st;
    // flex: how far the elbow may stick out. A relaxed arm shortens its bones toward the chord (the elbow goes back in
    // depth, which a flat drawing cannot show), a deliberate bend (wave, scratch) keeps the full length
    const flex = A.flex ?? .8;
    if (cfg.elbow && d < Ls * .97) {
      // A2: the shortest bones give exactly the pose's minimum bend at this reach (flex 0); longer bones (flex → 1) bend more
      const b0 = cfg.x2 ? (A.bend ?? 35) * PI / 180 : 0, dm = Math.sqrt(L1 * L1 + L2 * L2 + 2 * L1 * L2 * Math.cos(b0)) || Ls;
      const f = lerp(Math.min(1, cfg.x2 ? d / dm : d / Ls * 1.03), 1, flex); l1 *= f; l2 *= f;
    }
    // A2: a minimum elbow bend. The hand is pulled toward the shoulder until the elbow shows a corner, never straightened
    let dmax = l1 + l2;
    if (cfg.x2 && cfg.elbow) { const b = (A.bend ?? 35) * PI / 180; dmax = Math.sqrt(l1 * l1 + l2 * l2 + 2 * l1 * l2 * Math.cos(b)); }
    if (d > dmax) { T = [S[0] + (T[0] - S[0]) * dmax / d, S[1] + (T[1] - S[1]) * dmax / d]; d = dmax; }
    const dmin = Math.abs(l1 - l2) + .02 * H;
    if (d < dmin) { T = [S[0] + (T[0] - S[0]) * dmin / d, S[1] + (T[1] - S[1]) * dmin / d]; d = dmin; }
    const dir = [(T[0] - S[0]) / d, (T[1] - S[1]) / d];
    let perp = [-dir[1], dir[0]];
    if (A.elv) { const hv = [A.elv[0] * s, A.elv[1]]; if (perp[0] * hv[0] + perp[1] * hv[1] < 0) perp = [-perp[0], -perp[1]]; }   // elbow-side hint (outward, down)
    else if (perp[0] * s < 0) perp = [-perp[0], -perp[1]];   // the elbow goes outward (toward the arm's own side), else down
    if (A.el) perp = [perp[0] * A.el, perp[1] * A.el];
    let E = null;
    if (cfg.elbow) {
      const ca = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1), a = Math.acos(ca);
      E = [S[0] + dir[0] * l1 * Math.cos(a) + perp[0] * l1 * Math.sin(a), S[1] + dir[1] * l1 * Math.cos(a) + perp[1] * l1 * Math.sin(a)];
    }
    // bendy arm: cubic S-curve; it leaves the shoulder going down/out and arrives along the pose's approach direction
    const app = A.app || [0, 1], an = Math.hypot(app[0], app[1]) || 1;
    const c1 = [S[0] + s * .06 * H + dir[0] * d * .2, S[1] + .14 * H + dir[1] * d * .15];
    const c2 = [T[0] - app[0] / an * s * d * .4, T[1] - app[1] / an * d * .4];
    out.push({ s, S, E, Hd: T, far, wave: A.w, c1, c2, cfg, dir, front: !!A.front, fdir: E ? [(T[0] - E[0]) / (Math.hypot(T[0] - E[0], T[1] - E[1]) || 1), (T[1] - E[1]) / (Math.hypot(T[0] - E[0], T[1] - E[1]) || 1)] : dir });
  }
  return out;
}
// a tapered tube along a sampled centre line
function tube(c, pts, w0, w1, off = [0, 0], k = 1) {
  const n = pts.length, L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const w = lerp(w0, w1, i / (n - 1)) * k / 2, x = pts[i][0] + off[0], y = pts[i][1] + off[1];
    L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]);
  }
  c.beginPath();
  c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]);
  for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
  c.closePath(); c.fill();
  const r0 = w0 * k / 2, r1 = w1 * k / 2;
  ell(c, pts[0][0] + off[0], pts[0][1] + off[1], r0, r0); c.fill();
  ell(c, pts[n - 1][0] + off[0], pts[n - 1][1] + off[1], r1, r1); c.fill();
}
function armPath(A) {
  const pts = [], N = 26, S = A.S, T = A.Hd;
  if (A.E) {   // jointed: straight bones with a short fillet at the elbow (a visible joint, not a kink)
    const E = A.E, P1 = [lerp(S[0], E[0], .72), lerp(S[1], E[1], .72)], P2 = [lerp(E[0], T[0], .28), lerp(E[1], T[1], .28)];
    for (let i = 0; i <= 8; i++) pts.push([lerp(S[0], P1[0], i / 8), lerp(S[1], P1[1], i / 8)]);
    for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; pts.push([u * u * P1[0] + 2 * u * t * E[0] + t * t * P2[0], u * u * P1[1] + 2 * u * t * E[1] + t * t * P2[1]]); }
    for (let i = 1; i <= 8; i++) pts.push([lerp(P2[0], T[0], i / 8), lerp(P2[1], T[1], i / 8)]);
    return pts;
  }
  for (let i = 0; i <= N; i++) {   // bendy: one cubic
    const t = i / N, u = 1 - t;
    pts.push([u * u * u * S[0] + 3 * u * u * t * A.c1[0] + 3 * u * t * t * A.c2[0] + t * t * t * T[0], u * u * u * S[1] + 3 * u * u * t * A.c1[1] + 3 * u * t * t * A.c2[1] + t * t * t * T[1]]);
  }
  return pts;
}
// the sleeve cap: a rounded shoulder, 1.3× the upper-arm width, centred on the anchor (A2)
function capAt(c, A, H, off = [0, 0], k = 1) {
  const r = A.cfg.cap * A.cfg.wS * H / 2 * k, P1 = A.Ec || A.E || A.Hd, ang = Math.atan2(P1[1] - A.S[1], P1[0] - A.S[0]);
  ell(c, A.S[0] + off[0], A.S[1] + off[1], r * 1.08, r * .92, ang); c.fill();
}
// the arm's whole silhouette (cap + tube) in one colour: the overlap shadow on the body
export function armSil(c, sp, A, H, off) {
  const cfg = A.cfg, pts = armPath(A);
  if (cfg.cap) capAt(c, A, H, off);
  tube(c, pts, cfg.wS * H, cfg.wW * H, off);
}
function drawArm3(c, sp, A, H) {
  const cfg = A.cfg, pts = armPath(A), wS = cfg.wS * H, wW = cfg.wW * H;
  // sleeve: a darker full tube, then the lit tube shifted toward the light (the v2 shading language, tapered)
  c.fillStyle = dark(sp.sleeve, .3); if (cfg.cap) capAt(c, A, H); tube(c, pts, wS, wW);
  c.fillStyle = sp.sleeve; if (cfg.cap) capAt(c, A, H, [-.011 * H, -.008 * H], .86); tube(c, pts, wS, wW, [-.011 * H, -.007 * H], .78);
  if (cfg.form === 'drawn') {   // rim light on the lit side (a thin tube further toward the light; it stays inside the sleeve by construction)
    c.fillStyle = rgba('#FFFBF0', .13); if (cfg.cap) capAt(c, A, H, [-.021 * H, -.015 * H], .5);   // rim light (−40 % from the sheet: no plastic-pipe shine) tube(c, pts, wS, wW, [-.02 * H, -.013 * H], .3);
  }
  // cuff: a band across the wrist
  const n = pts.length, e = pts[n - 1], q = pts[n - 3], ang = Math.atan2(e[1] - q[1], e[0] - q[0]);
  c.save(); c.translate(e[0] - Math.cos(ang) * .028 * H, e[1] - Math.sin(ang) * .028 * H); c.rotate(ang);
  rr(c, -.016 * H, -wW * .58, .034 * H, wW * 1.16, .012 * H); c.fillStyle = sp.cuff; c.fill();
  if (sp.id === 'youssef') { rr(c, .012 * H, -wW * .5, .01 * H, wW, .004 * H); c.fillStyle = P.cream; c.fill(); }
  c.restore();
  drawHand(c, sp, e[0], e[1], H, { dir: A.fdir });
}

// ---------------- geometry ----------------
function geo(sp, p) {
  const H = sp.H, g = .035 * H, cy = -(H + g) / 2, b = (H - g) / 2, a = sp.a * H, n = sp.n, tp = sp.taper;
  const th = p.turn * 1.3;
  const hw = y => { const v = clamp((y - cy) / b, -1, 1); return a * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(v), n)), 1 / n) * (1 + tp * v); };
  const sq = p.sq * (1 + .012 * p.breathe), sx = 1 / Math.sqrt(sq);
  const D = (x, y) => {                       // rest → local (squash/stretch about the ground, lean shear, hop lift)
    let Y = y * sq, X = x * sx; const h = Math.max(0, -Y / H); X += p.lean * H * Math.pow(h, 1.6); return [X, Y - p.lift];
  };
  const rotAt = y => Math.atan(p.lean * 1.6 * Math.pow(Math.max(.001, -y * sq / H), .6));
  const surf = (phi, y, inset = .96) => { const ps = phi + th; return { x: hw(y) * inset * Math.sin(ps), c: Math.cos(ps) }; };
  const outline = (e = 0, N = 140) => {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = i / N * 2 * PI, u = Math.sin(t), v = -Math.cos(t);
      const U = Math.sign(u) * Math.pow(Math.abs(u), 2 / n), V = Math.sign(v) * Math.pow(Math.abs(v), 2 / n);
      let x = a * U * (1 + tp * V), y = cy + b * V;
      x *= 1 + e; y = cy + (y - cy) * (1 + e * .55) - e * .2 * b;
      pts.push(D(x, y));
    }
    return pts;
  };
  // a line on the surface across the visible half (ψ ∈ [-π/2, π/2]); fn(φ) → rest y
  const across = (fn, N = 48, ext = 1) => {
    const pts = [];
    for (let i = 0; i <= N; i++) { const ps = -PI / 2 + PI * i / N, phi = ps - th, y = fn(phi); pts.push(D(hw(y) * Math.sin(ps) * ext, y)); }
    return pts;
  };
  return { H, g, cy, b, a, th, hw, D, rotAt, surf, outline, across, sq };
}
const wrap = phi => { phi = (phi + PI) % (2 * PI); if (phi < 0) phi += 2 * PI; return phi - PI; };
const sst = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// hairlines (rest y as a function of longitude)
function hairline(sp, phi) {
  const H = sp.H, f = wrap(phi), af = Math.abs(f);
  if (sp.id === 'youssef') {
    const base = lerp(-.868, -.655, Math.pow((1 - Math.cos(f)) / 2, .85));
    const fringe = .052 * Math.exp(-Math.pow((f + .1) / .2, 2)) - .012 * Math.exp(-Math.pow((f - .45) / .2, 2));   // side-swept fringe
    const temple = -.022 * Math.exp(-Math.pow((af - 1.05) / .2, 2));
    return (base + fringe + temple) * H;
  }
  if (sp.id === 'lopez') {   // swept back: a high soft front with a side part, down to the ears at the sides, short at the back (the bun holds the rest)
    const front = -.835 + .02 * Math.exp(-Math.pow((f - .35) / .25, 2)) - .012 * Math.exp(-Math.pow((f + .3) / .3, 2));
    let y = lerp(front, -.7, sst(.6, 1.15, af));
    y = lerp(y, -.62, sst(1.6, 2.4, af));
    return y * H;
  }
  // Sara (id mia): scalloped bangs in front, hair down to the temples at the sides, longer at the back (+ separate side tendrils)
  const bang = -.79 + .026 * Math.pow(Math.abs(Math.cos(f * 4.4 + .3)), .7) + .025 * f;
  let y = lerp(bang, -.75, sst(.72, .98, af));
  y = lerp(y, -.56, sst(1.7, 2.3, af));
  return y * H;
}

// ---------------- drawing ----------------
const sstA = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export function drawChar(ctx, sp, p) {
  const G = geo(sp, p), H = G.H, k = p.k;
  const toScreen = c => { c.translate(p.x, p.y); c.scale(k, k); };
  // contact shadow (stays on the ground while hopping, shrinks with lift)
  const st = p.stage ?? 9;
  if (p.shadow && st >= 3) { const s = 1 - clamp(p.lift / H) * .7; contact(ctx, p.x + .035 * H * k, p.y + .004 * H * k, .44 * H * k * s, .065 * H * k * s, .3 * p.shadow); }
  const bx = (sp.id === 'mia' ? .82 : .72) * H * k, box = { x: p.x - bx + p.lean * H * k * .6, y: p.y - 1.3 * H * k - p.lift * k, w: bx * 2, h: 1.38 * H * k + p.lift * k };
  const arms = armGeo(sp, p, G);
  formed(ctx, box, l => { l.save(); toScreen(l); bodyFlat(l, sp, p, G, arms); l.restore(); },
    { sx: .055 * H * k, sy: .03 * H * k, soft: .016 * H * k, shadeA: st >= 2 ? .55 : 0, hx: .016 * H * k, hy: .02 * H * k, hiA: st >= 2 ? .38 : 0,
      hy0: p.y - H * k, hy1: p.y - .55 * H * k, occl: st >= 2 ? .22 : 0, oy0: p.y - .3 * H * k, oy1: p.y });
  ctx.save(); toScreen(ctx);
  if (st >= 3) face(ctx, sp, p, G);
  const fkOf = A => A.frontK ?? (A.far ? 0 : 1), front = arms.filter(A => !A.far || fkOf(A) > .03);
  if (st >= 1 && front.length && front[0].cfg && front[0].cfg.form) {
    const real = front[0].cfg.form === true;
    // A2: a soft shadow where the arm lies over the body (clipped to the bean), then the sleeves through the form pass
    ctx.save(); smooth(ctx, G.outline()); ctx.clip(); ctx.fillStyle = rgba(SHADE, .25);
    for (const A of front) { ctx.globalAlpha = A.far ? sstA(fkOf(A)) : 1; armSil(ctx, sp, A, H, [.012 * H, .014 * H]); }
    ctx.restore();
    if (!real) { for (const A of front) { ctx.globalAlpha = A.far ? sstA(fkOf(A)) : 1; drawArm(ctx, sp, A, H); } ctx.restore(); return { G, hands: arms.map(A => [p.x + A.Hd[0] * k, p.y + A.Hd[1] * k]) }; }
    const P = front.flatMap(A => [A.S, A.E || A.S, A.Hd]), m = .1 * H;
    const bx0 = Math.min(...P.map(q => q[0])) - m, by0 = Math.min(...P.map(q => q[1])) - m, bx1 = Math.max(...P.map(q => q[0])) + m, by1 = Math.max(...P.map(q => q[1])) + m;
    formed(ctx, { x: bx0, y: by0, w: bx1 - bx0, h: by1 - by0 }, l => { for (const A of front) drawArm(l, sp, A, H); },
      { sx: .03 * H, sy: .018 * H, soft: .012 * H, shadeA: .5, hx: .012 * H, hy: .014 * H, hiA: .35, hy0: by0, hy1: by1 });
  } else if (st >= 1) for (const A of front) drawArm(ctx, sp, A, H);
  ctx.restore();
  return { G, hands: arms.map(A => [p.x + A.Hd[0] * k, p.y + A.Hd[1] * k]) };
}

function armGeo(sp, p, G) {
  if (ARMS !== 'v2') return armGeo3(sp, p, G);
  const H = G.H, ys = -.375 * H, out = [];
  for (const s of [-1, 1]) {
    const A = s < 0 ? p.armL : p.armR, phi = s * PI / 2, ps = phi + G.th, c = Math.cos(ps);
    const sx = G.hw(ys) * .9 * Math.sin(ps), far = c < -.2;
    const S = G.D(sx, ys);
    let dx = A.dx * H * s, dy = A.dy * H;
    if (A.w) { const ang = Math.sin(p.wave * 2 * PI) * .45 * A.w; const r = Math.hypot(dx, dy) * .35; dx += Math.sin(ang) * r * s; dy += (1 - Math.cos(ang)) * r * .5; }
    const Hd = [S[0] + dx, S[1] + dy];
    out.push({ s, S, Hd, bend: A.bend, far, wave: A.w });
  }
  return out;
}

function drawArm(c, sp, A, H) {
  if (A.cfg) return drawArm3(c, sp, A, H);
  const [sx, sy] = A.S, [hx, hy] = A.Hd, mx = (sx + hx) / 2, my = (sy + hy) / 2, len = Math.hypot(hx - sx, hy - sy) || 1;
  const nx = -(hy - sy) / len * A.s, ny = (hx - sx) / len * A.s;
  const cx = mx + nx * A.bend * len, cy = my + ny * A.bend * len, lw = .082 * H;
  c.lineCap = 'round'; c.lineJoin = 'round';
  const path = (o = 0) => { c.beginPath(); c.moveTo(sx + o, sy + o * .6); c.quadraticCurveTo(cx + o, cy + o * .6, hx + o, hy + o * .6); };
  c.strokeStyle = dark(sp.sleeve, .3); c.lineWidth = lw; path(); c.stroke();
  c.strokeStyle = sp.sleeve; c.lineWidth = lw * .72; path(-.012 * H); c.stroke();
  // cuff + hand
  const r = .047 * H;
  ell(c, hx, hy, r, r); c.fillStyle = mix(sp.skin, '#4B2E52', .32); c.fill();
  ell(c, hx - .009 * H, hy - .008 * H, r * .8, r * .8); c.fillStyle = sp.skin; c.fill();
  ell(c, hx - .02 * H, hy - .02 * H, r * .25, r * .2); c.fillStyle = rgba('#FFF6E8', .35); c.fill();
}

function bodyFlat(l, sp, p, G, arms) {
  const H = G.H, th = G.th, D = G.D;
  const st = p.stage ?? 9;
  // far arm (behind the body); in A3 it is skipped once the arm has fully come in front (frontK ≥ .97)
  if (st >= 1) for (const A of arms) if (A.far && (A.frontK ?? 0) < .97) drawArm(l, sp, A, H);
  // ponytail + tie (behind)
  if (sp.id === 'mia' && st >= 1) pony(l, sp, p, G);
  if (sp.id === 'lopez' && st >= 1) bun(l, sp, p, G);
  // feet
  for (const s of [-1, 1]) {
    const lift = (s < 0 ? p.footL : p.footR) * H, side = Math.abs(Math.sin(th));
    const fx = s * .12 * H * Math.cos(th) + Math.sin(th) * .06 * H + s * side * .02 * H;
    const [X, Y] = D(fx, -.03 * H - lift);
    ell(l, X, Y, lerp(.068, .085, side) * H, .043 * H, Math.sin(th) * -.12 + s * .05 * (1 - side) - (lift ? .25 * Math.sign(Math.sin(th) || s) : 0));
    l.fillStyle = sp.shoe; l.fill();
  }
  // bean
  const body = G.outline();
  smooth(l, body); l.fillStyle = sp.skin; l.fill();
  if (st < 1) return;
  l.save(); smooth(l, body); l.clip();
  clothes(l, sp, p, G);
  l.restore();
  // v3 shoulder bump: a small bulge of the sleeve at the anchor (part of the body's form pass)
  if (ARMS !== 'v2' && !(arms[0].cfg && arms[0].cfg.x2)) for (const A of arms) if (!A.far) { ell(l, A.S[0], A.S[1] + .004 * H, .058 * H, .046 * H, A.s * .25); l.fillStyle = sp.sleeve; l.fill(); }
  // hair (with a soft cast shadow on the forehead), clipped to a slightly inflated bean for volume
  const hl = phi => hairline(sp, phi);
  const line = G.across(hl, 64), big = G.outline(sp.hairE);
  const region = (dy = 0) => {
    const pts = line.map(q => [q[0], q[1] + dy]);
    pts.push([pts[pts.length - 1][0] + H, pts[pts.length - 1][1]], [H, -2 * H], [-H, -2 * H], [pts[0][0] - H, pts[0][1]]);
    return pts;
  };
  l.save(); smooth(l, body); l.clip(); poly(l, region(.02 * H)); l.fillStyle = rgba('#3A2152', .13); l.fill(); l.restore();
  l.save(); smooth(l, big); l.clip(); poly(l, region()); l.fillStyle = sp.hair; l.fill();
  // hair sheen: a soft arc on the lit side
  const [tx, ty] = D(G.hw(-.9 * H) * -.35 + Math.sin(th) * .05 * H, -.9 * H);
  l.strokeStyle = rgba('#FFFFFF', sp.id === 'mia' ? .2 : .13); l.lineWidth = .028 * H; l.lineCap = 'round';
  l.beginPath(); l.ellipse(tx + .07 * H, ty + .03 * H, .16 * H, .085 * H, -.2, PI * 1.12, PI * 1.42); l.stroke();
  l.restore();
  if (sp.id === 'youssef') quiff(l, sp, p, G); else if (sp.id === 'mia') tendrils(l, sp, p, G); else waves(l, sp, p, G);
}

function clothes(l, sp, p, G) {
  const H = G.H, th = G.th, D = G.D;
  if (sp.id === 'youssef') {
    // white T-shirt (crew neck), navy jacket band with a V opening and two lapels
    const tee = G.across(phi => (-.4 - .062 * Math.max(0, Math.cos(wrap(phi)))) * H, 40);
    poly(l, [...tee, [H, H], [-H, H]]); l.fillStyle = P.cream; l.fill();
    const vw = .36, vd = .2;
    const jacket = G.across(phi => { const f = Math.abs(wrap(phi)); return (-.45 + .012 * (1 - Math.cos(f)) + (f < vw ? vd * Math.pow(1 - f / vw, 1.1) : 0)) * H; }, 72);
    poly(l, [...jacket, [H, H], [-H, H]]); l.fillStyle = sp.band; l.fill();
    // lapels: lighter folds along the V
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const f = s * vw * i / 10, y = (-.445 + vd * (1 - i / 10)) * H; const ps = f + th; pts.push(D(G.hw(y) * Math.sin(ps), y)); }
      for (let i = 10; i >= 0; i--) { const f = s * (vw * i / 10 + .16 * (1 - i / 10) + .1), y = (-.445 + vd * (1 - i / 10) * .55 + .03) * H; const ps = f + th; pts.push(D(G.hw(y) * Math.sin(ps), y)); }
      if (Math.cos(s * .2 + th) > -.3) { poly(l, pts); l.fillStyle = light(sp.band, .12); l.fill(); }
    }
    // single button
    const bs = G.surf(0, -.205 * H);
    if (bs.c > .1) { const [bx, by] = D(bs.x, -.205 * H); ell(l, bx, by, .016 * H * Math.max(.4, bs.c), .016 * H); l.fillStyle = dark(sp.band, .35); l.fill(); }
  } else if (sp.id === 'lopez') {
    // cream blouse with a pointed collar, an open sage cardigan (two fronts, buttons on one side), a navy-pastel skirt
    const top = G.across(phi => (-.405 - .05 * Math.max(0, Math.cos(wrap(phi)))) * H, 40);
    poly(l, [...top, [H, H], [-H, H]]); l.fillStyle = P.cream; l.fill();
    const card = G.across(phi => { const f = Math.abs(wrap(phi)); return (-.455 + .012 * (1 - Math.cos(f)) + (f < .42 ? .26 * Math.pow(1 - f / .42, 1.15) : 0)) * H; }, 72);
    poly(l, [...card, [H, H], [-H, H]]); l.fillStyle = sp.band; l.fill();
    // the blouse collar: two small cream points over the cardigan's neckline
    for (const s of [-1, 1]) {
      const a = G.surf(s * .05, -.43 * H), b = G.surf(s * .3, -.41 * H), q = G.surf(s * .2, -.33 * H);
      if (Math.min(a.c, b.c) > .05) { poly(l, [G.D(a.x, -.43 * H), G.D(b.x, -.415 * H), G.D(q.x, -.335 * H)]); l.fillStyle = '#FFFDF8'; l.fill(); l.strokeStyle = rgba(SHADE, .25); l.lineWidth = .006 * H; l.stroke(); }
    }
    // the cardigan's front edges and buttons
    for (const s of [-1, 1]) {
      const pl = []; for (let i = 0; i <= 8; i++) { const y = lerp(-.25, -.11, i / 8) * H, q = G.surf(s * .1 * (1 - i / 8), y, 1); pl.push(G.D(q.x, y)); }
      if (G.surf(s * .1, -.2 * H).c > .05) { l.strokeStyle = dark(sp.band, .22); l.lineWidth = .011 * H; l.lineCap = 'round'; poly(l, pl, false); l.stroke(); }
    }
    for (const y of [-.22, -.16]) { const q = G.surf(-.08, y * H, 1); if (q.c > .1) { const [bx, by] = D(q.x, y * H); ell(l, bx, by, .013 * H * Math.max(.4, q.c), .013 * H); l.fillStyle = P.cream; l.fill(); } }
    // a pocket with a pen clipped in it
    const pq = G.surf(.42, -.24 * H, 1);
    if (pq.c > .2) { const [px, py] = D(pq.x, -.24 * H); rr(l, px - .045 * H * pq.c, py - .01 * H, .09 * H * pq.c, .055 * H, .008 * H); l.fillStyle = dark(sp.band, .12); l.fill();
      l.fillStyle = P.navy; rr(l, px - .012 * H * pq.c, py - .05 * H, .014 * H, .05 * H, .005 * H); l.fill(); }
    const hem = G.across(() => -.14 * H, 30); poly(l, [...hem, [H, H], [-H, H]]); l.fillStyle = dark(sp.band, .14); l.fill();
    const sk = G.across(() => -.11 * H, 30); poly(l, [...sk, [H, H], [-H, H]]); l.fillStyle = mix(P.navy, P.cream, .3); l.fill();
  } else {
    // cream top with a scoop neck, mustard cardigan (placket + buttons + ribbed hem), teal skirt
    const top = G.across(phi => (-.4 - .065 * Math.max(0, Math.cos(wrap(phi)))) * H, 40);
    poly(l, [...top, [H, H], [-H, H]]); l.fillStyle = P.cream; l.fill();
    const card = G.across(phi => { const f = Math.abs(wrap(phi)); return (-.452 + .012 * (1 - Math.cos(f)) + (f < .5 ? .09 * Math.pow(Math.cos(f / .5 * PI / 2), 1.4) : 0)) * H; }, 72);
    poly(l, [...card, [H, H], [-H, H]]); l.fillStyle = sp.band; l.fill();
    // placket line
    const pl = []; for (let i = 0; i <= 8; i++) { const y = lerp(-.36, -.12, i / 8) * H, s = G.surf(0, y, 1); pl.push(D(s.x, y)); }
    if (G.surf(0, -.3 * H).c > .05) {
      l.strokeStyle = dark(sp.band, .2); l.lineWidth = .012 * H; l.lineCap = 'round'; poly(l, pl, false); l.stroke();
      for (const y of [-.31, -.235, -.16]) { const s = G.surf(.06, y * H, 1); const [bx, by] = D(s.x, y * H); ell(l, bx, by, .014 * H * Math.max(.4, s.c), .014 * H); l.fillStyle = P.cream; l.fill(); }
    }
    // ribbed hem + skirt
    const hem = G.across(() => -.145 * H, 30); poly(l, [...hem, [H, H], [-H, H]]); l.fillStyle = dark(sp.band, .14); l.fill();
    const sk = G.across(() => -.115 * H, 30); poly(l, [...sk, [H, H], [-H, H]]); l.fillStyle = P.teal; l.fill();
  }
}

function tendrils(l, sp, p, G) {
  const H = G.H, th = G.th;
  for (const s of [-1, 1]) {
    const ps = s * 1.02 + th; if (Math.cos(ps) < -.15) continue;
    const Lp = [], Rp = [], N = 14, sn = Math.sin(ps);
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = lerp(-.83, -.6, t) * H;
      const x = G.hw(y) * sn * 1.01 + Math.sign(sn) * (.012 * Math.sin(PI * t) - .03 * Math.pow(t, 3)) * H;
      const w = (.04 * (1 - Math.pow(t, 1.6)) + .006) * H * (.55 + .45 * Math.abs(Math.cos(ps)));
      Lp.push(G.D(x - w, y)); Rp.push(G.D(x + w, y));
    }
    smooth(l, [...Lp, ...Rp.reverse()]); l.fillStyle = sp.hair; l.fill();
  }
}

function quiff(l, sp, p, G) {
  const H = G.H, th = G.th, phi = .22, ps = phi + th, y = -.965 * H;
  if (Math.cos(ps) < -.55) return;
  const bx = G.hw(y) * .9 * Math.sin(ps), fwd = Math.sin(th);
  const sway = p.quiff || 0;
  const pts = [[bx - .075 * H, y + .035 * H], [bx - .045 * H, y - .03 * H], [bx + .01 * H + fwd * .03 * H, y - .07 * H],
    [bx + .07 * H + fwd * .07 * H + sway * .03 * H, y - .085 * H], [bx + .055 * H + fwd * .05 * H + sway * .02 * H, y - .04 * H], [bx + .06 * H, y + .035 * H]];
  smooth(l, pts.map(q => G.D(q[0], q[1]))); l.fillStyle = sp.hair; l.fill();
}

function pony(l, sp, p, G) {
  const H = G.H, th = G.th;
  const d = clamp(Math.cos(th) * .5 - Math.sin(th) * 1.6, -1, 1);
  const ax = -G.hw(-.96 * H) * .85 * Math.sin(th), ay = -1.035 * H;
  const A = [ax - Math.sin(th) * .05 * H, ay];
  const sw = p.pony || 0, cs = Math.cos(sw), sn = Math.sin(sw);
  const R = (x, y) => [A[0] + x * cs - y * sn, A[1] + x * sn + y * cs];
  const bz = (t, a, b, c2, e) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c2 + t * t * t * e; };
  const dd = (d < 0 ? -1 : 1) * Math.max(Math.abs(d), .75);
  const ctrl = [[0, 0], [d * .1, -.17], [dd * .4, -.15], [dd * .36, .25]];
  const N = 22, L = [], Rr = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = bz(t, ctrl[0][0], ctrl[1][0], ctrl[2][0], ctrl[3][0]) * H, y = bz(t, ctrl[0][1], ctrl[1][1], ctrl[2][1], ctrl[3][1]) * H;
    const t2 = Math.min(1, t + .01), x2 = bz(t2, ctrl[0][0], ctrl[1][0], ctrl[2][0], ctrl[3][0]) * H, y2 = bz(t2, ctrl[0][1], ctrl[1][1], ctrl[2][1], ctrl[3][1]) * H;
    let nx = -(y2 - y), ny = x2 - x; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    const w = (.032 + .052 * Math.pow(Math.sin(PI * Math.min(1, t * 1.02)), .8) * (1 - .3 * t)) * H * (1 - .75 * Math.pow(t, 6));
    L.push(R(x + nx * w, y + ny * w)); Rr.push(R(x - nx * w, y - ny * w));
  }
  const pts = [...L, ...Rr.reverse()].map(q => G.D(q[0], q[1]));
  smooth(l, pts); l.fillStyle = dark(sp.hair, .06); l.fill();
  // tie (teal scrunchie)
  const [tx, ty] = G.D(A[0], A[1]);
  ell(l, tx, ty + .01 * H, .062 * H, .042 * H, d * .3); l.fillStyle = P.teal; l.fill();
  ell(l, tx - .015 * H, ty, .03 * H, .018 * H, d * .3); l.fillStyle = light(P.teal, .25); l.fill();
}

// Mrs. Lopez: a round silver bun on the crown (drawn behind the head, so it peeks above it) with a red band, and soft waves at the temples
function bun(l, sp, p, G) {
  const H = G.H, th = G.th;
  const [bx, by] = G.D(-Math.sin(th) * .05 * H, -1.035 * H);
  ell(l, bx, by, .135 * H, .1 * H, Math.sin(th) * .2); l.fillStyle = dark(sp.hair, .08); l.fill();
  ell(l, bx - .02 * H, by - .02 * H, .1 * H, .07 * H, Math.sin(th) * .2); l.fillStyle = sp.hair; l.fill();
  l.strokeStyle = rgba('#FFFFFF', .35); l.lineWidth = .016 * H; l.lineCap = 'round';
  l.beginPath(); l.ellipse(bx - .02 * H, by - .02 * H, .075 * H, .045 * H, -.2, PI * 1.1, PI * 1.6); l.stroke();
  l.strokeStyle = dark(sp.hair, .2); l.lineWidth = .008 * H;
  for (const a of [-.5, .3]) { l.beginPath(); l.ellipse(bx, by, .1 * H, .07 * H, a, PI * 1.05, PI * 1.5); l.stroke(); }
}
function waves(l, sp, p, G) {
  const H = G.H, th = G.th;
  for (const s of [-1, 1]) {
    const ps = s * 1.08 + th; if (Math.cos(ps) < -.1) continue;
    const sn = Math.sin(ps), pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10, y = lerp(-.78, -.66, t) * H; pts.push(G.D(G.hw(y) * sn * 1.015 + Math.sign(sn) * .018 * H * Math.sin(PI * t * 2), y)); }
    for (let i = 10; i >= 0; i--) { const t = i / 10, y = lerp(-.78, -.66, t) * H; pts.push(G.D(G.hw(y) * sn * .93, y)); }
    smooth(l, pts); l.fillStyle = sp.hair; l.fill();
  }
}

// ---------------- face ----------------
const EYE = { y: -.665, dx: .122, rx: .061, ry: .077 };
function face(c, sp, p, G) {
  const H = G.H, f = p.face, th = G.th;
  const place = (dx, y) => { const phi = Math.asin(clamp(dx * H / (G.hw(y * H) * .96), -1, 1)); const s = G.surf(phi, y * H); const [X, Y] = G.D(s.x, y * H); return { X, Y, c: s.c, rot: G.rotAt(y * H) }; };
  const sub = (q, fn) => { c.save(); c.translate(q.X, q.Y); c.rotate(q.rot); c.scale(1 / Math.sqrt(G.sq), 1); fn(Math.max(0, q.c)); c.restore(); };
  // blush (under the eyes)
  for (const s of [-1, 1]) {
    const q = place(s * .2, -.585);
    if (q.c > .15 && f.blush > .01) sub(q, fx => {
      ell(c, 0, 0, .056 * H * fx, .031 * H); c.fillStyle = rgba(sp.blush, sp.blushA * Math.min(1, f.blush)); c.fill();
      if (f.lines > .05) {
        c.strokeStyle = rgba(dark(sp.blush, .35), .75 * f.lines); c.lineWidth = .0105 * H; c.lineCap = 'round';
        for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo((i * .026 - .008) * H * fx, .016 * H); c.lineTo((i * .026 + .012) * H * fx, -.016 * H); c.stroke(); }
      }
    });
  }
  // eyes + brows
  for (const s of [-1, 1]) {
    const q = place(s * EYE.dx, EYE.y);
    if (q.c > .12) sub(q, fx => eye(c, sp, f, H, fx, s));
    const by = EYE.y - .112 - (s < 0 ? f.bLy : f.bRy) * .035;
    const qb = place(s * EYE.dx * 1.03, by);
    if (qb.c > .12) sub(qb, fx => {
      const r = s < 0 ? f.bLr : f.bRr, len = .088 * H * fx, inner = -s;   // inner end points toward the nose
      const xi = inner * len / 2, xo = -inner * len / 2, yi = -r * .07 * H, yo = r * .03 * H;
      c.strokeStyle = sp.brow; c.lineWidth = .031 * H; c.lineCap = 'round';
      c.beginPath(); c.moveTo(xo, yo); c.quadraticCurveTo(0, (yi + yo) / 2 - .016 * H, xi, yi); c.stroke();
    });
  }
  // round glasses (Mrs. Lopez): two frames around the eyes and a bridge, a faint lens glint
  if (sp.glasses) {
    const qs = [-1, 1].map(s => place(s * EYE.dx, EYE.y + .005));
    const lw = .017 * H;
    qs.forEach((q, i) => { if (q.c > .12) sub(q, fx => {
      ell(c, 0, 0, EYE.rx * H * 1.55 * fx, EYE.ry * H * 1.3); c.fillStyle = rgba('#FFFFFF', .12); c.fill();
      c.strokeStyle = sp.glasses; c.lineWidth = lw; c.stroke();
      c.strokeStyle = rgba('#FFFFFF', .55); c.lineWidth = lw * .45; c.lineCap = 'round';
      c.beginPath(); c.ellipse(0, 0, EYE.rx * H * 1.2 * fx, EYE.ry * H * 1.0, 0, PI * 1.15, PI * 1.4); c.stroke();
    }); });
    if (qs[0].c > .12 && qs[1].c > .12) {
      const a = [qs[0].X + EYE.rx * H * 1.5 * Math.max(.2, qs[0].c), qs[0].Y - .012 * H], b = [qs[1].X - EYE.rx * H * 1.5 * Math.max(.2, qs[1].c), qs[1].Y - .012 * H];
      c.strokeStyle = sp.glasses; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, a[1] - .02 * H, b[0], b[1]); c.stroke();
    }
    // the temple arm toward the visible ear
    const side = th >= 0 ? -1 : 1, q = qs[side < 0 ? 0 : 1];
    if (q.c > .12) { const ey = EYE.y * H, ex = G.D(side * G.hw(ey) * .97, ey); c.strokeStyle = sp.glasses; c.lineWidth = lw * .8; c.beginPath(); c.moveTo(q.X + side * EYE.rx * H * 1.5 * q.c, q.Y - .01 * H); c.lineTo(ex[0], ex[1] - .006 * H); c.stroke(); }
  }
  // mouth
  const qm = place(0, -.548);
  if (qm.c > -.05) sub(qm, fx => mouth(c, sp, f, H, Math.max(.45, fx)));
  // sweat drop on the temple, on the side away from the camera's turn
  if (f.sweat > .02) {
    const side = th >= 0 ? -1 : 1, y = -.83 * H, X0 = G.D(side * G.hw(y) * .93, y);
    c.save(); c.translate(X0[0] + side * .01 * H, X0[1] + f.sweat * .02 * H); const r = .036 * H * Math.min(1, f.sweat * 1.2);
    c.beginPath(); c.moveTo(0, -r * 1.9); c.bezierCurveTo(r * .55, -r * 1.0, r, -r * .2, r, r * .25); c.arc(0, r * .25, r, 0, PI); c.bezierCurveTo(-r, -r * .2, -r * .55, -r * 1.0, 0, -r * 1.9);
    c.fillStyle = '#8FD1F2'; c.fill();
    ell(c, -r * .35, r * .1, r * .22, r * .35, -.3); c.fillStyle = 'rgba(255,255,255,.9)'; c.fill();
    c.restore();
  }
}

function eye(c, sp, f, H, fx, s) {
  const rx = EYE.rx * H * fx, ry = EYE.ry * H, lw = .02 * H;
  if (f.happy >= .9) {   // closed happy arc ∩
    c.strokeStyle = P.ink; c.lineWidth = .025 * H; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, ry * .3, rx * .92, ry * .62, 0, PI * 1.1, PI * 1.9); c.stroke(); return;
  }
  const open = clamp(f.eye, 0, 1), ryo = ry * Math.max(.05, open);
  if (open < .14) { c.strokeStyle = P.ink; c.lineWidth = lw * 1.1; c.lineCap = 'round'; c.beginPath(); c.ellipse(0, -ry * .15, rx * .92, ry * .32, 0, PI * .12, PI * .88); c.stroke(); return; }
  // lids are boundaries of the visible eye (no fringe): upper lid curve (acting) and lower lid curve (cheek push)
  const lid = f.lid, tilt = (f.lidT + (s < 0 ? f.bLr : f.bRr) * .45) * -s * ry * .45;
  const yl = -ryo + 2 * ryo * lid, yb = ryo - 2 * ryo * f.happy * .5;
  const upper = () => { c.moveTo(-rx * 1.3, yl + tilt * 1.3); c.quadraticCurveTo(0, yl + ry * .12 * Math.min(1, lid * 4), rx * 1.3, yl - tilt * 1.3); };
  c.save();
  c.beginPath();
  if (lid > .01) upper(); else { c.moveTo(-rx * 1.3, -ry * 1.4); c.lineTo(rx * 1.3, -ry * 1.4); }
  if (f.happy > .01) { c.lineTo(rx * 1.3, yb + ry * .25); c.quadraticCurveTo(0, yb - ry * .3, -rx * 1.3, yb + ry * .25); }
  else { c.lineTo(rx * 1.3, ry * 1.4); c.lineTo(-rx * 1.3, ry * 1.4); }
  c.closePath(); c.clip();
  ell(c, 0, 0, rx, ryo); c.fillStyle = '#FFFDF8'; c.fill(); c.clip();
  const g = c.createLinearGradient(0, -ryo, 0, ryo * .25); g.addColorStop(0, 'rgba(90,80,150,.30)'); g.addColorStop(1, 'rgba(90,80,150,0)'); c.fillStyle = g; c.fillRect(-rx, -ryo, rx * 2, ryo * 1.3);
  const pr = .045 * H * f.pupil, px = f.lx * rx * .5, py = f.ly * ryo * .42;
  ell(c, px, py, pr * Math.max(.55, fx), pr); c.fillStyle = P.ink; c.fill();
  ell(c, px - pr * .34, py - pr * .38, pr * .37, pr * .37); c.fillStyle = '#FFFFFF'; c.fill();
  ell(c, px + pr * .36, py + pr * .34, pr * .14, pr * .14); c.fill();
  c.restore();
  // lash line: along the upper lid when it is down, else the upper rim
  c.strokeStyle = sp.lash; c.lineWidth = lw * .9; c.lineCap = 'round';
  c.save(); ell(c, 0, 0, rx * 1.12, ryo * 1.12); c.clip();
  c.beginPath(); if (lid > .01) upper(); else c.ellipse(0, 0, rx, ryo, 0, PI * 1.1, PI * 1.9); c.stroke();
  c.restore();
  if (sp.id === 'mia' || sp.id === 'lopez') { const ox = s * rx * .8, oy = -ryo * .58 + (lid > .01 ? ryo * lid * 1.2 : 0); c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(ox + s * rx * .32, oy - ry * .1, ox + s * rx * .45, oy - ry * .3); c.stroke(); }
}

function mouth(c, sp, f, H, fx) {
  const w = f.mw * H * fx, open = f.mo * H, sm = f.ms, as = f.masym * .03 * H;
  // lip-sync extras (all 0 = the classic mouth): mround rounds the opening into an "O", mlip tucks the lower lip under the
  // upper teeth (F, V), mtng raises the tongue into the middle of the mouth (L)
  const rnd = f.mround || 0, lip = f.mlip || 0, tng = f.mtng || 0;
  const lift = -sm * .03 * H, Lp = [-w / 2, lift + as], Rp = [w / 2, lift - as];
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (open < .012 * H) {
    c.strokeStyle = P.ink; c.lineWidth = .022 * H; c.beginPath();
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, u = 1 - t, x = u * u * Lp[0] + t * t * Rp[0], y0 = u * u * Lp[1] + 2 * u * t * (sm * .04 * H) + t * t * Rp[1];
      const y = y0 + f.mwob * .011 * H * Math.sin(t * PI * 4) * Math.sin(t * PI);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke(); return;
  }
  const top = sm > 0 ? -open * .1 : -open * .3, bot = open * (1 + .3 * Math.max(0, sm)), my = (Lp[1] + Rp[1]) / 2;
  const path = () => {
    c.beginPath();
    if (rnd > .01) {   // the "D" outline sampled and blended toward an ellipse of the same width (a pucker / rounded vowel)
      const ty = open * .85, cy = my + (bot - ty) / 2, rx = w / 2, ry = (ty + bot) / 2, N = 12, C = my + top * 2, B = my + bot * 1.3;
      for (let i = 0; i <= 2 * N; i++) {
        let px, py;
        if (i <= N) { const t = i / N, u = 1 - t; px = u * u * Lp[0] + t * t * Rp[0]; py = u * u * Lp[1] + 2 * u * t * C + t * t * Rp[1]; }
        else {
          const t = (i - N) / N, u = 1 - t, x1 = Rp[0] - w * .02, x2 = Lp[0] + w * .02;
          px = u * u * u * Rp[0] + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * Lp[0];
          py = u * u * u * Rp[1] + 3 * u * u * t * B + 3 * u * t * t * B + t * t * t * Lp[1];
        }
        const a = PI + PI * i / N, ex = rx * Math.cos(a), ey = cy + ry * Math.sin(a);   // left → top → right → bottom → left
        const x = lerp(px, ex, rnd), y = lerp(py, ey, rnd);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath(); return;
    }
    c.moveTo(Lp[0], Lp[1]);
    if (f.mwob > .05) { for (let i = 1; i <= 16; i++) { const t = i / 16; c.lineTo(lerp(Lp[0], Rp[0], t), lerp(Lp[1], Rp[1], t) + top * Math.sin(t * PI) + f.mwob * .009 * H * Math.sin(t * PI * 4)); } }
    else c.quadraticCurveTo(0, my + top * 2, Rp[0], Rp[1]);
    // rounded "D" bottom
    c.bezierCurveTo(Rp[0] - w * .02, my + bot * 1.3, Lp[0] + w * .02, my + bot * 1.3, Lp[0], Lp[1]); c.closePath();
  };
  path(); c.fillStyle = '#5B2236'; c.fill();
  c.save(); c.clip();
  if (f.mt > .85) {               // gritted teeth
    c.fillStyle = '#FFFDF8'; c.fillRect(-w, my - open * 2, w * 2, open * 4);
    c.strokeStyle = rgba(P.ink, .5); c.lineWidth = .008 * H;
    const ym = my + bot * .42; c.beginPath(); c.moveTo(-w, ym); c.lineTo(w, ym); c.stroke();
    for (const x of [-.28, 0, .28]) { c.beginPath(); c.moveTo(x * w, my - open); c.lineTo(x * w, my + bot * 1.4); c.stroke(); }
  } else {
    // tongue: a sliver at the bottom; raised (mtng) it sits in the middle of the mouth
    ell(c, 0, my + bot * lerp(1.05, .68, tng), w * lerp(.3, .26, tng), bot * lerp(.45, .4, tng)); c.fillStyle = '#EE7C82'; c.fill();
    if (f.mt > .02 || lip > .01) {   // upper teeth; with mlip they reach down onto the lower lip
      c.fillStyle = '#FFFDF8'; c.fillRect(-w, my - open, w * 2, lerp(open * (.95 + f.mt * .35), open + bot * .7, lip));
    }
    if (lip > .01) {                 // the lower lip tucked under the teeth, in a lip tone, with a thin shadow above it
      c.fillStyle = rgba(mix(sp.skin, '#8A3A48', .45), lip);
      c.beginPath(); c.moveTo(-w, my + bot * .98); c.quadraticCurveTo(0, my + bot * .74, w, my + bot * .98); c.lineTo(w, my + bot * 2); c.lineTo(-w, my + bot * 2); c.closePath(); c.fill();
    }
  }
  c.restore();
  if (f.mt > .85) { path(); c.strokeStyle = P.ink; c.lineWidth = .014 * H; c.stroke(); }
}

// ---------------- props ----------------
// red rolling suitcase; x,y = ground under its centre; k = scale; u = owner H; handle 0..1 extension
export function drawSuitcase(ctx, x, y, k, u = 300, o = {}) {
  const W = .29 * u, Hs = .36 * u, hz = (o.handle ?? 1) * .17 * u, tilt = o.tilt || 0;
  contact(ctx, x + .02 * u * k, y + .004 * u * k, .2 * u * k, .035 * u * k, .26);
  const box = { x: x - .5 * u * k, y: y - .7 * u * k, w: u * k, h: .75 * u * k };
  formed(ctx, box, l => {
    l.save(); l.translate(x, y); l.scale(k, k); l.rotate(tilt);
    // handle
    l.fillStyle = P.ink;
    for (const s of [-1, 1]) { l.beginPath(); l.roundRect(s * .06 * u - .011 * u, -Hs - .05 * u - hz, .022 * u, hz + .03 * u, .01 * u); l.fill(); }
    l.beginPath(); l.roundRect(-.085 * u, -Hs - .07 * u - hz, .17 * u, .04 * u, .02 * u); l.fill();
    // wheels
    for (const s of [-1, 1]) { ell(l, s * .1 * u, -.02 * u, .028 * u, .028 * u); l.fillStyle = P.ink; l.fill(); }
    // body
    l.beginPath(); l.roundRect(-W / 2, -Hs - .035 * u, W, Hs, .055 * u); l.fillStyle = P.red; l.fill();
    // ribs
    l.fillStyle = dark(P.red, .14);
    for (const s of [-1, 1]) { l.beginPath(); l.roundRect(s * .065 * u - .012 * u, -Hs - .01 * u, .024 * u, Hs - .05 * u, .012 * u); l.fill(); }
    // corner bumpers + tag
    l.fillStyle = dark(P.red, .3);
    l.beginPath(); l.roundRect(-W / 2 + .01 * u, -.075 * u, W - .02 * u, .03 * u, .015 * u); l.fill();
    l.save(); l.translate(-W / 2 + .005 * u, -Hs + .06 * u); l.rotate(.18);
    l.fillStyle = P.mustard; l.beginPath(); l.roundRect(-.02 * u, 0, .05 * u, .07 * u, .012 * u); l.fill();
    l.fillStyle = P.cream; ell(l, .005 * u, .015 * u, .008 * u, .008 * u); l.fill();
    l.restore();
    // a sticker (generic: little plane)
    l.fillStyle = P.cream; l.beginPath(); l.arc(.0 * u, -Hs * .55, .045 * u, 0, PI * 2); l.fill();
    l.fillStyle = P.navy; l.save(); l.translate(0, -Hs * .55); l.rotate(-.6); l.beginPath(); l.roundRect(-.026 * u, -.006 * u, .052 * u, .012 * u, .006 * u); l.fill();
    l.beginPath(); l.moveTo(-.004 * u, -.005 * u); l.lineTo(.008 * u, -.026 * u); l.lineTo(.014 * u, -.026 * u); l.lineTo(.01 * u, -.005 * u); l.fill();
    l.beginPath(); l.moveTo(-.004 * u, .005 * u); l.lineTo(.008 * u, .026 * u); l.lineTo(.014 * u, .026 * u); l.lineTo(.01 * u, .005 * u); l.fill();
    l.restore();
    l.restore();
  }, { sx: .03 * u * k, sy: .02 * u * k, soft: .006 * u * k, shadeA: .5, hx: .012 * u * k, hy: .012 * u * k, hiA: .5, hy0: y - .45 * u * k, hy1: y - .1 * u * k });
}

// ---------------- episode 2 props (held things; drawn after the character, then the hand is redrawn over them) ----------------
// the round hand on its own (to draw it again over a held prop)
// o.dir: the forearm direction (unit), for the thumb; o.grip: a short dark crease where the hand meets a held cup (A2)
export function drawHand(ctx, sp, hx, hy, H, o = {}) {
  const x2 = ARMCFG[ARMS] && ARMCFG[ARMS].x2, r = (ARMS === 'v2' ? .047 : x2 ? .0565 : .054) * H;
  const dk = mix(sp.skin, '#4B2E52', .32);
  if (x2) {   // thumb bump: on the upper side of the hand, leaning back toward the forearm
    const d = o.dir || [0, 1]; let tx = -d[0] * .5, ty = -1 - d[1] * .5; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const px = hx + tx * r * .82, py = hy + ty * r * .82, tr = r * .42;
    ell(ctx, px, py, tr, tr); ctx.fillStyle = dk; ctx.fill(); ell(ctx, px - .006 * H, py - .006 * H, tr * .78, tr * .78); ctx.fillStyle = sp.skin; ctx.fill();
  }
  ell(ctx, hx, hy, r, r); ctx.fillStyle = dk; ctx.fill();
  ell(ctx, hx - .009 * H, hy - .008 * H, r * .8, r * .8); ctx.fillStyle = sp.skin; ctx.fill();
  ell(ctx, hx - .02 * H, hy - .02 * H, r * .25, r * .2); ctx.fillStyle = rgba('#FFF6E8', .35); ctx.fill();
  if (o.grip) { ctx.strokeStyle = rgba('#3B2142', .4); ctx.lineWidth = .011 * H; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(hx, hy - r * .1, r * .72, PI * 1.2, PI * 1.8); ctx.stroke(); }
}
// takeaway coffee cup: x,y = the centre of the cup body; k = scale (1 = a 300 px owner); o.steam (0..1) + o.t animate the steam
export function drawCup(ctx, x, y, k, o = {}) {
  const u = 300 * k, w = .125 * u, h = .16 * u;
  ctx.save(); ctx.translate(x, y + h / 2); if (o.rot) ctx.rotate(o.rot);
  contact(ctx, .01 * u, .004 * u, w * .5, .02 * u, .18);
  poly(ctx, [[-w / 2, -h], [w / 2, -h], [w * .42, 0], [-w * .42, 0]]); ctx.fillStyle = '#FFFDF8'; ctx.fill();
  poly(ctx, [[w * .2, -h], [w / 2, -h], [w * .42, 0], [w * .18, 0]]); ctx.fillStyle = rgba(SHADE, .18); ctx.fill();
  poly(ctx, [[-w * .5, -h * .78], [w * .5, -h * .78], [w * .455, -h * .32], [-w * .455, -h * .32]]); ctx.fillStyle = P.navy; ctx.fill();
  poly(ctx, [[w * .2, -h * .78], [w * .5, -h * .78], [w * .455, -h * .32], [w * .18, -h * .32]]); ctx.fillStyle = rgba(SHADE, .3); ctx.fill();
  ell(ctx, -w * .18, -h * .55, w * .07, h * .07); ctx.fillStyle = P.mustard; ctx.fill();
  ctx.fillStyle = P.teal; rr(ctx, -w * .56, -h - .028 * u, w * 1.12, .034 * u, .012 * u); ctx.fill();
  rr(ctx, -w * .32, -h - .05 * u, w * .64, .028 * u, .01 * u); ctx.fill();
  ctx.fillStyle = rgba('#FFFBF0', .45); rr(ctx, -w * .5, -h - .024 * u, w * .5, .012 * u, .006 * u); ctx.fill();
  if (o.steam > 0) {
    ctx.strokeStyle = rgba('#FFFFFF', .6 * o.steam); ctx.lineWidth = .012 * u; ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) { const v = i / 8, yy = -h - .06 * u - v * .11 * u, xx = s * .02 * u + Math.sin(v * 5 + (o.t || 0) * 3 + s) * .014 * u; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
      ctx.globalAlpha = .6 * o.steam; ctx.stroke();
    }
  }
  ctx.restore();
}
// Sara's teal tote bag hanging from a hand at (x, y)
export function drawBag(ctx, x, y, k) {
  const u = 276 * k;
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = dark(P.mustard, .25); ctx.lineWidth = .02 * u; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-.07 * u, .16 * u); ctx.quadraticCurveTo(-.07 * u, -.02 * u, 0, -.01 * u); ctx.quadraticCurveTo(.07 * u, -.02 * u, .07 * u, .16 * u); ctx.stroke();
  rr(ctx, -.14 * u, .15 * u, .28 * u, .24 * u, .03 * u); ctx.fillStyle = P.teal; ctx.fill();
  rr(ctx, .06 * u, .15 * u, .08 * u, .24 * u, { tr: .03 * u, br: .03 * u }); ctx.fillStyle = rgba(SHADE, .3); ctx.fill();
  rr(ctx, -.14 * u, .15 * u, .28 * u, .07 * u, { tl: .03 * u, tr: .03 * u }); ctx.fillStyle = P.mustard; ctx.fill();
  ell(ctx, 0, .27 * u, .028 * u, .028 * u); ctx.fillStyle = P.cream; ctx.fill();
  ctx.restore();
}
// the paper form: a cream sheet with ruled lines and the "Age" box, centred on (x, y); w × h in px, rot in radians
// o.age: 0..1 highlight of the Age box; o.text: draw the words (big versions only); o.hands: draw the holder's thumbs (skin colour)
export function drawForm(ctx, x, y, w, h, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  ctx.fillStyle = rgba('#2A2742', .18); rr(ctx, -w / 2 + 8, -h / 2 + 10, w, h, w * .02); ctx.fill();
  ctx.fillStyle = '#FFFDF6'; rr(ctx, -w / 2, -h / 2, w, h, w * .02); ctx.fill();
  const m = w * .09, lw = Math.max(2, w * .012);
  // header bar
  ctx.fillStyle = P.navy; rr(ctx, -w / 2 + m, -h / 2 + m * .8, w - 2 * m, h * .085, h * .02); ctx.fill();
  ctx.fillStyle = P.mustard; rr(ctx, -w / 2 + m + w * .03, -h / 2 + m * .8 + h * .025, w * .22, h * .035, h * .012); ctx.fill();
  // rows: label stub + line; the Age row is boxed
  const rows = [['Name:', 'Youssef'], ['From:', 'Cairo'], ['Age:', ''], ['Class:', 'A1']];
  const y0 = -h / 2 + m * .8 + h * .17, dy = h * .17;
  rows.forEach(([lab, val], i) => {
    const yy = y0 + i * dy, isAge = i === 2;
    if (isAge) {
      const k = o.age ?? 0;
      ctx.fillStyle = rgba(P.mustard, .18 + .32 * k); rr(ctx, -w / 2 + m - w * .02, yy - h * .07, w - 2 * m + w * .04, h * .13, h * .02); ctx.fill();
      ctx.strokeStyle = rgba(P.red, .35 + .6 * k); ctx.lineWidth = lw * 1.4; rr(ctx, -w / 2 + m - w * .02, yy - h * .07, w - 2 * m + w * .04, h * .13, h * .02); ctx.stroke();
    }
    ctx.fillStyle = rgba(P.ink, isAge ? .9 : .55); rr(ctx, -w / 2 + m, yy - h * .012, w * .18, h * .024, h * .012); ctx.fill();
    ctx.strokeStyle = rgba(P.ink, .3); ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w / 2 + m + w * .24, yy + h * .03); ctx.lineTo(w / 2 - m, yy + h * .03); ctx.stroke();
    if (o.text) {
      ctx.fillStyle = '#FFFDF6'; rr(ctx, -w / 2 + m - 2, yy - h * .05, w * .2, h * .1, 4); ctx.fill();
      ctx.font = `600 ${h * .075}px "Fredoka"`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = isAge ? P.ink : rgba(P.ink, .7); ctx.fillText(lab, -w / 2 + m, yy);
      if (val) { ctx.font = `500 ${h * .07}px "Fredoka"`; ctx.fillStyle = P.teal; ctx.fillText(val, -w / 2 + m + w * .27, yy + h * .005); }
      if (isAge) { ctx.strokeStyle = P.ink; ctx.lineWidth = lw * 1.3; ctx.setLineDash([w * .03, w * .02]); ctx.beginPath(); ctx.moveTo(-w / 2 + m + w * .26, yy + h * .03); ctx.lineTo(-w / 2 + m + w * .62, yy + h * .03); ctx.stroke(); ctx.setLineDash([]); }
      if (isAge && o.ageVal && (o.write ?? 1) > 0) {   // handwritten in teal ink, revealed left to right as it is written
        ctx.save(); ctx.font = `600 ${h * .1}px "Fredoka"`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const vx = -w / 2 + m + w * .29, vw = ctx.measureText(o.ageVal).width;
        ctx.beginPath(); ctx.rect(vx - 4, yy - h * .08, (vw + 8) * (o.write ?? 1), h * .16); ctx.clip();
        ctx.translate(vx, yy - h * .004); ctx.rotate(-.04); ctx.fillStyle = P.teal; ctx.fillText(o.ageVal, 0, 0); ctx.restore();
      }
    } else if (isAge && o.ageVal && (o.write ?? 1) > .5) { ctx.fillStyle = P.teal; rr(ctx, -w / 2 + m + w * .27, yy - h * .025, w * .12, h * .05, h * .02); ctx.fill(); }
    else if (isAge) { ctx.fillStyle = rgba(P.ink, .55); rr(ctx, -w / 2 + m + w * .26, yy + h * .015, w * .3, h * .03, h * .01); ctx.fill(); }
  });
  ctx.restore();
}
// a navy pen held in a hand at (x, y): k = the owner's screen scale, rot = its angle (0 = pointing down-left, nib first)
export function drawPen(ctx, x, y, k, rot = 0) {
  const u = 270 * k;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  rr(ctx, -.012 * u, -.07 * u, .024 * u, .12 * u, .01 * u); ctx.fillStyle = P.navy; ctx.fill();
  ctx.fillStyle = P.mustard; ctx.fillRect(-.012 * u, -.07 * u, .024 * u, .018 * u);
  ctx.fillStyle = '#C9CED8'; ctx.beginPath(); ctx.moveTo(-.01 * u, .05 * u); ctx.lineTo(.01 * u, .05 * u); ctx.lineTo(0, .075 * u); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// hand positions (screen px) for a pose, without drawing: [[x, y, far], [x, y, far]] for armL, armR
export function handPos(sp, p) {
  const G = geo(sp, p), arms = armGeo(sp, p, G);
  return arms.map(A => [p.x + A.Hd[0] * p.k, p.y + A.Hd[1] * p.k, A.far && (A.frontK ?? 0) < .5, A.fdir]);
}
// a cardboard carrier with n takeaway cups, centred on (x, y)
export function drawTray(ctx, x, y, k, n = 2, o = {}) {
  const u = 300 * k, gap = .15 * u;
  for (let i = 0; i < n; i++) drawCup(ctx, x + (i - (n - 1) / 2) * gap, y - .02 * u, k, o);
  ctx.save(); ctx.translate(x, y);
  const w = gap * n + .02 * u;
  rr(ctx, -w / 2, -.02 * u, w, .07 * u, .02 * u); ctx.fillStyle = mix(P.mustard, P.cream, .5); ctx.fill();
  rr(ctx, -w / 2, .03 * u, w, .02 * u, .01 * u); ctx.fillStyle = rgba(SHADE, .3); ctx.fill();
  ctx.restore();
}
