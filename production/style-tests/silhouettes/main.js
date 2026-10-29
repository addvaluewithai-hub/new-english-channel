// Silhouettes on Colour — style test. Canvas2D, deterministic render(t).
import { clamp, lerp, seg, ss, eio, eo, hash, TAU, monotone, env } from '/core/lib.js';

const W = 1920, H = 1080, DUR = 17;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const BG = { 1: mk(W, H), 0.5: mk(W / 2, H / 2), 0.25: mk(W / 4, H / 4) };
const MID = mk(W / 2, H / 2);                 // two-step upscale for the ¼ background
const CL = mk(W, H), cg = CL.getContext('2d'); // character + rim pass

// ---------------------------------------------------------------- timeline
const NARR = [
  { t0: 0.55, t1: 2.62, ar: 'أول يوم ليّا في لندن…' },
  { t0: 2.62, t1: 5.72, ar: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
  { t0: 5.72, t1: 7.75, ar: 'لحد ما قابلت ميا.' },
];
const LINES = [
  { who: 'mia', text: "Hi! I'm Mia.", t0: 8.0, t1: 9.5, s0: 7.88, s1: 9.8 },
  { who: 'youssef', text: 'Hello! I... I Youssef.', t0: 9.9, t1: 13.6, s0: 9.86, s1: 14.4 },
  { who: 'mia', text: 'Sorry?', t0: 14.95, t1: 15.4, s0: 14.88, s1: 16.95 },
];
const TALK = [[8.2, 8.64, 'mia'], [8.7, 8.84, 'mia'], [8.8, 9.24, 'mia'], [10.1, 10.54, 'youssef'], [11.4, 11.74, 'youssef'],
  [12.5, 12.84, 'youssef'], [12.8, 13.34, 'youssef'], [15.02, 15.36, 'mia']];
const speak = (who, t) => { let v = 0; for (const s of TALK) if (s[2] === who) v = Math.max(v, env(t, s[0] - 0.04, s[1] + 0.14, 0.05, 0.16)); return v; };
const lineOn = (who, t) => { let v = 0; for (const l of LINES) if (l.who === who) v = Math.max(v, env(t, l.t0 - 0.15, l.t1 + 0.35, 0.2, 0.4)); return v; };

// ---------------------------------------------------------------- colour
const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const MOODS = {
  base: { skyTop: '#1b1640', skyMid: '#5a2d68', skyLow: '#d4646c', hor: '#f6ad72', sun: '#fff0c8', haze: '#ee9c7c', far: '#b86a86', far2: '#84466f', mid: '#4e2656', road: '#35203f', near: '#22152f', ink: '#0f0a16', win: '#ffc370', rim: '#ffd59a' },
  warm: { skyTop: '#2a1a48', skyMid: '#7a3a6a', skyLow: '#ec7a62', hor: '#ffc27a', sun: '#fff6d8', haze: '#f7b47e', far: '#cf7d84', far2: '#9a5270', mid: '#5f2d58', road: '#40224a', near: '#281734', ink: '#120a17', win: '#ffd27a', rim: '#ffe0a6' },
  cool: { skyTop: '#0f1433', skyMid: '#2c3466', skyLow: '#5d6aa3', hor: '#a3a9cf', sun: '#e4e8ff', haze: '#8c92c0', far: '#6c6f9f', far2: '#4a4c80', mid: '#2e2f5e', road: '#23244a', near: '#171833', ink: '#0a0b17', win: '#f2c98a', rim: '#c9d3ff' },
};
for (const m in MOODS) for (const k in MOODS[m]) MOODS[m][k] = hx(MOODS[m][k]);
const RED = hx('#e5483d'), TEAL = hx('#2fa89c'), CREAM = hx('#fff4e2'), LRED = hx('#ff7a68'), LTEAL = hx('#62d9cb');
function mood(t) {
  const w = env(t, 7.85, 10.6, 0.7, 1.1), c = ss(seg(t, 14.98, 15.75));
  const P = {};
  for (const k in MOODS.base) P[k] = mix(mix(MOODS.base[k], MOODS.warm[k], w), MOODS.cool[k], c);
  P.cool = c; P.warm = w;
  return P;
}

// ---------------------------------------------------------------- camera
function camera(t) {
  if (t < 7.75) { const u = eio(seg(t, 0, 7.75)); return { shot: 1, x: lerp(-120, 150, u), y: lerp(-390, -330, u), z: lerp(1.0, 1.25, u) }; }
  if (t < 15.4) { const u = ss(seg(t, 7.75, 15.4)); return { shot: 2, x: lerp(415, 425, u), y: -155, z: lerp(2.2, 2.32, u) }; }
  const u = eo(seg(t, 15.4, 17)); return { shot: 3, x: lerp(318, 322, u), y: lerp(-196, -200, u), z: lerp(5.0, 5.3, u) };
}
const scl = (p, cam) => 1 + (cam.z - 1) * p;
const proj = (x, y, p, cam) => { const s = scl(p, cam); return [(x - cam.x * p) * s + 960, (y - cam.y * p) * s + 540]; };
function LT(g, p, cam, r = 1, dx = 0, dy = 0) { const s = scl(p, cam); g.setTransform(s * r, 0, 0, s * r, (960 - cam.x * p * s + dx) * r, (540 - cam.y * p * s + dy) * r); }

// ---------------------------------------------------------------- shape helpers
function smooth(g, pts) { // closed smooth path through midpoints
  const n = pts.length; g.beginPath();
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let s = m(pts[n - 1], pts[0]); g.moveTo(s[0], s[1]);
  for (let i = 0; i < n; i++) { const q = m(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], q[0], q[1]); }
  g.closePath();
}
function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function limb(g, a, b, w) { g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
function ik(s, t, l1, l2, bend) {
  let dx = t[0] - s[0], dy = t[1] - s[1], d = Math.hypot(dx, dy);
  const mx = l1 + l2 - 0.01, mn = Math.abs(l1 - l2) + 0.5;
  if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; } if (d < mn) { dx *= mn / d; dy *= mn / d; d = mn; }
  const a = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const ang = a + bend * A;
  return { e: [s[0] + Math.cos(ang) * l1, s[1] + Math.sin(ang) * l1], h: [s[0] + dx, s[1] + dy] };
}
const rot = (p, o, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0], y = p[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c]; };
function gait(phi, A, B) {
  const u = ((phi / TAU) % 1 + 1) % 1;
  if (u < 0.5) return [A * (1 - 4 * u), 0, 0];
  const s = (u - 0.5) * 2; return [-A + 2 * A * ss(s), Math.sin(Math.PI * s) * B, s];
}
const K = keys => monotone(keys);
const K2 = keys => { const fx = monotone(keys.map(k => [k[0], k[1]])), fy = monotone(keys.map(k => [k[0], k[2]])); return t => [fx(t), fy(t)]; };
const pulse = (t, at, w) => { const u = (t - at) / w; return Math.abs(u) < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * u) : 0; };

