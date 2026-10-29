// Bean People — style test "First day" (17 s). Pure function of t.
import { clamp, lerp, seg, ss, eio, eo, ei, back, mulberry } from '/core/lib.js';
import { PAL, mix, tint, shade, INKA, CREAMA, YOUSSEF, MIA, drawBean, drawSuitcase, localToWorld } from './bean.js';
import * as W from './world.js';

const cv = document.getElementById('c'), c = cv.getContext('2d');
const SW = 1920, SH = 1080;
window.DUR = 17;
const TL = { lines: [], talk: [] };

// ---------------- helpers ----------------
const bell = (t, a, b) => { const u = seg(t, a, b); return Math.sin(Math.PI * u); };
const ramp = (t, a, b, e = ss) => e(seg(t, a, b));
// key-framed scalar: [[t, v, ease], ...] (ease applies to the segment ending at that key)
function keys(k, t) {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) {
    const e = k[i][2] || ss; return lerp(k[i - 1][1], k[i][1], e(seg(t, k[i - 1][0], k[i][0])));
  }
  return k[k.length - 1][1];
}
// hop: anticipation squash, stretch in the air, damped landing squash
function hop(t, t0, dur, h) {
  let lift = 0, s = 1;
  if (t > t0 - 0.14 && t < t0) s = 1 - 0.13 * ss(seg(t, t0 - 0.14, t0));
  else if (t >= t0 && t < t0 + dur) { const u = (t - t0) / dur; lift = 4 * h * u * (1 - u); s = 1 + 0.13 * Math.abs(1 - 2 * u); }
  else if (t >= t0 + dur && t < t0 + dur + 0.6) { const v = t - t0 - dur; s = 1 - 0.16 * Math.exp(-v * 8) * Math.cos(v * 24); }
  return { lift, s };
}
function blinkAt(t, list) { let b = 0; for (const x of list) b = Math.max(b, bell(t, x, x + 0.14)); return b; }
function talkOpen(t, who) {
  let o = 0;
  for (const [a, b, w] of TL.talk) {
    if (w !== who || t < a || t > b) continue;
    const n = Math.max(1, Math.round((b - a) / 0.15)), u = (t - a) / (b - a);
    const env = Math.min(1, (t - a) / 0.04, (b - t) / 0.04);
    o = Math.max(o, env * (0.35 + 0.65 * Math.abs(Math.sin(Math.PI * u * n))));
  }
  return o;
}

// ---------------- camera ----------------
const CAM = [
  [0, [905, 560, 1.1]],
  [2.7, [960, 540, 1.0], eio],
  [3.0, [960, 540, 1.0]],
  [6.9, [1265, 585, 1.2], eio],
  [7.9, [1655, 598, 1.7], eio],
  [15.22, [1660, 600, 1.76], x => x],
  [15.55, [1468, 696, 3.0], eo],
  [17, [1478, 700, 3.12], x => x],
];
function cam(t) {
  let k0 = CAM[0], k1 = CAM[0];
  for (let i = 1; i < CAM.length; i++) { if (t <= CAM[i][0]) { k0 = CAM[i - 1]; k1 = CAM[i]; break; } k0 = k1 = CAM[i]; }
  const u = k0 === k1 ? 1 : (k1[2] || ss)(seg(t, k0[0], k1[0]));
  return k0[1].map((v, i) => lerp(v, k1[1][i], u));
}
let CAMV = [960, 540, 1];
function layer(d) {
  const [cx, cy, z] = CAMV, zd = 1 + (z - 1) * d, cxd = 960 + (cx - 960) * d, cyd = 540 + (cy - 540) * d;
  c.setTransform(zd, 0, 0, zd, 960 - cxd * zd, 540 - cyd * zd);
}
const toScreen = (x, y) => [(x - CAMV[0]) * CAMV[2] + 960, (y - CAMV[1]) * CAMV[2] + 540];

