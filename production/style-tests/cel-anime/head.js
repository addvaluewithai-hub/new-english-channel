// 80s-construction heads for Youssef and Mia (3/4 view, facing screen right; mirror with scale(-1,1)).
// Technique adapted from the style's head80.js: cranium sphere + egg jaw, almond eyes at mid-head, layered iris, coloured lines, hard cel shadows.
// Local coords: cranium centre (0,0), radius 80; eye line +22, nose base +54, mouth +75, chin +114.
import { cel, path, poly, ribbon, flutter, line, TAU, rgba, mix, LWK } from './cel.js';

const LW = 1.5, LS = LW * .78, LH = LW * 1.05;

// brow = [inner dy, outer dy, arch]; browF = far brow (defaults to brow)
export const EXPR = {
  neutral: { open: 1, lid: .05, brow: [0, 0, 2], mouth: 'closed' },
  smile: { open: .8, lid: .1, brow: [-3, -1, 3], mouth: 'smile' },
  smileopen: { open: .76, lid: .06, brow: [-5, -2, 3.5], mouth: 'smileopen', smileEyes: true },
  excited: { open: 1.06, lid: -.1, brow: [-7, -5, 4], mouth: 'smileopen', iris: .92 },
  nervous: { open: .92, lid: .12, brow: [-8, 3, 1], mouth: 'smile', look: [-.2, .1] },
  gulp: { open: 1.0, lid: 0, brow: [-9, 2, 1.5], mouth: 'wobble', iris: .8, sweat: .6 },
  talk: { open: 1, lid: .08, brow: [-2, 0, 2], mouth: 'talk' },
  puzzled: { open: .9, lid: .14, brow: [-9, -8, 5], browF: [6, 3, 0], mouth: 'oh', look: [.15, 0] },
  shock: { open: 1.12, lid: -.15, brow: [-10, -7, 4], mouth: 'grimace', iris: .5, blush: .55 },
};

