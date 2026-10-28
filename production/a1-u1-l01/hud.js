// 2D overlay: Arabic narration subtitles, typed English bubbles, title sign, ratings, practice badges, end cards
import { clamp, seg, back, ss, eo, lerp, TAU, mulberry } from './lib.js';
const INK = '#3a2a24', CREAM = '#fffaf0';
export const AR = '"Baloo Bhaijaan 2", Fredoka';
export const CPS = 26;

function wrap(x, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
const outlined = (x, s, px, py, lw, fill = CREAM, stroke = 'rgba(28,18,12,.82)') => { x.lineJoin = 'round'; x.lineWidth = lw; x.strokeStyle = stroke; x.strokeText(s, px, py); x.fillStyle = fill; x.fillText(s, px, py); };

// Narration subtitles (Arabic, RTL; English words inside stay Latin via the bidi algorithm)
export function drawSubs(x, t, subs) {
  for (let i = 0; i < subs.length; i++) {
    const s = subs[i], nx = subs[i + 1] ? subs[i + 1].t0 - .12 : 1e9;
    const e1 = Math.min(Math.max(s.t1 + .35, s.t0 + 1.8), nx - .2), e2 = Math.min(Math.max(s.t1 + .6, s.t0 + 2.05), nx);
    const a = Math.min(seg(t, s.t0 - .2, s.t0 + .1), 1 - seg(t, e1, e2));
    if (a <= 0) continue;
    x.save(); x.globalAlpha = a; x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.font = `600 46px ${AR}`; const lines = wrap(x, s.text, 1600);
    let y = 1080 - 62 - (lines.length - 1) * 60;
    x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 16;
    for (const l of lines) { outlined(x, l, 960, y, 9); y += 60; }
    x.restore();
  }
}

// Typed speech bubbles; anchors[who] = [sx, sy] screen point above the head
export function bubbleBox(x, b, an) {
  x.font = '600 50px Fredoka';
  const tw = Math.max(x.measureText(b.text).width, 200), bw = tw + 84, bh = 104;
  const bx = clamp(an[0] - bw * .5, 30, 1890 - bw), by = clamp(an[1] - bh - 64, 24, 760);
  return { bx, by, bw, bh, tx: clamp(an[0], bx + 46, bx + bw - 46) };
}
export function drawBubbles(x, t, bubbles, anchors, skip = () => false) {
  for (const b of bubbles) {
    if (t < b.t0 - .05 || t > b.t1 + .25 || skip(b, t)) continue;
    const an = anchors[b.who]; if (!an) continue;
    const kin = back(seg(t, b.t0, b.t0 + .22), 2.2), kout = 1 - ss(seg(t, b.t1, b.t1 + .2)), k = kin * kout;
    if (k <= 0) continue;
    const n = Math.floor(clamp((t - b.t0 - .1) * CPS, 0, b.text.length));
    x.save();
    const { bx, by, bw, bh, tx } = bubbleBox(x, b, an);
    x.translate(tx, by + bh); x.scale(k, k); x.translate(-tx, -(by + bh));
    paperBubble(x, bx, by, bw, bh, tx, an);
    x.fillStyle = '#241814'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = '600 50px Fredoka';
    x.fillText(b.text.slice(0, n), bx + 42, by + bh / 2 + 3);
    x.restore();
  }
}
function paperBubble(x, bx, by, bw, bh, tx, an) {
  const tipX = lerp(tx, an[0], .7), tipY = Math.min(an[1] - 12, by + bh + 52);
  x.fillStyle = 'rgba(40,25,15,.22)'; x.beginPath(); x.roundRect(bx + 8, by + 12, bw, bh, 40); x.fill();
  x.beginPath(); x.roundRect(bx, by, bw, bh, 40); x.moveTo(tx - 24, by + bh - 2); x.lineTo(tipX, tipY); x.lineTo(tx + 18, by + bh - 2);
  x.fillStyle = '#fffdf8'; x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.lineJoin = 'round';
  x.beginPath(); x.roundRect(bx, by, bw, bh, 40); x.stroke();
  x.beginPath(); x.moveTo(tx - 24, by + bh); x.lineTo(tipX, tipY); x.lineTo(tx + 18, by + bh); x.stroke();
  x.fillStyle = '#fffdf8'; x.fillRect(tx - 20, by + bh - 8, 36, 9);
}
export function blipTimes(bubbles) {
  const ev = [];
  for (const b of bubbles) for (let i = 0; i < b.text.length; i++) if (/[A-Za-z!?']/.test(b.text[i]) && i % 2 === 0) ev.push({ t: b.t0 + .1 + i / CPS, type: 'blip', who: b.who });
  return ev;
}

// A crumpled paper ball (2D), seeded
export function paperBall(x, cx, cy, r, seed, rot = 0) {
  const R = mulberry(seed), P = [];
  for (let i = 0; i < 13; i++) { const a = i / 13 * TAU + (R() - .5) * .3, rr = r * (.78 + R() * .3); P.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
  x.save(); x.translate(cx, cy); x.rotate(rot);
  x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); P.forEach((p, i) => i ? x.lineTo(p[0] + 6, p[1] + 9) : x.moveTo(p[0] + 6, p[1] + 9)); x.closePath(); x.fill();
  x.beginPath(); P.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.fillStyle = '#f4f0e6'; x.fill();
  x.save(); x.clip();
  for (let i = 0; i < P.length; i++) { const q = P[(i + 1) % P.length]; x.beginPath(); x.moveTo((R() - .5) * r * .5, (R() - .5) * r * .5); x.lineTo(P[i][0], P[i][1]); x.lineTo(q[0], q[1]); x.closePath(); const g = 200 + R() * 50; x.fillStyle = `rgb(${g | 0},${(g - 6) | 0},${(g - 18) | 0})`; x.fill(); }
  x.strokeStyle = 'rgba(110,90,70,.55)'; x.lineWidth = 2.5; for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo((R() - .5) * r * 1.6, (R() - .5) * r * 1.6); x.lineTo((R() - .5) * r * 1.6, (R() - .5) * r * 1.6); x.stroke(); }
  x.restore();
  x.beginPath(); P.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.lineWidth = 5; x.strokeStyle = INK; x.lineJoin = 'round'; x.stroke();
  x.restore();
}
// Youssef's wrong bubble: crumples into a ball and drops
export function drawCrumpledBubble(x, t, b, an, t0) {
  if (!an || t < t0 || t > t0 + 1.6) return;
  const { bx, by, bw, bh } = bubbleBox(x, b, an), cx = bx + bw / 2, cy = by + bh / 2;
  const k = seg(t, t0, t0 + .28);
  if (k < 1) {   // squeeze the bubble
    x.save(); x.translate(cx, cy); x.scale(1 - k * .8, 1 - k * .55); x.rotate(k * .4); x.translate(-cx, -cy);
    paperBubble(x, bx, by, bw, bh, cx, [cx, by + bh + 40]);
    x.fillStyle = '#241814'; x.font = '600 50px Fredoka'; x.textBaseline = 'middle'; x.fillText(b.text, bx + 42, by + bh / 2 + 3);
    x.restore(); return;
  }
  const u = t - t0 - .28, fall = 520 * u * u + 40 * u;
  paperBall(x, cx + u * 60, cy + fall, 46 + 4 * Math.sin(u * 10) * Math.exp(-u * 4), 7, u * 3);
}

// Title: a cardboard sign on strings
export function drawTitle(x, t, [t0, t1], ribbon, en, ar) {
  if (t < t0 || t > t1 + .6) return;
  const kin = seg(t, t0, t0 + .7), kout = seg(t, t1, t1 + .5);
  const drop = (1 - back(kin, 1.4)) * -360 - ss(kout) * 480, sw = Math.sin((t - t0) * 3.1) * .03 * (1 - kin * .6) * (1 - kout);
  x.save(); x.translate(960, 300 + drop); x.rotate(sw);
  x.strokeStyle = '#6b5a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(-330, -60); x.lineTo(-330, -460); x.moveTo(330, -60); x.lineTo(330, -460); x.stroke();
  x.font = '96px "Lilita One"'; const w = Math.max(760, x.measureText(en).width + 170);
  x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); x.roundRect(-w / 2 + 12, -64 + 16, w, 270, 24); x.fill();
  x.fillStyle = CREAM; x.beginPath(); x.roundRect(-w / 2 - 12, -78, w + 24, 296, 30); x.fill();
  x.fillStyle = '#f4e6c8'; x.beginPath(); x.roundRect(-w / 2, -64, w, 270, 24); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  x.fillStyle = '#d8423a'; x.beginPath(); x.moveTo(-180, -96); x.lineTo(180, -96); x.lineTo(160, -56); x.lineTo(180, -16); x.lineTo(-180, -16); x.lineTo(-160, -56); x.closePath(); x.fill(); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '40px "Lilita One"'; x.fillStyle = '#fff4d6'; x.fillText(ribbon, 0, -54);
  x.font = '96px "Lilita One"'; x.lineWidth = 13; x.strokeStyle = INK; x.lineJoin = 'round'; x.strokeText(en, 0, 50); x.fillStyle = '#ffcf3f'; x.fillText(en, 0, 50);
  x.direction = 'rtl'; x.font = `58px Lalezar, ${AR}`; x.fillStyle = '#6b4a36'; x.fillText(ar, 0, 152);
  x.restore();
}

// Action rating (PERFECT! NICE!)
export function drawAction(x, t, list) {
  for (const { t0, text, p, col } of list) {
    if (t < t0 || t > t0 + 1.5 || !p) continue;
    const k = back(seg(t, t0, t0 + .18), 2.5), fo = 1 - seg(t, t0 + 1.1, t0 + 1.5);
    x.save(); x.translate(p[0], p[1] - 40 - seg(t, t0, t0 + 1.5) * 50); x.rotate(-.1); x.scale(k, k); x.globalAlpha = fo;
    const R = mulberry(Math.round(t0 * 10));
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + R() * .3, r0 = 110, r1 = 180 + R() * 70 * eo(seg(t, t0, t0 + .4)); x.strokeStyle = i % 2 ? '#ffe35a' : '#ffffff'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * .6); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * .6); x.stroke(); }
    x.font = 'italic 124px "Lilita One"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
    x.lineWidth = 30; x.strokeStyle = CREAM; x.strokeText(text, 0, 0); x.lineWidth = 12; x.strokeStyle = INK; x.strokeText(text, 0, 0);
    const g = x.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); x.fillStyle = g; x.fillText(text, 0, 0);
    x.restore();
  }
}

