// Site stand-in for the episodes' tl.js. The episodes read the viseme track TL.mouth ([[t0, t1, who, shape]], Preston Blair
// shapes A–H) from timeline.json; the site has no timeline, so bean-widget.js writes a synthetic track for each clip it plays
// (speech()) and act.js's lipsync() reads it through the same mouthAt() as the episodes (copied verbatim below).
import { seg, ss, mulberry } from './lib.js';

export const TL = { mouth: [], mouth_nar: [] };

// a plausible viseme track for `dur` seconds of speech starting at t0, for the mouth keyed `who` (one per widget). Shape mix and
// segment lengths follow the episodes' tracks (mostly B / C / F, ≈ .1–.3 s each, a short closed gap between some words).
const BAG = 'BBBBBBBBCCCCCCFFFFFDDAEHG';
export function speech(who, t0, dur, seed = 1) {
  const r = mulberry(Math.floor(seed * 9973) | 0), out = [];
  let t = t0, prev = '';
  const end = t0 + Math.max(.25, dur);
  while (t < end - .06) {
    if (out.length && r() < .14) t += .07 + r() * .12;          // a word gap: the mouth closes
    let s = BAG[Math.floor(r() * BAG.length)];
    if (s === prev) s = BAG[Math.floor(r() * BAG.length)];
    const d = Math.min(.1 + r() * .18, end - t);
    if (d < .05) break;
    out.push([t, t + d, who, s]); prev = s; t += d;
  }
  TL.mouth = TL.mouth.filter(m => m[2] !== who).concat(out).sort((a, b) => a[0] - b[0]);
}
export function hush(who) { TL.mouth = TL.mouth.filter(m => m[2] !== who); }
export const talking = (who, t) => TL.mouth.some(m => m[2] === who && m[1] + .7 > t);

// ---- verbatim from production/ep02-good-morning/tl.js ----
// lip sync from the viseme track: mouthAt returns the blend weights of the shapes near t: each segment eases in from .05 s before
// its onset to .01 s after (the mouth leads the sound by about a frame) and out the same way at its end, so two adjacent segments
// always sum to 1 and an isolated one fades over ≈2 frames. The remaining weight is the resting mouth: `rest` says how much of it
// is a closed mouth (a short gap inside speech) rather than the face's own expression (a long gap).
const R0 = .05, R1 = .01, edge = (t, x) => ss((t - x + R0) / (R0 + R1));
export function mouthAt(who, t, extra) {
  const w = {}; let talk = 0, prev = -1e9, next = 1e9, cur = null;
  const take = (a, b, s) => {
    if (b <= t) { if (b > prev) prev = b; } else if (a > t) { if (a < next) next = a; } else cur = [a, b];
    if (a > t + R0 || b < t - R1) return;
    const k = edge(t, a) * (1 - edge(t, b));
    if (k > .001) { w[s] = (w[s] || 0) + k; talk += k; }
  };
  for (const [a, b, id, s] of TL.mouth) { if (id !== who) continue; take(a, b, s); if (a > t) break; }
  if (extra && extra.length) {
    const inX = (a, b) => { const m = (a + b) / 2; for (const [x0, x1] of extra) if (m >= x0 - .05 && m <= x1 + .05) return true; return false; };
    for (const [a, b, , s] of TL.mouth_nar) { if (!inX(a, b)) continue; take(a, b, s); if (a > t) break; }
  }
  if (talk > 1) { for (const s in w) w[s] /= talk; talk = 1; }
  const gap = cur ? (t < (cur[0] + cur[1]) / 2 ? cur[0] - prev : next - cur[1]) : next - prev;
  return { w, talk, rest: 1 - seg(gap, .3, .6) };
}