// ——— eyes ———
function eye(g, P, C, cx, cy, w, h, dir, fs, E) {
  const open = Math.max(0, E.open ?? 1), lid = E.lid || 0, W2 = w / 2, lash = P.lash;
  const X = u => cx + dir * u * W2;
  const inY = cy + h * .1, outY = cy - h * .08 - (E.smileEyes ? h * .06 : 0);
  const topY = cy - h * .5 * open + lid * h * .32;
  const botY = cy + h * .47 * Math.min(1, open + .25) - (E.smileEyes ? h * .3 : 0);
  if (open > .08) {
    const WP = path([[X(-1), inY, 1], [X(-.4), topY + h * .05], [X(.3), topY], [X(1), outY, 1], [X(.45), botY], [X(-.4), botY - h * .02]], true);
    g.save(); g.clip(WP);
    g.fillStyle = P.white_eye; g.fill(WP);
    g.fillStyle = mix(P.white_eye, P.skin.s, .5); g.fillRect(cx - w, topY - 6, w * 2, h * .22 + 6);
    const sc = E.iris || 1, iw = w * .25 * sc * C.iris * (fs < 1 ? .92 : 1), ih = h * .46 * sc * (C.irisH || 1);
    const ix = cx + dir * W2 * .04 + (E.look?.[0] || 0) * w * .18, iy = cy + h * .08 + (E.look?.[1] || 0) * h * .14;
    const IR = new Path2D(); IR.ellipse(ix, iy, iw, ih, 0, 0, TAU);
    g.fillStyle = P.eye.f; g.fill(IR);
    g.save(); g.clip(IR);
    g.fillStyle = P.eye.s; g.fillRect(ix - iw, iy - ih, iw * 2, ih * .95);
    g.fillStyle = mix(P.eye.s, lash, .5); g.fillRect(ix - iw, iy - ih, iw * 2, ih * .38);
    g.fillStyle = mix(P.eye.l, lash, .3); g.beginPath(); g.ellipse(ix, iy - ih * .02, iw * .46, ih * .52, 0, 0, TAU); g.fill();
    g.fillStyle = P.eye.h; g.beginPath(); g.ellipse(ix, iy + ih * .9, iw * 1.05, ih * .52, 0, 0, TAU); g.fill();
    g.fillStyle = mix(P.eye.h, '#ffffff', .45); g.beginPath(); g.ellipse(ix, iy + ih * 1.05, iw * .7, ih * .32, 0, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = mix(P.eye.l, lash, .5); g.lineWidth = LW * .75 * LWK.k; g.stroke(IR);
    if (sc > .6) {
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(ix - dir * iw * .34, iy - ih * .34, iw * .42, ih * .27, -.5 * dir, 0, TAU); g.fill();
      g.beginPath(); g.arc(ix + dir * iw * .42, iy + ih * .34, iw * .2, 0, TAU); g.fill();
    }
    g.restore();
    line(g, [[X(.95), outY + h * .12], [X(.5), botY + 1], [X(.05), botY + 1.5]], mix(P.skin.l, P.skin.f, .35), LS * .8);
  }
  const t = h * C.lid;
  if (open > .08) {
    const fx = C.flick;
    cel(g, [[X(-1.03), inY + 1, 1], [X(-.4), topY + h * .05 - t * .6], [X(.3), topY - t * .75], [X(.95), outY - t], [X(1 + .25 * fx), outY - t * (1 + 1.1 * fx), 1],
      [X(1.03), outY + t * .5], [X(.3), topY + t * .45], [X(-.4), topY + h * .05 + t * .35], [X(-.98), inY + t * .6, 1]], { f: lash });
    for (let k = 0; k < C.lashes; k++) {
      const u = .55 + k * .2, bx = X(u), by = topY + (outY - topY) * ((u - .3) / .7) - t * .5;
      cel(g, [[bx - dir * 2, by, 1], [bx + dir * (4 + k * 3), by - h * (.16 + k * .05), 1], [bx + dir * 3, by + 1, 1]], { f: lash });
    }
    line(g, [[X(-.25), topY - h * .22], [X(.45), topY - h * .25], [X(1), outY - h * .3]], mix(P.skin.l, P.skin.f, .3), LS * .85);
  } else {
    cel(g, [[X(-1), inY, 1], [X(0), cy + h * .22], [X(1.05), outY + h * .04], [X(1.22), outY - t, 1], [X(1), outY + t * .8], [X(0), cy + h * .22 + t * .8], [X(-.98), inY + t * .5, 1]], { f: lash });
  }
}
function brow(g, col, ix, iy, ox, oy, B, th) {
  const a = [ix, iy + B[0]], c = [ox, oy + B[1]], m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - B[2]];
  cel(g, [[a[0], a[1] - th, 1], [m[0], m[1] - th * 1.1], [c[0], c[1] - .2, 1], [m[0], m[1] + th * .85], [a[0], a[1] + th, 1]], { f: col });
}