// Paper badge: "your turn" during the repeat round, with a shrinking time strip
export function drawTurnBadge(x, t, t0, t1, label, sub) {
  if (t < t0 - .1 || t > t1 + .3) return;
  const k = back(seg(t, t0, t0 + .25), 2) * (1 - ss(seg(t, t1, t1 + .25))); if (k <= 0) return;
  x.save(); x.translate(960, 965); x.scale(k, k); x.rotate(-.02);
  const w = 560, h = 120;
  x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); x.roundRect(-w / 2 + 8, -h / 2 + 10, w, h, 30); x.fill();
  x.fillStyle = '#fffdf8'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 30); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  // microphone icon
  x.save(); x.translate(-w / 2 + 70, -2);
  x.beginPath(); x.roundRect(-16, -38, 32, 54, 16); x.fillStyle = '#e8413a'; x.fill(); x.lineWidth = 5; x.stroke();
  x.beginPath(); x.arc(0, 0, 28, .15 * Math.PI, .85 * Math.PI); x.moveTo(0, 28); x.lineTo(0, 42); x.moveTo(-16, 42); x.lineTo(16, 42); x.stroke(); x.restore();
  x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `800 50px ${AR}`; x.fillStyle = '#2a1c16'; x.fillText(label, 40, -10);
  if (sub) { x.font = `500 28px ${AR}`; x.fillStyle = '#7a5e4c'; x.fillText(sub, 40, 34); }
  const u = 1 - seg(t, t0, t1); x.fillStyle = '#ffcf3f'; x.beginPath(); x.roundRect(-w / 2 + 24, h / 2 - 16, (w - 48) * u, 8, 4); x.fill();
  x.restore();
}
// Countdown medallion (your turn)
export function drawCountdown(x, t, [t0, t1]) {
  if (t < t0 - .1 || t > t1 + .3) return;
  const k = back(seg(t, t0, t0 + .3), 2) * (1 - ss(seg(t, t1, t1 + .3))); if (k <= 0) return;
  const n = Math.max(1, Math.ceil(t1 - t)), pulse = 1 + .08 * Math.exp(-((t - t0) % 1) * 8);
  x.save(); x.translate(1560, 300); x.scale(k * pulse, k * pulse);
  x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); x.arc(8, 12, 110, 0, TAU); x.fill();
  x.fillStyle = '#ffcf3f'; x.beginPath(); x.arc(0, 0, 110, 0, TAU); x.fill(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
  x.fillStyle = '#fffdf8'; x.beginPath(); x.arc(0, 0, 84, 0, TAU); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 84, -Math.PI / 2, -Math.PI / 2 + TAU * seg(t, t0, t1)); x.closePath(); x.fillStyle = 'rgba(232,65,58,.25)'; x.fill();
  x.font = '110px "Lilita One"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2a1c16'; x.fillText(String(n), 0, 6);
  x.restore();
}
// Comment prompt + next lesson sign
export function drawCTA(x, t, t0, t1) {
  if (t < t0 || t > t1 + .4) return;
  const k = back(seg(t, t0, t0 + .3), 2) * (1 - ss(seg(t, t1, t1 + .3)));
  const full = "Hi! I'm ______", n = Math.floor(clamp((t - t0 - .3) * 14, 0, full.length));
  x.save(); x.translate(960, 330); x.scale(k, k);
  const w = 720, h = 150;
  x.fillStyle = 'rgba(40,25,15,.25)'; x.beginPath(); x.roundRect(-w / 2 + 8, -h / 2 + 12, w, h, 44); x.fill();
  x.fillStyle = '#fffdf8'; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 44); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  x.font = '600 70px Fredoka'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#241814'; x.fillText(full.slice(0, n), -w / 2 + 60, 4);
  x.direction = 'rtl'; x.textAlign = 'center'; x.font = `800 44px ${AR}`; outlined(x, 'اكتبها في الكومنتات ↓', 0, h / 2 + 64, 9);
  x.restore();
}
export function drawNext(x, t, t0, t1) {
  if (t < t0 || t > t1 + .5) return;
  const kin = seg(t, t0, t0 + .6), kout = seg(t, t1, t1 + .5), drop = (1 - back(kin, 1.5)) * -300 - ss(kout) * 420;
  x.save(); x.translate(960, 210 + drop); x.rotate(Math.sin((t - t0) * 3) * .025 * (1 - kin * .6));
  x.strokeStyle = '#6b5a4a'; x.lineWidth = 3; x.beginPath(); x.moveTo(-240, -40); x.lineTo(-240, -380); x.moveTo(240, -40); x.lineTo(240, -380); x.stroke();
  const w = 640;
  x.fillStyle = '#f4e6c8'; x.beginPath(); x.roundRect(-w / 2, -50, w, 170, 22); x.fill(); x.lineWidth = 6; x.strokeStyle = INK; x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '40px "Lilita One"'; x.fillStyle = '#d8423a'; x.fillText('NEXT · LESSON 2', 0, -8);
  x.font = '70px "Lilita One"'; x.lineWidth = 11; x.strokeStyle = INK; x.lineJoin = 'round'; x.strokeText('How are you?', 0, 66); x.fillStyle = '#ffcf3f'; x.fillText('How are you?', 0, 66);
  x.restore();
}
