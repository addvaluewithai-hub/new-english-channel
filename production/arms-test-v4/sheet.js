// Arms test v4 — model sheets (index.html?f=sheet | f=unfold). Rendered with still.mjs; not part of the episode.
//   sheet:  six poses (rest · point · wave · hold two cups · sip · scratch), both characters in a 3/4 two-shot, A3 row above the A4 row
//   unfold: the A4 unfold, frame by frame (rest → point, rest → wave, the far arm rest → hand-over, rest → scratch), for pops
import { P, rgba, dark, rr } from './kit.js';
import { CAST, EXPR, ARM, pose, drawChar, drawCup, drawHand, handPos, setArms, blendArm } from './bean.js';
import { REACH, OPEN } from './act.js';

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
  c.font = '400 46px "Lilita One"'; c.fillStyle = P.navy; c.textAlign = 'left'; c.fillText('ARMS · A3 vs A4', 36, 56);
  label(c, 'A3 (episodes now): shoulder cap + one tapered sleeve curve + round hand, always full length.   A4: at rest the sleeve hugs the side as a bulge inside the body', 420, 34, 15.5, rgba(P.ink, .72), 'left', 500);
  label(c, 'silhouette (one form pass, small hand at the hip, far arm hidden); gestures unfold the A3 arm out of it (+10 % at the shoulder).  Same pose objects, same scale, 3/4 view.', 420, 54, 15.5, rgba(P.ink, .72), 'left', 500);
  label(c, 'Dashed red line in the A4 rows: where the new medium two-shot cuts the frame (≈ .2 H above the feet): below it is off screen in the dialogue shots.', 420, 74, 15.5, rgba(P.ink, .5), 'left', 500);
  const k = .62, cw = 300, x0 = 120 + cw / 2, rh = 236;
  const rows = [['youssef', 'A3', 1], ['youssef', 'A4', 1], ['mia', 'A3', 2], ['mia', 'A4', 2]];
  rows.forEach(([id, m, col], ri) => {
    const ry = 110 + ri * rh + (ri >= 2 ? 6 : 0);
    setArms(m);
    c.fillStyle = m === 'A4' ? '#FFF6E6' : '#FFFBF3'; rr(c, 16, ry, SW - 32, rh - 8, 22); c.fill();
    c.font = '400 40px "Lilita One"'; c.fillStyle = m === 'A4' ? P.teal : rgba(P.navy, .8); c.textAlign = 'left'; c.fillText(m, 32, ry + 50);
    label(c, id === 'mia' ? 'Sara' : 'Youssef', 32, ry + 76, 17, rgba(P.ink, .55), 'left', 600);
    POSES.forEach(([name, yo, so], i) => {
      const cx = x0 + i * cw, g = ry + rh - 34;
      if (i) { c.strokeStyle = rgba(P.ink, .07); c.lineWidth = 2; c.beginPath(); c.moveTo(cx - cw / 2, ry + 14); c.lineTo(cx - cw / 2, ry + rh - 22); c.stroke(); }
      const hh = CAST[id].H * k;
      if (m === 'A4') { const yc = g - .2 * hh; c.setLineDash([7, 7]); c.strokeStyle = rgba(P.red, .5); c.lineWidth = 2; c.beginPath(); c.moveTo(cx - cw / 2 + 12, yc); c.lineTo(cx + cw / 2 - 12, yc); c.stroke(); c.setLineDash([]); }
      actor(c, id, cx + (id === 'mia' ? -14 : 14), g, k, { ...(id === 'mia' ? S0 : Y0), ...(id === 'mia' ? so : yo) });
      if (ri === 0) label(c, name, cx, ry - 6, 19, rgba(P.ink, .7));
    });
  });
  setArms('A4');
  label(c, 'arms test v4 · bean.js ARMS = A4 · Youssef turn .3 (armL near), Sara turn −.3 (armR near); point / wave / scratch use the near arm, the sip the far arm brought in front (as in the episode)', SW / 2, SH - 8, 14, rgba(P.ink, .45));
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
    ['Youssef · far arm → hand-over', 'youssef', { turn: .5, face: face('joy', { lx: .55 }) }, 'armR', { ...REACH, dx: .12, dy: .08 }],
    ['Youssef · near arm → scratch', 'youssef', { turn: .3, face: face('embarrassed') }, 'armL', ARM.scratch],
  ];
  rows.forEach(([name, id, base, which, tgt], ri) => {
    const ry = 84 + ri * 246;
    c.fillStyle = ri % 2 ? '#FFF8EC' : '#FFFBF3'; rr(c, 22, ry, SW - 44, 236, 22); c.fill();
    const nm = name.split(' · '); label(c, nm[0], 40, ry + 40, 20, P.ink, 'left', 700); nm.slice(1).join(' · ').split(' → ').forEach((ln, j) => label(c, (j ? '→ ' : '') + ln, 40, ry + 66 + j * 22, 15, rgba(P.ink, .65), 'left', 500));
    us.forEach((u, i) => {
      const cx = 300 + i * 190, g = ry + 214;
      actor(c, id, cx, g, k, { ...base, [which]: blendArm(ARM.rest, tgt, u) });
      label(c, `${Math.round(u * 100)} %`, cx + 74, g - 8, 14, rgba(P.ink, .4));
    });
  });
}