// ——— mouth ———
function mouth(g, P, cx, cy, w, type, fs = 1) {
  const L = cx - w / 2, R = cx + w / 2 * fs, lc = P.skin.l;
  const lowerLip = (y, ww) => line(g, [[cx - ww * .6, y], [cx + ww * .5, y]], mix(lc, P.skin.f, .5), LS * .75);
  if (type === 'closed' || type === 'set') {
    line(g, [[L, cy], [cx - w * .12, cy - .6], [cx + w * .06, cy + .2], [R, cy]], lc, LS * 1.05); lowerLip(cy + 5.5, w * .2);
  } else if (type === 'smile') {
    line(g, [[L - 1, cy - 3], [cx - w * .15, cy + 1.6], [cx + w * .1, cy + 1.6], [R + 1, cy - 3]], lc, LS * 1.05); lowerLip(cy + 6.5, w * .16);
  } else if (type === 'wobble') {
    line(g, [[L, cy + 1], [cx - w * .25, cy - 1.5], [cx, cy + 1.5], [cx + w * .2, cy - 1.5], [R, cy + 1]], lc, LS * 1.05); lowerLip(cy + 6, w * .16);
  } else if (type === 'grimace') {   // clenched toothy grin, wavy lower edge
    const MP = path([[L - 4, cy - 4, 1], [cx, cy - 5], [R + 3, cy - 5, 1], [R, cy + 3], [cx + w * .2, cy + 6], [cx, cy + 4], [cx - w * .25, cy + 7], [L - 2, cy + 3]], true);
    g.save(); g.clip(MP); g.fillStyle = '#ffffff'; g.fill(MP);
    g.strokeStyle = mix(lc, '#ffffff', .5); g.lineWidth = .9 * LWK.k; g.beginPath(); g.moveTo(L - 4, cy + .5); g.lineTo(R + 4, cy); g.stroke();
    for (let k = 1; k < 5; k++) { const x = L + (R - L) * k / 5; g.beginPath(); g.moveTo(x, cy - 6); g.lineTo(x, cy + 8); g.stroke(); }
    g.restore(); g.strokeStyle = lc; g.lineWidth = LS * 1.05 * LWK.k; g.lineJoin = 'round'; g.stroke(MP);
  } else {
    let pts, teeth = 0, tongue = 0, bot;
    if (type === 'smileopen') { pts = [[L - 1, cy - 3, 1], [cx, cy - 2], [R + 1, cy - 3, 1], [cx + w * .2, cy + 7], [cx, cy + 11], [cx - w * .22, cy + 7]]; teeth = 1; tongue = 1; bot = cy + 11; }
    else if (type === 'wide') { pts = [[L - 1, cy - 1, 1], [cx, cy - 3], [R + 1, cy - 1, 1], [cx + w * .22, cy + 13], [cx, cy + 16], [cx - w * .24, cy + 13]]; teeth = 1; tongue = 1; bot = cy + 16; }
    else if (type === 'oh') { pts = [[cx - w * .2, cy + 2], [cx, cy - 3], [cx + w * .18, cy + 2], [cx + w * .13, cy + 11], [cx - w * .13, cy + 11]]; bot = cy + 11; }
    else { pts = [[L + 3, cy, 1], [cx, cy - 1], [R - 3, cy, 1], [cx + w * .08, cy + 7], [cx - w * .1, cy + 7]]; tongue = .8; bot = cy + 7; }
    const MP = path(pts, true);
    g.save(); g.clip(MP); g.fillStyle = '#5a1a2a'; g.fill(MP);
    if (tongue) { g.fillStyle = '#e0707a'; g.beginPath(); g.ellipse(cx, bot + 1, w * .28, 6, 0, 0, TAU); g.fill(); }
    if (teeth) { g.fillStyle = '#ffffff'; g.fillRect(cx - w, cy - 8, w * 2, 10.5); }
    g.restore();
    g.strokeStyle = lc; g.lineWidth = LS * 1.05 * LWK.k; g.lineJoin = 'round'; g.stroke(MP);
    lowerLip(bot + 4.5, w * .14);
  }
}

function lock(x0, y0, x1, y1, tx, ty, bend = 0) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = tx - mx, dy = ty - my, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return [[x0, y0], [x0 + dx * .55 + nx * bend, y0 + dy * .55 + ny * bend], [tx, ty, 1], [x1 + dx * .5 + nx * bend * .7, y1 + dy * .5 + ny * bend * .7], [x1, y1]];
}
function halo(g, P, cx, cy, rx, ry, a0, a1, th, teeth) {
  const up = [], dn = [];
  for (let i = 0; i <= teeth * 2; i++) {
    const u = i / (teeth * 2), a = a0 + (a1 - a0) * u, env = Math.sin(u * Math.PI) * .7 + .3;
    up.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    const depth = th * env * (i % 2 ? 1.9 : .55);
    dn.push([cx + Math.cos(a) * (rx - depth * .15), cy + Math.sin(a) * ry + depth]);
  }
  g.fillStyle = mix(P.hair.h, '#ffffff', .25);
  g.beginPath(); up.forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](p[0], p[1])); for (let i = dn.length - 1; i >= 0; i--) g.lineTo(dn[i][0], dn[i][1]); g.closePath(); g.fill();
}

