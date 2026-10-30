// YouTube thumbnails for "يوسف في نيويورك", drawn with the episodes' own engine (Bean People v3) so the characters are on-model.
// Page contract: window.DUR = 4, window.render(t): t < 1.5 → episode 1 ("First Day"), t < 2.5 → episode 2 ("Good Morning?"),
// t < 3.5 → episode 3 ("The Form"), otherwise episode 4 ("Where Are You From?").
// Render: node core/render/still.mjs <this dir> 1 2 3 4 --out <dir>   (1920×1080; downscale to 1280×720 with ffmpeg)
// Episodes 3 and 4 draw their own sets from the episodes' world.js (copied verbatim as world3.js / world4.js); bean.js carries
// Mrs. Lopez (episode 3) and Ana (episode 4) from the episode engines.
import { P, grain, CPU, rgba, rr, mix } from './kit.js';
import { clamp } from '/core/lib.js';
import { CAST, drawChar, pose } from './bean.js';
import { bakeWorld, bakeSets, drawWorld, drawHall } from './world.js';
import { drawReception, drawCounter } from './world3.js';
import { drawClass } from './world4.js';
import { F, ARM, EXPR } from './act.js';
import { SPEAKER, nameTab, squiggle } from './ui.js';

const cv = document.getElementById('c'), c = cv.getContext('2d', CPU);
const SW = 1920, SH = 1080;
const AR = '"Baloo Bhaijaan 2"';
const Q = new URLSearchParams(location.search);

// ---------------- type: a big speech bubble (the episode bubble at thumbnail size: same radius ratio, paper, shadow, tab) ----------------
function bigBubble(c, { x, y, who, words, side = 0, fs = 110, lift = 120 }) {
  const S = SPEAKER[who];
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.font = `600 ${fs}px "Fredoka"`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const sp = c.measureText(' ').width, ws = words.map(w => c.measureText(w.w).width);
  const tw = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  const padX = fs * .7, padY = fs * .42, bw = tw + padX * 2, bh = fs + padY * 2 + fs * .08;
  const bx = side < 0 ? x - bw + fs * 1.1 : side > 0 ? x - fs * 1.1 : x - bw / 2, by = y - lift - bh;
  const shape = (dy = 0) => {
    rr(c, bx, by + dy, bw, bh, fs * .69);
    const tx = clamp(x, bx + fs * 1.1, bx + bw - fs * 1.1), w = fs * .5;
    c.moveTo(tx - w, by + bh - 2 + dy); c.quadraticCurveTo(tx - w * .2, by + bh + (y - by - bh) * .45 + dy, x, y + dy);
    c.quadraticCurveTo(tx + w * .6, by + bh + (y - by - bh) * .3 + dy, tx + w, by + bh - 2 + dy); c.closePath();
  };
  shape(fs * .16); c.fillStyle = rgba('#2A2742', .18); c.fill('nonzero');
  shape(); c.fillStyle = '#FFFDF8'; c.fill('nonzero');
  nameTab(c, S, bx + fs * .5, by - fs * .36, fs * .46);
  c.font = `600 ${fs}px "Fredoka"`; c.textAlign = 'left';
  let wx = bx + padX; const base = by + padY + fs * .86 + fs * .08, ranges = [];
  words.forEach((o, i) => {
    if (o.mark) { rr(c, wx - fs * .12, base - fs * .62, ws[i] + fs * .24, fs * .72, fs * .22); c.fillStyle = rgba(S.hi, .55); c.fill(); }
    c.fillStyle = o.dim ? rgba(P.ink, .5) : P.ink; c.fillText(o.w, wx, base);
    ranges.push([wx, wx + ws[i]]); wx += ws[i] + sp;
  });
  c.restore();
  return { bx, by, bw, bh, base, ranges, fs };
}
// the red spell-check squiggle under words [i0..i1] of a bubble
function bubbleSquiggle(c, B, i0, i1) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  squiggle(c, B.ranges[i0][0], B.ranges[i1][1], B.base + B.fs * .2, 1, B.fs * .085, P.red, B.fs * .085);
  c.restore();
}

