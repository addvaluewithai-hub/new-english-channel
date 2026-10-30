// Episode 3 — story scenes: open (the street, early: 7:50), desk (the reception: "I have 26 years." → freeze), fix (Sara: "I'm 26!"),
// sixty (the form insert, "Sixteen?!" / "Sixty! Six-zero!") and room (to the door of Room 4: the hook into episode 4).
// Every time below is derived from timeline.json (sections, beats, lines, narration words); offsets are acting/animation only.
import { P, rgba, mix, dark, rr, ell } from './kit.js';
import { CAST, drawChar, drawForm, drawHand, handPos, drawBag, drawPen, drawSuitcase } from './bean.js';
import { drawWorld, drawReception, drawCounter, toScreen, GROUND, DOOR, CLOCK, ROOM4, COUNTER } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from '/core/lib.js';
import { SEC, BEAT, NARR, LINES, nwT, has } from './tl.js';
import { fold, F, moveAt, hop, liveFace, springAt, smoothArms, EXPR, ARM, pose, CUP, POINT, CLAP, DIP, OPEN, RAISE, REACH, FACEPALM } from './act.js';
import { lineBubble, thought, timeTag, sparkle, bigMark, bubble, check } from './ui.js';
import { cue } from './cues.js';

const H = { youssef: 300, mia: 276, lopez: 270 };
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
  return c || { x: 1060, y: 560, z: 1.05 };
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

// draw one character with a camera. extra.behind(hands, k) / extra.front(hands, k) draw held props (hands: [[x, y, far, dir] ×2]
// in screen px; k = the screen scale); extra.clip: a screen rect [x0, y0, x1, y1] the character is clipped to (going through a door)
function drawActor(c, cam, C, t, extra = {}) {
  const st = charState(C, t);
  if ((st.alpha ?? 1) <= 0) return st;
  const [x, y, Z] = toScreen(cam, 1, st.x, st.y);
  const face = extra.frozenFace || liveFace(C.id, t, st.face, { blinks: C.blinks, extra: C.talkExtra });
  const p = pose({ ...st, ...smoothArms(C, t), x, y, k: st.k * Z, face, pony: C.id === 'mia' ? (extra.pony ?? springAt(springFor(C), t)) : 0,
    quiff: C.id === 'youssef' ? (extra.quiff ?? springAt(springFor(C), t, .25)) : 0, breathe: Math.sin(t * Math.PI * 2 / 3.2 + (C.id === 'mia' ? 1 : C.id === 'lopez' ? 2 : 0)) });
  const hands = (extra.behind || extra.front) ? handPos(CAST[C.id], p) : null;
  c.save();
  if (st.alpha < 1) c.globalAlpha = st.alpha;
  if (extra.clip) { const [a, b, e, d] = extra.clip; c.beginPath(); c.rect(a, b, e - a, d - b); c.clip(); }
  if (extra.behind) extra.behind(hands, p.k);
  drawChar(c, CAST[C.id], p);
  if (extra.front) extra.front(hands, p.k);
  c.restore();
  return { ...st, sx: x, sy: y, Z, hands, ks: p.k };
}
const head = (st, id, f = 1.08) => st && st.sx != null ? [st.sx, st.sy - H[id] * st.k * st.Z * f] : null;
// held props (drawn at a hand, then the hand again over them)
const hand = (c, id, h, k, grip = false) => drawHand(c, CAST[id], h[0], h[1], H[id] * k, { dir: h[3], grip });
const bagIn = (c, id, h, k) => { drawBag(c, h[0], h[1], k); };
// the form held by its top corner: the sheet hangs below and to the camera-left of the hand (chest height, the face stays clear)
const formHeld = (c, id, h, k, side = -1) => { drawForm(c, h[0] + side * .09 * 300 * k, h[1] + .1 * 300 * k, .24 * 300 * k, .3 * 300 * k, { rot: .15 * side, age: .3 }); hand(c, id, h, k); };
const penIn = (c, id, h, k, rot = .5) => { drawPen(c, h[0] - .01 * 270 * k, h[1] + .012 * 270 * k, k, rot); hand(c, id, h, k, true); };

// poses used in this episode (A3 arms; see act.js for the shared set)
const HOLDF = { dx: -.1, dy: .02, w: 0, bend: 55, elv: [1, .6], flex: 1, front: true };    // the form at chest height
const LOOKF = { dx: -.14, dy: -.02, w: 0, bend: 60, elv: [1, .5], flex: 1, front: true };  // lifted a little to read it
const GIVE = { ...REACH, dx: .2, dy: .05 };                                                  // the form held out across the counter (low: the sheet stays under the mouths)
const WRITE = { dx: -.13, dy: .04, w: 0, bend: 55, elv: [1, .8], flex: 1, front: true };    // Mrs. Lopez: a hand on the counter top (with the pen)
const PENUP = { dx: -.1, dy: -.03, w: 0, bend: 60, elv: [1, .6], flex: 1, front: true };    // the pen raised, ready
const ME = { dx: -.2, dy: -.05, w: 0, bend: 45, elv: [.2, 1], flex: .8, front: true };      // "Me?": a hand to her own chest (above the counter)
const WAG = { dx: .14, dy: -.2, w: 1, bend: 50, elv: [1, -.1], flex: 1 };                   // "No, no.": a raised wagging hand
const HANDMOUTH = { dx: -.3, dy: -.14, w: 0, bend: 55, elv: [1, .2], flex: 1 };             // a hand over the mouth (a gasp / a laugh)
const BAGARM = { dx: .03, dy: .16, w: 0, bend: 14, elv: [-1, .35], flex: 0 };               // Sara's tote bag hanging from the near hand
const CLAPF = { ...CLAP, dy: -.06 };                                                         // a clap held a little higher (above the counter)

