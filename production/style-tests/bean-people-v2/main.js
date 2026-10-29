// Bean People v2 — entry. Modes: ?sheet=1 (Youssef) | ?sheet=2 (Mia) | ?frame=1|2|3 (style frames) | default: film render(t)
import { P, rgba, mix, dark, light, grain, rr } from './kit.js';
import { CAST, EXPR, ARM, pose, drawChar, drawSuitcase } from './bean.js';
import { drawWorld, drawForeground, toScreen, GROUND, DOOR } from './world.js';
import { bubble, caption } from './ui.js';

const cv = document.getElementById('c'), c = cv.getContext('2d');
const SW = 1920, SH = 1080;
const Q = new URLSearchParams(location.search);
window.DUR = 17;

// ---------------- model sheet ----------------
function label(txt, x, y, size = 22, col = P.ink, align = 'center', font = 'Fredoka', w = 600) {
  c.font = `${w} ${size}px "${font}"`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(txt, x, y);
}
function sectionTitle(txt, y) {
  c.font = '700 20px "Fredoka"'; c.fillStyle = rgba(P.ink, .55); c.textAlign = 'left'; c.letterSpacing = '3px'; c.fillText(txt, 40, y); c.letterSpacing = '0px';
  const w = c.measureText(txt).width + 60; c.strokeStyle = rgba(P.ink, .12); c.lineWidth = 2; c.beginPath(); c.moveTo(w + 10, y - 7); c.lineTo(SW - 40, y - 7); c.stroke();
}
function sheet(id) {
  const sp = CAST[id], other = CAST[id === 'youssef' ? 'mia' : 'youssef'];
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  // header
  c.font = '400 64px "Lilita One"'; c.fillStyle = sp.id === 'youssef' ? P.navy : '#B8461F'; c.textAlign = 'left'; c.fillText(sp.id === 'youssef' ? 'YOUSSEF' : 'MIA', 40, 78);
  const tw = c.measureText(sp.id === 'youssef' ? 'YOUSSEF' : 'MIA').width;
  label(sp.id === 'youssef' ? '26 · Egyptian · friendly, eager, easily embarrassed' : '~28 · American English teacher · warm, confident, playful', 40 + tw + 24, 62, 24, rgba(P.ink, .75), 'left', 'Fredoka', 500);
  label('Bean People v2 · "Youssef in London" · model sheet', 40 + tw + 24, 88, 18, rgba(P.ink, .45), 'left', 'Fredoka', 500);
  // swatches
  const sw = [['ink', P.ink], ['cream', P.cream], ['sky', P.sky], ['red', P.red], ['navy', P.navy], ['mustard', P.mustard], ['teal', P.teal], ['leaf', P.leaf], ['skin', sp.skin], ['hair', sp.hair]];
  sw.forEach(([n, col], i) => {
    const x = SW - 40 - (sw.length - i) * 74 + 10;
    c.beginPath(); c.arc(x + 26, 46, 22, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.strokeStyle = rgba(P.ink, .15); c.lineWidth = 1.5; c.stroke();
    label(n, x + 26, 92, 14, rgba(P.ink, .6), 'center', 'Fredoka', 500);
  });
  // ---- turnaround ----
  sectionTitle('TURNAROUND', 140);
  const g1 = 470;
  // guide lines
  c.setLineDash([6, 8]); c.strokeStyle = rgba(P.ink, .14); c.lineWidth = 1.5;
  for (const f of [0, 1, .665, .45]) { const y = g1 - f * sp.H; c.beginPath(); c.moveTo(60, y); c.lineTo(1180, y); c.stroke(); }
  c.setLineDash([]);
  const views = [['front', 0], ['3/4 left', -.5], ['3/4 right', .5], ['side', 1]];
  views.forEach(([n, t], i) => {
    const x = 175 + i * 290;
    drawChar(c, sp, pose({ x, y: g1, turn: t, face: EXPR.neutral, pony: 0 }));
    label(n, x, g1 + 34, 20, rgba(P.ink, .6));
  });
  // height comparison + prop
  const hx0 = 1260;
  c.fillStyle = rgba('#FFFFFF', .45); rr(c, hx0 - 30, 160, 650, 340, 26); c.fill();
  const ks = .82;
  const a = sp.id === 'youssef' ? { sp, x: hx0 + 190 } : { sp, x: hx0 + 400 }, b = sp.id === 'youssef' ? { sp: other, x: hx0 + 420 } : { sp: other, x: hx0 + 190 };
  const yc = 450;
  for (const q of [CAST.youssef, CAST.mia]) { const y = yc - q.H * ks; c.setLineDash([5, 6]); c.strokeStyle = rgba(q === CAST.youssef ? P.navy : P.red, .4); c.lineWidth = 2; c.beginPath(); c.moveTo(hx0 - 10, y); c.lineTo(hx0 + 600, y); c.stroke(); c.setLineDash([]); }
  drawSuitcase(c, hx0 + 55, yc, ks, 300);
  for (const q of [a, b]) drawChar(c, q.sp, pose({ x: q.x, y: yc, k: ks, turn: q.x < hx0 + 300 ? .35 : -.35, face: EXPR.happy }));
  label('height: Youssef 1.00 · Mia 0.92 · suitcase', hx0 + 290, yc + 36, 18, rgba(P.ink, .55));
  // ---- expressions ----
  sectionTitle('EXPRESSIONS', 528);
  const ex = [['neutral', 'neutral'], ['happy', 'happy'], ['talking', 'talk'], ['nervous', 'nervous'], ['puzzled', 'puzzled'], ['embarrassed', 'embarrassed']];
  ex.forEach(([n, e], i) => {
    const x = 40 + i * 310, y = 545, w = 290, h = 228;
    c.save(); rr(c, x, y, w, h, 22); c.fillStyle = i % 2 ? '#FFF8EC' : '#FFFBF3'; c.fill(); c.clip();
    const k = 1.18, extra = e === 'puzzled' ? { lean: .05 } : e === 'embarrassed' ? { lean: -.03 } : {};
    drawChar(c, sp, pose({ x: x + w / 2, y: y + 30 + sp.H * k * 1.0 + (sp.id === 'mia' ? 12 : 0), k, face: EXPR[e], turn: 0, shadow: 0, ...extra }));
    c.restore();
    label(n, x + w / 2, y + h + 26, 20, rgba(P.ink, .65));
  });
  // ---- poses ----
  sectionTitle('POSES', 828);
  const g3 = 1032, kp = .6;
  const poses = [
    ['idle', { face: EXPR.neutral }],
    ['wave', { face: EXPR.happy, armR: ARM.wave, wave: .25, lean: -.02 }],
    ['hop-walk', { face: EXPR.talk, lift: 30, sq: 1.07, lean: .06, turn: .55, footL: .05, footR: -.02, armL: ARM.out, armR: ARM.rest, pony: -.45 }],
    ['hand on chest', { face: { ...EXPR.happy, happy: 1 }, armL: ARM.chest, turn: .2 }],
    ['scratch head', { face: EXPR.embarrassed, armR: ARM.scratch, lean: -.03 }],
  ];
  poses.forEach(([n, o], i) => {
    const x = 200 + i * 380;
    const r = drawChar(c, sp, pose({ x, y: g3, k: kp, ...o }));
    if (n === 'wave') { const [hx, hy] = r.hands[1]; c.strokeStyle = rgba(P.ink, .35); c.lineWidth = 4; c.lineCap = 'round'; for (const rr of [30, 46]) { c.beginPath(); c.arc(hx - 6, hy + 10, rr, -1.2, -.2); c.stroke(); } }
    if (n === 'hop-walk') { c.strokeStyle = rgba(P.ink, .25); c.lineWidth = 4; c.lineCap = 'round'; for (const d of [0, 1, 2]) { c.beginPath(); c.moveTo(x - 125 - d * 8, g3 - 150 + d * 28); c.lineTo(x - 92 - d * 8, g3 - 150 + d * 28); c.stroke(); } }
    label(n, x, g3 + 30, 20, rgba(P.ink, .6));
  });
  grain(c, SW, SH, .035);
}

// ---------------- cast + construction kit sheet ----------------
function card(x, y, w, h, fn, lab) {
  c.save(); rr(c, x, y, w, h, 18); c.fillStyle = '#FFFBF3'; c.fill(); c.clip(); fn(); c.restore();
  if (lab) label(lab, x + w / 2, y + h + 24, 17, rgba(P.ink, .62));
}
const pick = f => ({ mw: f.mw, mo: f.mo, ms: f.ms, mwob: f.mwob, mt: f.mt, masym: f.masym });
function kitSheet() {
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  c.font = '400 60px "Lilita One"'; c.fillStyle = P.navy; c.textAlign = 'left'; c.fillText('BEAN PEOPLE', 40, 76);
  label('cast · construction · face kit — one system for every character', 440, 60, 24, rgba(P.ink, .75), 'left', 'Fredoka', 500);
  label('"Youssef in London" · style test v2', 440, 88, 18, rgba(P.ink, .45), 'left', 'Fredoka', 500);
  // ---- cast line-up ----
  sectionTitle('CAST', 140);
  c.fillStyle = rgba('#FFFFFF', .5); rr(c, 40, 160, 660, 560, 26); c.fill();
  const g = 640, kk = 1.04;
  for (const [q, col] of [[CAST.youssef, P.navy], [CAST.mia, '#C24A28']]) { const y = g - q.H * kk; c.setLineDash([5, 7]); c.strokeStyle = rgba(col, .45); c.lineWidth = 2; c.beginPath(); c.moveTo(60, y); c.lineTo(680, y); c.stroke(); c.setLineDash([]); }
  drawSuitcase(c, 120, g, kk * .95, 300);
  drawChar(c, CAST.youssef, pose({ x: 295, y: g, k: kk, turn: .25, face: { ...EXPR.happy, lx: .4 }, armL: { dx: .19, dy: -.06, bend: .15, w: 0 } }));
  drawChar(c, CAST.mia, pose({ x: 535, y: g, k: kk, turn: -.25, face: { ...EXPR.happy, lx: -.4 }, armR: ARM.wave, wave: .1, pony: .1 }));
  label('Youssef  H 1.00', 295, g + 48, 20, P.navy); label('Mia  H 0.92', 535, g + 48, 20, '#C24A28');
  // ---- palette ----
  sectionTitle('PALETTE · 8 TOKENS', 770);
  const sw = [['ink', P.ink], ['cream', P.cream], ['sky', P.sky], ['red', P.red], ['navy', P.navy], ['mustard', P.mustard], ['teal', P.teal], ['leaf', P.leaf]];
  sw.forEach(([n, col], i) => {
    const x = 40 + (i % 4) * 166, y = 795 + Math.floor(i / 4) * 130;
    rr(c, x, y, 150, 76, 16); c.fillStyle = col; c.fill(); c.strokeStyle = rgba(P.ink, .12); c.lineWidth = 1.5; c.stroke();
    label(n, x + 4, y + 100, 19, P.ink, 'left', 'Fredoka', 600); label(col.toUpperCase(), x + 146, y + 100, 15, rgba(P.ink, .5), 'right', 'Fredoka', 500);
  });
  label('skin / hair materials + cool violet shade (multiply) + warm rim light', 40, 1062, 16, rgba(P.ink, .5), 'left', 'Fredoka', 500);
  // ---- construction ----
  c.font = '700 20px "Fredoka"'; c.fillStyle = rgba(P.ink, .55); c.textAlign = 'left'; c.letterSpacing = '3px'; c.fillText('CONSTRUCTION', 760, 140); c.letterSpacing = '0px';
  c.strokeStyle = rgba(P.ink, .12); c.lineWidth = 2; c.beginPath(); c.moveTo(960, 133); c.lineTo(SW - 40, 133); c.stroke();
  const steps = ['1  one egg (superellipse)', '2  hair · clothes · arms', '3  crescent shade + rim', '4  face kit + contact shadow'];
  const gy = 480, kc = .95, U = CAST.youssef.H * kc;
  steps.forEach((s, i) => {
    const x = 935 + i * 268;
    if (i === 0) {
      c.setLineDash([4, 6]); c.strokeStyle = rgba(P.red, .55); c.lineWidth = 1.5;
      for (const [f, n] of [[.665, 'eyes'], [.548, 'mouth'], [.45, 'clothes'], [.375, 'arms']]) { c.beginPath(); c.moveTo(x - 120, gy - f * U); c.lineTo(x + 120, gy - f * U); c.stroke(); label(n, x - 124, gy - f * U + 5, 13, rgba(P.red, .8), 'right', 'Fredoka', 500); }
      c.beginPath(); c.moveTo(x, gy - U - 10); c.lineTo(x, gy + 6); c.stroke(); c.setLineDash([]);
    }
    drawChar(c, CAST.youssef, pose({ x, y: gy, k: kc, stage: i, face: EXPR.neutral }));
    label(s, x, gy + 40, 18, rgba(P.ink, .65));
  });
  // ---- eyes + brows ----
  c.font = '700 20px "Fredoka"'; c.fillStyle = rgba(P.ink, .55); c.textAlign = 'left'; c.letterSpacing = '3px'; c.fillText('EYES + BROWS', 760, 570); c.letterSpacing = '0px';
  c.beginPath(); c.moveTo(960, 563); c.lineTo(SW - 40, 563); c.stroke();
  const E = EXPR, eyes = [['neutral', E.neutral], ['look', { ...E.neutral, lx: -.7, ly: -.3 }], ['surprised', E.surprised], ['worried', E.worried],
    ['cheek squint', E.happy], ['happy ∩', E.joy], ['puzzled', E.puzzled], ['blink', { ...E.neutral, eye: 0 }]];
  eyes.forEach(([n, f], i) => {
    const x = 760 + i * 141, y = 585, w = 128, h = 110, k = .98, sp = i % 2 ? CAST.mia : CAST.youssef;
    card(x, y, w, h, () => drawChar(c, sp, pose({ x: x + w / 2, y: y + h / 2 + .64 * sp.H * k, k, face: f, shadow: 0 })), n);
  });
  // ---- mouths ----
  c.font = '700 20px "Fredoka"'; c.fillStyle = rgba(P.ink, .55); c.textAlign = 'left'; c.letterSpacing = '3px'; c.fillText('MOUTHS · LIP-SYNC', 760, 770); c.letterSpacing = '0px';
  c.beginPath(); c.moveTo(1000, 763); c.lineTo(SW - 40, 763); c.stroke();
  const mo = [['rest', E.neutral], ['A  open', E.talk], ['E  wide', E.talkE], ['O  round', E.talkO], ['smile', E.happy], ['wobbly', E.worried], ['gritted', E.nervous], ['skew', E.puzzled]];
  mo.forEach(([n, f], i) => {
    const x = 760 + i * 141, y = 785, w = 128, h = 110, k = 1.05, sp = i % 2 ? CAST.youssef : CAST.mia;
    card(x, y, w, h, () => drawChar(c, sp, pose({ x: x + w / 2, y: y + h / 2 + .62 * sp.H * k, k, face: { ...EXPR.neutral, ...pick(f), sweat: 0 }, shadow: 0 })), n);
  });
  label('shared kit: same eye / brow / mouth parameters for every character → expressions blend smoothly frame to frame', 760, 958, 17, rgba(P.ink, .5), 'left', 'Fredoka', 500);
  label('light from upper-left · shade = silhouette minus itself shifted to the light · soft contact shadow offset right', 760, 984, 17, rgba(P.ink, .5), 'left', 'Fredoka', 500);
  grain(c, SW, SH, .035);
}

// ---------------- style frames (real drawing code, static poses) ----------------
const PULL = { dx: .2, dy: -.09, bend: .15, w: 0 };
function put(cam, id, wx, k, o) { const [x, y, Z] = toScreen(cam, 1, wx, GROUND); return drawChar(c, CAST[id], pose({ x, y, k: k * Z, ...o })); }
function putCase(cam, wx, k, o) { const [x, y, Z] = toScreen(cam, 1, wx, GROUND); drawSuitcase(c, x, y, k * Z, 300, o); }
const words = (str, upto, cur) => str.split(' ').map((w, i) => ({ w, s: i < upto ? 1 : i === upto ? cur : 0 }));

function frame(n) {
  if (n === 1) {         // establishing: Youssef arrives, Arabic diary narration
    const cam = { x: 1005, y: 560, z: 1.05 };
    drawWorld(c, cam, 2.0, { door: 0, busX: 420 });
    putCase(cam, 640, .9, { handle: .35, tilt: .1 });
    put(cam, 'youssef', 760, .9, { turn: .5, face: { ...EXPR.happy, lx: .55, ly: -.55 }, armL: PULL, armR: ARM.rest, lift: 10, sq: 1.03, lean: .04 });
    drawForeground(c, cam, 2.0);
    caption(c, { text: 'أول يوم ليّا في لندن…', prog: .75, y: 1004 });
  }
  if (n === 2) {         // two-shot at the school door, Mia's line
    const cam = { x: 1420, y: 668, z: 1.85 };
    drawWorld(c, cam, 8.6, { door: 1, busX: -300, dof: 2 });
    putCase(cam, 1202, .9, { handle: .35 });
    put(cam, 'youssef', 1310, .9, { turn: .4, face: { ...EXPR.happy, happy: .25, mo: .03, mw: .09, lx: .5, ly: -.15 }, armL: PULL });
    put(cam, 'mia', 1540, .9, { turn: -.38, face: { ...EXPR.talk, happy: .3, lx: -.5 }, armR: ARM.wave, wave: .2, lean: -.03, pony: .15 });
    const [mx, my] = toScreen(cam, 1, 1525, GROUND - 1.12 * 276 * .9);
    bubble(c, { x: mx, y: my, who: 'mia', words: words("Hi! I'm Mia.", 2, .6), side: 0, lift: 70 });
  }
  if (n === 3) {         // close-up: Youssef embarrassed, Mia's "Sorry?"
    const cam = { x: 1362, y: 676, z: 3.45 };
    drawWorld(c, cam, 15.6, { door: 1, busX: 600, dof: 9 });
    put(cam, 'youssef', 1300, .9, { turn: .1, face: EXPR.embarrassed, armR: ARM.scratch, lean: -.025 });
    bubble(c, { x: 1905, y: 520, who: 'mia', words: words('Sorry?', 0, .7), side: -1, lift: 120 });
  }
  grain(c, SW, SH, .03);
}

// ---------------- boot ----------------
window.render = t => {
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, SW, SH);
  if (Q.get('sheet') === '3') return kitSheet();
  if (Q.get('sheet')) return sheet(Q.get('sheet') === '2' ? 'mia' : 'youssef');
  if (Q.get('frame')) return frame(+Q.get('frame'));
  c.fillStyle = '#ddd'; c.fillRect(0, 0, SW, SH);
};
document.fonts.load('600 40px "Fredoka"').then(() => Promise.all([
  document.fonts.load('400 40px "Lilita One"'), document.fonts.load('700 40px "Baloo Bhaijaan 2"', 'أول'), document.fonts.load('500 40px "Fredoka"'), document.fonts.load('700 40px "Fredoka"')]))
  .then(() => { window.READY = true; });
