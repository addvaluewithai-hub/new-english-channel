// main.js: "First Day in London", rubber-hose style test (17 s, 120 bpm: 1 beat = 12 frames)
import * as T from './toon.js';
import { P, glove } from './parts.js';
import { youssef, mia, drop } from './people.js';
import * as W from './world.js';
import { makeFilm, post, GATE } from './film.js';
import { clamp, lerp, seg, eio, eo, ei, back, TAU } from '/core/lib.js';

const Q = new URLSearchParams(location.search);
const TL = await (await fetch('timeline.json')).json();
export const DUR = 17, BPM = 120, BEAT = 60 / BPM;
const q = t => Math.floor(t * 12 + 1e-6) / 12;                 // characters on twos
// breathing: an extreme on every beat, frozen during the band stop (13.7–15.0), half strength after it
const FREEZE = [13.7, 15.0];
const breath = t => { let tb = q(t), a = 1; if (tb >= FREEZE[0] && tb < FREEZE[1]) tb = FREEZE[0]; if (tb >= FREEZE[1]) a = .5; return Math.cos(tb / BEAT * TAU) * a; };
const CUTS = [6.0, 15.0];

// —— keyframe helper: keys = [[t, value], …]; numbers or flat objects of numbers (non-numbers step) ——
function K(t, keys, e = eio) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i], [t1, b] = keys[i + 1];
    if (t < t1) { const u = e(clamp((t - t0) / (t1 - t0), 0, 1)); return mix(a, b, u); }
  }
  return keys[keys.length - 1][1];
}
function mix(a, b, u) {
  if (typeof a === 'number') return lerp(a, b, u);
  const o = {}; for (const k in a) o[k] = (typeof a[k] === 'number' && typeof b[k] === 'number') ? lerp(a[k], b[k], u) : (u < .5 ? a[k] : b[k]);
  for (const k in b) if (!(k in o)) o[k] = b[k];
  return o;
}
const hop = (u, h) => -4 * h * u * (1 - u);
const pulse = (t, t0, k = 6) => t < t0 ? 0 : Math.exp(-(t - t0) * k);
const spring = (t, t0, f = 3, k = 4) => t < t0 ? 0 : Math.exp(-(t - t0) * k) * Math.sin((t - t0) * TAU * f);
function walk(p, { L = 120, lift = 30, bob = 14, swing = 30 } = {}) {
  const a = Math.PI * p, c = Math.cos(a), s = Math.sin(a);
  return { legL: { x: -6 + c * L / 2, y: -Math.max(0, s) * lift, dir: 1, bend: 6 }, legR: { x: 6 - c * L / 2, y: -Math.max(0, -s) * lift, dir: 1, bend: -6 }, bob: -(1 - Math.abs(c)) * bob, sw: c * swing };
}
// mouth flaps during `talk` spans (sampled on twos)
function talking(who, t) {
  for (const [t0, t1, w] of TL.talk) if (w === who && t >= t0 && t < t1) { const u = t - t0; return .22 + .5 * Math.abs(Math.sin(u * Math.PI * 6.5 + .4)); }
  return null;
}
const talkMouth = (who, tq, rest) => { const o = talking(who, tq); return o == null ? rest : { type: o > .55 ? 'open' : 'o', open: o, w: who === 'mia' ? 30 : 36 }; };

