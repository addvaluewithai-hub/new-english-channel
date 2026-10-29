// First Day — Sitcom Toon style test (17 s). Picture only; synced to ../timeline.json + the finished voice track.
import { clamp, lerp, seg, ss, eo, ei, eio, back, hash, TAU } from '/core/lib.js';
import { W, H, INK, init, frame, g, push, pop, translate, rotate, scale, shape, fillOnly, stroke, ell, arc, rr, rect, spline, dot, text, screenRect, reset, S } from './toon.js';
import { youssef, mia, PAL } from './chars.js';
import * as Wd from './world.js';

init(document.getElementById('c'));
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const TL = await J('timeline.json'), LIPS = await J('lips.json');
const DUR = TL.dur;
const q = t => Math.floor(t * 12 + 1e-6) / 12;          // characters on twos

// —— lip sync: audio envelope, owned by whoever has the line ——
const LINES = TL.lines;
function talk(who, t) {
  const tq = q(t);
  const L = LINES.find(l => l.who === who && tq >= l.t0 && tq < l.t1 + .05);
  if (!L) return { o: 0, w: 1, on: false };
  const k = Math.floor(tq * 24), o = LIPS.o[k] ?? 0, b = LIPS.b[k] ?? .5;
  return { o: o < .12 ? 0 : o, w: .8 + .45 * b - .2 * o, on: o > .12 };
}

// —— camera: one world → screen function ——
const CAM = { cx: 960, cy: 540, z: 1 };
function cam(cx, cy, z, shake = 0, t = 0) {
  CAM.cx = cx; CAM.cy = cy; CAM.z = z;
  reset(); translate(W / 2, H / 2);
  if (shake) { const f = Math.floor(t * 24); translate((hash(f) - .5) * shake * 2, (hash(f + 77) - .5) * shake * 2); }
  scale(z); translate(-cx, -cy);
}
const toScreen = (x, y) => [(x - CAM.cx) * CAM.z + W / 2, (y - CAM.cy) * CAM.z + H / 2];
function camLayer(p, ax, ay) {   // parallax layer: moves p× as much as the stage
  reset(); translate(W / 2, H / 2); scale(CAM.z); translate(-(CAM.cx * p + ax * (1 - p)), -(CAM.cy * p + ay * (1 - p)));
}

// —— story beats ——
const T = {
  reveal: 1.0, walk0: 3.1, stop: 6.2, sign: 5.55, release: 6.35, tug: [6.4, 6.8], gulp1: 6.72,
  door: 7.4, hop: [7.42, 7.72], wave: [8.05, 9.4], hello: [10.0, 10.7], think: [10.7, 11.35], meI: [11.32, 11.85], hes: [11.85, 12.42], name: [12.42, 13.45], proud: 13.45,
  miaBlink: [13.82, 14.05], miaLean: [14.55, 14.95], sorryCut: 14.45, yCU: 15.5, gulp2: 16.25, fade: [16.5, 17.0],
};
const SHOTS = [[0, 3.5, 'wide'], [3.5, 6.9, 'track'], [6.9, 14.45, 'two'], [14.45, 15.5, 'miaCU'], [15.5, 17.01, 'youCU']];