// ---------------- Youssef ----------------
const G = 850;
const WALK0 = 2.95, WALK1 = 5.4, X0 = 640, X1 = 1500;
const yX = t => lerp(X0, X1, ss(seg(t, WALK0, WALK1)));
function yHold(t) { return Math.min(ramp(t, 2.75, 2.95), 1 - ramp(t, 5.45, 5.7)); }
function youssef(t) {
  const x = yX(t), walking = t > WALK0 && t < WALK1;
  const p = { x, gy: G, s: 1, rot: 0, f: 0, lx: 0, ly: 0, t };
  const ph = (x - X0) / 105 * Math.PI;
  p.walk = ph; p.walkAmt = walking ? Math.min(1, (t - WALK0) / 0.2, (WALK1 - t) / 0.25) : 0;
  // bounce walk
  p.lift = Math.abs(Math.sin(ph)) * 12 * p.walkAmt;
  p.s = 1 + 0.035 * Math.cos(2 * ph) * p.walkAmt;
  p.rot = 0.06 * p.walkAmt;
  // breathing
  p.s *= 1 + 0.008 * Math.sin(t * 2.6);
  // facing / gaze
  p.f = keys([[1.6, 0], [2.95, 0.15], [3.15, 0.8], [5.4, 0.8], [5.8, 0.35], [7.25, 0.35], [7.5, 0.72], [15.3, 0.72], [15.6, 0.28]], t);
  p.lx = keys([[1.6, -0.7], [2.2, 0.8], [2.6, 0], [3.2, 0.4], [5.6, 0.4], [6.0, 0.1], [7.3, 0.2], [7.5, 0.8], [11.3, 0.8], [11.5, -0.8], [11.85, -0.8], [12.05, 0.6], [12.3, 0.8], [15.3, 0.8], [15.6, -0.9]], t);
  p.ly = keys([[1.6, -0.8], [2.6, -0.3], [3.2, 0], [5.5, 0], [5.9, -1.1], [6.5, -1.1], [6.8, 0.2], [7.4, 0.2], [7.6, 0], [15.3, 0], [15.6, 0.9]], t);
  // expressions
  p.smile = keys([[1.6, 0.4], [2.2, 0.9], [2.9, 0.8], [3.2, 0.9], [5.4, 0.8], [5.8, 0.1], [6.4, 0.1], [6.7, -0.15], [7.5, 0.2], [8.2, 0.7], [9.6, 0.7], [9.9, 0.9], [11.3, 0.5], [11.5, 0.1], [12.6, 0.3], [12.9, 0.9], [14.6, 0.85], [14.9, 0.5], [15.3, 0.3], [15.6, 0.15]], t);
  p.round = bell(t, 5.7, 6.5) * 0.9 + bell(t, 7.35, 7.95) * 0.8;
  p.happy = Math.max(bell(t, 2.15, 2.85) > 0.3 ? 1 : 0, 0);
  p.brow = 0.6 * bell(t, 1.6, 2.6) + 0.9 * bell(t, 5.6, 6.6) + bell(t, 7.3, 8.2) + 0.5 * bell(t, 9.9, 10.8) + 0.7 * bell(t, 14.55, 15.35);
  p.worry = 0.85 * ramp(t, 6.5, 6.75) * (1 - ramp(t, 7.3, 7.5)) + 0.8 * bell(t, 11.25, 12.6) + ramp(t, 15.3, 15.6);
  p.wide = 1 + 0.25 * bell(t, 7.3, 8.0) + 0.3 * bell(t, 14.6, 15.4);
  p.blink = blinkAt(t, [1.15, 3.9, 6.95, 9.15, 11.7, 13.9, 16.35]);
  const talk = talkOpen(t, 'youssef');
  p.open = talk * (0.8 + 0.2 * p.smile);
  // hop for joy at the reveal
  const h1 = hop(t, 2.3, 0.42, 70), h2 = hop(t, 7.42, 0.24, 22), h3 = hop(t, 10.08, 0.22, 16);
  p.lift += h1.lift + h2.lift + h3.lift; p.s *= h1.s * h2.s * h3.s;
  // gulp (nervous) + hesitation squash
  p.s *= 1 - 0.07 * bell(t, 6.55, 6.85) - 0.05 * bell(t, 11.2, 12.4);
  p.s *= 1 + 0.03 * talk;
  p.rot += -0.05 * bell(t, 11.2, 12.4) + 0.06 * bell(t, 12.75, 13.7) + 0.04 * bell(t, 9.95, 10.7);
  // overshoot when stopping
  const vstop = t - WALK1; if (vstop > 0 && vstop < 0.8) p.rot += 0.07 * Math.exp(-vstop * 6) * Math.cos(vstop * 14);
  // embarrassed: sink, shrink, blush, sweat, wobble mouth
  const em = ramp(t, 15.3, 15.7);
  p.s *= 1 - 0.09 * em; p.rot += -0.04 * em;
  p.blush = em; p.hatch = ramp(t, 15.55, 15.8) * 0.9;
  p.wob = em; if (em > 0.2) { p.smile = 0.25; }
  p.sweat = t > 15.6 ? seg(t, 15.6, 16.6) : 0;
  // hands
  const hands = [null, null];
  // joy: both hands up in the hop
  const joy = bell(t, 2.15, 2.85);
  if (joy > 0) { hands[0] = [lerp(-0.56, -0.66, joy), lerp(-0.25, -0.62, joy)]; hands[1] = [lerp(0.56, 0.66, joy), lerp(-0.25, -0.62, joy)]; }
  const hold = yHold(t);
  if (hold > 0) hands[0] = [lerp(hands[0] ? hands[0][0] : -0.56, -0.62, hold), lerp(hands[0] ? hands[0][1] : -0.25, -0.3, hold)];
  // collar tug at the gulp
  const tug = bell(t, 6.35, 7.2);
  if (tug > 0) hands[1] = [lerp(0.56, 0.12 + p.f * 0.13, ss(Math.min(1, tug * 1.6))), lerp(-0.25, -0.4, ss(Math.min(1, tug * 1.6)))];
  // "Hello!" wave
  const wave = bell(t, 9.92, 11.0);
  if (wave > 0) { const a = Math.sin((t - 9.9) * 18) * 0.06; hands[1] = [lerp(0.56, 0.7 + a, ss(Math.min(1, wave * 2))), lerp(-0.25, -0.64, ss(Math.min(1, wave * 2)))]; }
  // "I Youssef" — taps his chest
  const me = bell(t, 12.55, 13.85);
  if (me > 0) { const k = ss(Math.min(1, me * 2)); hands[1] = [lerp(0.56, 0.1 + p.f * 0.12, k), lerp(-0.25, -0.33 + 0.02 * Math.sin((t - 12.7) * 20) * k, k)]; }
  // embarrassed: scratches the back of his head
  const scr = ramp(t, 15.55, 15.85);
  if (scr > 0) { const k = ss(scr); hands[0] = [lerp(-0.56, -0.5, k), lerp(-0.25, -0.8 + 0.02 * Math.sin(t * 24), k)]; }
  p.hands = hands;
  return p;
}
function suitcase(t, p) {
  const hold = yHold(t);
  const rest = p.x - 128;
  let wx = lerp(rest, p.x - 215, hold);
  let ang = 0, rod = 0;
  if (hold > 0) {
    const [hx, hy] = localToWorld(YOUSSEF, p, -0.62, -0.3);
    const dx = hx - wx, dy = hy - (G - 9);
    const a = Math.atan2(dx, -dy), d = Math.hypot(dx, dy);
    ang = a * hold; rod = Math.max(0, (d - 98) * hold);
  }
  // settle wobble after release
  const v = t - 5.65; if (v > 0 && v < 1) ang += -0.12 * Math.exp(-v * 5) * Math.sin(v * 16);
  // little hop of the case at Youssef's joy hop
  return { wx, ang, rod };
}

