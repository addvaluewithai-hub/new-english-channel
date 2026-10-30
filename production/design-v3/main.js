// Design v3 — "Youssef in New York" stills. ?f=ny_wide | ny_door | ny_night | arms (model sheet) | arms_frame | cta | endcard
// ?arms=A|B|C|v2 picks the arm system for the frames (default: the recommended one, see NOTES.md)
import { P, rgba, mix, dark, light, grain, rr, ell, CPU } from './kit.js';
import { CAST, EXPR, ARM, ARM3, ARMCFG, pose, drawChar, drawSuitcase, drawCup, drawHand, handPos, setArms, ARMS } from './bean.js';
import { X2P } from './bean.js';
import { bakeWorld, drawWorld, drawForeground, toScreen, GROUND, DOOR, STOOP } from './world.js';
import { bubble, nameTab, plate, SPEAKER, squiggle, check, sparkle } from './ui.js';
import { setNarration } from './tl.js';
import { clamp, lerp, seg, eo, back, hash } from '/core/lib.js';

const cv = document.getElementById('c'), c = cv.getContext('2d', CPU);
const SW = 1920, SH = 1080, AR = '"Baloo Bhaijaan 2"';
const Q = new URLSearchParams(location.search);
const F = Q.get('f') || 'ny_wide', ARMQ = Q.get('arms') || 'A';
window.DUR = 10;
if (Q.get('form')) ARMCFG.A2.form = Q.get('form') === 'blur' ? true : Q.get('form') === 'none' ? false : 'drawn';   // A2 sleeve shading: drawn (default) | blur | none

const face = (name, extra = {}) => ({ ...EXPR[name], ...extra });
// an arm pose by name for the active arm system (v2 falls back to its own table, with stand-ins for the new poses)
const V2X = { hold: { dx: .14, dy: .0, bend: .1, w: 0 }, point: { dx: .3, dy: -.1, bend: -.05, w: 0 }, door: { dx: .16, dy: -.56, bend: -.12, w: 0 } };
const AP = name => ARMS === 'v2' ? (ARM[name] || V2X[name]) : ARMS === 'A2' ? { ...ARM3[name], ...(X2P[name] || {}) } : ARM3[name];
// a character in the world: feet at (wx, wy), scale k; returns the pose and its screen hands
function actor(cam, id, wx, wy, k, o = {}) {
  const [x, y, Z] = toScreen(cam, 1, wx, wy);
  const p = pose({ x, y, k: k * Z, ...o });
  drawChar(c, CAST[id], p);
  return { p, hands: handPos(CAST[id], p) };
}
const cupsIn = (id, R) => { for (const h of R.hands) { drawCup(c, h[0], h[1] - .02 * 300 * R.p.k, R.p.k, { steam: .8, t: 1 }); drawHand(c, CAST[id], h[0], h[1], CAST[id].H * R.p.k, { dir: h[3], grip: true }); } };
function grade(tod) {   // warm afternoon grade (from the episode's story.js)
  if (tod <= .01) return;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply';
  c.fillStyle = `rgba(255,206,150,${.3 * tod})`; c.fillRect(0, 0, 1920, 1080);
  c.globalCompositeOperation = 'screen';
  const g = c.createRadialGradient(150, 60, 0, 150, 60, 1300); g.addColorStop(0, `rgba(255,190,110,${.28 * tod})`); g.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = g; c.fillRect(0, 0, 1920, 1080); c.restore();
}
const words = (s, t, t0 = 0, t1 = 1) => s.split(' ').map((w, i, a) => ({ w, s: t < t0 + (t1 - t0) * i / a.length ? 0 : t >= t0 + (t1 - t0) * (i + 1) / a.length ? 1 : .5 }));