// —— Youssef: walk path + one pose function used by every shot (continuity) ——
const X0 = 1250, XS = 2560, YG = 920, YS = .57;
const walkU = u => { u = clamp(u); const a = .18; if (u < a) return u * u / (2 * a * (1 - a)); if (u > 1 - a) return 1 - (1 - u) * (1 - u) / (2 * a * (1 - a)); return (u - a / 2) / (1 - a); };
const yx = t => lerp(X0, XS, walkU(seg(t, T.walk0, T.stop)));
function Ypose(t) {
  const tq = q(t), x = yx(t), xq = yx(tq);
  const m = talk('youssef', t);
  const P = {
    x, y: YG, s: YS, face: 1, look: [.5, -.35], lid: .1, brow: .2, browIn: 0, mouth: { o: m.o, w: m.w, sm: .55 },
    armF: { h: [16, 172], bend: 16 }, armB: { h: [-112, 140], bend: -20, hand: 'grip' }, case: { w: [-200, -8], grab: true, roll: xq / 9 },
    sq: 1 + .01 * Math.sin(tq * 2.6), headTilt: 0,
  };
  const walking = t >= T.walk0 && t < T.stop;
  if (t < T.walk0) {           // just off the bus: awe at the city
    P.look = [.15, -.95]; P.brow = .8; P.mouth = { o: .32, w: .7, sm: .4 }; P.headTilt = -.14;
    if (tq > 2.75) { P.look = [.7, -.4]; P.mouth = { o: 0, sm: .9, w: 1.1 }; P.headTilt = -.04; P.brow = .5; }   // big grin: "London!"
  }
  if (walking) {
    const ph = (xq - X0) / 190 * Math.PI;
    P.legF = [Math.sin(ph) * 34, -Math.max(0, Math.cos(ph)) * 22];
    P.legB = [-Math.sin(ph) * 34, -Math.max(0, -Math.cos(ph)) * 22];
    P.bob = -Math.abs(Math.sin(ph)) * 10 + 5; P.lean = .06;
    P.armF = { h: [16 - Math.sin(ph) * 46, 168], bend: 16 };
    P.armB = { h: [-150, 112], bend: -24, hand: 'grip' }; P.case = { w: [-330, -8], grab: true, roll: xq / 9 };
    P.look = [.75, -.15]; P.mouth = { o: 0, sm: .85, w: 1.05 };
    if (tq > 4.15 && tq < 4.95) { P.look = [-.2, -.85]; P.headTilt = -.1; P.brow = .6; }          // looks up at the houses
    if (tq >= T.sign) { P.look = [.7, -.9]; P.headTilt = -.12; P.brow = .9; P.mouth = { o: .28, w: .6, sm: .2 }; }   // the sign!
  }
  if (t >= T.stop) {
    const st = tq - T.stop;
    P.sq = st < .5 ? 1 - .06 * Math.exp(-st * 9) * Math.cos(st * 30) : P.sq;     // settle on the stop
    P.look = [.7, -.85]; P.headTilt = -.1; P.brow = .9; P.mouth = { o: .2, w: .6, sm: .2 };
    if (tq >= T.release) { P.armB = { h: [-40, 168], bend: -16 }; P.case = { w: [-215, -8], grab: false, grip: [-215, -330], roll: XS / 9 }; }
    if (tq >= T.tug[0] && tq < T.tug[1]) {   // tugs the jacket straight, a nervous gulp
      const u = seg(tq, T.tug[0], T.tug[1]);
      P.armF = { h: [-6, lerp(80, 120, Math.sin(u * Math.PI)), 0], bend: 30, hand: 'fist' }; P.look = [.4, .2]; P.mouth = { o: 0, sm: -.1, w: .8 }; P.headTilt = .04; P.brow = .2; P.browIn = .6;
      P.gulp = tq >= T.gulp1 && tq < T.gulp1 + .17 ? 1 : 0; P.sq *= P.gulp ? .97 : 1;
    }
    if (tq >= T.tug[1]) { P.look = [.5, -.4]; P.headTilt = -.04; P.brow = .4; P.browIn = .3; P.mouth = { o: 0, sm: .4, w: .9 }; P.jit = (hash(Math.floor(t * 12)) - .5) * 4; }
  }
  // the door bursts open: startle hop
  if (tq >= T.hop[0] && tq < T.hop[1]) {
    const u = seg(tq, T.hop[0], T.hop[1]);
    P.y = YG - Math.sin(u * Math.PI) * 26; P.lid = 0; P.pupil = 3.2; P.brow = 1.3; P.browIn = .2; P.mouth = { o: .45, w: .6, sm: -.2 };
    P.armF = { h: [40, 40], bend: 20, hand: 'open' }; P.look = [.6, -.6];
  }
  if (tq >= T.hop[1] && tq < 9.95) {   // starstruck shy smile while Mia talks
    P.look = [.65, -.55]; P.brow = .6; P.browIn = .2; P.mouth = { o: 0, sm: .75, w: .9 }; P.headTilt = -.03 + Math.sin(tq * 5) * .015;
    P.jit = (hash(Math.floor(t * 12)) - .5) * 4;
    if (tq > 8.9 && tq < 9.25) P.blink = true;
  }
  // —— his line ——
  if (tq >= 9.95 && tq < T.hello[1]) {    // "Hello!": over-eager wave
    const u = seg(tq, 9.95, 10.1);
    P.armF = { h: [lerp(16, 150, u), lerp(172, -150, u)], bend: 34, hand: 'open', ra: -.4 + Math.sin(tq * 18) * .25 };
    P.look = [.65, -.55]; P.brow = 1; P.mouth = { o: m.o * 1.1, w: m.w, sm: .9 }; P.headTilt = -.05; P.sq = 1.03;
  }
  if (tq >= T.think[0] && tq < T.think[1]) {   // searching for the words
    P.look = [-.6, -.85]; P.brow = .4; P.browIn = .8; P.mouth = { o: m.o, w: .7, sm: -.1, skew: .5 }; P.headTilt = -.06;
    P.armF = { h: [lerp(150, 30, seg(tq, 10.7, 10.9)), lerp(-150, 60, seg(tq, 10.7, 10.9))], bend: 26, hand: 'fist' };
    P.jit = (hash(Math.floor(t * 12) + 3) - .5) * 6;
  }
  if (tq >= T.meI[0] && tq < T.meI[1]) {       // "I...": hand on chest
    P.armF = { h: [-22, 70], bend: 40, hand: 'open', ra: 2.4 }; P.look = [.6, -.5]; P.brow = .7; P.browIn = .9; P.mouth = { o: m.o, w: m.w * .9, sm: .1 };
    P.jit = (hash(Math.floor(t * 12) + 5) - .5) * 7; P.pjit = (hash(Math.floor(t * 24)) - .5) * 4;
  }
  if (tq >= T.hes[0] && tq < T.hes[1]) {       // the pause: pupils dart, swallow
    P.armF = { h: [-22, 70], bend: 40, hand: 'open', ra: 2.4 }; P.look = tq < 12.1 ? [-.3, -.7] : [.6, -.6]; P.brow = .6; P.browIn = 1; P.mouth = { o: 0, w: .7, sm: -.2, skew: -.4 };
    P.jit = (hash(Math.floor(t * 12) + 7) - .5) * 8; P.pjit = (hash(Math.floor(t * 24) + 1) - .5) * 5; P.gulp = tq > 12.1 && tq < 12.27 ? 1 : 0;
  }
  if (tq >= T.name[0] && tq < T.name[1]) {     // "I Youssef.": thumb to chest, chin up, proud
    const u = seg(tq, T.name[0], T.name[0] + .17);
    P.armF = { h: [lerp(-22, -14, u), lerp(70, 64, u)], bend: 30, hand: 'thumb', tx: 0 }; P.look = [.6, -.6]; P.brow = .8; P.browIn = 0;
    P.mouth = { o: m.o * 1.15, w: m.w, sm: .9 }; P.headTilt = -.1 * u; P.sq = 1 + .03 * u;
  }
  if (tq >= T.proud && tq < T.yCU) {           // proud hold, waiting for the applause
    P.armF = { h: [-14, 64], bend: 30, hand: 'thumb' }; P.look = [.6, -.6]; P.brow = .6; P.mouth = { o: 0, sm: 1, w: 1.15 }; P.headTilt = -.1;
    if (tq < 13.95) { P.happy = true; P.sq = 1.03; }
    if (tq >= 14.2) { P.headTilt = -.04; P.armF = { h: [-10, 120], bend: 30, hand: 'fist' }; }
  }
  if (tq >= T.yCU) {                            // "Sorry?" → frozen grin, blush, sweat
    const u = seg(t, T.yCU, T.yCU + .4);
    P.armF = { h: [-10, 150], bend: 20 }; P.look = [.55, -.4]; P.pupil = 2.6; P.lid = 0;
    P.brow = .7; P.browIn = 1.1; P.mouth = { o: 0, sm: .85, w: 1.3, grit: true };
    P.blush = ss(seg(t, T.yCU + .05, T.yCU + .55)); P.sweat = seg(t, T.yCU + .2, 17.2) * 1.25; P.headTilt = .03;
    P.pjit = (hash(Math.floor(t * 24)) - .5) * 4;
    P.jit = (hash(Math.floor(t * 12) + 11) - .5) * lerp(3, 9, seg(t, T.yCU, 16.8));
    P.gulp = tq >= T.gulp2 && tq < T.gulp2 + .17 ? 1.2 : 0; if (P.gulp) P.sq = .97;
    if (tq > 16.0 && tq < 16.12) P.blink = true;
  }
  return P;
}