// ---------------------------------------------------------------- Youssef
const UNIT = 1.35;
const Y = {
  x: K([[0, -760], [3.6, 120], [4.8, 290], [5.3, 296], [17, 296]]),
  lean: K([[0, 0.06], [4.55, 0.06], [5.05, 0], [5.35, -0.045], [6.2, -0.045], [6.6, 0], [7.2, 0], [7.4, -0.03], [7.8, 0.01], [9.9, 0.02], [10.2, 0.05], [10.6, 0.03], [11.0, 0.01], [11.9, -0.02], [12.4, -0.02], [12.9, 0.04], [13.4, 0.04], [13.9, 0.05], [15.1, 0.05], [15.3, -0.02], [15.6, 0.05], [16.0, 0.08], [17, 0.08]]),
  head: K([[0, -0.05], [1.6, -0.14], [2.6, -0.14], [3.4, -0.02], [4.9, -0.02], [5.2, -0.24], [5.9, -0.22], [6.4, 0], [7.15, 0], [7.35, -0.08], [7.7, 0], [8.25, 0], [8.4, 0.1], [8.6, 0], [9.9, 0], [10.1, -0.06], [10.6, -0.04], [10.9, 0.14], [11.3, 0.12], [11.45, 0], [11.8, 0], [12.0, -0.13], [12.4, -0.13], [12.55, 0], [12.85, 0], [13.05, 0.09], [13.25, 0], [13.7, -0.04], [15.05, -0.04], [15.25, -0.1], [15.45, -0.08], [15.9, 0.27], [17, 0.3]]),
  drop: K([[0, 0], [15.45, 0], [15.95, 4.5], [17, 5.2]]),
  handF: K2([[0, 6, -86], [5.25, 6, -86], [5.5, 11, -129], [5.75, 11, -121], [5.95, 11, -124], [6.35, 6, -86], [8.6, 6, -86], [8.8, 9, -92], [9.4, 8, -90], [9.85, 7, -88], [10.12, 14, -152], [10.55, 14, -152], [10.85, 12, -118], [11.25, 12, -116], [11.45, 13, -129], [12.4, 13, -129], [12.8, 13.5, -128], [13.05, 26, -120], [13.35, 26, -120], [13.8, 8, -95], [15.5, 8, -95], [15.82, 2, -150], [16.05, -10, -172], [17, -10, -172]]),
  handB: K2([[0, -24, -88], [4.6, -24, -88], [5.2, -28, -92], [17, -28, -92]]),
};
function youssefPose(t) {
  const x = Y.x(t), sp = (Y.x(t + 0.03) - Y.x(t - 0.03)) / 0.06;
  const w = clamp(sp / 120), A = 28;
  const phi = (x + 760) / (UNIT * 4 * A) * TAU;
  const gF = gait(phi, A, 9), gB = gait(phi + Math.PI, A, 9);
  const u = ((phi / TAU) % 1 + 1) % 1;
  let lift = w * 1.6 * (0.5 - 0.5 * Math.cos(4 * Math.PI * u));
  lift += 2.6 * (pulse(t, 5.28, 0.14) + pulse(t, 5.62, 0.14));        // excited bounces on the toes
  let head = Y.head(t), lean = Y.lean(t) + 0.006 * Math.sin(t * 2.2 * TAU / 2.2);
  for (const s of TALK) if (s[2] === 'youssef') head += 0.035 * Math.sin(Math.PI * seg(t, s[0], s[1]));
  let hf = Y.handF(t);
  hf = [lerp(hf[0], 6 - gF[0] * 0.6, w), lerp(hf[1], -86 + Math.abs(gF[0]) * 0.08, w)];
  const wave = env(t, 10.1, 10.6, 0.08, 0.1); hf[0] += 4.5 * wave * Math.sin(TAU * 3.2 * (t - 10.1));
  hf[0] -= 2.2 * pulse(t, 12.55, 0.09);                                 // pat on chest for "I"
  const scr = env(t, 16.0, 17.2, 0.15, 0.1); hf[0] += 2.6 * scr * Math.sin(TAU * 4.6 * t); hf[1] += 1.3 * scr * Math.cos(TAU * 4.6 * t);
  const hb = Y.handB(t);
  hb[1] += w * 1.2 * Math.sin(phi * 2);
  let d = 48 * (1 - ss(seg(t, 4.55, 5.0)));
  if (t > 5.0) d -= 6 * Math.sin(TAU * 1.7 * (t - 5.0)) * Math.exp(-4.5 * (t - 5.0));
  const stF = [5, 0], stB = [-8, 0];
  const fF = [lerp(stF[0], gF[0] + 2, w), -gF[1] * w], fB = [lerp(stB[0], gB[0] - 2, w), -gB[1] * w];
  const rF = -0.25 * w * Math.sin(Math.PI * gF[2]), rB = -0.25 * w * Math.sin(Math.PI * gB[2]);
  return { x, y: 0, lift, lean, head, drop: Y.drop(t), hf, hb, fF, fB, rF, rB, d, wave };
}
const Y_HEAD = [[-6, 1], [-9.5, -4], [-11, -11], [-10.2, -18], [-6.8, -23], [-1, -25.6], [5, -25.9], [9.6, -24.6], [12, -21.6], [11.1, -18.6], [11.9, -15.2], [12.1, -13.8], [14.8, -10.2], [12.5, -8.8], [12.9, -7.5], [13.2, -5.4], [12.6, -2.2], [10.6, 0.2], [6.5, 1.8], [2.5, 2.8]];
function youssefJoints(P) {
  const hip = [0, -92 - P.lift], d = P.drop;
  const T = p => rot(p, hip, P.lean);
  const sh = T([-0.5, -50 + d]);
  const neckBase = T([0.8, -52 + d]), headPiv = T([1.6 + d * 0.5, -57.5 + d * 0.85]);
  return { hip, d, T, sh, neckBase, headPiv, headA: P.lean + P.head };
}
function drawYoussef(g, P, col) {
  const J = youssefJoints(P), ink = col.ink;
  g.fillStyle = ink; g.strokeStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
  // suitcase (behind)
  const hand = ik(J.sh, P.hb, 29, 29, 1).h;
  const wh = [hand[0] - P.d, -3.6], ax = hand[0] - wh[0], ay = hand[1] - wh[1], L = Math.hypot(ax, ay), th = Math.atan2(ax, -ay);
  g.save(); g.translate(wh[0], wh[1]); g.rotate(th);
  g.fillStyle = col.acc; rrect(g, -19, -63, 38, 59, 5); g.fill();
  if (!col.mono) { g.strokeStyle = rgba(col.accDark, 0.55); g.lineWidth = 1.4; for (const rx of [-8, 8]) { g.beginPath(); g.moveTo(rx, -59); g.lineTo(rx, -8); g.stroke(); } }
  g.fillStyle = ink; g.fillRect(-1.4, -L, 2.8, L - 62); g.fillRect(-4.5, -66, 9, 3.5);
  g.beginPath(); g.arc(-12, 0, 3.6, 0, TAU); g.arc(12, 0, 3.6, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = ink; g.strokeStyle = ink;
  // back arm
  const aB = ik(J.sh, P.hb, 29, 29, 1);
  limb(g, J.sh, aB.e, 11); limb(g, aB.e, aB.h, 10); hand_(g, aB.e, aB.h, 1);
  // legs
  for (const [f, r, back] of [[P.fB, P.rB, 1], [P.fF, P.rF, 0]]) {
    const L = ik([J.hip[0] + (back ? -2 : 2), J.hip[1]], [f[0], f[1] - 7], 44, 42, -1);
    limb(g, [J.hip[0] + (back ? -2 : 2), J.hip[1]], L.e, 15.5); limb(g, L.e, L.h, 13);
    g.save(); g.translate(L.h[0], L.h[1] + 7); g.rotate(r);
    smooth(g, [[-5.5, 0], [-5.5, -8], [4, -9], [14, -6.5], [19.5, -2.5], [19, 0.6]]); g.fill(); g.restore();
  }
  // torso (blazer)
  const d = J.d;
  smooth(g, [[-13.2, 9], [-14.6, -18], [-13.6, -42 + d], [-10.5, -51 + d], [-3, -54.5 + d], [5, -53.5 + d], [9.6, -49 + d], [13.2, -40 + d], [12.6, -22], [13.8, 6], [12, 9.5], [8, 6.5], [4, 9.6], [-6, 9.8]].map(J.T));
  g.fill();
  limb(g, J.neckBase, J.headPiv, 9.5);
  // head
  g.save(); g.translate(J.headPiv[0], J.headPiv[1]); g.rotate(J.headA); smooth(g, Y_HEAD); g.fill(); g.restore();
  // front arm
  const aF = ik(J.sh, P.hf, 29, 29, 1);
  limb(g, J.sh, aF.e, 11.5); limb(g, aF.e, aF.h, 10.5); hand_(g, aF.e, aF.h, 1 + 0.2 * P.wave);
}
function hand_(g, e, h, k) { const a = Math.atan2(h[1] - e[1], h[0] - e[0]); g.beginPath(); g.ellipse(h[0] + Math.cos(a) * 2, h[1] + Math.sin(a) * 2, 5.6 * k, 4.4 * k, a, 0, TAU); g.fill(); }
function youssefHead(P) { const J = youssefJoints(P); return rot([2, -12], J.headPiv, J.headA); }

// ---------------------------------------------------------------- Mia
const M = {
  x: K([[0, 640], [7.0, 640], [7.62, 549], [7.95, 545], [17, 545]]),
  lean: K([[0, 0.02], [7.7, 0.02], [7.9, 0], [8.2, -0.035], [9.3, -0.03], [9.8, 0.02], [11.5, 0.035], [13.4, 0.02], [13.8, -0.03], [14.3, -0.03], [14.75, 0.075], [17, 0.08]]),
  head: K([[0, 0], [8.1, 0], [8.25, -0.1], [9.3, -0.08], [9.8, 0.03], [10.3, 0.09], [10.5, 0.03], [11.5, 0.06], [11.7, 0.1], [11.9, 0.04], [13.4, 0.04], [13.8, -0.15], [14.3, -0.15], [14.75, 0.1], [17, 0.12]]),
  handF: K2([[0, 5, -84], [7.85, 5, -84], [8.05, 12, -122], [8.2, 13, -154], [9.35, 13, -154], [9.75, 10, -96], [14.25, 10, -96], [14.65, 22, -106], [17, 22, -106]]),
  handB: K2([[0, -4, -85], [9.4, -4, -85], [9.8, 9, -97], [14.3, 9, -97], [14.65, -3, -86], [17, -3, -86]]),
};
function miaBase(t) {
  const x = M.x(t), sp = (M.x(t - 0.03) - M.x(t + 0.03)) / 0.06;
  return { x, sp, lean: M.lean(t), head: M.head(t) };
}
function miaPose(t) {
  const b = miaBase(t), w = clamp(b.sp / 90), A = 20;
  const phi = (640 - b.x) / (UNIT * 4 * A) * TAU;
  const gF = gait(phi, A, 8), gB = gait(phi + Math.PI, A, 8);
  let head = b.head, lean = b.lean + 0.005 * Math.sin(t * 2.05 * Math.PI);
  for (const s of TALK) if (s[2] === 'mia') head += 0.04 * Math.sin(Math.PI * seg(t, s[0], s[1]));
  const lift = 2.4 * pulse(t, 8.22, 0.16) + 1.6 * pulse(t, 15.1, 0.12);
  let hf = M.handF(t);
  const wave = env(t, 8.15, 9.4, 0.12, 0.15);
  hf = [hf[0] + 7.5 * wave * Math.sin(TAU * 2.6 * (t - 8.2)), hf[1] + 2 * wave * Math.cos(TAU * 5.2 * (t - 8.2))];
  hf = [lerp(hf[0], 4 - gF[0] * 0.5, w), lerp(hf[1], -84, w)];
  const hb = M.handB(t);
  const stF = [5, 0], stB = [-6, 0];
  const fF = [lerp(stF[0], gF[0] + 2, w), -gF[1] * w], fB = [lerp(stB[0], gB[0] - 2, w), -gB[1] * w];
  // ponytail: damped spring following head rotation + walk/bounce
  let th = 0, v = 0; const dt = 1 / 60;
  for (let s = t - 1.6; s <= t + 1e-6; s += dt) {
    const bb = miaBase(s), tgt = -(bb.lean + bb.head) * 0.9 + 0.15 * clamp(bb.sp / 90) + 0.22 * env(s, 8.15, 9.4, 0.12, 0.15) * Math.sin(TAU * 2.6 * (s - 8.2) - 0.8);
    const a = -60 * (th - tgt) - 6 * v; v += a * dt; th += v * dt;
  }
  return { x: b.x, y: -36, lift, lean, head, hf, hb, fF, fB, rF: -0.25 * w * Math.sin(Math.PI * gF[2]), rB: -0.25 * w * Math.sin(Math.PI * gB[2]), tail: th, wave };
}
const M_HEAD = [[-5, 1], [-9, -4], [-10.6, -11], [-9.8, -17.5], [-6.3, -22], [-0.5, -24.4], [5, -23], [8.8, -19.6], [10, -15.6], [10.3, -13], [12.7, -9.4], [10.4, -8.3], [11, -6.8], [10.2, -5.7], [10.8, -4.5], [9.6, -1.9], [7, 0.2], [3, 1.6]];
function miaJoints(P) {
  const hip = [0, -86 - P.lift];
  const T = p => rot(p, hip, P.lean);
  return { hip, T, sh: T([-0.5, -46.5]), neckBase: T([0.6, -49]), headPiv: T([1.2, -55.5]), headA: P.lean + P.head };
}
function drawMia(g, P, col) {
  const J = miaJoints(P), ink = col.ink, acc = col.acc;
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = ink; g.strokeStyle = ink;
  // back arm (teal sleeve)
  const aB = ik(J.sh, P.hb, 26, 25, 1);
  g.strokeStyle = acc; limb(g, J.sh, aB.e, 9); limb(g, aB.e, aB.h, 8.2); g.fillStyle = ink; hand_(g, aB.e, aB.h, 0.78);
  // legs
  g.strokeStyle = ink;
  for (const [f, r, back] of [[P.fB, P.rB, 1], [P.fF, P.rF, 0]]) {
    const hp = [J.hip[0] + (back ? -2.5 : 2.5), J.hip[1]];
    const L = ik(hp, [f[0], f[1] - 5], 42, 40, -1);
    limb(g, hp, L.e, 9); limb(g, L.e, L.h, 7);
    g.save(); g.translate(L.h[0], L.h[1] + 5); g.rotate(r);
    smooth(g, [[-4.5, 0], [-4.5, -6], [5, -6.5], [13.5, -3.5], [17, -1], [16.5, 0.5]]); g.fill(); g.restore();
  }
  // skirt
  g.fillStyle = ink;
  smooth(g, [[-11.5, -10], [11.5, -10], [14.5, 10], [19, 37], [8, 39.5], [-8, 39.5], [-19, 37], [-14.5, 10]].map(J.T)); g.fill();
  // cardigan
  g.fillStyle = acc;
  smooth(g, [[-11, 5], [-12.2, -14], [-11, -38], [-7.5, -45.5], [-1, -48], [4.8, -47.5], [7.6, -43.5], [10.8, -35], [9.6, -24], [10.6, -10], [11.6, 5], [6, 7], [-2, 7.2]].map(J.T)); g.fill();
  g.fillStyle = ink; g.strokeStyle = ink;
  limb(g, J.neckBase, J.headPiv, 7);
  // head + ponytail
  g.save(); g.translate(J.headPiv[0], J.headPiv[1]); g.rotate(J.headA);
  smooth(g, M_HEAD); g.fill();
  const ta = 0.42 + P.tail, an = [-8.6, -17.5];
  const tip = [an[0] - Math.sin(ta) * 19, an[1] + Math.cos(ta) * 19];
  const sw = Math.sin(ta) * 6;
  g.beginPath(); g.moveTo(an[0] + 1.5, an[1] - 2.8);
  g.bezierCurveTo(an[0] - 9 - sw * 0.3, an[1] - 4, tip[0] - 5, tip[1] - 9, tip[0], tip[1]);
  g.bezierCurveTo(tip[0] + 1.5, tip[1] - 7, an[0] - 1, an[1] + 7, an[0] + 2, an[1] + 3);
  g.closePath(); g.fill();
  g.beginPath(); g.arc(an[0] - 0.6, an[1] - 0.2, 2.9, 0, TAU); g.fill();
  g.restore();
  // front arm (teal sleeve) — the waving arm
  const aF = ik(J.sh, P.hf, 26, 25, 1);
  g.strokeStyle = acc; limb(g, J.sh, aF.e, 9.2); limb(g, aF.e, aF.h, 8.4); g.fillStyle = ink; hand_(g, aF.e, aF.h, 0.8 + 0.2 * P.wave);
}
function miaHead(P) { const J = miaJoints(P); return rot([1.5, -11], J.headPiv, J.headA); }

// ---------------------------------------------------------------- world: background planes (drawn into BG at res r)
const rnd = (i, s = 0) => hash(i * 7.31 + s * 13.7);
function skyline(seedX0, seedX1, lowFn, baseH, varH, s) {
  const out = []; let x = seedX0, i = 0;
  while (x < seedX1) { const w = 40 + rnd(i, s) * 70, h = lowFn(x) * (baseH + rnd(i, s + 1) * varH); out.push([x, w, h, rnd(i, s + 2)]); x += w; i++; }
  return out;
}
const LOW1 = x => lerp(1, 0.32, ss(1 - Math.abs(x - 30) / 260));
const L1B = skyline(-1700, 1800, LOW1, 120, 150, 1);
const LOW2 = x => lerp(1, 0.28, ss(1 - Math.abs(x - 40) / 330));
const L2B = skyline(-1600, 1700, LOW2, 150, 90, 5);
const L3H = []; { let x = -1600, i = 0; while (x < -250) { const w = 88 + rnd(i, 9) * 14; L3H.push([x, w, 232 + rnd(i, 10) * 48, i]); x += w + (rnd(i, 11) > 0.8 ? 6 : 0); i++; } x = 300; while (x < 1700) { const w = 88 + rnd(i, 9) * 14; L3H.push([x, w, 232 + rnd(i, 10) * 48, i]); x += w; i++; } }

function drawBackground(g, t, cam, P, r) {
  g.setTransform(r, 0, 0, r, 0, 0);
  // sky
  const hor = proj(0, 0, 0.1, cam)[1];
  const gr = g.createLinearGradient(0, hor - 820, 0, hor + 40);
  gr.addColorStop(0, rgba(P.skyTop)); gr.addColorStop(0.42, rgba(P.skyMid)); gr.addColorStop(0.78, rgba(P.skyLow)); gr.addColorStop(1, rgba(P.hor));
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // sun + glow
  const [sx, sy] = proj(0, -150, 0.03, cam), ss0 = scl(0.03, cam);
  g.globalCompositeOperation = 'lighter';
  let rg = g.createRadialGradient(sx, sy, 0, sx, sy, 640 * ss0);
  rg.addColorStop(0, rgba(P.hor, 0.55)); rg.addColorStop(0.35, rgba(P.skyLow, 0.18)); rg.addColorStop(1, rgba(P.skyLow, 0));
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  rg = g.createRadialGradient(sx, sy, 40 * ss0, sx, sy, 120 * ss0); rg.addColorStop(0, rgba(P.sun, 0.5)); rg.addColorStop(1, rgba(P.sun, 0));
  g.fillStyle = rg; g.beginPath(); g.arc(sx, sy, 120 * ss0, 0, TAU); g.fill();
  g.fillStyle = rgba(P.sun); g.beginPath(); g.arc(sx, sy, 44 * ss0, 0, TAU); g.fill();
  // clouds (long streaks)
  LT(g, 0.04, cam, r);
  g.lineCap = 'round';
  for (const [x, y, l, w, k] of [[-760, -470, 560, 15, 0.25], [160, -560, 760, 11, 0.35], [620, -330, 420, 9, 0.55], [-300, -300, 330, 7, 0.6], [-1100, -380, 380, 10, 0.45]]) {
    g.strokeStyle = rgba(mix(P.skyMid, P.hor, k), 0.55); g.lineWidth = w;
    const dx = t * 5; g.beginPath(); g.moveTo(x + dx, y); g.lineTo(x + l + dx, y); g.stroke();
  }
  // birds
  if (cam.shot === 1) {
    LT(g, 0.2, cam, r); g.strokeStyle = rgba(mix(P.far2, P.skyMid, 0.3)); g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 6; i++) {
      const bx = 520 - t * 52 + [0, 34, 60, 22, 88, 112][i], by = -470 + [0, 14, -8, 26, 6, 18][i] + Math.sin(t * 1.3 + i) * 4;
      const f = Math.sin(t * 11 + i * 1.7) * 5, sz = 8 - i * 0.4;
      g.beginPath(); g.moveTo(bx - sz, by - f); g.quadraticCurveTo(bx - sz * 0.4, by - 3, bx, by); g.quadraticCurveTo(bx + sz * 0.4, by - 3, bx + sz, by - f); g.stroke();
    }
  }
  // L1 far skyline + clock tower + crane
  LT(g, 0.15, cam, r); g.fillStyle = rgba(P.far);
  for (const [x, w, h, k] of L1B) { g.fillRect(x, -h, w + 0.6, h + 400); if (k > 0.7) g.fillRect(x + w * 0.3, -h - 26, w * 0.18, 26); }
  // clock tower (generic gothic)
  { const x = -420; g.fillRect(x - 22, -400, 44, 800); g.fillRect(x - 27, -468, 54, 70); g.fillRect(x - 30, -474, 60, 8);
    poly(g, [[x - 26, -474], [x, -560], [x + 26, -474]]); g.fill();
    for (const px of [-27, 27]) { poly(g, [[x + px - 4, -474], [x + px, -500], [x + px + 4, -474]]); g.fill(); }
    g.fillRect(x - 1, -580, 2, 24);
    g.fillStyle = rgba(mix(P.hor, P.sun, 0.4), 0.9); g.beginPath(); g.arc(x, -435, 16, 0, TAU); g.fill();
    g.strokeStyle = rgba(P.far); g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, -435); g.lineTo(x + 7, -440); g.moveTo(x, -435); g.lineTo(x, -446); g.stroke();
    g.fillStyle = rgba(P.far); }
  { const x = 640; g.fillRect(x, -390, 7, 400); g.fillRect(x - 150, -394, 230, 5); g.fillRect(x - 6, -414, 19, 22); g.lineWidth = 1.2; g.strokeStyle = rgba(P.far); g.beginPath(); g.moveTo(x - 120, -390); g.lineTo(x - 120, -300); g.stroke(); }
  haze(g, cam, 0.15, P, 0.55, 150);
  // L2 rooftops / trees
  LT(g, 0.35, cam, r); g.fillStyle = rgba(P.far2);
  for (const [x, w, h, k] of L2B) {
    const low = LOW2(x) < 0.6;
    if (low) { g.beginPath(); g.arc(x + w / 2, -h, w * 0.55, 0, TAU); g.fill(); g.fillRect(x, -h, w, h + 400); continue; }
    if (k < 0.4) { poly(g, [[x, -h], [x + w / 2, -h - 34], [x + w, -h], [x + w, 400], [x, 400]]); g.fill(); }
    else { g.fillRect(x, -h, w + 0.6, h + 400); }
    if (k > 0.55) { g.fillRect(x + w * 0.62, -h - 22, 14, 24); g.fillRect(x + w * 0.62 + 2, -h - 28, 4, 6); g.fillRect(x + w * 0.62 + 8, -h - 28, 4, 6); }
  }
  haze(g, cam, 0.35, P, 0.42, 120);
  // L3 terrace + gap with trees + bus + road
  LT(g, 0.6, cam, r);
  g.fillStyle = rgba(P.road); g.fillRect(-2000, 0, 4000, 1200);
  g.fillStyle = rgba(mix(P.road, P.haze, 0.18)); g.fillRect(-2000, 4, 4000, 3);
  const tree = rgba(mix(P.mid, P.far2, 0.35));
  g.fillStyle = tree;
  for (const [x, h, rr] of [[-215, 150, 46], [-90, 128, 40], [40, 112, 36], [165, 140, 44], [265, 118, 38]]) {
    g.fillRect(x - 3, -h + rr, 6, h - rr); g.beginPath(); g.arc(x, -h + rr * 0.2, rr, 0, TAU); g.arc(x - rr * 0.6, -h + rr * 0.75, rr * 0.7, 0, TAU); g.arc(x + rr * 0.62, -h + rr * 0.7, rr * 0.72, 0, TAU); g.fill();
  }
  g.fillStyle = rgba(P.mid); g.fillRect(-260, -24, 570, 24);
  for (const [x, w, h, i] of L3H) {
    g.fillStyle = rgba(P.mid);
    if (i % 3 === 1) { poly(g, [[x, -h], [x + w / 2, -h - 42], [x + w, -h], [x + w, 0], [x, 0]]); g.fill(); }
    else { g.fillRect(x, -h, w + 0.5, h); g.fillRect(x - 2, -h - 5, w + 4, 5); }
    const cx = x + (i % 2 ? w * 0.18 : w * 0.72); g.fillRect(cx, -h - 30, 18, 32); g.fillRect(cx + 2, -h - 37, 4, 8); g.fillRect(cx + 8, -h - 36, 4, 7); g.fillRect(cx + 13, -h - 38, 4, 9);
    for (let f = 0; f < 3; f++) for (let c = 0; c < 2; c++) {
      const lit = rnd(i * 6 + f * 2 + c, 21) > 0.58; if (!lit) continue;
      g.fillStyle = rgba(P.win, 0.55 + 0.35 * rnd(i * 6 + f * 2 + c, 22));
      g.fillRect(x + w * (c ? 0.6 : 0.2), -h * (0.3 + f * 0.27) - 30, 15, 26);
    }
  }
  haze(g, cam, 0.6, P, 0.3, 90);
  // bus (muted red — the saturated red belongs to the suitcase)
  { const bx = -1300 + 232 * t; if (bx > -1900 && bx < 1100) {
    LT(g, 0.6, cam, r);
    const body = rgba(mix(RED, P.mid, 0.5)), wl = rgba(P.win, 0.72);
    g.fillStyle = body; rrect(g, bx, -122, 292, 112, [16, 22, 6, 6]); g.fill();
    g.fillStyle = wl;
    for (let k = 0; k < 6; k++) g.fillRect(bx + 14 + k * 44, -108, 36, 26);
    for (let k = 0; k < 5; k++) g.fillRect(bx + 14 + k * 44, -64, 36, 24);
    g.fillRect(bx + 250, -64, 30, 30);
    g.fillStyle = rgba(P.road); for (const wx of [bx + 52, bx + 232]) { g.beginPath(); g.arc(wx, -8, 14, 0, TAU); g.fill(); }
  } }
}
function haze(g, cam, p, P, a, hgt) {
  const y0 = proj(0, 0, p, cam)[1], s = scl(p, cam);
  const m = g.getTransform(); const r = m.a / s;
  g.setTransform(r, 0, 0, r, 0, 0);
  const gr = g.createLinearGradient(0, y0 + 30 * s, 0, y0 - hgt * s);
  gr.addColorStop(0, rgba(P.haze, a)); gr.addColorStop(1, rgba(P.haze, 0));
  g.fillStyle = gr; g.fillRect(0, y0 - hgt * s, W, (hgt + 30) * s);
  g.setTransform(m);
}

