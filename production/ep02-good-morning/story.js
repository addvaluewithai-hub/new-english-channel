// Episode 2 — story scenes: open (the bedroom), run (the street), hall + coffee (the school hallway), door + bye (the
// school door, afternoon). Every time below is derived from timeline.json (sections, beats, lines, narration words);
// offsets are acting/animation only.
import { P, rgba, mix } from './kit.js';
import { CAST, drawChar, drawSuitcase, drawCup, drawTray, drawBag, drawForm, drawHand, handPos } from './bean.js';
import { drawWorld, drawBedroom, drawHall, blanket, layerT, toScreen, GROUND, DOOR, BED, BEDCLOCK } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from '/core/lib.js';
import { SEC, BEAT, NARR, LINES, nwT, has } from './tl.js';
import { fold, F, moveAt, hop, liveFace, springAt, EXPR, ARM, pose, PULL, CUP, POINT, CLAP, DIP, OPEN, RAISE, RUNARM, REACH, HOLDLOW } from './act.js';
import { lineBubble, thought, sunIcon, alarmClock, timeTag, sparkle, bigMark, zzz, bubble, wordStates } from './ui.js';
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
  const pant = k.pant ? 1 + .022 * k.pant * Math.sin(t * Math.PI * 2 * 2.6) : 1;
  return {
    ...k, x: m.x, y: m.y || GROUND, k: m.k * (k.kmul ?? 1), lift: hp.lift + j.lift + (k.lift || 0), sq: hp.sq * j.sq * (k.sq ?? 1) * pant,
    lean: (k.lean || 0) + hp.lean + trem(t, k.trem || 0), footL: hp.footL, footR: hp.footR, phase: m.phase, walking: m.walking, dir: m.dir,
    wave: t * 1.9,
  };
}
const springFor = C => tt => { const s = charState(C, tt); return { lift: s.lift, lean: s.lean, x: s.x }; };

