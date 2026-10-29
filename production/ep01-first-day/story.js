// Episode 1 — story scenes in the Bean People world: open, street, door (mistake + freeze), retry, day montage, bye.
// Every time below is derived from timeline.json (sections, beats, lines, narration words); offsets are acting/animation only.
import { P, rgba, mix } from './kit.js';
import { CAST, drawChar, drawSuitcase } from './bean.js';
import { drawWorld, drawForeground, toScreen, GROUND, DOOR } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, back } from '/core/lib.js';
import { SEC, BEAT, NARR, LINES, nwT, has } from './tl.js';
import { fold, F, moveAt, hop, liveFace, springAt, EXPR, ARM, pose, PULL, CUP, POINT, CLAP } from './act.js';
import { lineBubble, thought, smiley, alarmClock, timeTag, sparkle, wordStates, bubble } from './ui.js';
import { cue } from './cues.js';

const H = { youssef: 300, mia: 276 };
const TWO = { x: 1420, y: 668, z: 1.85 }, EST = { x: 1060, y: 560, z: 1.05 };
let S = null;   // built once from the timeline

// ---- camera: keys fold like poses; z eases in log space; d = 0 is a cut; f(t) gives a moving target (follow) ----
export function camAt(keys, t) {
  let c = null;
  for (const k of keys) {
    if (t < k.t) break;
    const tg = k.f ? k.f(t) : k;
    const p = !c || !k.d ? 1 : eio((t - k.t) / k.d);
    c = !c ? { x: tg.x, y: tg.y, z: tg.z } : { x: lerp(c.x, tg.x, p), y: lerp(c.y, tg.y, p), z: Math.exp(lerp(Math.log(c.z), Math.log(tg.z), p)) };
  }
  return c || { ...EST };
}
export const dofOf = z => 2 * ss(seg(z, 1.3, 1.8)) + 7 * ss(seg(z, 2.5, 3.4));

// ---- small motion helpers ----
// jumps: [{t, h (fraction of H), d}] → extra lift + squash (anticipation squash, stretch up, landing squash)
function jumpsAt(list, t, Hc) {
  let lift = 0, sq = 1;
  for (const j of list) {
    const d = j.d || .42, u = (t - j.t) / d;
    if (u < -.25 || u > 1.5) continue;
    if (u < 0) sq *= 1 - .09 * Math.sin(Math.PI * (u + .25) / .25);
    else if (u < 1) { const a = Math.sin(Math.PI * u); lift += j.h * Hc * a; sq *= 1 + .07 * a * (1 - u); }
    else sq *= 1 - .1 * Math.exp(-(u - 1) * 6) * Math.sin((u - 1) * 14);
  }
  return { lift, sq };
}
// tremble (nervous), deterministic
const trem = (t, a) => a * (Math.sin(t * 57) * .6 + Math.sin(t * 91) * .4);

// a character = keys + moves + jumps → full pose state at t (without the live face layer)
function charState(C, t) {
  const m = moveAt(C.moves, t, H[C.id]);
  const hp = hop(m, H[C.id], C.hopAmp ?? 1);
  const k = fold(C.keys, t, C.base);
  const j = jumpsAt(C.jumps || [], t, H[C.id]);
  return {
    ...k, x: m.x, y: m.y || GROUND, k: m.k * (k.kmul ?? 1), lift: hp.lift + j.lift + (k.lift || 0), sq: hp.sq * j.sq * (k.sq ?? 1),
    lean: (k.lean || 0) + hp.lean + trem(t, k.trem || 0), footL: hp.footL, footR: hp.footR, phase: m.phase, walking: m.walking, dir: m.dir,
    wave: t * 1.9,
  };
}
const springFor = C => tt => { const s = charState(C, tt); return { lift: s.lift, lean: s.lean, x: s.x }; };

