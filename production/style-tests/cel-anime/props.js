// Cel props: Youssef's red suitcase (his accent colour) and a red double-decker bus (generic, no marks).
import { cel, path, poly, line, TAU, mix, rgba } from './cel.js';
import { CASE, CHROME, DARK } from './pal.js';

// suitcase in figure units; origin = wheel contact point (back wheel), tilt in radians (0 = upright, positive leans the top toward +x)
// handle: extension of the telescopic handle (0..1). Returns the grip point (local, before tilt) via o.out
export function suitcase(g, o = {}) {
  const tilt = o.tilt || 0, ext = o.handle ?? 1, lw = 1.6, mr = o.mr || 1;
  g.save(); g.rotate(tilt);
  const W = 250, H = 380, x0 = -20, y0 = -H - 30;
  const hy = y0 - 40 - 230 * ext;
  // telescopic handle
  cel(g, poly([[x0 + 60, y0 + 10], [x0 + 74, y0 + 10], [x0 + 74, hy], [x0 + 60, hy]]), { f: CHROME.f, s: CHROME.s, so: [-4 * mr, 0], l: CHROME.l, lw });
  cel(g, poly([[x0 + 176, y0 + 10], [x0 + 190, y0 + 10], [x0 + 190, hy], [x0 + 176, hy]]), { f: CHROME.f, s: CHROME.s, so: [-4 * mr, 0], l: CHROME.l, lw });
  const grip = new Path2D(); grip.roundRect(x0 + 50, hy - 26, 150, 32, 14);
  cel(g, grip, { f: DARK.f, s: DARK.s, so: [0, -6], h: DARK.h, ho: [0, 3], l: DARK.l, lw });
  // body
  const B = new Path2D(); B.roundRect(x0, y0, W, H, 34);
  cel(g, B, { f: CASE.f, s: CASE.s, so: [-30 * mr, -14], h: CASE.h, ho: [10 * mr, 8], l: CASE.l, lw: lw * 1.2,
    clipFn: gg => {
      for (let k = 1; k < 5; k++) { const x = x0 + k * W / 5; gg.fillStyle = mix(CASE.f, CASE.s, .55); gg.fillRect(x - 5, y0 + 30, 10, H - 60); gg.fillStyle = CASE.h; gg.fillRect(x - 5 - 3 * mr, y0 + 30, 3, H - 60); }
      gg.fillStyle = mix(CASE.s, '#000', .2); gg.fillRect(x0, y0 + H * .5 - 6, W, 12);
    } });
  // corner guards
  for (const [cx, cy] of [[x0, y0], [x0 + W, y0], [x0, y0 + H], [x0 + W, y0 + H]]) { const c = new Path2D(); c.arc(cx + (cx === x0 ? 22 : -22), cy + (cy === y0 ? 22 : -22), 22, 0, TAU); cel(g, c, { f: DARK.f, l: DARK.l, lw }); }
  // wheels
  for (const wx of [x0 + 34, x0 + W - 34]) { const w = new Path2D(); w.arc(wx, -16, 18, 0, TAU); cel(g, w, { f: DARK.f, h: DARK.h, ho: [-3, -3], l: DARK.l, lw }); }
  // luggage tag (cream)
  cel(g, [[x0 + 120, y0 + 4], [x0 + 150, y0 + 40], [x0 + 140, y0 + 90], [x0 + 104, y0 + 84], [x0 + 110, y0 + 40]], { f: '#f4ead2', s: '#d2c6aa', so: [-4, -4], l: '#6a5a40', lw });
  g.restore();
  // grip point after rotation
  const gx = x0 + 125, gy = hy - 10, c = Math.cos(tilt), s = Math.sin(tilt);
  return [gx * c - gy * s, gx * s + gy * c];
}

// double-decker bus, side view facing left; origin = road contact under the front wheel, px units at scale k
export function bus(g, k = 1, wheelA = 0) {
  g.save(); g.scale(k, k);
  const L = 1060, H = 430, x0 = -60, y0 = -H - 26;
  const red = { f: '#d8221e', s: '#9c141a', h: '#ff6a52', l: '#4a080c' };
  const body = new Path2D(); body.roundRect(x0, y0, L, H, [46, 26, 10, 10]);
  cel(g, body, { f: red.f, s: red.s, so: [-40, -24], h: red.h, ho: [0, 8], l: red.l, lw: 2.4,
    clipFn: gg => {
      // window bands
      const win = (y, h) => {
        gg.fillStyle = '#25303e'; gg.fillRect(x0 + 30, y, L - 60, h);
        const gr = gg.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#a8cdec'); gr.addColorStop(.6, '#56789e'); gr.addColorStop(1, '#2a3a52');
        gg.fillStyle = gr; gg.fillRect(x0 + 34, y + 4, L - 68, h - 8);
        gg.fillStyle = rgba('#ffffff', .45); for (let x = x0 + 80; x < x0 + L; x += 260) { gg.beginPath(); gg.moveTo(x, y + 4); gg.lineTo(x + 60, y + 4); gg.lineTo(x + 20, y + h - 4); gg.lineTo(x - 40, y + h - 4); gg.fill(); }
        gg.fillStyle = red.f; for (let x = x0 + 30 + 150; x < x0 + L - 40; x += 150) gg.fillRect(x, y, 14, h);
      };
      win(y0 + 30, 110); win(y0 + 210, 110);
      gg.fillStyle = '#f2eee2'; gg.fillRect(x0, y0 + 160, L, 16);          // cream between-decks band
      gg.fillStyle = red.s; gg.fillRect(x0, y0 + H - 70, L, 8);
      // destination blind (generic word)
      gg.fillStyle = '#16161c'; gg.fillRect(x0 + 40, y0 + 176, 200, 30);
      gg.fillStyle = '#ffd23a'; gg.font = '700 22px "Barlow SC"'; gg.textAlign = 'left'; gg.textBaseline = 'middle'; gg.fillText('12  CITY', x0 + 54, y0 + 192);
      // entrance door (front)
      gg.fillStyle = '#2a3442'; gg.fillRect(x0 + 120, y0 + 210, 90, 196);
      gg.fillStyle = rgba('#a8cdec', .6); gg.fillRect(x0 + 128, y0 + 220, 32, 120); gg.fillRect(x0 + 168, y0 + 220, 32, 120);
    } });
  // wheels + arches
  for (const wx of [x0 + 150, x0 + L - 190]) {
    g.fillStyle = '#2a0a0c'; g.beginPath(); g.arc(wx, -26 - 30, 82, Math.PI, 0); g.fill();
    const w = new Path2D(); w.arc(wx, -56, 62, 0, TAU);
    cel(g, w, { f: '#22222a', s: '#121216', so: [-8, -8], l: '#060608', lw: 2 });
    const hub = new Path2D(); hub.arc(wx, -56, 28, 0, TAU); cel(g, hub, { f: '#b8bcc8', s: '#7c8090', so: [-4, -4], l: '#2c3040', lw: 1.6 });
    g.strokeStyle = '#4c505e'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const a = wheelA + i * TAU / 5; g.beginPath(); g.moveTo(wx + Math.cos(a) * 8, -56 + Math.sin(a) * 8); g.lineTo(wx + Math.cos(a) * 24, -56 + Math.sin(a) * 24); g.stroke(); }
  }
  // headlamp
  g.fillStyle = '#fff6d8'; g.beginPath(); g.ellipse(x0 + 8, y0 + H - 70, 8, 16, 0, 0, TAU); g.fill();
  g.restore();
}