// draw one character (and its suitcase) with a camera. extra.behind(hands, k) / extra.front(hands, k) draw held props
// (hands: [[x, y, far], [x, y, far]] for the left and right hand in screen px; k = the screen scale of the character)
function drawActor(c, cam, C, t, extra = {}) {
  const st = charState(C, t);
  if ((st.alpha ?? 1) <= 0) return st;
  const [x, y, Z] = toScreen(cam, 1, st.x, st.y);
  const face = extra.frozenFace || liveFace(C.id, t, st.face, { blinks: C.blinks, extra: C.talkExtra });
  const p = pose({ ...st, x, y, k: st.k * Z, face, pony: C.id === 'mia' ? (extra.pony ?? springAt(springFor(C), t)) : 0,
    quiff: C.id === 'youssef' ? (extra.quiff ?? springAt(springFor(C), t, .25)) : 0, breathe: Math.sin(t * Math.PI * 2 / 3.2 + (C.id === 'mia' ? 1 : 0)) });
  const hands = (extra.behind || extra.front) ? handPos(CAST[C.id], p) : null;
  c.save();
  if (st.alpha < 1) c.globalAlpha = st.alpha;
  if (st.clip) doorClip(c, cam, extra.door ?? 1);
  if (extra.behind) extra.behind(hands, p.k);
  if (C.case) drawCase(c, cam, C, t, st);
  drawChar(c, CAST[C.id], p);
  if (extra.front) extra.front(hands, p.k);
  c.restore();
  return { ...st, sx: x, sy: y, Z, hands, ks: p.k };
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
// held props (drawn at a hand, then the hand again over them)
const hand = (c, id, h, k, grip = false) => drawHand(c, CAST[id], h[0], h[1], H[id] * k, { dir: h[3], grip });
const cupIn = (c, id, h, k, t, steam = 1, rot = 0) => { drawCup(c, h[0], h[1] - .02 * 300 * k, k, { steam, t, rot }); hand(c, id, h, k, true); };
const trayIn = (c, id, h, k, t, n, side = -1) => { drawTray(c, h[0] + side * (n > 1 ? .09 : .02) * 300 * k, h[1] - .01 * 300 * k, k, n, { steam: .8, t }); hand(c, id, h, k, true); };
const bagIn = (c, id, h, k) => { drawBag(c, h[0], h[1], k); };
const formIn = (c, id, h, k, side = -1, rot = -.12) => { drawForm(c, h[0] + side * .07 * 300 * k, h[1] - .06 * 300 * k, .24 * 300 * k, .3 * 300 * k, { rot: rot * side * -1, age: .3 }); hand(c, id, h, k); };
// the form held by its top corner: the sheet hangs below and to the camera-left of the hand, tilted so it reads (chest height, the face stays clear)
const formHeld = (c, id, h, k) => { drawForm(c, h[0] - .09 * 300 * k, h[1] + .1 * 300 * k, .24 * 300 * k, .3 * 300 * k, { rot: -.15, age: .3 }); hand(c, id, h, k); };

// ======================================================================================================================
export function buildStory() {
  const op = SEC('open'), rn = SEC('run'), hl = SEC('hall'), cf = SEC('coffee'), dr = SEC('door'), by = SEC('bye'), rc = SEC('recap');
  const HL = LINES('hall'), CF = LINES('coffee'), DR = LINES('door'), BY = LINES('bye');
  const n1 = NARR('ar01'), n2 = NARR('ar02'), n3 = NARR('ar03'), n4 = NARR('ar04'), n5 = NARR('ar05'), n6 = NARR('ar06'), n7 = NARR('ar07');
  const bWake = BEAT('wake', 1.2), bTitle = BEAT('title', op.t1 - 3), bSaraIn = BEAT('mia_enters', hl.t0), bYawn = BEAT('yawn', hl.t0 + 4), bLaugh = BEAT('laugh', hl.t0 + 9),
    bSip = BEAT('sip', cf.t0 + 11), bWelcome = BEAT('welcome', dr.t0 + 2.6), bForm = BEAT('form', by.t0 + 1.1), bNight = BEAT('good_night', by.t0 + 8.8), bAge = BEAT('age_box', by.t1 - 3);
  const tok = (L, i) => L.tok[Math.min(i, L.tok.length - 1)];
  const SLAP = { dx: .3, dy: -.02, w: 0, bend: 15, elv: [1, 1], flex: 0 };                 // the arm shoots out to the clock
  const TRAY = ARM.hold, REACHBAG = { dx: -.3, dy: .1, w: 0, bend: 40, elv: [.5, 1], flex: 1, front: true };   // the tray at the chest; a hand into the bag
  S = { op, rn, hl, cf, dr, by, HL, CF, DR, BY, n1, n2, n3, n4, n5, n6, n7, bWake, bTitle, bSaraIn, bYawn, bLaugh, bSip, bWelcome, bForm, bNight, bAge };

  // ================= open: asleep → the alarm → the clock → the leap → out of the door =================
  const tSeven = nwT('ar01', has('سبعة'), .45), tHeard = nwT('ar01', has('سمعتوش'), .62), tWoke = nwT('ar01', has('صحيت'), .8), tTen = nwT('ar01', has('وعشرة'), .95);
  const tLeap = Math.max(tWoke + .5, tTen - .25), tLand = tLeap + .5, tRunOut = (n2 ? n2.t0 : tLand + .9) + .1, tGone = tRunOut + 1.25;
  const tIns0 = bWake + .5, tIns1 = tIns0 + .95;
  const asleep = F('neutral', { eye: .08, bLy: .15, bRy: .15, bLr: .05, bRr: .05, mw: .07, mo: .018, ms: .25, blush: .35 });
  const yB = { id: 'youssef', base: { turn: .15, face: asleep, armL: ARM.rest, armR: ARM.rest, kmul: 1, pant: 0 }, blinks: [], jumps: [], hopAmp: 1.3,
    moves: [{ t0: -1, t1: -.9, x0: 930, x1: 930, y0: BED.sit, y1: BED.sit, k0: 1, k1: 1 },
      { t0: tLeap, t1: tLand, x0: 930, x1: 970, y0: BED.sit, y1: GROUND, k0: 1, k1: 1, glide: true },
      { t0: tRunOut, t1: tGone, x0: 970, x1: 2450, step: .26, ease: 'lin' }], keys: [] };
  const K = yB.keys, J = yB.jumps, BL = yB.blinks;
  // the jolt: eyes snap open, a hand slaps the clock, the ring stops
  K.push({ t: bWake, face: F('surprised', { pupil: .75, mo: .07, mw: .06, lx: .3 }), lean: -.03, d: .1 },
    { t: bWake + .06, armR: SLAP, lean: .08, d: .16 }, { t: bWake + .7, armR: ARM.rest, lean: 0, d: .3 },
    // looks at the clock, eyes go wide
    { t: bWake + .35, turn: .4, face: F('surprised', { pupil: .7, mo: .05, mw: .06, lx: .85, ly: .15 }), d: .2 },
    { t: bWake + .75, face: F('surprised', { pupil: .5, mo: .095, mw: .06, lx: .85, ly: .1, sweat: .6 }), trem: .004, d: .15 },
    // "…في نيويورك": a sleepy, tired look at us
    { t: tIns1 + .1, face: F('neutral', { lid: .45, bLr: .4, bRr: .4, mw: .085, ms: -.05, mwob: .4, lx: -.1, sweat: .4, blush: .45 }), turn: .15, trem: 0, lean: 0, d: .4 },
    // "المنبه رن الساعة سبعة": points at the clock, worried
    { t: tSeven - .35, armR: POINT, turn: .3, face: F('worried', { lx: .8, ly: .1, sweat: .5 }), d: .25 },
    // "وأنا ما سمعتوش": sheepish scratch
    { t: tHeard - .2, armR: ARM.scratch, face: F('embarrassed', { lx: -.3, ly: .4, lines: .6, sweat: .6, blush: .8 }), turn: .15, lean: -.015, d: .3 },
    // "صحيت الساعة تمانية وعشرة": looks again — panic — and leaps
    { t: tWoke - .1, armR: ARM.rest, turn: .4, face: F('surprised', { pupil: .5, mo: .1, mw: .065, lx: .85, ly: .1, sweat: 1, blush: .4 }), lean: 0, trem: .005, d: .2 },
    { t: tLeap - .05, armL: ARM.up, armR: ARM.up, face: F('surprised', { pupil: .45, mo: .11, mw: .07, lx: 0, ly: -.3, sweat: 1 }), turn: .25, trem: 0, d: .2 },
    { t: tLand + .15, armL: ARM.up, armR: ARM.up, face: F('worried', { pupil: .6, mo: .06, mw: .09, mwob: 1, lx: 0, ly: 0, sweat: 1, bLr: .7, bRr: .7 }), turn: .1, trem: .006, d: .25 },
    // "جريت": turns and runs out of the door
    { t: tRunOut - .15, turn: .55, armL: RUNARM, armR: RUNARM, lean: .07, face: F('nervous', { sweat: 1, lx: .5, mt: .3, mo: .04 }), trem: 0, d: .2 });
  J.push({ t: bWake - .02, h: .05, d: .3 }, { t: tLeap, h: .55, d: tLand - tLeap });
  BL.push(bWake + .35, tIns1 + .1, tSeven - .35, tHeard - .2, tWoke - .1);
  S.yB = yB; S.tIns0 = tIns0; S.tIns1 = tIns1; S.tLeap = tLeap; S.tLand = tLand; S.tRunOut = tRunOut; S.tGone = tGone;
  S.ring = [0, bWake + .22];   // the alarm rings until the slap
  S.camO = [
    { t: -1, x: 960, y: 560, z: 1.0 },
    { t: 0, d: tLeap, x: 980, y: 566, z: 1.07 },
    { t: tLeap, d: .6, x: 1000, y: 580, z: 1.02 },
    { t: tGone - .4, d: Math.max(1, bTitle - .2 - (tGone - .4)), x: 1080, y: 600, z: 1.26 },
  ];
  // ================= run: the street, fast =================
  const tGM = nwT('ar03', w => /^Good morning/i.test(w), .5), tSleep = nwT('ar03', has('نايم'), .85);
  const tRun0 = rn.t0 + .1, tRun1 = Math.min(rn.t1 - .4, tRun0 + 7.4), tDoorR = tRun1 - .35;
  const runFace = F('nervous', { sweat: .9, lx: .5, mt: .3, mo: .04, bLr: .5, bRr: .5 });
  const yR = { id: 'youssef', base: { turn: .5, face: runFace, armL: RUNARM, armR: RUNARM, lean: .07, kmul: 1 },
    blinks: [], jumps: [], hopAmp: 1.3, moves: [{ t0: tRun0, t1: tRun1, x0: -760, x1: 1300, k0: .9, k1: .9, step: .28, ease: 'lin' }], keys: [] };
  yR.keys.push({ t: tGM - .55, face: F('happy', { lx: .3, ly: -.6, happy: .35, mw: .11, mo: .03, sweat: .5 }), d: .35 },
    { t: tGM + 1.6, face: runFace, d: .35 },
    { t: tSleep - .25, face: F('neutral', { lid: .6, lx: .4, ly: .1, mw: .08, ms: .05, sweat: .5, bLy: -.1, bRy: -.1 }), d: .4 },
    { t: tDoorR - .1, face: F('surprised', { lx: .6, ly: -.5, pupil: .8, mo: .06, sweat: .6 }), armL: ARM.rest, armR: ARM.rest, lean: 0, d: .25 });
  yR.blinks.push(tGM - .55, tSleep - .25, tDoorR - .1);
  S.yR = yR; S.tRun0 = tRun0; S.tRun1 = tRun1; S.tDoorR = tDoorR;
  S.thought = [tGM - .4, tGM + 1.5];
  S.taxiR = [rn.t0 + 1.2, rn.t0 + 7.5];   // the yellow cab passes behind (the old bus's timing)
  const yx = tt => charState(yR, tt).x;
  S.camR = [
    { t: rn.t0 - 1, f: tt => ({ x: yx(tt - .35) + 300, y: 575, z: 1.05 }) },
    { t: tRun1 - 2.2, d: 2.0, x: 1180, y: 575, z: 1.08 },
  ];
  // ================= hall: Sara with two coffees, the yawn, the laugh, the apology; close-up during ar04 =================
  // (A2 arms: the hand-over uses the arms on the side facing the other character, drawn in front — a cross-body reach is out of range)
  const H0 = HL[0], H1 = HL[1], H2 = HL[2], H3 = HL[3] || HL[HL.length - 1];
  const tGoodY = tok(H1, 0).t0, tNightY = tok(H1, 1).t0, tOh = tok(H3, 0).t0, tSorry = tok(H3, 1).t0, tGM2 = tok(H3, 2).t0;
  const tEight = nwT('ar04', has('تمانية'), .4), tLaughed = nwT('ar04', has('ضحكت'), .65), tSleepAg = nwT('ar04', has('أنام'), .85), tShame = nwT('ar04', has('الكسوف'), .95);
  const C0 = CF[0], C1 = CF[1], C2 = CF[2], C3 = CF[3], C4 = CF[4] || CF[CF.length - 1];
  const tTired = tok(C1, 4).t0, tCoffee = tok(C2, 2).t0, tPlease = tok(C3, 1).t0, tHand = C3.t0 + .55, tTake = tHand + .35;
  const tNotice = nwT('ar05', has('بالي'), .7), tUnknown = nwT('ar05', has('عارفها'), .85), tHuman = nwT('ar05', has('آدم'), .5);
  const yH = { id: 'youssef', base: { turn: .5, face: F('nervous', { sweat: .9, lid: .3, mt: .2, mo: .02, lx: .5 }), armL: ARM.rest, armR: ARM.rest, kmul: 1, pant: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: 1300, x1: 1300, k0: .9, k1: .9 }], keys: [] };
  const mH = { id: 'mia', base: { turn: -.38, face: F('happy', { lx: -.45, happy: .4 }), armL: TRAY, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: hl.t0 + .05, t1: Math.min(H0.t0 - .15, hl.t0 + 1.05), x0: 1935, x1: 1545, k0: .9, k1: .9, step: .33 }], keys: [] };
  const YK = yH.keys, MK = mH.keys;
  const OFFER = { ...REACH, dx: .2 }, TAKE = { ...REACH, dx: .12 }, HOLD = ARM.hold;   // the tray / the cup in the hand on the other character's side, held in front (they stand close: short reaches)
  const MOUTH = { dx: -.3, dy: -.12, w: 0, bend: 55, elv: [1, .2], flex: 1 }, HANDMOUTH = { dx: -.3, dy: -.14, w: 0, bend: 55, elv: [1, .2], flex: 1 };
  // the sip: the hand stays at shoulder height right under the mouth (the mouth sits at ≈ .548 H, the shoulder at .43 H), so the cup's rim
  // meets the lower face just below the mouth line and nothing covers the eyes; the cup tilts ≈ 20° toward the mouth (see cupIn's rot)
  const SIPPOSE = { dx: -.13, dy: .02, w: 0, bend: 60, elv: [1, .7], flex: 1, front: true };
  // Youssef: catches his breath, tries a smile; the yawn; "Good… night."; snaps awake, blushes; "Oh! Sorry! Good morning!" with a bow
  const sleepy = F('neutral', { eye: .5, lid: .3, bLy: .25, bRy: .25, bLr: .2, bRr: .2, mw: .085, ms: .2, blush: .45, lx: .4, ly: .1 });
  const yawnF = F('neutral', { eye: .1, bLy: .95, bRy: .95, bLr: .35, bRr: .35, mw: .09, mo: .125, ms: -.1, mt: 0, blush: .45, lx: 0, ly: 0 });
  YK.push({ t: H0.t0 - .3, pant: .4, face: F('happy', { happy: .2, lid: .3, sweat: .6, lx: .5, mw: .11 }), d: .4 },
    { t: H0.t1 - .6, pant: 0, face: F('happy', { happy: .15, lid: .4, sweat: .4, lx: .5, mw: .1, bLy: .2, bRy: .2 }), d: .5 },
    { t: bYawn, face: yawnF, armL: MOUTH, lean: -.045, sq: 1.05, d: .55 },
    { t: bYawn + .9, lean: -.03, sq: 1.02, d: .4 },
    { t: tGoodY - .2, face: sleepy, armL: ARM.rest, lean: -.01, sq: 1, d: .35 },
    { t: tGoodY + .55, face: F('neutral', { eye: .25, lid: .45, bLy: .1, bRy: .1, mw: .08, ms: .15, blush: .45, lx: .3, ly: .3 }), sq: .975, lean: -.02, d: .5 },
    { t: tNightY - .1, face: F('neutral', { eye: .35, lid: .4, bLy: .2, bRy: .2, mw: .085, ms: .2, blush: .45, lx: .4, ly: .2 }), sq: 1, d: .3 },
    { t: bLaugh + .08, face: F('surprised', { pupil: .55, mo: .085, mw: .06, lx: .55, ly: -.1, sweat: .5 }), lean: 0, d: .1 },
    { t: bLaugh + .55, face: F('embarrassed', { lx: .5, ly: .15, mo: .02 }), armL: ARM.scratch, lean: -.02, d: .3 },
    { t: tOh - .1, face: F('surprised', { pupil: .6, mo: .08, mw: .07, lx: .55, sweat: 1, blush: 1, lines: 1 }), armL: RAISE, armR: RAISE, lean: 0, d: .15 },
    { t: tSorry - .08, lean: .1, sq: .94, armL: ARM.rest, armR: ARM.rest, face: F('happy', { happy: .1, eye: .3, lid: .3, blush: 1, sweat: .9, lines: .8, lx: .3, ly: .4, mw: .1 }), d: .14 },
    { t: tSorry + .3, lean: .035, sq: 1, d: .3 },
    { t: tGM2 - .1, lean: -.01, face: F('happy', { happy: .35, blush: .95, sweat: .7, lines: .5, lx: .55, ly: -.1, mw: .12 }), armL: ARM.chest, d: .25 },
    { t: H3.t1 + .2, lean: 0, face: F('happy', { happy: .2, blush: .85, sweat: .5, lines: .5, lx: .55, bLr: .45, bRr: .45, mw: .1 }), armL: ARM.rest, d: .35 },
    // the close-up: looks away, down; then up at us on "تمانية الصبح!"; at Sara on "ضحكت"; eyes shut on "أنام"
    { t: n4.t0 + .2, face: F('embarrassed', { lx: -.35, ly: .45, mo: .01 }), armL: ARM.scratch, lean: -.02, turn: .3, d: .35 },
    { t: tEight - .1, face: F('surprised', { pupil: .6, mo: .06, mw: .08, mwob: .8, lx: 0, ly: 0, sweat: 1, blush: 1, lines: 1, bLr: .6, bRr: .6 }), armL: ARM.rest, turn: .15, d: .25 },
    { t: tLaughed - .15, face: F('embarrassed', { lx: .75, ly: -.05, mo: .0 }), turn: .3, d: .3 },
    { t: tSleepAg - .2, face: F('embarrassed', { eye: .1, lx: 0, ly: .3, mw: .08, ms: -.2, mwob: 1 }), sq: .965, lean: -.03, d: .4 },
    { t: tShame + .1, face: F('embarrassed', { eye: .45, lid: .3, lx: .3, ly: .4, ms: -.1 }), sq: 1, lean: -.015, d: .35 },
    // coffee: cut back to the two-shot
    { t: cf.t0, face: F('nervous', { lx: .55, ly: 0, sweat: .6, blush: .8, mt: .2, mo: .01, lid: .25 }), turn: .5, lean: 0, sq: 1, armL: ARM.rest, d: .01 },
    { t: C1.t0 - .25, face: F('neutral', { lid: .4, bLy: .1, bRy: .1, bLr: .35, bRr: .35, mw: .095, ms: .3, lx: .5, blush: .55, sweat: .4 }), armL: ARM.shrug, d: .3 },
    { t: tTired - .05, face: F('neutral', { lid: .55, bLy: .05, bRy: .05, bLr: .4, bRr: .4, mw: .09, ms: .15, lx: .45, ly: .2, blush: .55, sweat: .3 }), sq: .975, d: .35 },
    { t: C1.t1 + .3, armL: ARM.rest, sq: 1, d: .3 },
    { t: tCoffee + .1, face: F('surprised', { pupil: .8, mo: .05, mw: .07, lx: .6, ly: -.05, bLy: 1, bRy: 1, blush: .55 }), d: .2 },
    { t: C3.t0 - .1, face: F('joy', { lx: .55, mw: .13 }), armR: TAKE, lean: .03, d: .25 },
    { t: tTake + .1, armR: HOLD, lean: .01, face: F('happy', { happy: .6, lx: .55, mw: .12, mo: .05, blush: .6 }), d: .3 },
    { t: C3.t1 + .2, lean: 0, d: .3 },
    // the first sip: eyes shut, then wide, stars, a happy sigh
    { t: bSip - .35, armR: SIPPOSE, face: F('neutral', { eye: .1, bLy: .3, bRy: .3, mw: .06, mo: .02, ms: .2, blush: .5 }), lean: -.02, d: .35 },
    { t: bSip + .5, face: F('surprised', { pupil: .55, bLy: 1, bRy: 1, mo: .05, mw: .07, ms: .4, lx: .1, ly: -.3, blush: .6 }), sq: 1.06, lean: -.035, armR: HOLD, d: .14 },
    { t: bSip + 1.4, face: F('joy', { lx: .2, mw: .13, mo: .06 }), sq: .985, lean: 0, d: .5 },
    { t: bSip + 2.3, face: F('happy', { happy: .6, lx: .4, mw: .12, blush: .6 }), sq: 1, d: .4 },
    { t: tHuman + .1, face: F('joy', { lx: .5 }), d: .25 }, { t: tHuman + 1.2, face: F('happy', { happy: .5, lx: .5, mw: .12 }), d: .4 },
    // "ردت بجملة مش عارفها": a puzzled look at her
    { t: tNotice - .1, face: F('puzzled', { lx: .6, ly: -.1 }), turn: .55, d: .3 },
    { t: cf.t1 - .3, face: F('happy', { happy: .3, lx: .55, bLr: .3, bRr: .3 }), d: .3 });
  yH.jumps.push({ t: bLaugh + .05, h: .045, d: .3 }, { t: bSip + .48, h: .03, d: .3 });
  yH.blinks.push(bYawn, bLaugh + .08, tOh - .1, tGM2 - .1, n4.t0 + .2, tEight - .1, tLaughed - .15, tShame + .1, cf.t0 + .1, tCoffee + .1, bSip - .35, tNotice - .1);
  // Sara: brings the tray (in the hand on Youssef's side); "Good morning!"; the laugh (hand over her mouth); "So… how are you?"; offers a cup; "You're welcome."
  MK.push({ t: H0.t0 - .3, face: F('happy', { lx: -.5, happy: .5 }), lean: -.02, d: .25 },
    { t: tok(H0, 3).t0 - .1, face: F('happy', { lx: -.5, happy: .3, bLy: .9, bRy: .9 }), lean: -.04, d: .25 },
    { t: H0.t1 + .4, lean: -.01, face: F('happy', { lx: -.5, happy: .35 }), d: .35 },
    { t: bYawn + .3, face: F('puzzled', { lx: -.5, ly: .05 }), d: .35 },
    { t: tNightY + .25, face: F('surprised', { lx: -.5, pupil: .85, mo: .04, mw: .06 }), d: .2 },
    { t: bLaugh - .05, face: F('joy', { lx: -.4, mw: .12, mo: .06 }), turn: -.12, armR: HANDMOUTH, lean: -.05, d: .18 },
    { t: bLaugh + .9, lean: -.03, d: .3 },
    { t: H2.t1 + .75, turn: -.38, armR: ARM.rest, lean: -.01, face: F('happy', { lx: -.5, happy: .6, mw: .12 }), d: .35 },
    { t: tSorry - .05, face: F('happy', { lx: -.55, ly: .05, happy: .45, bLy: .7, bRy: .7 }), d: .3 },
    { t: cf.t0, face: F('happy', { lx: -.5, happy: .35, bLy: .7, bRy: .7 }), turn: -.38, armR: ARM.rest, lean: -.02, d: .01 },
    { t: C0.t0 - .2, lean: -.05, face: F('happy', { lx: -.55, happy: .3, bLy: .9, bRy: .9 }), d: .3 },
    { t: C0.t1 + .3, lean: -.02, d: .35 },
    { t: tTired + .1, face: F('happy', { lx: -.55, ly: .1, happy: .15, bLy: .3, bRy: .3, bLr: .5, bRr: .5, mw: .08 }), d: .3 },
    { t: C2.t0 - .15, face: F('surprised', { lx: -.5, pupil: .85, mo: .05, mw: .06, bLy: 1, bRy: 1 }), d: .2 },
    { t: tCoffee - .2, armL: OFFER, lean: -.05, face: F('happy', { lx: -.55, happy: .55, mw: .12 }), d: .3 },
    { t: tTake + .25, armL: TRAY, lean: -.01, face: F('joy', { lx: -.5 }), d: .35 },
    { t: C4.t0 - .2, face: F('happy', { lx: -.55, happy: .5, lid: .1, mw: .12 }), lean: -.03, d: .25 },
    { t: C4.t1 + .4, lean: 0, face: F('happy', { lx: -.5, happy: .4 }), d: .35 },
    { t: bSip + .6, face: F('joy', { lx: -.5 }), d: .3 }, { t: bSip + 2.2, face: F('happy', { lx: -.5, happy: .45 }), d: .4 },
    { t: tNotice, face: F('happy', { lx: -.5, happy: .5, lid: .1 }), d: .3 });
  mH.jumps.push({ t: bLaugh + .05, h: .03, d: .3 }, { t: bLaugh + .42, h: .028, d: .3 }, { t: bLaugh + .8, h: .022, d: .3 }, { t: tTake + .3, h: .03, d: .32 });
  mH.blinks.push(H0.t0 - .3, bYawn + .3, tNightY + .25, bLaugh - .05, cf.t0 + .3, C2.t0 - .15, tTake + .25, bSip + .6);
  S.yH = yH; S.mH = mH; S.tHand = tHand; S.tTake = tTake; S.tUnknown = tUnknown; S.tNotice = tNotice;
  S.camH = [
    { t: hl.t0 - 1, x: 1430, y: 672, z: 1.7 },
    { t: hl.t0, d: 2.4, ...TWO },
    { t: n4.t0 - .05, d: 0, x: 1365, y: 678, z: 3.25 },
    { t: n4.t0, d: Math.max(.5, cf.t0 - n4.t0), x: 1352, y: 672, z: 3.62 },
    { t: cf.t0, d: 0, ...TWO },
    { t: bSip - .45, d: 1.1, x: 1382, y: 672, z: 2.3 },
    { t: tNotice - .4, d: 1.4, x: 1420, y: 668, z: 1.95 },
  ];
  // ================= door + bye: golden afternoon at the school door =================
  const D0 = DR[0], D1 = DR[1], D2 = DR[2], D3 = DR[3] || DR[DR.length - 1];
  const B0 = BY[0], B1 = BY[1], B2 = BY[2], B3 = BY[3] || BY[BY.length - 1];
  const tDoorOpen = dr.t0 + .05, tOutM = tDoorOpen + .25;
  const tMissing = nwT('ar06', has('ناقصة'), .6), tTell = nwT('ar06', has('هحكيلكم'), .95), tAfwan = nwT('ar06', has('عفوًا'), .35);
  const tThank2 = tok(B1, 2).t0, tLeave0 = B3.t1 + .35, tLeave1 = tLeave0 + 1.7;
  const tFormN = nwT('ar07', has('الاستمارة'), .7), tQ = nwT('ar07', has('سؤال'), .9), tWalking = nwT('ar07', has('ماشي'), .4), tComing = nwT('ar07', has('جاي'), .5);
  const yD = { id: 'youssef', base: { turn: .55, face: F('happy', { happy: .35, lid: .1, lx: .55 }), armL: ARM.rest, armR: ARM.door, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: 1400, x1: 1400, k0: .9, k1: .9 }], keys: [] };
  const BAGARM = { dx: .05, dy: .06, w: 0, bend: 18, elv: [1, .8], flex: .2 }, RESTF = { ...ARM.rest, front: true }, OHUP = { ...ARM.up, front: true };
  const mD = { id: 'mia', base: { turn: 0, face: F('happy', { lx: .1, lid: .1 }), armL: RESTF, armR: BAGARM, alpha: 0, clip: 1, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: tOutM, t1: Math.min(D0.t0 + .1, tOutM + .9), x0: 1530, x1: 1640, y0: 800, y1: GROUND, k0: .6, k1: .9, step: .42 }], keys: [] };
  const DK = yD.keys, EK = mD.keys;
  EK.push({ t: tOutM, alpha: 1, d: .2 }, { t: tOutM + .5, clip: null }, { t: tOutM + .3, turn: -.38, d: .6 },
    { t: D0.t0 - .2, face: F('happy', { lx: -.5, happy: .55, mw: .12 }), lean: -.03, d: .25 }, { t: D0.t1 + .3, lean: -.01, d: .3 },
    { t: bWelcome + .35, face: F('happy', { lx: -.5, happy: .3, bLy: .9, bRy: .9, mw: .09 }), d: .3 },
    { t: D2.t0 - .2, face: F('happy', { lx: -.55, ly: .05, happy: .45, lid: .15, mw: .11 }), lean: -.04, armL: { ...ARM.chest, front: true }, d: .3 },
    { t: D2.t1 + .3, lean: -.01, armL: RESTF, d: .35 },
    { t: D3.t0 + .2, face: F('joy', { lx: -.5 }), d: .25 }, { t: D3.t1 + .6, face: F('happy', { lx: -.5, happy: .4 }), d: .35 },
    // "Oh!" — remembers; the form out of the bag; hands it over
    { t: B0.t0 - .15, face: F('surprised', { lx: -.4, ly: -.3, pupil: .8, mo: .06, mw: .06, bLy: 1, bRy: 1 }), armL: OHUP, lean: -.03, d: .15 },
    { t: bForm - .55, armL: REACHBAG, face: F('happy', { lx: -.3, ly: .4, happy: .3 }), lean: 0, d: .3 },
    { t: bForm - .05, armL: { ...REACH, dx: .14 }, face: F('happy', { lx: -.55, happy: .5, mw: .12 }), lean: -.04, d: .3 },
    { t: tThank2 + .5, armL: RESTF, lean: -.01, face: F('joy', { lx: -.5 }), d: .35 },
    { t: B1.t1 + .6, face: F('happy', { lx: -.5, happy: .4 }), d: .3 },
    // "Good night, Youssef!": a wave; then off to the right
    { t: B2.t0 - .35, armL: { ...DIP, front: true }, face: F('happy', { lx: -.5, happy: .55 }), d: .15 }, { t: B2.t0 - .15, armL: { ...ARM.wave, front: true }, d: .22 },
    { t: B3.t1 + .2, armL: RESTF, d: .35 },
    { t: tLeave0 - .1, turn: .4, d: .4 }, { t: tLeave0 + .35, turn: 1.05, face: F('happy', { lx: .5, happy: .4 }), d: .5 });
  mD.moves.push({ t0: tLeave0, t1: tLeave1, x0: 1640, x1: 2180, k0: .9, k1: .9, step: .42 });
  mD.blinks.push(tOutM + .3, D2.t0 - .2, B0.t0 - .15, bForm - .05, B2.t0 - .35, tLeave0 - .1);
  // the form in his hand: the hand stays at chest height (≈ .41–.45 H) and the sheet hangs below and to the camera-left of it (formHeld), so it never covers the face
  const HOLDF = { dx: -.1, dy: .02, w: 0, bend: 55, elv: [1, .6], flex: 1, front: true }, LOOKF = { dx: -.14, dy: -.02, w: 0, bend: 60, elv: [1, .5], flex: 1, front: true };
  DK.push({ t: D0.t1 - .2, face: F('happy', { happy: .55, lx: .55, mw: .12 }), d: .3 },
    // "Welcome!": chest out, proud, eyes shut with pride
    { t: bWelcome - .2, armR: ARM.rest, armL: ARM.chest, sq: 1.06, lean: -.035, face: F('joy', { bLy: .85, bRy: .85, mw: .12, mo: .05, lx: .5 }), d: .25 },
    { t: D1.t1 + .4, sq: 1.02, lean: -.02, d: .4 },
    // listens: puzzled; repeats carefully, looking up; then delighted
    { t: D2.t0 - .05, armL: ARM.rest, sq: 1, lean: 0, face: F('puzzled', { lx: .55, ly: -.1 }), d: .3 },
    { t: D3.t0 - .2, face: F('happy', { lx: .35, ly: -.55, happy: .2, bLy: .9, bRy: .9, mw: .1 }), armL: RAISE, d: .3 },
    { t: D3.t1 + .1, face: F('joy', { lx: .5 }), armL: ARM.rest, d: .25 },
    { t: tAfwan + .2, face: F('happy', { happy: .4, lx: .55, lid: .1 }), d: .35 },
    { t: tMissing - .15, face: F('puzzled', { lx: .3, ly: -.3 }), armL: ARM.scratch, d: .3 },
    { t: tTell - .15, face: F('happy', { happy: .5, lx: 0, ly: 0, mw: .12 }), turn: .2, armL: OPEN, d: .3 },
    { t: B0.t0 - .1, face: F('surprised', { lx: .6, ly: -.1, pupil: .8, mo: .05, mw: .06 }), turn: .55, armL: ARM.rest, d: .25 },
    { t: bForm + .3, face: F('happy', { lx: .6, ly: .1, happy: .2, bLy: .7, bRy: .7 }), d: .3 },
    // takes the form, reads it, "OK… thank you."
    { t: B1.t0 - .25, armR: { ...REACH, dx: .15 }, lean: .03, d: .25 },
    { t: B1.t0 + .3, armR: HOLDF, lean: .0, face: F('neutral', { lx: .3, ly: .55, lid: .2, bLy: .5, bRy: .5, mw: .09, ms: .3, blush: .5 }), d: .35 },
    { t: tThank2 - .1, face: F('happy', { happy: .5, lx: .55, mw: .12 }), d: .25 },
    // "Good night, Sara!" with a wave (the form stays in the other hand)
    { t: bNight - .35, armL: DIP, face: F('joy', { lx: .55 }), d: .15 }, { t: bNight - .15, armL: ARM.wave, d: .22 },
    { t: B3.t1 + .9, armL: ARM.rest, face: F('happy', { happy: .45, lx: .7, ly: -.05 }), d: .35 },
    { t: tLeave1 - .3, face: F('happy', { happy: .4, lx: .6, ly: -.1 }), turn: .5, d: .3 },
    // "بتتقال وإنت ماشي، مش وإنت جاي": a nod to us; then down at the form
    { t: tWalking - .2, turn: .2, face: F('happy', { happy: .4, lx: 0, ly: 0, bLy: .7, bRy: .7, mw: .11 }), d: .35 },
    { t: tComing + .2, face: F('happy', { happy: .2, lx: 0, ly: 0, bLy: .5, bRy: .5, mw: .1 }), d: .3 },
    { t: tFormN - .2, face: F('puzzled', { lx: .05, ly: .6 }), armR: LOOKF, turn: .15, d: .4 },
    { t: tQ - .2, face: F('puzzled', { lx: 0, ly: .65, bLy: 1, mo: .03, mw: .06, sweat: .4 }), d: .3 });
  yD.jumps.push({ t: bWelcome - .15, h: .05, d: .36 }, { t: D3.t1 + .1, h: .03, d: .3 }, { t: tThank2 - .05, h: .03, d: .3 });
  yD.blinks.push(bWelcome - .2, D2.t0 - .05, D3.t0 - .2, tMissing - .15, tTell - .15, B0.t0 - .1, B1.t0 + .3, bNight - .35, tWalking - .2, tFormN - .2);
  S.yD = yD; S.mD = mD; S.tDoorOpen = tDoorOpen; S.tOutM = tOutM; S.tLeave0 = tLeave0; S.tLeave1 = tLeave1; S.tQ = tQ; S.tFormN = tFormN;
  S.formAt = { out: bForm - .05, take: B1.t0 + .05 };   // in Sara's hand from `out`, in Youssef's from `take`
  S.camD = [
    { t: dr.t0 - 1, x: 1500, y: 668, z: 1.85 },
    { t: tLeave0 + .4, d: 2.0, x: 1440, y: 672, z: 2.15 },
    { t: tFormN - .3, d: 1.6, x: 1416, y: 700, z: 2.5 },
  ];
  S.camAge = [{ t: bAge - 1, x: 1430, y: 740, z: 3.2 }, { t: bAge, d: Math.max(1, rc.t1 - bAge), x: 1440, y: 736, z: 3.4 }];
  // ================= sound cues =================
  cue(0, 'alarm', { dur: S.ring[1], note: 'the alarm clock rings until he slaps it' });
  cue(bWake, 'pop', { note: 'the jolt' }); cue(S.ring[1], 'click', { note: 'the alarm is slapped' });
  cue(tIns0, 'cut_in', { note: 'close-up of the clock: 8:10' }); cue(tIns1, 'cut', { note: 'back to the bed' });
  cue(tSeven, 'thought', { note: 'points at the clock' });
  cue(tLeap - .1, 'whoosh', { note: 'leaps out of bed' }); cue(tLand, 'step', { who: 'youssef', note: 'lands on the floor' });
  cue(tLand + .1, 'sting_shock', { note: '8:10!' });
  cue(tRunOut, 'whoosh', { note: 'runs out' });
  for (let x = tRunOut + .26 * .68; x < tGone && x < tRunOut + 1.0; x += .26) cue(x, 'step', { who: 'youssef', run: true });
  cue(tGone, 'door_close', { note: 'the bedroom door' });
  cue(rn.t0, 'cut', { note: 'the street' });
  cue(rn.t0 + .2, 'ambience_street', { dur: hl.t0 - rn.t0 - .2, note: 'New York morning street bed' });
  for (let x = tRun0 + .28 * .68; x < tRun1; x += .28) cue(x, 'step', { who: 'youssef', run: true });
  cue(S.taxiR[0], 'taxi', { dur: S.taxiR[1] - S.taxiR[0], pan: 'right_to_left', note: 'the yellow cab passes behind' });
  cue(S.thought[0], 'thought', { note: 'thought bubble Good morning!' });
  cue(tDoorR, 'door_open', { note: 'the school door' });
  cue(hl.t0, 'cut', { note: 'the hallway' });
  cue(hl.t0 + .1, 'ambience_hall', { dur: dr.t0 - hl.t0 - .1, note: 'quiet school interior bed' });
  steps(mH, 'mia', hl.t0, cf.t1);
  for (const L of [...HL, ...CF, ...DR, ...BY]) cue(L.t0 - .18, 'bubble', { who: L.who, text: L.text });
  cue(bYawn, 'yawn', { dur: 1.4, note: 'the big yawn' });
  cue(bLaugh, 'laugh', { who: 'mia', dur: 1.2 });
  cue(bLaugh + .1, 'pop', { note: 'snaps awake' });
  cue(tSorry - .05, 'whoosh', { note: 'the bow' });
  cue(n4.t0 - .05, 'cut_in', { note: 'close-up on the embarrassed Youssef (slow push)' });
  cue(cf.t0, 'cut', { note: 'back to the two-shot' });
  cue(tCoffee - .2, 'pop', { note: 'a cup is offered' });
  cue(tTake, 'paper', { note: 'the cup changes hands' });
  cue(bSip, 'sip', { note: 'the first sip' });
  cue(bSip + .5, 'stars', { dur: 1.6, note: 'sparkles around his head' });
  cue(bSip + .5, 'sparkle'); cue(bSip + 1.45, 'sparkle');
  cue(tUnknown, 'pop', { note: '? over his head' });
  cue(dr.t0, 'cut', { note: 'the school door, afternoon' });
  cue(dr.t0 + .1, 'ambience_afternoon', { dur: by.t1 - dr.t0 - .1 });
  cue(tDoorOpen, 'door_open');
  steps(mD, 'mia', dr.t0, by.t1);
  cue(bWelcome - .15, 'pop', { note: 'chest out' });
  cue(B0.t0 - .1, 'ding', { note: 'Oh! remembers' });
  cue(bForm - .05, 'paper', { note: 'the form comes out of the bag' });
  cue(S.formAt.take, 'paper', { note: 'the form changes hands' });
  cue(bAge - .05, 'cut_in', { note: 'close-up of the form' });
  cue(tQ + .05, 'sting_shock', { note: 'the ? over the Age box' });
  return S;
}
function steps(C, who, a, b) {   // one 'step' cue per hop landing
  for (const m of C.moves) {
    if (m.glide) continue;
    const D = m.t1 - m.t0, n = Math.max(1, Math.round(D / (m.step || .42)));
    for (let i = 0; i < n; i++) { const tt = m.t0 + D * (i + .68) / n; if (tt >= a && tt < b) cue(tt, 'step', { who }); }
  }
}