// ---------------- 1. New York street: wide (morning) / night ----------------
function frameWide(t, night = 0) {
  const cam = { x: 960, y: 540, z: 1 };
  drawWorld(c, cam, t, { door: 0, taxiX: 1040, clock: 8.9, tod: 0, night });
  // Youssef hop-walks right with the red suitcase trailing behind (handle in his back hand)
  const wx = 560, lift = 26;
  drawSuitcase(c, wx - 118, GROUND, 1, 300, { handle: .0, tilt: .12 });
  actor(cam, 'youssef', wx, GROUND, 1, { lift, sq: 1.06, lean: .06, turn: .55, footL: .05, armL: AP('out'), armR: AP('rest'), quiff: .3,
    face: face('happy', { happy: .35, lx: .4, ly: -.1, mw: .12, mo: .05, mt: .4 }) });
  drawForeground(c, cam, t, { lamps: [200], night });
  bubble(c, { x: wx + 30, y: GROUND - 300 - 6, who: 'youssef', words: words(night ? 'Good evening, New York!' : 'Good morning, New York!', 2, 0, 4), side: 1, lift: 60 });
  setNarration(night ? 'أول ليلة ليا في نيويورك… وكل حاجة منوّرة!' : 'أول يوم ليا في نيويورك… والمدرسة في آخر الشارع!', 0, 8);
}
// ---------------- the door two-shot (afternoon): Sara on the stoop, Youssef at its foot ----------------
function frameDoor(t, o = {}) {
  const cam = { x: 1470, y: 690, z: 1.85 }, tod = 1;
  drawWorld(c, cam, t, { door: 1, dof: 2, tod, clock: 15.5 });
  const S = actor(cam, 'mia', o.cups ? 1584 : 1548, STOOP.top + 2, .8, { turn: -.42, face: face('happy', { happy: .5, lx: -.5, ly: .25, mw: .11, mo: .05, mt: .5 }),
    armL: AP(o.cups ? 'hold' : 'rest'), armR: AP(o.cups ? 'hold' : 'wave'), wave: .25, pony: -.1, lean: -.03 });
  if (o.cups) cupsIn('mia', S);
  const pointUp = ARMS === 'v2' ? { dx: .22, dy: -.2, bend: -.05, w: 0 } : { ...AP('point'), dx: .22, dy: -.2 };
  const Y = actor(cam, 'youssef', o.cups ? 1300 : 1360, GROUND, .98, { turn: .55, face: face('happy', { happy: .45, lx: .55, ly: -.25, mw: .12, mo: .05, mt: .4 }),
    armL: AP(o.point ? 'rest' : 'chest'), armR: o.point ? pointUp : AP('rest'), lean: .02 });
  grade(tod);
  const sh = [S.p.x - 6, S.p.y - CAST.mia.H * S.p.k * 1.1], yh = [Y.p.x + 10, Y.p.y - CAST.youssef.H * Y.p.k * 1.08];
  bubble(c, { x: sh[0], y: sh[1], who: 'mia', words: words(o.cups ? 'Coffee, Youssef?' : 'Good afternoon, Youssef!', 2.2, 0, 4), side: -1, lift: 70 });
  if (!o.cups) setNarration('سارة طلعت على السلّم وقالتلي: Good afternoon', 0, 8);
  else setNarration('وطلعت بقهوة كمان! قلتلها: Yes, please', 0, 8);
}