// ---------------------------------------------------------------- near plane: street + school
function doorOpen(t) { return eio(seg(t, 6.55, 7.2)); }
function drawNear(g, t, cam, P) {
  LT(g, 1, cam);
  const near = rgba(P.near);
  // pavement
  let gr = g.createLinearGradient(0, -30, 0, 260); gr.addColorStop(0, rgba(mix(P.near, P.haze, 0.16))); gr.addColorStop(0.35, rgba(P.near)); gr.addColorStop(1, rgba(P.ink));
  g.fillStyle = gr; g.fillRect(-3000, -30, 6000, 1400);
  g.fillStyle = rgba(mix(P.near, P.haze, 0.42)); g.fillRect(-3000, -31, 3420, 2);
  // lamp post
  { const x = -430; g.fillStyle = near; g.fillRect(x - 9, -26, 18, 26); g.fillRect(x - 4, -400, 8, 380); g.fillRect(x - 16, -404, 32, 6);
    poly(g, [[x - 13, -404], [x - 16, -446], [x + 16, -446], [x + 13, -404]]); g.fill(); poly(g, [[x - 20, -446], [x, -462], [x + 20, -446]]); g.fill();
    g.fillStyle = rgba(P.win, 0.95); poly(g, [[x - 9, -408], [x - 11, -441], [x + 11, -441], [x + 9, -408]]); g.fill();
    g.globalCompositeOperation = 'lighter'; const lg = g.createRadialGradient(x, -425, 0, x, -425, 140); lg.addColorStop(0, rgba(P.win, 0.35)); lg.addColorStop(1, rgba(P.win, 0));
    g.fillStyle = lg; g.fillRect(x - 140, -565, 280, 280); g.globalCompositeOperation = 'source-over'; }
  // school building
  const X0 = 420, X1 = 1900;
  g.fillStyle = near; g.fillRect(X0, -870, X1 - X0, 870);
  g.fillRect(X0 - 8, -884, X1 - X0 + 16, 16); g.fillRect(X0 - 4, -404, X1 - X0, 8); g.fillRect(X0 - 4, -712, X1 - X0, 6);
  g.fillStyle = rgba(P.rim, 0.28); g.fillRect(X0 - 8, -884, 2, 16); g.fillRect(X0, -868, 1.6, 868);
  // upper windows
  for (let f = 0; f < 2; f++) for (let c = 0; c < 6; c++) {
    const wx = 470 + c * 190, wy = f ? -840 : -660, lit = rnd(c * 2 + f, 40) > 0.45;
    g.fillStyle = lit ? rgba(P.win, 0.9) : rgba(mix(P.near, P.ink, 0.5)); g.fillRect(wx, wy, 80, f ? 108 : 190);
    g.fillStyle = near; g.fillRect(wx + 38, wy, 4, f ? 108 : 190); g.fillRect(wx, wy + (f ? 50 : 88), 80, 4); g.fillRect(wx - 8, wy + (f ? 108 : 190), 96, 7);
  }
  // sign band with backlit letters
  g.fillStyle = rgba(mix(P.near, P.ink, 0.45)); g.fillRect(470, -484, 600, 62);
  g.save(); g.font = '600 34px "Josefin Sans"'; g.letterSpacing = '9px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = rgba(P.win, 0.9); g.shadowBlur = 18 * cam.z; g.fillStyle = rgba(mix(CREAM, P.win, 0.25));
  g.fillText('ENGLISH SCHOOL', 775, -451); g.restore();
  // classroom window
  g.fillStyle = rgba(P.win, 0.92); g.fillRect(700, -330, 240, 220);
  g.fillStyle = near; g.fillRect(776, -330, 5, 220); g.fillRect(858, -330, 5, 220); g.fillRect(700, -262, 240, 5); g.fillRect(690, -110, 260, 9);
  // door + fanlight
  const o = doorOpen(t), dl = 480, dr = 600, dt = -366, db = -36;
  g.fillStyle = rgba(mix(P.win, P.sun, 0.3)); g.beginPath(); g.arc(540, dt - 4, 58, Math.PI, 0); g.fill();
  g.fillStyle = near; for (let k = 1; k < 5; k++) { const a = Math.PI + k * Math.PI / 5; g.fillRect(540 + Math.cos(a) * 30 - 2, dt - 4 + Math.sin(a) * 30 - 2, 4, 4); }
  g.save(); g.translate(540, dt - 4); for (let k = 1; k < 5; k++) { g.save(); g.rotate(Math.PI + k * Math.PI / 5); g.fillRect(0, -1.5, 60, 3); g.restore(); } g.restore();
  g.fillRect(dl - 10, dt - 6, dr - dl + 20, 8);
  gr = g.createLinearGradient(0, dt, 0, db); gr.addColorStop(0, rgba(P.win)); gr.addColorStop(1, rgba(mix(P.win, P.sun, 0.55)));
  g.fillStyle = gr; g.fillRect(dl, dt, dr - dl, db - dt);
  const leafW = lerp(dr - dl, 16, o);
  g.fillStyle = rgba(mix(P.near, P.win, 0.08)); g.fillRect(dr - leafW, dt, leafW, db - dt);
  if (o < 0.9) { g.fillStyle = rgba(mix(P.near, P.win, 0.16), 1 - o); g.fillRect(dr - leafW + leafW * 0.14, dt + 30, leafW * 0.72, 2); g.fillRect(dr - leafW + leafW * 0.14, dt + 160, leafW * 0.72, 2); }
  g.fillStyle = near; g.fillRect(dl - 14, dt, 14, db - dt); g.fillRect(dr, dt, 14, db - dt);
  // steps
  g.fillStyle = near; g.fillRect(455, -18, 170, 18); g.fillRect(468, -36, 144, 18);
  g.fillStyle = rgba(P.win, 0.25 + 0.4 * o); g.fillRect(468, -37, 144, 2); g.fillRect(455, -19, 170, 2);
  // railings
  g.fillStyle = near; g.fillRect(640, -70, 1300, 4);
  for (let x = 640; x < 1900; x += 15) { g.fillRect(x, -82, 3, 82); poly(g, [[x - 2, -82], [x + 1.5, -90], [x + 5, -82]]); g.fill(); }
  // door light: glow + spill on pavement
  if (o > 0) {
    g.globalCompositeOperation = 'lighter';
    const lg = g.createRadialGradient(540, -190, 20, 540, -190, 300); lg.addColorStop(0, rgba(P.win, 0.16 * o)); lg.addColorStop(1, rgba(P.win, 0));
    g.fillStyle = lg; g.fillRect(240, -490, 600, 600);
    gr = g.createLinearGradient(0, 0, 0, 170); gr.addColorStop(0, rgba(P.win, 0.22 * o)); gr.addColorStop(1, rgba(P.win, 0));
    g.fillStyle = gr; poly(g, [[458, 0], [622, 0], [740, 170], [340, 170]]); g.fill();
    g.globalCompositeOperation = 'source-over';
  }
}
function drawLeaves(g, t, cam, P) {
  if (cam.shot !== 1) return;
  LT(g, 1.5, cam); g.fillStyle = rgba(P.ink); g.strokeStyle = rgba(P.ink); g.lineCap = 'round';
  const sway = Math.sin(t * 0.9) * 0.03;
  g.save(); g.translate(-1180, -1060); g.rotate(sway);
  g.lineWidth = 9; g.beginPath(); g.moveTo(-60, -40); g.quadraticCurveTo(140, 40, 300, 140); g.stroke();
  g.lineWidth = 4; g.beginPath(); g.moveTo(120, 50); g.quadraticCurveTo(150, 130, 140, 200); g.moveTo(220, 100); g.quadraticCurveTo(290, 120, 360, 110); g.stroke();
  const L = [[40, 10, 0.4], [90, 40, 1.1], [150, 60, 0.2], [130, 120, 1.6], [150, 190, 1.4], [200, 95, 0.6], [260, 140, 1.2], [300, 120, -0.3], [350, 110, 0.4], [310, 165, 1.3], [70, -10, -0.6], [180, 30, -0.4]];
  for (const [x, y, a] of L) { g.beginPath(); g.ellipse(x, y, 30, 12, a + Math.sin(t * 1.7 + x) * 0.06, 0, TAU); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- characters with rim light
function drawChar(t, cam, P, who, pose) {
  const dir = who === 'mia' ? -1 : 1, draw = who === 'mia' ? drawMia : drawYoussef;
  const acc = who === 'mia' ? TEAL : RED;
  const headL = who === 'mia' ? miaHead(pose) : youssefHead(pose);
  const head = proj(pose.x + dir * headL[0] * UNIT, pose.y + headL[1] * UNIT, 1, cam);
  const sun = proj(0, -150, 0.03, cam);
  let vx = sun[0] - head[0], vy = sun[1] - head[1]; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
  const k = clamp(0.32 + 0.33 * lineOn(who, t) + 0.35 * speak(who, t));
  const wpx = clamp(1.6 * cam.z, 2, 10);
  // halo behind the speaker
  const hk = 0.55 * lineOn(who, t) + 0.45 * speak(who, t);
  if (hk > 0.01) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
    const R = 95 * cam.z, rg = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], R);
    rg.addColorStop(0, rgba(P.rim, 0.16 * hk)); rg.addColorStop(1, rgba(P.rim, 0));
    ctx.fillStyle = rg; ctx.fillRect(head[0] - R, head[1] - R, 2 * R, 2 * R); ctx.globalCompositeOperation = 'source-over';
  }
  const place = (g, dx, dy) => { LT(g, 1, cam, 1, dx, dy); g.translate(pose.x, pose.y); g.scale(UNIT * dir, UNIT); };
  cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, W, H);
  const rc = rgba(mix(P.ink, P.rim, k));
  place(cg, 0, 0); draw(cg, pose, { ink: rc, acc: rc, mono: true });
  cg.globalCompositeOperation = 'source-atop';
  place(cg, -vx * wpx, -vy * wpx);
  const accC = mix(acc, P.ink, 0.12 + 0.25 * P.cool);
  draw(cg, pose, { ink: rgba(P.ink), acc: rgba(accC), accDark: mix(accC, P.ink, 0.5) });
  cg.globalCompositeOperation = 'source-over';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (who === 'mia' && t < 7.9) { ctx.save(); const cx = proj(600, 0, 1, cam)[0]; ctx.beginPath(); ctx.rect(0, 0, cx, H); ctx.clip(); ctx.drawImage(CL, 0, 0); ctx.restore(); }
  else ctx.drawImage(CL, 0, 0);
  return head;
}

