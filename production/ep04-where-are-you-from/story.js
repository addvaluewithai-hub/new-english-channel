// Episode 4 — story scenes, all in the new classroom: open (Youssef comes in, the question on the board) → intro (Ana first,
// then Youssef's "I am live in Queens." and the freeze) → fix (Sara's fix on the board, "Where in Egypt?", Madrid, the
// nationalities) → hook ("So, Youssef… what do you do?" and he is stuck). Every time below comes from timeline.json
// (sections, beats, lines, narration words); offsets are acting/animation only.
import { P, rgba, mix } from './kit.js';
import { CAST, drawChar, drawForm, drawHand, handPos } from './bean.js';
import { drawClass, deskFront, layerT, toScreen, GROUND, CLASS } from './world.js';
import { clamp, lerp, seg, ss, eio, eo, back, hash } from '/core/lib.js';
import { SEC, BEAT, NARR, LINES, nwT, has } from './tl.js';
import { fold, F, moveAt, hop, liveFace, springAt, smoothArms, dart, EXPR, ARM, pose, CUP, POINT, CLAP, DIP, OPEN, RAISE, REACH, HOLDLOW, FACEPALM, INWARD } from './act.js';
import { lineBubble, bubble, wordStates, sparkle, bigMark, SPEAKER } from './ui.js';
import { cue } from './cues.js';

SPEAKER.ana = { name: 'ANA', tab: '#147A72', hi: P.mustard };   // Ana's name tab (dark teal), added here so the shared ui.js stays unchanged
const H = { youssef: 300, mia: 276, ana: 266 };
const SEAT = 22;   // a seated student sinks this far behind the desk
const X = { mia: 470, ana: CLASS.desks.ana, youssef: CLASS.desks.youssef };
const WIDE = { x: 960, y: 548, z: 1.04 };
const SARA = { x: 700, y: 560, z: 1.5 }, ANA1 = { x: 1180, y: 520, z: 1.4 }, YOU1 = { x: 1200, y: 520, z: 1.4 }, PAIR = { x: 1262, y: 750, z: 1.85 };
let S = null;

// ---- camera: keys fold like poses; z eases in log space; d = 0 is a cut ----
export function camAt(keys, t) {
  let c = null;
  for (const k of keys) {
    if (t < k.t) break;
    const tg = k.f ? k.f(t) : k;
    const p = !c || !k.d ? 1 : eio((t - k.t) / k.d);
    c = !c ? { x: tg.x, y: tg.y, z: tg.z } : { x: lerp(c.x, tg.x, p), y: lerp(c.y, tg.y, p), z: Math.exp(lerp(Math.log(c.z), Math.log(tg.z), p)) };
  }
  return c || { ...WIDE };
}
export const dofOf = z => 2 * ss(seg(z, 1.3, 1.8)) + 7 * ss(seg(z, 2.5, 3.4));

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

// draw one character with a camera; extra.front(hands, k) draws held props
function drawActor(c, cam, C, t, extra = {}) {
  const st = charState(C, t);
  if ((st.alpha ?? 1) <= 0) return st;
  const [x, y, Z] = toScreen(cam, 1, st.x, st.y);
  let face = extra.frozenFace;
  if (!face) {
    if (C.id === 'ana') {   // the shared idle darts are seeded per id with mia's or youssef's offsets; Ana gets her own phase
      face = liveFace('ana', t, st.face, { blinks: C.blinks, extra: C.talkExtra, darts: false });
      const [dx, dy] = dart('ana', t + 17.3); face = { ...face, lx: face.lx + dx, ly: face.ly + dy * .6 };
    } else face = liveFace(C.id, t, st.face, { blinks: C.blinks, extra: C.talkExtra });
  }
  const p = pose({ ...st, ...smoothArms(C, t), x, y, k: st.k * Z, face, pony: C.id === 'mia' ? (extra.pony ?? springAt(springFor(C), t)) : 0,
    quiff: C.id === 'youssef' ? (extra.quiff ?? springAt(springFor(C), t, .25)) : 0, breathe: Math.sin(t * Math.PI * 2 / 3.2 + (C.id === 'mia' ? 1 : C.id === 'ana' ? 2 : 0)) });
  const hands = extra.front ? handPos(CAST[C.id], p) : null;
  c.save();
  if (st.alpha < 1) c.globalAlpha = st.alpha;
  drawChar(c, CAST[C.id], p);
  if (extra.front) extra.front(hands, p.k);
  c.restore();
  return { ...st, sx: x, sy: y, Z, hands, ks: p.k };
}
const head = (st, id, f = 1.08) => st && st.sx != null ? [st.sx, st.sy - H[id] * st.k * st.Z * f] : null;
const hand = (c, id, h, k) => drawHand(c, CAST[id], h[0], h[1], H[id] * k, { dir: h[3] });
// the form held by its top corner at chest height (the sheet hangs below the hand, the face stays clear)
const formHeld = (c, id, h, k) => { drawForm(c, h[0] + .09 * 300 * k, h[1] + .1 * 300 * k, .24 * 300 * k, .3 * 300 * k, { rot: .15, age: 0 }); hand(c, id, h, k); };

const tokT = (L, re, d = 0) => { if (!L) return null; const o = L.tok.find(o => re.test(o.w)); return o ? o.t0 : L.t0 + (L.t1 - L.t0) * d; };
const LN = (scene, re) => LINES(scene).find(l => re.test(l.text)) || null;

