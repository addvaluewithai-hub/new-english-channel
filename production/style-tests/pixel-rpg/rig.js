// rig.js — sprite rig (technique adapted from the library's pixel-rpg engine): capsule limbs, 3-tone shading from the
// upper left, inner line where parts overlap, global 1-px ink outline, hand-placed ASCII heads. Characters: Youssef, Mia.
import { C, T, sprFromRows } from './px.js';

export const MAT = {
  skinY: [C.umber, C.dbrown, C.brown, C.skinS],          // Youssef: brown skin
  hairK: [C.ink, C.ink, C.night, C.dslate],              // black hair / beard
  jacket: [C.ink, C.night, C.denD, C.navy],              // navy jacket
  tee: [C.steel, C.silver, C.white, C.white],            // white T-shirt
  jeans: [C.ink, C.denD, C.den, C.denL],                 // blue jeans
  shoeB: [C.umber, C.umber, C.dbrown, C.brown],          // brown shoes
  skinM: [C.brown, C.skinS, C.skin, C.sand],             // Mia: fair skin
  hairM: [C.umber, C.rust, C.clay, C.tan],               // auburn / ginger
  cardi: [C.dbrown, C.musD, C.mus, C.musL],              // mustard cardigan
  skirt: [C.ink, C.tlD, C.tl, C.tlL],                    // teal skirt
  shoeM: [C.ink, C.umber, C.umber, C.dbrown],
  blouse: [C.steel, C.silver, C.cream, C.white],
};
const L = [-.55, -.83];
const SW = 48, SH = 52, OX = 24, OY = 48;
class Buf {
  constructor() { this.m = new Int16Array(SW * SH).fill(-1); this.part = new Int16Array(SW * SH).fill(-1); this.np = 0; }
  stamp(pix, name, line = true) {
    const id = this.np++, set = new Set(pix.map(p => p.i));
    for (const p of pix) {
      const x = p.i % SW, y = (p.i / SW) | 0;
      let edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= SW || Y >= SH) continue;
        const j = Y * SW + X; if (!set.has(j) && this.part[j] >= 0 && this.part[j] !== id) edge = true;
      }
      this.m[p.i] = edge && line ? MAT[name][0] : MAT[name][p.tone];
      this.part[p.i] = id;
    }
  }
  raw(x, y, c) { x = Math.round(x) + OX; y = Math.round(y) + OY; if (x < 0 || y < 0 || x >= SW || y >= SH) return; this.m[y * SW + x] = c; this.part[y * SW + x] = 999; }
  sprite(spr, x0, y0) {
    for (let y = 0; y < spr.h; y++) for (let x = 0; x < spr.w; x++) {
      const c = spr.d[y * spr.w + x]; if (c === T) continue;
      const X = x0 + x + OX, Y = y0 + y + OY; if (X < 0 || Y < 0 || X >= SW || Y >= SH) continue;
      this.m[Y * SW + X] = c; this.part[Y * SW + X] = 998;
    }
  }
  finish() {
    const d = new Uint8Array(SW * SH).fill(T);
    for (let i = 0; i < d.length; i++) if (this.m[i] >= 0) d[i] = this.m[i];
    const o = d.slice();
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = y * SW + x; if (d[i] !== T) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < SW && Y < SH && d[Y * SW + X] !== T) { o[i] = C.ink; break; } }
    }
    return { w: SW, h: SH, d: o, ox: OX, oy: OY };
  }
}
const toneOf = (nx, ny, r = [.38, -.28]) => { const v = nx * L[0] + ny * L[1]; return v > r[0] ? 3 : v < r[1] ? 1 : 2; };
function capsule(x0, y0, x1, y1, r0, r1 = r0, bias = 0) {
  const pix = [], dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1e-6, ux = dx / len, uy = dy / len, px_ = -uy, py_ = ux, R = Math.max(r0, r1) + 1;
  for (let y = Math.floor(Math.min(y0, y1) - R); y <= Math.ceil(Math.max(y0, y1) + R); y++) for (let x = Math.floor(Math.min(x0, x1) - R); x <= Math.ceil(Math.max(x0, x1) + R); x++) {
    const t = Math.max(0, Math.min(1, ((x - x0) * ux + (y - y0) * uy) / len)), qx = x0 + ux * len * t, qy = y0 + uy * len * t;
    const r = r0 + (r1 - r0) * t, d = Math.hypot(x - qx, y - qy); if (d > r + .15) continue;
    const s = ((x - qx) * px_ + (y - qy) * py_) / Math.max(.6, r);
    const X = x + OX, Y = y + OY; if (X < 0 || Y < 0 || X >= SW || Y >= SH) continue;
    pix.push({ i: Y * SW + X, tone: toneOf(px_ * s + bias * L[0], py_ * s + bias * L[1]) });
  }
  return pix;
}
function poly(pts, cx, cy, rx, ry, ramp) {
  const pix = []; let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + (y - ay) / (by - ay) * (bx - ax)); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) {
      const X = x + OX, Y = y + OY; if (X < 0 || Y < 0 || X >= SW || Y >= SH) continue;
      pix.push({ i: Y * SW + X, tone: toneOf((x + .5 - cx) / rx, (y + .5 - cy) / ry, ramp) });
    }
  }
  return pix;
}
function disc(cx, cy, r) { const pix = []; for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy > r * r + .3) continue; const X = x + OX, Y = y + OY; if (X < 0 || Y < 0 || X >= SW || Y >= SH) continue; pix.push({ i: Y * SW + X, tone: toneOf(dx / (r || 1), dy / (r || 1)) }); } return pix; }
const rot = (a, x, y) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
function limb(root, a1, l1, a2, l2) {
  const k = [root[0] + Math.sin(a1) * l1, root[1] + Math.cos(a1) * l1];
  return [k, [k[0] + Math.sin(a1 - a2) * l2, k[1] + Math.cos(a1 - a2) * l2]];
}
// two-bone arm from shoulder to a hand target (elbow bends to side `bend`)
function arm2(sh, hand, l1, l2, bend) {
  const dx = hand[0] - sh[0], dy = hand[1] - sh[1], d = Math.min(Math.hypot(dx, dy), l1 + l2 - .01);
  const a = Math.atan2(dy, dx), c = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const e = [sh[0] + Math.cos(a + bend * c) * l1, sh[1] + Math.sin(a + bend * c) * l1];
  return [e, [sh[0] + Math.cos(a) * d, sh[1] + Math.sin(a) * d]];
}