// draw one character (and its suitcase) with a camera
function drawActor(c, cam, C, t, extra = {}) {
  const st = charState(C, t);
  if ((st.alpha ?? 1) <= 0) return st;
  const [x, y, Z] = toScreen(cam, 1, st.x, st.y);
  const face = extra.frozenFace || liveFace(C.id, t, st.face, { blinks: C.blinks, extra: C.talkExtra });
  const p = pose({ ...st, x, y, k: st.k * Z, face, pony: C.id === 'mia' ? (extra.pony ?? springAt(springFor(C), t)) : 0,
    quiff: C.id === 'youssef' ? (extra.quiff ?? springAt(springFor(C), t, .25)) : 0, breathe: Math.sin(t * Math.PI * 2 / 3.2 + (C.id === 'mia' ? 1 : 0)) });
  c.save();
  if (st.alpha < 1) c.globalAlpha = st.alpha;
  if (st.clip) doorClip(c, cam, extra.door ?? 1);
  if (C.case) drawCase(c, cam, C, t, st);
  drawChar(c, CAST[C.id], p);
  c.restore();
  return { ...st, sx: x, sy: y, Z };
}
// clip to the open part of the doorway (screen space); open = door amount
function doorClip(c, cam, open) {
  const dw = 116, dh = 196, lw = dw * Math.cos(clamp(open) * Math.PI * .47);
  const [x0, y0] = toScreen(cam, 1, DOOR.x - dw / 2 + lw, DOOR.y - dh), [x1, y1] = toScreen(cam, 1, DOOR.x + dw / 2, DOOR.y + 2);
  c.beginPath(); c.rect(x0, y0 - 60, x1 - x0, y1 - y0 + 60); c.clip();
}
// suitcase: trails behind the walker with a .06 s lag; wheel wobble while rolling
function drawCase(c, cam, C, t, st) {
  const lag = charState(C, t - .06), side = st.caseSide ?? -lag.dir;
  const wx = lag.x + side * 118 * lag.k / .9, wy = lag.y;
  const [x, y, Z] = toScreen(cam, 1, wx, wy);
  const tilt = lag.walking ? -side * (.1 + .03 * Math.sin(lag.phase * Math.PI * 4)) : -side * .04;
  drawSuitcase(c, x, y, lag.k * Z, 300, { handle: .35, tilt });
}
const head = (st, id, f = 1.08) => st && st.sx != null ? [st.sx, st.sy - H[id] * st.k * st.Z * f] : null;