// ======================================================================================================================
export function buildStory() {
  const op = SEC('open'), dk = SEC('desk'), fx = SEC('fix'), sx = SEC('sixty'), rm = SEC('room'), rc = SEC('recap');
  const DK = LINES('desk'), FX = LINES('fix'), SX = LINES('sixty'), RM = LINES('room');
  const n1 = NARR('ar01'), n2 = NARR('ar02'), n3 = NARR('ar03'), n4 = NARR('ar04'), n5 = NARR('ar05'), n6 = NARR('ar06');
  const bTitle = BEAT('title', op.t1 - 3), bHand = BEAT('hand_over', dk.t0 + 3), bMistake = BEAT('mistake', dk.t0 + 8), bFreeze = BEAT('freeze', dk.t0 + 12),
    bUn = BEAT('unfreeze', fx.t0), bSaraIn = BEAT('mia_enters', fx.t0), bWrite = BEAT('write', sx.t0), bAsk = BEAT('ask', sx.t0 + 2), bSixteen = BEAT('sixteen', sx.t0 + 6),
    bLaugh = BEAT('laugh', sx.t0 + 8), bWalk = BEAT('walk', rm.t0 + 3), bDoor = BEAT('door_open', rm.t1 - 6);
  const tok = (L, i) => L.tok[Math.max(0, Math.min(i, L.tok.length - 1))];
  const tokW = (L, re, d = 0) => (L.tok.find(o => re.test(o.w)) || L.tok[Math.min(d, L.tok.length - 1)]);
  S = { op, dk, fx, sx, rm, rc, DK, FX, SX, RM, n1, n2, n3, n4, n5, n6, bTitle, bHand, bMistake, bFreeze, bUn, bSaraIn, bWrite, bAsk, bSixteen, bLaugh, bWalk, bDoor };

  // ================= open: an early, calm walk to school with the form; the school clock says 7:50 =================
  const tEarly = nwT('ar01', has('بدري'), .45), tArrived = nwT('ar01', has('ووصلت'), .65), tTen = nwT('ar01', has('دقايق'), .9);
  const tForm = nwT('ar02', has('الاستمارة'), .2), tAll = nwT('ar02', has('كلها'), .55), tOne = nwT('ar02', has('واحدة'), .9);
  const tW0 = .25, tW1 = Math.max(tW0 + 3.6, Math.min(tArrived + .2, (n1 ? n1.t1 : 6) - .5));
  const yO = { id: 'youssef', base: { turn: .5, face: F('happy', { happy: .35, lx: .5, mw: .11 }), armL: ARM.rest, armR: HOLDF, kmul: 1 }, blinks: [], jumps: [], hopAmp: .75,
    moves: [{ t0: tW0, t1: tW1, x0: -300, x1: 1240, k0: .9, k1: .9, step: .42 }], keys: [] };
  yO.keys.push({ t: tEarly - .2, face: F('happy', { happy: .55, lx: .6, ly: -.5, mw: .12, bLy: .8, bRy: .8 }), d: .3 },
    // arrives: looks up at the clock (7:50), proud: chest out, hand on the chest
    { t: tW1 - .05, turn: .35, face: F('happy', { happy: .45, lx: .7, ly: -.9, bLy: .7, bRy: .7, mw: .11 }), d: .35 },
    { t: tTen - .25, armL: ARM.chest, sq: 1.05, lean: -.03, face: F('joy', { bLy: .85, bRy: .85, mw: .12, mo: .05, lx: .3 }), d: .25 },
    { t: tTen + 1.0, armL: ARM.rest, sq: 1, lean: 0, face: F('happy', { happy: .5, lx: .1, ly: 0 }), turn: .25, d: .35 },
    // "ومعايا الاستمارة": lifts the form and reads it; "كلها": happy; "إلا خانة واحدة": worried
    { t: tForm - .2, armR: LOOKF, face: F('happy', { happy: .3, lx: .2, ly: .65, bLy: .5, bRy: .5 }), d: .35 },
    { t: tAll - .1, face: F('joy', { lx: .1, ly: .3 }), d: .25 },
    { t: tOne - .25, face: F('worried', { lx: 0, ly: .2, sweat: .7, bLr: .7, bRr: .7 }), trem: .003, d: .3 },
    { t: bTitle - .2, armR: HOLDF, face: F('nervous', { lx: .2, ly: -.1, sweat: .8, mo: .02 }), trem: 0, d: .4 });
  yO.jumps.push({ t: tTen - .2, h: .035, d: .34 });
  yO.blinks.push(tW1, tTen - .25, tForm - .2, tOne - .25);
  S.yO = yO; S.tW1 = tW1; S.tTen = tTen; S.tOne = tOne;
  const yx = tt => charState(yO, tt).x;
  S.camO = [
    { t: -1, f: tt => ({ x: Math.max(240, yx(tt - .35) + 280), y: 575, z: 1.05 }) },
    { t: tW1 - 1.6, d: 2.0, x: 1330, y: 566, z: 1.22 },
    { t: bTitle - .3, d: Math.max(1, dk.t0 - bTitle), x: 1390, y: 560, z: 1.3 },
  ];

  // ================= desk: the reception — the form, "How old are you?", "I have 26 years." → freeze =================
  const [D0, D1, D2, D3, D4] = [0, 1, 2, 3, 4].map(i => DK[Math.min(i, DK.length - 1)]);
  const tTake = bHand + .4, tDown = tTake + .7;   // she takes the form, then lays it on the counter
  const tCairo = tokW(D2, /^Cairo/i, 2).t0, tHowOld = tokW(D2, /^how/i, 4).t0;
  const YX = 1225, LX = 1480, LY = 840, SXP = 960;
  const yD = { id: 'youssef', base: { turn: .5, face: F('happy', { happy: .45, lx: .5, mw: .11 }), armL: ARM.rest, armR: HOLDF, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: dk.t0 + .05, t1: dk.t0 + 1.05, x0: 780, x1: YX, k0: .9, k1: .9, step: .38 }], keys: [] };
  const lD = { id: 'lopez', base: { turn: -.42, face: F('neutral', { lx: -.2, ly: .65, lid: .15, mw: .08, ms: .3 }), armL: ARM.rest, armR: WRITE, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: LX, x1: LX, y0: LY, y1: LY, k0: .9, k1: .9 }], keys: [] };
  const mD = { id: 'mia', base: { turn: .4, face: F('happy', { lx: .5, happy: .4 }), armL: BAGARM, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: bSaraIn + .05, t1: bSaraIn + 1.05, x0: 330, x1: SXP, k0: .9, k1: .9, step: .35 }], keys: [] };
  const YK = yD.keys, LK = lD.keys, MK = mD.keys;
  // Mrs. Lopez: writing → looks up "Good morning! Can I help you?" → takes the form, reads it → pen up "how old are you?" → puzzled echo
  LK.push({ t: D0.t0 - .45, face: F('happy', { lx: -.55, ly: -.1, happy: .5, mw: .12 }), armR: ARM.rest, d: .3 },
    { t: D0.t1 + .2, face: F('happy', { lx: -.55, happy: .45 }), d: .3 },
    { t: bHand - .1, armL: GIVE, lean: -.04, face: F('happy', { lx: -.6, ly: .2, happy: .4 }), d: .3 },
    { t: tTake + .1, armL: { ...WRITE, dx: -.05 }, lean: 0, d: .4 },
    { t: tDown - .05, armL: ARM.rest, face: F('neutral', { lx: -.35, ly: .75, lid: .2, mw: .09, ms: .4 }), d: .35 },
    { t: tCairo - .1, face: F('happy', { lx: -.3, ly: .7, happy: .3, mw: .11, bLy: .6, bRy: .6 }), d: .25 },
    { t: tHowOld - .35, armR: PENUP, face: F('happy', { lx: -.6, ly: -.05, happy: .45, mw: .12, bLy: .5, bRy: .5 }), d: .3 },
    // "I have 26 years." — her smile freezes; "You… have… 26 years?" puzzled, leaning in
    { t: bMistake + .25, face: F('puzzled', { lx: -.6, ly: -.05 }), d: .25 },
    { t: D4.t0 - .1, face: F('puzzled', { lx: -.6, ly: -.15, bLy: 1, mw: .07 }), lean: -.05, d: .35 },
    // after the freeze: she waits, amused
    { t: bUn, face: F('happy', { lx: -.6, ly: -.05, happy: .25, bLy: .8, bRy: .4 }), lean: -.02, d: .2 });
  // Youssef: walks in with the form; hands it over; proud "I have 26 years."; the freeze pop
  YK.push({ t: D0.t1 - .1, face: F('happy', { happy: .5, lx: .55, mw: .12 }), d: .3 },
    { t: bHand - .15, armR: GIVE, lean: .03, d: .25 },
    { t: tTake + .25, armR: ARM.rest, lean: 0, face: F('happy', { happy: .5, lx: .55, ly: .1, mw: .12 }), d: .4 },
    { t: tHowOld - .1, face: F('happy', { happy: .35, lx: .55, bLy: .8, bRy: .8, mw: .11 }), d: .25 },
    { t: bMistake - .15, armL: ARM.chest, sq: 1.05, lean: -.03, face: F('joy', { bLy: .85, bRy: .85, mw: .12, mo: .05, lx: .55 }), d: .25 },
    { t: D3.t1 + .2, sq: 1.02, lean: -.015, face: F('happy', { happy: .6, lx: .55, mw: .12 }), d: .3 },
    { t: D4.t0 + .15, sq: 1, lean: 0, armL: ARM.rest, face: F('puzzled', { lx: .55, ly: -.05, sweat: .3 }), d: .3 },
    { t: bFreeze, face: F('embarrassed', { lx: .2, ly: .2 }), armL: ARM.scratch, lean: -.025, turn: .3, d: .01 },
    // unfreeze: still embarrassed; Sara arrives
    { t: bUn, face: F('embarrassed', { lx: .5, ly: .1, happy: .2 }), armL: ARM.rest, lean: 0, turn: .5, d: .3 });
  yD.jumps.push({ t: bMistake - .1, h: .035, d: .34 });
  yD.blinks.push(bHand - .15, bMistake - .15, D4.t0 + .15);
  lD.blinks.push(D0.t0 - .45, tDown - .05, tHowOld - .35, D4.t0 - .1);
  // ================= fix: Sara whispers the fix; "Oh! I'm 26!"; ar04 (a push in on Youssef) =================
  const [F0, F1] = [FX[0], FX[1] || FX[0]];
  const tNotHave = F0.tok.length > 2 ? tok(F0, 1).t0 : F0.t0 + .5, tSay = tokW(F0, /^Say/i, 3).t0;
  const tAge = nwT('ar04', has('سنّك'), .3), tIm = nwT('ar04', w => /^I'm 26/.test(w), .55), tTired = nwT('ar04', w => /^I'm tired/.test(w), .85);
  MK.push({ t: bSaraIn + .9, face: F('happy', { lx: .55, happy: .45 }), d: .3 },
    { t: F0.t0 - .25, armR: { ...CUP, front: true }, lean: .05, face: F('happy', { lx: .6, ly: -.05, happy: .25, mw: .1, bLy: .7, bRy: .7 }), d: .25 },
    { t: tSay - .05, face: F('happy', { lx: .6, happy: .45, bLy: .8, bRy: .8, mw: .11 }), d: .2 },
    { t: F0.t1 + .25, armR: ARM.rest, lean: 0, d: .3 },
    { t: F1.t1 + .1, face: F('joy', { lx: .55 }), d: .25 }, { t: F1.t1 + 1.2, face: F('happy', { lx: .6, happy: .5 }), d: .3 },
    { t: tAge - .1, face: F('happy', { lx: .55, happy: .4, lid: .1 }), d: .3 });
  YK.push({ t: bSaraIn + .5, turn: .15, face: F('surprised', { lx: -.5, pupil: .85, mo: .03, mw: .06, blush: .7 }), d: .3 },
    { t: F0.t0 - .1, turn: -.35, face: F('puzzled', { lx: -.6, ly: .05, blush: .6 }), lean: -.03, d: .3 },
    { t: tSay, face: F('surprised', { lx: -.6, pupil: .8, bLy: 1, bRy: 1, mo: .03, mw: .06, blush: .5 }), d: .2 },
    // "Oh! I'm 26!": a raised finger, back to Mrs. Lopez, delighted
    { t: F1.t0 - .1, turn: .5, armL: RAISE, lean: 0, face: F('joy', { lx: .55, mw: .13 }), d: .2 },
    { t: F1.t1 + .4, armL: ARM.rest, face: F('happy', { happy: .55, lx: .55, mw: .12 }), d: .35 },
    // ar04: to us — "إنت سنّك" a nod, the hand on the chest on "I'm 26", a tired slump on "I'm tired"
    { t: n4 ? n4.t0 + .1 : F1.t1 + 1, turn: .2, face: F('happy', { happy: .4, lx: 0, ly: 0, mw: .11 }), d: .35 },
    { t: tAge - .1, sq: .96, d: .12 }, { t: tAge + .05, sq: 1, d: .15 },
    { t: tIm - .2, armL: ARM.chest, face: F('joy', { lx: 0, bLy: .85, bRy: .85, mw: .12 }), d: .25 },
    { t: tTired - .15, armL: ARM.rest, sq: .965, lean: .02, face: F('neutral', { lid: .55, bLy: .05, bRy: .05, bLr: .4, bRr: .4, mw: .09, ms: .1, lx: 0, ly: .2 }), d: .3 },
    { t: tTired + 1.0, sq: 1, lean: 0, face: F('happy', { happy: .6, lx: .2, mw: .12 }), d: .3 });
  yD.jumps.push({ t: F1.t0 - .05, h: .04, d: .34 });
  yD.blinks.push(bSaraIn + .5, F0.t0 - .1, F1.t0 - .1, tIm - .2, tTired - .15);
  LK.push({ t: F1.t0, face: F('happy', { lx: -.6, happy: .55, mw: .12, bLy: .7, bRy: .7 }), lean: 0, d: .3 }, { t: F1.t1 + .3, armR: WRITE, face: F('happy', { lx: -.4, ly: .5, happy: .35 }), d: .35 });
  mD.blinks.push(bSaraIn + .9, F0.t0 - .25, F1.t1 + .1);
  // ================= sixty: the form insert (26 is written), "And you? How old are you?", "Sixteen?!", the laugh =================
  const [X0, X1, X2, X3, X4] = [0, 1, 2, 3, 4].map(i => SX[Math.min(i, SX.length - 1)]);
  const tIns0 = bWrite - .1, tIns1 = Math.min(X1.t0 - .25, bWrite + 1.9);
  const tMe = X2.t0, tHa = tokW(X2, /^Ha/i, 1).t0, tSixty1 = tokW(X2, /^sixty/i, 3).t0;
  const tThank = tokW(X4, /^thank/i, 2).t0, tNoNo = tokW(X4, /^No/, 4).t0, tSixty2 = tokW(X4, /^Sixty/, 6).t0, tSixZero = tokW(X4, /^Six-zero/i, 7).t0;
  const t16 = nwT('ar05', w => /^sixteen/.test(w), .05), t60 = nwT('ar05', w => /^sixty/.test(w), .15);
  const t16b = t16 + .45, t60b = t60 + .45;   // the stress dot drops on each card just after it pops
  const tGave = nwT('ar05', has('ستاشر'), .9), tClose = nwT('ar05', has('قريبين'), .4);
  LK.push({ t: tIns1, armR: ARM.rest, face: F('happy', { lx: -.55, happy: .5, mw: .12 }), d: .3 },
    { t: X1.t1 - .1, face: F('surprised', { lx: -.6, pupil: .85, bLy: 1, bRy: 1, mo: .04, mw: .06 }), d: .2 },
    { t: tMe - .1, armR: ME, face: F('surprised', { lx: -.5, ly: -.1, pupil: .8, mo: .05, mw: .06, bLy: 1, bRy: 1 }), d: .2 },
    { t: tHa - .05, face: F('joy', { lx: -.5, mw: .13, mo: .07 }), lean: .03, d: .2 },
    { t: tSixty1 - .1, face: F('happy', { lx: -.6, happy: .55, mw: .12, bLy: .7, bRy: .7 }), lean: 0, d: .25 },
    { t: X3.t0 + .15, face: F('surprised', { lx: -.6, pupil: .8, bLy: 1, bRy: 1, mo: .05, mw: .06 }), armR: ARM.rest, d: .2 },
    // "Sixteen? Oh, thank you!": delighted — clasped hands, ∩ eyes, blush; "No, no.": a wagging hand; "Sixty! Six-zero!": firm and laughing
    { t: X4.t0 - .05, face: F('joy', { lx: -.5, blush: 1, mw: .13, mo: .07 }), armL: CLAPF, armR: CLAPF, lean: -.03, d: .2 },
    { t: tThank - .05, sq: 1.04, d: .2 },
    { t: tNoNo - .15, armL: ARM.rest, armR: WAG, sq: 1, lean: 0, face: F('happy', { lx: -.6, happy: .55, mw: .12, blush: .8 }), d: .2 },
    { t: tSixty2 - .1, armR: { ...ARM.up, dx: .12 }, face: F('happy', { lx: -.6, ly: -.05, happy: .4, bLy: .9, bRy: .9, mw: .12 }), d: .2 },
    { t: X4.t1 + .2, armR: ARM.rest, face: F('joy', { lx: -.4 }), d: .35 },
    { t: tClose - .2, face: F('happy', { lx: -.5, happy: .5 }), d: .3 },
    { t: tGave - .15, face: F('joy', { lx: -.3, blush: 1 }), armR: ME, d: .3 }, { t: tGave + 1.3, armR: ARM.rest, face: F('happy', { lx: -.5, happy: .6, blush: .8 }), d: .3 });
  lD.jumps.push({ t: tHa, h: .02, d: .28 }, { t: tThank, h: .03, d: .3 }, { t: tThank + .35, h: .025, d: .3 }, { t: X4.t1 + .2, h: .02, d: .3 }, { t: X4.t1 + .55, h: .02, d: .3 }, { t: tGave, h: .025, d: .3 });
  lD.blinks.push(tIns1, tMe - .1, X3.t0 + .15, tNoNo - .15, tGave - .15);
  YK.push({ t: tIns1, face: F('happy', { happy: .6, lx: .55, mw: .12 }), turn: .5, d: .3 },
    // "And you? How old are you?": friendly, an open hand toward her
    { t: X1.t0 - .2, armR: { ...OPEN, front: true }, lean: .02, face: F('happy', { happy: .5, lx: .6, mw: .12, bLy: .7, bRy: .7 }), d: .25 },
    { t: X1.t1 + .3, armR: ARM.rest, lean: 0, d: .3 },
    { t: tSixty1 + .1, face: F('surprised', { lx: .6, pupil: .7, mo: .06, mw: .06, bLy: 1, bRy: 1 }), d: .15 },
    // "Sixteen?!": a jump, arms up, eyes wide
    { t: X3.t0 - .1, armL: RAISE, armR: { ...RAISE, front: true }, face: F('surprised', { lx: .55, ly: -.1, pupil: .5, mo: .1, mw: .07, sweat: .3 }), lean: -.04, d: .12 },
    { t: X3.t1 + .45, armL: ARM.rest, armR: ARM.rest, lean: 0, face: F('surprised', { lx: .6, pupil: .7, mo: .03, mw: .06 }), d: .3 },
    { t: tNoNo - .1, face: F('embarrassed', { lx: .55, ly: .05, happy: .3 }), armL: ARM.scratch, d: .3 },
    { t: tSixZero + .2, face: F('happy', { lx: .55, happy: .5, blush: .9, lines: .6, sweat: .4 }), d: .3 },
    { t: X4.t1 + .6, armL: ARM.rest, face: F('joy', { lx: .4, blush: .8 }), d: .3 },
    // ar05: to us, explaining (an open hand on each word, the stress cards pop beside him)
    { t: n5 ? n5.t0 + .1 : X4.t1 + 1, turn: .2, face: F('happy', { happy: .45, lx: 0, ly: 0, mw: .11, blush: .5 }), d: .35 },
    { t: tClose - .15, armL: OPEN, face: F('happy', { happy: .35, lx: -.2, ly: -.3, bLy: .8, bRy: .8, mw: .11 }), d: .3 },
    { t: tGave - .3, armL: ARM.rest, turn: .4, face: F('joy', { lx: .5 }), d: .3 });
  yD.jumps.push({ t: X3.t0 - .05, h: .09, d: .42 });
  yD.blinks.push(tIns1, X1.t0 - .2, X3.t0 - .1, tNoNo - .1, tClose - .15);
  MK.push({ t: X1.t0 + .3, face: F('surprised', { lx: .55, pupil: .8, mo: .05, mw: .06, bLy: 1, bRy: 1, sweat: .5 }), d: .2 },
    { t: X1.t1 - .1, armL: HANDMOUTH, face: F('embarrassed', { lx: .6, ly: 0, happy: .2, sweat: .6 }), lean: -.03, d: .25 },
    { t: tHa + .1, armL: BAGARM, face: F('happy', { lx: .6, happy: .4, sweat: .3 }), lean: 0, d: .3 },
    { t: X3.t0 + .2, face: F('surprised', { lx: .6, pupil: .8, mo: .04, mw: .06 }), d: .2 },
    { t: tThank, armL: HANDMOUTH, face: F('joy', { lx: .5, mw: .12, mo: .06 }), lean: -.04, d: .2 },
    { t: X4.t1 + 1.0, armL: BAGARM, lean: 0, face: F('happy', { lx: .55, happy: .55 }), d: .35 });
  mD.jumps.push({ t: tThank + .1, h: .025, d: .3 }, { t: tThank + .45, h: .022, d: .3 }, { t: tThank + .8, h: .02, d: .3 });
  mD.blinks.push(X1.t0 + .3, tHa + .1, tThank);
  S.tIns0 = tIns0; S.tIns1 = tIns1; S.tTake = tTake; S.tDown = tDown; S.t16 = t16; S.t60 = t60; S.t16b = t16b; S.t60b = t60b; S.tSixteen = X3.t0; S.tSixty2 = tSixty2; S.tSixZero = tSixZero;
  // ================= room: "Class starts now. Room four!" — to the door of Room 4 =================
  const [R0, R1] = [RM[0], RM[1] || RM[0]];
  const tRoom = tokW(R0, /^Room/i, 5).t0, tNow = R1.t0;
  const tGo = Math.max(R1.t1 + .35, bWalk - .1), tSArr = tGo + 2.4, tYArr = tGo + 2.7;
  const tOpen = Math.max(tSArr + .35, Math.min(bDoor, rm.t1 - 3.2)), tIn0 = tOpen + 1.1, tIn1 = tIn0 + 1.0;
  const tWorld = nwT('ar06', has('الدنيا'), .9), tBehind = nwT('ar06', has('الباب'), .55);
  MK.push({ t: R0.t0 - .25, turn: -.45, face: F('happy', { lx: -.5, happy: .5, mw: .12 }), d: .3 },
    { t: tRoom - .3, armR: DIP, d: .12 }, { t: tRoom - .15, armR: { ...POINT, front: true }, face: F('happy', { lx: -.6, ly: -.2, happy: .5, mw: .12 }), d: .2 },
    { t: R1.t1 + .1, armR: ARM.rest, turn: .3, face: F('happy', { lx: .5, happy: .5 }), d: .3 },
    { t: tGo - .1, turn: -.5, d: .3 },
    // at the door: opens it (the far hand to the handle), smiles back at him, goes in
    { t: tOpen - .3, armR: { ...REACH, dx: .22, dy: .04 }, d: .3 }, { t: tOpen + .5, armR: ARM.rest, turn: .25, face: F('joy', { lx: .5 }), d: .35 },
    { t: tIn0 - .2, turn: -.6, d: .3 }, { t: tIn0, alpha: 1 }, { t: tIn1 - .2, alpha: 0, d: .2 });
  mD.moves.push({ t0: tGo, t1: tSArr, x0: SXP, x1: 395, k0: .9, k1: .9, step: .4 }, { t0: tIn0, t1: tIn1, x0: 395, x1: 250, y0: GROUND, y1: 812, k0: .9, k1: .82, step: .45 });
  YK.push({ t: R0.t0 - .15, turn: .1, face: F('surprised', { lx: -.4, pupil: .8, mo: .03, mw: .06 }), d: .3 },
    { t: tNow - .1, armL: RAISE, armR: RAISE, face: F('surprised', { lx: -.3, ly: -.1, pupil: .6, mo: .09, mw: .07, sweat: .5 }), d: .12 },
    { t: tNow + .55, armL: ARM.rest, armR: { ...ARM.wave, front: true }, turn: .45, face: F('joy', { lx: .5 }), d: .25 },
    { t: tGo - .15, armR: ARM.rest, turn: -.5, face: F('happy', { lx: -.5, happy: .45, mw: .11 }), d: .3 },
    // at the door: looks in; nervous to us on "ناس جاية من كل حتة في الدنيا"; then back to the door
    { t: tYArr, turn: -.6, face: F('happy', { lx: -.6, ly: -.1, happy: .3, bLy: .8, bRy: .8 }), d: .35 },
    { t: tBehind - .1, face: F('surprised', { lx: -.6, ly: -.05, pupil: .8, mo: .03, mw: .06, bLy: 1, bRy: 1 }), d: .25 },
    { t: tWorld - .5, turn: -.1, armL: { ...ARM.hold, dx: .02 }, armR: { ...ARM.hold, dx: .02 }, face: F('nervous', { lx: 0, ly: 0, sweat: .8, mt: .7 }), d: .3 },
    { t: rm.t1 - .7, turn: -.55, armL: ARM.rest, armR: ARM.rest, face: F('happy', { lx: -.6, happy: .3, sweat: .4 }), d: .35 });
  yD.moves.push({ t0: tGo + .15, t1: tYArr, x0: YX, x1: 560, k0: .9, k1: .9, step: .42 });
  yD.jumps.push({ t: tNow - .05, h: .07, d: .38 });
  yD.blinks.push(R0.t0 - .15, tNow - .1, tYArr, tWorld - .5);
  LK.push({ t: R1.t0 + .2, face: F('happy', { lx: -.6, happy: .55 }), d: .3 },
    { t: tNow + .5, armR: DIP, d: .12 }, { t: tNow + .65, armR: ARM.wave, face: F('joy', { lx: -.6 }), d: .2 }, { t: tGo + 1.4, armR: ARM.rest, face: F('happy', { lx: -.8, happy: .5 }), d: .35 });
  S.yD = yD; S.lD = lD; S.mD = mD; S.tGo = tGo; S.tOpen = tOpen; S.tIn0 = tIn0; S.tIn1 = tIn1; S.tWorld = tWorld;
  S.formAt = { take: tTake, down: tDown };   // in his hand until `take`, in hers until `down`, then on the counter
  // cameras: two-shot (desk), the freeze close-up, the three-shot (fix + sixty), the push on Youssef (ar04), the pan to Room 4
  const TWO = { x: 1352, y: 670, z: 1.85 }, THREE = { x: 1215, y: 672, z: 1.58 };
  S.camD = [
    { t: dk.t0 - 1, x: 1280, y: 676, z: 1.62 },
    { t: dk.t0, d: 2.2, ...TWO },
    { t: D4.t0 - .25, d: .9, x: 1385, y: 668, z: 2.05 },
    { t: bFreeze, d: 0, x: 1236, y: 700, z: 3.3 },
    { t: bUn, d: 0, x: 1290, y: 672, z: 1.85 },
    { t: bSaraIn + .2, d: 1.4, ...THREE },
    { t: n4 ? n4.t0 : F1.t1 + .5, d: Math.max(1, (n4 ? n4.t1 - n4.t0 : 3)), x: 1222, y: 690, z: 2.1 },
    { t: sx.t0, d: 0, ...THREE },
    { t: X3.t0 - .2, d: .25, x: 1240, y: 672, z: 1.7 },
    { t: X4.t0 + .3, d: 1.2, ...THREE },
    { t: tGo, d: 2.6, x: 620, y: 565, z: 1.36 },
    { t: tOpen + .2, d: Math.max(1.5, rm.t1 - tOpen), x: 480, y: 548, z: 1.42 },
  ];
  // ================= sound cues =================
  cue(op.t0 + .3, 'ambience_street', { dur: dk.t0 - .5, note: 'New York morning street bed' });
  for (let x = tW0 + .42 * .68; x < tW1; x += .42) cue(x, 'step', { who: 'youssef' });
  cue(S.tW1 + .5, 'pop', { note: '7:50 tag by the school clock' });
  cue(tTen - .2, 'ding', { note: 'proud: early!' });
  cue(tOne, 'pop', { note: '? over the form' });
  cue(dk.t0, 'cut', { note: 'the reception' });
  cue(dk.t0 + .1, 'ambience_hall', { dur: rm.t1 - dk.t0 - .1, note: 'quiet school interior bed' });
  steps(yD, 'youssef', dk.t0, rm.t1); steps(mD, 'mia', dk.t0, rm.t1);
  for (const L of [...DK, ...FX, ...SX, ...RM]) cue(L.t0 - .18, 'bubble', { who: L.who, text: L.text });
  cue(tTake, 'paper', { note: 'the form changes hands' }); cue(tDown + .2, 'paper', { note: 'the form on the counter' });
  cue(bMistake + .3, 'pop', { note: 'her smile freezes' });
  cue(bFreeze, 'freeze', { note: 'freeze-frame pop' });
  cue(bUn, 'unfreeze');
  cue(bSaraIn + .05, 'step', { who: 'mia' });
  cue(F1.t0 - .1, 'ding', { note: 'Oh! I am 26' });
  cue(tIns0, 'cut_in', { note: 'close-up of the form: 26 is written' }); cue(bWrite + .2, 'write', { dur: .8, note: 'the pen writes 26' }); cue(tIns1, 'cut', { note: 'back to the three-shot' });
  cue(X1.t1, 'pop', { note: 'Sara gasps' });
  cue(X3.t0 - .05, 'sting_shock', { note: 'Sixteen?!' }); cue(X3.t0, 'pop', { note: '16?! tag' });
  cue(X4.t0, 'laugh', { who: 'lopez', dur: 1.5 });
  cue(tSixty2, 'pop', { note: '60 tag' });
  cue(t16, 'pop', { note: 'six-TEEN card' }); cue(t60, 'pop', { note: 'SIX-ty card' });
  cue(t16b, 'tick', { note: 'stress dot' }); cue(t60b, 'tick', { note: 'stress dot' });
  cue(tNow - .05, 'pop', { note: 'Now?!' });
  cue(tOpen, 'door_open', { note: 'Room 4' });
  cue(tOpen + .25, 'chatter', { dur: rm.t1 - tOpen + .4, note: 'the class behind the door' });
  return S;
}
function steps(C, who, a, b) {   // one 'step' cue per hop landing
  for (const m of C.moves) {
    if (m.glide || m.x0 === m.x1) continue;
    const D = m.t1 - m.t0, n = Math.max(1, Math.round(D / (m.step || .42)));
    for (let i = 0; i < n; i++) { const tt = m.t0 + D * (i + .68) / n; if (tt >= a && tt < b) cue(tt, 'step', { who }); }
  }
}