// —— ASCII heads 14×14: j hair dark, h hair mid, H hair light, f skin, F skin shade, e eye, w eye white, b brow,
//    m mouth, d beard, o open mouth, B blush, n nose shade ——
const HY = {
  side: [
    '..............',
    '....jjjjjj....',
    '..jjhhHHhhj...',
    '.jhhHHHhhhhjj.',
    '.jhhhhhhhhhhhj',
    '.jhhhhhhhhhjhj',
    '.jhhhhhhjffff.',
    '.jhhhhhffbbbf.',
    '.jhhhFFfffeff.',
    '..jhFFffffffff',
    '..jdFFfffffnf.',
    '...ddFffdmmd..',
    '....dddddddd..',
    '.....FFdddd...',
  ],
  up: [
    '....jjjjjj....',
    '..jjhhHHhhj...',
    '.jhhHHHhhhhjj.',
    '.jhhhhhhhhhhhj',
    '.jhhhhhhhhhjhj',
    '.jhhhhhhjffff.',
    '.jhhhhhffbbbf.',
    '.jhhhFFfffwef.',
    '..jhFFffffffff',
    '..jdFFfffffnff',
    '...dFffffdmmd.',
    '...dddddddddd.',
    '....FFdddddd..',
    '.....FFF......',
  ],
  back: [
    '..............',
    '....jjjjjj....',
    '..jjhhHHhhjj..',
    '.jhhHHHHhhhhj.',
    '.jhhhhhhhhhhj.',
    '.jhhhhhhhhhhj.',
    '.jhhhhhhhhhhj.',
    '.jhhhhhhhhhhj.',
    'FjhhhhhhhhhhjF',
    'FFjhhhhhhhhjFF',
    '.FjjhhhhhhjjF.',
    '..FFjjjjjjFF..',
    '...FFFFFFFF...',
    '....FFFFFF....',
  ],
  front: [
    '..............',
    '....jjjjjj....',
    '..jjhhHHhhjj..',
    '.jhHHHhhhhhhj.',
    '.jhhhhhhhhhhj.',
    '.jhhfhhhhfhhj.',
    '.jffffffffffj.',
    'FfbbbffffbbbfF',
    'FfwefffffewfFF',
    'FFffffnfffffF.',
    '.dFfffnfffffd.',
    '.ddFdmmmmdfdd.',
    '..ddddddddddd.',
    '....dddddd....',
  ],
};
// embarrassed front: eyes squeezed (^ ^), blush, wavy mouth
HY.frontEmb = HY.front.slice();
HY.frontEmb[7] = 'FfbbffffffbbfF';
HY.frontEmb[8] = 'FfjfjffffjfjFF';
HY.frontEmb[9] = 'FFBBffnfffBBF.';
HY.frontEmb[11] = '.ddFdmfmfdfdd.';
const HM = {
  front: [
    '...jjjjjjj....',
    '..jhhHHHhhjj..',
    '.jhHHHHhhhhhj.',
    '.jhHhhhhhhhhhj',
    'jhhhhhhhhhjhhj',
    'jhhfhhhhhjffhj',
    'jhffffffffffhj',
    'jhfbbffffbbfhj',
    'jFfwefffffewFj',
    '.FfeefffffeeF.',
    '.FFffffnffffF.',
    '..FFffmmmfFF..',
    '...FFFffffF...',
    '.....FFFF.....',
  ],
};
HM.frontTalk = HM.front.slice(); HM.frontTalk[11] = '..FFffoooFFF..'; HM.frontTalk[12] = '...FFFfooF....';
HM.frontBlink = HM.front.slice(); HM.frontBlink[8] = 'jFfffffffffFFj'; HM.frontBlink[9] = '.FfjjfffffjjF.';
// puzzled: one brow raised, small "o" mouth pulled to one side
HM.frontPuz = HM.front.slice(); HM.frontPuz[6] = 'jhffffffbbffhj'; HM.frontPuz[7] = 'jhfffffffffbhj'; HM.frontPuz[7] = 'jhbbbfffffffhj'; HM.frontPuz[11] = '..FFfffoffFF..';
HM.frontPuzTalk = HM.frontPuz.slice(); HM.frontPuzTalk[11] = '..FFffooofFF..';