// —— Mia ——
const MX = 2890, MY = 805, MS = .56;
function Mpose(t) {
  const tq = q(t), m = talk('mia', t);
  const P = { x: MX, y: MY, s: MS, face: -1, look: [.55, .45], lid: .06, mouth: { o: m.o, w: m.w, sm: .75 }, browB: .2, browF: .2,
    armF: { h: [8, 168], bend: 10 }, armB: { h: [-8, 168], bend: -10 }, headTilt: .05 + Math.sin(tq * 2.1) * .012, sq: 1 + .008 * Math.sin(tq * 2.9) };
  // pop out of the door: squash → stretch → settle
  const u = tq - T.door;
  if (u < .1) { P.s = MS * .9; P.y = MY - 20; P.sq = .9; }
  else if (u < .2) { P.sq = 1.08; P.lean = -.06; }
  else if (u < .7) P.sq = 1 - .07 * Math.exp(-(u - .2) * 9) * Math.cos((u - .2) * 30);
  P.pony = Math.sin(t * 7) * .22 * Math.exp(-Math.max(0, t - T.door - .2) * 2.2);
  // "Hi! I'm Mia." — anticipation dip, then a big wave
  if (tq >= T.wave[0] - .15 && tq < T.wave[1]) {
    const up = seg(tq, T.wave[0] - .15, T.wave[0] + .05);
    const wv = Math.sin(tq * 15) * 28 * (tq >= T.wave[0] ? 1 : 0);
    P.armF = up < 1 ? { h: [lerp(8, -20, up), lerp(168, 200, up)], bend: 10 } : { h: [150 + wv * .6, -150 + wv * .3], bend: 34, hand: 'open', ra: -.4 + wv * .008 };
    if (up < 1) P.armF = { h: [lerp(8, 150, ss(up)), lerp(176, -150, ss(up))], bend: 34, hand: 'open' };
    P.mouth = { o: m.o, w: m.w, sm: .95 }; P.browB = .5; P.browF = .5; P.headTilt = .1;
    P.pony += Math.sin(t * 9) * .08;
    if (tq >= 8.85 && tq < 9.3) P.happy = true;
  }
  // listening to Youssef
  if (tq >= 9.9 && tq < 13.6) {
    P.mouth = { o: 0, sm: .7, w: 1 }; P.look = [.6, .5]; P.headTilt = .08 + (tq > 10.2 && tq < 10.5 ? .05 : 0);
    if (tq >= 11.4) { P.browF = .4; P.mouth = { o: 0, sm: .55, w: .9 }; }
    if (tq >= 12.9) { P.browF = .75; P.browB = .1; P.mouth = { o: 0, sm: .2, w: .8 }; P.lid = .15; }
  }
  if (tq >= 13.6) {     // puzzled
    P.look = [.6, .5]; P.browF = 1.35; P.browB = -.35; P.lid = .1; P.squint = .08; P.mouth = { o: 0, sm: -.05, w: .7, skew: .45 }; P.headTilt = .16;
    if (tq >= T.miaBlink[0] && tq < T.miaBlink[1]) P.blink = true;
    const ln = ss(seg(tq, T.miaLean[0], T.miaLean[1])); P.lean = -.08 * ln; P.headTilt = .16 + .06 * ln;
    if (m.on || (tq > 15.0 && tq < 15.45)) P.mouth = { o: Math.max(m.o, .15), w: m.w * .8, sm: -.15, skew: .35 };
    P.pony = Math.sin(t * 7) * .05;
  }
  return P;
}