// —— cards (narration + dialogue) ——
const NARR = [[0.6, 2.6, 'أول يوم ليّا في لندن…'], [2.6, 5.75, 'وكنت فاكر إن الإنجليزي بتاعي كويس.'], [5.75, 7.95, 'لحد ما قابلت ميا.']];
const L = TL.lines;
const DIAL = [[7.95, 10.15, L[0].text, 'mia'], [9.85, 14.2, L[1].text, 'youssef'], [14.45, 16.45, L[2].text, 'mia']];
let TXT = [];
function plate(g, x0, y0, w, h, r) {
  g.fillStyle = 'rgba(9,10,11,.93)'; g.beginPath(); g.roundRect(x0, y0, w, h, r); g.fill();
  g.strokeStyle = P.paper; g.lineWidth = 2.4; g.beginPath(); g.roundRect(x0 + 7, y0 + 7, w - 14, h - 14, r * .7); g.stroke();
  g.lineWidth = 1.1; g.beginPath(); g.roundRect(x0 + 12, y0 + 12, w - 24, h - 24, r * .55); g.stroke();
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const ax = sx > 0 ? x0 + 12 : x0 + w - 12, ay = sy > 0 ? y0 + 12 : y0 + h - 12;
    g.fillStyle = P.paper; g.beginPath(); g.arc(ax + sx * 7, ay + sy * 7, 3.2, 0, 7); g.fill();
    g.lineWidth = 1.4; g.beginPath(); g.arc(ax + sx * 7, ay + sy * 7, 7.5, 0, 7); g.stroke();
  }
}
function narrCard(g, text, id) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = '700 54px "Aref Ruqaa", "Baloo Bhaijaan 2"'; g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = g.measureText(text).width, w = tw + 120, h = 96, cx = 960, cy = 1006, x0 = cx - w / 2, y0 = cy - h / 2;
  plate(g, x0, y0, w, h, 18);
  // small diary pen nib on the right (the narrator is Youssef's diary)
  g.strokeStyle = P.paper; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + w - 40, cy - 14); g.lineTo(x0 + w - 30, cy + 14); g.lineTo(x0 + w - 20, cy - 14); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo(x0 + w - 30, cy + 14); g.lineTo(x0 + w - 30, cy - 2); g.stroke();
  g.beginPath(); g.moveTo(x0 + 20, cy - 14); g.lineTo(x0 + 30, cy + 14); g.lineTo(x0 + 40, cy - 14); g.closePath(); g.stroke();
  g.fillStyle = P.paper; g.fillText(text, cx, cy + 4);
  g.restore();
  TXT.push({ id, text, x0, y0, x1: x0 + w, y1: y0 + h });
}
// dialogue card: plate + speaker tab + tail toward the mouth (ax, ay); pop = 0..1 spring scale
function dialCard(g, text, who, cx, cy, ax, ay, pop, id) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = '62px "IM Fell English SC"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = g.measureText(text).width, w = tw + 90, h = 104;
  cx = clamp(cx, GATE.x + w / 2 + 26, GATE.x + GATE.w - w / 2 - 26);
  const x0 = cx - w / 2, y0 = cy - h / 2;
  g.translate(cx, cy); g.scale(pop, pop); g.translate(-cx, -cy);
  // tail
  const bx = clamp(ax, x0 + 70, x0 + w - 70), by = ay < cy ? y0 + 8 : y0 + h - 8;
  g.fillStyle = 'rgba(9,10,11,.93)'; g.strokeStyle = P.paper; g.lineWidth = 2.4;
  const dx = ax - bx, dy = ay - by, l = Math.hypot(dx, dy) || 1, len = Math.min(l - 30, 120), tx = bx + dx / l * len, ty = by + dy / l * len;
  g.beginPath(); g.moveTo(bx - 22, by); g.quadraticCurveTo(bx - 4, by + (ty - by) * .5, tx, ty); g.quadraticCurveTo(bx + 10, by + (ty - by) * .4, bx + 22, by); g.closePath(); g.fill(); g.stroke();
  plate(g, x0, y0, w, h, 20);
  // speaker tab
  const name = who === 'mia' ? 'MIA' : 'YOUSSEF';
  g.font = '26px Limelight'; const nw = g.measureText(name).width + 34, nx = who === 'mia' ? x0 + w - nw - 18 : x0 + 18;
  g.fillStyle = P.paper; g.beginPath(); g.roundRect(nx, y0 - 22, nw, 36, 8); g.fill();
  g.strokeStyle = 'rgba(9,10,11,1)'; g.lineWidth = 2; g.beginPath(); g.roundRect(nx + 4, y0 - 18, nw - 8, 28, 6); g.stroke();
  g.fillStyle = P.ink; g.textAlign = 'center'; g.fillText(name, nx + nw / 2, y0 - 3);
  g.font = '62px "IM Fell English SC"'; g.fillStyle = P.white; g.fillText(text, cx, cy + 5);
  g.restore();
  if (pop > .99) TXT.push({ id, text, x0, y0: y0 - 22, x1: x0 + w, y1: y0 + h });
}
const popScale = (t, t0) => { const u = (t - t0) * 24; return u < 0 ? 0 : u >= 4 ? 1 : [0.55, 1.12, 1.04, .98][Math.floor(u)]; };