// hands: A3's ball vs the A4 mitten, close up (Youssef, upper body, k 1.45) and at phone scale (inset, k .32)
export function sheetHands(c) {
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  c.font = '400 44px "Lilita One"'; c.fillStyle = P.navy; c.textAlign = 'left'; c.fillText('HANDS · ball (A3) vs mitten (A4)', 36, 56);
  label(c, 'mitten: a rounded palm along the forearm, a small thumb splayed on the upper side, two finger splits at the tip · point = fist + index finger · hold = the tip curls', 36, 84, 16, rgba(P.ink, .68), 'left', 500);
  label(c, 'over the cup · at rest it hides in the sleeve (A4: a small peek at the hip). Inset top-right of each cell: the same pose at phone scale.', 36, 104, 16, rgba(P.ink, .68), 'left', 500);
  const cols = [['rest', {}], ['point', { armR: ARM.point }], ['wave', { armR: ARM.wave, wave: .25 }], ['hold cup', { armR: { ...ARM.hold }, cups: [1] }], ['open palm', { armR: OPEN }]];
  const fc = { rest: face('happy', { happy: .4, lx: -.4 }), point: face('talk', { lx: .6 }), wave: face('joy'), 'hold cup': face('happy', { happy: .5, lx: -.4 }), 'open palm': face('talk', { lx: .5 }) };
  const cw = 372, ch = 452;
  [['A3', 120], ['A4', 590]].forEach(([m, ry]) => {
    setArms(m);
    c.font = '400 36px "Lilita One"'; c.fillStyle = m === 'A4' ? P.teal : rgba(P.navy, .8); c.textAlign = 'left';
    cols.forEach(([name, o], i) => {
      const x = 22 + i * (cw + 4);
      c.save(); rr(c, x, ry, cw, ch, 20); c.fillStyle = m === 'A4' ? '#FFF6E6' : '#FFFBF3'; c.fill(); c.clip();
      actor(c, 'youssef', x + cw * .3, ry + ch + 30, 1.1, { turn: -.3, face: fc[name], shadow: 0, ...o });
      c.fillStyle = rgba('#FFFFFF', .75); rr(c, x + cw - 124, ry + 8, 116, 124, 14); c.fill();
      actor(c, 'youssef', x + cw - 74, ry + 122, .32, { turn: -.3, face: fc[name], ...o });
      c.restore();
      label(c, `${m} · ${name}`, x + 16, ry + 30, 19, m === 'A4' ? dark(P.teal, .2) : rgba(P.navy, .85), 'left', 700);
    });
  });
  setArms('A4');
}