// ——— per-character construction ———
const FACE_M = [[-64, -44], [-67, -4], [-66, 30], [-60, 60], [-46, 86], [-24, 104], [4, 114], [24, 108], [38, 94], [46, 78], [48, 64], [53, 46], [55, 30], [50, 16], [53, 0], [54, -40], [18, -64], [-36, -64]];
const FACE_Y = [[-66, -44], [-69, -4], [-68, 30], [-63, 62], [-50, 90], [-26, 108], [6, 118], [28, 112], [42, 98], [49, 80], [50, 66], [54, 47], [57, 30], [52, 16], [55, 0], [55, -40], [18, -64], [-36, -64]];
export const CHAR = {
  y: {
    face: FACE_Y, iris: .9, irisH: .9, lid: .17, flick: .35, lashes: 0, browTh: 2.6,
    eyes: [{ x: -21, y: 22, w: 44, h: 29 }, { x: 35, y: 20, w: 26, h: 27, fs: .6 }],
    brows: [[2, -6, -44, -4], [25, -8, 50, -3]],
    neck: [[-40, 64], [14, 92], [20, 146], [-46, 146]],
    chinShadow: [[-50, 64], [24, 64], [24, 100], [6, 119], [-26, 108], [-50, 90]],
    farShade: [[90, 30], [90, 124], [20, 116], [38, 100], [44, 84], [47, 68], [49, 54], [53, 42], [57, 30]],
    ear: [-58, 30],
    cap: [[-72, 50, 1], [-84, 10], [-88, -40], [-70, -86], [-26, -104], [24, -102], [60, -84], [72, -52], [66, -26, 1], [52, -36], [30, -42], [4, -46], [-22, -40], [-36, -26], [-42, 0], [-42, 34, 1], [-50, 36, 1], [-50, 8], [-58, 2], [-68, 10, 1], [-66, 44, 1]],
    locks: [[-48, -98, -10, -104, 26, -40, 5], [-16, -104, 22, -102, 52, -34, 5], [14, -98, 50, -86, 74, -30, 4], [-74, -80, -36, -98, -4, -38, 4], [-90, -46, -64, -84, -30, -30, 3]],
    backLocks: [[-84, -40, -86, -10, -94, 14, -3], [-86, -10, -80, 20, -84, 46, -2]],
    halo: [-6, -14, 70, 60, Math.PI * 1.12, Math.PI * 1.85, 7, 8],
    mouth: { x: 24, y: 77, w: 24, fs: .7 },
    nose: P => g => { g.fillStyle = P.skin.s; g.beginPath(); g.moveTo(42, 40); g.lineTo(47, 52); g.lineTo(39, 56); g.lineTo(39, 49); g.closePath(); g.fill(); line(g, [[37, 56.5], [46, 53]], P.skin.l, LS); },
    blush: [[-30, 50, 15, 5], [50, 46, 4, 3]],
  },
  m: {
    face: FACE_M, iris: 1, lid: .19, flick: 1, lashes: 3, browTh: 1.4,
    eyes: [{ x: -21, y: 22, w: 44, h: 38 }, { x: 35, y: 20, w: 26, h: 35, fs: .6 }],
    brows: [[0, -4, -42, -2], [24, -6, 48, -1]],
    neck: [[-36, 66], [12, 90], [16, 140], [-40, 140]],
    chinShadow: [[-46, 64], [20, 64], [20, 96], [4, 115], [-24, 104], [-46, 86]],
    farShade: [[90, 30], [90, 120], [18, 112], [34, 98], [41, 82], [44, 68], [47, 54], [51, 42], [55, 30]],
    back: [[-78, -30], [-92, 20], [-86, 70], [-56, 88], [-18, 80], [36, 62], [56, 20], [56, -20], [-10, -60]],
    cap: [[-88, 4], [-94, -44], [-70, -88], [-24, -104], [24, -100], [58, -78], [66, -46], [60, -8], [46, -30], [0, -54], [-58, -34]],
    locks: [[-56, -86, -24, -94, -40, -8, 0], [0, -96, 28, -90, 18, -10, 0], [-96, -50, -60, -72, -84, 10, -6], [-76, -76, -34, -88, -58, -4, -4], [-50, -88, -6, -94, -28, -14, 2], [-20, -94, 18, -94, 8, 12, 2], [4, -94, 42, -86, 26, -12, 4], [26, -86, 62, -70, 46, -2, 5], [46, -72, 70, -52, 60, 4, 5]],
    strays: [[-20, -92, -34, 4, 5], [20, -92, 30, -2, -4]],
    side: [[-78, -44, -58, -58, -76, 96, -10], [56, -40, 62, -30, 58, 66, 8]],
    halo: [-12, -10, 72, 58, Math.PI * 1.12, Math.PI * 1.85, 8, 8],
    mouth: { x: 24, y: 75, w: 22, fs: .7 },
    nose: P => g => { g.fillStyle = P.skin.s; g.beginPath(); g.moveTo(42, 42); g.lineTo(45, 51); g.lineTo(39, 55); g.lineTo(39, 49); g.closePath(); g.fill(); line(g, [[38, 55.5], [44, 53]], P.skin.l, LS); },
    blush: [[-30, 48, 14, 4.5], [44, 46, 6, 3.5]],
  },
};