// —— iris (screen space): black outside a circle ——
function iris(g, cx, cy, r) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#060707';
  g.beginPath(); g.rect(0, 0, 1920, 1080); g.arc(cx, cy, Math.max(0, r), 0, TAU, true); g.fill('evenodd');
  g.strokeStyle = 'rgba(6,7,7,.6)'; g.lineWidth = 10; g.filter = 'blur(4px)'; g.beginPath(); g.arc(cx, cy, Math.max(0, r) + 4, 0, TAU); g.stroke(); g.filter = 'none';
  g.restore();
}
const toScreen = (cam, x, y, f = 1) => [960 + (x - cam.x * f) * cam.z, 540 + (y - cam.y) * cam.z];

// ———————————————— Shot 1: the street (0–6) ————————————————
// tracking pan: eases in over 1.2 s, rides with him, then pulls ahead to reveal the school
function camStreet(t) {
  const u = clamp(t / 1.2, 0, 1), base = t < 1.2 ? 285 * 1.2 * (u ** 3 - u ** 4 / 2) : 285 * 1.2 * .5 + 285 * (t - 1.2);
  return { x: 790 + base + 230 * eio(seg(t, 4.0, 6.0)), y: 711, z: 1.3 };
}
const farCam = c => ({ x: c.x, y: 624, z: 1 }), midCam = c => ({ x: c.x, y: 640, z: 1 });
const yStreetX = tq => 520 + 285 * tq;
function youssefStreet(tq) {
  const p = tq / BEAT, w = walk(p), x = yStreetX(tq);
  const swingR = { x: 44 + w.sw, y: -100 + Math.abs(w.sw) * .3, hand: 'open', front: true };
  const point = K(tq, [[1.3, 0], [1.6, 1], [2.4, 1], [2.7, 0]]), wave = K(tq, [[3.0, 0], [3.3, 1], [4.2, 1], [4.5, 0]]);
  const wv = Math.sin(tq * TAU * 3);
  let armR = mix(swingR, { x: 96, y: -326, hand: 'point', front: true, rot: -.95 }, point);
  if (wave > 0) armR = mix(armR, { x: 74 + wv * 14, y: -352, hand: 'wave', front: true, rot: -1.45 + wv * .3 }, wave);
  const busLook = seg(tq, 2.7, 4.6);
  const eyes = tq < 1.3 ? { lx: .7, ly: 0 } : tq < 2.6 ? { lx: .85, ly: -.95 } : tq < 4.6 ? { lx: lerp(-.9, .9, busLook), ly: -.3 } : tq < 5.2 ? { lx: .7, ly: 0 } : { lx: .95, ly: -.2, type: tq < 5.5 ? 'wide' : 'open' };
  const mouth = tq < 1.4 ? { type: 'grin' } : tq < 2.6 ? { type: 'beam' } : tq < 3.1 ? { type: 'smile' } : tq < 4.4 ? { type: 'grin' } : tq < 5.2 ? { type: 'smile' } : tq < 5.6 ? { type: 'o', w: 30 } : { type: 'wavy', w: 30, open: .4 };
  return {
    x, y: W.STREET_Y, ...w, armL: { x: -56 - w.sw * .3, y: -98 }, armR, carry: 'L', caseSwing: -w.sw * .006, b: breath(tq),
    look: .55, eyes, mouth, brows: tq < 5.4 ? 'up' : 'sad', t: tq, sweat: tq > 5.6 ? [[-48, -330 + (tq - 5.6) * 40, 7]] : null,
  };
}
function shotStreet(t, F) {
  const sg = F.sg, tq = q(t), cam = camStreet(t), b = breath(t);
  const fc = farCam(cam), mc = midCam(cam);
  W.drawBG(sg, BG.far, fc, .25);
  T.frame(t); T.BASE.splice(0, 6, ...W.camBase(fc, .25)); T.reset();
  W.sun(170, 190, .74, b, tq);
  W.drawBG(sg, BG.mid, mc, .62, b * .012, 780);
  // the bus overtakes behind him
  if (t > 2.4 && t < 5.4) {
    T.BASE.splice(0, 6, ...W.camBase(mc, .62)); T.reset();
    const sx = -420 + (tq - 2.4) * 1000, bx = (sx - 960) / mc.z + mc.x * .62;
    W.bus(bx, 852, .92, b, tq, (bx / 44));
  }
  W.drawBG(sg, BG.near, cam, 1);
  T.BASE.splice(0, 6, ...W.camBase(cam, 1)); T.reset();
  for (const lx of [300, 1180, 2060]) W.lamp(lx, 905, .95, b);
  youssef(youssefStreet(tq));
  // iris in on Youssef
  if (t < .75) { const [hx, hy] = toScreen(cam, yStreetX(tq), W.STREET_Y - 260); iris(sg, hx, hy, lerp(0, 1350, eo(seg(t, 0, .72)))); }
}

