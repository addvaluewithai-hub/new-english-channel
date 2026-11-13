// Cast v5 — design stills. ?v=lineup | sheet&who=youssef|sara | coffee | coffeeflat
// lemo-opuscar contract: window.DUR, window.render(t), window.READY. Stills only (t is ignored except for steam).
import { CAST, P, mix, rgba, dk, drawChar, face, EXPR, ARM, B, WALK, VISEMES, drawMouth, drawCup, mirrorArm } from './cast.js';
import { drawHall, bakeSets } from './ep02set/world.js';
import { drawHallFlat } from './hallflat.js';

const Q = new URLSearchParams(location.search), V = Q.get('v') || 'lineup';
const cv = document.getElementById('c');
cv.width = innerWidth; cv.height = innerHeight;
const c = cv.getContext('2d', { willReadFrequently: true });
const W = cv.width, H = cv.height;
const BG = '#F4ECDF', INK = P.ink;

function label(text, x, y, size = 30, col = INK, font = 'Lilita One', align = 'center', weight = 400) {
  c.font = `${weight} ${size}px "${font}"`; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(text, x, y);
}
function silhouette(fn) {
  const L = document.createElement('canvas'); L.width = W; L.height = H; const l = L.getContext('2d');
  fn(l); l.globalCompositeOperation = 'source-in'; l.fillStyle = INK; l.fillRect(0, 0, W, H);
  c.drawImage(L, 0, 0);
}
const book = col => (cc, x, y, ang) => { cc.save(); cc.translate(x, y); cc.rotate(ang + Math.PI / 2 - .25); cc.fillStyle = col; cc.beginPath(); cc.roundRect(-26, -48, 52, 66, 4); cc.fill(); cc.fillStyle = P.cream; cc.fillRect(20, -44, 5, 58); cc.fillStyle = P.mustard; cc.fillRect(-16, -36, 30, 8); cc.restore(); };
const cupProp = hand => ({ hand, draw: (cc, x, y, a) => drawCup(cc, x, y, a, 1, false) });

// ---------- the lineup ----------
const LINE = [
  ['ana', 'Ana', 'classmate · Spain', { turn: .3, face: face('talk', { mouth: 'C', look: [.4, 0] }), arms: { a: ARM.point, b: B('hip') } }],
  ['leo', 'Leo', 'classmate', { turn: .12, face: face('happy', { mouth: 'grin' }), arms: { a: ARM.rest, b: B('scratch') }, headTilt: .06 }],
  ['youssef', 'Youssef', 'engineer · Egypt · 26', { turn: .08, face: face('kind', { brow: [[.12, .25], [.12, .25]], look: [.1, 0] }), arms: { a: ARM.rest, b: B('wave') } }],
  ['sara', 'Sara', 'teacher · USA · 28', { turn: -.0, face: face('confident', { look: [-.3, 0] }), arms: { a: ARM.hip, b: B('cup') }, prop: cupProp('b') }],
  ['lopez', 'Mrs. Lopez', 'receptionist · 60', { turn: 0, face: face('skeptical', { look: [-.4, .1] }), arms: { a: ARM.crossTop, b: B('crossUnder') } }],
  ['mei', 'Mei', 'classmate', { turn: .15, face: face('kind', { lid: [.25, .25], look: [-.2, .1] }), arms: { a: { ik: [.5, .4], bend: 1, hand: 'hold', thumb: -1 }, b: B('rest') }, prop: { hand: 'a', draw: book(P.teal) }, headTilt: -.05 }],
];
function lineup() {
  c.fillStyle = BG; c.fillRect(0, 0, W, H);
  c.fillStyle = mix(BG, P.sky, .25); c.fillRect(0, 0, W, H * .63);
  label('YOUSSEF IN NEW YORK · CAST v5 (flat people)', 60, 70, 40, INK, 'Lilita One', 'left');
  const gy = H * .6, s = 1.22, xs = LINE.map((_, i) => W * (.1 + i * .16));
  LINE.forEach(([id, name, role, po], i) => {
    drawChar(c, id, xs[i], gy, s, po);
    label(name.toUpperCase(), xs[i], gy + 52, 34, INK);
    label(role, xs[i], gy + 84, 22, rgba(INK, .65), 'Fredoka', 'center', 500);
  });
  // silhouettes row
  const sy = H * .96, s2 = .62;
  label('silhouettes (same poses)', 60, H * .7, 24, rgba(INK, .6), 'Fredoka', 'left', 600);
  silhouette(l => LINE.forEach(([id, , , po], i) => drawChar(l, id, xs[i], sy, s2, { ...po, noShadow: true })));
}

