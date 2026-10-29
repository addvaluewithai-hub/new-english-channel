// Episode 1 — acting helpers. Everything is a pure function of t (seeded randomness only).
import { clamp, lerp, seg, ss, eio, hash, mulberry } from '/core/lib.js';
import { EXPR, ARM, blendFace, blendArm, pose } from './bean.js';
import { talkAt } from './tl.js';

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
  let x = segs[0].x0, y = segs[0].y0 ?? 0, k = segs[0].k0 ?? 1, phase = 0, walking = 0, dir = 1, stepT = .42;
  for (const s of segs) {
    if (t < s.t0) break;
    const D = Math.max(.01, s.t1 - s.t0), n = Math.max(1, Math.round(D / (s.step || .42))), u = clamp((t - s.t0) / D);
    const e = s.ease === 'lin' ? u : smoothLin(u, Math.min(.18, .3 / D));
    x = lerp(s.x0, s.x1, e);
    if (s.y0 != null) y = lerp(s.y0, s.y1, e);
    if (s.k0 != null) k = lerp(s.k0, s.k1, e);
    phase += n * u; dir = Math.sign(s.x1 - s.x0) || dir; stepT = D / n;
    if (t < s.t1 && !s.glide) walking = 1;
  }
  return { x, y, k, phase, walking, dir, stepT };
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
    lean: A * .05 * m.dir,
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

// mouth shapes for lip sync (A, E, O)
const SHAPES = [EXPR.talk, EXPR.talkE, EXPR.talkO];
const MOUTH = ['mw', 'mo', 'ms', 'mt', 'mwob', 'masym'];
export function lipsync(face, who, t, extra, gain = 1) {
  const L = talkAt(who, t, extra);
  if (L.open <= .01) return face;
  const S = SHAPES[L.shape], o = { ...face }, a = clamp(L.open * gain);
  for (const m of MOUTH) o[m] = lerp(face[m], S[m], a);
  o.ms = lerp(face.ms, Math.max(S.ms, face.ms * .8), a);   // keep a smile while talking
  o.mwob = face.mwob * (1 - a);
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

export { EXPR, ARM, pose };
export const PULL = { dx: .2, dy: -.09, bend: .15, w: 0 };
export const PULLR = { dx: .2, dy: -.09, bend: .15, w: 0 };
export const CUP = { dx: -.06, dy: -.22, bend: .25, w: 0 };      // hand cupped by the mouth / ear
export const POINT = { dx: .24, dy: -.1, bend: -.05, w: 0 };      // arm out, pointing
export const CLAP = { dx: -.16, dy: -.06, bend: -.2, w: 0 };      // hands together in front