// ———————————————— Shot 2: the school steps (6–15) ————————————————
const camStage = t => K(t, [[7.4, { x: 985, y: 657, z: 1.25 }], [9.0, { x: 1000, y: 674, z: 1.4 }]]);
const Y0 = 770, YG = 945, MX = 1220, MY = 820;
function youssefStage(tq) {
  const x = lerp(360, Y0, eo(seg(tq, 6.0, 6.85))), amp = 1 - seg(tq, 6.5, 6.85);
  const w = walk(tq / BEAT, { L: 120 * amp, lift: 30 * amp, bob: 14 * amp, swing: 30 * amp });
  const p = { x, y: YG, ...w, look: .55, t: tq, b: breath(tq), brows: 'up', eyes: { lx: .7, ly: -.6 }, mouth: { type: 'smile' } };
  p.armL = { x: -56 - w.sw * .3, y: -98 }; p.armR = { x: 44 + w.sw, y: -100, hand: 'open', front: true };
  if (tq < 6.85) { p.carry = 'L'; p.caseSwing = -w.sw * .006; }
  else if (tq < 7.1) { const u = seg(tq, 6.85, 7.05); p.carry = 'L'; p.armL = { x: lerp(-60, -92, u), y: lerp(-98, -106, u) }; p.lean = -.06 * Math.sin(u * Math.PI); }
  else p.caseOnGround = { x: -96 };
  // straighten jacket, gulp
  const lap = K(tq, [[7.1, 0], [7.2, 1], [7.36, 1], [7.4, 0]], eo);
  if (lap > 0) { p.armL = mix(p.armL, { x: -14, y: -196, hand: 'grab', front: true }, lap); p.armR = mix(p.armR, { x: 20, y: -196, hand: 'grab', front: true }, lap); p.mouth = { type: 'flat' }; p.eyes = { lx: .8, ly: -.4 }; }
  // startle when the door bangs open
  if (tq >= 7.4 && tq < 7.95) {
    const u = seg(tq, 7.42, 7.72);
    p.y += hop(u, 56); p.sy = tq < 7.72 ? 1.14 : 1 - .12 * pulse(tq, 7.72, 10); p.sx = 2 - p.sy;
    p.eyes = { type: 'wide', lx: .9, ly: -.5 }; p.mouth = { type: 'o', w: 36, open: 1.2 }; p.brows = 'up';
    const up = tq < 7.75 ? 1 : 1 - seg(tq, 7.75, 7.95);
    p.armL = mix(p.armL, { x: -96, y: -300, hand: 'open' }, up); p.armR = mix(p.armR, { x: 100, y: -310, hand: 'open', front: true }, up);
    p.sweat = [[-70 - (tq - 7.4) * 160, -330 - (tq - 7.4) * 90, 8], [74 + (tq - 7.4) * 160, -340 - (tq - 7.4) * 80, 7]];
  }
  if (tq >= 7.95) { p.eyes = { lx: .75, ly: -.35 }; p.mouth = { type: 'smile' }; p.armL = { x: -72, y: -104, bend: 16 }; p.armR = { x: 72, y: -104, hand: 'open', front: true, bend: -16 }; }
  // nervous knees (8.6–9.9 and through his line)
  if (tq > 8.6 && tq < 13.6) { const kn = Math.sin(tq * TAU * 6) * 7; p.legL = { x: -24 + kn, y: 0 }; p.legR = { x: 24 - kn, y: 0 }; }
  // "Hello!": big wave
  const wave = K(tq, [[9.85, 0], [10.05, 1], [10.6, 1], [10.75, 0]]);
  if (wave > 0) { const wv = Math.sin(tq * TAU * 3.2); p.armR = mix(p.armR, { x: 84 + wv * 16, y: -350, hand: 'wave', front: true, rot: -1.45 + wv * .3 }, wave); p.eyes = { lx: .7, ly: -.4 }; p.mouth = { type: 'grin' }; }
  // offers a handshake: the arm stretches across the gap (rubber hose) … and hangs there
  const shake = K(tq, [[10.7, 0], [11.0, 1], [11.35, 1], [11.5, 0]], eo);
  if (shake > 0) { p.armR = mix(p.armR, { x: 330, y: -190, hand: 'open', front: true, rot: -.1, bend: -30 }, shake); p.lean = .05 * shake; p.mouth = { type: 'grin' }; p.eyes = { lx: .9, ly: -.3 }; }
  // "I…": points at himself, thinks (held glances on eighth notes)
  if (tq >= 11.4 && tq < 12.5) {
    p.armR = mix(p.armR, { x: 18, y: -170, hand: 'point', front: true, rot: Math.PI * .95 }, seg(tq, 11.4, 11.55));
    const gl = tq < 11.75 ? { lx: .7, ly: -.4 } : tq < 12.0 ? { lx: -.6, ly: -.8 } : tq < 12.25 ? { lx: .2, ly: -1 } : { lx: .8, ly: -.7 };
    p.eyes = gl; p.mouth = { type: 'flat' }; p.brows = 'sad';
    p.sweat = tq > 11.9 ? [[-52, -336 + (tq - 11.9) * 70, 7]] : null;
  }
  // "I Youssef.": proud chest thump, chin up
  if (tq >= 12.5) {
    const th = seg(tq, 12.5, 12.62);
    p.armR = mix({ x: 18, y: -170, hand: 'point', front: true, rot: Math.PI * .95 }, { x: 8, y: -168, hand: 'fist', front: true, rot: Math.PI * .9 }, th);
    p.armL = { x: -70, y: -120, hand: 'fist', rot: Math.PI * .1 }; p.sy = 1 + .05 * seg(tq, 12.5, 12.7) - .04 * pulse(tq, 12.62, 9);
    p.eyes = tq > 13.0 && tq < 14.5 ? { type: 'happy' } : { lx: .8, ly: -.4 }; p.mouth = { type: 'beam' }; p.brows = 'up';
  }
  // "Sorry?": the grin dies, the heat starts to rise
  if (tq >= 14.5) {
    p.mouth = tq < 14.75 ? { type: 'flat' } : { type: 'wavy', w: 30, open: .4 }; p.eyes = { type: tq < 14.75 ? 'open' : 'wide', lx: .9, ly: -.3 }; p.brows = 'sad';
    p.sweat = tq > 14.7 ? [[-50, -338 + (tq - 14.7) * 60, 8]] : null;
  }
  if (talking('youssef', tq) != null) p.mouth = talkMouth('youssef', tq, p.mouth);
  return p;
}
function miaStage(tq) {
  if (tq < 7.42) return null;
  const p = { x: MX, y: MY, mirror: true, look: .5, t: tq, eyes: { lx: .75, ly: .25 }, mouth: { type: 'lips' }, brows: null, pony: .25 * breath(tq), qmark: 0 };
  p.armL = { x: -50, y: -150 }; p.armR = { x: 50, y: -150, front: true };
  // pop out of the door: rise (stretch) → land (squash) → spring settle
  if (tq < 8.0) {
    const u = seg(tq, 7.42, 7.68);
    p.y += hop(u * .5 + .5 * (tq > 7.68 ? 1 : u), 0) + (tq < 7.68 ? -70 * Math.sin(u * Math.PI * .5) + 70 * 0 : -70 * (1 - seg(tq, 7.68, 7.78)));
    p.sy = tq < 7.68 ? lerp(.75, 1.2, u) : tq < 7.8 ? .8 : 1 - .2 * spring(tq, 7.8, 2.5, 6) * -1;
    p.sx = 2 - p.sy; p.k = lerp(.85, 1, eo(seg(tq, 7.42, 7.7)));
    p.armL = { x: -86, y: -280 }; p.armR = { x: 86, y: -290, front: true };
    p.eyes = { type: 'wide', lx: .7 }; p.mouth = { type: 'grin', w: 34 }; p.brows = 'up';
  }
  p.pony += spring(tq, 7.78, 2, 3) * 1.1;
  if (tq >= 8.0 && tq < 8.7) {   // "Hi!": arm stretches way up to wave
    const u = seg(tq, 8.0, 8.18), wv = Math.sin(tq * TAU * 3.4);
    p.armR = mix({ x: 86, y: -290, front: true }, { x: 60 + wv * 18, y: -470, hand: 'wave', front: true, rot: -1.55 + wv * .32 }, eo(u));
    p.armL = { x: -50, y: -150 }; p.eyes = { lx: .75, ly: .2 }; p.brows = 'up'; p.mouth = { type: 'grin', w: 34 };
  }
  if (tq >= 8.7 && tq < 9.6) {  // "I'm Mia": hand to chest, head tilt
    p.armR = mix({ x: 60, y: -470, hand: 'wave', front: true, rot: -1.55 }, { x: 8, y: -206, hand: 'open', front: true, rot: Math.PI * .85 }, eo(seg(tq, 8.7, 8.86)));
    p.headTilt = -.12 * seg(tq, 8.8, 9.0); p.eyes = tq > 9.25 ? { type: 'happy' } : { lx: .75, ly: .2 }; p.mouth = { type: 'smile', w: 32 };
  }
  if (tq >= 9.6) {              // listening, hands clasped
    p.armR = { x: 10, y: -150, front: true, hand: 'fist', rot: Math.PI }; p.armL = { x: -6, y: -148, front: true, hand: 'fist' };
    p.headTilt = -.08 + .04 * Math.sin(tq * 1.7); p.eyes = { lx: .8, ly: .3 }; p.brows = 'up';
    for (const bt of [10.42, 12.17, 13.25]) if (tq >= bt && tq < bt + .12) p.eyes = { type: 'shut' };
    if (tq > 10.75 && tq < 11.45) { p.eyes = { lx: .8, ly: .9 }; p.headTilt = .05; }   // looks down at the offered hand
    if (tq > 11.5 && tq < 12.5) { p.lean = -.04; p.brows = 'up'; }                      // leans in, encouraging
    if (tq > 13.7) { p.mouth = { type: 'flat', w: 26 }; p.brows = 'one'; }
  }
  if (tq >= 14.45) {            // "Sorry?": leans in, hand cupped to the ear, the ponytail curls into a "?"
    const u = eo(seg(tq, 14.45, 14.65));
    p.lean = lerp(0, -.12, u); p.headTilt = lerp(-.08, -.2, u);
    p.armL = mix(p.armL, { x: -46, y: -312, hand: 'open', front: false, rot: -Math.PI * .45 }, u);
    p.armR = { x: 52, y: -150, front: true, hand: 'open' };
    p.brows = 'one'; p.eyes = { lx: .7, ly: 0 }; p.mouth = { type: 'flat', w: 26 };
    p.qmark = Math.min(1.08, back(seg(tq, 14.55, 14.85), 2.2)); p.pony = 0;
  }
  if (talking('mia', tq) != null) p.mouth = talkMouth('mia', tq, p.mouth);
  return p;
}
function shotStage(t, F) {
  const sg = F.sg, tq = q(t), cam = camStage(t), b = breath(t);
  W.drawBG(sg, BG.stage, cam, 1, b * .006, 940);
  T.frame(t); T.BASE.splice(0, 6, ...W.camBase(cam)); T.reset();
  W.lamp(420, 940, 1.05, b);
  const open = clamp((tq - 7.38) / .1, 0, 1);
  W.door(MX, YG, 1, open, b);
  const m = miaStage(tq);
  if (m) mia(m);
  youssef(youssefStage(tq));
  return cam;
}