// ---------------- 2. arms model sheet ----------------
function label(txt, x, y, size = 22, col = P.ink, align = 'center', font = 'Fredoka', w = 600) {
  c.font = `${w} ${size}px "${font}"`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(txt, x, y);
}
function measureArms() {   // ms per character for each arm system (same pose, same scale), averaged over 30 draws
  const out = {}, p = pose({ x: 600, y: 600, k: 1, turn: .3, face: EXPR.happy });
  const off = document.createElement('canvas'); off.width = 1920; off.height = 1080; const oc = off.getContext('2d', CPU);
  for (let pass = 0; pass < 3; pass++) for (const m of ['v2', 'A', 'B', 'C', 'A2']) {   // three passes: the first two warm the caches + JIT, the best run counts
    setArms(m); const q = { ...p, armL: AP('wave'), armR: AP('hold') };
    const t0 = performance.now(); for (let i = 0; i < 30; i++) { drawChar(oc, CAST.youssef, q); drawChar(oc, CAST.mia, q); }
    const ms = (performance.now() - t0) / 30;   // ms for the two characters
    out[m] = pass ? Math.min(out[m], ms) : ms;
  }
  setArms(ARMQ); return out;
}
function sheetArms() {
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  c.font = '400 56px "Lilita One"'; c.fillStyle = P.navy; c.textAlign = 'left'; c.fillText('ARMS & SHOULDERS', 40, 68);
  const tw = c.measureText('ARMS & SHOULDERS').width;
  label('three options · "Youssef in New York" · design v3 · shoulder anchor at .375 H with a bump, taper, cuff, round hand +15 %, both arms always visible', 40 + tw + 24, 56, 21, rgba(P.ink, .7), 'left', 'Fredoka', 500);
  label('poses: rest · wave · point · hold two cups · scratch head · 3/4 view (rest) — each on Youssef and Sara at the same scale', 40 + tw + 24, 82, 18, rgba(P.ink, .45), 'left', 'Fredoka', 500);
  const cost = measureArms(); window.COST = cost;
  const rows = [['A', 'jointed tapered arm', ['fixed shoulder anchor + bump', 'upper arm + forearm, 2-bone IK elbow', 'taper .07 H → .045 H, sleeve cuff', 'rest: along the body, slight bend']],
    ['B', 'bendy sleeve arm', ['one smooth S-curved tube, no elbow', 'same taper, cuff and hand', 'soft-toy curves for hold / point / wave', 'cheapest to animate (one curve)']],
    ['C', 'short stubby jointed arm', ['current reach (≈ .24 H), bean feel', 'shoulder anchor, taper, cuff, elbow', 'hands stay close to the body', 'scratch / point reach less far']]];
  const poses = [['rest', 'rest', 'rest', 0], ['wave', 'rest', 'wave', 0], ['point', 'rest', 'point', 0], ['hold two cups', 'hold', 'hold', 0], ['scratch head', 'rest', 'scratch', 0], ['3/4 view', 'rest', 'rest', .62]];
  const k = .56, y0 = 112, rh = 312, cellW = 292, x0 = 150;
  rows.forEach(([id, name, notes], ri) => {
    const ry = y0 + ri * rh;
    c.fillStyle = ri % 2 ? '#FFF8EC' : '#FFFBF3'; rr(c, 30, ry, SW - 60, rh - 10, 26); c.fill();
    setArms(id);
    c.font = '400 54px "Lilita One"'; c.fillStyle = id === 'A' ? P.teal : id === 'B' ? '#C24A28' : P.navy; c.textAlign = 'left'; c.fillText(id, 54, ry + 56);
    label(name, 100, ry + 54, 26, P.ink, 'left', 'Fredoka', 600);
    const d = cost[id] - cost.v2;
    label(notes.join('  ·  '), 54, ry + 285, 17, rgba(P.ink, .68), 'left', 'Fredoka', 500);
    label(`cost: ${cost[id].toFixed(1)} ms / frame for two characters at 1080p (${d >= 0 ? '+' : ''}${d.toFixed(1)} ms vs the current arm, ${cost.v2.toFixed(1)} ms) · IK on the hand target, no extra form pass`, 54, ry + 306, 15, dark(P.teal, .2), 'left', 'Fredoka', 600);
    poses.forEach(([pn, aL, aR, turn], pi) => {
      const cx = x0 + pi * cellW + 140, g = ry + 240;
      c.setLineDash([5, 7]); c.strokeStyle = rgba(P.ink, .12); c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - 136, g + 1); c.lineTo(cx + 136, g + 1); c.stroke(); c.setLineDash([]);
      for (const [j, id2] of [[0, 'youssef'], [1, 'mia']]) {
        const sp = CAST[id2], xx = cx - 72 + j * 146, hold = pn === 'hold two cups';
        const fx = pn === 'wave' ? face('joy') : pn === 'scratch head' ? face('embarrassed') : pn === 'point' ? face('talk', { lx: .6 }) : face('happy', { happy: .4 });
        const o = { turn: turn + (j ? -turn * 2 : 0), face: fx, armL: AP(aL), armR: AP(aR), wave: .25, shadow: .8 };
        if (pn === 'wave' && j) { o.armL = AP('wave'); o.armR = AP('rest'); }
        if (pn === 'point' && j) { o.armL = AP('point'); o.armR = AP('rest'); o.face = face('talk', { lx: -.6 }); }
        if (pn === 'scratch head' && j) { o.armL = AP('scratch'); o.armR = AP('rest'); }
        const p = pose({ x: xx, y: g, k, ...o }); drawChar(c, sp, p);
        if (hold) for (const h of handPos(sp, p)) { drawCup(c, h[0], h[1] - .02 * 300 * k, k, { steam: .6, t: 1 }); drawHand(c, sp, h[0], h[1], sp.H * k); }
      }
      label(pn, cx, g + 26, 17, rgba(P.ink, .6));
    });
  });
  setArms(ARMQ);
  label('Model sheet 1920×1080 · same two characters, same scale in every cell · light from the upper-left · SARA (was MIA) keeps the rust tab', SW / 2, SH - 10, 14, rgba(P.ink, .45));
}

