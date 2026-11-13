// Episode 1 — acting helpers. Everything is a pure function of t (seeded randomness only).
import { clamp, lerp, seg, ss, eio, hash, mulberry } from '/core/lib.js';
import { EXPR, ARM, blendFace, blendArm, normArm, pose } from './bean.js';
import { mouthAt } from './tl.js';

// ---- keyed state tracks ----
// keys: [{t, d?, ...fields}] in time order. The state folds key by key: each key blends the previous state toward its own
// fields over d seconds (default .22 ≈ 5 frames), so overlapping changes stay continuous. face/armL/armR blend as presets.
export function fold(keys, t, base = {}) {
  let st = { ...base };
  for (const k of keys) {
    if (k.t == null || t < k.t) continue;
    const p = ss((t - k.t) / (k.d ?? .22));
    st = blend(st, k, p);
  }
  return st;
}
function blend(a, k, p) {
  const o = { ...a };
  for (const f in k) {
    if (f === 't' || f === 'd' || f === 'ease') continue;
    const v = k[f];
    if (f === 'face') o.face = a.face ? blendFace(a.face, v, p) : v;
    else if (f === 'armL' || f === 'armR') o[f] = a[f] ? blendArm(a[f], v, p) : v;
    else if (typeof v === 'number' && typeof a[f] === 'number') o[f] = lerp(a[f], v, p);
    else o[f] = p > .5 || a[f] == null ? v : a[f];
  }
  return o;
}
export const F = (name, extra = {}) => ({ ...EXPR[name], ...extra });

// ---- moves along x (and optionally y / k): segments [{t0, t1, x0, x1, y0?, y1?, k0?, k1?}] ----
// returns position + hop-walk state. Each segment holds a whole number of ≈.42 s steps so the character lands at its mark.
export function moveAt(segs, t, H = 300) {
  let x = segs[0].x0, y = segs[0].y0 ?? 0, k = segs[0].k0 ?? 1, phase = 0, walking = 0, dir = 1, stepT = .42, ramp = 0;
  for (const s of segs) {
    if (t < s.t0) break;
    const D = Math.max(.01, s.t1 - s.t0), n = Math.max(1, Math.round(D / (s.step || .42))), u = clamp((t - s.t0) / D);
    const e = s.ease === 'lin' ? u : smoothLin(u, Math.min(.18, .3 / D));
    x = lerp(s.x0, s.x1, e);
    if (s.y0 != null) y = lerp(s.y0, s.y1, e);
    if (s.k0 != null) k = lerp(s.k0, s.k1, e);
    phase += n * u; dir = Math.sign(s.x1 - s.x0) || dir; stepT = D / n;
    if (t < s.t1 && !s.glide) { walking = 1; ramp = Math.min(1, (t - s.t0) / .2, (s.t1 - t) / .2); }   // the walk lean eases in/out at the segment ends
  }
  return { x, y, k, phase, walking, dir, stepT, ramp };
}
// linear motion with short eased ends
function smoothLin(u, r) {
  if (r <= 0) return u;
  const v = 1 / (1 - r);   // peak speed
  if (u < r) return v * u * u / (2 * r);
  if (u > 1 - r) { const w = 1 - u; return 1 - v * w * w / (2 * r); }
  return v * (u - r / 2);
}
// hop-walk pose offsets from a step phase (STYLE: squash, lift ≈ .1 H, stretch, damped landing squash; feet alternate)
export function hop(m, H = 300, amp = 1) {
  if (!m.walking && m.phase % 1 === 0) return { lift: 0, sq: 1, footL: 0, footR: 0, lean: 0 };
  const u = m.phase % 1, n = Math.floor(m.phase), A = amp * (m.walking ? 1 : 0);
  const air = u < .68 ? Math.sin(Math.PI * u / .68) : 0;
  const land = u >= .68 ? Math.sin(Math.PI * (u - .68) / .32) : 0;
  const pre = u < .1 ? Math.sin(Math.PI * u / .1) * .3 : 0;
  const L = n % 2 === 0;
  return {
    lift: A * .1 * H * air,
    sq: 1 + A * (.07 * air - .1 * land - .04 * pre),
    footL: A * (L ? .05 * air : 0), footR: A * (L ? 0 : .05 * air),
    lean: A * .05 * m.dir * ss(m.ramp ?? 1),   // eased at the ends of a walk (it used to drop to 0 in one frame when the walk stopped)
  };
}