// ———————————————— Shot 3: close on Youssef (15–17) ————————————————
const camClose = t => ({ x: Y0 + 24, y: K(t, [[15, 722], [16.3, 716]]), z: K(t, [[15, 2.85], [16.3, 3.05]]) });
function youssefClose(tq) {
  const p = { x: Y0, y: YG, look: .55, t: tq, b: breath(tq), caseOnGround: { x: -96 }, brows: 'sad' };
  const sink = K(tq, [[15.33, 0], [15.47, 1]], eo), up = K(tq, [[15.18, 0], [15.33, 1], [15.4, 0]]);
  p.sink = sink; p.sy = 1 + up * .07 - sink * .14 - .05 * pulse(tq, 15.47, 8); p.sx = 1 + sink * .07;
  p.flush = K(tq, [[15.35, 0], [15.9, 1]], eio);
  p.steam = K(tq, [[15.5, 0], [15.8, 1]]);
  p.eyes = tq < 15.45 ? { type: 'wide', lx: .9, ly: -.3 } : tq < 15.95 ? { type: 'squeeze' } : tq < 16.2 ? { lx: -.85, ly: .4 } : tq < 16.45 ? { lx: .85, ly: .4 } : { lx: .1, ly: .9 };
  p.mouth = tq < 15.33 ? { type: 'wavy', w: 30, open: .4 } : { type: 'wavy', w: 34, open: .7 };
  p.armR = { x: 70, y: -104, hand: 'open', front: true, bend: -16 };
  const scr = K(tq, [[15.45, 0], [15.7, 1]]), sc = Math.sin(tq * TAU * 5) * 6;
  p.armL = mix({ x: -56, y: -100 }, { x: -64 + sc, y: -300 + sink * 46, hand: 'open', front: true, rot: -Math.PI * .35 }, scr);
  if (tq > 15.4) { const u = tq - 15.4; p.sweat = [[-80 - u * 120, -320 - u * 80 + u * u * 160, 9], [86 + u * 130, -330 - u * 70 + u * u * 160, 8], [-40 - u * 50, -360 - u * 120 + u * u * 200, 6]]; }
  return p;
}
function shotClose(t, F) {
  const sg = F.sg, tq = q(t), cam = camClose(t), b = breath(t);
  W.drawBG(sg, BG.stage, cam, 1, b * .006, 940);
  T.frame(t); T.BASE.splice(0, 6, ...W.camBase(cam)); T.reset();
  youssef(youssefClose(tq));
  return cam;
}