// ---------------------------------------------------------------- type
const SHADOW = g => { g.shadowColor = 'rgba(8,5,14,0.6)'; g.shadowBlur = 22; g.shadowOffsetY = 2; };
let TEXTLIST = [];
function englishLine(t, L, head, cam) {
  const a = env(t, L.s0, L.s1, 0.28, 0.3); if (a <= 0.001) return;
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.save();
  const isMia = L.who === 'mia', acc = isMia ? LTEAL : LRED;
  g.font = '96px "DM Serif Display"'; g.letterSpacing = '0px'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const words = L.text.split(' '), ws = words.map(w => g.measureText(w).width), sp = g.measureText(' ').width * 1.05;
  const total = ws.reduce((p, q) => p + q, 0) + sp * (words.length - 1);
  let cx = isMia ? head[0] + 150 : head[0] - 40;
  if (cam.shot === 3 && isMia) cx = 1440;
  cx = clamp(cx, total / 2 + 110, W - total / 2 - 110);
  const rise = (1 - eo(seg(t, L.s0, L.s0 + 0.5))) * 16;
  const by = 232 + rise, x0 = cx - total / 2;
  g.globalAlpha = a;
  // label
  g.font = '600 26px "Josefin Sans"'; g.letterSpacing = '9px'; g.fillStyle = rgba(acc);
  SHADOW(g); const label = isMia ? 'MIA' : 'YOUSSEF';
  g.beginPath(); g.arc(x0 + 6, by - 112, 6, 0, TAU); g.fill();
  g.fillText(label, x0 + 24, by - 102);
  const lw = g.measureText(label).width;
  g.shadowColor = 'transparent'; g.fillStyle = rgba(acc, 0.55); g.fillRect(x0 + 34 + lw, by - 113, 56 * eo(seg(t, L.s0 + 0.1, L.s0 + 0.6)), 2);
  // words (karaoke)
  const spans = TALK.filter(s => s[2] === L.who && s[0] >= L.t0 - 0.3 && s[0] <= L.t1 + 0.3);
  g.font = '96px "DM Serif Display"'; g.letterSpacing = '0px';
  let x = x0;
  words.forEach((w, i) => {
    const s = spans[i];
    const k = s ? lerp(0.45, 1, ss(seg(t, s[0] - 0.06, s[0] + 0.08))) : 1;
    SHADOW(g); g.fillStyle = rgba(CREAM, k); g.fillText(w, x, by);
    if (s) { const act = env(t, s[0] - 0.04, s[1] + 0.22, 0.06, 0.25); if (act > 0) { g.shadowColor = 'transparent'; g.fillStyle = rgba(acc, act); g.fillRect(x + 2, by + 18, (ws[i] - 4) * eo(seg(t, s[0] - 0.04, s[1])), 3); } }
    x += ws[i] + sp;
  });
  // pointer hairline to the speaker
  const off = cam.shot === 3 && isMia;
  const tx = off ? W - 24 : head[0], ty = off ? 380 : head[1] - 70 * cam.z / 2.2;
  const sx = clamp(tx, x0 + 30, x0 + total - 30), sy = by + 40;
  const ex = lerp(sx, tx, 0.82), ey = lerp(sy, ty, 0.82);
  if (ey > sy + 10) {
    const pk = eo(seg(t, L.s0 + 0.15, L.s0 + 0.6));
    g.shadowColor = 'transparent'; g.strokeStyle = rgba(acc, 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(lerp(sx, ex, pk), lerp(sy, ey, pk)); g.stroke();
    g.fillStyle = rgba(acc, 0.8 * pk); g.beginPath(); g.arc(lerp(sx, ex, pk), lerp(sy, ey, pk), 3.5, 0, TAU); g.fill();
  }
  g.restore();
  TEXTLIST.push({ id: 'en_' + L.t0, text: L.text, x0, y0: by - 130, x1: x0 + total, y1: by + 24 });
}
function arabic(t) {
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0);
  for (const n of NARR) {
    const a = env(t, n.t0, n.t1, 0.2, 0.2); if (a <= 0.001) continue;
    g.save(); g.globalAlpha = a; g.font = '500 54px "Reem Kufi"'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    SHADOW(g); g.fillStyle = rgba(CREAM); g.fillText(n.ar, 960, 1018);
    const w = g.measureText(n.ar).width; g.restore();
    TEXTLIST.push({ id: 'ar_' + n.t0, text: n.ar, x0: 960 - w / 2, y0: 960, x1: 960 + w / 2, y1: 1034 });
  }
}
function chapter(t) {
  const a = env(t, 0.5, 4.4, 0.5, 0.6); if (a <= 0.001) return;
  const g = ctx; g.setTransform(1, 0, 0, 1, 0, 0); g.save(); g.globalAlpha = a; SHADOW(g);
  g.font = '600 24px "Josefin Sans"'; g.letterSpacing = '10px'; g.textAlign = 'right'; g.fillStyle = rgba(CREAM, 0.92);
  g.fillText('DAY 1  ·  LONDON', 1830, 128);
  g.shadowColor = 'transparent'; g.fillStyle = rgba(LRED, 0.8); g.fillRect(1830 - 150 * eo(seg(t, 0.7, 1.6)), 146, 150 * eo(seg(t, 0.7, 1.6)), 2);
  SHADOW(g); g.font = '500 32px "Reem Kufi"'; g.letterSpacing = '0px'; g.direction = 'rtl'; g.textAlign = 'left'; g.fillStyle = rgba(CREAM, 0.85);
  g.fillText('يوميات يوسف', 1830, 196);
  g.restore();
  TEXTLIST.push({ id: 'chapter', text: 'DAY 1 · LONDON يوميات يوسف', x0: 1500, y0: 100, x1: 1830, y1: 205 });
}