// ---------------- A2 close-ups: five panels at about twice the sheet scale ----------------
function sheetCloseups() {
  c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, SW, SH);
  const cost = measureArms(); window.COST = cost;
  c.font = '400 44px "Lilita One"'; c.fillStyle = P.navy; c.textAlign = 'left'; c.fillText('A2 · CLOSE-UPS', 40, 58);
  label('jointed tapered arm, revised · shoulder on the widest band (.43 H) with a sleeve cap · min elbow bend per pose · hand +20 % with a thumb · drawn crescent + rim on the sleeve, overlap shadow on the body', 380, 54, 17, rgba(P.ink, .7), 'left', 'Fredoka', 500);
  label(`cost: ${cost.A2.toFixed(1)} ms vs ${cost.v2.toFixed(1)} ms (current arm) for two characters at k = 1, 1080p → ${(cost.A2 - cost.v2) >= 0 ? '+' : ''}${(cost.A2 - cost.v2).toFixed(1)} ms / frame · the blur form pass on the sleeve would add ≈ 11 ms, so the crescent + rim are drawn instead`, 380, 76, 15, dark(P.teal, .2), 'left', 'Fredoka', 600);
  const panels = [['Youssef pointing', [['youssef', { turn: .3, armL: AP('rest'), armR: AP('point'), face: face('talk', { lx: .6 }) }]]],
    ['Sara holding two cups', [['mia', { turn: 0, armL: AP('hold'), armR: AP('hold'), face: face('happy', { happy: .5 }), cups: 1 }]]],
    ['Youssef scratching his head', [['youssef', { turn: .15, armL: AP('rest'), armR: AP('scratch'), face: face('embarrassed') }]]],
    ['both at rest', [['youssef', { turn: .2, armL: AP('rest'), armR: AP('rest'), face: face('happy', { happy: .4 }) }], ['mia', { turn: -.2, armL: AP('rest'), armR: AP('rest'), face: face('happy', { happy: .4 }) }]]],
    ['Youssef waving', [['youssef', { turn: 0, armL: AP('rest'), armR: AP('wave'), wave: .25, face: face('joy') }]]]];
  const W = 620, Hh = 480, pos = [[40, 90], [650, 90], [1260, 90], [345, 580], [955, 580]];
  panels.forEach(([name, chars], i) => {
    const [px, py] = pos[i];
    rr(c, px, py, W, Hh, 26); c.fillStyle = i % 2 ? '#FFF8EC' : '#FFFBF3'; c.fill();
    const g = py + Hh - 36, k = chars.length > 1 ? 1.15 : 1.3;
    chars.forEach(([id, o], j) => {
      const sp = CAST[id], x = px + W / 2 + (chars.length > 1 ? (j ? 175 : -175) : 0);
      const p = pose({ x, y: g, k, ...o, shadow: .8 }); drawChar(c, sp, p);
      if (o.cups) for (const h of handPos(sp, p)) { drawCup(c, h[0], h[1] - .02 * 300 * k, k, { steam: .7, t: 1 }); drawHand(c, sp, h[0], h[1], sp.H * k, { dir: h[3], grip: true }); }
    });
    label(name, px + W / 2, py + Hh - 10, 18, rgba(P.ink, .65));
  });
}