// —— speech bubbles (screen space, anchored to a mouth through the camera) ——
const BFONT = '800 66px "Baloo Bhaijaan 2"';
const WHO = { mia: { name: 'MIA', col: PAL.skirt }, youssef: { name: 'YOUSSEF', col: PAL.jacket } };
function measure(str, font = BFONT) { g.setTransform(1, 0, 0, 1, 0, 0); g.font = font; return g.measureText(str).width; }
// words: [[t, text]] revealed progressively; box grows with the text
function bubble(t, { who, words, t0, t1, at, mouthPt, head = null, alpha = 1 }) {
  if (t < t0 || t >= t1) return;
  const tq = q(t);
  const shown = words.filter(w => tq >= w[0]).map(w => w[1]);
  if (!shown.length) return;
  const str = shown.join(' '), prev = shown.slice(0, -1).join(' ');
  const lastT = words.filter(w => tq >= w[0]).slice(-1)[0][0];
  const grow = ss(seg(tq, lastT, lastT + .17));
  const tw = lerp(prev ? measure(prev) : measure(str) * .6, measure(str), grow);
  const pop_ = back(seg(tq, t0, t0 + .17), 2.4) * (1 - ei(seg(t, t1 - .12, t1)));
  const bw = tw + 84, bh = 118, [bx, by] = at;
  const [mx, my] = head ? head : mouthPt;
  reset(); g.globalAlpha = alpha;
  push(); translate(bx, by); scale(pop_);
  // tail toward the mouth, stopping short of it
  const hr = (head ? head[2] : 0) + 22, dx = mx - bx, dy = my - by, L = Math.hypot(dx, dy) || 1, k = Math.max(0, L - (head ? hr : 70)) / L;
  const tip = [dx * k / pop_, dy * k / pop_];
  const bn = Math.atan2(dy, dx) + Math.PI / 2;
  const side = Math.abs(dx) > Math.abs(dy) * 2.2;     // mostly sideways → tail leaves from the side edge
  const base = side ? [Math.sign(dx) * (bw / 2 - 12), clamp(dy * .2, -bh / 2 + 34, bh / 2 - 34)] : [clamp(dx * .25, -bw / 2 + 50, bw / 2 - 50), dy > 0 ? bh / 2 - 10 : -bh / 2 + 10];
  const tail = side ? [[base[0], base[1] - 26], [tip[0], tip[1]], [base[0], base[1] + 26]] : [[base[0] - 30, base[1]], [tip[0], tip[1]], [base[0] + 30, base[1]]];
  shape(tail, { fill: '#fff', lw: 6 });
  shape(rr(-bw / 2, -bh / 2, bw, bh, 50), { fill: '#fff', lw: 6 });
  fillOnly(side ? rect(base[0] - 16, base[1] - 26, 26, 52) : rect(base[0] - 30, base[1] - 16, 60, 22), '#fff', { boil: 0 });   // merge tail into box
  // speaker tab
  const W_ = WHO[who]; g.setTransform(1, 0, 0, 1, 0, 0); g.font = '800 26px "Baloo Bhaijaan 2"'; const nw = g.measureText(W_.name).width + 34;
  shape(rr(-bw / 2 + 26, -bh / 2 - 24, nw, 42, 14), { fill: W_.col, lw: 5 });
  text(W_.name, -bw / 2 + 26 + nw / 2, -bh / 2 - 1, { font: '800 26px "Baloo Bhaijaan 2"', fill: '#fff' });
  text(str, -tw / 2, 6, { font: BFONT, fill: INK, align: 'left' });
  pop();
  g.globalAlpha = 1;
}
// Mouth positions in world space (approximate head geometry of the rigs)
const yMouth = P => [P.x + 70 * P.s, P.y - 476 * P.s];
const mMouth = P => [P.x - 54 * P.s, P.y - 490 * P.s];
const yHead = P => { const [x, y] = toScreen(P.x + 30 * P.s, P.y - 548 * P.s); return [x, y, 100 * P.s * CAM.z]; };
const mHead = P => { const [x, y] = toScreen(P.x - 30 * P.s, P.y - 540 * P.s); return [x, y, 96 * P.s * CAM.z]; };

