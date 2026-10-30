// YouTube thumbnails for "يوسف في نيويورك", drawn with the episodes' own engine (Bean People v3) so the characters are on-model.
// Page contract: window.DUR = 2, window.render(t): t < 1.5 → episode 1 ("First Day"), otherwise episode 2 ("Good Morning?").
// Render: node core/render/still.mjs <this dir> 1 2 --out <dir>   (1920×1080; downscale to 1280×720 with ffmpeg)
import { P, grain, CPU, rgba, rr, mix } from './kit.js';
import { clamp } from '/core/lib.js';
import { CAST, drawChar, pose } from './bean.js';
import { bakeWorld, bakeSets, drawWorld, drawHall } from './world.js';
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
function arPlate(c, cx, cy, lines, { rot = -.035, pad = 44, lh = 1.08, keyline = true } = {}) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.direction = 'rtl'; c.textAlign = 'center'; c.textBaseline = 'middle';
  let W = 0, Hh = 0;
  for (const L of lines) { c.font = `800 ${L.fs}px ${AR}`; W = Math.max(W, c.measureText(L.t).width); Hh += L.fs * lh; }
  const bw = W + pad * 2, bh = Hh + pad * 1.4;
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
  drawWorld(c, { x: 1040, y: 470, z: 1.25 }, 0, { dof: 9, nearDof: 8, taxiX: 1500, door: 0, clock: 8.9 });
  dim(c, .08); vignette(c, .42);
  // Youssef: the freeze — wide eyes, worried brows, ///, sweat, the wavy mouth; one hand up at the head (the still's scratch)
  const face = F('embarrassed', { eye: 1, pupil: .8, lx: .12, ly: -.02, happy: .12, bLy: .62, bRy: .62, bLr: .95, bRr: .95, mw: .125, ms: -.05, mwob: 1, mo: .012, blush: 1, lines: 1, sweat: 1 });
  const k = 3.25, y = 1125;
  const p = pose({ x: 585, y, k, turn: .1, face, armL: ARM.rest, armR: ARM.scratch, quiff: .15, breathe: 0, shadow: 0 });
  drawChar(c, CAST.youssef, p);
  // the bubble, tail to his head (right temple)
  const B = bigBubble(c, { x: 840, y: 262, who: 'youssef', words: [{ w: 'I' }, { w: 'Youssef.' }], side: 1, fs: 118, lift: 110 });
  bubbleSquiggle(c, B, 0, 1);
  // the headline
  arPlate(c, 1440, 690, [{ t: 'أول جملة…', fs: 150 }, { t: 'غلط!', fs: 230, col: P.mustard, dy: -6 }], { rot: -.04 });
  epTag(c, 1760, 428, 'الحلقة 1', 60, .1);
}

// Episode 2 "Good Morning?": the yawn, "Good… night." with the squiggle, Sara peeking surprised, "تصبح على خير… الصبح؟!"
function ep2() {
  drawHall(c, { x: 1060, y: 560, z: 1.55 }, 0, { dof: 8, clock: 8.2 });
  dim(c, .06); vignette(c, .4);
  // Sara peeks in from the right edge, surprised, leaning toward him
  const sFace = F('surprised', { pupil: .72, mo: .085, mw: .062, lx: -.75, ly: .05, bLy: 1, bRy: 1, blush: .5 });
  const sp = pose({ x: 1790, y: 1215, k: 1.95, turn: -.42, lean: -.06, face: sFace, armL: { dx: -.08, dy: -.2, w: 0, bend: 55, elv: [1, .3], flex: 1 }, armR: ARM.rest, pony: -.25, shadow: 0 });
  drawChar(c, CAST.mia, sp);
  // Youssef mid-yawn: eyes shut, brows up, mouth wide open, the hand up near the mouth; a stretch
  const yFace = F('neutral', { eye: .06, bLy: 1, bRy: 1, bLr: .3, bRr: .3, mw: .1, mo: .15, ms: -.12, mt: 0, mround: .25, blush: .5, lx: 0, ly: 0 });
  const MOUTH = { dx: -.3, dy: -.12, w: 0, bend: 55, elv: [1, .2], flex: 1 };
  const yp = pose({ x: 600, y: 1130, k: 3.2, turn: .12, sq: 1.04, lean: -.02, face: yFace, armL: ARM.rest, armR: MOUTH, quiff: .1, shadow: 0 });
  drawChar(c, CAST.youssef, yp);
  // z z z off his head, small (the sleep trail from the open scene)
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = P.cream; c.strokeStyle = P.navy; c.lineWidth = 10; c.lineJoin = 'round'; c.font = '600 92px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  [[905, 300, -.18, 1], [960, 215, -.1, 1.25], [1030, 110, .05, 1.55]].forEach(([x, y, r, s]) => { c.save(); c.translate(x, y); c.rotate(r); c.scale(s, s); c.strokeText('z', 0, 0); c.fillText('z', 0, 0); c.restore(); });
  c.restore();
  // the bubble
  const B = bigBubble(c, { x: 1120, y: 262, who: 'youssef', words: [{ w: 'Good…' }, { w: 'night.' }], side: 1, fs: 112, lift: 110 });
  bubbleSquiggle(c, B, 1, 1);
  // the headline
  arPlate(c, 1400, 640, [{ t: 'تصبح على خير…', fs: 138 }, { t: 'الصبح؟!', fs: 210, col: P.mustard, dy: -6 }], { rot: -.04 });
  epTag(c, 1735, 405, 'الحلقة 2', 60, .1);
}

window.render = t => {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.fillStyle = P.ink; c.fillRect(0, 0, SW, SH);
  const ep = Q.get('ep') ? +Q.get('ep') : (t < 1.5 ? 1 : 2);
  if (ep === 1) ep1(); else ep2();
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  grain(c, SW, SH, .025);
};

(async () => {
  await document.fonts.load('600 40px "Fredoka"');
  await Promise.all([document.fonts.load('400 40px "Lilita One"'), document.fonts.load('700 40px "Fredoka"'), document.fonts.load('500 40px "Fredoka"'),
    document.fonts.load('700 40px "Baloo Bhaijaan 2"', 'أول يوسف الحلقة'), document.fonts.load('800 40px "Baloo Bhaijaan 2"', 'أول جملة غلط تصبح على خير الصبح')]);
  await document.fonts.ready;
  bakeWorld(); bakeSets();
  window.DUR = 2;
  window.render(1);
  window.READY = true;
})();