// ---------- the model sheet ----------
function sheet(who) {
  const ch = CAST[who];
  const gOff = ch.leg.len - 12 + ch.leg.w * .56, headC = gOff + ch.torso.th + ch.neck.h + ch.head.h / 2 - 10;   // ground → head centre
  const tall = gOff + ch.torso.th + ch.neck.h + ch.head.h * 1.25, KS = Math.min(1.32, 560 / tall);
  c.fillStyle = BG; c.fillRect(0, 0, W, H);
  label(`${ch.name.toUpperCase()} · MODEL SHEET · cast v5`, 50, 64, 44, INK, 'Lilita One', 'left');
  const panel = (x, y, w, h, title) => { c.fillStyle = '#FBF6EE'; c.beginPath(); c.roundRect(x, y, w, h, 18); c.fill(); label(title, x + 20, y + 36, 22, rgba(INK, .55), 'Fredoka', 'left', 600); };
  // turnaround
  panel(30, 90, 900, 700, 'TURNAROUND · front · 3/4 · side');
  const base = who === 'sara' ? EXPR.kind : face('kind');
  [[0, 190], [.5, 480], [1, 760]].forEach(([t, x]) => drawChar(c, ch, x, 740, KS, { turn: t, face: base, arms: { a: ARM.rest, b: B('rest') } }));
  // expressions (head + shoulders crops)
  panel(950, 90, 1580, 700, 'EXPRESSIONS');
  const EX = [['neutral', face('neutral')], ['happy', face('happy')], ['embarrassed', face('embarrassed')], ['shocked', face('shocked')], ['skeptical', face('skeptical')], ['laughing', face('laughing')]];
  EX.forEach(([n, f], i) => {
    const cx = 1100 + (i % 3) * 500, cy = 150 + Math.floor(i / 3) * 320;
    c.save(); c.beginPath(); c.roundRect(cx - 140, cy + 10, 400, 280, 14); c.fillStyle = '#F1E8DA'; c.fill(); c.clip();
    const k = 205 / ch.head.h;
    drawChar(c, ch, cx + 60, cy + 172 + headC * k, k, { turn: .22, face: f, arms: { a: ARM.rest, b: B('rest') }, noShadow: true, headTilt: n === 'laughing' ? -.08 : n === 'embarrassed' ? .06 : 0 });
    c.restore(); label(n, cx + 60, cy + 316, 24, INK, 'Fredoka', 'center', 600);
  });
  // poses
  panel(30, 810, 1500, 780, 'POSES');
  const PO = [
    ['wave', { turn: .1, face: face('happy'), arms: { a: ARM.rest, b: B('wave') } }],
    ['point', { turn: .45, face: face('talk', { mouth: 'D' }), arms: { a: ARM.point, b: B('rest') } }],
    ['hold cup', { turn: .3, face: face(who === 'youssef' ? 'sleepy' : 'kind'), arms: { a: ARM.cup, b: B('rest') }, prop: cupProp('a') }],
    ['scratch head', { turn: .2, face: face('embarrassed'), arms: { a: ARM.rest, b: B('scratch') }, headTilt: .08 }],
    ['hand on chest', { turn: .25, face: face('kind', { lid: [.35, .35] }), arms: { a: ARM.chest, b: B('rest') } }],
  ];
  PO.forEach(([n, po], i) => { const x = 150 + i * 290; drawChar(c, ch, x, 1490, KS * .95, po); label(n, x, 1540, 24, INK, 'Fredoka', 'center', 600); });
  // walk cycle
  panel(1550, 810, 980, 520, 'WALK · 4 keys (contact · down · passing · up)');
  WALK.forEach((k, i) => { const x = 1650 + i * 235; drawChar(c, ch, x, 1250, KS * .62, { turn: 1, face: face('neutral', { look: [.6, 0] }), legs: k.legs, arms: k.arms, lean: k.lean }); label(k.name, x, 1300, 20, INK, 'Fredoka', 'center', 600); });
  // mouths
  panel(1550, 1350, 980, 240, 'MOUTHS · X rest + A–H (Preston Blair, as lib/lipsync.py)');
  VISEMES.forEach((m, i) => {   // each shape drawn on a patch of the character's skin at 2.4x
    const x = 1610 + i * 106, y = 1405;
    c.fillStyle = ch.skin; c.beginPath(); c.roundRect(x - 46, y, 92, 120, 40); c.fill();
    c.save(); c.translate(x, y + 52); c.scale(2.4, 2.4); drawMouth(c, ch, 0, 0, ch.head.w * .3 * .9, face('talk', { mouth: m, smile: .3 })); c.restore();
    label(m, x, y + 160, 22, INK, 'Fredoka', 'center', 700);
  });
}