const headMap = (hair, skin) => ({ h: MAT[hair][2], H: MAT[hair][3], j: MAT[hair][1], f: MAT[skin][2], F: MAT[skin][1], e: C.ink, w: C.white, b: MAT[hair][1], m: MAT[skin][0], d: C.night, o: C.crimson, B: C.rose, n: MAT[skin][1] });
const hcache = new Map();
function headY(k) { if (!hcache.has('y' + k)) hcache.set('y' + k, sprFromRows(HY[k], headMap('hairK', 'skinY'))); return hcache.get('y' + k); }
function headM(k) { if (!hcache.has('m' + k)) hcache.set('m' + k, sprFromRows(HM[k], { ...headMap('hairM', 'skinM'), m: C.crimson })); return hcache.get('m' + k); }

// —— Youssef, side view (faces right), pulling the suitcase with the back hand ——
// pose: { by, legF, legB, armF, look:'side'|'up', rise }
export const YPOSE = {
  walk0: { by: 0, legF: [.5, .12], legB: [-.42, .3], armF: [-.45, -.4] },
  walk1: { by: -1, legF: [.05, .05], legB: [.3, 1.0], armF: [0, -.35] },
  walk2: { by: 0, legF: [-.42, .3], legB: [.5, .12], armF: [.45, -.5] },
  walk3: { by: -1, legF: [.3, 1.0], legB: [.05, .05], armF: [0, -.35] },
  idle: { by: 0, legF: [.12, 0], legB: [-.1, 0], armF: [-.05, -.25] },
  lookup: { by: 0, lean: -.08, legF: [.12, 0], legB: [-.1, 0], armF: [.1, -.4], look: 'up' },
  hop: { by: -3, legF: [.35, .6], legB: [-.2, .7], armF: [.9, -.9], look: 'up' },
};
export function youssefSide(pn, rise = 0) {
  const P = YPOSE[pn], b = new Buf();
  const by = P.by || 0, lean = P.lean || 0;
  const hip = [0, -13 + by];
  const [shx, shy] = rot(lean, 0, -8 - rise); const sh = [hip[0] + shx, hip[1] + shy];
  // back arm reaches back-down to the case handle (held at hip height, behind)
  const hand = [hip[0] - 7, hip[1] + 1];
  const [eB] = arm2([sh[0] - .5, sh[1] + .5], hand, 4.6, 4.6, -1);
  b.stamp(capsule(sh[0] - .5, sh[1] + .5, eB[0], eB[1], 1.3, 1.2, -.7), 'jacket');
  b.stamp(capsule(eB[0], eB[1], hand[0], hand[1], 1.1, 1.1, -.7), 'jacket');
  b.stamp(disc(hand[0], hand[1], 1.1), 'skinY');
  // back leg
  const [kB, aB] = limb(hip, P.legB[0], 6.5, P.legB[1], 6);
  b.stamp(capsule(hip[0] - .5, hip[1], kB[0], kB[1], 1.8, 1.5, -.6), 'jeans');
  b.stamp(capsule(kB[0], kB[1], aB[0], aB[1], 1.5, 1.4, -.6), 'jeans');
  b.stamp(capsule(aB[0] - .5, aB[1], aB[0] + 2.4, aB[1], 1.2, 1.1, -.6), 'shoeB');
  // torso: jacket with the white tee showing at the open front
  const [hx1, hy1] = rot(lean, 3.6, -8.5), [hx0, hy0] = rot(lean, -3.6, -8.5);
  b.stamp(poly([[hip[0] + hx0, hip[1] + hy0 - rise], [hip[0] + hx1, hip[1] + hy1 - rise], [hip[0] + 4, hip[1] + 2], [hip[0] - 4.2, hip[1] + 2]], hip[0] - .5, hip[1] - 4, 4.2, 6.5), 'jacket');
  b.stamp(poly([[hip[0] + hx1 - 1.6, hip[1] + hy1 - rise], [hip[0] + hx1 + .2, hip[1] + hy1 - rise], [hip[0] + 4, hip[1] - 1], [hip[0] + 2.6, hip[1] - 1]], hip[0] + 3.5, hip[1] - 6, 3, 6), 'tee', false);
  // front leg
  const [kF, aF] = limb(hip, P.legF[0], 6.5, P.legF[1], 6);
  b.stamp(capsule(hip[0] + .5, hip[1], kF[0], kF[1], 1.8, 1.5), 'jeans');
  b.stamp(capsule(kF[0], kF[1], aF[0], aF[1], 1.5, 1.4), 'jeans');
  b.stamp(capsule(aF[0] - .5, aF[1], aF[0] + 2.6, aF[1], 1.2, 1.1), 'shoeB');
  // head
  const neck = [sh[0] + .5, sh[1] - 1.5];
  b.sprite(headY(P.look || 'side'), Math.round(neck[0] - 7), Math.round(neck[1] - 12));
  // front arm (swings)
  const [eF, hF] = limb(sh, P.armF[0], 4.6, P.armF[1], 4.6);
  b.stamp(capsule(sh[0], sh[1] + .5, eF[0], eF[1], 1.4, 1.25), 'jacket');
  b.stamp(capsule(eF[0], eF[1], hF[0], hF[1], 1.25, 1.15), 'jacket');
  b.stamp(disc(hF[0], hF[1], 1.1), 'skinY');
  const s = b.finish(); s.hand = [hand[0], hand[1]]; return s;
}

