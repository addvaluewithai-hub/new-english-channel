// Arms test v4 — model sheets (index.html?f=sheet | f=unfold). Rendered with still.mjs; not part of the episode.
//   sheet:  six poses (rest · point · wave · hold two cups · sip · scratch), both characters in a 3/4 two-shot, A3 row above the A4 row
//   unfold: the A4 unfold, frame by frame (rest → point, rest → wave, the far arm rest → hand-over, rest → scratch), for pops
import { P, rgba, dark, rr } from './kit.js';
import { CAST, EXPR, ARM, pose, drawChar, drawCup, drawHand, handPos, setArms, blendArm } from './bean.js';
import { REACH } from './act.js';

const SW = 1920, SH = 1080;
const face = (n, x = {}) => ({ ...EXPR[n], ...x });
const SIP = { dx: -.13, dy: .02, w: 0, bend: 60, elv: [1, .7], flex: 1, front: true };   // story.js SIPPOSE
function label(c, txt, x, y, size = 22, col = P.ink, align = 'center', w = 600, font = 'Fredoka') {
  c.font = `${w} ${size}px "${font}"`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(txt, x, y);
}
// one character; o.cups: a cup in each listed hand (0 = armL, 1 = armR); o.rot: the cup tilt
function actor(c, id, x, y, k, o) {
  const sp = CAST[id], p = pose({ x, y, k, shadow: .8, ...o });
  drawChar(c, sp, p);
  if (o.cups) { const hs = handPos(sp, p); for (const i of o.cups) { const h = hs[i]; drawCup(c, h[0], h[1] - .02 * 300 * k, k, { steam: .6, t: 1, rot: o.rot || 0 }); drawHand(c, sp, h[0], h[1], sp.H * k, { dir: h[3], grip: true }); } }
}
// the pose table: [name, youssef pose, sara pose]. Youssef faces right (turn .3: his armL is the near arm), Sara faces left (armR near)
const Y0 = { turn: .3 }, S0 = { turn: -.3 };
const POSES = [
  ['rest', { face: face('happy', { happy: .4, lx: .4 }) }, { face: face('happy', { happy: .4, lx: -.4 }) }],
  ['point', { armL: ARM.point, face: face('talk', { lx: -.6 }) }, { armR: ARM.point, face: face('talk', { lx: .6 }) }],
  ['wave', { armL: ARM.wave, wave: .25, face: face('joy') }, { armR: ARM.wave, wave: .25, face: face('joy') }],
  ['hold two cups', { armL: ARM.hold, armR: ARM.hold, cups: [0, 1], face: face('happy', { happy: .5, lx: .4 }) }, { armL: ARM.hold, armR: ARM.hold, cups: [0, 1], face: face('happy', { happy: .5, lx: -.4 }) }],
  ['sip', { armR: SIP, cups: [1], rot: -.35, face: face('neutral', { eye: .1, bLy: .3, bRy: .3, mw: .06, mo: .02, ms: .2, blush: .5 }) }, { armL: SIP, cups: [0], rot: .35, face: face('neutral', { eye: .1, bLy: .3, bRy: .3, mw: .06, mo: .02, ms: .2, blush: .5 }) }],
  ['scratch', { armL: ARM.scratch, face: face('embarrassed') }, { armR: ARM.scratch, face: face('embarrassed', { lx: .5 }) }],
];