// ---------------- the Arabic headline plate: Baloo Bhaijaan 2 800, cream on navy, mustard keyline, a slight tilt ----------------
// lines: [{ t, fs, col }], right-aligned RTL. Returns the plate box.
function arPlate(c, cx, cy, lines, { rot = -.035, pad = 44, padY = 54, lh = 1.26, keyline = true } = {}) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let W = 0, Hh = 0;
  for (const L of lines) { c.font = `800 ${L.fs}px ${AR}`; W = Math.max(W, c.measureText(L.t).width); Hh += L.fs * lh; }
  const bw = W + pad * 2, bh = Hh + padY * 2;
  c.translate(cx, cy); c.rotate(rot);
  rr(c, -bw / 2 + 10, -bh / 2 + 16, bw, bh, 40); c.fillStyle = rgba('#2A2742', .28); c.fill();
  rr(c, -bw / 2, -bh / 2, bw, bh, 40); c.fillStyle = P.navy; c.fill();
  if (keyline) { rr(c, -bw / 2 + 14, -bh / 2 + 14, bw - 28, bh - 28, 30); c.strokeStyle = P.mustard; c.lineWidth = 6; c.stroke(); }
  let y = -Hh / 2;
  for (const L of lines) {
    c.font = `800 ${L.fs}px ${AR}`; const ly = y + L.fs * lh / 2 + (L.dy || 0);
    c.fillStyle = rgba('#1E1B33', .35); c.fillText(L.t, 4, ly + 6);
    c.fillStyle = L.col || P.cream; c.fillText(L.t, 0, ly);
    y += L.fs * lh;
  }
  c.restore();
  return { cx, cy, bw, bh };
}
// the episode tag: a red pill, cream text (the title card's pill), tilted like a sticker
function epTag(c, x, y, txt, fs = 60, rot = .06) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(x, y); c.rotate(rot);
  c.direction = 'rtl'; c.font = `700 ${fs}px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(txt).width + fs * 1.3, h = fs * 1.5;
  rr(c, -w / 2 + 6, -h / 2 + 10, w, h, h / 2); c.fillStyle = rgba('#2A2742', .25); c.fill();
  rr(c, -w / 2, -h / 2, w, h, h / 2); c.fillStyle = P.red; c.fill();
  c.lineWidth = 8; c.strokeStyle = P.cream; c.stroke();
  c.fillStyle = P.cream; c.fillText(txt, 0, fs * .1);
  c.restore();
}
// a soft ink vignette so the face and the plate pop (the close-up's vignette, a touch stronger)
function vignette(c, a = .38, r0 = 420) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const v = c.createRadialGradient(760, 520, r0, 960, 540, 1250); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${a})`);
  c.fillStyle = v; c.fillRect(0, 0, SW, SH); c.restore();
}
function dim(c, a) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = rgba('#2A2742', a); c.fillRect(0, 0, SW, SH); c.restore(); }
const SPARK = (c, x, y, r, col, rot = 0) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr2 = i % 2 ? r * .32 : r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.closePath(); c.fill(); c.restore(); };

// ======================================================================================================================
// Episode 1 "First Day": the embarrassed freeze face big on the left, "I Youssef." with the squiggle, "أول جملة… غلط!"
function ep1() {
  // the New York street, blurred (the establishing camera pushed in a little so the skyline and brownstones fill the back)
  drawWorld(c, { x: 1180, y: 690, z: 1.25 }, 0, { dof: 9, nearDof: 8, taxiX: 1500, door: 0, clock: 8.9 });
  dim(c, .08); vignette(c, .42);
  // Youssef: the freeze — wide eyes, worried brows, ///, sweat, the wavy mouth; one hand up at the head (the still's scratch)
  const face = F('embarrassed', { eye: 1, pupil: .8, lx: .12, ly: -.02, happy: .12, bLy: .62, bRy: .62, bLr: .95, bRr: .95, mw: .14, ms: -.05, mwob: 1, mo: .012, blush: 1, lines: 1, sweat: 1 });
  const k = 3.1, y = 1120;
  const p = pose({ x: 575, y, k, turn: .1, face, armL: ARM.rest, armR: ARM.scratch, quiff: .15, breathe: 0, shadow: 0 });
  drawChar(c, CAST.youssef, p);
  // the bubble, tail to his head (right temple)
  const B = bigBubble(c, { x: 835, y: 372, who: 'youssef', words: [{ w: 'I' }, { w: 'Youssef.' }], side: 1, fs: 118, lift: 64 });
  bubbleSquiggle(c, B, 0, 1);
  // the headline
  arPlate(c, 1430, 700, [{ t: 'أول جملة…', fs: 148, dy: 8 }, { t: 'غلط!', fs: 225, col: P.mustard, dy: -22 }], { rot: -.04 });
  epTag(c, 1775, 392, 'الحلقة 1', 60, .1);
}