// ———————————————— frame ————————————————
let BG = null, F = null;
function draw(t) {
  t = clamp(t, 0, DUR - 1e-4); TXT = [];
  const sg = F.sg; sg.setTransform(1, 0, 0, 1, 0, 0); sg.fillStyle = '#000'; sg.fillRect(0, 0, 1920, 1080);
  let cam = null;
  if (t < CUTS[0]) shotStreet(t, F);
  else if (t < CUTS[1]) cam = shotStage(t, F);
  else cam = shotClose(t, F);
  // cards
  if (Q.get('nosub') !== '1') {
    NARR.forEach(([t0, t1, s], i) => { if (t >= t0 && t < t1) narrCard(sg, s, 'narr' + i); });
    const tq = q(t);
    DIAL.forEach(([t0, t1, s, who], i) => {
      if (t < t0 || t >= t1) return;
      const pop = popScale(t, t0);
      if (t < CUTS[1]) {
        // anchored above the speaker, tail to the mouth
        const isM = who === 'mia', mp = isM ? [MX - 26, MY - 262] : [Y0 + 16, YG - 236];
        const [ax, ay] = toScreen(cam, mp[0], mp[1]);
        if (isM) dialCard(sg, s, who, ax + 250, 150, ax, ay - 30, pop, 'dial' + i);
        else dialCard(sg, s, who, ax + 140, 330, ax, ay - 40, pop, 'dial' + i);
      } else dialCard(sg, s, who, 1420, 150, 1760, 360, pop, 'dial' + i);   // Mia is off-screen right
    });
  }
  if (t >= CUTS[1]) { const [hx, hy] = toScreen(cam, Y0 + 8, YG - 230); const u = seg(t, 16.3, 16.98); if (u > 0) iris(sg, hx, hy, lerp(1250, 0, ei(u))); }
  const f = Math.round(t * 24), jump = CUTS.some(c => Math.round(c * 24) === f) ? 4 : 0;
  post(F, t, { jump });
  if (t > 16.98) { F.g.setTransform(1, 0, 0, 1, 0, 0); F.g.fillStyle = '#000'; F.g.fillRect(0, 0, 1920, 1080); }
}

const cv = document.getElementById('c');
await document.fonts.ready;
for (const f of ['40px Limelight', '62px "IM Fell English SC"', '40px Shrikhand', '700 54px "Aref Ruqaa"', '700 40px "Baloo Bhaijaan 2"']) await document.fonts.load(f, f.includes('Aref') || f.includes('Baloo') ? 'أول يوم' : 'Aa');
F = makeFilm(cv); T.init(F.scene);
BG = { far: W.paintFar(), mid: W.paintMid(), near: W.paintNear(), stage: W.paintStage() };
T.init(F.scene);
window.DUR = DUR;
window.EV = [];
window.render = t => draw(t);
window.TEXTS = t => { draw(t); return TXT.slice(); };
window.SUBS = [...NARR.map(([t0, t1, text]) => ({ t0, t1, text })), ...DIAL.map(([t0, t1, text]) => ({ t0, t1, text }))].sort((a, b) => a.t0 - b.t0);
window.READY = true;