// ---------- the coffee two-shot (ep02 hallway) ----------
function coffee(flat) {
  const cam = { x: 1420, y: 668, z: 1.85 };
  if (flat) drawHallFlat(c, cam); else drawHall(c, cam, 0, { clock: 8.25 });
  c.setTransform(1, 0, 0, 1, 0, 0);
  const Z = cam.z, sx = x => W / 2 + (x - cam.x) * Z, sy = y => H / 2 + (y - cam.y) * Z, k = .98 * Z * (W / 1920);
  // Youssef sleepy, left, 3/4 toward Sara; Sara right, holding a coffee out to him
  drawChar(c, 'youssef', sx(1300), sy(890), k, { turn: .5, face: face('sleepy', { mouth: 'flat', look: [.2, .35] }), arms: { a: ARM.rest, b: B('rest') }, headTilt: .07, lean: .02 });
  drawChar(c, 'sara', sx(1545), sy(890), k, { turn: .5, dir: -1, face: face('happy', { look: [.6, .05], mouth: 'grin' }), arms: { a: { ik: [.82, .18], bend: 1, hand: 'hold', thumb: -1, hr: -.2 }, b: mirrorArm(ARM.rest) }, prop: cupProp('a'), headTilt: -.04 });
}

window.DUR = 1;
window.render = t => {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (V === 'lineup') lineup();
  else if (V === 'sheet') sheet(Q.get('who') || 'youssef');
  else if (V === 'coffee') coffee(false);
  else if (V === 'coffeeflat') coffee(true);
  else if (V === 'bench') {   // render cost: the two-shot characters only, the full ep02 set + characters, the flat set + characters
    const N = 60, run = fn => { const t0 = performance.now(); for (let i = 0; i < N; i++) { fn(); c.getImageData(0, 0, 1, 1); } return (performance.now() - t0) / N; };
    const chars = () => { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); const sv = drawHall; };
    const a = run(() => { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = BG; c.fillRect(0, 0, W, H); drawChar(c, 'youssef', 700, 950, 1.8, { turn: .5, face: 'sleepy' }); drawChar(c, 'sara', 1200, 950, 1.8, { turn: .5, dir: -1, face: 'happy', prop: cupProp('a'), arms: { a: ARM.offer, b: B('rest') } }); });
    const b = run(() => coffee(false)), d = run(() => coffee(true));
    const all = run(() => { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = BG; c.fillRect(0, 0, W, H); LINE.forEach(([id, , , po], i) => drawChar(c, id, 150 + i * 300, 900, 1, po)); });
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = BG; c.fillRect(0, 0, W, H);
    [`2 characters (1.8x): ${a.toFixed(2)} ms`, `coffee frame, ep02 hall (baked) + 2 chars: ${b.toFixed(2)} ms`, `coffee frame, flat hall (live) + 2 chars: ${d.toFixed(2)} ms`, `6 characters lineup: ${all.toFixed(2)} ms`].forEach((s2, i) => label(s2, 60, 120 + i * 60, 40, INK, 'Fredoka', 'left', 600));
  }
};
(async () => {
  await Promise.all([document.fonts.load('400 40px "Lilita One"'), document.fonts.load('600 40px "Fredoka"'), document.fonts.load('500 40px "Fredoka"'), document.fonts.load('700 40px "Fredoka"')]);
  await document.fonts.ready;
  if (V.startsWith('coffee') || V === 'bench') bakeSets();
  window.render(0);
  window.READY = true;
})();
