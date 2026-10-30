// Episode 2 — "اللي اتعلمته النهارده": the recap. Living Letters kinetic type, restyled into Bean People:
// cream paper, ink Fredoka words that are typeset as they are spoken (rise, land with a squash), a speaker rail + name tab
// under each line, a mustard highlighter on the spoken word, a red spell-check squiggle under mistakes, and two small
// presenter beans (Youssef right, Sara left). Every beat is keyed to recap items, lines and narration words in timeline.json.
import { P, rgba, mix, dark, light, rr, ell, grain } from './kit.js';
import { clamp, lerp, seg, ss, eo, eio, back } from '/core/lib.js';
import { TL, SEC, NARR, LINE, RECAP, nwT, has } from './tl.js';
import { charState, drawActor } from './story.js';
import { fold, F, ARM, CUP, CLAP, DIP, OPEN, POINT, FACEPALM } from './act.js';
import { SPEAKER, RUST, nameTab, squiggle, check, cross, repeatCue, sparkle, sunIcon, afternoonIcon, moonIcon, waveHand } from './ui.js';
import { cue } from './cues.js';

const PAPER = '#FBF1E1', RULE = rgba(P.ink, .045), GROUND_Y = 900;
// the text column between the presenters (Sara x ≈ 395 ± 190 with her arms, Youssef x ≈ 1580 ± 200): rows, tabs, glosses and marks stay inside
const COL = { x0: 560, x1: 1400 }, COLW = 740;   // rows above the presenters' heads (y < 430) may use 900 px
const FONT = s => `600 ${s}px "Fredoka"`;
const AR = '"Baloo Bhaijaan 2"';
const CAM = { x: 960, y: 540, z: 1 };
let R = null;
let MC = null;
const mw = (w, s) => { if (!MC) MC = document.createElement('canvas').getContext('2d'); MC.font = FONT(s); return MC.measureText(w).width; };