// ======================================================================================================================
// open: the street, early morning; the school clock says 7:50
export function sceneOpen(c, t) {
  const cam = camAt(S.camO, t), dof = dofOf(cam.z);
  drawWorld(c, cam, t, { door: 0, dof, clock: 7 + 50 / 60 + t / 3600 });
  const yIn = t < S.tW1 + .2;
  const R = drawActor(c, cam, S.yO, t, { front: (h, k) => { if (!h[1][2]) formHeld(c, 'youssef', h[1], k); } });
  const yh = head(R, 'youssef');
  // a 7:50 tag pops by the clock when he looks up at it; a ✓ (early!)
  const k = back(seg(t, S.tW1 + .45, S.tW1 + .85), 2) * (1 - seg(t, S.bTitle - .4, S.bTitle - .1));
  if (k > 0) {
    const [cx, cy, Z] = toScreen(cam, 1, CLOCK.x + 150, CLOCK.y - 20);
    c.save(); c.translate(cx, cy); c.scale(k * Z * .8, k * Z * .8); timeTag(c, 0, 0, '7:50', 1); c.restore();
    check(c, cx + 120 * Z * .8 * k, cy - 50 * Z * .8, 30 * Z * .8, seg(t, S.tTen - .2, S.tTen + .2));
  }
  // "إلا خانة واحدة": a small ? over his head
  const q = seg(t, S.tOne, S.tOne + .35) * (1 - seg(t, S.bTitle - .3, S.bTitle));
  if (q > 0 && yh) bigMark(c, yh[0] + 90 * R.Z, yh[1] - 70 * R.Z, '?', 100 * R.Z, q, .12 + Math.sin(t * 5) * .08, P.mustard);
  return { cam, yIn };
}

