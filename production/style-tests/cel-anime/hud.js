// Subtitles recorded on the tape (composited inside the CRT pass): cream-yellow, thick dark outline, soft shadow, ~96 px above the bottom.
// Arabic diary narration (RTL, Baloo Bhaijaan 2); English dialogue (Barlow Semi Condensed) with a small boxed speaker tag, Mia in a second colour.
import { W, H, rgba } from './cel.js';

export const SUBS = [
  { t0: 0.60, t1: 2.72, ar: true, text: 'أول يوم ليّا في لندن…' },
  { t0: 2.72, t1: 5.95, ar: true, text: 'وكنت فاكر إن الإنجليزي بتاعي كويس.' },
  { t0: 5.95, t1: 7.95, ar: true, text: 'لحد ما قابلت ميا.' },
  { t0: 7.95, t1: 9.88, who: 'MIA', text: "Hi! I'm Mia." },
  { t0: 9.88, t1: 14.2, who: 'YOUSSEF', text: 'Hello! I... I Youssef.' },
  { t0: 14.45, t1: 16.45, who: 'MIA', text: 'Sorry?' },
];
const COL = { MIA: '#a8f4e8', YOUSSEF: '#fff0a0' };

export function hud(c, t) {
  c.clearRect(0, 0, W, H);
  const v = SUBS.find(s => t >= s.t0 && t < s.t1); if (!v) return;
  const y = H - 100;
  c.save(); c.textBaseline = 'middle'; c.lineJoin = 'round';
  if (v.ar) {
    c.direction = 'rtl'; c.textAlign = 'center'; c.font = '800 62px "Baloo Bhaijaan 2"';
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.strokeStyle = '#1a0e1e'; c.lineWidth = 11; c.strokeText(v.text, W / 2, y + 4);
    c.shadowColor = 'transparent'; c.fillStyle = '#fff0a0'; c.fillText(v.text, W / 2, y + 4);
  } else {
    c.font = '600 58px "Barlow SC"';
    const tw = c.measureText(v.text).width;
    c.font = '700 26px "Barlow SC"'; const tagW = c.measureText(v.who).width + 34;
    const gap = 18, x = (W - tw - tagW - gap) / 2, col = COL[v.who];
    const tx = x, ty = y - 22;
    c.fillStyle = rgba('#140a1c', .8); c.beginPath(); c.roundRect(tx, ty, tagW, 44, 8); c.fill();
    c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = col; c.textAlign = 'left'; c.fillText(v.who, tx + 17, y + 1);
    c.font = '600 58px "Barlow SC"';
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.strokeStyle = '#140a1c'; c.lineWidth = 10; c.strokeText(v.text, x + tagW + gap, y);
    c.shadowColor = 'transparent'; c.fillStyle = col; c.fillText(v.text, x + tagW + gap, y);
  }
  c.restore();
}