// ======================================================================================================================
export function buildStory() {
  const o = SEC('open'), st = SEC('street'), dr = SEC('door'), rt = SEC('retry'), dy = SEC('day'), by = SEC('bye');
  const D = LINES('door'), R = LINES('retry'), Y = LINES('bye');
  const n1 = NARR('ar01'), n2 = NARR('ar02'), n3 = NARR('ar03'), n4 = NARR('ar04'), n5 = NARR('ar05'), n8 = NARR('ar08');
  const bSeen = BEAT('school_seen', st.t0 + 7), bDoor = BEAT('door_open', dr.t0 - .8), bSorry = BEAT('sorry'), bFreeze = BEAT('freeze'),
    bUn = BEAT('unfreeze', rt.t0), bIn = BEAT('come_in'), bEight = BEAT('eight');
  const tLondon = nwT('ar01', has('لندن'), .95), tGood = nwT('ar02', has('كويس'), .65), tMia = nwT('ar02', has('قابلت'), .9);
  const tConf = nwT('ar03', has('بثقة'), .75), tSmile = nwT('ar03', has('ابتسامة'), .9);
  const tok = (L, i) => L.tok[Math.min(i, L.tok.length - 1)];
  const D0 = D[0], D1 = D[1], D2 = D[2];
  const pause0 = n1.t1 - 1.05, pause1 = n1.t1 + .8;

  // ---------------- Youssef: open → retry ----------------
  const happyWalk = F('happy', { mo: .03, mw: .1, happy: .25, lx: .5, ly: -.15 });
  const yA = { id: 'youssef', case: true, base: { turn: .5, face: happyWalk, armL: PULL, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [
      { t0: .2, t1: pause0, x0: -2150, x1: -1150 },
      { t0: pause1, t1: bSeen - .1, x0: -1150, x1: 930 },
      { t0: bSeen + 1.9, t1: bDoor - .2, x0: 930, x1: 1310 },
    ], keys: [] };
  yA.moves.forEach(m => { m.k0 = m.k1 = .9; });
  const K = yA.keys, J = yA.jumps, BL = yA.blinks;
  // "…أول يوم ليّا في لندن": stops, looks up at the skyline, delighted
  K.push({ t: pause0 - .1, turn: .2, d: .35 }, { t: tLondon - .45, face: F('joy', { lx: -.35, ly: -.6 }), d: .25 },
    { t: tLondon - .5, armR: { dx: .12, dy: .06, bend: .1, w: 0 }, d: .15 }, { t: tLondon - .3, armR: ARM.up, d: .22 },
    { t: pause1 - .45, armR: ARM.rest, face: happyWalk, d: .3 }, { t: pause1 - .2, turn: .5, d: .3 });
  J.push({ t: tLondon - .25, h: .07, d: .4 }); BL.push(tLondon - .45, pause1 - .45);
  // "…الإنجليزي بتاعي كويس" proud; "لحد ما قابلت ميا" a worried glance at us
  K.push({ t: tGood - .1, face: F('happy', { bLy: .9, bRy: .9, happy: .5, mw: .12, mo: .04, lx: .45, ly: -.25 }), d: .3 },
    { t: tMia - .15, face: F('worried', { lx: -.45, ly: .1, bLr: .45, bRr: .45 }), turn: .3, d: .25 },
    { t: n2.t1 + .5, face: happyWalk, turn: .5, d: .4 });
  BL.push(tMia - .15);
  // street: rehearsing "Hello!" — confident, then the big smile
  K.push({ t: tConf - .1, face: F('happy', { bLy: .8, bRy: .8, happy: .3, mw: .11, mo: .03, ms: .9, lx: .5, ly: -.3 }), d: .3 },
    { t: tSmile - .05, face: F('joy', { mw: .15, mo: .075, lx: .4 }), d: .2 }, { t: n3.t1 + .6, face: happyWalk, d: .3 });
  // the school: stops, looks up at the sign (surprise → delight), then walks to the door, getting nervous
  K.push({ t: bSeen - .15, turn: .25, face: F('surprised', { lx: .45, ly: -.8 }), d: .2 }, { t: bSeen + .6, face: F('happy', { lx: .4, ly: -.7, happy: .5, mo: .05, mw: .12 }), d: .3 },
    { t: bSeen + 1.7, turn: .5, face: F('happy', { happy: .2, bLr: .3, bRr: .3, mo: .02, lx: .5 }), d: .3 });
  J.push({ t: bSeen + .55, h: .06, d: .38 }); BL.push(bSeen - .15, bSeen + 1.7);
  // the door opens: a gulp, then a brave smile toward Mia
  K.push({ t: bDoor + .05, turn: .4, face: F('surprised', { lx: .6, ly: -.1, sweat: .2 }), d: .15 }, { t: bDoor + .7, face: F('nervous', { mt: .5, mo: .03, lx: .55, sweat: .3 }), d: .25 },
    { t: D0.t0 - .1, face: F('happy', { happy: .3, mo: .03, mw: .1, lx: .55, ly: -.1, sweat: .15 }), d: .3 });
  BL.push(bDoor + .05);
  // "Hello! I… I Youssef."
  const tHello = tok(D1, 0).t0, tI1 = tok(D1, 1).t0, tI2 = tok(D1, 2).t0, tYou = tok(D1, 3).t0;
  K.push({ t: tHello - .32, armR: { dx: .12, dy: .05, bend: .1, w: 0 }, face: F('happy', { lx: .55, happy: .4 }), d: .15 }, { t: tHello - .12, armR: ARM.wave, d: .2 },
    { t: tI1 - .1, armR: { dx: -.1, dy: .1, bend: -.2, w: 0 }, face: F('nervous', { lx: .2, ly: .25, sweat: .5 }), trem: .006, d: .2 },
    { t: tI2 - .1, face: F('happy', { bLy: .7, bRy: .7, happy: .15, mw: .1, ms: .7, lx: .55 }), trem: 0, lean: -.02, armR: ARM.rest, d: .25 },
    { t: D1.t1 + .1, face: F('happy', { bLy: .75, bRy: .75, happy: .2, mw: .11, ms: .9, lx: .55 }), lean: 0, d: .3 });
  J.push({ t: tHello - .05, h: .05, d: .34 }); BL.push(tI1 - .1, tI2 - .1);
  // "Sorry?" — the smile sticks; then the deliberate freeze pop: embarrassed + scratch head
  K.push({ t: bSorry + .05, face: F('happy', { bLy: 1, bRy: 1, happy: .1, mw: .1, ms: .5, lx: .5, ly: -.1 }), d: .2 },
    { t: bFreeze, face: { ...EXPR.embarrassed }, armR: ARM.scratch, lean: -.025, turn: .1, d: .01 });
  // unfreeze → retry
  const R0 = R[0], R1 = R[1], R2 = R[2], R3 = R[3], R4 = R[4] || R[R.length - 1];
  K.push({ t: bUn, face: F('nervous', { mt: .3, mo: .02, ms: .4, lx: .55, sweat: .3, blush: .7 }), armR: ARM.rest, lean: 0, turn: .4, d: .25 },
    { t: R0.t0 + .3, face: F('happy', { happy: .1, lx: .55, ly: -.05, bLy: .5, bRy: .5, mo: 0, ms: .4, sweat: .1 }), lean: .015, d: .4 },
    { t: R1.t0 - .25, armR: ARM.chest, face: F('talk', { bLy: .55, bRy: .55, lx: .5, mo: 0, ms: .6, blush: .5 }), d: .3 },
    { t: R1.t1 - .25, face: F('happy', { happy: .45, lx: .55 }), d: .25 },
    { t: R2.t0 + .1, face: F('joy', { lx: .55 }), armR: ARM.rest, lean: 0, d: .2 },
    { t: R3.t0 - .1, face: F('happy', { happy: .6, mw: .13, lx: .55, blush: .7 }), armR: { dx: .15, dy: -.02, bend: .1, w: 0 }, d: .25 },
    { t: R3.t1 + .05, face: F('joy', { lx: .55 }), armR: ARM.rest, d: .2 },
    { t: R4.t0 + .2, face: F('happy', { happy: .4, lx: .7, ly: -.2 }), d: .3 });
  J.push({ t: R2.t0 + .25, h: .04, d: .34 }, { t: R3.t1 + .02, h: .08, d: .42 }); BL.push(bUn, R1.t0 - .25, R2.t0 + .1);
  // go in: hop up the steps into the doorway (back turned), fade into the warm interior
  const inY0 = R4.t1 + .55, inY1 = inY0 + 2.0;
  yA.moves.push({ t0: inY0, t1: inY1, x0: 1310, x1: 1530, y0: GROUND, y1: 800, k0: .9, k1: .62, step: .42 });
  K.push({ t: inY0 - .1, turn: 1.3, d: .5 }, { t: inY0 + .5, turn: 2.05, d: .6 }, { t: inY1 - .45, clip: 1 }, { t: inY1 - .4, alpha: 0, d: .45 });
  // ---------------- Mia: door → retry ----------------
  const mA = { id: 'mia', base: { turn: 0, face: F('happy', { lx: -.4 }), armL: ARM.rest, armR: ARM.rest, alpha: 0, clip: 1, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: bDoor + .5, t1: D0.t0 - .1, x0: 1530, x1: 1540, y0: 800, y1: GROUND, k0: .6, k1: .9, step: .46 }], keys: [] };
  const MK = mA.keys, MJ = mA.jumps, MB = mA.blinks;
  MK.push({ t: bDoor, alpha: 1, d: .01 }, { t: bDoor + .55, clip: null }, { t: bDoor + .5, turn: -.38, d: .7 },
    // "Hi! I'm Mia." with a wave (dip first)
    { t: D0.t0 - .35, armR: { dx: .12, dy: .07, bend: .1, w: 0 }, face: F('happy', { lx: -.5, happy: .4 }), d: .15 }, { t: D0.t0 - .15, armR: ARM.wave, d: .22 },
    { t: D0.t1 + .45, armR: ARM.rest, d: .35 },
    { t: tI1, face: F('happy', { lx: -.5, bLy: .8, bRy: .8, happy: .1 }), d: .3 },
    { t: tYou + .25, face: F('puzzled', { lx: -.55 }), d: .3 },
    // "Sorry?": lean in with overshoot, hand to the ear
    { t: D2.t0 - .4, lean: -.095, armR: CUP, d: .25 }, { t: D2.t0 - .12, lean: -.065, d: .35 },
    // retry: kind and patient
    { t: bUn, face: F('happy', { happy: .35, lx: -.55, bLy: .6, bRy: .6 }), lean: -.03, armR: ARM.rest, armL: { dx: .16, dy: .02, bend: .05, w: 0 }, d: .3 },
    { t: R0.t1 + .3, armL: ARM.rest, lean: -.01, d: .4 },
    { t: tok(R1, 3).t0 + .1, face: F('joy', { lx: -.5 }), d: .2 },
    { t: R2.t0 - .2, armL: CLAP, armR: CLAP, d: .2 }, { t: R2.t0 + .9, armL: ARM.rest, armR: ARM.rest, face: F('happy', { lx: -.5, happy: .5 }), d: .35 },
    { t: R3.t1 + .1, face: F('joy', { lx: -.5 }), d: .2 },
    // "Come in, come in!": step aside, sweep toward the door
    { t: R4.t0 - .25, turn: -.15, armL: POINT, face: F('happy', { lx: -.6, happy: .5 }), d: .25 },
    { t: R4.t1 + .1, armL: ARM.rest, d: .3 });
  MJ.push({ t: R2.t0 + .05, h: .05, d: .36 }); MB.push(D0.t0 - .35, tYou + .25, bUn, R2.t0 - .2);
  mA.moves.push({ t0: R4.t0 - .25, t1: R4.t0 + .35, x0: 1540, x1: 1660, step: .6 });
  const inM0 = R4.t1 + .1, inM1 = inM0 + 1.45;
  mA.moves.push({ t0: inM0, t1: inM1, x0: 1660, x1: 1530, y0: GROUND, y1: 800, k0: .9, k1: .6, step: .48 });
  MK.push({ t: inM0, turn: 1.0, d: .35 }, { t: inM0 + .35, turn: 2.05, d: .5 }, { t: inM1 - .4, clip: 1 }, { t: inM1 - .35, alpha: 0, d: .4 });
  const doorClose = Math.min(inY1 + .25, rt.t1 - .6);
  // ---------------- day + bye: both come out in golden light ----------------
  const Y0 = Y[0], Y1 = Y[1], Y2 = Y[2], Y3 = Y[3] || Y[Y.length - 1];
  const outDoor = dy.t1 - 1.6, outM0 = dy.t1 - 1.15, outY0 = dy.t1 - .8;
  const mD = { id: 'mia', base: { turn: 0, face: F('happy', { lx: .1, lid: .1 }), armL: ARM.rest, armR: ARM.rest, alpha: 0, clip: 1, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: outM0, t1: Math.min(Y0.t0 - .15, outM0 + 1.4), x0: 1530, x1: 1540, y0: 800, y1: GROUND, k0: .6, k1: .9, step: .46 }], keys: [] };
  mD.keys.push({ t: outM0, alpha: 1, d: .2 }, { t: outM0 + .5, clip: null }, { t: outM0 + .3, turn: -.38, d: .6 },
    { t: Y0.t0 - .35, armR: { dx: .12, dy: .07, bend: .1, w: 0 }, face: F('happy', { lx: -.5, happy: .5 }), d: .15 }, { t: Y0.t0 - .15, armR: ARM.wave, d: .22 },
    { t: Y0.t1 + .2, armR: ARM.rest, d: .35 },
    { t: Y2.t0 - .35, armR: CUP, lean: -.05, face: F('happy', { lx: -.75, happy: .45 }), d: .25 },
    { t: Y2.t1 + .25, armR: ARM.wave, lean: -.02, d: .3 }, { t: Y2.t1 + 1.6, armR: ARM.rest, d: .4 });
  mD.blinks.push(Y0.t0 - .35, Y2.t0 - .35);
  const yD = { id: 'youssef', case: true, base: { turn: .2, face: F('happy', { happy: .3, lid: .15, lx: .3 }), armL: PULL, armR: ARM.rest, alpha: 0, clip: 1, kmul: 1, caseSide: -1 },
    blinks: [], jumps: [], keys: [],
    moves: [{ t0: outY0, t1: Math.max(outY0 + 1.0, Math.min(Y0.t0 - .05, by.t0 + .55)), x0: 1530, x1: 1310, y0: 800, y1: GROUND, k0: .64, k1: .9, step: .42 }] };
  const walkAway0 = Y1.t1 + .3, walkAway1 = Math.max(walkAway0 + 1.2, Y2.t0 + .5);
  yD.moves.push({ t0: walkAway0, t1: walkAway1, x0: 1310, x1: 1060 });
  const tSabah = nwT('ar08', has('الصبح'), .2), tAdrus = nwT('ar08', has('أدرس'), .55), tArmy = nwT('ar08', has('الجيش'), .9);
  yD.keys.push({ t: outY0, alpha: 1, d: .25 }, { t: outY0 + .5, clip: null }, { t: outY0 + .4, turn: .4, d: .5 },
    { t: Y0.t1 - .2, face: F('happy', { happy: .5, lx: .55, lid: .1 }), d: .3 },
    { t: Y1.t0 - .3, armR: { dx: .12, dy: .05, bend: .1, w: 0 }, d: .15 }, { t: Y1.t0 - .1, armR: ARM.wave, d: .22 },
    { t: Y1.t1, armR: ARM.rest, d: .3 },
    // walks away to the left (suitcase now trails on his right)
    { t: walkAway0 - .2, turn: -.5, armL: ARM.rest, armR: PULL, caseSide: 1, face: F('happy', { happy: .35, lx: -.5, lid: .1 }), d: .3 },
    // "Class is at eight!" — he stops; on "Eight?!" whips round, shocked
    { t: bEight - .12, turn: .22, face: F('surprised', { pupil: .55, mo: .085, mw: .07, lx: .3, ly: -.1, sweat: .6, blush: .3 }), armL: { dx: .2, dy: -.12, bend: -.1, w: 0 }, d: .14 },
    { t: tSabah + .1, face: F('surprised', { pupil: .5, mo: .1, mw: .065, lx: .1, ly: -.2, sweat: .9, mwob: .5 }), d: .25 },
    { t: tAdrus - .2, face: F('worried', { lx: -.4, ly: .3, sweat: .9, mwob: 1 }), turn: .15, d: .3 },
    { t: tArmy - .1, face: F('neutral', { lid: .48, lx: 0, ly: 0, mw: .085, ms: -.1, bLy: -.1, bRy: -.1, bLr: 0, bRr: 0, sweat: .6, blush: .3 }), turn: 0, d: .2 });
  yD.jumps.push({ t: bEight - .1, h: .09, d: .36 }); yD.blinks.push(bEight - .12, tArmy - .1);
  S = { o, st, dr, rt, dy, by, D, R, Y, D0, D1, D2, R4, Y3, n3, n5, n8, yA, mA, mD, yD, bSeen, bDoor, bSorry, bFreeze, bUn, bIn, bEight, doorClose, outDoor, pause0, pause1, tHello, tI1, tI2 };

  // ---------------- cameras ----------------
  const yx = tt => charState(yA, tt).x;
  S.camA = [
    { t: -1, x: -1120, y: 330, z: 1.12 },
    { t: 1.0, d: 3.4, f: tt => ({ x: yx(tt - .5) + 270, y: 575, z: 1.05 }) },
    { t: bSeen - .25, d: 1.9, x: EST.x, y: EST.y, z: EST.z },
    { t: bDoor + .3, d: 1.15, ...TWO },
    { t: D1.t0, d: Math.max(.5, D1.t1 - D1.t0), x: 1395, y: 672, z: 1.97 },
    { t: bSorry, d: 0, x: 1362, y: 676, z: 3.45 },
    { t: bFreeze, d: Math.max(.5, bUn - bFreeze), x: 1356, y: 668, z: 3.62 },
    { t: bUn, d: 0, ...TWO },
    { t: R2.t0, d: 2.2, x: 1430, y: 664, z: 1.93 },
    { t: R4.t1 - .1, d: 1.5, x: 1330, y: 590, z: 1.32 },
    { t: doorClose + .2, d: Math.max(1, rt.t1 - doorClose), x: 1420, y: 520, z: 1.55 },
  ];
  const ye = charState(yD, bEight).x;
  S.camD = [
    { t: dy.t0 - 1, x: 1530, y: 430, z: 2.35 },
    { t: dy.t1 - 2.7, d: 2.0, x: 1180, y: 575, z: 1.05 },
    { t: by.t0, d: 0, ...TWO },
    { t: Y1.t1 - .1, d: 1.4, x: 1300, y: 640, z: 1.5 },
    { t: bEight, d: 0, x: ye + 70, y: 672, z: 3.2 },
    { t: bEight + .4, d: Math.max(1, by.t1 - bEight), x: ye + 66, y: 668, z: 3.38 },
  ];
  S.clock0 = dy.t0 + .4; S.clock1 = dy.t1 - 2.8;
  S.bus0 = n2.t0 + .2; S.bus1 = S.bus0 + 7;
  S.thought = [n3.t0 + .25, bSeen - .35];
  S.alarm = [Y3.t1 + .12, n8 ? n8.t1 + .45 : Y3.t1 + 4];
  // ---------------- sound cues ----------------
  for (const L of [...D, ...R, ...Y]) cue(L.t0 - .18, 'bubble', { who: L.who, text: L.text });
  cue(.3, 'ambience_street', { dur: rt.t1 - .3, note: 'London morning street bed' });
  steps(yA, 'youssef', 0, rt.t1); steps(mA, 'mia', 0, rt.t1); steps(yD, 'youssef', dy.t0, by.t1); steps(mD, 'mia', dy.t0, by.t1);
  rolls(yA, 0, rt.t1); rolls(yD, dy.t0, by.t1);
  cue(S.bus0, 'bus', { dur: S.bus1 - S.bus0, pan: 'right_to_left' });
  cue(tLondon - .3, 'pop', { note: 'excited hop' });
  cue(S.thought[0], 'thought', { note: 'thought bubble Hello!' });
  cue(tSmile, 'sparkle');
  cue(bSeen - .1, 'ding', { note: 'school seen' });
  cue(bDoor, 'door_open');
  cue(bDoor + .3, 'whoosh', { note: 'push in to the two-shot' });
  cue(bSorry, 'cut_in', { note: 'close-up on Youssef' });
  cue(bFreeze, 'freeze', { note: 'freeze-frame pop' });
  cue(bUn, 'unfreeze');
  cue(R4.t1 - .1, 'whoosh', { note: 'pull back' });
  cue(doorClose, 'door_close');
  cue(dy.t0, 'whoosh', { note: 'cut to the clock' });
  cue(S.clock0, 'clock_spin', { dur: S.clock1 - S.clock0 });
  for (let x = S.clock0; x < S.clock1; x += .01) if (Math.floor(clockAt(x)) !== Math.floor(clockAt(x + .01))) cue(x + .01, 'clock_tick', { note: 'hour passes' });
  cue(dy.t0 + .3, 'ambience_afternoon', { dur: by.t1 - dy.t0 - .3 });
  cue(outDoor, 'door_open');
  cue(bEight - .1, 'sting_shock', { note: 'Eight?!' });
  cue(S.alarm[0], 'thought');
  cue(S.alarm[0] + .25, 'alarm', { dur: Math.min(3, S.alarm[1] - S.alarm[0] - .3) });
  return S;
}
function steps(C, who, a, b) {   // one 'step' cue per hop landing
  for (const m of C.moves) {
    if (m.glide) continue;
    const D = m.t1 - m.t0, n = Math.max(1, Math.round(D / (m.step || .42)));
    for (let i = 0; i < n; i++) { const tt = m.t0 + D * (i + .68) / n; if (tt >= a && tt < b) cue(tt, 'step', { who }); }
  }
}
function rolls(C, a, b) { for (const m of C.moves) if (m.t0 >= a && m.t0 < b && m.x0 !== m.x1) cue(m.t0, 'suitcase_roll', { dur: m.t1 - m.t0 }); }
const clockAt = t => t < S.clock0 ? 8.93 : lerp(9.08, 15.5, eio(seg(t, S.clock0, S.clock1)));
const todAt = t => eio(seg(t, S.clock0, S.clock1 + .4));

