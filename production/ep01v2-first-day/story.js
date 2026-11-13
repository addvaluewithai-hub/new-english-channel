// Episode 1 v2 — story scenes in the Bean People world:
//   open    the cold open straight on the door two-shot ("Hi! I'm Sara." / "Hello! I… I Youssef." / "Sorry?"), the freeze on
//           "Sorry?" under AR-00, then a VHS rewind (scanlines, RGB split, the picture scrubbing back) into the title card;
//   street  he walks to school rehearsing out loud (EN-1a bubble, word-highlighted); the door opens (a wider angle than the hook);
//   door    the story resumes after "Sorry?": AR-05 over a short close-up (no second freeze);
//   retry   EN-2 in the two-shot, "Come in!", both go in during AR-06;
//   class   the classroom of ep04 (no map pins, no Ana): Leo's exchange, then Mei's ("Sorry?" → "Youssef! I'm Youssef!"),
//           AR-07 over a wide of the class waving;
//   bye     the golden afternoon at the door, "Eight?!" and the alarm-clock thought.
// Every time below is derived from timeline.json (sections, beats, lines, narration words); offsets are acting/animation only.
import { P, rgba, mix, dark } from './kit.js';
import { CAST, drawChar, drawSuitcase, LILAC } from './bean.js';
import { drawWorld, toScreen, GROUND, DOOR, drawClass, deskFront, layerT, CLASS } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from '/core/lib.js';
import { SEC, BEAT, NARR, LINES, nwT, has } from './tl.js';
import { fold, F, moveAt, hop, liveFace, lipsync, blinkAt, dart, springAt, smoothArms, EXPR, ARM, pose, PULL, CUP, POINT, CLAP, DIP, OPEN, INWARD, RAISE } from './act.js';
import { lineBubble, thought, alarmClock, timeTag, sparkle, wordStates, bubble, SPEAKER } from './ui.js';
import { cue } from './cues.js';

// the classmates' name tabs (added here so the shared ui.js stays unchanged): Leo leaf-dark, Mei the cool violet shade token
SPEAKER.leo = { name: 'LEO', tab: dark(P.leaf, .3), hi: P.mustard };
SPEAKER.mei = { name: 'MEI', tab: '#6F62A8', hi: P.mustard };
const H = { youssef: 300, mia: 276, leo: 294, mei: 262 };
const TWO = { x: 1420, y: 668, z: 1.85 }, EST = { x: 1060, y: 560, z: 1.05 };
const DOORCAM = { x: 1235, y: 618, z: 1.42 };          // the door opening seen wider and from further down the street than the hook
const SEAT = 22;                                       // a seated student sinks this far behind the desk
const XC = { mia: 360, mei: CLASS.desks.mei, youssef: CLASS.desks.youssef, leo: CLASS.desks.leo };
const WIDE = { x: 905, y: 600, z: 1.28 }, PAIR_YL = { x: 1262, y: 708, z: 1.95 }, PAIR_MY = { x: 922, y: 708, z: 1.95 };
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
const trem = (t, a) => a * (Math.sin(t * 57) * .6 + Math.sin(t * 91) * .4);

// a character = keys + moves + jumps → full pose state at t (without the live face layer); seat sinks a student behind the desk
function charState(C, t) {
  const m = moveAt(C.moves, t, H[C.id]);
  const hp = hop(m, H[C.id], C.hopAmp ?? 1);
  const k = fold(C.keys, t, C.base);
  const j = jumpsAt(C.jumps || [], t, H[C.id]);
  return {
    ...k, x: m.x, y: (m.y || GROUND) + SEAT * (k.seat || 0), k: m.k * (k.kmul ?? 1), lift: hp.lift + j.lift + (k.lift || 0), sq: hp.sq * j.sq * (k.sq ?? 1),
    lean: (k.lean || 0) + hp.lean + trem(t, k.trem || 0), footL: hp.footL, footR: hp.footR, phase: m.phase, walking: m.walking, dir: m.dir,
    wave: t * 1.9,
  };
}
const springFor = C => tt => { const s = charState(C, tt); return { lift: s.lift, lean: s.lean, x: s.x }; };
// the live face: the classmates get their own dart phases and (Mei) a time-shifted blink track, since the shared seeds only know mia/youssef
function faceOf(C, t, st) {
  if (C.id === 'leo' || C.id === 'mei') {
    const off = C.id === 'leo' ? 9.1 : 17.3;
    let f = { ...st.face }; const [dx, dy] = dart(C.id, t + off); f.lx += dx; f.ly += dy * .6;
    const b = blinkAt(C.id, t + (C.id === 'mei' ? 1.37 : 0), (C.blinks || []).map(x => x + (C.id === 'mei' ? 1.37 : 0)));
    if (b > 0) f.eye = Math.min(f.eye, 1 - b);
    return lipsync(f, C.id, t, C.talkExtra);
  }
  return liveFace(C.id, t, st.face, { blinks: C.blinks, extra: C.talkExtra });
}