// ---------------- Mia ----------------
const MX = 1812;
function miaBase(t) {
  const out = ramp(t, 7.5, 7.86, eio);
  const p = { x: lerp(1760, MX, out), gy: lerp(802, G, out), sc: lerp(0.88, 1, out), s: 1, rot: 0, f: -0.72, t };
  const h = hop(t, 7.52, 0.34, 30), h2 = hop(t, 8.22, 0.2, 14);
  p.lift = h.lift + h2.lift; p.s = h.s * h2.s * (1 + 0.008 * Math.sin(t * 2.3 + 1));
  p.rot = 0.06 * bell(t, 8.75, 9.6) - 0.045 * bell(t, 10.8, 12.6) + 0.13 * ramp(t, 14.3, 14.6, back) * (1 - ramp(t, 16.2, 16.8));
  return p;
}
function mia(t) {
  const p = miaBase(t);
  // ponytail secondary motion from recent body motion
  const a = miaBase(t - 0.08), b = miaBase(t - 0.16);
  p.tail = clamp(2.2 * (a.rot - p.rot) + 0.8 * (b.rot - p.rot) + 0.006 * (p.x - a.x) + 0.004 * (p.lift - a.lift) + 0.03 * Math.sin(t * 2.2), -0.6, 0.6);
  p.lx = keys([[7.6, -0.3], [7.9, -0.8], [14.3, -0.8], [14.5, -0.5]], t);
  p.ly = keys([[8, 0], [14.3, 0], [14.6, -0.2]], t);
  p.smile = keys([[7.6, 0.8], [9.6, 0.9], [12.6, 0.7], [13.3, 0.35], [14.3, 0.0], [14.6, -0.1], [16.4, -0.1], [16.8, 0.3]], t);
  p.happy = (t > 8.85 && t < 9.45) ? 1 : 0;
  p.brow = 0.6 * bell(t, 7.6, 9.6) + 0.3 * bell(t, 10.0, 11.0);
  p.worry = 0.4 * bell(t, 12.9, 14.4);
  p.arch = -1.1 * ramp(t, 14.3, 14.55) * (1 - ramp(t, 16.3, 16.7));
  p.blink = blinkAt(t, [8.05, 10.45, 12.2, 13.75, 16.0]);
  p.open = talkOpen(t, 'mia');
  p.s *= 1 + 0.03 * p.open;
  const hands = [null, null];
  const wave = bell(t, 7.85, 9.65);
  if (wave > 0) { const k = ss(Math.min(1, wave * 2.5)), w = Math.sin((t - 7.9) * 15) * 0.09; hands[0] = [lerp(-0.56, -0.7 + w, k), lerp(-0.25, -0.68, k)]; }
  const puzz = ramp(t, 14.35, 14.6) * (1 - ramp(t, 16.3, 16.7));
  if (puzz > 0) hands[1] = [lerp(0.56, 0.3, puzz), lerp(-0.25, -0.5, puzz)];
  p.hands = hands;
  return p;
}

