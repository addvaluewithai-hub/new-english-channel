// Bean People v2 — acting helpers, standalone for the site (no timeline / lip-sync from tl.js).
// Everything is a pure function of t (seeded randomness only), as in the episodes.
import { clamp, lerp, seg, ss, hash, mulberry } from './lib.js';
import { EXPR, ARM, blendFace, blendArm, pose } from './bean.js';

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

// ---- blinks: seeded every 2.5–4 s, plus one on each listed time (expression changes) ----
const BL = {};
export function blinkAt(id, t, extra = []) {
  if (!BL[id]) { const r = mulberry(id === 'mia' ? 11 : id === 'youssef' ? 23 : 37); const a = []; let x = .7 + r(); while (x < 4000) { a.push(x); x += 2.5 + r() * 1.5; } BL[id] = a; }
  let b = 0;
  const one = c => { const d = Math.abs(t - c - .07); if (d < .07) b = Math.max(b, 1 - d / .07); };
  const L = BL[id]; let lo = 0, hi = L.length;   // binary search to the first blink near t
  while (lo < hi) { const m = (lo + hi) >> 1; if (L[m] < t - 1) lo = m + 1; else hi = m; }
  for (let i = lo; i < L.length && L[i] <= t + 1; i++) one(L[i]);
  for (const c of extra) one(c);
  return b;
}
// idle eye darts: pupils jump to a new seeded target every ~2 s (fast saccade)
export function dart(id, t, amp = .18) {
  const per = 2, i = Math.floor(t / per), u = t / per - i, o = id === 'mia' ? 3 : 0;
  const h0 = hash(i * 7.1 + o), h1 = hash(i * 7.1 + 1.7 + o);
  const prev = [hash((i - 1) * 7.1 + o), hash((i - 1) * 7.1 + 1.7 + o)];
  const k = ss(seg(u, .55 + h0 * .2, .62 + h0 * .2));
  return [lerp(prev[0] - .5, h0 - .5, k) * 2 * amp, lerp(prev[1] - .5, h1 - .5, k) * amp];
}

// simple talking mouth for a clip of known length: A/E/O shapes cycle ~9 times a second, closing between "words"
const SHAPES = [EXPR.talk, EXPR.talkE, EXPR.talkO];
const MOUTH = ['mw', 'mo', 'ms', 'mt', 'mwob', 'masym'];
export function talkFace(face, u, gain = 1) {
  // u: seconds since the clip started
  const i = Math.floor(u * 9), open = Math.max(0, Math.sin(u * 9 * Math.PI)) * (hash(i * 3.3) > .22 ? 1 : 0);
  if (open <= .01) return face;
  const S = SHAPES[Math.floor(hash(i * 1.7) * 3)], o = { ...face }, a = clamp(open * gain);
  for (const m of MOUTH) o[m] = lerp(face[m], S[m], a);
  o.ms = lerp(face.ms, Math.max(S.ms, face.ms * .8), a);
  o.mwob = face.mwob * (1 - a);
  return o;
}

// final face: track face + blink + idle darts (+ talking)
export function liveFace(id, t, face, { darts = true, blinks = [], talk = -1 } = {}) {
  let f = { ...face };
  if (darts) { const [dx, dy] = dart(id, t); f.lx += dx; f.ly += dy * .6; }
  const b = blinkAt(id, t, blinks);
  if (b > 0) f.eye = Math.min(f.eye, 1 - b);
  if (talk >= 0) f = talkFace(f, talk);
  return f;
}

export { EXPR, ARM, pose, blendFace, blendArm };
export const CUP = { dx: -.06, dy: -.22, bend: .25, w: 0 };      // hand cupped by the mouth / ear
export const POINT = { dx: .24, dy: -.1, bend: -.05, w: 0 };      // arm out, pointing
export const CLAP = { dx: -.16, dy: -.06, bend: -.2, w: 0 };      // hands together in front