// ======================================================================================================================
export function buildStory() {
  const op = SEC('open'), it = SEC('intro'), fx = SEC('fix'), hk = SEC('hook'), rc = SEC('recap');
  const n1 = NARR('ar01'), n2 = NARR('ar02'), n3 = NARR('ar03'), n4 = NARR('ar04'), n5 = NARR('ar05');
  const bEnter = BEAT('enter', .2), bTitle = BEAT('title', op.t1 - 3.2), bAnaUp = BEAT('ana_up', it.t0 + 4), bAnaDown = BEAT('ana_down', it.t0 + 9),
    bYouUp = BEAT('you_up', it.t0 + 12), bFreeze = BEAT('freeze', it.t1 - 8), bUn = BEAT('unfreeze', fx.t0), bBoard = BEAT('board', fx.t0 + .3),
    bCairo = BEAT('cairo', fx.t0 + 7), bStuck = BEAT('stuck', hk.t0 + 4);
  // the lines
  const I0 = LN('intro', /^OK, class/), I1 = LN('intro', /^Hi, every/), I2 = LN('intro', /^Great/), I3 = LN('intro', /^Youssef\?/), I4 = LN('intro', /^Hello/);
  const F0 = LN('fix', /^I live/), F1 = LN('fix', /^Oh!/), F2 = LN('fix', /^Good!/), F3 = LN('fix', /^Cairo/), F4 = LN('fix', /^Ana, are/), F5 = LN('fix', /^Yes, I am/),
    F6 = LN('fix', /^Yes! I'm/), F7 = LN('fix', /^And I'm American/), K0 = LN('hook', /^OK!/);
  S = { op, it, fx, hk, rc, n1, n2, n3, n4, n5, bEnter, bTitle, bAnaUp, bAnaDown, bYouUp, bFreeze, bUn, bBoard, bCairo, bStuck, I0, I1, I2, I3, I4, F0, F1, F2, F3, F4, F5, F6, F7, K0 };
  // narration keys
  const tMate = nwT('ar01', has('زميلة'), .85), tMap = nwT('ar01', has('وخريطة'), .6), tClass1 = nwT('ar01', has('كلاس'), .35);
  const tBoardW = nwT('ar02', has('السبورة'), .1), tQ = nwT('ar02', w => /^Where are/i.test(w), .3), tEasy = nwT('ar02', has('سهل'), .5), tIm = nwT('ar02', w => /^I'm/.test(w), .65), tEvery = nwT('ar02', has('حتة'), .9);
  const tCorr = nwT('ar04', has('صلّحتها'), .15), tCairoN = nwT('ar04', w => /^Cairo/.test(w), .55), tAmb = nwT('ar04', has('سفير'), .8);
  const tAsked = nwT('ar05', has('سألت'), .2), tFroze = nwT('ar05', has('اتجمدت'), .45), tEng = nwT('ar05', has('مهندس'), .7), tHow = nwT('ar05', has('إزاي'), .95);
  // token times in the lines
  const tSpain = tokT(I1, /^Spain/, .6), tHiAll = tokT(I1, /^Hi/), tAna = tokT(I1, /^Ana/, .3), tBrook = tokT(I1, /^Brooklyn/, .9), tLiveA = tokT(I1, /^live/, .8);
  const tEgypt = tokT(I4, /^Egypt/, .6), tHello = tokT(I4, /^Hello/), tYou = tokT(I4, /^Youssef/, .25), tIam = tokT(I4, /^am$/, .8), tQueens = tokT(I4, /^Queens/, .95);
  const tSorry = tokT(F1, /^Sorry/, .3), tLive2 = tokT(F1, /^live/, .7), tWhereIn = tokT(F2, /^Where/, .4), tMadrid = tokT(F4, /^Madrid/, .8), tYesA = tokT(F5, /^Yes/),
    tYoure = tokT(F5, /^you're/i, .7), tEgyptian = tokT(F6, /^Egyptian/, .7), tAmer = tokT(F7, /^American/, .3), tNY = tokT(F7, /^New/, .7), tNext = tokT(K0, /^Next/, .2), tSo = tokT(K0, /^So/, .5), tWhat = tokT(K0, /^what/i, .75);
  Object.assign(S, { tMate, tMap, tBoardW, tQ, tEasy, tIm, tEvery, tCorr, tCairoN, tAmb, tAsked, tFroze, tEng, tHow, tSpain, tEgypt, tIam, tQueens, tMadrid, tAmer, tNY, tWhat, tSo, tYoure });
  const tArrive = bEnter + 3.1, tSit = tArrive + .25;
  S.tArrive = tArrive; S.tSit = tSit;

  // ================= Sara: by the board, facing the class =================
  const sRest = F('happy', { lx: .5, happy: .4 }), FRONT = A => ({ ...A, front: true });
  const mC = { id: 'mia', base: { turn: .42, face: sRest, armL: ARM.rest, armR: ARM.rest, kmul: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: X.mia, x1: X.mia, k0: .9, k1: .9 }], keys: [] };
  const MK = mC.keys;
  // the opening: she faces the board and points at it while the question writes itself; then turns to welcome Youssef
  MK.push({ t: 0, turn: .75, face: F('happy', { lx: .8, ly: -.4, happy: .3 }), armR: FRONT(ARM.up), d: .01 },
    { t: 2.5, turn: .45, face: F('happy', { lx: .7, ly: -.05, happy: .5 }), armR: ARM.rest, d: .4 },
    { t: tArrive - .3, armL: DIP, d: .15 }, { t: tArrive - .1, armL: ARM.wave, face: F('joy', { lx: .7 }), d: .2 }, { t: tArrive + 1.0, armL: ARM.rest, face: sRest, d: .3 },
    { t: tBoardW - .3, turn: .8, face: F('happy', { lx: .8, ly: -.45, happy: .3 }), armR: FRONT({ ...ARM.up, dx: .16 }), d: .3 },
    { t: tEasy - .1, turn: .42, armR: ARM.rest, face: sRest, d: .4 });
  // en1: "OK, class! Let's meet." (claps) "Where are you from?" (points at the board) "Ana, you first!" (open hand to Ana)
  if (I0) MK.push({ t: I0.t0 - .25, armL: CLAP, armR: CLAP, face: F('joy', { lx: .5 }), d: .16 }, { t: I0.t0 + .45, armL: ARM.rest, armR: ARM.rest, d: .25 },
    { t: tokT(I0, /^Where/, .4) - .2, turn: .7, armR: FRONT({ ...ARM.up, dx: .16 }), face: F('happy', { lx: .85, ly: -.4, happy: .4 }), d: .25 },
    { t: tokT(I0, /^Ana/, .7) - .2, turn: .42, armR: FRONT(OPEN), face: F('happy', { lx: .55, happy: .55, bLy: .8, bRy: .8 }), lean: .03, d: .25 },
    { t: I0.t1 + .5, armR: ARM.rest, lean: 0, face: sRest, d: .3 });
  if (I2) MK.push({ t: I2.t0 - .2, armL: CLAP, armR: CLAP, face: F('joy', { lx: .55 }), d: .16 }, { t: I2.t0 + .7, armL: ARM.rest, armR: ARM.rest, face: sRest, d: .3 });
  if (I3) MK.push({ t: I3.t0 - .25, armR: FRONT(OPEN), lean: .04, face: F('happy', { lx: .7, happy: .5, bLy: .8, bRy: .8 }), d: .25 }, { t: I3.t1 + .4, armR: ARM.rest, lean: 0, d: .3 });
  if (I4) MK.push({ t: tIam + .1, face: F('surprised', { lx: .75, pupil: .85, mo: .03, mw: .06, bLy: .9, bRy: .9 }), d: .2 });
  // fix: gentle — turns to the board (the fix writes itself) and back; "Good!"; "Where in Egypt?"
  MK.push({ t: bUn, face: F('happy', { lx: .7, happy: .35, bLy: .6, bRy: .6 }), d: .01 });
  if (F0) MK.push({ t: F0.t0 - .35, turn: .8, armR: FRONT({ ...ARM.up, dx: .16 }), face: F('happy', { lx: .85, ly: -.35, happy: .45 }), d: .3 },
    { t: F0.t1 + .25, turn: .42, armR: FRONT(OPEN), face: F('happy', { lx: .7, happy: .55, lid: .1 }), d: .3 }, { t: F0.t1 + 1.1, armR: ARM.rest, d: .3 });
  if (F2) MK.push({ t: F2.t0 - .2, face: F('joy', { lx: .7 }), armL: CLAP, armR: CLAP, d: .15 }, { t: F2.t0 + .5, armL: ARM.rest, armR: ARM.rest, d: .25 },
    { t: tWhereIn - .15, face: F('happy', { lx: .75, happy: .4, bLy: 1, bRy: 1 }), lean: .03, d: .25 }, { t: F2.t1 + .4, lean: 0, d: .3 });
  if (F3) MK.push({ t: F3.t1 + .1, face: F('joy', { lx: .7 }), d: .2 }, { t: F3.t1 + 1.2, face: sRest, d: .3 });
  // en4: she watches the two students, smiling; en5: hand on her chest, "American", a laugh
  if (F4) MK.push({ t: F4.t0, face: F('happy', { lx: .85, ly: .1, happy: .55 }), d: .3 });
  if (F7) MK.push({ t: F7.t0 - .25, armL: { ...ARM.chest, front: true }, face: F('joy', { lx: .5, mw: .12 }), lean: -.03, d: .25 }, { t: tNY - .1, armL: ARM.rest, armR: FRONT(RAISE), d: .2 },
    { t: F7.t1 + .4, armR: ARM.rest, lean: 0, face: sRest, d: .3 });
  // hook: a finger up on "Next question", then the open hand to Youssef on "what do you do?"
  if (K0) MK.push({ t: K0.t0 - .2, armR: FRONT({ ...ARM.up, dx: .12 }), face: F('happy', { lx: .6, happy: .4, bLy: .9, bRy: .9 }), d: .2 },
    { t: tSo - .2, armR: FRONT(OPEN), lean: .04, face: F('happy', { lx: .8, ly: .05, happy: .5, bLy: 1, bRy: .7 }), d: .3 },
    { t: bStuck + .2, face: F('puzzled', { lx: .8, ly: .05 }), d: .4 });
  mC.jumps.push({ t: tArrive - .05, h: .03, d: .3 });
  if (I0) mC.jumps.push({ t: I0.t0 - .1, h: .03, d: .3 });
  if (F2) mC.jumps.push({ t: F2.t0 - .1, h: .03, d: .3 });
  if (F7) mC.jumps.push({ t: F7.t1 - .2, h: .03, d: .3 });
  mC.blinks.push(2.5, tBoardW - .3, tEasy - .1, bUn + .2);

  // ================= Ana: seated at her desk; stands to introduce herself; talks to Youssef =================
  const aRest = F('happy', { lx: -.5, happy: .35 });
  const aC = { id: 'ana', base: { turn: -.32, face: aRest, armL: ARM.rest, armR: ARM.rest, kmul: 1, seat: 1 }, blinks: [], jumps: [],
    moves: [{ t0: -1, t1: -.9, x0: X.ana, x1: X.ana, k0: .9, k1: .9 }], keys: [] };
  const AK = aC.keys;
  AK.push({ t: bEnter + .4, turn: .35, face: F('happy', { lx: .7, happy: .4, bLy: .6, bRy: .6 }), d: .45 },   // looks at the door
    { t: tMate - .35, armR: FRONT(DIP), turn: .45, face: F('joy', { lx: .7 }), d: .15 }, { t: tMate - .15, armR: FRONT(ARM.wave), d: .2 },
    { t: tMate + 1.1, armR: ARM.rest, face: F('happy', { lx: .7, happy: .55 }), d: .3 },
    { t: tBoardW - .2, turn: -.3, face: F('happy', { lx: -.6, ly: -.3, happy: .3 }), d: .45 },
    { t: tEvery + .2, turn: .3, face: F('happy', { lx: .7, happy: .45 }), d: .4 },
    { t: bTitle + 1.5, turn: -.32, face: aRest, d: .5 });
  if (I0) AK.push({ t: I0.t0 - .1, face: F('happy', { lx: -.7, ly: -.1, happy: .45 }), d: .3 }, { t: tokT(I0, /^Ana/, .7), face: F('surprised', { lx: -.7, pupil: .85, mo: .04, mw: .06, bLy: 1, bRy: 1 }), d: .15 });
  // stands: the chatty introduction to the whole class (turned toward us)
  AK.push({ t: bAnaUp, seat: 0, turn: -.08, face: F('joy', { lx: -.2 }), d: .32 });
  if (I1) AK.push({ t: tHiAll - .3, armR: FRONT(DIP), d: .14 }, { t: tHiAll - .12, armR: FRONT(ARM.wave), face: F('joy', { lx: 0 }), d: .18 },
    { t: tAna - .2, armR: ARM.rest, armL: { ...ARM.chest, front: true }, face: F('happy', { lx: -.1, happy: .6, mw: .12 }), d: .25 },
    { t: tSpain - .3, armL: ARM.rest, armR: FRONT({ ...ARM.up, dx: .2, dy: -.25 }), turn: .15, face: F('happy', { lx: .8, ly: -.6, happy: .5, bLy: .8, bRy: .8 }), d: .25 },   // points up at the map
    { t: tLiveA - .25, armR: FRONT(OPEN), turn: -.08, face: F('happy', { lx: -.2, ly: 0, happy: .55, mw: .12 }), d: .3 },
    { t: I1.t1 + .2, armR: ARM.rest, face: F('joy', { lx: -.5 }), d: .3 });
  AK.push({ t: bAnaDown, seat: 1, turn: -.32, face: F('happy', { lx: -.6, happy: .5 }), d: .35 });
  if (I4) AK.push({ t: I4.t0 - .3, turn: .35, face: F('happy', { lx: .75, happy: .45 }), d: .4 }, { t: tIam + .15, face: F('surprised', { lx: .8, pupil: .85, mo: .04, mw: .06 }), d: .2 });
  AK.push({ t: bUn, face: F('happy', { lx: .75, happy: .3, bLr: .3, bRr: .3 }), d: .01 });
  if (F0) AK.push({ t: F0.t0 - .2, turn: -.32, face: F('happy', { lx: -.75, ly: -.2, happy: .3 }), d: .4 });
  if (F1) AK.push({ t: F1.t0, turn: .35, face: F('happy', { lx: .75, happy: .45 }), d: .4 });
  if (F3) AK.push({ t: F3.t0 + .1, face: F('joy', { lx: .75 }), d: .2 }, { t: F3.t1 + .9, face: F('happy', { lx: .75, happy: .45 }), d: .3 });
  if (n4) AK.push({ t: tAmb - .2, armL: CLAP, armR: CLAP, face: F('joy', { lx: .75 }), d: .16 }, { t: tAmb + .8, armL: ARM.rest, armR: ARM.rest, face: F('happy', { lx: .75, happy: .5 }), d: .3 });
  // en4: "Yes, I am! I'm Spanish. And you're Egyptian!" — a happy hop, hand on her chest, then a point at him
  if (F4) AK.push({ t: F4.t0 - .2, turn: .42, face: F('happy', { lx: .8, happy: .45, bLy: .7, bRy: .7 }), d: .3 }, { t: tMadrid - .05, face: F('surprised', { lx: .8, pupil: .85, mo: .05, mw: .07, bLy: 1, bRy: 1 }), d: .15 });
  if (F5) AK.push({ t: tYesA - .15, face: F('joy', { lx: .8 }), armL: { ...ARM.chest, front: true }, d: .2 },
    { t: tYoure - .25, armL: ARM.rest, armR: FRONT(POINT), face: F('happy', { lx: .85, happy: .6, mw: .13 }), lean: .03, d: .25 },
    { t: F5.t1 + .35, armR: ARM.rest, lean: 0, face: F('happy', { lx: .8, happy: .5 }), d: .3 });
  if (F7) AK.push({ t: F7.t0 - .1, turn: -.32, face: F('happy', { lx: -.75, happy: .55 }), d: .4 }, { t: F7.t1 + .1, face: F('joy', { lx: -.7 }), d: .2 });
  if (K0) AK.push({ t: tSo, turn: .3, face: F('happy', { lx: .8, happy: .4, bLy: .8, bRy: .8 }), d: .4 }, { t: bStuck + .4, face: F('puzzled', { lx: .8, ly: 0 }), d: .4 });
  aC.jumps.push({ t: bAnaUp - .05, h: .06, d: .34 }, { t: bAnaDown - .05, h: .03, d: .3 });
  if (F5) aC.jumps.push({ t: tYesA - .1, h: .06, d: .34 });
  aC.blinks.push(bEnter + .4, tMate - .35, bAnaUp, bAnaDown, bUn + .3, tYesA - .15);

  // ================= Youssef: in through the door with the form; sits; "I am live in Queens."; the fix; "Cairo!"; stuck =================
  const yRest = F('happy', { lx: -.5, happy: .35 }), HOLDF = { dx: -.1, dy: .02, w: 0, bend: 55, elv: [1, .6], flex: 1, front: true };
  const yC = { id: 'youssef', base: { turn: -.55, face: F('happy', { lx: -.6, happy: .4, sweat: .2 }), armL: ARM.rest, armR: HOLDF, kmul: 1, seat: 0 }, blinks: [], jumps: [],
    moves: [{ t0: bEnter, t1: tArrive, x0: 2080, x1: X.youssef, k0: .9, k1: .9, step: .4 }], keys: [] };
  const YK = yC.keys;
  YK.push({ t: tArrive - .05, turn: -.45, face: F('happy', { lx: -.7, happy: .45, bLy: .7, bRy: .7 }), d: .3 },
    { t: tSit, seat: 1, armR: ARM.rest, d: .32 },   // sits; the form goes onto the desk
    { t: tMate - .1, turn: -.35, face: F('embarrassed', { lx: -.8, ly: .1, happy: .3, blush: .9, sweat: 0, lines: .4 }), d: .3 },
    { t: tMate + .05, armL: { ...DIP, front: true }, d: .14 }, { t: tMate + .22, armL: { ...ARM.wave, front: true, w: .6 }, d: .2 }, { t: tMate + 1.2, armL: ARM.rest, face: yRest, d: .3 },
    { t: tBoardW - .1, turn: -.5, face: F('happy', { lx: -.8, ly: -.35, happy: .3 }), d: .4 },
    { t: tEasy - .15, turn: -.2, face: F('joy', { lx: -.1 }), armL: { ...ARM.chest, front: true }, sq: 1.04, d: .25 },
    { t: tIm - .1, face: F('happy', { lx: 0, ly: -.1, happy: .6, mw: .13, bLy: .9, bRy: .9 }), armL: ARM.rest, armR: RAISE, d: .25 },
    { t: tEvery + .1, armR: ARM.rest, sq: 1, face: F('happy', { lx: -.2, happy: .55 }), d: .35 },
    { t: bTitle + 1.4, turn: -.45, face: yRest, d: .5 });
  if (I0) YK.push({ t: I0.t0, face: F('happy', { lx: -.75, happy: .4, bLy: .5, bRy: .5 }), d: .3 });
  if (I1) YK.push({ t: bAnaUp + .1, turn: -.5, face: F('happy', { lx: -.8, ly: -.05, happy: .5 }), d: .35 }, { t: tSpain, face: F('happy', { lx: -.5, ly: -.6, happy: .5 }), d: .25 }, { t: tLiveA, face: F('happy', { lx: -.8, happy: .5 }), d: .25 });
  if (I2) YK.push({ t: I2.t0, armL: { ...CLAP, front: true }, armR: { ...CLAP, front: true }, d: .16 }, { t: I2.t0 + .6, armL: ARM.rest, armR: ARM.rest, d: .25 });
  // "Youssef? Your turn." — up, proud: chest out, hand on the chest, beaming at "I am live in Queens."
  if (I3) YK.push({ t: I3.t0 + .1, face: F('surprised', { lx: -.8, pupil: .85, mo: .03, mw: .06 }), d: .15 });
  YK.push({ t: bYouUp, seat: 0, turn: -.2, face: F('joy', { lx: -.3 }), sq: 1.03, d: .32 });
  if (I4) YK.push({ t: tHello - .25, armL: { ...DIP, front: true }, d: .14 }, { t: tHello - .08, armL: { ...ARM.wave, front: true }, d: .18 },
    { t: tYou - .2, armL: ARM.rest, armR: { ...ARM.chest, front: true }, face: F('happy', { lx: -.2, happy: .6, mw: .12, bLy: .8, bRy: .8 }), sq: 1.05, lean: -.02, d: .25 },
    { t: tEgypt - .3, face: F('joy', { lx: -.2 }), d: .2 },
    { t: tIam - .25, armR: ARM.rest, armL: { ...RAISE, front: true }, sq: 1.06, lean: -.035, face: F('happy', { lx: -.3, ly: -.1, happy: .7, mw: .13, mo: .05, bLy: 1, bRy: 1 }), d: .25 });
  // the freeze pose (held in the cached frame) is the state at bFreeze + .12; after the release: embarrassed
  YK.push({ t: bUn, face: F('embarrassed', { lx: -.75, ly: .1 }), armL: ARM.scratch, sq: 1, lean: -.02, d: .2 });
  if (F0) YK.push({ t: F0.t0 + .2, turn: -.4, face: F('embarrassed', { lx: -.85, ly: -.25, mo: .01 }), d: .3 });
  if (F1) YK.push({ t: F1.t0 - .15, armL: { ...RAISE, front: true }, face: F('surprised', { lx: -.7, pupil: .7, mo: .07, mw: .06, blush: 1, lines: 1, sweat: .8 }), d: .14 },
    { t: tSorry - .08, armL: ARM.rest, lean: -.1, sq: .94, face: F('happy', { happy: .1, eye: .3, lid: .3, blush: 1, sweat: .7, lines: .7, lx: -.3, ly: .4, mw: .1 }), d: .14 },
    { t: tSorry + .3, lean: -.03, sq: 1, d: .3 },
    { t: tLive2 - .35, armR: { ...ARM.chest, front: true }, lean: 0, face: F('happy', { lx: -.7, happy: .35, blush: .8, lines: .3, bLy: .8, bRy: .8, mw: .1 }), d: .25 },
    { t: F1.t1 + .3, armR: ARM.rest, face: F('happy', { lx: -.75, happy: .5, blush: .6 }), d: .3 });
  if (F2) YK.push({ t: tWhereIn + .1, face: F('happy', { lx: -.8, happy: .5, bLy: .9, bRy: .9 }), d: .25 });
  if (F3) YK.push({ t: F3.t0 - .2, armL: { ...RAISE, front: true }, sq: 1.06, lean: -.03, face: F('joy', { lx: -.6 }), d: .2 });
  // ar04: the ambassador — proud, chest out, looks at us; then sits down
  if (n4) YK.push({ t: n4.t0 + .1, armL: ARM.rest, sq: 1.02, lean: -.015, turn: -.3, face: F('happy', { lx: -.6, happy: .5, blush: .5 }), d: .35 },
    { t: tCairoN - .2, turn: -.05, armR: { ...ARM.chest, front: true }, sq: 1.07, lean: -.04, face: F('joy', { lx: 0, ly: -.1, bLy: .9, bRy: .9 }), d: .3 },
    { t: tAmb + .1, face: F('happy', { lx: 0, ly: 0, happy: .7, mw: .13, bLy: 1, bRy: 1 }), d: .3 },
    { t: n4.t1 + .2, seat: 1, turn: -.45, armR: ARM.rest, sq: 1, lean: 0, face: yRest, d: .35 });
  // en4: to Ana (on his left)
  if (F4) YK.push({ t: F4.t0 - .3, turn: -.5, armL: { ...OPEN, front: true }, face: F('happy', { lx: -.85, happy: .45, bLy: .9, bRy: .9 }), d: .3 }, { t: F4.t1 + .3, armL: ARM.rest, d: .3 });
  if (F5) YK.push({ t: tYoure + .1, face: F('joy', { lx: -.8 }), d: .2 });
  if (F6) YK.push({ t: F6.t0 - .2, armR: { ...ARM.chest, front: true }, sq: 1.04, face: F('happy', { lx: -.8, happy: .65, mw: .13 }), d: .25 }, { t: F6.t1 + .4, armR: ARM.rest, sq: 1, d: .3 });
  if (F7) YK.push({ t: F7.t0 - .1, face: F('happy', { lx: -.85, ly: -.05, happy: .5 }), d: .35 }, { t: F7.t1 + .1, face: F('joy', { lx: -.8 }), d: .2 });
  // hook: "what do you do?" — the smile drops; stuck: wide eyes, mouth open, sweat, a tremble; then a scratch and a puzzled look at us
  if (K0) YK.push({ t: tSo - .1, face: F('happy', { lx: -.85, happy: .35, bLy: .6, bRy: .6 }), d: .3 },
    { t: tWhat + .1, face: F('surprised', { lx: -.8, pupil: .6, mo: .08, mw: .06, sweat: .7, bLy: 1, bRy: 1 }), sq: 1.03, d: .15 });
  YK.push({ t: bStuck, face: F('nervous', { lx: -.4, ly: 0, pupil: .6, mo: .07, mw: .1, mt: 1, sweat: 1, bLr: .7, bRr: .7 }), trem: .006, d: .2 },
    { t: tEng - .2, armR: ARM.scratch, trem: 0, turn: -.2, face: F('puzzled', { lx: -.2, ly: -.3, sweat: .8 }), d: .3 },
    { t: tHow - .2, turn: 0, face: F('puzzled', { lx: 0, ly: 0, sweat: .8, bLy: 1 }), d: .3 });
  yC.jumps.push({ t: tSit - .05, h: .03, d: .3 }, { t: bYouUp - .05, h: .06, d: .34 }, { t: bStuck - .05, h: .04, d: .3 });
  if (F3) yC.jumps.push({ t: F3.t0 - .15, h: .06, d: .36 });
  if (I4) yC.jumps.push({ t: tIam - .2, h: .03, d: .3 });
  yC.blinks.push(tArrive - .05, tMate - .1, tBoardW - .1, tEasy - .15, bYouUp, bUn + .05, tSorry - .08, n4 ? n4.t0 + .1 : 0, bStuck, tEng - .2);
  S.mC = mC; S.aC = aC; S.yC = yC;
  S.formOnDesk = tSit + .15;

  // ================= board writing + map pins (live parts of the set) =================
  S.board = t => {
    const out = [{ text: 'Where are you from?', x: 865, y: 300, size: 56, col: P.navy, p: Math.max(seg(t, .05, .06) * (t < bEnter + .7 ? seg(t, 0, .9) : 1), seg(t, tBoardW - .1, tBoardW + 1.2)) }];
    // the opening: the question is already half written as the scene starts, completed while she points; after ar02 it is whole
    out[0].p = eio(seg(t, .4, 2.6));   // Sara points at the board while the question writes itself; on "السبورة" the camera pushes to it
    if (F0 && t > F0.t0 - .35) {
      const w0 = F0.t0 - .35;
      out.push({ text: 'I am live in Queens.', x: 865, y: 440, size: 56, col: P.navy, p: seg(t, w0, w0 + 1.0), hl: [1, 1, P.red], strike: [1, eo(seg(t, w0 + 1.0, w0 + 1.35))], under: [2, eo(seg(t, w0 + 1.35, w0 + 1.7)), P.teal] });
    }
    return out;
  };
  S.pins = t => ({
    spain: { k: seg(t, tSpain - .05, tSpain + .35), hi: seg(t, tMadrid - .1, tMadrid + .2) * (1 - seg(t, F5 ? F5.t1 : tMadrid + 2, (F5 ? F5.t1 : tMadrid + 2) + .5)), label: 'Spain' },
    egypt: { k: seg(t, tEgypt - .05, tEgypt + .35), hi: Math.max(seg(t, bCairo - .1, bCairo + .2) * (1 - seg(t, n4 ? n4.t1 : bCairo + 3, (n4 ? n4.t1 : bCairo + 3) + .5)), 0), label: t > bCairo - .1 ? 'Cairo · Egypt' : 'Egypt' },
    usa: { k: seg(t, tNY - .3, tNY + .05), hi: seg(t, tNY - .1, tNY + .2) * (1 - seg(t, hk.t0 + .2, hk.t0 + .6)), label: 'New York' },
  });

  // ================= cameras =================
  const camKeys = [
    { t: -1, ...WIDE }, { t: .2, d: Math.max(1, tArrive - .2), x: 1000, y: 552, z: 1.08 },
    { t: tBoardW - .35, d: 1.2, x: 900, y: 462, z: 1.42 },                    // push to the board
    { t: bTitle - .2, d: 0, x: 1280, y: 600, z: 1.78 }, { t: bTitle - .15, d: Math.max(1, it.t0 - bTitle), x: 1290, y: 602, z: 1.86 },   // Youssef, confident, under the title
    { t: it.t0, d: 0, ...SARA }, { t: it.t0 + .1, d: 2, x: 705, y: 560, z: 1.55 },
    { t: bAnaUp - .25, d: 0, ...ANA1 }, { t: bAnaUp, d: Math.max(1, bAnaDown - bAnaUp), x: 1170, y: 524, z: 1.48 },
    { t: I2 ? I2.t0 - .1 : bAnaDown, d: 0, ...WIDE },
    { t: bYouUp - .3, d: 0, ...YOU1 }, { t: bYouUp, d: Math.max(1, bFreeze - bYouUp), x: 1225, y: 536, z: 1.5 },
    // after the freeze: Sara at the board for the fix; Youssef's "Oh! Sorry."; the wide for "Where in Egypt?"; Youssef for "Cairo!"
    { t: bUn, d: 0, ...SARA }, { t: bUn + .05, d: 2.5, x: 712, y: 540, z: 1.58 },
    { t: F1 ? F1.t0 - .2 : bUn + 3, d: 0, ...PAIR },
    { t: F2 ? F2.t0 - .2 : bUn + 6, d: 0, ...WIDE },
    { t: F3 ? F3.t0 - .25 : bCairo - .25, d: 0, ...YOU1 },
    { t: n4 ? n4.t0 : bCairo + 1, d: Math.max(1, (n4 ? n4.t1 : bCairo + 6) - (n4 ? n4.t0 : bCairo + 1)), x: 1400, y: 705, z: 2.2 },
    { t: F4 ? F4.t0 - .45 : fx.t1 - 8, d: 0, ...PAIR }, { t: F4 ? F4.t0 - .4 : fx.t1 - 8, d: 4, x: 1262, y: 752, z: 1.95 },
    { t: F7 ? F7.t0 - .3 : fx.t1 - 3, d: 0, ...WIDE },
    { t: hk.t0, d: 0, ...SARA }, { t: hk.t0 + .1, d: 3, x: 700, y: 566, z: 1.62 },
    { t: bStuck, d: 0, x: 1360, y: 690, z: 2.5 }, { t: bStuck + .05, d: Math.max(1, rc.t0 - bStuck), x: 1400, y: 690, z: 3.0 },
  ];
  S.cam = camKeys;
  S.camFreeze = { x: 1400, y: 650, z: 2.2 };

  // ================= sound cues =================
  cue(0, 'ambience_class', { dur: rc.t0, note: 'classroom bed with a little street through the window' });
  cue(bEnter - .1, 'door_open', { note: 'Youssef comes in' }); cue(tArrive + .9, 'door_close');
  steps(yC, 'youssef', 0, it.t0);
  cue(tSit, 'chair', { note: 'he sits down' }); cue(S.formOnDesk, 'paper', { note: 'the form on the desk' });
  cue(tMate - .1, 'pop', { note: 'Ana waves' });
  cue(.4, 'write', { dur: 2.2, note: 'the question writes itself on the board' }); cue(tBoardW - .3, 'whoosh', { note: 'push to the board' });
  cue(bTitle - .2, 'cut');
  cue(it.t0, 'cut', { note: 'Sara at the board' });
  for (const L of [I0, I1, I2, I3, I4, F0, F1, F2, F3, F4, F5, F6, F7, K0]) if (L) cue(L.t0 - .18, 'bubble', { who: L.who, text: L.text });
  cue(bAnaUp, 'chair', { note: 'Ana stands up' }); cue(bAnaDown, 'chair', { note: 'Ana sits down' });
  cue(tSpain, 'pop', { note: 'pin: Spain' });
  cue(bYouUp, 'chair', { note: 'Youssef stands up' });
  cue(tEgypt, 'pop', { note: 'pin: Egypt' });
  cue(bFreeze, 'freeze', { note: 'freeze on "I am live in Queens."' });
  cue(bUn, 'unfreeze');
  if (F0) cue(F0.t0 - .35, 'write', { dur: 1.0, note: 'Sara\'s fix on the board' });
  if (F0) cue(F0.t0 + .7, 'squiggle', { dur: .35, note: '"am" struck out' });
  if (F1) cue(tSorry - .05, 'whoosh', { note: 'the bow' });
  cue(bCairo, 'ding', { note: 'Cairo! (the Egypt pin pulses)' });
  if (n4) { cue(tAmb, 'sparkle'); cue(tAmb + .3, 'sparkle'); cue(n4.t1 + .2, 'chair'); }
  if (F5) cue(tYesA - .1, 'pop', { note: 'Ana hops' });
  cue(tNY - .1, 'pop', { note: 'pin: New York' });
  cue(hk.t0, 'cut');
  cue(bStuck, 'sting_shock', { note: 'stuck: what do you do?' });
  cue(bStuck, 'cut_in', { note: 'close-up on Youssef' });
  return S;
}
function steps(C, who, a, b) {
  for (const m of C.moves) {
    if (m.glide || m.x0 === m.x1) continue;
    const D = m.t1 - m.t0, n = Math.max(1, Math.round(D / (m.step || .42)));
    for (let i = 0; i < n; i++) { const tt = m.t0 + D * (i + .68) / n; if (tt >= a && tt < b) cue(tt, 'step', { who }); }
  }
}

// ======================================================================================================================
// the classroom: one continuous set; t = the clock, tc = the characters' time (frozen during the freeze)
function drawRoom(c, cam, t, tc, o = {}) {
  drawClass(c, cam, t, { dof: o.dof ?? dofOf(cam.z) * .7, door: doorAt(t), board: S.board(t), pins: S.pins(t) });
  const R = {};
  R.m = drawActor(c, cam, S.mC, tc);
  R.a = drawActor(c, cam, S.aC, tc);
  desk(c, cam, X.ana, { book: true, pencil: true });
  R.y = drawActor(c, cam, S.yC, tc, { front: (h, k) => { if (tc < S.formOnDesk && !h[1][2]) formHeld(c, 'youssef', h[1], k); } });
  desk(c, cam, X.youssef, { form: tc >= S.formOnDesk, pencil: true });
  return R;
}
const doorAt = t => t < S.bEnter - .2 ? 0 : t < S.tArrive + .7 ? eo(seg(t, S.bEnter - .2, S.bEnter + .4)) : 1 - ss(seg(t, S.tArrive + .7, S.tArrive + 1.1));
function desk(c, cam, x, o) { c.save(); layerT(c, cam, 1); deskFront(c, x, o); c.restore(); c.setTransform(1, 0, 0, 1, 0, 0); }

export function sceneClass(c, t) {
  if (t >= S.bFreeze && t < S.bUn) return freezeFrame(c, t);
  const cam = camAt(S.cam, t);
  const R = drawRoom(c, cam, t, t);
  const yh = head(R.y, 'youssef'), mh = head(R.m, 'mia', 1.12), ah = head(R.a, 'ana', 1.12);
  const stuck = t >= S.bStuck;
  // bubbles: one at a time; tails to the speakers' heads (Sara's box sits to her right, the students' to their left)
  const lines = [S.I0, S.I1, S.I2, S.I3, S.I4, S.F0, S.F1, S.F2, S.F3, S.F4, S.F5, S.F6, S.F7, S.K0].filter(Boolean);
  lines.forEach((L, i) => {
    const nx = lines[i + 1] ? lines[i + 1].t0 : null;
    if (L === S.K0 && stuck) return hookBubble(c, t);
    const hp = L.who === 'mia' ? mh : L.who === 'ana' ? ah : yh;
    if (!hp || hp[0] < -200 || hp[0] > 2120) return;
    const pos = L.who === 'mia' ? { x: hp[0] + 10, y: hp[1], side: 1, lift: 60, maxW: 1150 } : { x: hp[0] + 20, y: hp[1], side: -1, lift: 60, maxW: 1100 };
    if (L === S.I4) { lineBubble(c, L, t, { ...pos, wordFx: (k, tt) => (k === amIdx(L) && tt > L.tok[k].t0 ? { mark: 0, shake: tt > S.bFreeze - .3 ? tt * .5 : 0 } : {}) }, { until: S.bFreeze + .05 }); return; }
    lineBubble(c, L, t, pos, { next: nx, hold: 1.2, until: L === S.K0 ? S.bStuck - .02 : null });
  });
  // the shared ambassador moment: a few sparkles around his head on "سفير"
  if (yh && S.n4) {
    const s0 = S.tAmb - .1;
    for (let i = 0; i < 6; i++) { const u = seg(t, s0 + i * .1, s0 + 1.2 + i * .1); if (u <= 0 || u >= 1) continue; const a = i * 1.05 + .4 + t, r = (90 + 20 * Math.sin(i * 2)) * R.y.Z * .5;
      sparkle(c, yh[0] + Math.cos(a) * r * 1.3, yh[1] + 60 * R.y.Z * .5 + Math.sin(a) * r * .8, (14 + 5 * (i % 3)) * Math.sin(Math.PI * u), [P.mustard, P.red, P.cream][i % 3], a); }
  }
  if (stuck && yh) {
    const k = seg(t, S.bStuck + .05, S.bStuck + .4) * (1 - seg(t, S.rc.t0 - .5, S.rc.t0 - .1));
    if (k > 0) bigMark(c, yh[0] + 150 * R.y.Z * .45, yh[1] - 40 * R.y.Z * .45, '?', 150 * R.y.Z * .45, k, .12 + Math.sin(t * 5) * .08, P.mustard);
    const v = seg(t, S.bStuck, S.bStuck + .3); vignette(c, .3 * v);
  }
  return { cam };
}
const amIdx = L => Math.max(0, L.tok.findIndex(o => o.w === 'am'));
// "So, Youssef… what do you do?" stays up at the left edge while he is stuck (Sara is off screen left)
function hookBubble(c, t) {
  const L = S.K0, until = S.rc.t0 - .45;
  if (t > until + .2) return;
  bubble(c, { x: 18, y: 470, who: 'mia', words: wordStates(L.tok, t), side: 1, lift: 90, maxW: 1000, pop: 1, out: seg(t, until, until + .2) });
}
function vignette(c, a) {
  if (a <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const v = c.createRadialGradient(960, 540, 460, 960, 540, 1200); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${a})`);
  c.fillStyle = v; c.fillRect(0, 0, 1920, 1080); c.restore();
}
// the freeze-frame: a close-up held at the pop (rendered once, cached), desaturated, with a slow push; ? and ! pop on his panic
let FZ = null;
function freezeFrame(c, t) {
  if (!FZ) {
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
    const f = cv.getContext('2d', { willReadFrequently: true });
    const cam = S.camFreeze, tf = S.bFreeze;
    const R = drawRoom(f, cam, tf, tf + .12, { dof: 6 });
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.globalCompositeOperation = 'saturation'; f.fillStyle = 'rgba(128,128,128,.42)'; f.fillRect(0, 0, 1920, 1080); f.globalCompositeOperation = 'source-over';
    FZ = { cv, yh: head(R.y, 'youssef') };
  }
  const u = eio(seg(t, S.bFreeze, S.bUn)), z = 1 + .06 * u, ax = FZ.yh[0], ay = FZ.yh[1] + 220;
  c.save(); c.setTransform(z, 0, 0, z, ax * (1 - z), ay * (1 - z)); c.drawImage(FZ.cv, 0, 0); c.restore();
  // his line, frozen, with the red squiggle under "am"
  const L = S.I4, pos = { x: FZ.yh[0] + 20, y: FZ.yh[1], side: -1, lift: 50, maxW: 1100 };
  const box = lineBubble(c, L, S.bFreeze + .02, pos, { until: S.bUn - .2 });
  if (box) squiggleWord(c, L, pos, amIdx(L), seg(t, S.bFreeze + .25, S.bFreeze + .6));
  freezeFx(c, t, FZ.yh);
  return {};
}
// the red squiggle under one word of a bubble (re-derives the bubble's own layout: 600 64px Fredoka, the same wrap)
function squiggleWord(c, L, pos, idx, k) {
  if (k <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.font = '600 64px "Fredoka"';
  const words = L.tok.map(o => o.w), sp = c.measureText(' ').width, ws = words.map(w => c.measureText(w).width), maxW = pos.maxW || 1240;
  const rows = [[]]; let rw = 0;
  words.forEach((w, i) => { const add = (rows[rows.length - 1].length ? sp : 0) + ws[i]; if (rw + add > maxW - 92 && rows[rows.length - 1].length) { rows.push([]); rw = 0; } rows[rows.length - 1].push(i); rw += rows[rows.length - 1].length > 1 ? sp + ws[i] : ws[i]; });
  const rowW = rows.map(r => r.reduce((a, i, q) => a + ws[i] + (q ? sp : 0), 0)), tw = Math.max(...rowW), LH = 64 * 1.12, bw = tw + 92, bh = 64 + LH * (rows.length - 1) + 66;
  const bx = clamp(pos.side < 0 ? pos.x - bw + 70 : pos.side > 0 ? pos.x - 70 : pos.x - bw / 2, 40, 1880 - bw), by = pos.y - pos.lift - bh;
  rows.forEach((r, ri) => {
    let wx = bx + 46 + (tw - rowW[ri]) / 2; const base = by + 30 + 64 * .86 + 6 + ri * LH;
    for (const i of r) { if (i === idx) { const n = 12, a = 6; c.strokeStyle = P.red; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); for (let j = 0; j <= n * k; j++) { const x = wx - 4 + (ws[i] + 8) * j / n, y = base + 14 + (j % 2 ? a : -a) * .8; j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } wx += ws[i] + sp; }
  });
  c.restore();
}
function freezeFx(c, t, yh) {
  const a = seg(t, S.bFreeze, S.bFreeze + .08);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const v = c.createRadialGradient(960, 540, 420, 960, 540, 1150); v.addColorStop(0, 'rgba(42,39,66,0)'); v.addColorStop(1, `rgba(42,39,66,${.38 * a})`);
  c.fillStyle = v; c.fillRect(0, 0, 1920, 1080);
  const fl = 1 - seg(t, S.bFreeze, S.bFreeze + .16); if (fl > 0) { c.fillStyle = `rgba(255,251,240,${.55 * fl})`; c.fillRect(0, 0, 1920, 1080); }
  c.strokeStyle = rgba(P.cream, .9 * a); c.lineWidth = 14; c.strokeRect(22, 22, 1876, 1036);
  const n = S.n3, marks = n ? n.tok.filter(o => /[؟?!]/.test(o.w)).map(o => ({ t: o.t0 + .1, ch: /[؟?]/.test(o.w) ? '?' : '!' })) : [];
  if (n && marks.length < 3) marks.push({ t: n.t0 + (n.t1 - n.t0) * .55, ch: '!' }, { t: n.t0 + (n.t1 - n.t0) * .8, ch: '?' });
  const spots = [[340, 120, .25], [-380, 40, -.25], [420, 300, .2], [-300, 300, -.1], [120, 380, 0]];
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
export { charState, drawActor, head, H, S as STORY };