// draw one character (and its suitcase) with a camera
function drawActor(c, cam, C, t, extra = {}) {
  const st = charState(C, t);
  if ((st.alpha ?? 1) <= 0) return st;
  const [x, y, Z] = toScreen(cam, 1, st.x, st.y);
  const face = extra.frozenFace || faceOf(C, t, st);
  const p = pose({ ...st, ...smoothArms(C, t), x, y, k: st.k * Z, face, pony: C.id === 'mia' ? (extra.pony ?? springAt(springFor(C), t)) : 0,
    quiff: C.id === 'youssef' ? (extra.quiff ?? springAt(springFor(C), t, .25)) : 0,
    breathe: Math.sin(t * Math.PI * 2 / 3.2 + ({ mia: 1, leo: 2, mei: 3 }[C.id] || 0)) });
  c.save();
  if (st.alpha < 1) c.globalAlpha = st.alpha;
  if (st.clip) doorClip(c, cam, extra.door ?? 1, st.clip);
  if (C.case) drawCase(c, cam, C, t, st);
  drawChar(c, CAST[C.id], p);
  c.restore();
  return { ...st, sx: x, sy: y, Z };
}
// clip to the open part of the doorway (screen space); open = door amount; amt (1 → 0) widens the clip as a character steps out
function doorClip(c, cam, open, amt = 1) {
  const dw = 116, dh = 196, lw = dw * Math.cos(clamp(open) * Math.PI * .47);
  const [x0, y0] = toScreen(cam, 1, DOOR.x - dw / 2 + lw, DOOR.y - dh), [x1, y1] = toScreen(cam, 1, DOOR.x + dw / 2, DOOR.y + 2);
  const g = (1 - clamp(amt)) * 420 * toScreen(cam, 1, 0, 0)[2];
  c.beginPath(); c.rect(x0 - g, y0 - 60 - g, x1 - x0 + 2 * g, y1 - y0 + 60 + 2 * g); c.clip();
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
const FR = A => ({ ...A, front: true });
const tokT = (L, re, d = 0) => { if (!L) return null; const o = L.tok.find(o => re.test(o.w)); return o ? o.t0 : L.t0 + (L.t1 - L.t0) * d; };

// ======================================================================================================================
export function buildStory() {
  const o = SEC('open'), st = SEC('street'), dr = SEC('door'), rt = SEC('retry'), cl = SEC('class'), by = SEC('bye');
  const D = LINES('door'), E1 = LINES('street')[0], R = LINES('retry'), CL = LINES('class'), Y = LINES('bye');
  const n0 = NARR('ar00'), n1 = NARR('ar01'), n5 = NARR('ar05'), n6 = NARR('ar06'), n7 = NARR('ar07'), n8 = NARR('ar08');
  const bSorry = BEAT('sorry'), bFreeze = BEAT('freeze'), bRew = BEAT('rewind', bFreeze + 2), bTitle = BEAT('title', bRew + .6),
    bDoor = BEAT('door_open', dr.t0), bIn = BEAT('come_in'), bWide = BEAT('wide', cl.t1 - 5), bEight = BEAT('eight');
  const tok = (L, i) => L.tok[Math.min(i, L.tok.length - 1)];
  const D0 = D[0], D1 = D[1], D2 = D[2];
  S = { o, st, dr, rt, cl, by, D, D0, D1, D2, E1, R, CL, Y, n0, n1, n5, n6, n7, n8, bSorry, bFreeze, bRew, bTitle, bDoor, bIn, bWide, bEight };

  // ================= the cold open: already at the door (two-shot), the mistake, the freeze =================
  const tHello = tok(D1, 0).t0, tI1 = tok(D1, 1).t0, tI2 = tok(D1, 2).t0, tYou = tok(D1, 3).t0;
  S.tI1 = tI1; S.tI2 = tI2;
  const yO = { id: 'youssef', case: true, base: { turn: .4, face: F('happy', { happy: .3, mo: .03, mw: .1, lx: .55, ly: -.1, sweat: .2 }), armL: PULL, armR: ARM.rest, kmul: 1 },
    blinks: [], jumps: [], moves: [{ t0: -1, t1: -.9, x0: 1310, x1: 1310, k0: .9, k1: .9 }], keys: [] };
  yO.keys.push({ t: tHello - .32, armR: DIP, face: F('happy', { lx: .55, happy: .4 }), d: .15 }, { t: tHello - .12, armR: ARM.wave, d: .2 },
    { t: tI1 - .1, armR: INWARD, face: F('nervous', { lx: .2, ly: .25, sweat: .5 }), trem: .006, d: .2 },
    { t: tI2 - .1, face: F('happy', { bLy: .7, bRy: .7, happy: .15, mw: .1, ms: .7, lx: .55 }), trem: 0, lean: -.02, armR: ARM.rest, d: .25 },
    { t: D1.t1 + .1, face: F('happy', { bLy: .75, bRy: .75, happy: .2, mw: .11, ms: .9, lx: .55 }), lean: 0, d: .3 },
    { t: bSorry + .05, face: F('happy', { bLy: 1, bRy: 1, happy: .1, mw: .1, ms: .5, lx: .5, ly: -.1 }), d: .2 },
    { t: bFreeze, face: { ...EXPR.embarrassed }, armR: ARM.scratch, lean: -.025, turn: .1, d: .01 });
  yO.jumps.push({ t: tHello - .05, h: .05, d: .34 }); yO.blinks.push(tI1 - .1, tI2 - .1);
  const mO = { id: 'mia', base: { turn: -.38, face: F('happy', { lx: -.5, happy: .4 }), armL: ARM.rest, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: 1540, x1: 1540, k0: .9, k1: .9 }], keys: [] };
  mO.keys.push({ t: D0.t0 - .45, armR: DIP, d: .12 }, { t: D0.t0 - .25, armR: ARM.wave, d: .22 }, { t: D0.t1 + .35, armR: ARM.rest, d: .35 },
    { t: tI1, face: F('happy', { lx: -.5, bLy: .8, bRy: .8, happy: .1 }), d: .3 }, { t: tYou + .25, face: F('puzzled', { lx: -.55 }), d: .3 },
    { t: D2.t0 - .4, lean: -.095, armR: CUP, d: .25 }, { t: D2.t0 - .12, lean: -.065, d: .35 });
  mO.blinks.push(D0.t0 - .35, tYou + .25);
  S.yO = yO; S.mO = mO;
  S.camO = [
    { t: -1, ...TWO }, { t: 0, d: Math.max(.5, D1.t0), x: 1412, y: 670, z: 1.9 },
    { t: D1.t0, d: Math.max(.5, D1.t1 - D1.t0), x: 1395, y: 672, z: 1.97 },
    { t: bSorry, d: 0, x: 1362, y: 676, z: 3.45 },
  ];

  // ================= the street: he walks to school rehearsing out loud; the door opens =================
  const happyWalk = F('happy', { mo: .03, mw: .1, happy: .25, lx: .5, ly: -.15 });
  const walk0 = bTitle + .15, arrive = bDoor - .35;
  const yA = { id: 'youssef', case: true, base: { turn: .5, face: happyWalk, armL: PULL, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: walk0, t1: arrive, x0: -320, x1: 1310, k0: .9, k1: .9 }], keys: [] };
  const K = yA.keys, J = yA.jumps, BL = yA.blinks;
  const tNY = nwT('ar01', has('نيويورك'), .7), tEng = nwT('ar01', has('مهندس'), .2), tPrac = nwT('ar01', has('بتمر'), .9);
  K.push({ t: tEng - .1, face: F('happy', { bLy: .8, bRy: .8, happy: .5, mw: .12, mo: .04, lx: .5, ly: -.3 }), d: .3 },
    { t: tNY - .3, face: F('joy', { lx: -.2, ly: -.6 }), d: .25 }, { t: tNY + .9, face: happyWalk, d: .3 },
    { t: tPrac - .2, face: F('happy', { bLy: .8, bRy: .8, happy: .3, mw: .11, mo: .03, ms: .9, lx: .3, ly: .1 }), d: .3 });
  J.push({ t: tNY - .2, h: .05, d: .36 }); BL.push(tEng - .1, tNY - .3, tPrac - .2);
  // EN-1a: "Hello!" (a small trial wave, under his breath) — "Hi!" (a nod) — "Hello!" (the big confident wave + a hop)
  const e = E1 ? E1.tok : [];
  const tE0 = e[0] ? e[0].t0 : arrive - 3, tE1 = e[1] ? e[1].t0 : tE0 + 1, tE2 = e[2] ? e[2].t0 : tE1 + 1;
  K.push({ t: tE0 - .3, armR: { ...ARM.wave, w: .4, dy: -.12 }, face: F('happy', { happy: .3, lx: .3, ly: .1 }), d: .2 }, { t: tE0 + .55, armR: ARM.rest, d: .25 },
    { t: tE1 - .15, face: F('happy', { happy: .55, mw: .12, lx: .5, bLy: .8, bRy: .8 }), sq: 1.03, d: .2 }, { t: tE1 + .4, sq: 1, d: .2 },
    { t: tE2 - .32, armR: DIP, d: .14 }, { t: tE2 - .12, armR: ARM.wave, face: F('joy', { lx: .4 }), d: .2 },
    { t: arrive + .1, armR: ARM.rest, face: F('happy', { happy: .45, lx: .55, mw: .12 }), turn: .4, d: .3 },
    // the door opens: a gulp
    { t: bDoor + .05, face: F('surprised', { lx: .6, ly: -.1, sweat: .2 }), d: .15 });
  J.push({ t: tE2 - .05, h: .07, d: .38 }); BL.push(tE1 - .15, bDoor + .05);
  // ---- the door: the close-up under AR-05 (hands on his head → a sheepish scratch) ----
  const tHear = nwT('ar05', has('سمعتن'), .3), tWrong = nwT('ar05', has('غلط'), .85);
  S.cu0 = n5 ? n5.t0 - .15 : dr.t0 + .4;
  K.push({ t: S.cu0, face: F('embarrassed', { lx: .6, ly: -.05 }), armR: ARM.scratch, lean: -.02, turn: .3, d: .01 },
    { t: tHear - .1, face: F('worried', { lx: .7, ly: -.1, sweat: .8, bLr: .6, bRr: .6 }), armR: ARM.rest, lean: 0, d: .25 },
    { t: tWrong - .45, face: F('nervous', { lx: -.1, ly: .05, sweat: 1, mt: 1, pupil: .8 }), turn: .1, armR: INWARD, trem: .005, d: .25 });
  BL.push(S.cu0 + .3, tHear - .1, tWrong - .45);
  // ---- retry (as the original, keyed to the EN-2 lines) ----
  const R0 = R[0], R1 = R[1], R2 = R[2], R3 = R[3], R4 = R[4] || R[R.length - 1];
  K.push({ t: rt.t0, face: F('nervous', { mt: .3, mo: .02, ms: .4, lx: .55, sweat: .3, blush: .7 }), armR: ARM.rest, lean: 0, turn: .4, trem: 0, d: .2 },
    { t: R0.t0 + .3, face: F('happy', { happy: .1, lx: .55, ly: -.05, bLy: .5, bRy: .5, mo: 0, ms: .4, sweat: .1 }), lean: .015, d: .4 },
    { t: R1.t0 - .25, armR: ARM.chest, face: F('talk', { bLy: .55, bRy: .55, lx: .5, mo: 0, ms: .6, blush: .5 }), d: .3 },
    { t: R1.t1 - .25, face: F('happy', { happy: .45, lx: .55 }), d: .25 },
    { t: R2.t0 + .1, face: F('joy', { lx: .55 }), armR: ARM.rest, lean: 0, d: .2 },
    { t: R3.t0 - .1, face: F('happy', { happy: .6, mw: .13, lx: .55, blush: .7 }), armR: OPEN, d: .25 },
    { t: R3.t1 + .05, face: F('joy', { lx: .55 }), armR: ARM.rest, d: .2 },
    { t: R4.t0 + .2, face: F('happy', { happy: .4, lx: .7, ly: -.2 }), d: .3 });
  J.push({ t: R2.t0 + .25, h: .04, d: .34 }, { t: R3.t1 + .02, h: .08, d: .42 }); BL.push(rt.t0, R1.t0 - .25, R2.t0 + .1);
  const inY0 = R4.t1 + .35, inY1 = inY0 + 1.8;
  yA.moves.push({ t0: inY0, t1: inY1, x0: 1310, x1: 1530, y0: GROUND, y1: 800, k0: .9, k1: .62, step: .42 });
  K.push({ t: inY0 - .1, turn: 1.3, d: .5 }, { t: inY0 + .5, turn: 2.05, d: .6 }, { t: inY1 - .45, clip: 1 }, { t: inY1 - .4, alpha: 0, d: .45 });
  // ---------------- Sara (id mia): out of the door → retry → in ----------------
  const mA = { id: 'mia', base: { turn: 0, face: F('happy', { lx: -.4 }), armL: ARM.rest, armR: ARM.rest, alpha: 0, clip: 1, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: bDoor + .15, t1: bDoor + 1.0, x0: 1530, x1: 1540, y0: 800, y1: GROUND, k0: .6, k1: .9, step: .42 }], keys: [] };
  const MK = mA.keys;
  MK.push({ t: bDoor, alpha: 1, d: .01 }, { t: bDoor + .2, clip: 0, d: .6 }, { t: bDoor + .25, turn: -.38, d: .5 },
    { t: bDoor + .7, face: F('puzzled', { lx: -.55 }), lean: -.05, d: .3 },
    { t: rt.t0, face: F('happy', { happy: .35, lx: -.55, bLy: .6, bRy: .6 }), lean: -.03, armL: OPEN, d: .3 },
    { t: R0.t1 + .3, armL: ARM.rest, lean: -.01, d: .4 },
    { t: tok(R1, 3).t0 + .1, face: F('joy', { lx: -.5 }), d: .2 },
    { t: R2.t0 - .2, armL: CLAP, armR: CLAP, d: .2 }, { t: R2.t0 + .9, armL: ARM.rest, armR: ARM.rest, face: F('happy', { lx: -.5, happy: .5 }), d: .35 },
    { t: R3.t1 + .1, face: F('joy', { lx: -.5 }), d: .2 },
    { t: R4.t0 - .25, turn: -.15, armL: POINT, face: F('happy', { lx: -.6, happy: .5 }), d: .25 },
    { t: R4.t1 + .1, armL: ARM.rest, d: .3 });
  mA.jumps.push({ t: R2.t0 + .05, h: .05, d: .36 }); mA.blinks.push(rt.t0, R2.t0 - .2);
  mA.moves.push({ t0: R4.t0 - .25, t1: R4.t0 + .35, x0: 1540, x1: 1660, step: .6 });
  const inM0 = R4.t1 + .05, inM1 = inM0 + 1.35;
  mA.moves.push({ t0: inM0, t1: inM1, x0: 1660, x1: 1530, y0: GROUND, y1: 800, k0: .9, k1: .6, step: .48 });
  MK.push({ t: inM0, turn: 1.0, d: .35 }, { t: inM0 + .35, turn: 2.05, d: .5 }, { t: inM1 - .4, clip: 1 }, { t: inM1 - .35, alpha: 0, d: .4 });
  S.doorClose = Math.min(inY1 + .2, rt.t1 - .5);
  Object.assign(S, { yA, mA, arrive, R4 });
  // ---------------- cameras: the walk, the door (a wider angle), the close-up, the two-shot ----------------
  const yx = tt => charState(yA, tt).x;
  S.camA = [
    { t: -1, x: 160, y: 520, z: 1.12 },                                   // under the title: the street, waiting for him
    { t: walk0 + .3, d: 2.4, f: tt => ({ x: clamp(yx(tt - .5) + 300, 160, 1300), y: 575, z: 1.05 }) },
    { t: arrive - 1.6, d: 1.9, ...DOORCAM },
    { t: S.cu0, d: 0, x: 1350, y: 680, z: 3.05 }, { t: S.cu0 + .05, d: Math.max(.5, rt.t0 - S.cu0), x: 1344, y: 676, z: 3.2 },
    { t: rt.t0, d: 0, ...TWO },
    { t: R2.t0, d: 2.2, x: 1430, y: 664, z: 1.93 },
    { t: R4.t1 - .1, d: 1.5, x: 1330, y: 590, z: 1.32 },
    { t: S.doorClose + .2, d: Math.max(1, rt.t1 - S.doorClose), x: 1400, y: 540, z: 1.5 },
  ];
  S.taxi0 = n1 ? n1.t0 + .4 : st.t0 + 1; S.taxi1 = S.taxi0 + 6.5;

  // ================= the class =================
  buildClass();

  // ================= bye: the golden afternoon at the door =================
  const Y0 = Y[0], Y1 = Y[1], Y2 = Y[2], Y3 = Y[3] || Y[Y.length - 1];
  const mD = { id: 'mia', base: { turn: -.38, face: F('happy', { lx: -.5, happy: .45, lid: .05 }), armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: 1540, x1: 1540, k0: .9, k1: .9 }], keys: [] };
  mD.keys.push({ t: Y0.t0 - .35, armR: DIP, face: F('happy', { lx: -.5, happy: .5 }), d: .15 }, { t: Y0.t0 - .15, armR: ARM.wave, d: .22 },
    { t: Y0.t1 + .2, armR: ARM.rest, d: .35 },
    { t: Y2.t0 - .35, armR: CUP, lean: -.05, face: F('happy', { lx: -.75, happy: .45 }), d: .25 },
    { t: Y2.t1 + .25, armR: ARM.wave, lean: -.02, d: .3 }, { t: Y2.t1 + 1.6, armR: ARM.rest, d: .4 });
  mD.blinks.push(Y0.t0 - .35, Y2.t0 - .35);
  const yD = { id: 'youssef', case: true, base: { turn: .4, face: F('happy', { happy: .4, lid: .15, lx: .55 }), armL: PULL, armR: ARM.rest, alpha: 1, kmul: 1, caseSide: -1 },
    blinks: [], jumps: [], keys: [], moves: [{ t0: -1, t1: -.9, x0: 1310, x1: 1310, k0: .9, k1: .9 }] };
  const walkAway0 = Y1.t1 + .25, walkAway1 = Math.max(walkAway0 + 1.1, Y2.t0 + .4);
  yD.moves.push({ t0: walkAway0, t1: walkAway1, x0: 1310, x1: 1080 });
  const tSabah = nwT('ar08', has('الصبح'), .2), tAdrus = nwT('ar08', has('أدرس'), .55), tArmy = nwT('ar08', has('الجيش'), .9);
  yD.keys.push({ t: Y0.t1 - .2, face: F('happy', { happy: .5, lx: .55, lid: .1 }), d: .3 },
    { t: Y1.t0 - .3, armR: DIP, d: .15 }, { t: Y1.t0 - .1, armR: ARM.wave, d: .22 }, { t: Y1.t1, armR: ARM.rest, d: .3 },
    { t: walkAway0 - .55, turn: -.5, caseSide: 1, d: .75 },
    { t: walkAway0 - .2, armL: ARM.rest, armR: PULL, face: F('happy', { happy: .35, lx: -.5, lid: .1 }), d: .3 },
    { t: bEight - .12, turn: .22, face: F('surprised', { pupil: .55, mo: .085, mw: .07, lx: .3, ly: -.1, sweat: .6, blush: .3 }), armL: RAISE, d: .14 },
    { t: tSabah + .1, face: F('surprised', { pupil: .5, mo: .1, mw: .065, lx: .1, ly: -.2, sweat: .9, mwob: .5 }), d: .25 },
    { t: tAdrus - .2, face: F('worried', { lx: -.4, ly: .3, sweat: .9, mwob: 1 }), turn: .15, d: .3 },
    { t: tArmy - .1, face: F('neutral', { lid: .48, lx: 0, ly: 0, mw: .085, ms: -.1, bLy: -.1, bRy: -.1, bLr: 0, bRr: 0, sweat: .6, blush: .3 }), turn: 0, d: .2 });
  yD.jumps.push({ t: bEight - .1, h: .09, d: .36 }); yD.blinks.push(bEight - .12, tArmy - .1);
  Object.assign(S, { mD, yD, Y3 });
  const ye = charState(yD, bEight).x;
  S.camD = [
    { t: by.t0 - 1, x: 1440, y: 660, z: 1.95 }, { t: by.t0, d: 1.2, ...TWO },
    { t: Y1.t1 - .1, d: 1.2, x: 1290, y: 640, z: 1.5 },
    { t: bEight, d: 0, x: ye + 70, y: 672, z: 3.2 },
    { t: bEight + .4, d: Math.max(1, by.t1 - bEight), x: ye + 66, y: 668, z: 3.38 },
  ];
  S.alarm = [Y3.t1 + .12, n8 ? n8.t1 + .3 : Y3.t1 + 3];

  // ---------------- sound cues ----------------
  for (const L of [...D, E1, ...R, ...CL, ...Y].filter(Boolean)) cue(L.t0 - .18, 'bubble', { who: L.who, text: L.text });
  cue(.1, 'ambience_street', { dur: rt.t1 - .1, note: 'New York morning street bed' });
  cue(bSorry, 'cut_in', { note: 'close-up on Youssef' });
  cue(bFreeze, 'freeze', { note: 'freeze-frame on "Sorry?"' });
  cue(bRew, 'rewind', { dur: bTitle - bRew, note: 'VHS tape scrub back' });
  cue(bTitle, 'unfreeze', { note: 'play' });
  steps(yA, 'youssef', bTitle, rt.t1); steps(mA, 'mia', bTitle, rt.t1); steps(yD, 'youssef', by.t0, by.t1);
  rolls(yA, bTitle, rt.t1); rolls(yD, by.t0, by.t1);
  cue(S.taxi0, 'taxi', { dur: S.taxi1 - S.taxi0, pan: 'right_to_left', note: 'the yellow cab passes behind' });
  cue(tNY - .2, 'pop', { note: 'excited hop' });
  cue(tE2 - .05, 'sparkle', { note: 'the confident Hello!' });
  cue(arrive - 1.6, 'whoosh', { note: 'to the door angle' });
  cue(bDoor, 'door_open');
  cue(S.cu0, 'cut_in', { note: 'close-up on Youssef (after "Sorry?")' });
  cue(rt.t0, 'cut', { note: 'the two-shot' });
  cue(R4.t1 - .1, 'whoosh', { note: 'pull back' });
  cue(S.doorClose, 'door_close');
  cue(by.t0, 'cut', { note: 'afternoon' });
  cue(by.t0 + .1, 'ambience_afternoon', { dur: by.t1 - by.t0 - .1 });
  cue(bEight - .1, 'sting_shock', { note: 'Eight?!' });
  cue(S.alarm[0], 'thought');
  cue(S.alarm[0] + .25, 'alarm', { dur: Math.min(2.5, S.alarm[1] - S.alarm[0] - .3) });
  return S;
}
function steps(C, who, a, b) {   // one 'step' cue per hop landing
  for (const m of C.moves) {
    if (m.glide || m.x0 === m.x1) continue;
    const D = m.t1 - m.t0, n = Math.max(1, Math.round(D / (m.step || .42)));
    for (let i = 0; i < n; i++) { const tt = m.t0 + D * (i + .68) / n; if (tt >= a && tt < b) cue(tt, 'step', { who }); }
  }
}
function rolls(C, a, b) { for (const m of C.moves) if (m.t0 >= a && m.t0 < b && m.x0 !== m.x1) cue(m.t0, 'suitcase_roll', { dur: m.t1 - m.t0 }); }