export function buildRecap() {
  const rc = SEC('recap');
  const it = id => RECAP(id) || { t0: rc.t0, t1: rc.t0 };
  const L = id => LINE(id);
  R = { rc, items: ['times', 'night', 'how', 'andyou', 'welcome', 'polite'].map(id => ({ id, ...it(id) })) };
  R.title0 = rc.t0 + .55; R.title1 = it('times').t0 - .35;
  // keys into the narration (Latin tokens and Arabic words) that time the cards
  R.tMorning = nwT('ar09', has('الصبح'), .05); R.tAfter = nwT('ar09', has('الضهر'), .15); R.tNightW = nwT('ar09', has('وبالليل'), .25);
  R.tGNwrong = nwT('ar09', w => /^Good night/i.test(w), .4); R.tNotGreet = nwT('ar09', has('تحية'), .55); R.tFarewell = nwT('ar09', has('للوداع'), .7); R.tSleep = nwT('ar09', has('تنام'), .97);
  R.tHow = nwT('ar10', w => /^How are/i.test(w), .3); R.tReal = nwT('ar10', has('حقيقي'), .95);
  R.tAndYou = nwT('ar11', w => /^And you/i.test(w), .6);
  R.tThank = nwT('ar12', w => /^Thank/i.test(w), .25); R.tWelcomeW = nwT('ar12', w => /^Welcome/i.test(w), .55); R.tRight = nwT('ar12', has('الصح'), .9);
  R.tPlease = nwT('ar13', w => /^Please/i.test(w), .3); R.tSorryW = nwT('ar13', has('سوري'), .7);
  // repeat gaps: after a model line, until the next speech (narration or line) or the end of the recap
  const recapLines = TL.lines.filter(l => l.scene === 'recap');
  const speech = [...TL.narration.map(n => n.t0), ...TL.lines.map(l => l.t0)].sort((a, b) => a - b);
  R.gaps = [];
  // (only where the voice hands over to the learner: the next speech is narration, or the recap ends — not a Q → A pair)
  for (const l of recapLines) {
    const nx = Math.min(speech.find(s => s > l.t1 + .05) ?? rc.t1, rc.t1);
    const nextIsLine = TL.lines.some(m => Math.abs(m.t0 - nx) < .01);
    if (nx - l.t1 >= .8 && !nextIsLine) R.gaps.push({ t0: l.t1 + .18, t1: nx - .12, line: l });
  }
  // presenter Youssef mouths his narration clips (the diary voice's viseme track) and his own model lines; Sara hers
  const narrSpans = TL.narration.filter(n => n.t0 >= rc.t0 - .1 && n.t1 <= rc.t1 + .1).map(n => [n.t0, n.t1]);   // → TL.mouth_nar in these ranges
  // ---- presenters: two big beans that act (Youssef right facing left: his near arm is armR; Sara left facing right: armL) ----
  const hiT = it('times').t0;
  const YK = 1.4, MK_ = 1.32, YX = 1580, MX = 395;   // 110 px in from the frame edges, clear of the text column (rows fit to 820 px) and the plate
  // Youssef's outer arm (armR: screen-right, he faces left) must never leave the frame: a pose whose hand would pass x = 1880 is
  // pulled in (hand x ≈ YX + shoulder .34 H + dx H + the wave swing + the hand radius, H = 300 · YK)
  const OUTR = A => { const lim = (1880 - 27 - .34 * 300 * YK - YX) / (300 * YK) - (A.w ? .08 : 0); return A.dx > lim ? { ...A, dx: lim } : A; };
  R.YX = YX; R.MX = MX;
  const yRest = F('happy', { lx: -.5, happy: .35 }), mRest = F('happy', { lx: .5, happy: .35 });
  const yR = { id: 'youssef', talkExtra: narrSpans, base: { turn: -.3, face: yRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: rc.t0 + .2, t1: rc.t0 + 1.2, x0: 2250, x1: YX, y0: GROUND_Y, y1: GROUND_Y, k0: YK, k1: YK, step: .45 }], keys: [], jumps: [], blinks: [] };
  const mR = { id: 'mia', base: { turn: .3, face: mRest, armL: ARM.rest, armR: ARM.rest, alpha: 1, kmul: 1, sq: 1, lean: 0 },
    moves: [{ t0: hiT - 1.0, t1: hiT - .1, x0: -320, x1: MX, y0: GROUND_Y, y1: GROUND_Y, k0: MK_, k1: MK_, step: .45 }], keys: [], jumps: [], blinks: [] };
  const K = yR.keys, MK = mR.keys;
  const nod = (keys, x) => keys.push({ t: x, sq: .95, d: .1 }, { t: x + .13, sq: 1, d: .12 }, { t: x + .28, sq: .955, d: .1 }, { t: x + .41, sq: 1, d: .14 });
  // hello wave on arrival
  K.push({ t: rc.t0 + 1.25, armR: DIP, d: .15 }, { t: rc.t0 + 1.4, armR: ARM.wave, d: .2 }, { t: rc.t0 + 2.6, armR: ARM.rest, d: .3 });
  // every model line: the speaker turns to us with an open hand and talks (lip sync from talk); the other looks over and nods
  for (const l of recapLines) {
    const ys = l.who === 'youssef', [SK, LK] = ys ? [K, MK] : [MK, K];
    SK.push({ t: l.t0 - .3, turn: ys ? -.1 : .1, face: F('happy', { lx: 0, ly: 0, happy: .45, bLy: .6, bRy: .6 }), [ys ? 'armL' : 'armR']: OPEN, d: .25 },
      { t: l.t1 + .35, turn: ys ? -.3 : .3, face: ys ? yRest : mRest, [ys ? 'armL' : 'armR']: ARM.rest, d: .3 });
    LK.push({ t: l.t0 - .15, face: F('happy', { lx: ys ? .75 : -.75, ly: -.05, happy: .55 }), d: .25 }, { t: l.t1 + .5, face: ys ? mRest : yRest, d: .3 });
    nod(LK, l.t1 - .05);
  }
  // waves on the greetings / the good night; the time-of-day lines get a small point at the icon
  const r01 = L('r01'), r04 = L('r04'), r09 = L('r09'), r10 = L('r10'), r12 = L('r12');
  if (r01) MK.push({ t: r01.t0 - .3, armL: ARM.wave, d: .2 }, { t: r01.t1 + .6, armL: ARM.rest, d: .3 });
  if (r04) K.push({ t: r04.t0 - .3, armR: ARM.wave, face: F('joy'), d: .2 }, { t: r04.t1 + 1.2, armR: ARM.rest, face: yRest, d: .3 });
  // the mistakes: facepalm on the squiggle, sheepish scratch while it is explained, proud nod (hand on chest) on the fix
  const mistake = (tSq, tFix, clap = true) => {
    K.push({ t: tSq - .05, armR: FACEPALM, face: F('embarrassed', { eye: .12, lx: 0, ly: .3 }), lean: -.025, d: .2 },
      { t: tSq + 1.3, armR: ARM.scratch, face: F('embarrassed', { lx: -.5, ly: .2 }), lean: -.015, d: .3 },
      { t: tFix - .1, armR: ARM.chest, face: F('joy', { bLy: .9, bRy: .9 }), lean: 0, turn: -.15, d: .25 },
      { t: tFix + 1.5, armR: ARM.rest, face: yRest, turn: -.3, d: .35 });
    nod(K, tFix + .15);
    MK.push({ t: tSq + .1, armL: CUP, face: F('happy', { lx: .7, happy: .8, mw: .09, mo: 0 }), d: .25 },
      { t: tSq + 1.4, armL: ARM.rest, face: F('happy', { lx: .6, bLy: .7, bRy: .7, happy: .3 }), d: .3 });
    if (clap) MK.push({ t: tFix, armL: CLAP, armR: CLAP, face: F('joy'), d: .18 }, { t: tFix + .9, armL: ARM.rest, armR: ARM.rest, face: mRest, d: .3 });
    yR.blinks.push(tSq - .05, tSq + 1.3, tFix - .1); mR.blinks.push(tSq + .1, tFix);
  };
  mistake(R.tNotGreet + .1, R.tFarewell + .2);
  mistake(R.tWelcomeW + .3, r10 ? r10.t0 : R.tRight + 1, false);
  // "And you?": Youssef points at us; "Sorry!": a small apologetic bow
  if (r09) K.push({ t: r09.t0 - .3, armL: POINT, face: F('happy', { lx: 0, happy: .5, bLy: .9, bRy: .9 }), d: .25 }, { t: r09.t1 + .8, armL: ARM.rest, d: .3 });
  if (r12) K.push({ t: r12.t0 - .15, lean: -.06, sq: .95, face: F('embarrassed', { lx: 0, ly: .3, happy: .3, lines: .5, sweat: .4 }), d: .18 }, { t: r12.t0 + .35, lean: 0, sq: 1, d: .3 }, { t: r12.t1 + .9, face: yRest, d: .35 });
  // repeat gaps: Youssef turns to us with an open hand ("your turn"), Sara smiles at us
  for (const g of R.gaps) {
    K.push({ t: g.t0, turn: -.08, face: F('happy', { lx: 0, ly: 0, happy: .55 }), armL: OPEN, d: .3 }, { t: g.t1 - .1, turn: -.3, armL: ARM.rest, face: yRest, d: .3 });
    MK.push({ t: g.t0 + .1, face: F('happy', { lx: 0, ly: 0, happy: .6 }), d: .3 }, { t: g.t1 - .1, face: mRest, d: .3 });
  }
  for (const k of K) if (k.armR) k.armR = OUTR(k.armR);
  K.sort((p, q) => p.t - q.t); MK.sort((p, q) => p.t - q.t);
  R.yR = yR; R.mR = mR;
  // ---- cues ----
  cue(R.title0, 'pop', { note: 'recap title' });
  cue(rc.t0 + .3, 'step', { who: 'youssef' }); cue(hiT - .6, 'step', { who: 'mia' });
  for (const l of recapLines) cue(l.t0 - .05, 'type', { note: 'line typesets: ' + l.text });
  for (const x of [R.tMorning, R.tAfter, R.tNightW]) cue(x, 'pop', { note: 'time-of-day icon' });
  cue(R.tGNwrong, 'type'); cue(R.tNotGreet + .1, 'squiggle'); cue(R.tNotGreet + .5, 'error_buzz');
  cue(R.tFarewell + .2, 'pop', { note: 'moon + wave' }); if (r04) cue(r04.t1 + .1, 'ding');
  cue(R.tReal, 'pop', { note: 'the three real answers' });
  cue(R.tThank, 'type'); cue(R.tWelcomeW, 'type'); cue(R.tWelcomeW + .3, 'squiggle'); cue(R.tWelcomeW + .7, 'error_buzz');
  cue(R.tRight, 'caret'); if (r10) cue(r10.t1 + .1, 'ding');
  cue(R.tPlease, 'type'); cue(R.tSorryW, 'type');
  for (const g of R.gaps) cue(g.t0, 'repeat', { dur: g.t1 - g.t0, note: 'learner repeats' });
  return R;
}