// ---------------- UI: bubbles, subtitles ----------------
const LINES = [
  { who: 'mia', t0: 7.92, t1: 9.95, words: [['Hi!', 8.2], ["I'm", 8.7], ['Mia.', 8.8]] },
  { who: 'youssef', t0: 9.85, t1: 14.25, words: [['Hello!', 10.1], ['I...', 11.4], ['I', 12.5], ['Youssef.', 12.8]] },
  { who: 'mia', t0: 14.85, t1: 16.45, words: [['Sorry?', 15.05]] },
];
const SUBS = [
  { t0: 0.3, t1: 2.2, text: 'أول يوم ليّا في لندن…' },
  { t0: 2.25, t1: 5.35, text: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
  { t0: 5.4, t1: 7.75, text: 'لحد ما قابلت ميا.' },
];
const BFONT = '600 60px Fredoka';
let texts = [];
function bubble(t, L, anchor, side) {
  if (t < L.t0 || t > L.t1) return;
  const kIn = back(seg(t, L.t0, L.t0 + 0.28), 2.2), kOut = 1 - ei(seg(t, L.t1 - 0.2, L.t1));
  const k = Math.min(kIn, kOut); if (k <= 0.001) return;
  c.font = BFONT;
  const sp = c.measureText(' ').width;
  const ws = L.words.map(([w]) => c.measureText(w).width);
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const bw = tw + 84, bh = 112;
  let [ax, ay] = anchor;
  let bx = side < 0 ? ax - bw + 70 : ax - 70, by = ay - 70 - bh;
  bx = clamp(bx, 40, SW - 40 - bw); by = clamp(by, 70, SH - 40 - bh);
  // tail: from bubble bottom toward the speaker (even off-screen)
  const tbx = clamp(ax, bx + 50, bx + bw - 50), tby = by + bh - 2;
  let dx = ax - tbx, dy = ay - tby; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
  const tl = Math.min(64, dl * 0.8), tip = [tbx + dx * tl, tby + dy * tl];
  c.save();
  c.translate(tip[0], tip[1]); c.scale(k, k); c.translate(-tip[0], -tip[1]);
  const col = L.who === 'mia' ? PAL.teal : PAL.tomato;
  const shape = (ox, oy) => {
    c.beginPath(); c.roundRect(bx + ox, by + oy, bw, bh, 34);
    c.moveTo(tbx - 22 + ox, tby + oy); c.quadraticCurveTo(tbx + dx * tl * 0.5 + ox, tby + dy * tl * 0.4 + oy, tip[0] + ox, tip[1] + oy);
    c.quadraticCurveTo(tbx + dx * tl * 0.3 + 10 + ox, tby + dy * tl * 0.5 + oy, tbx + 22 + ox, tby + oy); c.closePath();
  };
  c.fillStyle = INKA(0.16); shape(0, 10); c.fill();
  c.fillStyle = PAL.cream; shape(0, 0); c.fill();
  // speaker colour bar + name tab
  c.fillStyle = col; c.beginPath(); c.roundRect(bx + 20, by + bh - 14, bw - 40, 6, 3); c.fill();
  const name = L.who === 'mia' ? 'MIA' : 'YOUSSEF';
  c.font = '400 28px "Lilita One"'; c.letterSpacing = '2px';
  const nw = c.measureText(name).width + 30;
  c.fillStyle = col; c.beginPath(); c.roundRect(bx + 26, by - 20, nw, 40, 20); c.fill();
  c.fillStyle = PAL.cream; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, bx + 26 + nw / 2, by + 1);
  c.letterSpacing = '0px';
  // karaoke words
  c.font = BFONT; c.textAlign = 'left'; c.textBaseline = 'middle';
  let x = bx + 42;
  L.words.forEach(([w, wt], i) => {
    const on = ss(seg(t, wt - 0.06, wt + 0.1));
    c.fillStyle = mix('ink', 'cream', 0.62 * (1 - on));
    c.fillText(w, x, by + bh / 2 - 2 - 3 * bell(t, wt - 0.06, wt + 0.22));
    x += ws[i] + sp;
  });
  c.restore();
  texts.push({ id: 'bubble-' + L.t0, text: L.words.map(w => w[0]).join(' '), x0: bx, y0: by - 20, x1: bx + bw, y1: by + bh });
}
// thought ghost: "I ___ Youssef." -> "am" drops into the slot
function thought(t, anchor) {
  const t0 = 15.75, t1 = 17.2;
  if (t < t0) return;
  const k = back(seg(t, t0, t0 + 0.3), 2);
  c.font = '600 54px Fredoka';
  const parts = ['I', 'SLOT', 'Youssef.'], sp = 16, slotW = 104;
  const ws = parts.map(p => p === 'SLOT' ? slotW : c.measureText(p).width);
  const tw = ws.reduce((a, b) => a + b) + sp * 2, bw = tw + 76, bh = 100;
  const [ax, ay] = anchor;
  const bx = clamp(ax - bw - 60, 40, SW - bw - 40), by = clamp(ay - bh - 120, 60, SH);
  c.save();
  const ox = bx + bw, oy = by + bh;
  c.translate(ox, oy); c.scale(k, k); c.translate(-ox, -oy);
  // trail dots toward the head
  c.fillStyle = CREAMA(0.95);
  for (const [u, r] of [[0.35, 16], [0.7, 10]]) { c.beginPath(); c.arc(lerp(ox - 30, ax - 10, u), lerp(oy - 4, ay - 30, u), r, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = INKA(0.14); c.beginPath(); c.roundRect(bx, by + 9, bw, bh, 50); c.fill();
  c.fillStyle = CREAMA(0.97); c.beginPath(); c.roundRect(bx, by, bw, bh, 50); c.fill();
  let x = bx + 38; const cy = by + bh / 2;
  c.textBaseline = 'middle'; c.textAlign = 'left';
  parts.forEach((p, i) => {
    if (p === 'SLOT') {
      const fill = back(seg(t, 16.1, 16.35), 2.5);
      c.strokeStyle = PAL.mustard; c.lineWidth = 5; c.setLineDash([12, 9]);
      c.beginPath(); c.roundRect(x, cy - 34, slotW, 64, 14); c.stroke(); c.setLineDash([]);
      if (fill > 0) {
        c.save(); c.translate(x + slotW / 2, cy); c.scale(fill, fill);
        c.fillStyle = PAL.mustard; c.beginPath(); c.roundRect(-slotW / 2, -34, slotW, 64, 14); c.fill();
        c.fillStyle = PAL.ink; c.textAlign = 'center'; c.fillText('am', 0, -2); c.restore(); c.textAlign = 'left';
      } else {
        const bl = 0.5 + 0.5 * Math.cos((t - t0) * 12);
        c.fillStyle = `rgba(240,181,63,${0.4 + 0.5 * bl})`; c.textAlign = 'center'; c.fillText('?', x + slotW / 2, cy - 2); c.textAlign = 'left';
      }
    } else { c.fillStyle = mix('ink', 'cream', 0.3); c.fillText(p, x, cy - 2); }
    x += ws[i] + sp;
  });
  c.restore();
  texts.push({ id: 'thought', text: 'I am Youssef.', x0: bx, y0: by, x1: bx + bw, y1: by + bh });
}
function subtitles(t) {
  for (const S of SUBS) {
    if (t < S.t0 || t > S.t1) continue;
    const a = Math.min(ss(seg(t, S.t0, S.t0 + 0.18)), 1 - ss(seg(t, S.t1 - 0.18, S.t1)));
    c.font = '800 56px "Baloo Bhaijaan 2"'; c.direction = 'rtl';
    const tw = c.measureText(S.text).width, bw = tw + 150, bh = 92;
    const bx = (SW - bw) / 2, by = SH - 64 - bh + (1 - a) * 14;
    c.globalAlpha = a;
    c.fillStyle = 'rgba(30,34,53,0.86)'; c.beginPath(); c.roundRect(bx, by, bw, bh, bh / 2); c.fill();
    // diary mark (mustard notebook) at the RTL start edge
    const mx = bx + bw - 62, my = by + bh / 2;
    c.fillStyle = PAL.mustard; c.beginPath(); c.roundRect(mx - 16, my - 21, 32, 42, 6); c.fill();
    c.fillStyle = shade('mustard', 0.35); c.fillRect(mx - 16, my - 21, 7, 42);
    c.fillStyle = PAL.ink; c.fillRect(mx - 3, my - 8, 14, 3); c.fillRect(mx - 3, my, 14, 3);
    c.fillStyle = PAL.cream; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText(S.text, bx + bw - 102, my + 4);
    c.direction = 'ltr'; c.globalAlpha = 1;
    texts.push({ id: 'sub-' + S.t0, text: S.text, x0: bx, y0: by, x1: bx + bw, y1: by + bh });
  }
}
function dayChip(t) {
  const a = Math.min(ss(seg(t, 0.7, 1.0)), 1 - ss(seg(t, 5.0, 5.4)));
  if (a <= 0) return;
  c.globalAlpha = a;
  c.font = '400 34px "Lilita One"'; c.letterSpacing = '3px';
  const txt = 'DAY 1  ·  LONDON', w = c.measureText(txt).width + 48;
  const x = 56, y = 52 - (1 - a) * 10;
  c.fillStyle = INKA(0.16); c.beginPath(); c.roundRect(x, y + 7, w, 58, 29); c.fill();
  c.fillStyle = PAL.tomato; c.beginPath(); c.roundRect(x, y, w, 58, 29); c.fill();
  c.fillStyle = PAL.cream; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(txt, x + 24, y + 31);
  c.letterSpacing = '0px'; c.globalAlpha = 1;
}
function questionMark(t, p) {
  const k = back(seg(t, 14.42, 14.7), 2.6) * (1 - ss(seg(t, 16.2, 16.5)));
  if (k <= 0) return;
  const [sx, sy] = toScreen(p.x + 40, p.gy - MIA.H - 70);
  c.save(); c.translate(sx, sy); c.rotate(0.18 + 0.05 * Math.sin(t * 5)); c.scale(k * CAMV[2] / 1.8, k * CAMV[2] / 1.8);
  c.font = '400 92px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = INKA(0.16); c.fillText('?', 0, 8);
  c.fillStyle = PAL.teal; c.fillText('?', 0, 0);
  c.restore();
}

// ---------------- grain (static paper tooth, made once) ----------------
const grain = document.createElement('canvas'); grain.width = 960; grain.height = 540;
{
  const g = grain.getContext('2d'), id = g.createImageData(960, 540), r = mulberry(7);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
}

// ---------------- frame ----------------
function render(t) {
  texts = [];
  CAMV = cam(t);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = PAL.sky; c.fillRect(0, 0, SW, SH);
  layer(0.08); W.drawClouds(c, t);
  layer(0.25); W.drawSkylineFar(c);
  layer(0.42); W.drawSkylineMid(c);
  layer(1);
  W.drawStreetBack(c, t);
  W.drawGround(c);
  // door + Mia emerging (she is behind the leaf until she steps out)
  const open = ramp(t, 7.12, 7.45, eio);
  const pm = mia(t), py = youssef(t);
  const miaVisible = t > 7.1;
  if (miaVisible && t < 7.5) drawBean(c, MIA, pm);
  W.drawDoorLeaf(c, open);
  W.drawStreetProps(c);
  if (miaVisible && t >= 7.5) drawBean(c, MIA, pm);
  const sc = suitcase(t, py);
  drawSuitcase(c, sc.wx, G, sc.ang, sc.rod);
  drawBean(c, YOUSSEF, py);
  // bus departs (in front of the pavement)
  const bu = seg(t, 0.45, 3.0), bx = 110 + 2700 * Math.pow(bu, 2.2);
  if (bx < 2900) W.drawBus(c, bx, t, bu);

  // ---------- screen-space UI ----------
  c.setTransform(1, 0, 0, 1, 0, 0);
  questionMark(t, pm);
  const headY = toScreen(py.x - 10, py.gy - YOUSSEF.H - 20), headM = toScreen(pm.x + 10, pm.gy - MIA.H - 20);
  bubble(t, LINES[0], headM, 1);
  bubble(t, LINES[1], headY, -1);
  bubble(t, LINES[2], toScreen(pm.x - 20, pm.gy - MIA.H * 0.75), 1);
  thought(t, toScreen(py.x - 40, py.gy - YOUSSEF.H * 0.98));
  subtitles(t);
  dayChip(t);
  // paper tooth
  c.globalAlpha = 0.045; c.globalCompositeOperation = 'overlay';
  c.drawImage(grain, 0, 0, SW, SH);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  // iris in / iris out (geometric transitions)
  let iris = null;
  if (t < 0.7) iris = [960, 600, 1300 * eo(seg(t, 0.0, 0.7))];
  if (t > 16.45) { const [fx, fy] = toScreen(py.x + 18, py.gy - YOUSSEF.H * 0.62); iris = [fx, fy, 1400 * (1 - eio(seg(t, 16.45, 16.94)))]; }
  if (iris) {
    c.fillStyle = PAL.ink; c.beginPath(); c.rect(0, 0, SW, SH);
    c.arc(iris[0], iris[1], Math.max(0, iris[2]), 0, Math.PI * 2, true); c.fill('evenodd');
  }
}

window.TEXTS = t => { render(t); return texts; };
async function init() {
  const tl = await (await fetch('timeline.json')).json().catch(() => null);
  TL.talk = tl ? tl.talk : [];
  const fams = ['600 60px Fredoka', '400 40px "Lilita One"', '800 56px "Baloo Bhaijaan 2"'];
  await Promise.all(fams.map(f => document.fonts.load(f, f.includes('Baloo') ? 'أول يوم' : 'Hi')));
  await document.fonts.ready;
  window.render = render;
  render(0);
  window.READY = true;
}
init();