// ======================================================================================================================
// open: the bedroom
export function sceneOpen(c, t) {
  if (t >= S.tIns0 && t < S.tIns1) return clockInsert(c, t);
  const cam = camAt(S.camO, t);
  const ring = t < S.ring[1] ? 1 : 0, thrown = ss(seg(t, S.tLeap + .05, S.tLeap + .4));
  const tap = Math.sin(Math.PI * seg(t, S.ring[1] - .05, S.ring[1] + .2));
  drawBedroom(c, cam, t, { blanket: thrown, live: l => {
    l.save(); l.translate(BEDCLOCK.x, BEDCLOCK.y + BEDCLOCK.r * 1.05); l.scale(1 - .12 * tap, 1 - .18 * tap); l.translate(0, -BEDCLOCK.r * 1.05);
    alarmClock(l, 0, 0, BEDCLOCK.r, 8 + 10 / 60, ring, t); l.restore();
  } });
  const R = drawActor(c, cam, S.yB, t);
  if (thrown < 1) {   // the tucked blanket over his legs is drawn in front of him (the set layer only holds the thrown heap)
    c.save(); layerT(c, cam, 1); blanket(c, thrown, t, 'tucked'); c.restore(); c.setTransform(1, 0, 0, 1, 0, 0);
  }
  const yh = head(R, 'youssef');
  // z z z while he sleeps; speed lines when he runs out
  if (t < S.bWake + .1 && yh) zzz(c, yh[0] + 40, yh[1] - 20, t, 1 - seg(t, S.bWake - .1, S.bWake + .1), 1.1 * R.Z);
  if (t > S.tRunOut && t < S.tGone + .2 && R.sx != null) speedLines(c, t, R, R.Z);
  // the shock mark on landing
  const k = seg(t, S.tLand + .1, S.tLand + .45) * (1 - seg(t, S.tRunOut - .4, S.tRunOut - .15));
  if (k > 0 && yh) bigMark(c, yh[0] + 150 * R.Z, yh[1] - 120 * R.Z, '!', 150 * R.Z, k, .15 + Math.sin(t * 9) * .06, P.red);
  return { cam };
}
// insert: the alarm clock on the bedside table, 8:10
function clockInsert(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  const g = c.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, mix('#A795D6', P.cream, .62)); g.addColorStop(1, mix('#A795D6', P.cream, .78));
  c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  const v = c.createRadialGradient(300, 150, 0, 300, 150, 1500); v.addColorStop(0, rgba('#FFF6E8', .5)); v.addColorStop(1, rgba('#FFF6E8', 0)); c.fillStyle = v; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = '#C98B5E'; c.fillRect(0, 740, 1920, 400); c.fillStyle = rgba('#FFFFFF', .25); c.fillRect(0, 740, 1920, 16);
  c.fillStyle = '#A9683F'; c.fillRect(0, 800, 1920, 300);
  const z = 1 + .05 * eio(seg(t, S.tIns0, S.tIns1));
  c.save(); c.translate(960, 540); c.scale(z, z);
  ell(c, 20, 192, 230, 26); c.fillStyle = rgba('#1E1B33', .25); c.fill();
  alarmClock(c, 0, 0, 165, 8 + 10 / 60, 0, t);
  c.restore();
  const k = back(seg(t, S.tIns0 + .1, S.tIns0 + .45), 2);
  c.save(); c.translate(1340, 560); c.scale(k, k); timeTag(c, 0, 0, '8:10', 1.15); c.restore();
  return {};
}
function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function speedLines(c, t, st, Z = 1) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.strokeStyle = rgba(P.ink, .25); c.lineWidth = 6 * Z; c.lineCap = 'round';
  const d = st.dir || 1;
  for (let i = 0; i < 4; i++) { const y = st.sy - (80 + i * 55) * Z, ph = (t * 3 + i * .37) % 1, x = st.sx - d * (170 + ph * 120) * Z; c.globalAlpha = 1 - ph; c.beginPath(); c.moveTo(x, y); c.lineTo(x - d * 90 * Z, y); c.stroke(); }
  c.restore();
}