// ---------------------------------------------------------------- vignette
const VIG = mk(W, H); { const g = VIG.getContext('2d'); const rg = g.createRadialGradient(960, 500, 420, 960, 540, 1250); rg.addColorStop(0, 'rgba(10,6,16,0)'); rg.addColorStop(1, 'rgba(10,6,16,0.55)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }

// ---------------------------------------------------------------- frame
function render(t) {
  t = clamp(t, 0, DUR); TEXTLIST = [];
  const cam = camera(t), P = mood(t);
  const r = cam.shot === 1 ? 1 : cam.shot === 2 ? 0.5 : 0.25;
  const bgc = BG[r], bg = bgc.getContext('2d');
  drawBackground(bg, t, cam, P, r);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (r === 0.25) { const m = MID.getContext('2d'); m.imageSmoothingQuality = 'high'; m.drawImage(bgc, 0, 0, W / 2, H / 2); ctx.drawImage(MID, 0, 0, W, H); }
  else if (r === 0.5) ctx.drawImage(bgc, 0, 0, W, H); else ctx.drawImage(bgc, 0, 0);
  drawNear(ctx, t, cam, P);
  const yp = youssefPose(t), mp = miaPose(t);
  const heads = {};
  if (t > 6.9) heads.mia = drawChar(t, cam, P, 'mia', mp);
  heads.youssef = drawChar(t, cam, P, 'youssef', yp);
  drawLeaves(ctx, t, cam, P);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(VIG, 0, 0);
  chapter(t); arabic(t);
  for (const L of LINES) englishLine(t, L, heads[L.who] || [1700, 400], cam);
  // fades
  const f = Math.max(1 - seg(t, 0, 0.5), seg(t, 16.5, 17));
  if (f > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(10,6,16,${f})`; ctx.fillRect(0, 0, W, H); }
}

window.DUR = DUR;
window.render = render;
window.TEXTS = t => { render(t); return TEXTLIST; };
(async () => {
  await Promise.all([
    document.fonts.load('96px "DM Serif Display"', 'Hello'), document.fonts.load('600 26px "Josefin Sans"', 'MIA'),
    document.fonts.load('500 54px "Reem Kufi"', 'أول يوم'), document.fonts.load('600 34px "Josefin Sans"', 'ENGLISH'),
  ]);
  await document.fonts.ready;
  render(0); window.READY = true;
})();