// —— Arabic narration subtitle: the cartoon's own caption look, RTL, speaker pill on the right ——
const SUBS = [
  [0.7, 2.65, 'أول يوم ليّا في لندن…'],
  [2.65, 5.75, 'وكنت فاكر إن الإنجليزي بتاعي كويس.'],
  [5.75, 7.85, 'لحد ما قابلت ميا.'],
];
const AFONT = '800 64px "Baloo Bhaijaan 2"';
function subs(t) {
  for (const [t0, t1, s] of SUBS) {
    if (t < t0 || t >= t1) continue;
    const pop_ = back(seg(q(t), t0, t0 + .12), 2);
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = AFONT; g.direction = 'rtl';
    const tw = g.measureText(s).width; g.font = '800 30px "Baloo Bhaijaan 2"'; const nw = g.measureText('يوسف').width + 40;
    const total = tw + 24 + nw, x0 = (W - total) / 2, y = H - 96;
    reset();
    push(); translate(x0 + total - nw / 2, y - 2); scale(pop_);
    shape(rr(-nw / 2, -26, nw, 52, 16), { fill: PAL.jacket, lw: 5 });
    g.direction = 'rtl'; text('يوسف', 0, 0, { font: '800 30px "Baloo Bhaijaan 2"', fill: '#fff' });
    pop();
    g.direction = 'rtl';
    text(s, x0 + total - nw - 24, y, { font: AFONT, fill: '#fff', align: 'right', outlineW: 12 });
    g.direction = 'ltr';
  }
}