// run: the street
export function sceneRun(c, t) {
  const cam = camAt(S.camR, t), dof = dofOf(cam.z);
  const midC = 960 + (cam.x - 960) * .45, bu = seg(t, S.taxiR[0], S.taxiR[1]);
  const door = eo(seg(t, S.tDoorR, S.tDoorR + .6));
  drawWorld(c, cam, t, { door, dof, taxiX: bu > 0 && bu < 1 ? midC + 1300 - 2600 * bu : null, clock: 8.25 });
  const R = drawActor(c, cam, S.yR, t, { door });
  if (R.sx != null && t < S.tRun1 - .3) speedLines(c, t, R, R.Z);
  const yh = head(R, 'youssef');
  const [th0, th1] = S.thought;
  if (yh && t > th0 && t < th1 + .3) {
    const pop = seg(t, th0, th0 + .5), out = seg(t, th1, th1 + .25), bob = Math.sin(t * 2.4) * 4;
    thought(c, { x: yh[0] - 290, y: yh[1] - 150 + bob, w: 470, h: 210, hx: yh[0] - 50, hy: yh[1] + 10, pop, out }, cc => {
      cc.font = '600 62px "Fredoka"'; cc.fillStyle = P.ink; cc.textAlign = 'center'; cc.textBaseline = 'alphabetic';
      cc.fillText('Good morning!', 26, 22);
      sunIcon(cc, -176, 0, 24, P.mustard, t);
    });
  }
  return { cam };
}