// ---------------- the class: Leo's exchange, Mei's, the wide ----------------
function buildClass() {
  const cl = S.cl, CL = S.CL, bWide = S.bWide, n7 = S.n7;
  const LN = (who, re) => CL.find(l => l.who === who && re.test(l.text)) || null;
  const L0 = LN('leo', /^Hey/), L1 = LN('youssef', /^Hi, Leo/), L2 = LN('leo', /^Nice/), M0 = LN('mei', /^Hello/), M1 = LN('youssef', /^My name/),
    M2 = LN('mei', /^Sorry/), M3 = LN('youssef', /^Youssef!/), M4 = LN('mei', /^Oh/);
  Object.assign(S, { L0, L1, L2, M0, M1, M2, M3, M4 });
  const c0 = cl.t0, tM = M0 ? M0.t0 - .3 : c0 + 6;
  const tCount = n7 ? n7.tok.filter(o => /مرة|واتنين|وتلاتة/.test(o.w)).map(o => o.t0) : [];
  S.tCount = tCount;
  // ---- Sara at the board, watching; claps on the wide ----
  const sRest = F('happy', { lx: .5, happy: .4 });
  const mC = { id: 'mia', base: { turn: .42, face: sRest, armL: ARM.rest, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: XC.mia, x1: XC.mia, k0: .9, k1: .9 }], keys: [] };
  mC.keys.push({ t: M3 ? M3.t0 : c0 + 12, face: F('joy', { lx: .7 }), d: .2 },
    { t: bWide - .1, armL: CLAP, armR: CLAP, face: F('joy', { lx: .6 }), d: .16 }, { t: bWide + 1.1, armL: ARM.rest, armR: ARM.rest, face: F('happy', { lx: .7, happy: .6 }), d: .3 });
  for (const x of tCount) mC.jumps.push({ t: x, h: .02, d: .26 });
  // ---- Leo (right desk): turns round to Youssef ----
  const lRest = F('happy', { lx: -.6, happy: .4 });
  const lC = { id: 'leo', base: { turn: -.2, face: F('happy', { lx: -.2, ly: -.2, happy: .3 }), armL: ARM.rest, armR: ARM.rest, kmul: 1, seat: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: XC.leo, x1: XC.leo, k0: .9, k1: .9 }], keys: [] };
  const LK = lC.keys;
  if (L0) LK.push({ t: c0, turn: -.45, face: F('joy', { lx: -.75 }), d: .01 },
    { t: L0.t0 - .3, armL: FR(DIP), d: .12 }, { t: L0.t0 - .12, armL: FR(ARM.wave), d: .2 }, { t: L0.t1 + .1, armL: ARM.rest, face: lRest, d: .3 });
  if (L1) LK.push({ t: tokT(L1, /^Youssef/, .5), face: F('happy', { lx: -.75, happy: .6, bLy: .8, bRy: .8 }), d: .2 });
  if (L2) LK.push({ t: L2.t0 - .25, armL: FR(RAISE), face: F('joy', { lx: -.75 }), sq: 1.03, d: .2 }, { t: L2.t1 + .25, armL: ARM.rest, sq: 1, face: lRest, d: .3 });
  LK.push({ t: tM + .4, turn: -.3, face: F('happy', { lx: -.8, happy: .45 }), d: .4 });   // watches Mei and Youssef
  if (M3) LK.push({ t: M3.t1 - .2, face: F('joy', { lx: -.8 }), d: .2 });
  LK.push({ t: bWide - .05, turn: -.35, armL: FR(ARM.wave), face: F('joy', { lx: -.8, ly: -.2 }), d: .2 }, { t: bWide + 1.7, armL: ARM.rest, face: lRest, d: .3 });
  if (L0) lC.jumps.push({ t: L0.t0 - .05, h: .04, d: .3 });
  if (L2) lC.jumps.push({ t: L2.t0 - .05, h: .05, d: .32 });
  lC.jumps.push({ t: bWide + .05, h: .04, d: .32 }, { t: bWide + .5, h: .04, d: .32 });
  lC.blinks.push(c0 + .2, L2 ? L2.t0 - .25 : c0 + 4, bWide);
  // ---- Mei (left desk): shy, the "Sorry?", the delighted "Oh! Hi, Youssef!" ----
  const eRest = F('happy', { lx: .6, happy: .35 });
  const eC = { id: 'mei', base: { turn: .25, face: F('happy', { lx: .4, ly: -.1, happy: .25 }), armL: ARM.rest, armR: ARM.rest, kmul: 1, seat: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: XC.mei, x1: XC.mei, k0: .9, k1: .9 }], keys: [] };
  const EK = eC.keys;
  EK.push({ t: L1 ? L1.t0 : c0 + 2, face: F('happy', { lx: .8, happy: .3 }), d: .4 });
  if (M0) EK.push({ t: tM, turn: .42, face: F('happy', { lx: .75, happy: .45, blush: .7, bLy: .7, bRy: .7 }), d: .3 },
    { t: M0.t0 - .2, armR: FR({ ...ARM.wave, w: .55 }), d: .2 }, { t: tokT(M0, /^What/, .5) - .15, armR: FR(OPEN), face: F('happy', { lx: .8, happy: .4, bLy: .9, bRy: .9 }), d: .25 },
    { t: M0.t1 + .2, armR: ARM.rest, face: eRest, d: .3 });
  if (M2) EK.push({ t: M2.t0 - .3, lean: .06, armR: FR(CUP), face: F('puzzled', { lx: .8 }), d: .25 }, { t: M2.t1 + .45, lean: .02, d: .3 });
  if (M3) EK.push({ t: M3.t0 + .1, lean: 0, armR: ARM.rest, face: F('surprised', { lx: .8, ly: -.3, pupil: .85, mo: .04, mw: .06, bLy: 1, bRy: 1 }), d: .15 });
  if (M4) EK.push({ t: M4.t0 - .15, face: F('joy', { lx: .75, ly: -.25 }), armL: FR(RAISE), d: .18 },
    { t: tokT(M4, /^Hi/, .3) - .2, armL: ARM.rest, armR: FR(ARM.wave), face: F('happy', { lx: .8, ly: -.25, happy: .7, mw: .12 }), d: .22 },
    { t: tokT(M4, /^I'm/, .75) - .2, armR: ARM.rest, armL: FR(ARM.chest), face: F('happy', { lx: .8, ly: -.25, happy: .65 }), d: .25 },
    { t: M4.t1 + .25, armL: ARM.rest, face: F('happy', { lx: .8, ly: -.25, happy: .55 }), d: .3 });
  EK.push({ t: bWide - .05, armR: FR(ARM.wave), face: F('joy', { lx: .8, ly: -.2 }), d: .2 }, { t: bWide + 1.9, armR: ARM.rest, face: F('happy', { lx: .8, ly: -.25, happy: .5 }), d: .3 });
  if (M4) eC.jumps.push({ t: M4.t0 - .1, h: .05, d: .32 });
  eC.jumps.push({ t: bWide + .25, h: .035, d: .3 });
  eC.blinks.push(tM, M2 ? M2.t0 - .3 : c0 + 9, M4 ? M4.t0 - .15 : c0 + 14);
  // ---- Youssef (middle desk): to Leo, then to Mei; stands for "Youssef! I'm Youssef!"; proud on the wide ----
  const yC = { id: 'youssef', base: { turn: .38, face: F('happy', { lx: .7, happy: .45 }), armL: ARM.rest, armR: ARM.rest, kmul: 1, seat: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: XC.youssef, x1: XC.youssef, k0: .9, k1: .9 }], keys: [] };
  const YK = yC.keys;
  if (L1) YK.push({ t: L1.t0 - .3, armR: FR(DIP), d: .12 }, { t: L1.t0 - .12, armR: FR(ARM.wave), face: F('joy', { lx: .75 }), d: .2 },
    { t: tokT(L1, /^I'm/, .35) - .2, armR: ARM.rest, armL: FR(ARM.chest), face: F('happy', { lx: .75, happy: .6, mw: .12, bLy: .8, bRy: .8 }), sq: 1.03, d: .25 },
    { t: tokT(L1, /^Nice/, .7) - .2, armL: ARM.rest, armR: FR(OPEN), sq: 1, face: F('happy', { lx: .8, happy: .5 }), d: .25 },
    { t: L1.t1 + .2, armR: ARM.rest, d: .3 });
  if (L2) YK.push({ t: L2.t1 - .2, face: F('joy', { lx: .8 }), d: .2 });
  YK.push({ t: tM, turn: -.4, face: F('happy', { lx: -.75, happy: .45 }), d: .35 });
  if (M1) YK.push({ t: M1.t0 - .25, armL: FR(OPEN), face: F('happy', { lx: -.8, happy: .4, bLy: .6, bRy: .6 }), d: .25 }, { t: M1.t1 + .15, armL: ARM.rest, d: .3 });
  if (M2) YK.push({ t: M2.t0 + .15, face: F('surprised', { lx: -.8, pupil: .85, mo: .03, mw: .06, bLy: 1, bRy: 1 }), d: .15 },
    { t: M2.t1 + .1, face: F('happy', { lx: -.5, ly: -.1, happy: .4, bLy: .9, bRy: .9 }), d: .2 });
  if (M3) YK.push({ t: M3.t0 - .4, seat: 0, sq: 1.05, lean: -.03, turn: -.3, armL: FR(RAISE), face: F('joy', { lx: -.75, ly: .05 }), d: .3 },
    { t: tokT(M3, /^I'm/, .5) - .25, armL: ARM.rest, armR: FR(ARM.chest), sq: 1.07, lean: -.04, face: F('happy', { lx: -.75, happy: .7, mw: .13, mo: .05, bLy: 1, bRy: 1 }), d: .25 },
    { t: M3.t1 + .2, armR: ARM.rest, sq: 1.02, lean: -.015, face: F('happy', { lx: -.8, happy: .55 }), d: .3 });
  if (M4) YK.push({ t: M4.t0 + .2, face: F('joy', { lx: -.8 }), d: .2 });
  // the wide: proud, a little bow of the head on each count
  YK.push({ t: bWide, turn: -.08, face: F('joy', { lx: -.1, ly: -.05 }), d: .35 });
  tCount.forEach((x, i) => { YK.push({ t: x - .05, sq: 1.05 + .02 * i, d: .12 }, { t: x + .2, sq: 1.02, d: .2 }); yC.jumps.push({ t: x - .02, h: .03 + .015 * i, d: .3 }); });
  if (L1) yC.jumps.push({ t: L1.t0 - .05, h: .03, d: .3 });
  if (M3) yC.jumps.push({ t: M3.t0 - .4, h: .06, d: .34 });
  yC.blinks.push(c0 + .3, tM, M2 ? M2.t0 + .15 : c0 + 9, bWide);
  Object.assign(S, { mC, lC, eC, yC, tM });
  S.board = [{ text: "Hello! I'm ______.", x: 865, y: 282, size: 58, col: P.navy, p: 1 }, { text: 'My name is ______.', x: 865, y: 372, size: 58, col: P.teal, p: 1 }];
  // ---- cameras: Leo's exchange → Mei's → the punch-in on the louder answer → back → the wide ----
  const st = M3 ? M3.t0 - .4 : c0 + 12;
  S.camC = [
    { t: -1, ...PAIR_YL }, { t: c0, d: 0, x: 1268, y: 706, z: 1.78 }, { t: c0 + .05, d: Math.max(1, tM - c0), ...PAIR_YL },
    { t: tM, d: 0, x: 930, y: 704, z: 1.78 }, { t: tM + .05, d: Math.max(1, st - tM), ...PAIR_MY },
    { t: st + .1, d: .35, x: 990, y: 676, z: 2.05 },
    { t: M4 ? M4.t0 - .15 : st + 2, d: .5, x: 930, y: 694, z: 1.86 },
    { t: bWide, d: 0, ...WIDE }, { t: bWide + .05, d: Math.max(1, cl.t1 - bWide), x: 915, y: 606, z: 1.36 },
  ];
  cue(c0, 'cut', { note: 'the classroom' });
  cue(c0 + .05, 'ambience_class', { dur: cl.t1 - c0, note: 'a small warm classroom' });
  cue(tM, 'cut', { note: "Mei's exchange" });
  if (M3) cue(M3.t0 - .4, 'chair', { note: 'Youssef stands up' });
  if (M3) cue(st + .1, 'whoosh', { note: 'punch in: the louder answer' });
  cue(bWide, 'cut', { note: 'the wide: the class waves' });
  cue(bWide + .1, 'cheer', { note: 'a small class cheer' });
  tCount.forEach((x, i) => cue(x, 'sparkle', { note: `count ${i + 1}` }));
}

// ======================================================================================================================
// open (the hook): the two-shot → the close-up on "Sorry?" → the freeze → the VHS rewind; then (after the title) the story world
export function sceneA(c, t) {
  if (t < S.bFreeze) return sceneOpen(c, t);
  if (t < S.bRew) return freezeFrame(c, t);
  if (t < S.bTitle) return rewind(c, t);
  const r = sceneStory(c, t);
  playFlash(c, t);
  return r;
}
function sceneOpen(c, t) {
  const cam = camAt(S.camO, t), dof = dofOf(cam.z);
  drawWorld(c, cam, t, { door: 1, dof, clock: 8.93 });
  const closeUp = t >= S.bSorry;
  const R = {};
  if (!closeUp) R.m = drawActor(c, cam, S.mO, t, { door: 1 });
  R.y = drawActor(c, cam, S.yO, t, { door: 1 });
  const yh = head(R.y, 'youssef'), mh = R.m ? head(R.m, 'mia', 1.12) : null;
  S.D.forEach((L, i) => {
    const nx = S.D[i + 1] ? S.D[i + 1].t0 : null;
    if (L === S.D2) { if (closeUp) lineBubble(c, L, t, { x: 1905, y: 520, side: -1, lift: 120 }, { until: S.bRew }); else if (mh) lineBubble(c, L, t, { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 }, { until: S.bSorry - .01 }); return; }
    if (closeUp) return;
    const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 } : { x: yh[0] + 20, y: yh[1], side: -1, lift: 70 };
    lineBubble(c, L, t, { ...pos, wordFx: L === S.D1 ? (k, tt) => (k === 1 && tt > S.tI1 && tt < S.tI2 ? { shake: tt } : {}) : null }, { next: nx, hold: 1.2 });
  });
  return { cam };
}
// the freeze-frame: the picture at the pop is held (rendered once, cached), desaturated, with a slow push
let FZ = null;
function freezeFrame(c, t) {
  if (!FZ) {
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
    const f = cv.getContext('2d', { willReadFrequently: true });
    const tf = S.bFreeze, cam = camAt(S.camO, tf);
    drawWorld(f, cam, tf, { door: 1, dof: dofOf(cam.z), clock: 8.93 });
    const R = drawActor(f, cam, S.yO, tf + .12, { door: 1 });
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'saturation'; f.fillStyle = 'rgba(128,128,128,.42)'; f.fillRect(0, 0, 1920, 1080); f.globalCompositeOperation = 'source-over';
    FZ = { cv, yh: head(R, 'youssef') };
  }
  const u = eio(seg(t, S.bFreeze, S.bRew)), z = 1 + .05 * u, ax = FZ.yh[0], ay = FZ.yh[1] + 200;
  c.save(); c.setTransform(z, 0, 0, z, ax * (1 - z), ay * (1 - z)); c.drawImage(FZ.cv, 0, 0); c.restore();
  lineBubble(c, S.D2, S.bFreeze + .05, { x: 1905, y: 520, side: -1, lift: 120 }, { until: S.bRew + 1 });
  freezeFx(c, t);
  return {};
}
function freezeFx(c, t) {
  const a = seg(t, S.bFreeze, S.bFreeze + .08);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const v = c.createRadialGradient(960, 540, 420, 960, 540, 1150); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${.38 * a})`);
  c.fillStyle = v; c.fillRect(0, 0, 1920, 1080);
  const fl = 1 - seg(t, S.bFreeze, S.bFreeze + .16); if (fl > 0) { c.fillStyle = `rgba(255,251,240,${.55 * fl})`; c.fillRect(0, 0, 1920, 1080); }
  c.strokeStyle = rgba(P.cream, .9 * a); c.lineWidth = 14; c.strokeRect(22, 22, 1876, 1036);
  c.restore();
}
// the VHS rewind: the open plays backwards fast (accelerating), with scanlines, an RGB split, tracking bands and a ◀◀ badge
let VH = null;
function rewind(c, t) {
  const u = seg(t, S.bRew, S.bTitle), tS = lerp(S.bFreeze - .02, .15, Math.pow(u, 1.35));
  if (!VH) { VH = [0, 1, 2].map(() => { const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; return { cv, g: cv.getContext('2d') }; }); }
  const [A, Rd, Cy] = VH;
  A.g.setTransform(1, 0, 0, 1, 0, 0); A.g.globalAlpha = 1; A.g.globalCompositeOperation = 'source-over'; A.g.filter = 'none';
  sceneOpen(A.g, tS);
  A.g.setTransform(1, 0, 0, 1, 0, 0);
  // tracking: a couple of horizontal bands slide sideways
  const jit = (hash(Math.floor(t * 24) * 3.1) - .5) * 10;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(A.cv, 0, jit);
  // RGB split: a red-only and a cyan-only copy, shifted, screened over a darkened base
  const sh = 7 + 6 * Math.sin(u * 9);
  for (const [B, col, dx] of [[Rd, '#FF2020', -sh], [Cy, '#20E0FF', sh]]) {
    B.g.setTransform(1, 0, 0, 1, 0, 0); B.g.globalCompositeOperation = 'source-over'; B.g.drawImage(A.cv, 0, 0);
    B.g.globalCompositeOperation = 'multiply'; B.g.fillStyle = col; B.g.fillRect(0, 0, 1920, 1080);
  }
  c.globalCompositeOperation = 'screen'; c.globalAlpha = .45; c.drawImage(Rd.cv, -sh, jit); c.drawImage(Cy.cv, sh, jit);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 2; i++) {
    const by = ((u * 1.7 + i * .55) % 1) * 1180 - 60, bh = 26 + 30 * hash(i + Math.floor(t * 24)), off = (hash(i * 9 + Math.floor(t * 24)) - .5) * 90;
    c.drawImage(A.cv, 0, by, 1920, bh, off, by + jit, 1920, bh);
    c.fillStyle = rgba('#FFFFFF', .18); c.fillRect(0, by + jit, 1920, 3);
  }
  // scanlines + a cool video tint + noise specks
  c.fillStyle = 'rgba(20,18,40,.16)'; for (let y = 0; y < 1080; y += 4) c.fillRect(0, y, 1920, 2);
  c.fillStyle = 'rgba(120,160,255,.06)'; c.fillRect(0, 0, 1920, 1080);
  for (let i = 0; i < 70; i++) { const h1 = hash(i * 1.3 + Math.floor(t * 24) * 7.7), h2 = hash(i * 2.9 + Math.floor(t * 24) * 3.1); c.fillStyle = rgba('#FFFFFF', .35 * hash(i)); c.fillRect(h1 * 1920, h2 * 1080, 2 + 10 * hash(i * 5), 2); }
  // the ◀◀ badge, top left
  c.fillStyle = P.cream; c.globalAlpha = .92;
  c.save(); c.translate(84, 92);
  for (const ox of [0, 44]) { c.beginPath(); c.moveTo(ox, 0); c.lineTo(ox + 44, -30); c.lineTo(ox + 44, 30); c.closePath(); c.fill(); }
  c.font = '400 54px "Lilita One"'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText('REW', 112, 4);
  c.restore();
  c.restore();
  return {};
}
// the first frames of the story after the rewind: a short "play" flash (scanlines fading)
function playFlash(c, t) {
  const k = 1 - seg(t, S.bTitle, S.bTitle + .22);
  if (k <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = `rgba(255,251,240,${.35 * k})`; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = `rgba(20,18,40,${.16 * k})`; for (let y = 0; y < 1080; y += 4) c.fillRect(0, y, 1920, 2);
  c.restore();
}

// street → door → retry (one continuous world)
function sceneStory(c, t) {
  const cam = camAt(S.camA, t), dof = dofOf(cam.z);
  const midC = 960 + (cam.x - 960) * .45, bu = seg(t, S.taxi0, S.taxi1);
  const door = t < S.bDoor ? 0 : t < S.doorClose ? eo(seg(t, S.bDoor, S.bDoor + .45)) : 1 - ss(seg(t, S.doorClose, S.doorClose + .45));
  drawWorld(c, cam, t, { door, dof, taxiX: bu > 0 && bu < 1 ? midC + 1300 - 2600 * bu : null, clock: 8.93 });
  const yst = charState(S.yA, t), mst = charState(S.mA, t);
  const closeUp = t >= S.cu0 && t < S.rt.t0;
  const order = (mst.y < yst.y ? [[S.mA, 'm'], [S.yA, 'y']] : [[S.yA, 'y'], [S.mA, 'm']]).filter(([, n]) => !(closeUp && n === 'm'));
  const R = {};
  for (const [C, n] of order) R[n] = drawActor(c, cam, C, t, { door });
  const yh = head(R.y, 'youssef'), mh = R.m && R.m.sx != null ? head(R.m, 'mia', 1.12) : null;
  // EN-1a: he rehearses out loud (his own bubble, word-highlighted)
  if (S.E1 && yh) lineBubble(c, S.E1, t, { x: yh[0] + 20, y: yh[1], side: 1, lift: 70 }, { hold: .9, until: S.bDoor + .1 });
  // the close-up: Sara's "Sorry?" waits at the right edge (silent: the story resumes from that moment)
  if (closeUp) {
    const pop = back(seg(t, S.cu0, S.cu0 + .25), 2), out = seg(t, S.rt.t0 - .25, S.rt.t0 - .05);
    bubble(c, { x: 1905, y: 520, who: 'mia', words: [{ w: 'Sorry?', s: 1 }], side: -1, lift: 120, pop, out });
  }
  // retry: one bubble at a time, tails to the speakers' heads
  if (!closeUp && t >= S.rt.t0 - .3) S.R.forEach((L, i) => {
    const nx = S.R[i + 1] ? S.R[i + 1].t0 : null;
    if (!(L.who === 'mia' ? mh : yh)) return;
    const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 } : { x: yh[0] + 20, y: yh[1], side: -1, lift: 70 };
    lineBubble(c, L, t, pos, { next: nx, hold: 1.2 });
  });
  return { cam };
}

// ======================================================================================================================
// the classroom
function desk(c, cam, x, o) { c.save(); layerT(c, cam, 1); deskFront(c, x, o); c.restore(); c.setTransform(1, 0, 0, 1, 0, 0); }
export function sceneClass(c, t) {
  const cam = camAt(S.camC, t);
  drawClass(c, cam, t, { dof: dofOf(cam.z) * .7, door: 0, board: S.board });
  const R = {};
  R.m = drawActor(c, cam, S.mC, t);
  R.e = drawActor(c, cam, S.eC, t); desk(c, cam, XC.mei, { book: true, pencil: true });
  R.y = drawActor(c, cam, S.yC, t); desk(c, cam, XC.youssef, { book: true });
  R.l = drawActor(c, cam, S.lC, t); desk(c, cam, XC.leo, { pencil: true });
  const hd = { youssef: head(R.y, 'youssef'), mia: head(R.m, 'mia', 1.12), leo: head(R.l, 'leo', 1.1), mei: head(R.e, 'mei', 1.12) };
  const lines = S.CL;
  lines.forEach((L, i) => {
    const nx = lines[i + 1] ? lines[i + 1].t0 : null, hp = hd[L.who];
    if (!hp || hp[0] < 20 || hp[0] > 1900) return;
    if (t >= S.bWide) return;
    const side = hp[0] < 960 ? 1 : -1;
    lineBubble(c, L, t, { x: hp[0] + side * 20, y: hp[1], side, lift: 60, maxW: 1100 }, { next: nx ? Math.min(nx, S.bWide + .35) : S.bWide + .35, hold: 1.0 });
  });
  // the wide: a little sparkle over Youssef on each count ("مرة، واتنين، وتلاتة")
  const yh = hd.youssef;
  if (yh) S.tCount.forEach((x, i) => {
    for (let j = 0; j < 4; j++) { const u = seg(t, x + j * .05, x + .7 + j * .05); if (u <= 0 || u >= 1) continue; const a = j * 1.6 + i * .7, r = 40 + 40 * u;
      sparkle(c, yh[0] + Math.cos(a) * r * 1.4, yh[1] - 20 + Math.sin(a) * r, 14 * Math.sin(Math.PI * u), [P.mustard, P.red, P.teal][j % 3], a); }
  });
  return { cam };
}

// ======================================================================================================================
// goodbye (golden afternoon at the door)
export function sceneD(c, t) {
  const cam = camAt(S.camD, t), dof = dofOf(cam.z), tod = 1;
  drawWorld(c, cam, t, { door: 1, dof, tod, clock: 15.5 });
  const yst = charState(S.yD, t), mst = charState(S.mD, t);
  const order = mst.y < yst.y ? [[S.mD, 'm'], [S.yD, 'y']] : [[S.yD, 'y'], [S.mD, 'm']];
  const R = {};
  for (const [C, n] of order) R[n] = drawActor(c, cam, C, t, { door: 1 });
  grade(c, tod);
  const yh = head(R.y, 'youssef'), mh = head(R.m, 'mia', 1.12);
  const close = t >= S.bEight;
  S.Y.forEach((L, i) => {
    const nx = S.Y[i + 1] ? S.Y[i + 1].t0 : null;
    if (L === S.Y3) { if (close && yh) lineBubble(c, L, t, { x: yh[0] + 150, y: yh[1] + 40, side: 1, lift: 60 }, { hold: 1.3 }); return; }
    if (close || !(L.who === 'mia' ? mh : yh)) return;
    const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 } : { x: yh[0] + (yst.dir < 0 ? -20 : 20), y: yh[1], side: -1, lift: 70 };
    lineBubble(c, L, t, pos, { next: nx, hold: 1.2 });
  });
  const [a0, a1] = S.alarm;
  if (close && t > a0 && t < a1 + .3) {
    const pop = seg(t, a0, a0 + .45), out = seg(t, a1, a1 + .25), ring = seg(t, a0 + .25, a0 + .35) * (1 - seg(t, a0 + 2.6, a0 + 2.9));
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
// a bean head for the recap's name cards: the character drawn big and clipped to the card (faces us, smiling)
export function beanHead(c, id, x, y, k, t, face) {
  const C = { id, base: { turn: 0, face: face || F('happy', { happy: .6 }), armL: ARM.rest, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [], keys: [], moves: [{ t0: -1, t1: -.9, x0: 0, x1: 0, k0: 1, k1: 1 }] };
  const st = charState(C, t), f = faceOf(C, t, st);
  drawChar(c, CAST[id], pose({ ...st, x, y, k, face: f, armL: ARM.rest, armR: ARM.rest, shadow: 0, breathe: Math.sin(t * 2) }));
}
export { charState, drawActor, head, H, TWO };