// —— shots ——
function chars(t, { y = true, m = true } = {}) {
  const yp = Ypose(t), mp = Mpose(t);
  // flat contact shadows
  if (y) fillOnly(ell(yp.x - 20, YG + 2, 150, 20, 24), 'rgba(40,30,60,.16)', { boil: 0 });
  if (m && t >= T.door) { fillOnly(ell(mp.x + 10, MY + 2, 90, 14, 20), 'rgba(40,30,60,.16)', { boil: 0 }); mia(mp); }
  if (y && t >= T.reveal) youssef(yp);
  return { yp, mp };
}
const SH = {};
const wideCam = t => { const d = eio(seg(t, .1, 2.15)), p = eio(seg(t, 2.05, 3.5)); return [lerp(lerp(1050, 1150, d), 1360, p), lerp(lerp(-1700, 330, d), 600, p), lerp(.5, .86, p)]; };
SH.wide = (t) => {
  const [cx, cy, z] = wideCam(t);
  cam(cx, cy, z);
  Wd.sky(t);
  camLayer(.35, 1050, -1700); Wd.farLayer(t);
  cam(cx, cy, z);
  Wd.street(t);
  chars(t, { m: false });
  Wd.bus(X0 + 1100 * (t - .6) + 60, t);
};
SH.track = (t) => {
  const x = yx(t), tilt = eio(seg(t, 5.95, 6.75));
  cam(lerp(x + 190, 2860, seg(t, 5.9, 6.6) * tilt), lerp(650, 420, tilt), lerp(1.65, 1.35, tilt));
  Wd.street(t);
  chars(t, { m: false });
};
SH.two = (t) => {
  const p = eio(seg(t, 9.9, 13.6));
  cam(lerp(2730, 2700, p), lerp(625, 640, p), lerp(1.75, 1.95, p));
  Wd.street(t, { doorOpen: eo(seg(t, T.door, T.door + .15)) });
  const { yp, mp } = chars(t);
  bubble(t, { who: 'mia', t0: 8.0, t1: 10.0, words: [[8.0, 'Hi!'], [8.65, "I'm Mia."]], at: [toScreen(...mMouth(mp))[0] + 260, 150], mouthPt: toScreen(...mMouth(mp)), head: mHead(mp) });
  const ym = toScreen(...yMouth(yp));
  bubble(t, { who: 'youssef', t0: 10.0, t1: 14.45, words: [[10.0, 'Hello!'], [11.33, 'I...'], [12.42, 'I'], [12.75, 'Youssef.']], at: [Math.max(400, ym[0] - 260), 230], mouthPt: ym, head: yHead(yp) });
};
SH.miaCU = (t) => {
  cam(2872, 525, lerp(3.7, 3.85, seg(t, 14.45, 15.5)));
  Wd.street(t, { doorOpen: 1 });
  const { mp } = chars(t, { y: false });
  const mm = toScreen(...mMouth(mp));
  bubble(t, { who: 'mia', t0: 14.95, t1: 15.5, words: [[14.95, 'Sorry?']], at: [mm[0] - 520, 230], mouthPt: mm, head: mHead(mp) });
};
SH.youCU = (t) => {
  const z = lerp(4.1, 4.7, ss(seg(t, T.yCU, 17)));
  cam(lerp(2600, 2595, seg(t, T.yCU, 17)), lerp(632, 622, seg(t, T.yCU, 17)), z, t < T.yCU + .25 ? 6 * (1 - seg(t, T.yCU, T.yCU + .25)) : 0, t);
  Wd.street(t, { doorOpen: 1 });
  chars(t, { m: false });
  // Mia's "Sorry?" hangs in from off-screen right
  bubble(t, { who: 'mia', t0: T.yCU, t1: 16.45, words: [[T.yCU, 'Sorry?']], at: [1580, 170], mouthPt: [2050, -60], alpha: 1 });
};

function render(t) {
  frame(t);
  screenRect('#000');
  const sh = SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
  SH[sh[2]](t);
  reset();
  subs(t);
  const f = seg(t, T.fade[0], T.fade[1]);
  if (f > 0) screenRect('#000', ss(f));
}

window.render = render; window.DUR = DUR;
for (const [f, s] of [[AFONT, 'يوسف أول'], ['800 30px "Baloo Bhaijaan 2"', 'Hi'], [BFONT, 'Hello'], ['400 60px "Lilita One"', 'ENGLISH']]) await document.fonts.load(f, s);
await document.fonts.ready;
render(parseFloat(new URLSearchParams(location.search).get('t') ?? '10.5'));
window.READY = true;