// o: { who:'y'|'m', expr, E (overrides), ph (hair cycle 0..1), sway, sweat (0..1 slide), blush, neck:false, light:[lx,ly] }
export function head(g, P, o = {}) {
  const C = CHAR[o.who || 'y'], who = o.who || 'y';
  const E = { ...EXPR[o.expr || 'neutral'], ...(o.E || {}) };
  if (o.mouth) E.mouth = o.mouth;
  if (o.open != null) E.open = o.open;
  if (o.look) E.look = o.look;
  const ph = o.ph || 0, lx = o.light?.[0] ?? -1, ly = o.light?.[1] ?? -.8;
  const SO = k => [lx * k, ly * k];
  const hairSt = { f: P.hair.f, s: P.hair.s, h: P.hair.h, l: P.hair.l, lw: LH };
  // 1 ponytail + back hair (Mia)
  if (who === 'm') {
    const px = -60, py = -74, sway = o.sway || 0;
    for (let k = 0; k < 4; k++) {
      const ang = Math.PI / 2 + .42 - k * .09 + sway * .25;
      const sp = flutter(px + (k - 1.5) * 6, py + k * 5, ang, 200 - k * 26, 14, 5 + k * 2, .8, ph * TAU + k * 1.9, -(18 + k * 8));
      cel(g, ribbon(sp, u => Math.pow(1 - u, .9) * (48 - k * 7) + 1), { ...hairSt, f: k === 1 || k === 2 ? P.hair.s : P.hair.f, so: SO(8) });
    }
    cel(g, C.back, { ...hairSt, f: P.hair.s, so: SO(10), s: mix(P.hair.s, '#000000', .25) });
  }
  // 2 neck
  if (o.neck !== false) neck(g, P, who);
  // 3 face (+ cast shadow of the fringe)
  const FP = cel(g, C.face, { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, h: P.skin.h, sh: [C.farShade],
    clipFn: gg => {
      gg.fillStyle = mix(P.skin.f, P.skin.s, .7);
      for (const L of C.locks) { const [x0, y0, x1, y1, tx, ty, b] = L; gg.fill(path(lock(x0 - 4, y0 + 8, x1 + 6, y1 + 8, tx + 3, ty + 9, b))); }
      if (who === 'm') gg.fillRect(-120, -120, 240, 62);
    } });
  // ear (Youssef; after the face, at its back edge)
  if (C.ear) {
    const [ex, ey] = C.ear; const EP = path([[ex + 6, ey - 16], [ex - 6, ey - 20], [ex - 14, ey - 6], [ex - 12, ey + 12], [ex - 2, ey + 22], [ex + 6, ey + 14]]);
    cel(g, EP, { f: P.skin.f, s: P.skin.s, sh: [[[ex - 2, ey - 12], [ex - 8, ey - 2], [ex - 4, ey + 12], [ex + 2, ey + 6]]], l: P.skin.l, lw: LS });
  }
  // beard (Youssef): short, trimmed; clipped to the face
  if (who === 'y') {
    g.save(); g.clip(FP);
    const BD = [[-80, 4, 1], [-54, 4, 1], [-52, 46], [-40, 80], [-14, 96], [6, 98], [14, 92], [30, 92], [42, 86], [50, 78, 1], [80, 78, 1], [80, 140], [-80, 140]];
    cel(g, BD, { f: P.beard.f, s: P.beard.s, sh: [[[-80, 84], [-10, 112], [0, 140], [-80, 140]]], h: P.beard.h, hi: [[[18, 104], [36, 98], [40, 101], [20, 108]]], l: P.beard.l, lw: LS * .6 });
    g.restore();
  }
  const bl = o.blush ?? E.blush ?? .18;
  for (const [x, y, rx, ry] of C.blush) { g.fillStyle = rgba(P.blush, bl); g.beginPath(); g.ellipse(x, y, rx * (1 + bl), ry * (1 + bl * .6), 0, 0, TAU); g.fill(); }
  C.nose(P)(g);
  mouth(g, P, C.mouth.x, C.mouth.y, C.mouth.w, E.mouth, C.mouth.fs);
  if (who === 'y') cel(g, [[12, 70], [24, 65], [40, 66], [48, 71], [40, 72], [26, 70], [16, 73]], { f: P.beard.f, l: P.beard.l, lw: LS * .6 });   // moustache
  C.eyes.forEach((ey, i) => eye(g, P, C, ey.x, ey.y, ey.w, ey.h, i ? 1 : -1, ey.fs || 1, E));
  // 5 hair
  cel(g, C.cap, { ...hairSt, so: SO(10) });
  if (who === 'm') {
    cel(g, [[-74, -84], [-52, -90], [-46, -66], [-68, -60]], { f: P.tie.f, s: P.tie.s, so: SO(3), l: P.tie.l, lw: LS });
    for (const L of C.side) { const [x0, y0, x1, y1, tx, ty, b] = L; const sw = Math.sin(ph * TAU) * 2; cel(g, lock(x0, y0, x1, y1, tx + sw, ty, b), { ...hairSt, so: SO(7) }); }
  }
  g.save(); g.fillStyle = P.hair.s; const wd = who === 'y' ? 5 : 10; for (const L of C.locks) { const [x0, y0, x1, y1, tx, ty, b] = L; g.fill(path(lock(x0 - wd, y0, x1 + wd, y1, tx, ty + 3, b))); } g.restore();
  const lockSt = { ...hairSt, l: mix(P.hair.l, P.hair.s, .45), lw: LH * .6 };
  for (const L of C.locks) { const [x0, y0, x1, y1, tx, ty, b] = L; cel(g, lock(x0, y0, x1, y1, tx, ty, b), { ...lockSt, so: SO(6) }); }
  if (C.strays) for (const [x0, y0, tx, ty, b] of C.strays) cel(g, lock(x0 - 2, y0, x0 + 2, y0, tx, ty, b), { f: P.hair.f, l: mix(P.hair.l, P.hair.s, .3), lw: LH * .6 });
  const hz = C.halo;
  g.save(); const HC = new Path2D(); HC.addPath(path(C.cap)); for (const L of C.locks) { const [x0, y0, x1, y1, tx, ty, b] = L; HC.addPath(path(lock(x0, y0, x1, y1, tx, ty, b))); }
  g.clip(HC); halo(g, P, hz[0], hz[1], hz[2], hz[3], hz[4], hz[5], hz[6], hz[7]); g.restore();
  // brows over the fringe (see-through fringe convention)
  const bc = P.lash;
  C.brows.forEach((b, i) => brow(g, who === 'y' ? P.hair.f : bc, b[0], b[1], b[2], b[3], i && E.browF ? E.browF : (E.brow || [0, 0, 2]), C.browTh));
  // sweat drop: o.sweat = 0..1 slide down the temple; size from E.sweat or o.sweatSize
  const sw = o.sweat ?? (E.sweat ? .3 : null);
  if (sw != null) {
    const s = o.sweatSize || 1, sx = -70, sy = -50 + sw * 40;
    g.save(); g.translate(sx, sy); g.scale(s, s);
    cel(g, [[0, -26, 1], [11, 0], [9, 12], [0, 17], [-9, 12], [-11, 0]], { f: '#dff4ff', l: '#3e6496', lw: LS * 1.2 / s, h: '#ffffff', hi: [[[-6, 2], [-3, -10], [-2, 6]]], s: '#a8d4f4', sh: [[[2, 4], [10, 2], [6, 14], [0, 16]]] });
    g.restore();
  }
}

export function neck(g, P, who) { const C = CHAR[who]; cel(g, poly(C.neck), { f: P.skin.f, s: P.skin.s, l: P.skin.l, lw: LS, sh: [C.chinShadow] }); }