// ---- type rows ----
// items: [{w, t (typeset time), s0, s1 (spoken span), alpha?, dx?, sx?, mark?, col?, wob?}], laid out centred on x (baseline y)
function layoutRow(items, size) {
  const sp = mw(' ', size) * 1.05;
  let x = 0; const out = items.map(o => { const w = (o.width ?? mw(o.w, size)) * (o.sx ?? 1); const r = { ...o, x, ww: w }; x += w + sp * (o.gap ?? 1); return r; });
  const W = x - sp; out.forEach(o => o.x -= W / 2); return { out, W };
}
// opts: ghost (time the card appears, upcoming words at 25 % ink), mean (Arabic meaning under the line), meanHi (0..1 accent)
function drawRow(c, t, items, { x, y, size, who, alpha = 1, rail = true, ghost = null, mean = null, meanHi = 0, meanSize = 50, meanCol = null, maxW = null }) {
  if (alpha <= 0) return null;
  if (maxW == null) maxW = y < 430 ? 900 : COLW;
  { const W0 = layoutRow(items, size).W; if (W0 > maxW) size *= maxW / W0; }   // every row fits the text column (clear of both presenters)
  const spw = mw(' ', size) * 1.05;
  const { out, W } = layoutRow(items, size);
  const S = SPEAKER[who], col = who === 'mia' ? RUST : P.navy;
  const g = ghost != null ? seg(t, ghost, ghost + .3) : 0;
  c.save(); c.globalAlpha = alpha; c.font = FONT(size); c.textBaseline = 'alphabetic'; c.textAlign = 'left';
  const shown = out.filter(o => t >= o.t && (o.alpha ?? 1) > .05);
  const ry = y + size * .26;
  if (rail && (shown.length || g > 0)) {
    const vis = shown.length ? shown : out, lx = x + Math.min(...out.map(o => o.x)) - 12, rx0 = x + Math.max(...out.map(o => o.x + o.ww)) + 12;
    const k = shown.length ? eo(seg(t, shown[0].t, shown[0].t + .35)) : 0;
    if (g > 0) { rr(c, lx, ry, rx0 - lx, 9, 4.5); c.fillStyle = rgba(col, .18 * g); c.fill(); }
    if (k > 0) { const rx = x + Math.max(...vis.map(o => o.x + o.ww)) + 12; rr(c, lx, ry, (rx - lx) * k, 9, 4.5); c.fillStyle = rgba(col, .85); c.fill(); }
    const ta = Math.max(k, .45 * g);
    if (ta > 0) { c.globalAlpha = alpha * ta; tabAt(c, S, lx, ry); c.globalAlpha = alpha; }
  }
  // Arabic meaning, muted, under the line (shifted right past a tucked name tab so the two never overlap)
  const tabEnd = rail ? tabAt(c, S, x + Math.min(...out.map(o => o.x)) - 12, ry, false) : null;
  if (mean) {
    const ma = Math.max(g, shown.length ? 1 : 0);
    if (ma > 0) {
      c.save(); c.globalAlpha = alpha * ma; c.direction = 'rtl'; c.font = `700 ${meanSize}px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      const mwid = c.measureText(mean).width; let my = ry + 12 + meanSize, mx = x;
      if (tabEnd != null && x - mwid / 2 - 22 < tabEnd) { mx = Math.min(tabEnd + mwid / 2 + 22, COL.x1 - mwid / 2); if (mx - mwid / 2 < tabEnd + 8) { mx = x; my += 40; } }
      if (meanHi > 0) { rr(c, mx - mwid / 2 - 22, my - meanSize * .62, mwid + 44, meanSize * 1.24, meanSize * .62); c.fillStyle = rgba(P.mustard, .35 * meanHi); c.fill(); }
      c.fillStyle = meanCol || rgba(P.ink, .58 + .3 * meanHi); c.fillText(mean, mx, my); c.restore();
    }
  }
  for (const o of out) {
    const live = t >= o.t;
    if (!live && !(g > 0 && !o.typed && (o.alpha ?? 1) > .05)) continue;
    if (!live) {   // upcoming: ghost word in place
      c.save(); c.globalAlpha = alpha * .22 * g * (o.alpha ?? 1); c.fillStyle = P.ink; c.textAlign = 'center';
      c.translate(x + o.x + o.ww / 2 + (o.dx || 0), y); c.scale(o.sx ?? 1, 1);
      if (o.wob) c.fillText(o.w, 0, 0); else c.fillText(o.w, 0, 0);
      c.restore(); continue;
    }
    const p = o.typed ? 1 : seg(t, o.t, o.t + .3), q = o.typed ? 1 : t - o.t - .3;
    const sq = q > 0 ? 1 - .16 * Math.exp(-q * 9) * Math.cos(q * 26) : lerp(1.15, 1, p);
    const pop = ghost != null && !o.typed ? (1 + Math.min(.14, .6 * spw / Math.max(1, o.ww)) * Math.sin(Math.PI * p)) : 1;   // capped so a long word never grows into its neighbour's space   // ghosted words pop in place; others rise from the line
    const wx = x + o.x + o.ww / 2, wy = y + (ghost != null ? 0 : (1 - eo(p)) * 70);
    c.save(); c.globalAlpha = alpha * (ghost != null ? lerp(.22, 1, seg(p, 0, .3)) : seg(p, 0, .35)) * (o.alpha ?? 1); c.translate(wx + (o.dx || 0), wy);
    const cur = o.s0 != null && t >= o.s0 && t < o.s1 + .12;
    if (cur) { const k = eo(seg(t, o.s0, o.s0 + .18)); rr(c, -o.ww / 2 - 10, -size * .64, (o.ww + 20) * k, size * .74, 18); c.fillStyle = rgba(P.mustard, .55); c.fill(); }
    if (o.mark) { rr(c, -o.ww / 2 - 4, size * .1, (o.ww + 8) * o.mark, 10, 5); c.fillStyle = P.mustard; c.fill(); }
    c.scale(pop * (o.sx ?? 1) / Math.sqrt(sq), pop * sq);
    c.fillStyle = o.col || P.ink; c.textAlign = 'center';
    if (o.wob && /[?!؟]$/.test(o.w)) {   // "Sorry?" / "Sorry!": the final mark wobbles (Living Letters) — the word keeps its own mark
      const mk = o.w.slice(-1), body = o.w.slice(0, -1), qw = mw(mk, size), bw = mw(body, size);
      c.fillText(body, -qw / 2, 0);
      const k = t - o.t - .25, ang = k > 0 ? Math.sin(k * 8) * .3 * Math.exp(-k * .9) + .1 : 0;
      c.save(); c.translate(bw / 2, -size * .02); c.rotate(ang); c.fillText(mk, 0, 0); c.restore();
    } else c.fillText(o.w, 0, 0);
    c.restore();
  }
  c.restore();
  return { out, W, x, y, size };
}
// speaker tab at the rail's left end; when that would reach the presenter bean, it tucks under the start of the rail
function tabAt(c, S, lx, ry, draw = true) {
  c.save(); c.font = '400 26px "Lilita One"'; c.letterSpacing = '2px'; const tw = c.measureText(S.name).width + 31; c.restore();
  const left = lx - tw - 14 >= COL.x0;
  if (draw) { if (left) nameTab(c, S, lx - tw - 14, ry - 15, 26); else nameTab(c, S, lx, ry + 16, 26); }
  return left ? null : lx + tw + 22;   // the x the gloss must start after when the tab is tucked under the rail
}
const fromLine = (id, stagger = 0) => { const l = LINE(id); return l ? l.tok.map((o, i) => ({ w: o.w, t: o.t0 - .06 + i * stagger, s0: o.t0, s1: o.t1 })) : []; };
const fit = (items, size, maxW = COLW) => { const { W } = layoutRow(items, size); return W > maxW ? size * maxW / W : size; };
const wordX = (row, i) => row.x + row.out[i].x;

// ---- the paper set ----
function paper(c, t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
  c.strokeStyle = RULE; c.lineWidth = 2;
  for (let y = 132; y < GROUND_Y; y += 76) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
  c.strokeStyle = rgba(P.red, .22); c.lineWidth = 3; c.beginPath(); c.moveTo(1846, 0); c.lineTo(1846, GROUND_Y); c.stroke();   // right margin (RTL notebook)
  c.fillStyle = mix(PAPER, P.mustard, .16); c.fillRect(0, GROUND_Y, 1920, 1080 - GROUND_Y);
  c.fillStyle = rgba(P.ink, .08); c.fillRect(0, GROUND_Y, 1920, 4);
}

export function sceneRecap(c, t) {
  paper(c, t);
  // presenters
  for (const C of [R.mR, R.yR]) if (t > C.moves[0].t0 - .05) drawActor(c, CAM, C, t);
  // title → header pill
  titleCard(c, t);
  // items
  const I = R.items;
  let cueY = 822;
  for (let k = 0; k < I.length; k++) {
    const it = I[k];
    if (t < it.t0 - .05 || t > it.t1 + .35) continue;
    const aIn = seg(t, it.t0 - .05, it.t0 + .2), aOut = 1 - seg(t, it.t1 - .05, it.t1 + .3);
    const a = aIn * aOut, dy = (1 - aOut) * -40;
    if (CUEY[it.id]) cueY = CUEY[it.id];
    c.save(); c.translate(0, dy);
    ITEM[it.id]?.(c, t, a, it);
    c.restore();
  }
  // repeat cue in the gaps after model lines
  for (const g of R.gaps) {
    const a = Math.min(seg(t, g.t0, g.t0 + .3), 1 - seg(t, g.t1 - .2, g.t1));
    if (a > 0) repeatCue(c, 960, cueY, a, t);
  }
}

function titleCard(c, t) {
  const p = seg(t, R.title0, R.title0 + .5), m = eio(seg(t, R.title1, R.title1 + .6));
  if (p <= 0) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  const txt = 'اللي اتعلمته النهارده';
  c.direction = 'rtl'; c.textBaseline = 'middle'; c.textAlign = 'center';
  // big title, centre
  if (m < 1) {
    const s = back(p, 2) * (1 - m * .5), x = lerp(900, 1500, m), y = lerp(440, 90, m);   // the big title sits a little left of centre, clear of Youssef (now 110 px in from the edge)
    c.globalAlpha = 1 - m;
    c.translate(x, y); c.scale(s, s);
    c.font = `800 120px ${AR}`; const w = c.measureText(txt).width;
    const k = eo(seg(t, R.title0 + .25, R.title0 + .8));
    rr(c, -w / 2 - 10, 34, (w + 20) * k, 26, 13); c.fillStyle = rgba(P.mustard, .8); c.fill();
    c.fillStyle = P.ink; c.fillText(txt, 0, 0);
    // pencil doodle
    c.save(); c.translate(-w / 2 - 90, -10); c.rotate(-.7); c.fillStyle = P.mustard; rr(c, -14, -60, 28, 100, 6); c.fill(); c.fillStyle = '#F2C9A0'; c.beginPath(); c.moveTo(-14, 40); c.lineTo(14, 40); c.lineTo(0, 70); c.fill(); c.fillStyle = P.ink; c.beginPath(); c.moveTo(-5, 60); c.lineTo(5, 60); c.lineTo(0, 70); c.fill(); c.fillStyle = P.red; rr(c, -14, -72, 28, 16, 5); c.fill(); c.restore();
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  // header pill (top right) once the items begin
  if (m > 0) {
    c.globalAlpha = m; c.font = `700 36px ${AR}`; const w = c.measureText(txt).width + 56;
    rr(c, 1800 - w, 62, w, 60, 30); c.fillStyle = P.navy; c.fill();
    c.fillStyle = P.cream; c.textAlign = 'right'; c.fillText(txt, 1800 - 28, 94);
  }
  c.restore();
}

// a small Arabic gloss pill (navy on a light navy tint)
function gloss(c, txt, x, y, a) {
  c.save(); c.globalAlpha = a; c.direction = 'rtl'; c.font = `800 64px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText(txt).width + 70, k = back(clamp(a * 1.3), 1.8);
  c.translate(x, y); c.scale(k, k);
  rr(c, -w / 2, -46, w, 92, 46); c.fillStyle = rgba(P.navy, .1); c.fill();
  c.fillStyle = P.navy; c.fillText(txt, 0, 4); c.restore();
}
// ---- items (each card comes in ghosted as soon as its item starts, while the Arabic explains) ----
const CX = 985, CUEY = { times: 160, night: 822, how: 150, andyou: 822, welcome: 150, polite: 822 };
const ghostRow = (words, who) => words.map(w => ({ w, t: 1e9 }));   // a row that stays ghosted
const ITEM = {
  // three greetings with a time-of-day icon each
  times(c, t, a, it) {
    const rows = [['r01', 'mia', 'صباح الخير', R.tMorning, (cc, x, y, k) => sunIcon(cc, x, y, 26 * k, P.mustard, t)],
      ['r02', 'youssef', 'مساء الخير (بعد الضهر)', R.tAfter, (cc, x, y, k) => afternoonIcon(cc, x, y, 24 * k)],
      ['r03', 'mia', 'مساء الخير', R.tNightW, (cc, x, y, k) => moonIcon(cc, x, y, 24 * k)]];
    rows.forEach(([id, who, mean, tIcon, icon], i) => {
      const y = 290 + i * 190, items = fromLine(id), l = LINE(id);
      const hi = seg(t, tIcon - .1, tIcon + .2) * (1 - seg(t, (l ? l.t0 : tIcon + 2) - .3, l ? l.t0 : tIcon + 2));
      const row = drawRow(c, t, items, { x: CX + 20, y, size: 100, who, alpha: a, ghost: it.t0, mean, meanHi: hi, meanSize: 44 });
      const ik = back(seg(t, Math.min(tIcon, it.t0 + .3 + i * .15), Math.min(tIcon, it.t0 + .3 + i * .15) + .4), 2);
      if (row && ik > 0) { c.save(); c.globalAlpha = a; icon(c, row.x - row.W / 2 - 80, y - 36, ik); c.restore(); }
    });
  },
  // "Good night!" is a goodbye (moon + a wave), never a greeting (red squiggle)
  night(c, t, a, it) {
    const l = LINE('r04');
    // the wrong use: a ghosted "Good night" said as a hello, with a small sun, a squiggle, an ✗ and "مش تحية"
    const wrongA = a * seg(t, R.tGNwrong - .05, R.tGNwrong + .25);
    if (wrongA > 0) {
      const row = drawRow(c, t, ghostRow(['Good', 'night']), { x: CX, y: 390, size: 120, who: 'youssef', alpha: wrongA, ghost: R.tGNwrong - .05 });
      if (row) {
        c.save(); c.globalAlpha = wrongA;
        sunIcon(c, row.x - row.W / 2 - 70, 360, 22, rgba(P.mustard, .7), t);
        const x0 = row.x - row.W / 2 - 6, x1 = row.x + row.W / 2 + 6;
        squiggle(c, x0, x1, 408, seg(t, R.tNotGreet + .1, R.tNotGreet + .5), 7, P.red, 7);
        cross(c, x1 + 70, 345, 32, seg(t, R.tNotGreet + .5, R.tNotGreet + .85));
        const pa = seg(t, R.tNotGreet + .6, R.tNotGreet + .9);
        if (pa > 0) { c.globalAlpha = wrongA * pa; c.direction = 'rtl'; c.font = `700 40px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const w = c.measureText('مش تحية').width + 50; rr(c, CX - w / 2, 440, w, 60, 30); c.fillStyle = rgba(P.red, .12); c.fill(); c.fillStyle = P.red; c.fillText('مش تحية', CX, 472); }
        c.restore();
      }
    }
    // the right use: typeset on his line, moon + waving hand, ✓
    const okA = a * seg(t, R.tFarewell - .05, R.tFarewell + .25);
    if (okA > 0) {
      const row = drawRow(c, t, fromLine('r04'), { x: CX + 20, y: 660, size: 130, who: 'youssef', alpha: okA, ghost: R.tFarewell, mean: 'تصبح على خير (وإنت ماشي)', meanSize: 44 });
      if (row) {
        c.save(); c.globalAlpha = okA;
        const ik = back(seg(t, R.tFarewell + .1, R.tFarewell + .5), 2);
        if (ik > 0) { moonIcon(c, row.x - row.W / 2 - 120, 610, 26 * ik); waveHand(c, row.x - row.W / 2 - 62, 616, 20 * ik, '#B9773F', t); }
        if (l) check(c, row.x + row.W / 2 + 60, 612, 34, seg(t, l.t1 + .1, l.t1 + .45));
        c.restore();
      }
    }
  },
  // "How are you?" and three real answers that stack
  how(c, t, a, it) {
    const q = fromLine('r05'), r05 = LINE('r05');
    const hi = seg(t, R.tHow - .1, R.tHow + .2) * (1 - seg(t, (r05 ? r05.t0 : R.tHow + 3) - .3, r05 ? r05.t0 : R.tHow + 3));
    drawRow(c, t, q, { x: CX, y: 280, size: 104, who: 'mia', alpha: a, ghost: it.t0, mean: 'عامل إيه؟', meanHi: hi, meanSize: 44 });
    const ans = [['r06', 'كويس، شكرًا'], ['r07', 'ماشي الحال… تعبان شوية'], ['r08', 'مش بطّال']];
    ans.forEach(([id, mean], i) => {
      const items = fromLine(id), size = fit(items, 76);
      drawRow(c, t, items, { x: CX, y: 455 + i * 148, size, who: 'youssef', alpha: a * seg(t, R.tReal - .1, R.tReal + .2), ghost: R.tReal - .1, mean, meanSize: 38 });
    });
  },
  andyou(c, t, a, it) {
    const l = LINE('r09'), hi = seg(t, R.tAndYou - .1, R.tAndYou + .2) * (1 - seg(t, (l ? l.t0 : R.tAndYou + 2) - .3, l ? l.t0 : R.tAndYou + 2));
    drawRow(c, t, fromLine('r09'), { x: CX, y: 480, size: 160, who: 'youssef', alpha: a, ghost: it.t0, mean: 'وإنت؟', meanHi: hi });
  },
  // "Thank you" → "Welcome." alone is wrong → "You're welcome."
  welcome(c, t, a, it) {
    const r10 = LINE('r10');
    const thA = a * seg(t, R.tThank - .05, R.tThank + .25);
    if (thA > 0) drawRow(c, t, ghostRow(['Thank', 'you.']), { x: CX, y: 285, size: 96, who: 'mia', alpha: thA, ghost: R.tThank - .05, mean: 'شكرًا', meanSize: 40 });
    const wr = [{ w: 'Welcome.', t: R.tWelcomeW - .05 }];
    const row = drawRow(c, t, wr, { x: CX, y: 490, size: 124, who: 'youssef', alpha: a });
    if (row && t > R.tWelcomeW) {
      c.save(); c.globalAlpha = a;
      const x0 = row.x - row.W / 2 - 6, x1 = row.x + row.W / 2 - mw('.', 124) + 6;
      squiggle(c, x0, x1, 506, seg(t, R.tWelcomeW + .3, R.tWelcomeW + .7), 7, P.red, 7);
      cross(c, x1 + 70, 445, 32, seg(t, R.tWelcomeW + .7, R.tWelcomeW + 1.05));
      const pa = seg(t, R.tWelcomeW + .8, R.tWelcomeW + 1.1);
      if (pa > 0) { c.globalAlpha = a * pa; c.direction = 'rtl'; c.font = `700 36px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba(P.red, .9); c.fillText('ناقصة كلمة', CX, 560); }
      c.restore();
    }
    const okA = a * seg(t, R.tRight - .05, R.tRight + .25);
    if (okA > 0) {
      const r10i = fromLine('r10'), r10s = fit(r10i, 124, COLW - 90);
      const row2 = drawRow(c, t, r10i, { x: CX - 30, y: 700, size: r10s, who: 'mia', alpha: okA, ghost: R.tRight, mean: 'عفوًا / العفو', meanSize: 44 });
      if (row2 && r10) check(c, row2.x + row2.W / 2 + 56, 700 - r10s * .55, 32, seg(t, r10.t1 + .1, r10.t1 + .45));
    }
  },
  // the two polite words
  polite(c, t, a, it) {
    const pA = a * seg(t, R.tPlease - .05, R.tPlease + .25), sA = a * seg(t, R.tSorryW - .05, R.tSorryW + .25);
    const r11 = LINE('r11'), r12 = LINE('r12');
    const hi1 = seg(t, R.tPlease - .1, R.tPlease + .2) * (1 - seg(t, (r11 ? r11.t0 : R.tPlease + 4) - .3, r11 ? r11.t0 : R.tPlease + 4));
    const hi2 = seg(t, R.tSorryW - .1, R.tSorryW + .2) * (1 - seg(t, (r12 ? r12.t0 : R.tSorryW + 4) - .3, r12 ? r12.t0 : R.tSorryW + 4));
    if (pA > 0) drawRow(c, t, fromLine('r11').map((o, i) => ({ ...o, mark: i === 1 ? eo(seg(t, R.tPlease, R.tPlease + .4)) * (1 - seg(t, (r11 ? r11.t0 : 1e9) - .2, r11 ? r11.t0 : 1e9)) : 0 })), { x: CX, y: 380, size: 130, who: 'youssef', alpha: pA, ghost: R.tPlease - .05, mean: 'قهوة، لو سمحت', meanHi: hi1 });
    if (sA > 0) drawRow(c, t, fromLine('r12').map(o => ({ ...o, wob: true })), { x: CX, y: 650, size: 140, who: 'youssef', alpha: sA, ghost: R.tSorryW - .05, mean: 'آسف!', meanHi: hi2 });
  },
};
