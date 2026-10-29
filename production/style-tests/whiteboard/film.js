// "Day 1" — Whiteboard Explainer style test (17 s). One board, no hands, floating markers.
// Youssef lives on a magnet card (magnets are the only things that move on a board); Mia is drawn into the school door.
import * as W from './engine/wb.js';
import { clamp, lerp, TAU, mulberry } from '/core/lib.js';

export const DUR = 17.0;
const NAVY = '#1f2a44', RED = '#c8363a', AMBER = '#d98a2b';
const GY = 2450;                 // foreground ground line (feet)
const BY = 2250;                 // background base (bus, houses: further away)
const ss = u => u * u * (3 - 2 * u);

export async function build() {
  await W.loadFont('tech', 'fonts/EMSTech.json');
  const tl = new W.Timeline();
  const N1 = new W.Pen('n1', NAVY, { park: [2150, 1250] });
  const N2 = new W.Pen('n2', NAVY, { park: [2200, -180] });
  const R = new W.Pen('r', RED, { park: [-260, 1300] });
  const A = new W.Pen('a', AMBER, { park: [-250, -200] });
  const PENS = [N1, N2, R, A];
  const T = W.text;
  const D = (pen, shapes, a, b, o = {}) => tl.draw(pen, shapes, a, { by: b, ...o });
  const tagG = (arr, g) => { for (const s of [arr].flat(9)) s.grp = g; return arr; };

  // ───────── helpers
  const tube = (pts, w0, w1 = w0) => {              // outline polygon around a limb polyline
    const L = [], Rr = [];
    pts.forEach((p, i) => {
      const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)], dx = q[0] - r[0], dy = q[1] - r[1], l = Math.hypot(dx, dy) || 1;
      const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
      L.push([p[0] - dy / l * w, p[1] + dx / l * w]); Rr.push([p[0] + dy / l * w, p[1] - dx / l * w]);
    });
    return [...L, ...Rr.reverse()];
  };
  const closed = (poly, o) => W.poly([...poly, poly[0], [lerp(poly[0][0], poly[1][0], .25), lerp(poly[0][1], poly[1][1], .25)]], o);
  const ell = (cx, cy, rx, ry, a0 = -2.2, lap = .2, o = {}) => W.arc(cx, cy, rx, a0, a0 + TAU + lap, { ry, ...o });
  const ellPoly = (cx, cy, rx, ry, n = 24) => [...Array(n)].map((_, i) => [cx + Math.cos(i / n * TAU) * rx, cy + Math.sin(i / n * TAU) * ry]);
  const off = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
  // speech bubble: one continuous stroke, rounded box with a tail to (tx,ty) leaving the bottom edge at bx
  function bubble(x, y, w, h, bx, tx, ty, o = {}) {
    const r = 34;
    const pts = []; const ac = (cx, cy, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    pts.push([bx + 26, y + h]);
    ac(x + w - r, y + h - r, Math.PI / 2, 0); ac(x + w - r, y + r, 0, -Math.PI / 2);
    ac(x + r, y + r, -Math.PI / 2, -Math.PI); ac(x + r, y + h - r, Math.PI, Math.PI / 2);
    pts.push([bx - 24, y + h], [tx, ty], [bx + 30, y + h + 4]);
    return W.poly(pts, { w: 8, wav: 400, ...o });
  }

  // ───────── ghost marks: an old lesson that was never fully wiped (grammar words, fittingly)
  const ghosts = [], gR = mulberry(31);
  const gw = ['she is', 'he is', 'I am', 'p. 12', 'a / an', 'they are', 'Mon', 'homework', 'you are'];
  for (let i = 0; i < 40; i++) {
    const x = gR() * 6800 + 200, y = gR() * 2900 + 150, k = gR();
    const o = { w: 11, alpha: .045 + gR() * .045, color: gR() < .25 ? '#8aa0c8' : '#9aa0a8' };
    if (k < .35) ghosts.push(...T(gw[i % gw.length], x, y, { h: 50 + gR() * 40, ...o }));
    else if (k < .6) ghosts.push(W.circle(x, y, 40 + gR() * 100, o));
    else if (k < .8) ghosts.push(...W.arrow(x, y, x + (gR() - .5) * 500, y + (gR() - .5) * 300, o));
    else ghosts.push(W.line(x, y, x + 200 + gR() * 500, y + (gR() - .5) * 80, o));
  }

  // ═════════ YOUSSEF on a magnet card (local coords: feet at 0,0; y up is negative)
  const X0 = 1000, X1 = 4250, WALK0 = 2.6, WALK1 = 7.25, NSTEP = 12;
  const CARD = { x: -292, y: -690, w: 432, h: 718, r: 30 };
  const YG = {
    pose(t) {
      let x = X0, lift = 0, rot = 0, y = GY, up = 0, sc = 1;
      if (t < .35) { const u = clamp(t / .35); lift = (1 - u) ** 2; sc = 1 + lift * .1; up = lift * 60; }
      if (t >= WALK0) {
        const f = clamp((t - WALK0) / (WALK1 - WALK0)) * NSTEP, k = Math.min(NSTEP - 1, Math.floor(f)), u = t >= WALK1 ? 1 : f - k;
        x = lerp(X0, X1, (k + ss(u)) / NSTEP);
        lift = t >= WALK1 ? 0 : Math.sin(Math.PI * u) * .55; up = lift * 26; rot = Math.sin(Math.PI * u) * .045 * (k % 2 ? 1 : -1);
        if (t > WALK1) { const v = clamp((t - WALK1) / .3); rot += Math.sin(v * 9) * (1 - v) * .025; }   // settle
      }
      if (t > 11.3 && t < 13.7) { const e = Math.sin(clamp((t - 11.3) / 2.4) * Math.PI); rot += Math.sin(t * 53) * .007 * e; x += Math.sin(t * 41) * 2 * e; }   // nerves
      if (t > 14.62) { const v = ss(clamp((t - 14.62) / .45)); rot -= .035 * v; y += 16 * v; }                   // sinks a little
      return { x, y, rot, up, lift, sc };
    },
    toWorld([lx, ly], t) { const P = this.pose(t), c = Math.cos(P.rot), s = Math.sin(P.rot); return [P.x + (lx * c - ly * s) * P.sc, P.y - P.up + (lx * s + ly * c) * P.sc]; },
  };
  const g = YG;
  // head & face
  const HY = -560;
  const yHead = ell(0, HY, 58, 66, -2.4, .25, { w: 8 });
  const hairPoly = [[-60, HY - 8], [-58, HY - 40], [-40, HY - 66], [-8, HY - 76], [26, HY - 74], [52, HY - 56], [61, HY - 22], [56, HY - 10], [40, HY - 38], [10, HY - 46], [-24, HY - 40], [-48, HY - 24]];
  const yHair = [closed(hairPoly, { w: 7 }), W.hatch(hairPoly, { spacing: 9, w: 11, alpha: .95, angle: -.5 })];
  const beardOut = [[-58, HY + 2], [-55, HY + 32], [-40, HY + 56], [0, HY + 70], [40, HY + 56], [55, HY + 32], [58, HY + 2]];
  const beardIn = [[44, HY + 6], [40, HY + 30], [26, HY + 45], [0, HY + 50], [-26, HY + 45], [-40, HY + 30], [-44, HY + 6]];
  const beardPoly = [...beardOut, ...beardIn];
  const yBeard = [W.hatch(beardPoly, { spacing: 8, w: 10, alpha: .9, angle: .3 }), W.curve(beardOut, { w: 6 })];
  const yMust = W.curve([[-17, HY + 26], [0, HY + 22], [17, HY + 26]], { w: 9 });
  const ySmile = W.curve([[-17, HY + 36], [0, HY + 44], [17, HY + 36]], { w: 6 });
  const yEyes = [W.line(-22, HY - 8, -21, HY - 1, { w: 9 }), W.line(22, HY - 8, 23, HY - 1, { w: 9 })];
  const yBrows = [W.line(-36, HY - 26, -11, HY - 30, { w: 7 }), W.line(11, HY - 30, 36, HY - 26, { w: 7 })];
  const yNose = W.curve([[2, HY - 4], [7, HY + 12], [-3, HY + 15]], { w: 5 });
  const yEars = [W.arc(-60, HY + 2, 13, Math.PI * .5, Math.PI * 1.5, { w: 6 }), W.arc(60, HY + 2, 13, -Math.PI * .5, Math.PI * .5, { w: 6 })];
  const faceSkin = ellPoly(0, HY + 4, 52, 58);
  // body
  const jL = [[-82, -470], [-24, -484], [-20, -282], [-78, -282]], jR = [[24, -484], [82, -470], [78, -282], [20, -282]];
  const yJacket = [W.poly([[-24, -484], [-82, -470], [-78, -282], [-20, -282], [-22, -470]], { w: 7 }), W.poly([[24, -484], [82, -470], [78, -282], [20, -282], [22, -470]], { w: 7 })];
  const yTee = [W.curve([[-22, -484], [0, -466], [22, -484]], { w: 5 })];
  const armL = tube([[-78, -462], [-112, -400], [-150, -340]], 34, 28), armR = tube([[78, -462], [96, -390], [104, -322]], 34, 28);
  const yArms = [closed(armL, { w: 6 }), closed(armR, { w: 6 })];
  const legL = [[-64, -282], [-4, -282], [-10, -32], [-52, -32]], legR = [[4, -282], [64, -282], [52, -32], [10, -32]];
  const yLegs = [W.poly([[-64, -282], [-52, -32]], { w: 7 }), W.poly([[-4, -270], [-10, -32]], { w: 6 }), W.poly([[4, -270], [10, -32]], { w: 6 }), W.poly([[64, -282], [52, -32]], { w: 7 })];
  const shoeL = [[-60, -34], [-6, -34], [-4, -8], [-70, -6], [-72, -18]], shoeR = [[6, -34], [60, -34], [74, -18], [72, -6], [4, -8]];
  const yShoes = [closed(shoeL, { w: 6 }), closed(shoeR, { w: 6 })];
  const handL = ellPoly(-154, -330, 15, 16), handR = ellPoly(104, -310, 15, 16);
  const yHands = [ell(-154, -330, 15, 16, -2, .2, { w: 5 }), ell(104, -310, 15, 16, -2, .2, { w: 5 })];
  // red suitcase (rolling, handle up to his left hand)
  const SC = { x: -268, y: -272, w: 106, h: 244 };
  const sPoly = [[SC.x, SC.y], [SC.x + SC.w, SC.y], [SC.x + SC.w, SC.y + SC.h], [SC.x, SC.y + SC.h]];
  const ySuit = [W.roundRect(SC.x, SC.y, SC.w, SC.h, 14, { w: 8 }), W.line(SC.x + 8, SC.y + 80, SC.x + SC.w - 8, SC.y + 80, { w: 5 }), W.line(SC.x + 8, SC.y + 164, SC.x + SC.w - 8, SC.y + 164, { w: 5 }),
    W.line(SC.x + 34, SC.y, SC.x + 34, -336, { w: 6 }), W.line(SC.x + 70, SC.y, SC.x + 70, -336, { w: 6 }), W.line(SC.x + 24, -338, -150, -338, { w: 9 }),
    W.circle(SC.x + 18, -14, 11, { w: 6 }), W.circle(SC.x + SC.w - 18, -14, 11, { w: 6 })];
  const ySuitFill = W.hatch(sPoly, { spacing: 12, w: 12, alpha: .62, angle: -.9 });

  // timing — the pens draw him on the card (two navy pens at once, then red, then amber)
  D(N1, tagG([yHead, ...yHair, ...yEyes, ...yBrows, yNose, ...yBeard, yMust, ySmile, ...yEars], g), .38, 1.25, { minGap: .02, maxGap: .06 });
  D(N2, tagG([...yJacket, ...yTee, ...yArms, ...yHands, ...yLegs, ...yShoes], g), .5, 1.45, { minGap: .02, maxGap: .06 });
  D(R, tagG([...ySuit, ySuitFill], g), .95, 1.75, { minGap: .02, maxGap: .05 });
  D(N1, tagG([W.hatch(jL, { spacing: 15, w: 10, alpha: .7, angle: -1 }), W.hatch(jR, { spacing: 15, w: 10, alpha: .7, angle: -1 }),
    W.hatch(armL, { spacing: 15, w: 10, alpha: .7, angle: .2 }), W.hatch(armR, { spacing: 15, w: 10, alpha: .7, angle: .2 })], g), 1.3, 1.8, { minGap: .02, maxGap: .04 });
  D(N2, tagG([W.hatch(legL, { spacing: 20, w: 8, alpha: .32, angle: .9 }), W.hatch(legR, { spacing: 20, w: 8, alpha: .32, angle: .9 })], g), 1.5, 1.8, { minGap: .02, maxGap: .04 });
  D(A, tagG([W.hatch(faceSkin, { spacing: 10, w: 12, alpha: .42, angle: -.6 }), W.hatch(handL, { spacing: 9, w: 10, alpha: .45 }), W.hatch(handR, { spacing: 9, w: 10, alpha: .45 }),
    W.hatch(shoeL, { spacing: 7, w: 9, alpha: .85 }), W.hatch(shoeR, { spacing: 7, w: 9, alpha: .85 })], g), 1.55, 2.05, { minGap: .02, maxGap: .04 });

  // ═════════ LONDON (pull-back): ground, bus, terraces, clock tower far away, sun, diary note
  const groundA = W.curve([[260, GY + 46], [1300, GY + 40], [2300, GY + 50], [2870, GY + 44]], { w: 10, wav: 600 });
  const groundB = W.curve([[2870, GY + 44], [3800, GY + 50], [4700, GY + 42], [5600, GY + 48], [6650, GY + 44]], { w: 10, wav: 600 });
  // double-decker bus (behind, on the background base)
  const B = { x: 1220, w: 930, h: 620 };
  const bTop = BY - B.h;
  const bus = [W.roundRect(B.x, bTop, B.w, B.h - 40, 40, { w: 9 }), W.line(B.x + 10, bTop + 300, B.x + B.w - 10, bTop + 300, { w: 7 })];
  for (let i = 0; i < 5; i++) bus.push(W.roundRect(B.x + 40 + i * 175, bTop + 60, 140, 140, 14, { w: 6 }));
  for (let i = 0; i < 4; i++) bus.push(W.roundRect(B.x + 220 + i * 175, bTop + 350, 140, 120, 14, { w: 6 }));
  bus.push(W.roundRect(B.x + 40, bTop + 340, 140, 250, 10, { w: 6 }));                     // door
  bus.push(W.circle(B.x + 210, BY - 30, 52, { w: 8 }), W.circle(B.x + B.w - 210, BY - 30, 52, { w: 8 }));
  const busRed = [W.hatch([[B.x + 6, bTop + 214], [B.x + B.w - 6, bTop + 214], [B.x + B.w - 6, bTop + 290], [B.x + 6, bTop + 290]], { spacing: 12, w: 11, alpha: .55, angle: -.9 }),
    W.hatch([[B.x + 186, bTop + 486], [B.x + B.w - 10, bTop + 486], [B.x + B.w - 10, bTop + 560], [B.x + 186, bTop + 560]], { spacing: 12, w: 11, alpha: .55, angle: -.9 })];
  D(N2, bus, 1.75, 2.6, { minGap: .015, maxGap: .04, travel: 4000 });
  D(R, busRed, 2.3, 2.7, { minGap: .015, maxGap: .03 });
  // terraced houses
  const houses = [];
  const HX = [2220, 2610, 3000], HW = 390, HH = 820;
  HX.forEach((x, i) => {
    const top = BY - HH;
    houses.push(W.line(x, BY, x, top, { w: 8 }), W.line(x + HW, top, x + HW, BY, { w: 8 }));
    houses.push(W.poly([[x - 20, top + 6], [x + HW / 2, top - 150 - (i % 2) * 30], [x + HW + 20, top + 6]], { w: 8 }));
    houses.push(W.line(x + HW * .7, top - 60, x + HW * .7, top - 150, { w: 7 }), W.line(x + HW * .7 + 40, top - 70, x + HW * .7 + 40, top - 150, { w: 7 }));   // chimney
    for (const [wx, wy] of [[x + 60, top + 90], [x + 230, top + 90], [x + 230, top + 380]]) houses.push(...W.rect(wx, wy, 110, 170, { w: 6, over: 5 }), W.line(wx + 55, wy, wx + 55, wy + 170, { w: 4, alpha: .8 }));
    houses.push(W.poly([[x + 60, BY], [x + 60, BY - 230], [x + 90, BY - 260], [x + 150, BY - 260], [x + 180, BY - 230], [x + 180, BY]], { w: 7 }));   // door
  });
  D(N2, houses, 2.62, 4.15, { minGap: .015, maxGap: .04, travel: 5000 });
  // clock tower far away (smaller, thinner, lighter): rises between the roofs
  const TWX = 2850, TWW = 120, twTop = 880, roof = BY - HH - 30;
  const tower = [W.line(TWX, roof, TWX, twTop + 220, { w: 6, alpha: .8 }), W.line(TWX + TWW, twTop + 220, TWX + TWW, roof - 50, { w: 6, alpha: .8 }),
    W.poly([[TWX - 14, twTop + 222], [TWX + TWW / 2, twTop], [TWX + TWW + 14, twTop + 222]], { w: 6, alpha: .8 }),
    W.circle(TWX + TWW / 2, twTop + 300, 40, { w: 5, alpha: .8 }), W.line(TWX + TWW / 2, twTop + 300, TWX + TWW / 2, twTop + 274, { w: 4 }), W.line(TWX + TWW / 2, twTop + 300, TWX + TWW / 2 + 18, twTop + 306, { w: 4 }),
    W.line(TWX - 10, twTop + 236, TWX + TWW + 10, twTop + 236, { w: 5, alpha: .8 }), W.line(TWX - 6, twTop + 380, TWX + TWW + 6, twTop + 380, { w: 5, alpha: .8 })];
  D(N1, groundA, 1.83, 2.08);
  D(N1, T('Day 1', 820, 1160, { h: 150, w: 15 }), 2.12, 2.78, { minGap: .02, maxGap: .05 });
  D(N1, W.curve([[800, 1215], [1150, 1205], [1430, 1218]], { w: 10, over: 18 }), 2.8, 2.92);
  D(N1, tower, 2.97, 3.5, { minGap: .02, maxGap: .05 });
  // sun (amber = warmth)
  const SUN = [3950, 1060];
  const sun = [W.circle(SUN[0], SUN[1], 95, { w: 9 })];
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU - .3; sun.push(W.line(SUN[0] + Math.cos(a) * 135, SUN[1] + Math.sin(a) * 135, SUN[0] + Math.cos(a) * 195, SUN[1] + Math.sin(a) * 195, { w: 8, bow: 0 })); }
  D(A, sun, 2.95, 3.55, { minGap: .02, maxGap: .04 });
  // diary note (the narrator's own words): "Day 1" … "my English: ✓"
  D(N1, T('my English:', 830, 1390, { h: 88, w: 10 }), 3.6, 4.4, { minGap: .02, maxGap: .05 });
  D(N1, T('✓', 1520, 1395, { h: 120, w: 14 }), 4.52, 4.85);

  // ═════════ THE SCHOOL (the pen leads the camera along the pavement)
  D(N1, groundB, 5.0, 6.75, { tag: 'pavement' });
  const SX0 = 4800, SX1 = 6150, STOP = GY - 860;
  const DR = { x: 4950, w: 450, top: GY - 660 };
  const school = [W.line(SX0, GY, SX0, STOP, { w: 9 }), W.line(SX0 - 40, STOP, SX1 + 40, STOP, { w: 10 }), W.line(SX0 - 30, STOP - 50, SX1 + 30, STOP - 50, { w: 8 }), W.line(SX1, STOP, SX1, GY, { w: 9 }),
    W.line(SX0 - 30, STOP - 50, SX0 - 40, STOP, { w: 7 }), W.line(SX1 + 30, STOP - 50, SX1 + 40, STOP, { w: 7 }),
    W.line(DR.x, GY, DR.x, DR.top, { w: 9 }), W.arc(DR.x + DR.w / 2, DR.top, DR.w / 2, Math.PI, TAU, { w: 9 }), W.line(DR.x + DR.w, DR.top, DR.x + DR.w, GY, { w: 9 }),
    W.line(DR.x, DR.top, DR.x + DR.w, DR.top, { w: 6, alpha: .8 }),
    W.line(DR.x - 40, GY - 4, DR.x + DR.w + 40, GY - 4, { w: 8 })];
  for (const [wx, wy] of [[5560, GY - 400], [5860, GY - 400]]) school.push(...W.rect(wx, wy, 200, 230, { w: 7, over: 5 }), W.line(wx + 100, wy, wx + 100, wy + 230, { w: 4 }), W.line(wx, wy + 115, wx + 200, wy + 115, { w: 4 }));
  D(N2, school, 5.05, 6.35, { minGap: .015, maxGap: .04, travel: 4000 });
  const SIGN = { x: 5520, y: GY - 760, w: 560, h: 260 };
  D(N2, [W.roundRect(SIGN.x, SIGN.y, SIGN.w, SIGN.h, 18, { w: 8 })], 6.38, 6.55);
  D(N2, [...T('ENGLISH', SIGN.x + SIGN.w / 2, SIGN.y + 108, { h: 74, w: 10, align: 'center' }), ...T('SCHOOL', SIGN.x + SIGN.w / 2, SIGN.y + 214, { h: 74, w: 10, align: 'center' })], 6.57, 7.2, { minGap: .015, maxGap: .04 });

  // ═════════ MIA, drawn into the doorway (belongs to the place; doesn't move)
  const MX = DR.x + DR.w / 2 + 10, MH = -505;           // her head centre (relative to GY)
  const m = (pts) => off(pts, MX, GY);
  const mHead = ell(MX, GY + MH, 54, 62, -2.3, .25, { w: 8 });
  const mHairCap = m([[-56, MH - 4], [-52, MH - 42], [-26, MH - 66], [10, MH - 70], [42, MH - 56], [58, MH - 26], [58, MH - 4], [36, MH - 34], [0, MH - 42], [-30, MH - 26]]);
  const mPony = m([[44, MH - 50], [84, MH - 40], [104, MH + 4], [98, MH + 60], [80, MH + 96], [72, MH + 52], [62, MH + 2], [52, MH - 24]]);
  const mHair = [closed(mHairCap, { w: 6, color: NAVY }), closed(mPony, { w: 6, color: NAVY }), W.line(MX + 46, GY + MH - 50, MX + 58, GY + MH - 28, { w: 9, color: NAVY })];
  const mHairFill = [W.hatch(mHairCap, { spacing: 9, w: 11, alpha: .9, angle: -.4 }), W.hatch(mPony, { spacing: 9, w: 11, alpha: .9, angle: .5 })];
  const mFace = [W.line(MX - 20, GY + MH - 4, MX - 19, GY + MH + 3, { w: 9 }), W.line(MX + 20, GY + MH - 4, MX + 21, GY + MH + 3, { w: 9 }),
    W.line(MX - 32, GY + MH - 24, MX - 10, GY + MH - 27, { w: 6 }), W.line(MX + 10, GY + MH - 27, MX + 32, GY + MH - 24, { w: 6 }),
    W.curve([[MX + 1, GY + MH], [5 + MX, GY + MH + 14], [MX - 3, GY + MH + 17]], { w: 5 })];
  const mSmile = W.curve([[MX - 20, GY + MH + 30], [MX, GY + MH + 42], [MX + 20, GY + MH + 30]], { w: 6 });
  const mLash = [W.line(MX - 22, GY + MH - 6, MX - 30, GY + MH - 12, { w: 4 }), W.line(MX + 22, GY + MH - 6, MX + 30, GY + MH - 12, { w: 4 })];
  // body: cardigan (amber hatch) over a white top, teal skirt (navy light hatch), waving arm toward Youssef
  const cL = m([[-74, -425], [-20, -440], [-14, -250], [-66, -250]]), cR = m([[20, -440], [74, -425], [66, -250], [14, -250]]);
  const mTop = [W.poly(m([[-20, -440], [-74, -425], [-66, -250], [-14, -250], [-18, -420]]), { w: 6 }), W.poly(m([[20, -440], [74, -425], [66, -250], [14, -250], [18, -420]]), { w: 6 }),
    W.curve(m([[-20, -440], [0, -415], [20, -440]]), { w: 5 })];
  const skirt = m([[-66, -250], [66, -250], [92, -120], [-92, -120]]);
  const mSkirt = closed(skirt, { w: 6 });
  const mLegs = [W.line(MX - 30, GY - 120, MX - 28, GY - 28, { w: 6 }), W.line(MX - 6, GY - 120, MX - 8, GY - 28, { w: 6 }), W.line(MX + 6, GY - 120, MX + 8, GY - 28, { w: 6 }), W.line(MX + 30, GY - 120, MX + 28, GY - 28, { w: 6 })];
  const mShoes = [closed(m([[-34, -28], [-4, -28], [-2, -8], [-46, -8]]), { w: 5 }), closed(m([[4, -28], [34, -28], [46, -8], [2, -8]]), { w: 5 })];
  const mArmL = tube(m([[-70, -418], [-118, -470], [-140, -540]]), 30, 26);          // raised, waving
  const mArmR = tube(m([[70, -418], [92, -350], [100, -290]]), 30, 26);
  const mArms = [closed(mArmL, { w: 6 }), closed(mArmR, { w: 6 })];
  const HAND = [MX - 146, GY - 572];
  const mHands = [ell(HAND[0], HAND[1], 18, 20, -2, .2, { w: 5 }), W.line(HAND[0] - 12, HAND[1] - 16, HAND[0] - 18, HAND[1] - 34, { w: 5 }), W.line(HAND[0], HAND[1] - 20, HAND[0] - 2, HAND[1] - 40, { w: 5 }), W.line(HAND[0] + 12, HAND[1] - 16, HAND[0] + 16, HAND[1] - 34, { w: 5 }),
    ell(MX + 100, GY - 280, 15, 16, -2, .2, { w: 5 })];
  // clipboard under her right arm (teacher)
  const clip = [W.roundRect(MX + 84, GY - 380, 70, 110, 8, { w: 6 }), W.line(MX + 100, GY - 382, MX + 138, GY - 382, { w: 9 })];
  D(N1, [mHead, ...mFace, mSmile, ...mLash, ...mTop, ...mArms, ...mHands], 6.85, 7.55, { minGap: .015, maxGap: .04 });
  D(N2, [...mHair, mSkirt, ...mLegs, ...mShoes, ...clip], 7.22, 7.75, { minGap: .015, maxGap: .04 });
  D(A, [...mHairFill, W.hatch(cL, { spacing: 13, w: 11, alpha: .75, angle: -1 }), W.hatch(cR, { spacing: 13, w: 11, alpha: .75, angle: -1 }),
    W.hatch(mArmL, { spacing: 13, w: 10, alpha: .75, angle: .3 }), W.hatch(mArmR, { spacing: 13, w: 10, alpha: .75, angle: .3 })], 7.3, 7.95, { minGap: .015, maxGap: .035 });
  D(N1, [W.hatch(skirt, { spacing: 18, w: 9, alpha: .4, angle: .8 })], 7.6, 7.85, { minGap: .015, maxGap: .03 });

  // ═════════ DIALOGUE (bubbles drawn by the pen, words written on the spoken word)
  const MB = { x: 4880, y: 1300, w: 620, h: 210 };
  D(N2, bubble(MB.x, MB.y, MB.w, MB.h, MB.x + 200, MX - 30, GY + MH - 92), 7.85, 8.18);
  const hi = T('Hi!', MB.x + 50, MB.y + 140, { h: 76, w: 10 });
  const im = T("I'm", MB.x + 50 + hi.width + 40, MB.y + 140, { h: 76, w: 10 });
  const mia = T('Mia.', MB.x + 50 + hi.width + 40 + im.width + 36, MB.y + 140, { h: 76, w: 10 });
  D(N1, hi, 8.2, 8.6); D(N1, im, 8.66, 8.86); D(N1, mia, 8.9, 9.3);
  // wave marks around the raised hand
  D(N2, [W.arc(HAND[0], HAND[1], 54, -2.75, -1.95, { w: 6 }), W.arc(HAND[0], HAND[1], 80, -2.85, -1.85, { w: 6 })], 8.25, 8.55);

  // Youssef's bubble (top-left of him at his stop)
  const YB = { x: 3440, y: 1400, w: 730, h: 330 };
  const YHEAD = [X1 + 0, GY + HY - 80];
  D(N2, bubble(YB.x, YB.y, YB.w, YB.h, YB.x + YB.w - 120, YHEAD[0] - 75, YHEAD[1] + 30), 9.62, 10.0);
  const hello = T('Hello!', YB.x + 50, YB.y + 102, { h: 72, w: 10 });
  const r2y = YB.y + 290;
  const iA = T('I', YB.x + 50, r2y, { h: 72, w: 10 }), i1 = [...iA, ...T('...', YB.x + 50 + iA.width + 16, r2y, { h: 72, w: 10 })];
  i1.width = iA.width + 16 + 3 * 230 * 72 / 677;
  const i2 = T('I', YB.x + 50 + i1.width + 44, r2y, { h: 72, w: 10 });
  const GAPX = YB.x + 50 + i1.width + 44 + i2.width;   // the gap where "am" belongs
  const yous = T('Youssef.', GAPX + 96, r2y, { h: 72, w: 10 });
  D(N1, hello, 10.1, 10.54); D(N1, i1, 11.4, 11.74); D(N1, i2, 12.5, 12.68); D(N1, yous, 12.76, 13.34);
  // nervous sweat drop (drawn on the card)
  const drop = (x, y, s = 1) => W.poly([[x, y], [x - 9 * s, y + 18 * s], [x - 6 * s, y + 28 * s], [x + 2 * s, y + 31 * s], [x + 9 * s, y + 24 * s], [x + 9 * s, y + 14 * s], [x, y]], { w: 5 });
  D(N2, tagG([drop(64, HY - 70)], g), 11.45, 11.7);

  // "Sorry?" — the eraser clears Mia's bubble (a ghost of "I'm Mia" remains), a new one is drawn
  tl.erase(W.zigzag(MB.x - 20, MB.y - 10, MB.w + 40, MB.h + 30, 4), 13.68, .46, { width: 120 });
  tl.cue(13.68, 'eraser');
  const SB = { x: 4950, y: 1330, w: 440, h: 180 };
  D(N2, bubble(SB.x, SB.y, SB.w, SB.h, SB.x + 130, MX - 30, GY + MH - 92), 14.38, 14.66);
  D(N1, T('Sorry?', SB.x + 60, SB.y + 124, { h: 78, w: 10 }), 14.8, 15.36);
  D(N2, T('?', MX + 120, GY + MH - 70, { h: 110, w: 11 }), 14.68, 14.86);

  // embarrassed: eraser wipes his smile, pen redraws a wobbly mouth; red blush; sweat
  const mouthPath = [[-22, HY + 38], [22, HY + 38], [-18, HY + 44], [20, HY + 44]];
  tl.erase(mouthPath, 14.74, .18, { width: 18, grp: g });
  tl.cue(14.74, 'eraserSmall');
  D(N2, tagG(W.curve([[-18, HY + 40], [-10, HY + 35], [-2, HY + 41], [6, HY + 35], [14, HY + 41], [19, HY + 37]], { w: 5, smooth: 1 }), g), 14.94, 15.08);
  D(N2, tagG([W.line(-36, HY - 34, -12, HY - 26, { w: 7 }), W.line(12, HY - 26, 36, HY - 34, { w: 7 })], g), 15.1, 15.2);   // worried brows on top
  D(R, tagG([W.hatch(ellPoly(-34, HY + 14, 15, 9, 12), { spacing: 6, w: 6, alpha: .7, angle: 0 }), W.hatch(ellPoly(34, HY + 14, 15, 9, 12), { spacing: 6, w: 6, alpha: .7, angle: 0 })], g), 15.0, 15.22);
  D(N2, tagG([drop(-70, HY - 60, 1.1), drop(80, HY - 40, .9)], g), 15.24, 15.42);
  // the board corrects him: a red caret in the gap and "am" above, circled
  const CY = r2y + 6;
  D(R, W.poly([[GAPX + 26, CY + 4], [GAPX + 48, CY - 52], [GAPX + 70, CY + 4]], { w: 8, bow: 0 }), 15.68, 15.88);
  D(R, T('am', GAPX + 8, YB.y + 196, { h: 56, w: 9 }), 15.93, 16.2);
  D(R, ell(GAPX + 52, YB.y + 172, 64, 40, -2.6, .35, { w: 7 }), 16.23, 16.47);

  tl.end();

  // ───────── camera (world → screen through one function)
  const cam = new W.Camera([
    [0, 930, 2100, 1.02, 0, 'l'],
    [1.7, 935, 2095, 1.08, 0, 'o'],
    [4.35, 3050, 1640, .405, 0, 'io'],            // pull back: London around him
    [5.0, 3130, 1650, .41, 0, 'l'],
    [6.6, 4600, 1950, .6, 0, 'io'],               // ride the pavement to the school
    [7.7, 4760, 2010, .70, 0, 'o'],               // two-shot
    [9.85, 4756, 2010, .703, 0, 'l'],
    [13.4, 4745, 2006, .712, 0, 'io'],            // a breath closer while he struggles
    [14.3, 4760, 2010, .70, 0, 'io'],
    [15.2, 4761, 2010, .701, 0, 'l'],
    [15.68, 3880, 1722, 1.47, 0, 'io'],           // push into his face and the gap
    [17.0, 3884, 1726, 1.51, 0, 'l'],
  ]);

  // ───────── board + objects
  const board = new W.Board(tl, { ghosts, W: 7200, H: 3300 });
  const cardClip = ig => { ig.beginPath(); ig.roundRect(CARD.x + 6, CARD.y + 6, CARD.w - 12, CARD.h - 12, CARD.r - 4); };
  board.objs.push({
    draw: (ctx, t, c) => {                       // the magnet card: shadow, glossy white face, then its own ink
      const P = YG.pose(t);
      W.applyCam(ctx, c);
      ctx.save(); ctx.translate(P.x + 10 + P.up * .8, P.y + 16 + P.up * 1.1); ctx.rotate(P.rot); ctx.scale(P.sc, P.sc);
      ctx.filter = `blur(${(10 + P.lift * 24) * c.z}px)`; ctx.fillStyle = `rgba(40,42,55,${.3 - P.lift * .1})`;
      ctx.beginPath(); ctx.roundRect(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(P.x, P.y - P.up); ctx.rotate(P.rot); ctx.scale(P.sc, P.sc);
      ctx.fillStyle = '#c9cbcf'; ctx.beginPath(); ctx.roundRect(CARD.x, CARD.y + 4, CARD.w, CARD.h, CARD.r); ctx.fill();       // edge thickness
      const gr = ctx.createLinearGradient(CARD.x, CARD.y, CARD.x + CARD.w, CARD.y + CARD.h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.6, '#f7f7f4'); gr.addColorStop(1, '#ecebe6');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.fill();
      ctx.strokeStyle = 'rgba(120,125,135,.35)'; ctx.lineWidth = 2 / c.z; ctx.stroke();
      ctx.restore();
      board.renderGroup(ctx, t, c, YG, cardClip);
      // gloss highlight on the card (drifts with the camera, like the board sheen)
      W.applyCam(ctx, c); ctx.translate(P.x, P.y - P.up); ctx.rotate(P.rot); ctx.scale(P.sc, P.sc);
      ctx.beginPath(); ctx.roundRect(CARD.x, CARD.y, CARD.w, CARD.h, CARD.r); ctx.clip();
      const k = (c.x * .00025) % 1, hx = CARD.x - 300 + k * 900;
      const sh = ctx.createLinearGradient(hx, CARD.y, hx + 420, CARD.y + 600);
      sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.22)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
    }
  });
  // erasers: the board eraser and the small one on the card
  board.objs.push({
    draw: (ctx, t, c) => {
      for (const e of tl.erasers) {
        if (!e.grp) { W.drawEraser(ctx, e, t, c); continue; }
        if (t < e.t0 - .45 || t > e.t1 + .45) continue;
        const wp = { ...e, width: 26, path: { start: e.grp.toWorld(e.path.start, t), end: e.grp.toWorld(e.path.end, t), at: L => e.grp.toWorld(e.path.at(L), t), len: e.path.len } };
        W.drawEraser(ctx, wp, t, c);
      }
    }
  });
  board.objs.push({ draw: (ctx, t, c) => { for (const p of PENS) W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); } });

  // ───────── Arabic subtitles (narration), RTL, handwriting-like Ruqaa on an off-white label
  const subs = [
    { t0: .5, t1: 2.45, text: 'أول يوم ليّا في لندن…' },
    { t0: 2.45, t1: 5.55, text: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
    { t0: 5.55, t1: 7.95, text: 'لحد ما قابلت ميا.' },
  ];
  board.overlays.push({
    draw: (ctx, t) => {
      const s = subs.find(s => t >= s.t0 && t < s.t1); if (!s) return;
      const a = Math.min(1, (t - s.t0) / .12, (s.t1 - t) / .12);
      ctx.font = '700 62px Ruqaa'; ctx.direction = 'rtl';
      const w = ctx.measureText(s.text).width + 96, h = 96, y0 = 1046 - h;
      ctx.globalAlpha = a * .92; ctx.fillStyle = '#fdfcf8'; ctx.shadowColor = 'rgba(30,30,40,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
      ctx.beginPath(); ctx.roundRect(960 - w / 2, y0, w, h, 16); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.globalAlpha = a;
      ctx.fillStyle = RED; ctx.fillRect(960 + w / 2 - 62, y0 + h - 13, 38, 4);
      ctx.fillStyle = NAVY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(s.text, 960, y0 + h / 2 + 2);
    }
  });

  // ───────── frame render: camera motion blur on fast moves, a soft fade in the last 0.35 s
  const offc = new OffscreenCanvas(1920, 1080), oc = offc.getContext('2d');
  function render(ctx, t) {
    const dt = 1 / 24, a = cam.at(t), b = cam.at(Math.max(0, t - dt));
    const sp = Math.hypot((a.x - b.x) * a.z, (a.y - b.y) * a.z) + Math.abs(Math.log(a.z / b.z)) * 900;
    const N = sp > 14 ? Math.min(8, Math.ceil(sp * .5 / 5)) : 1;
    if (N === 1) board.render(ctx, t, cam);
    else {
      const ov = board.overlays; board.overlays = [];
      for (let i = 0; i < N; i++) { board.render(oc, t - dt * .5 * i / (N - 1), cam); ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(offc, 0, 0); }
      ctx.globalAlpha = 1; board.overlays = ov;
      for (const o of ov) { ctx.save(); o.draw(ctx, t); ctx.restore(); }
    }
    const f = clamp((t - 16.78) / .22);
    if (f > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = f * .6; ctx.fillStyle = '#f6f5f1'; ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1; }
  }
  const ev = tl.ev.slice();
  ev.push({ t: 0, type: 'magnet' });
  return { dur: DUR, render, ev, subs, cam, tl };
}