// ======================================================================================================================
// open → street → door → retry (one continuous world)
export function sceneA(c, t) {
  const cam = camAt(S.camA, t), dof = dofOf(cam.z);
  const midC = 960 + (cam.x - 960) * .45, bu = seg(t, S.bus0, S.bus1);
  const door = t < S.bDoor ? 0 : t < S.doorClose ? eo(seg(t, S.bDoor, S.bDoor + .6)) : 1 - ss(seg(t, S.doorClose, S.doorClose + .45));
  const freeze = t >= S.bFreeze && t < S.bUn;
  const tc = freeze ? S.bFreeze + .12 : t;            // character time stops during the freeze-frame
  if (freeze) return freezeFrame(c, t);
  drawWorld(c, cam, t, { door, dof, busX: bu > 0 && bu < 1 ? midC + 1300 - 2600 * bu : null, clock: 8.93 });
  const ys = S.yA, ms = S.mA;
  const yst = charState(ys, tc), mst = charState(ms, tc);
  const closeUp = t >= S.bSorry && t < S.bUn;      // cut-in: Mia is off screen right (her bubble stays at the edge)
  const order = (mst.y < yst.y ? [[ms, 'm'], [ys, 'y']] : [[ys, 'y'], [ms, 'm']]).filter(([, n]) => !(closeUp && n === 'm'));
  const R = {};
  for (const [C, n] of order) R[n] = drawActor(c, cam, C, tc, { door });
  // ---- UI ----
  const yh = head(R.y, 'youssef'), mh = R.m && R.m.sx != null ? head(R.m, 'mia', 1.12) : null;
  // street: thought bubble rehearsing "Hello!" + a drawn smile
  const [th0, th1] = S.thought;
  if (t > th0 && t < th1 + .3) {
    const pop = seg(t, th0, th0 + .55), out = seg(t, th1, th1 + .25);
    const bob = Math.sin(t * 2.4) * 4;
    thought(c, { x: yh[0] - 250, y: yh[1] - 150 + bob, w: 380, h: 200, hx: yh[0] - 50, hy: yh[1] + 10, pop, out }, cc => {
      cc.font = '600 64px "Fredoka"'; cc.fillStyle = P.ink; cc.textAlign = 'center'; cc.textBaseline = 'alphabetic';
      cc.fillText('Hello!', -34, 22);
      smiley(cc, 112, 0, 32);
    });
  }
  // door dialogue + retry: one bubble at a time, tails to the speakers' heads
  const lines = [...S.D, ...S.R];
  lines.forEach((L, i) => {
    const nx = lines[i + 1] ? lines[i + 1].t0 : null;
    if (!(L.who === 'mia' ? mh : yh) && !(t >= S.bSorry && t < S.bUn)) return;
    if (freeze || (t >= S.bSorry && t < S.bUn)) {   // close-up: Mia is off screen right
      if (L === S.D2) lineBubble(c, L, Math.min(t, S.bFreeze + .05), { x: 1905, y: 520, side: -1, lift: 120 }, { until: S.bUn - .2 });
      return;
    }
    if (L === S.D2) return lineBubble(c, L, t, { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 }, { until: S.bSorry - .01 });
    const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 } : { x: yh[0] + 20, y: yh[1], side: -1, lift: 70 };
    lineBubble(c, L, t, { ...pos, wordFx: L === S.D1 ? (k, tt) => (k === 1 && tt > S.tI1 && tt < S.tI2 ? { shake: tt } : {}) : null }, { next: nx, hold: 1.2 });
  });
  return { cam };
}
// the freeze-frame: the picture at the pop is held (rendered once, cached), desaturated, with a slow push; ? and ! pop as he panics
let FZ = null;
function freezeFrame(c, t) {
  if (!FZ) {
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
    const f = cv.getContext('2d', { willReadFrequently: true });
    const tf = S.bFreeze, cam = camAt(S.camA, tf);
    drawWorld(f, cam, tf, { door: 1, dof: dofOf(cam.z), clock: 8.93 });
    const R = drawActor(f, cam, S.yA, tf + .12, { door: 1 });
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'saturation'; f.fillStyle = 'rgba(128,128,128,.42)'; f.fillRect(0, 0, 1920, 1080); f.globalCompositeOperation = 'source-over';
    FZ = { cv, yh: head(R, 'youssef') };
  }
  const u = eio(seg(t, S.bFreeze, S.bUn)), z = 1 + .05 * u, ax = FZ.yh[0], ay = FZ.yh[1] + 200;
  c.save(); c.setTransform(z, 0, 0, z, ax * (1 - z), ay * (1 - z)); c.drawImage(FZ.cv, 0, 0); c.restore();
  lineBubble(c, S.D2, S.bFreeze + .05, { x: 1905, y: 520, side: -1, lift: 120 }, { until: S.bUn - .2 });
  freezeFx(c, t, FZ.yh);
  return {};
}
function freezeFx(c, t, yh) {
  const a = seg(t, S.bFreeze, S.bFreeze + .08);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const v = c.createRadialGradient(960, 540, 420, 960, 540, 1150); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${.38 * a})`);
  c.fillStyle = v; c.fillRect(0, 0, 1920, 1080);
  // flash on the pop
  const fl = 1 - seg(t, S.bFreeze, S.bFreeze + .16); if (fl > 0) { c.fillStyle = `rgba(255,251,240,${.55 * fl})`; c.fillRect(0, 0, 1920, 1080); }
  // a cream keyline frame (the "photo" of the moment)
  c.strokeStyle = rgba(P.cream, .9 * a); c.lineWidth = 14; c.strokeRect(22, 22, 1876, 1036);
  // ? and ! marks timed to his panicking narration
  const n = S.n5, marks = n ? n.tok.filter(o => /[؟?!]/.test(o.w)).map(o => ({ t: o.t0 + .1, ch: /[؟?]/.test(o.w) ? '?' : '!' })) : [];
  const spots = [[-330, -60, -.25], [300, -150, .2], [-250, -260, -.1], [380, 40, .3], [80, -330, 0]];
  marks.forEach((m, i) => {
    const k = seg(t, m.t, m.t + .35); if (k <= 0) return;
    const [dx, dy, r] = spots[i % spots.length], s = back(k, 2.4);
    c.save(); c.translate(yh[0] + dx, yh[1] + 160 + dy); c.rotate(r + Math.sin((t - m.t) * 3) * .05); c.scale(s, s);
    c.font = '700 150px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = rgba('#1E1B33', .25); c.fillText(m.ch, 6, 8); c.fillStyle = m.ch === '?' ? P.mustard : P.red; c.fillText(m.ch, 0, 0);
    c.restore();
  });
  c.restore();
}

// day montage + goodbye (golden afternoon)
export function sceneD(c, t) {
  const cam = camAt(S.camD, t), dof = dofOf(cam.z), tod = todAt(t);
  const door = t < S.outDoor ? 0 : eo(seg(t, S.outDoor, S.outDoor + .6));
  drawWorld(c, cam, t, { door, dof, tod, clock: clockAt(t) });
  const yst = charState(S.yD, t), mst = charState(S.mD, t);
  const order = mst.y < yst.y ? [[S.mD, 'm'], [S.yD, 'y']] : [[S.yD, 'y'], [S.mD, 'm']];
  const R = {};
  for (const [C, n] of order) R[n] = drawActor(c, cam, C, t, { door });
  grade(c, tod);
  // day montage extras: little sparkles of time passing around the clock
  if (t < S.dy.t1 - 2.4) {
    const [cx, cy] = toScreen(cam, 1, 1530, 418);
    for (let i = 0; i < 6; i++) { const a = t * 2.2 + i * 1.05, r = 230 + 30 * Math.sin(t * 3 + i); const k = seg(t, S.clock0 + i * .3, S.clock0 + i * .3 + .4) * (1 - seg(t, S.clock1 - .3, S.clock1)); if (k > 0) sparkle(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 16 * k, mix(P.mustard, P.cream, .2), a); }
  }
  const yh = head(R.y, 'youssef'), mh = head(R.m, 'mia', 1.12);
  const close = t >= S.bEight;
  S.Y.forEach((L, i) => {
    const nx = S.Y[i + 1] ? S.Y[i + 1].t0 : null;
    if (L === S.Y3) { if (close && yh) lineBubble(c, L, t, { x: yh[0] + 150, y: yh[1] + 40, side: 1, lift: 60 }, { hold: 1.3 }); return; }
    if (close || !(L.who === 'mia' ? mh : yh)) return;
    const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 } : { x: yh[0] + (yst.dir < 0 ? -20 : 20), y: yh[1], side: -1, lift: 70 };
    lineBubble(c, L, t, pos, { next: nx, hold: 1.2 });
  });
  // "Eight?!": a thought bubble with the ringing alarm clock at 8:00
  const [a0, a1] = S.alarm;
  if (close && t > a0 && t < a1 + .3) {
    const pop = seg(t, a0, a0 + .5), out = seg(t, a1, a1 + .25), ring = seg(t, a0 + .25, a0 + .35) * (1 - seg(t, a0 + 3.2, a0 + 3.5));
    thought(c, { x: 470, y: 330, w: 470, h: 360, hx: yh[0] - 130, hy: yh[1] + 60, pop, out }, cc => {
      alarmClock(cc, 0, -18, 92, 8.0, ring, t);
      timeTag(cc, 0, 118, '8:00', .8);
    });
  }
  return { cam };
}
// warm late-afternoon grade over the world + characters (multiply), applied before the UI
export function grade(c, tod) {
  if (tod <= .01) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply';
  c.fillStyle = `rgba(255,206,150,${.3 * tod})`; c.fillRect(0, 0, 1920, 1080);
  c.globalCompositeOperation = 'screen';
  const g = c.createRadialGradient(150, 60, 0, 150, 60, 1300); g.addColorStop(0, `rgba(255,190,110,${.28 * tod})`); g.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = g; c.fillRect(0, 0, 1920, 1080); c.restore();
}
export { charState, drawActor, head, H, TWO };