// Episode 2 "Good Morning?": the yawn, "Good… night." with the squiggle, Sara peeking surprised, "تصبح على خير… الصبح؟!"
function ep2() {
  drawHall(c, { x: 1060, y: 560, z: 1.55 }, 0, { dof: 8, clock: 8.2 });
  dim(c, .06); vignette(c, .4);
  // Youssef mid-yawn: eyes shut, brows up, mouth wide open, the hand up near the mouth; a stretch
  const yFace = F('neutral', { eye: .06, bLy: 1, bRy: 1, bLr: .3, bRr: .3, mw: .1, mo: .15, ms: -.12, mt: 0, mround: .25, blush: .5, lx: 0, ly: 0 });
  const MOUTH = { dx: -.19, dy: -.09, w: 0, bend: 55, elv: [1, .2], flex: 1 };
  const yp = pose({ x: 575, y: 1125, k: 3.1, turn: .12, sq: 1.04, lean: -.02, face: yFace, armL: ARM.rest, armR: MOUTH, quiff: .1, shadow: 0 });
  drawChar(c, CAST.youssef, yp);
  // z z z off his head, small (the sleep trail from the open scene)
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = P.cream; c.strokeStyle = P.navy; c.lineWidth = 10; c.lineJoin = 'round'; c.font = '600 92px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  [[880, 330, -.18, .95], [935, 245, -.1, 1.2], [1000, 145, .05, 1.5]].forEach(([x, y, r, s]) => { c.save(); c.translate(x, y); c.rotate(r); c.scale(s, s); c.strokeText('z', 0, 0); c.fillText('z', 0, 0); c.restore(); });
  c.restore();
  // the bubble
  const B = bigBubble(c, { x: 1090, y: 372, who: 'youssef', words: [{ w: 'Good…' }, { w: 'night.' }], side: 1, fs: 112, lift: 64 });
  bubbleSquiggle(c, B, 1, 1);
  // the headline
  arPlate(c, 1270, 645, [{ t: 'تصبح على خير…', fs: 126, dy: 8 }, { t: 'الصبح؟!', fs: 190, col: P.mustard, dy: -22 }], { rot: -.04 });
  epTag(c, 1630, 368, 'الحلقة 2', 60, .1);
  // Sara peeks in from the right edge, surprised, in front of the plate's corner, a hand up at her mouth
  const sFace = F('surprised', { pupil: .72, mo: .085, mw: .062, lx: -.75, ly: .05, bLy: 1, bRy: 1, blush: .5 });
  const sp = pose({ x: 1805, y: 1235, k: 2.0, turn: -.42, lean: -.07, face: sFace, armL: { dx: -.08, dy: -.2, w: 0, bend: 55, elv: [1, .3], flex: 1 }, armR: ARM.rest, pony: -.25, shadow: 0 });
  drawChar(c, CAST.mia, sp);
}

// Episode 3 "The Form": the sheepish freeze at the reception, "I have 26 years." with the squiggle, Mrs. Lopez peeking over
// her red glasses, "عندي 26 سنة… غلط!"
function ep3() {
  // the reception, blurred (the clock, Room 4's door, the shelves; the counter front in the bottom right)
  const cam = { x: 1120, y: 560, z: 1.5 };
  drawReception(c, cam, 0, { dof: 9, clock: 7.95, door: 0 });
  drawCounter(c, cam, 0, { dof: 9 });
  dim(c, .06); vignette(c, .4);
  // Youssef: the awkward grin — worried brows, a tight wobbly smile, ///, sweat, eyes to the viewer; the hand up at his head
  const face = F('embarrassed', { eye: 1, pupil: .82, lx: .18, ly: -.05, happy: .25, bLy: .55, bRy: .55, bLr: 1, bRr: 1, mw: .16, ms: .5, mo: .02, mt: .9, mwob: 1, blush: 1, lines: 1, sweat: 1 });
  const p = pose({ x: 575, y: 1120, k: 3.1, turn: .1, lean: .015, face, armL: ARM.rest, armR: ARM.scratch, quiff: .15, breathe: 0, shadow: 0 });
  drawChar(c, CAST.youssef, p);
  // the bubble
  const B = bigBubble(c, { x: 820, y: 372, who: 'youssef', words: [{ w: 'I' }, { w: 'have' }, { w: '26' }, { w: 'years.' }], side: 1, fs: 104, lift: 64 });
  bubbleSquiggle(c, B, 0, 3);
  // the headline
  arPlate(c, 1320, 655, [{ t: 'عندي 26 سنة…', fs: 136, dy: 8 }, { t: 'غلط!', fs: 225, col: P.mustard, dy: -22 }], { rot: -.04 });
  epTag(c, 1650, 368, 'الحلقة 3', 60, .1);
  // Mrs. Lopez peeks in from the right edge, surprised, eyes up over her red glasses, a hand at her cheek
  const lFace = F('surprised', { pupil: .7, mo: .075, mw: .06, lx: -.7, ly: -.25, bLy: 1, bRy: 1, blush: .45 });
  const lp = pose({ x: 1812, y: 1262, k: 2.0, turn: -.42, lean: -.07, face: lFace, armL: { dx: -.08, dy: -.2, w: 0, bend: 55, elv: [1, .3], flex: 1 }, armR: ARM.rest, shadow: 0 });
  drawChar(c, CAST.lopez, lp);
}