// ---- blinks: seeded every 2.5–4 s, plus one on each listed time (expression changes) ----
const BL = {};
export function blinkAt(id, t, extra = []) {
  if (!BL[id]) { const r = mulberry(id === 'mia' ? 11 : id === 'youssef' ? 23 : 37); const a = []; let x = .7 + r(); while (x < 400) { a.push(x); x += 2.5 + r() * 1.5; } BL[id] = a; }
  let b = 0;
  const one = c => { const d = Math.abs(t - c - .07); if (d < .07) b = Math.max(b, 1 - d / .07); };
  for (const c of BL[id]) { if (c > t + 1) break; one(c); }
  for (const c of extra) one(c);
  return b;
}
// idle eye darts: pupils jump to a new seeded target every 1.5–2.5 s (fast saccade)
export function dart(id, t, amp = .18) {
  const per = 2, i = Math.floor(t / per), u = t / per - i;
  const h0 = hash(i * 7.1 + (id === 'mia' ? 3 : 0)), h1 = hash(i * 7.1 + 1.7 + (id === 'mia' ? 3 : 0));
  const prev = [hash((i - 1) * 7.1 + (id === 'mia' ? 3 : 0)), hash((i - 1) * 7.1 + 1.7 + (id === 'mia' ? 3 : 0))];
  const k = ss(seg(u, .55 + h0 * .2, .62 + h0 * .2));
  return [lerp(prev[0] - .5, h0 - .5, k) * 2 * amp, lerp(prev[1] - .5, h1 - .5, k) * amp];
}

// ---- lip sync: the timeline's viseme track drawn as mouth-parameter sets (see mouthAt in tl.js, lib/lipsync.py) ----
// Preston Blair shapes on the bean mouth. smk = how much of the speaker's own smile the shape keeps (an open "AH" smiles, a
// pucker can't); mround / mlip / mtng are the mouth() extras (rounded opening, lower lip under the teeth, tongue up).
export const VISEME = {
  A: { mw: .085, mo: 0,    ms: .3,  mt: 0,   mround: 0,  mlip: 0,   mtng: 0, smk: .9 },   // lips pressed: M B P
  B: { mw: .105, mo: .032, ms: .45, mt: .55, mround: 0,  mlip: .3,  mtng: 0, smk: .8 },   // slightly open, teeth: most consonants, EE IH
  C: { mw: .105, mo: .062, ms: .4,  mt: .3,  mround: 0,  mlip: 0,   mtng: 0, smk: .8 },   // open medium: EH AE AH
  D: { mw: .118, mo: .1,   ms: .3,  mt: .2,  mround: 0,  mlip: 0,   mtng: 0, smk: .7 },   // wide open: AA AY
  E: { mw: .08,  mo: .06,  ms: .1,  mt: .15, mround: .6, mlip: 0,   mtng: 0, smk: .4 },   // rounded open: AO ER
  F: { mw: .056, mo: .034, ms: 0,   mt: 0,   mround: 1,  mlip: 0,   mtng: 0, smk: .15 },  // puckered: UW OW W
  G: { mw: .095, mo: .036, ms: .35, mt: .6,  mround: 0,  mlip: 1,   mtng: 0, smk: .7 },   // upper teeth on the lower lip: F V
  H: { mw: .1,   mo: .065, ms: .35, mt: .25, mround: 0,  mlip: 0,   mtng: 1, smk: .7 },   // tongue up: L
};
const MOUTH = ['mw', 'mo', 'ms', 'mt', 'mwob', 'masym', 'mround', 'mlip', 'mtng'];
// the face's mouth replaced by the blend of the active visemes; what is left over is the resting mouth: a closed mouth that
// keeps the face's smile inside a phrase, the face's own expression mouth (a yawn, a grin, a wobble) in longer gaps
export function lipsync(face, who, t, extra) {
  const M = mouthAt(who, t, extra);
  if (M.talk <= .001 && M.rest <= .001) return face;
  const o = { ...face }, wX = (1 - M.talk) * M.rest, wF = 1 - M.talk - wX;
  const X = { mw: lerp(.085, face.mw, .5), mo: 0, ms: face.ms, mt: 0, mwob: 0, masym: 0, mround: 0, mlip: 0, mtng: 0 };
  for (const m of MOUTH) {
    let v = (face[m] ?? 0) * wF + X[m] * wX;
    for (const s in M.w) { const S = VISEME[s] || VISEME.C; v += (m === 'ms' ? Math.max(S.ms, face.ms * S.smk) : (S[m] ?? 0)) * M.w[s]; }
    o[m] = v;
  }
  return o;
}

// final face: track face + blink + idle darts + lip sync
export function liveFace(id, t, face, { talk = true, extra, darts = true, blinks = [] } = {}) {
  let f = { ...face };
  if (darts) { const [dx, dy] = dart(id, t); f.lx += dx; f.ly += dy * .6; }
  const b = blinkAt(id, t, blinks);
  if (b > 0) f.eye = Math.min(f.eye, 1 - b);
  if (talk) f = lipsync(f, id, t, extra);
  return f;
}

// ponytail / quiff: a damped spring driven by the body's vertical speed and lean, simulated over the last 1.4 s (deterministic)
export function springAt(stateFn, t, gain = 1) {
  const dt = 1 / 60, T0 = t - 1.4;
  let a = 0, v = 0, prev = stateFn(T0);
  for (let x = T0 + dt; x <= t + 1e-6; x += dt) {
    const s = stateFn(x), vy = (s.lift - prev.lift) / dt, vx = (s.x - prev.x) / dt;
    const target = (-(s.lean * 3.2) + clamp(vy / 900, -.6, .6) - clamp(vx / 1400, -.35, .35)) * gain;
    v += ((target - a) * 140 - v * 8.5) * dt; a += v * dt;   // ζ ≈ .36: ~30 % overshoot, settles in ≈ .6 s
    prev = s;
  }
  return a;
}