// —— front / back views ——
// o: { who:'y'|'m', view:'front'|'back', head:key, legL, legR, rise, armL:[x,y]|null, armR:[x,y]|null, tilt }
// armL = character's screen-left hand target (relative to the shoulder line), default hanging
export function figure(o) {
  const b = new Buf(), Y = o.who === 'y';
  const top = Y ? 'jacket' : 'cardi', leg = Y ? 'jeans' : 'skinM', shoe = Y ? 'shoeB' : 'shoeM', skin = Y ? 'skinY' : 'skinM';
  const rise = o.rise || 0, hipY = Y ? -13 : -12, shY = (Y ? -21 : -20) - rise;
  const lL = o.legL || 0, lR = o.legR || 0;
  // ponytail (behind the head in front view: a tuft out to screen right, swinging)
  // legs
  if (Y) {
    b.stamp(capsule(-2.1, hipY, -2.3, -2 + lL, 1.8, 1.6), leg); b.stamp(capsule(2.1, hipY, 2.3, -2 + lR, 1.8, 1.6), leg);
  } else {
    b.stamp(capsule(-1.8, hipY + 3, -1.9, -2 + lL, 1.2, 1.1), leg); b.stamp(capsule(1.8, hipY + 3, 1.9, -2 + lR, 1.2, 1.1), leg);
  }
  b.stamp(capsule(-2.5, -1.2 + lL, -2.2 + (o.view === 'front' ? -.3 : 0), -.6 + lL, 1.3, 1.3), shoe);
  b.stamp(capsule(2.5, -1.2 + lR, 2.2, -.6 + lR, 1.3, 1.3), shoe);
  const shL = [-4.6, shY + 1], shR = [4.6, shY + 1];
  const hangL = [-6.2, hipY + 2.5], hangR = [6.2, hipY + 2.5];
  const handL = o.armL ? [o.armL[0], shY + o.armL[1]] : hangL, handR = o.armR ? [o.armR[0], shY + o.armR[1]] : hangR;
  const drawArm = (sh, hand, side, after) => {
    const raised = hand[1] < sh[1] + 2;
    const [e] = arm2(sh, hand, 4.8, 4.8, raised ? (side < 0 ? 1 : -1) : (side < 0 ? -1 : 1));
    b.stamp(capsule(sh[0], sh[1], e[0], e[1], 1.35, 1.25), top);
    b.stamp(capsule(e[0], e[1], hand[0], hand[1], 1.2, 1.1), raised && Y ? top : top);
    b.stamp(disc(hand[0], hand[1], 1.2), skin);
  };
  const lUp = handL[1] < shL[1] + 2, rUp = handR[1] < shR[1] + 2;
  if (!lUp) drawArm(shL, handL, -1); if (!rUp) drawArm(shR, handR, 1);
  // torso
  if (Y) {
    b.stamp(poly([[-4.3, shY], [4.3, shY], [4.7, hipY + 2.5], [-4.7, hipY + 2.5]], 0, hipY - 4, 4.5, 7), 'jacket');
    if (o.view === 'front') {
      b.stamp(poly([[-1.6, shY], [1.6, shY], [1.4, hipY + 2.5], [-1.4, hipY + 2.5]], 0, hipY - 4, 2, 6), 'tee', false);
      b.raw(-2, shY + 1, C.ink); b.raw(2, shY + 1, C.ink);
    } else { b.raw(0, shY + 1, C.ink); b.raw(0, shY + 2, C.night); }
  } else {
    // teal skirt (flared), then the mustard cardigan over it
    b.stamp(poly([[-4, hipY - 1], [4, hipY - 1], [5.6, hipY + 6], [-5.8, hipY + 6]], 0, hipY + 1, 5, 5), 'skirt');
    b.stamp(poly([[-3.8, shY], [3.8, shY], [4.4, hipY + .5], [-4.4, hipY + .5]], 0, hipY - 4, 4.3, 6.5), 'cardi');
    if (o.view === 'front') { b.stamp(poly([[-1.6, shY], [1.6, shY], [0.3, shY + 3.5], [-.3, shY + 3.5]], 0, shY + 1, 2, 2), 'blouse', false); b.raw(0, shY + 5, C.musD); b.raw(0, shY + 7, C.musD); }
  }
  // head
  const hk = o.head || (o.view === 'back' ? 'back' : 'front');
  const hs = Y ? headY(hk) : headM(hk);
  const hx = -7 + (o.tilt || 0), hy = shY - 13 + (o.bob || 0);
  if (!Y && o.view === 'front') {   // ponytail: a long tuft swinging out from behind the head (silhouette mark)
    const sw = o.sway || 0;
    b.stamp(capsule(5 + hx + 7, hy + 4, 8.5 + sw + hx + 7, hy + 11, 2.2, 1.4), 'hairM');
    b.stamp(capsule(8.5 + sw + hx + 7, hy + 11, 7.5 + sw * 1.5 + hx + 7, hy + 15, 1.4, .8), 'hairM');
    b.raw(hx + 12, hy + 3, C.dgreen); b.raw(hx + 12, hy + 4, C.green);   // hair tie
  }
  b.sprite(hs, hx, hy);
  if (lUp) drawArm(shL, handL, -1); if (rUp) drawArm(shR, handR, 1);
  return b.finish();
}