// Episode 4 "Where Are You From?": the "uh-oh" in the classroom, "I am live in Queens." with the squiggle under "am", Ana
// peeking puzzled, "am زيادة!"
function ep4(variant = Q.get('v') || 'a') {
  // the classroom, blurred (the board with the question, the world map, the window)
  const cam = { x: 1060, y: 530, z: 1.45 };
  drawClass(c, cam, 0, { dof: 9, door: 0, board: [{ text: 'Where are you from?', x: 865, y: 300, size: 56, col: P.navy, p: 1 }],
    pins: { egypt: { k: 1, label: 'Egypt' }, spain: { k: 1, label: 'Spain' }, usa: { k: 1, label: 'New York' } } });
  dim(c, .06); vignette(c, .4);
  // Youssef: caught — wide eyes cutting sideways, brows up and worried, a small open "oh-no" mouth, sweat, a hand at his mouth
  const face = F('embarrassed', { eye: 1, pupil: .74, lx: .55, ly: -.05, happy: 0, bLy: .85, bRy: .85, bLr: .9, bRr: .9, mw: .07, mo: .05, ms: -.25, mround: .3, mwob: 1, blush: 1, lines: 1, sweat: 1 });
  const MOUTH = { dx: -.17, dy: -.12, w: 0, bend: 55, elv: [1, .2], flex: 1 };
  const p = pose({ x: 575, y: 1120, k: 3.1, turn: .14, face, armL: ARM.rest, armR: MOUTH, quiff: .15, breathe: 0, shadow: 0 });
  drawChar(c, CAST.youssef, p);
  // the bubble: the squiggle under "am" only
  const B = bigBubble(c, { x: 780, y: 372, who: 'youssef', words: [{ w: 'I' }, { w: 'am' }, { w: 'live' }, { w: 'in' }, { w: 'Queens.' }], side: 1, fs: 96, lift: 64 });
  bubbleSquiggle(c, B, 1, 1);
  // the headline
  const lines = variant === 'b' ? [{ t: '\u2066I am live…\u2069', fs: 130, dy: 8 }, { t: 'ليه غلط؟', fs: 200, col: P.mustard, dy: -22 }]
    : [{ t: 'كلمة واحدة…', fs: 120, dy: 8 }, { t: 'am زيادة!', fs: 190, col: P.mustard, dy: -22 }];
  arPlate(c, 1300, 650, lines, { rot: -.04 });
  epTag(c, 1630, 372, 'الحلقة 4', 60, .1);
  // Ana peeks in from the right edge, one brow up, looking at him
  const aFace = F('puzzled', { pupil: .75, lx: -.75, ly: .0, mo: .03, mw: .06, blush: .5 });
  const ap = pose({ x: 1815, y: 1262, k: 2.0, turn: -.42, lean: -.07, face: aFace, armL: { dx: -.1, dy: -.12, w: 0, bend: 55, elv: [1, .3], flex: 1 }, armR: ARM.rest, shadow: 0 });
  drawChar(c, CAST.ana, ap);
}

window.render = t => {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.fillStyle = P.ink; c.fillRect(0, 0, SW, SH);
  const ep = Q.get('ep') ? +Q.get('ep') : (t < 1.5 ? 1 : t < 2.5 ? 2 : t < 3.5 ? 3 : 4);
  if (ep === 1) ep1(); else if (ep === 2) ep2(); else if (ep === 3) ep3(); else ep4();
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  grain(c, SW, SH, .025);
};

(async () => {
  await document.fonts.load('600 40px "Fredoka"');
  await Promise.all([document.fonts.load('400 40px "Lilita One"'), document.fonts.load('700 40px "Fredoka"'), document.fonts.load('500 40px "Fredoka"'),
    document.fonts.load('700 40px "Baloo Bhaijaan 2"', 'أول يوسف الحلقة'), document.fonts.load('800 40px "Baloo Bhaijaan 2"', 'أول جملة غلط تصبح على خير الصبح'),
    document.fonts.load('800 40px "Baloo Bhaijaan 2"', 'عندي 26 سنة ليه كلمة واحدة زيادة I am live'), document.fonts.load('400 30px "Lilita One"', 'RECEPTION')]);
  await document.fonts.ready;
  bakeWorld(); bakeSets();
  window.DUR = 4;
  window.render(1);
  window.READY = true;
})();