// desk → fix → sixty → room: one continuous set (the reception); the freeze-frame; the insert of the form
export function sceneDesk(c, t) {
  if (t >= S.bFreeze && t < S.bUn) return freezeFrame(c, t);
  if (t >= S.tIns0 && t < S.tIns1) return formInsert(c, t);
  return deskShot(c, t, camAt(S.camD, t));
}
function deskShot(c, t, cam, freeze = false) {
  const dof = dofOf(cam.z) * .8, mins = 7 + 52 / 60 + clamp(t - S.dk.t0, 0, 200) / 60 * 8 / 70;   // 7:52 → 8:00 over the scene
  const door = eo(seg(t, S.tOpen, S.tOpen + .7));
  drawReception(c, cam, t, { dof, clock: Math.min(8, mins), door });
  const R = {};
  // Mrs. Lopez behind the counter (her pen; the form in her far hand between `take` and `down`)
  const lHasForm = t >= S.formAt.take && t < S.formAt.down + .25, penOn = true;   // the held sheet sinks behind the counter as the one on top fades in; the pen never leaves her hand
  R.l = drawActor(c, cam, S.lD, t, { front: (h, k) => {
    if (penOn && !h[1][2]) penIn(c, 'lopez', h[1], k, .55);
    if (lHasForm && !h[0][2]) formHeld(c, 'lopez', h[0], k, 1);
  } });
  drawCounter(c, cam, t, { dof: 0 });
  // the form lying on the counter top, in front of her
  if (t >= S.formAt.down) {
    const [fx, fy, Z] = toScreen(cam, 1, 1418, COUNTER.top + 7);
    const a = seg(t, S.formAt.down, S.formAt.down + .2);
    c.save(); c.globalAlpha = a; c.translate(fx, fy); c.scale(1, .34); drawForm(c, 0, 0, 120 * Z, 150 * Z, { rot: -.12, age: .2, ageVal: t >= S.tIns0 ? '26' : null }); c.restore();
  }
  // Sara (with her tote bag) and Youssef, in front of the counter
  const yHas = t < S.formAt.take;
  const order = [[S.mD, 'm'], [S.yD, 'y']];
  for (const [C, n] of order) {
    if (n === 'm') {
      if (t < S.bSaraIn) continue;
      const cl = t >= S.tIn0 ? doorRect(cam) : null;
      R.m = drawActor(c, cam, C, t, { clip: cl, behind: (h, k) => { if (h[0][2]) bagIn(c, 'mia', h[0], k); }, front: (h, k) => { if (!h[0][2]) bagIn(c, 'mia', h[0], k); } });
    } else R.y = drawActor(c, cam, C, t, { front: (h, k) => { if (yHas && !h[1][2]) formHeld(c, 'youssef', h[1], k); } });
  }
  if (freeze) return R;
  const yh = head(R.y, 'youssef'), mh = R.m && R.m.sx != null ? head(R.m, 'mia', 1.12) : null, lh = head(R.l, 'lopez', 1.14);
  // number tags: "16?!" over Youssef, "60" over Mrs. Lopez
  if (yh) { const k = seg(t, S.tSixteen, S.tSixteen + .35) * (1 - seg(t, S.tSixty2 - .1, S.tSixty2 + .2)); if (k > 0) numTag(c, yh[0] + 120 * R.y.Z, yh[1] - 110 * R.y.Z, '16?!', P.red, k, R.y.Z, t - S.tSixteen); }
  if (lh) { const k = seg(t, S.tSixty2, S.tSixty2 + .35) * (1 - seg(t, S.n5 ? S.n5.t0 - .4 : 1e9, S.n5 ? S.n5.t0 - .1 : 1e9)); if (k > 0) numTag(c, lh[0] + 20 * R.l.Z, lh[1] - 150 * R.l.Z, '60', P.teal, k, R.l.Z, 0, seg(t, S.tSixZero, S.tSixZero + .3) > 0 ? '6 · 0' : null); }
  // ar05: the two stress cards (six·TEEN beside Youssef, SIX·ty beside Mrs. Lopez); a dot lands on the stressed part on the second mention
  if (S.n5 && t > S.t16 - .2 && t < S.n5.t1 + .6) {
    const out = seg(t, S.n5.t1 + .2, S.n5.t1 + .5);
    stressCard(c, 600, 300, [['six', 0], ['TEEN', 1]], back(seg(t, S.t16 - .1, S.t16 + .3), 2) * (1 - out), seg(t, S.t16b, S.t16b + .3), P.red);
    stressCard(c, 1320, 300, [['SIX', 1], ['ty', 0]], back(seg(t, S.t60 - .1, S.t60 + .3), 2) * (1 - out), seg(t, S.t60b, S.t60b + .3), P.teal);
  }
  // dialogue bubbles (one at a time; Mrs. Lopez's bubbles stay clear of the right edge)
  const lines = [...S.DK, ...S.FX, ...S.SX, ...S.RM];
  lines.forEach((L, i) => {
    const nx = lines[i + 1] ? lines[i + 1].t0 : null;
    const hp = L.who === 'mia' ? mh : L.who === 'lopez' ? lh : yh;
    if (!hp) return;
    if (L === S.DK[S.DK.length - 1] && t >= S.bFreeze - .2) return;
    const until = L === S.DK[S.DK.length - 1] ? S.bFreeze - .02 : null;
    const pos = L.who === 'lopez' ? { x: hp[0] - 10, y: hp[1], side: 0, lift: 70, maxX: 1880 } : L.who === 'mia' ? { x: hp[0] + 10, y: hp[1], side: 0, lift: 70 } : { x: hp[0] + 20, y: hp[1], side: L.text.length > 22 ? 0 : -1, lift: 70 };
    lineBubble(c, L, t, pos, until ? { until } : { next: nx, hold: 1.2 });
  });
  // the close push during ar04 / the room's warm doorway: a soft vignette
  return { cam, R };
}
// the doorway of Room 4 in screen space (Sara walks in through it)
function doorRect(cam) {
  const [x0, y0] = toScreen(cam, 1, ROOM4.x - ROOM4.w / 2, ROOM4.top - 80), [x1, y1] = toScreen(cam, 1, ROOM4.x + ROOM4.w / 2, ROOM4.bottom + 200);
  return [x0, y0, x1, y1];
}
// a popping number tag (Fredoka on a cream pill), wobbling when it is a question
function numTag(c, x, y, txt, col, k, Z, wob = 0, sub = null) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(x, y); const s = back(clamp(k), 2.4) * Z * .62; c.scale(s, s);
  c.rotate(wob > 0 ? Math.sin(wob * 9) * .14 * Math.exp(-wob * 1.2) - .06 : .04);
  c.font = '700 120px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(txt).width + 70;
  rr(c, -w / 2, -78 + 10, w, 156, 40); c.fillStyle = rgba('#1E1B33', .2); c.fill();
  rr(c, -w / 2, -78, w, 156, 40); c.fillStyle = '#FFFDF8'; c.fill(); c.strokeStyle = col; c.lineWidth = 8; c.stroke();
  c.fillStyle = col; c.fillText(txt, 0, 6);
  if (sub) { c.font = '600 54px "Fredoka"'; const sw = c.measureText(sub).width + 44; rr(c, -sw / 2, 90, sw, 66, 33); c.fillStyle = P.teal; c.fill(); c.fillStyle = P.cream; c.fillText(sub, 0, 126); }
  c.restore();
}
// a stress card: syllables side by side, the stressed one big and coloured with a dot above it (the dot drops in with `dot`)
export function stressCard(c, x, y, parts, k, dot, col) {
  if (k <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(x, y); c.scale(k, k);
  const sz = s => s ? 104 : 66;
  c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const ws = parts.map(([s, st]) => { c.font = `${st ? 700 : 600} ${sz(st)}px "Fredoka"`; return c.measureText(s).width; });
  const gap = 18, W = ws.reduce((a, b) => a + b, 0) + gap * (parts.length - 1);
  rr(c, -W / 2 - 40, -128, W + 80, 170, 34); c.fillStyle = rgba('#1E1B33', .18); c.fill();
  rr(c, -W / 2 - 40, -138, W + 80, 170, 34); c.fillStyle = '#FFFDF8'; c.fill();
  let px = -W / 2;
  parts.forEach(([s, st], i) => {
    c.font = `${st ? 700 : 600} ${sz(st)}px "Fredoka"`;
    if (st) { rr(c, px - 8, -94, ws[i] + 16, 20, 10); c.fillStyle = rgba(P.mustard, .55); c.fill(); }
    c.fillStyle = st ? col : rgba(P.ink, .75); c.fillText(s, px, -6);
    if (st && dot > 0) { const d = back(dot, 2.6); c.fillStyle = col; ell(c, px + ws[i] / 2, -116 - (1 - d) * 30, 14 * d, 14 * d); c.fill(); }
    if (i < parts.length - 1) { c.fillStyle = rgba(P.ink, .35); ell(c, px + ws[i] + gap / 2, -36, 5, 5); c.fill(); }
    px += ws[i] + gap;
  });
  c.restore();
}

// the freeze-frame: the close-up at the pop is held (rendered once, cached), desaturated, with a slow push; ? and ! pop as he
// panics; the literal translation and the "years in my bag" joke appear on the narration's words
let FZ = null;
function freezeFrame(c, t) {
  if (!FZ) {
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
    const f = cv.getContext('2d', { willReadFrequently: true });
    const tf = S.bFreeze + .12, cam = camAt(S.camD, S.bFreeze);
    const R = deskShot(f, tf, cam, true);
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'saturation'; f.fillStyle = 'rgba(128,128,128,.42)'; f.fillRect(0, 0, 1920, 1080); f.globalCompositeOperation = 'source-over';
    FZ = { cv, yh: head(R.y, 'youssef'), Z: R.y.Z };
  }
  const u = eio(seg(t, S.bFreeze, S.bUn)), z = 1 + .05 * u, ax = FZ.yh[0], ay = FZ.yh[1] + 200;
  c.save(); c.setTransform(z, 0, 0, z, ax * (1 - z), ay * (1 - z)); c.drawImage(FZ.cv, 0, 0); c.restore();
  // her puzzled echo stays at the right edge
  const L = S.DK[S.DK.length - 1];
  lineBubble(c, L, S.bFreeze - .05, { x: 1905, y: 470, side: -1, lift: 110 }, { until: S.bUn - .2 });
  freezeFx(c, t, FZ.yh);
  return {};
}
function freezeFx(c, t, yh) {
  const a = seg(t, S.bFreeze, S.bFreeze + .08), n = S.n3;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const v = c.createRadialGradient(960, 540, 420, 960, 540, 1150); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${.38 * a})`);
  c.fillStyle = v; c.fillRect(0, 0, 1920, 1080);
  const fl = 1 - seg(t, S.bFreeze, S.bFreeze + .16); if (fl > 0) { c.fillStyle = `rgba(255,251,240,${.55 * fl})`; c.fillRect(0, 0, 1920, 1080); }
  c.strokeStyle = rgba(P.cream, .9 * a); c.lineWidth = 14; c.strokeRect(22, 22, 1876, 1036);
  if (!n) { c.restore(); return; }
  const at = (pred, f) => { const o = n.tok.find(x => pred(x.w)); return o ? o.t0 : n.t0 + (n.t1 - n.t0) * f; };
  const tSaid = n.t0, tMeans = at(w => w.includes('عندي'), .25), tWord = at(w => w.includes('كلمة'), .5), tBag = at(w => w.includes('شنطتي'), .9);
  // the literal translation, as a thought card on the left: عندي 26 سنة → I have 26 years ✗
  const ka = back(seg(t, tMeans - .1, tMeans + .3), 2) * (1 - seg(t, tBag - .5, tBag - .2));
  if (ka > 0) {
    c.save(); c.translate(470, 360); c.scale(ka, ka); c.rotate(-.03);
    rr(c, -330, -150 + 12, 660, 300, 40); c.fillStyle = rgba('#1E1B33', .22); c.fill();
    rr(c, -330, -150, 660, 300, 40); c.fillStyle = '#FFFDF8'; c.fill();
    c.direction = 'rtl'; c.font = '800 76px "Baloo Bhaijaan 2"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.navy; c.fillText('عندي 26 سنة', 0, -62);
    c.direction = 'ltr'; c.fillStyle = rgba(P.ink, .4); c.beginPath(); c.moveTo(-14, -10); c.lineTo(14, -10); c.lineTo(0, 14); c.closePath(); c.fill();
    const wk = seg(t, tWord - .1, tWord + .3);
    c.font = '600 70px "Fredoka"'; c.fillStyle = P.ink; c.fillText('I have 26 years', 0, 72);
    if (wk > 0) { const w = c.measureText('I have 26 years').width; const x0 = -w / 2, x1 = w / 2; c.strokeStyle = P.red; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40 * wk; const x = lerp(x0, x1, u), y = 108 + Math.sin(u * 40) * 6; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore();
  }
  // "شايل السنين دي في شنطتي": the red suitcase pops with a luggage tag "26 years"
  const kb = back(seg(t, tBag - .1, tBag + .35), 2.2);
  if (kb > 0) {
    c.save(); c.translate(470, 640); c.scale(kb, kb); c.rotate(-.06 + Math.sin((t - tBag) * 4) * .03);
    drawSuitcase(c, 0, 120, 1.15, 300, { handle: .4, tilt: 0 });
    c.restore();
    c.save(); c.translate(600, 470); c.scale(kb, kb); c.rotate(.12);
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(-90, 40); c.quadraticCurveTo(-60, 0, -40, 6); c.stroke();
    rr(c, -40, -38, 210, 88, 18); c.fillStyle = mix(P.mustard, P.cream, .25); c.fill(); c.strokeStyle = dark(P.mustard, .3); c.lineWidth = 4; c.stroke();
    ell(c, -18, 6, 9, 9); c.fillStyle = P.cream; c.fill();
    c.font = '700 46px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.ink; c.fillText('26 years', 76, 8);
    c.restore();
  }
  // ? and ! marks around his head on the panicked words
  const marks = [{ t: tSaid + .3, ch: '?' }, { t: tWord, ch: '!' }, { t: tBag + .2, ch: '!' }];
  const spots = [[-150, -330, -.15], [150, -360, .2], [10, -420, 0]];
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
// the insert: the form on the counter fills the frame; her hand writes 26 in the Age box with the pen
function formInsert(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#EED3AE'); g.addColorStop(1, '#DDB78C'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = rgba('#FFFFFF', .18); for (let y = 90; y < 1080; y += 180) c.fillRect(0, y, 1920, 6);
  const u = eio(seg(t, S.tIns0, S.tIns1)), z = 1 + .05 * u;
  c.save(); c.translate(960, 560); c.scale(z, z);
  const W = 1180, Hh = 860, rot = -.05, wr = seg(t, S.bWrite + .15, S.bWrite + 1.0);
  drawForm(c, 0, 0, W, Hh, { rot, text: true, age: .8, ageVal: '26', write: wr });
  // the pen tip follows the writing (the Age row's value starts at .29 W from the left edge), her hand + cuff hold it
  const yAge = -Hh / 2 + W * .09 * .8 + Hh * .17 + 2 * Hh * .17, x0 = -W / 2 + W * .09 + W * .29, tw = 120;
  const px = x0 + tw * wr + Math.sin(t * 40) * 6 * (wr > 0 && wr < 1 ? 1 : 0), py = yAge - 10 + Math.sin(t * 31) * 8 * (wr > 0 && wr < 1 ? 1 : 0) + (1 - seg(t, S.tIns0, S.tIns0 + .4)) * 300;
  c.save(); c.rotate(rot); c.translate(px, py);
  const sp = CAST.lopez;
  c.save(); c.rotate(-.75);
  c.fillStyle = sp.sleeve; rr(c, -40, 150, 80, 420, 36); c.fill(); c.fillStyle = sp.cuff; rr(c, -44, 140, 88, 40, 14); c.fill();
  c.restore();
  drawPen(c, 0, -40, 3.2, -.75 + Math.PI);
  c.save(); c.rotate(-.75); ell(c, 0, 105, 64, 58); c.fillStyle = mix(sp.skin, '#4B2E52', .32); c.fill(); ell(c, -5, 99, 54, 50); c.fillStyle = sp.skin; c.fill(); c.restore();
  c.restore();
  c.restore();
  if (wr >= 1) { c.save(); check(c, 1240, 470, 46, seg(t, S.bWrite + 1.05, S.bWrite + 1.4)); c.restore(); }
  return {};
}
export { charState, drawActor, head, H };