// ---------------- 3. exercises call-to-action: full screen ----------------
const EX = { n: 1, who: 'سارة:', context: 'Good morning, Youssef!', wrong: 'Good night, Sara!', span: 'Good night', answer: 'Good morning', chips: ['Good bye', 'Good morning', 'Good night'], right: 1 };
function star(c, x, y, r, fill, stroke) {
  c.save(); c.translate(x, y); c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .46 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); }
  c.closePath(); c.lineJoin = 'round';
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 4; c.stroke(); }
  c.restore();
}
function bigCard(t, cx, cy, w, h) {
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(cx - w / 2, cy - h / 2);
  rr(c, 0, 18, w, h, 48); c.fillStyle = rgba('#2A2742', .28); c.fill();
  rr(c, 0, 0, w, h, 48); c.fillStyle = P.cream; c.fill();
  c.save(); rr(c, 0, 0, w, h, 48); c.clip();
  c.fillStyle = rgba('#6F62A8', .09); for (let y = 150; y < h; y += 48) c.fillRect(0, y, w, 2);
  // the site's top bar + progress dots
  c.fillStyle = rgba(P.ink, .12); c.fillRect(0, 100, w, 2);
  c.direction = 'rtl'; c.font = `800 44px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.navy; c.fillText('يوسف في نيويورك · تمارين', w / 2, 52);
  for (let i = 0; i < 12; i++) {
    const x = w / 2 - 143 + i * 26, cur = i === EX.n - 1, r = cur ? 11 : 8;
    ell(c, x, 132, r, r); c.fillStyle = i < EX.n - 1 ? P.leaf : cur ? P.mustard : '#FFFDF8'; c.fill();
    if (i >= EX.n) { c.strokeStyle = rgba(P.ink, .3); c.lineWidth = 2.5; c.stroke(); }
  }
  // the exercise card
  const X0 = 34, X1 = w - 34, CW = X1 - X0, top = 168, cardH = h - top - 34;
  rr(c, X0, top + 8, CW, cardH, 30); c.fillStyle = rgba('#6F62A8', .16); c.fill();
  rr(c, X0, top, CW, cardH, 30); c.fillStyle = '#FFFDF8'; c.fill();
  ell(c, X1 - 50, top + 56, 30, 30); c.fillStyle = P.mustard; c.fill();
  c.font = '400 34px "Lilita One"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.ink; c.fillText(String(EX.n), X1 - 50, top + 59);
  c.direction = 'rtl'; c.font = `800 42px ${AR}`; c.textAlign = 'right'; c.fillStyle = P.navy; c.fillText('صلّح غلطة يوسف', X1 - 98, top + 58);
  // context (what Sara said) + prompt
  rr(c, X0 + 26, top + 104, CW - 52, 72, 20); c.fillStyle = '#DDEFF8'; c.fill();
  c.font = `700 32px ${AR}`; c.fillStyle = P.ink; const ww = c.measureText(EX.who).width; c.fillText(EX.who, X1 - 48, top + 142);
  c.direction = 'ltr'; c.font = '500 34px "Fredoka"'; c.textAlign = 'right'; c.fillText(EX.context, X1 - 48 - ww - 12, top + 142);
  c.direction = 'rtl'; c.font = `800 36px ${AR}`; c.textAlign = 'right'; c.fillStyle = P.ink; c.fillText('يوسف غلط… الكلمة الصح إيه؟', X1 - 26, top + 226);
  // the sentence with the squiggle under the wrong span; the answer chip is taken, so the ✓ sits by the sentence
  c.direction = 'ltr'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let fs = 84; c.font = `600 ${fs}px "Fredoka"`; const full = c.measureText(EX.wrong).width;
  if (full > CW - 120) { fs = Math.floor(fs * (CW - 120) / full); c.font = `600 ${fs}px "Fredoka"`; }
  const si = EX.wrong.indexOf(EX.span), pre = EX.wrong.slice(0, si), wPre = c.measureText(pre).width, wSpan = c.measureText(EX.span).width, wAll = c.measureText(EX.wrong).width;
  const sx0 = w / 2 - wAll / 2 - 20, by = top + 322;
  c.fillStyle = P.ink; c.fillText(EX.wrong, sx0, by);
  squiggle(c, sx0 + wPre, sx0 + wPre + wSpan, by + 20, 1, 8, P.red, 7);
  // chips (the right one is chosen) + the ✓
  c.font = '600 36px "Fredoka"'; const GAP = 18, chipW = EX.chips.map(s => c.measureText(s).width + 64), rowW = chipW.reduce((a, b) => a + b, 0) + GAP * 2;
  let x = w / 2 - rowW / 2; const cyy = top + 412;
  EX.chips.forEach((s, i) => {
    const cw = chipW[i], on = i === EX.right;
    rr(c, x, cyy - 36 + 5, cw, 72, 36); c.fillStyle = on ? P.leaf : rgba(P.ink, .12); c.fill();
    rr(c, x, cyy - 36, cw, 72, 36); c.fillStyle = on ? '#DCEFD8' : '#FFFDF8'; c.fill(); c.strokeStyle = on ? P.leaf : rgba(P.ink, .14); c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.ink; c.fillText(s, x + cw / 2, cyy + 1);
    if (on) check(c, x + cw - 4, cyy - 34, 24, 1);
    x += cw + GAP;
  });
  // stars
  for (let i = 0; i < 3; i++) { const sxx = w / 2 + (i - 1) * 104, sy = top + 498; star(c, sxx, sy, 34, i < 2 ? P.mustard : null, i < 2 ? null : rgba(P.ink, .3)); }
  for (let j = 0; j < 6; j++) { const a = j * 1.05; sparkle(c, w / 2 + 104 + Math.cos(a) * 62, top + 498 + Math.sin(a) * 58, 9, j % 2 ? P.mustard : P.red, a); }
  c.restore(); c.restore();
}
function frameCTA(t) {
  const cam = { x: 1500, y: 668, z: 1.85 };
  drawWorld(c, cam, t, { door: 1, dof: 9, nearDof: 9, tod: 0, clock: 9.0 });
  actor(cam, 'mia', 1536, STOOP.top + 2, .8, { turn: -.42, face: face('happy'), armL: AP('rest'), armR: AP('rest') });
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = rgba('#2A2742', .5); c.fillRect(0, 0, SW, SH); c.restore();
  // Youssef, small at the side, pointing at the card
  const Y = actor({ x: 960, y: 540, z: 1 }, 'youssef', 250, 905, .92, { turn: .4, face: face('happy', { happy: .45, lx: .6, ly: -.3, mw: .12, mo: .05, mt: .4 }), armL: AP('rest'), armR: AP('point') });
  bigCard(t, 1040, 420, 1000, 740);
  // the big mustard bar: "solve the episode's exercises · the link is in the description ⬇"
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(960, 858);
  c.direction = 'rtl'; c.font = `800 48px ${AR}`; c.textAlign = 'right'; c.textBaseline = 'middle';
  const lab = 'حل تمارين الحلقة · اللينك في الوصف', bw = c.measureText(lab).width + 70 + 96;
  rr(c, -bw / 2, -46 + 9, bw, 92, 46); c.fillStyle = rgba('#2A2742', .3); c.fill();
  rr(c, -bw / 2, -46, bw, 92, 46); c.fillStyle = P.mustard; c.fill();
  c.fillStyle = P.ink; c.fillText(lab, bw / 2 - 36, 6);
  c.save(); c.translate(-bw / 2 + 56, 2); c.fillStyle = P.navy;
  c.beginPath(); c.moveTo(-10, -30); c.lineTo(10, -30); c.lineTo(10, 0); c.lineTo(27, 0); c.lineTo(0, 30); c.lineTo(-27, 0); c.lineTo(-10, 0); c.closePath(); c.fill();
  c.restore(); c.restore();
  setNarration('ادخل الموقع وحل تمارين الحلقة… خمس دقايق بس!', 0, 8);
}

// ---------------- end card ----------------
function frameEnd(t) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = '#FBF1E1'; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = mix('#FBF1E1', P.mustard, .16); c.fillRect(0, 900, 1920, 180);
  // series title
  c.save(); c.direction = 'rtl'; c.font = `800 72px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.navy; c.fillText('يوسف في نيويورك', 960, 96);
  const tw = c.measureText('يوسف في نيويورك').width; rr(c, 960 - tw / 2, 132, tw, 12, 6); c.fillStyle = P.mustard; c.fill(); c.restore();
  // الحلقة الجاية
  c.save(); c.translate(960, 250); c.direction = 'rtl'; c.font = `800 92px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const w = c.measureText('الحلقة الجاية').width + 90; rr(c, -w / 2, -66, w, 132, 66); c.fillStyle = P.navy; c.fill();
  c.fillStyle = P.cream; c.fillText('الحلقة الجاية', 0, 10); c.restore();
  // How old are you?
  c.save(); c.translate(960, 500); c.font = '600 150px "Fredoka"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const hw = c.measureText('How old are you').width, qw = c.measureText('?').width;
  rr(c, -(hw + qw) / 2 - 10, 18, hw + qw + 20, 22, 11); c.fillStyle = P.mustard; c.fill();
  c.fillStyle = P.ink; c.textAlign = 'left'; c.fillText('How old are you', -(hw + qw) / 2, 0);
  c.save(); c.translate((hw + qw) / 2 - qw / 2, -60); c.rotate(.12); c.fillStyle = P.red; c.textAlign = 'center'; c.fillText('?', 0, 60); c.restore();
  c.restore();
  // Youssef peeking in from the left
  actor({ x: 960, y: 540, z: 1 }, 'youssef', 230, 985, 1.0, { turn: .45, face: face('nervous', { sweat: 1, lx: .6, ly: -.2, mt: .7 }), armL: AP('rest'), armR: AP('point') });
  const pill = (x, y, lab, col, icon) => {
    c.save(); c.translate(x, y);
    c.direction = 'rtl'; c.font = `800 78px ${AR}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const bw = c.measureText(lab).width + 230;
    rr(c, -bw / 2, -70 + 12, bw, 140, 70); c.fillStyle = rgba('#2A2742', .2); c.fill();
    rr(c, -bw / 2, -70, bw, 140, 70); c.fillStyle = col; c.fill();
    c.fillStyle = P.cream; c.fillText(lab, 44, 8);
    c.save(); c.translate(-bw / 2 + 82, 0); c.scale(1.45, 1.45); icon(); c.restore();
    c.restore(); return bw;
  };
  pill(780, 790, 'حل التمارين', P.teal, () => {
    c.rotate(.78); c.fillStyle = P.mustard; rr(c, -9, -30, 18, 44, 3); c.fill(); c.fillStyle = P.cream; c.fillRect(-9, -30, 18, 8);
    c.fillStyle = P.red; rr(c, -9, -36, 18, 8, 3); c.fill(); c.fillStyle = '#F3DDB8'; c.beginPath(); c.moveTo(-9, 14); c.lineTo(9, 14); c.lineTo(0, 30); c.closePath(); c.fill();
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(-3.5, 24); c.lineTo(3.5, 24); c.lineTo(0, 30); c.closePath(); c.fill();
  });
  pill(1380, 790, 'اشترك', P.red, () => {
    c.rotate(.2); c.fillStyle = P.mustard; c.beginPath(); c.moveTo(-22, 16); c.quadraticCurveTo(-20, -24, 0, -26); c.quadraticCurveTo(20, -24, 22, 16); c.closePath(); c.fill();
    rr(c, -27, 12, 54, 9, 4); c.fill(); ell(c, 0, 26, 7, 7); c.fill();
  });
  // the hand cursor tapping "subscribe"
  c.save(); c.translate(1410, 870); c.rotate(-.35); c.scale(1.2, 1.2);
  c.fillStyle = '#FFFDF8'; c.strokeStyle = P.ink; c.lineWidth = 5; c.lineJoin = 'round';
  c.beginPath(); c.roundRect(-14, -50, 28, 70, 14); c.roundRect(-40, 0, 80, 64, 22); c.fill(); c.stroke();
  c.restore();
}

window.render = t => {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  setArms(ARMQ); setNarration('', 0, 1);
  if (F === 'ny_wide') frameWide(t, 0);
  else if (F === 'ny_night') frameWide(t, 1);
  else if (F === 'ny_door') frameDoor(t);
  else if (F === 'arms_frame') frameDoor(t, { cups: true, point: true });
  else if (F === 'arms') { sheetArms(); return; }
  else if (F === 'closeups') { sheetCloseups(); return; }
  else if (F === 'cta') frameCTA(t);
  else if (F === 'endcard') { frameEnd(t); grain(c, SW, SH, .03); return; }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  plate(c, t);
  grain(c, SW, SH, .03);
};

(async () => {
  await document.fonts.load('600 40px "Fredoka"');
  await Promise.all([document.fonts.load('400 40px "Lilita One"'), document.fonts.load('700 40px "Baloo Bhaijaan 2"', 'أول يوسف'),
    document.fonts.load('800 40px "Baloo Bhaijaan 2"', 'أول يوسف'), document.fonts.load('500 40px "Fredoka"'), document.fonts.load('700 40px "Fredoka"')]);
  await document.fonts.ready;
  bakeWorld();
  window.render(0);
  window.READY = true;
})();