export function sheetPoses(c) {
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  c.font = '400 50px "Lilita One"'; c.fillStyle = P.navy; c.textAlign = 'left'; c.fillText('ARMS · A3 vs A4', 40, 64);
  label(c, 'A3 (episodes now): shoulder cap + one tapered sleeve curve + round hand, always full length  ·  A4: at rest the sleeve hugs the side as a bulge in the body silhouette (small hand at the hip, far arm hidden); gestures unfold the A3 arm (+10 % at the shoulder)', 470, 50, 15.5, rgba(P.ink, .7), 'left', 500);
  label(c, 'same poses, same scale, 3/4 two-shot (Youssef turn .3, Sara −.3). Dashed line in the A4 row: where the new medium two-shot cuts the frame (≈ .2 H above the feet)', 470, 72, 15.5, rgba(P.ink, .5), 'left', 500);
  const k = .74, cw = 306, x0 = 30, rows = [['A3', 96, P.navy], ['A4', 588, P.teal]];
  for (const [m, ry, col] of rows) {
    setArms(m);
    c.fillStyle = m === 'A4' ? '#FFF8EC' : '#FFFBF3'; rr(c, 22, ry, SW - 44, 476, 26); c.fill();
    c.font = '400 46px "Lilita One"'; c.fillStyle = col; c.textAlign = 'left'; c.fillText(m, 42, ry + 52);
    POSES.forEach(([name, yo, so], i) => {
      const cx = x0 + 140 + i * cw, g = ry + 420;
      if (i) { c.strokeStyle = rgba(P.ink, .07); c.lineWidth = 2; c.beginPath(); c.moveTo(cx - cw / 2 + 4, ry + 70); c.lineTo(cx - cw / 2 + 4, ry + 440); c.stroke(); }
      if (m === 'A4') { const yc = g - .2 * 300 * .9 * k; c.setLineDash([7, 7]); c.strokeStyle = rgba(P.red, .45); c.lineWidth = 2; c.beginPath(); c.moveTo(cx - cw / 2 + 14, yc); c.lineTo(cx + cw / 2 - 10, yc); c.stroke(); c.setLineDash([]); }
      actor(c, 'youssef', cx - 62, g, k * .9, { ...Y0, ...yo });
      actor(c, 'mia', cx + 82, g, k * .9, { ...S0, ...so });
      label(c, name, cx + 10, g + 42, 19, rgba(P.ink, .62));
    });
  }
  setArms('A4');
  label(c, 'arms test v4 · bean.js ARMS = A4 · the same pose objects feed both rows (A3 ignores the new `out` field)', SW / 2, SH - 12, 14, rgba(P.ink, .45));
}

// the unfold, frame by frame: the arm fields blended from rest to the gesture by u (the smoothed tracks in act.js move all of them
// together, with `out` slightly ahead), drawn at 9 steps
export function sheetUnfold(c) {
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  c.font = '400 46px "Lilita One"'; c.fillStyle = P.teal; c.textAlign = 'left'; c.fillText('A4 · UNFOLD / FOLD', 40, 60);
  label(c, 'each row: the arm pose blended rest → gesture (out 0 → 1 rides along); in the film the same blend runs forward over ≈ .2–.3 s and back for the fold', 520, 52, 17, rgba(P.ink, .65), 'left', 500);
  setArms('A4');
  const us = [0, .08, .16, .25, .35, .5, .65, .8, 1], k = .62;
  const rows = [
    ['Youssef · near arm → point', 'youssef', { turn: .3, face: face('talk', { lx: -.6 }) }, 'armL', ARM.point],
    ['Sara · near arm → wave', 'mia', { turn: -.3, wave: .25, face: face('joy') }, 'armR', ARM.wave],
    ['Youssef · far arm → hand-over (comes out from behind)', 'youssef', { turn: .5, face: face('joy', { lx: .55 }) }, 'armR', { ...REACH, dx: .12, dy: .08 }],
    ['Youssef · near arm → scratch', 'youssef', { turn: .3, face: face('embarrassed') }, 'armL', ARM.scratch],
  ];
  rows.forEach(([name, id, base, which, tgt], ri) => {
    const ry = 84 + ri * 246;
    c.fillStyle = ri % 2 ? '#FFF8EC' : '#FFFBF3'; rr(c, 22, ry, SW - 44, 236, 22); c.fill();
    label(c, name, 44, ry + 30, 19, P.ink, 'left', 600);
    us.forEach((u, i) => {
      const cx = 130 + i * 205, g = ry + 214;
      actor(c, id, cx, g, k, { ...base, [which]: blendArm(ARM.rest, tgt, u) });
      label(c, `${Math.round(u * 100)} %`, cx + 74, g - 8, 14, rgba(P.ink, .4));
    });
  });
}