// ---- A3 arm follow: every arm field (hand target, wave, flex, front amount, elbow bias, min bend) is a second-order follow of the
// keyed pose — ζ .75 (≈ 3 % overshoot on arrival), τ .14 s by default, a pose's own `tau` for snap gestures (slap, point) —
// simulated deterministically over the last second at 90 Hz from the keyed track, so every change eases in and out the same way
// and nothing pops. foldArm is the arm-only, allocation-free version of fold (vectors cached on the keys).
const armVec = A => { const N = normArm(A); return [N.dx, N.dy, N.w, N.flex, N.front, N.elv[0], N.elv[1], N.bend, N.tau || 0]; };
const vecOf = (k, which) => { const c = k._av || (k._av = {}); if (c[which] === undefined) c[which] = k[which] ? armVec(k[which]) : null; return c[which]; };
function foldArm(keys, t, base, which) {
  const bv = vecOf(base, which) || armVec(ARM.rest), x = bv.slice(0, 8); let tau = bv[8];
  for (const k of keys) {
    if (k.t == null || t < k.t) continue;
    const v = vecOf(k, which); if (!v) continue;
    const p = ss((t - k.t) / (k.d ?? .22));
    for (let i = 0; i < 8; i++) x[i] += (v[i] - x[i]) * p;
    if (p > 0) tau = v[8];
  }
  x[8] = tau; return x;
}
function smoothArm(C, t, which) {
  const N = 90, dt = 1 / N, T0 = t - 1;
  const x = foldArm(C.keys, T0, C.base, which), v = [0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 1; i <= N; i++) {
    const g = foldArm(C.keys, T0 + i * dt, C.base, which), w0 = 1 / (g[8] || C.tau || .14), z = .75;
    for (let j = 0; j < 8; j++) { v[j] += (w0 * w0 * (g[j] - x[j]) - 2 * z * w0 * v[j]) * dt; x[j] += v[j] * dt; }
  }
  return { dx: x[0], dy: x[1], w: x[2], flex: x[3], front: x[4], elv: [x[5], x[6]], bend: x[7] };
}
export const smoothArms = (C, t) => ({ armL: smoothArm(C, t, 'armL'), armR: smoothArm(C, t, 'armR') });

export { EXPR, ARM, pose };
// A2 gestures shared by the episodes (design v3). A pose is a hand target from the shoulder (dx outward, dy down, fractions
// of H) plus: bend = the minimum elbow bend in degrees, elv = the elbow side (outward, down), flex = how much of the full bones
// is used (0 = exactly the minimum bend, 1 = the full bones, i.e. a deliberate bend), front = both forearms drawn in front of
// the body (holds across the chest, and the far-side arm held out toward the other character). ARM.* holds the standard set:
// rest · out · wave · up · chest · scratch · shrug · hip · hold (a cup at the chest) · point · door.
export const PULL = { dx: .1, dy: -.04, w: 0, bend: 25, elv: [1, .9], flex: .2 };          // the suitcase handle, trailing behind
export const PULLR = PULL;
export const CUP = { dx: -.04, dy: -.22, w: 0, bend: 50, elv: [1, .3], flex: 1 };          // hand cupped by the ear / the mouth
export const POINT = ARM.point;                                                            // arm out, pointing
export const CLAP = { dx: -.27, dy: -.03, w: 0, bend: 45, elv: [.4, 1], flex: 1, front: true };   // hands together in front of the chest
export const DIP = { dx: .12, dy: .07, w: 0, bend: 25, elv: [1, .7], flex: .5 };           // the anticipation dip before a wave / a point
export const OPEN = { dx: .2, dy: -.02, w: 0, bend: 30, elv: [.6, 1], flex: .7 };          // open hand toward the viewer / the board
export const OUTLOW = { dx: .17, dy: .16, w: 0, bend: 22, elv: [.6, 1], flex: .3 };        // arm a little out, hand low (pointing down)
export const INWARD = { dx: -.1, dy: .1, w: 0, bend: 45, elv: [1, 1], flex: .8 };          // hand pulled in to the body (nervous)
export const RAISE = { dx: .2, dy: -.12, w: 0, bend: 35, elv: [1, .5], flex: .9, tau: .08 };   // arm out and up (a shock, "Oh!"): a snap
export const RUNARM = { dx: .14, dy: -.1, w: 0, bend: 70, elv: [1, 1], flex: 1 };          // running: elbow bent, hand up
export const FACEPALM = { dx: -.33, dy: -.17, w: 0, bend: 45, elv: [1, -.6], flex: 1 };    // across onto the face (elbow up/back)
export const REACH = { dx: .3, dy: -.05, w: 0, bend: 20, elv: [1, 1], flex: .3, front: true };   // the far-side arm held out to the other character
export const HOLDLOW = { dx: -.02, dy: .12, w: 0, bend: 40, elv: [1, 1], flex: 1, front: true };   // a prop held in front, low (the form, a bag)