// hall + coffee: one continuous interior; close-up during ar04
export function sceneHall(c, t) {
  const cam = camAt(S.camH, t), dof = dofOf(cam.z);
  drawHall(c, cam, t, { dof, clock: 8.2 + (t - S.hl.t0) / 3600 * 40 });
  const closeUp = t >= S.n4.t0 - .05 && t < S.cf.t0;
  const yst = charState(S.yH, t), mst = charState(S.mH, t);
  const order = (mst.y < yst.y ? [[S.mH, 'm'], [S.yH, 'y']] : [[S.yH, 'y'], [S.mH, 'm']]).filter(([, n]) => !(closeUp && n === 'm'));
  const R = {};
  const yHas = t >= S.tTake, mN = t >= S.tTake ? 1 : 2;
  for (const [C, n] of order) {
    if (n === 'm') R.m = drawActor(c, cam, C, t, { front: (h, k) => { if (!h[0][2]) trayIn(c, 'mia', h[0], k, t, mN, 1); } });
    else R.y = drawActor(c, cam, C, t, { front: (h, k) => { if (yHas && !h[1][2]) cupIn(c, 'youssef', h[1], k, t, t < S.bSip + 6 ? 1 : .5, -.35 * ss(seg(t, S.bSip - .35, S.bSip - .05)) * (1 - ss(seg(t, S.bSip + .5, S.bSip + .75)))); } });
  }
  const yh = head(R.y, 'youssef'), mh = R.m && R.m.sx != null ? head(R.m, 'mia', 1.12) : null;
  // stars after the first sip: a ring of sparkles orbiting his head
  const s0 = S.bSip + .45;
  if (yh && t > s0 && t < s0 + 2.1) {
    const Z = R.y.Z, cx = yh[0] + 10 * Z, cy = yh[1] + 48 * Z;
    for (let i = 0; i < 7; i++) {
      const u = seg(t, s0 + i * .09, s0 + 1.25 + i * .09); if (u <= 0 || u >= 1) continue;
      const a = i * .9 + .3 + t * 1.2, r = (78 + 16 * Math.sin(i * 2.1)) * Z * (.7 + .4 * eo(u));
      sparkle(c, cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * .8, (15 + 5 * (i % 3)) * Math.sin(Math.PI * u) * Z, [P.mustard, P.cream, P.mustard, P.red][i % 4], a + u * 3);
    }
  }
  // "?" over his head when she says something he does not know
  if (yh) { const k = seg(t, S.tUnknown, S.tUnknown + .35) * (1 - seg(t, S.cf.t1 - .6, S.cf.t1 - .3)); if (k > 0) bigMark(c, yh[0] + 110 * R.y.Z * .6, yh[1] - 90 * R.y.Z * .6, '?', 110 * R.y.Z * .6, k, .12 + Math.sin(t * 5) * .08, P.mustard); }
  // dialogue bubbles
  if (!closeUp) {
    const lines = [...S.HL, ...S.CF];
    lines.forEach((L, i) => {
      const nx = lines[i + 1] ? lines[i + 1].t0 : null;
      if (!(L.who === 'mia' ? mh : yh)) return;
      if (L === S.HL[3]) { if (t < S.n4.t0 - .05) lineBubble(c, L, t, { x: yh[0] + 20, y: yh[1], side: -1, lift: 70 }, { until: S.n4.t0 - .3 }); return; }
      const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70 } : { x: yh[0] + 20, y: yh[1], side: -1, lift: 70 };
      lineBubble(c, L, t, { ...pos, wordFx: L === S.HL[1] ? (k, tt) => (k === 0 && tt > L.tok[0].t1 && tt < L.tok[1].t0 ? { shake: tt * .4 } : {}) : null }, { next: nx, hold: 1.2 });
    });
  } else {
    // the close-up: a soft vignette and the slow push are the frame; blush + sweat do the acting
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const a = seg(t, S.n4.t0, S.n4.t0 + .4);
    const v = c.createRadialGradient(960, 540, 480, 960, 540, 1200); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${.3 * a})`);
    c.fillStyle = v; c.fillRect(0, 0, 1920, 1080); c.restore();
  }
  return { cam };
}

// door + bye (golden afternoon), then the close-up of the form
export function sceneDoor(c, t) {
  if (t >= S.bAge) return formCloseUp(c, t);
  const cam = camAt(S.camD, t), dof = dofOf(cam.z), tod = 1;
  const door = eo(seg(t, S.tDoorOpen, S.tDoorOpen + .6));
  drawWorld(c, cam, t, { door, dof, tod, clock: 15.5 + (t - S.dr.t0) / 3600 * 60 });
  const yst = charState(S.yD, t), mst = charState(S.mD, t);
  const order = mst.y < yst.y ? [[S.mD, 'm'], [S.yD, 'y']] : [[S.yD, 'y'], [S.mD, 'm']];
  const R = {};
  const mForm = t >= S.formAt.out && t < S.formAt.take, yForm = t >= S.formAt.take;
  for (const [C, n] of order) {
    if (n === 'm') R.m = drawActor(c, cam, C, t, { door, behind: (h, k) => { if (h[1][2]) bagIn(c, 'mia', h[1], k); }, front: (h, k) => { if (!h[1][2]) bagIn(c, 'mia', h[1], k); if (mForm && !h[0][2]) formIn(c, 'mia', h[0], k, -1); } });
    else R.y = drawActor(c, cam, C, t, { door, front: (h, k) => { if (yForm && !h[1][2]) formHeld(c, 'youssef', h[1], k); } });
  }
  grade(c, tod);
  const yh = head(R.y, 'youssef'), mh = R.m && R.m.sx != null ? head(R.m, 'mia', 1.12) : null;
  const lines = [...S.DR, ...S.BY];
  lines.forEach((L, i) => {
    const nx = lines[i + 1] ? lines[i + 1].t0 : null;
    if (!(L.who === 'mia' ? mh : yh)) return;
    if (L.who === 'mia' && t > S.tLeave0 + .3) return;
    const pos = L.who === 'mia' ? { x: mh[0] - 10, y: mh[1], side: 0, lift: 70, maxX: 1880 } : { x: yh[0] + 20, y: yh[1], side: -1, lift: 70 };
    lineBubble(c, L, t, pos, { next: nx, hold: 1.2 });
  });
  return { cam };
}
// the form fills the frame, held in his two hands; a big ? pops over the Age box
function formCloseUp(c, t) {
  const cam = camAt(S.camAge, t);
  drawWorld(c, cam, t, { door: 1, dof: 8, tod: 1, clock: 15.6 });
  grade(c, 1);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const u = eio(seg(t, S.bAge, S.bAge + 2.5)), z = 1 + .06 * u, rot = -.06 + .01 * Math.sin(t * .7);
  c.translate(960, 600); c.scale(z, z);
  const W = 1180, Hh = 860;
  const q = seg(t, S.tQ, S.tQ + .35);
  drawForm(c, 0, 0, W, Hh, { rot, text: true, age: q });
  // his thumbs at the bottom corners
  for (const s of [-1, 1]) { c.save(); c.rotate(rot); c.translate(s * W * .36, Hh * .42); const r = 48; ell(c, 0, 0, r * 1.25, r * .95); c.fillStyle = mix(CAST.youssef.skin, '#4B2E52', .32); c.fill(); ell(c, -4, -5, r * 1.05, r * .8); c.fillStyle = CAST.youssef.skin; c.fill(); c.restore(); }
  // the ?
  const yq = -Hh / 2 + Hh * .106 * .8 + Hh * .17 + 2 * Hh * .17;
  bigMark(c, W * .22, yq - 40, '?', 230, q, .12 + Math.sin((t - S.tQ) * 5) * .12 * Math.exp(-(t - S.tQ) * .5), P.mustard);
  c.restore();
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
export { charState, drawActor, head, H, TWO, speedLines };
