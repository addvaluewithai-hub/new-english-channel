// The ep02 school hallway, flattened: the same layout and colours as world.js hallStatic(), with every gradient, drop shadow,
// highlight and texture removed and the shapes simplified (2–3 flat tones per object, no grain, no cast light).
import { P, mix, dk } from './cast.js';
const SW = 1920, SH = 1080;
function camT(c, cam) { const Z = cam.z * (c.canvas.width / SW); c.setTransform(Z, 0, 0, Z, c.canvas.width / 2 - cam.x * Z, c.canvas.height / 2 - cam.y * Z); }
export const HALLCLOCK = { x: 1440, y: 400, r: 62 };
export function drawHallFlat(c, cam, o = {}) {
  camT(c, cam);
  const WALL = '#F3E6D0', WAIN = mix(P.navy, P.cream, .74), WOOD = '#D9A877', TRIM = '#FFFBF4';
  c.fillStyle = WALL; c.fillRect(-300, -300, 2800, 1100);
  c.fillStyle = WAIN; c.fillRect(-300, 654, 2800, 140);
  c.fillStyle = dk(WAIN, .08); for (let x = -300; x < 2500; x += 180) c.fillRect(x, 672, 5, 104);    // fewer, wider panels
  c.fillStyle = TRIM; c.fillRect(-300, 642, 2800, 14); c.fillRect(-300, 786, 2800, 14);
  c.fillStyle = WOOD; c.fillRect(-300, 800, 2800, 500);
  c.fillStyle = dk(WOOD, .07); for (const y of [860, 960, 1100]) c.fillRect(-300, y, 2800, 4);       // three plank lines, no perspective fan
  // doors: frame + teal leaf + one darker panel each, a knob
  for (const x of [50, 1930]) {
    const w = 230;
    c.fillStyle = TRIM; c.beginPath(); c.roundRect(x - 14, 286, w + 28, 516, 10); c.fill();
    c.fillStyle = P.teal; c.fillRect(x, 300, w, 498);
    c.fillStyle = dk(P.teal, .14); c.beginPath(); c.roundRect(x + 30, 330, w - 60, 160, 8); c.fill(); c.beginPath(); c.roundRect(x + 30, 530, w - 60, 220, 8); c.fill();
    c.fillStyle = P.mustard; c.beginPath(); c.arc(x + w - 30, 560, 9, 0, 7); c.fill();
  }
  // window: frame, flat sky, one flat tree mass, mullions; bench
  const wx = 400, wy = 220, ww = 330, wh = 380;
  c.fillStyle = TRIM; c.beginPath(); c.roundRect(wx - 14, wy - 14, ww + 28, wh + 28, 8); c.fill();
  c.fillStyle = mix(P.sky, P.cream, .25); c.fillRect(wx, wy, ww, wh);
  c.fillStyle = mix(P.leaf, P.cream, .3); c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx, wy + 270); c.bezierCurveTo(wx + 80, wy + 200, wx + 200, wy + 240, wx + ww, wy + 230); c.lineTo(wx + ww, wy + wh); c.fill();
  c.fillStyle = TRIM; c.fillRect(wx + ww / 2 - 6, wy, 12, wh); c.fillRect(wx, wy + wh * .45 - 5, ww, 10);
  c.fillRect(wx - 30, wy + wh + 14, ww + 60, 16);
  // notice board: navy frame, cork, 5 plain papers (no text lines, no shadows)
  const nx = 1000, ny = 380, nw = 300, nh = 215;
  c.fillStyle = P.navy; c.beginPath(); c.roundRect(nx - 10, ny - 10, nw + 20, nh + 20, 10); c.fill();
  c.fillStyle = '#D9B384'; c.fillRect(nx, ny, nw, nh);
  for (const [px, py, pw, ph, col] of [[nx + 20, ny + 20, 90, 74, mix(P.red, P.cream, .55)], [nx + 130, ny + 16, 72, 92, mix(P.teal, P.cream, .55)], [nx + 220, ny + 26, 62, 64, mix(P.mustard, P.cream, .45)], [nx + 28, ny + 112, 82, 82, mix(P.leaf, P.cream, .55)], [nx + 128, ny + 122, 104, 72, TRIM]]) {
    c.fillStyle = col; c.fillRect(px, py, pw, ph);
  }
  // wall clock (face + hands, no drop shadow)
  const { x: cx, y: cy, r } = HALLCLOCK, hrs = o.clock ?? 8.25;
  c.fillStyle = P.navy; c.beginPath(); c.arc(cx, cy, r + 8, 0, 7); c.fill(); c.fillStyle = TRIM; c.beginPath(); c.arc(cx, cy, r - 2, 0, 7); c.fill();
  c.fillStyle = P.ink; for (let i = 0; i < 12; i += 3) { const a = i / 12 * Math.PI * 2; c.save(); c.translate(cx + Math.sin(a) * (r - 14), cy - Math.cos(a) * (r - 14)); c.rotate(a); c.fillRect(-3, -7, 6, 14); c.restore(); }
  c.strokeStyle = P.ink; c.lineCap = 'round';
  const ha = (hrs % 12) / 12 * Math.PI * 2, ma = (hrs % 1) * Math.PI * 2;
  c.lineWidth = 8; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(ha) * r * .42, cy - Math.cos(ha) * r * .42); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.sin(ma) * r * .64, cy - Math.cos(ma) * r * .64); c.stroke();
  // poster: frame + a simple skyline in two tones
  c.fillStyle = P.navy; c.beginPath(); c.roundRect(1668, 392, 200, 150, 8); c.fill(); c.fillStyle = mix(P.sky, P.cream, .35); c.fillRect(1682, 406, 172, 122);
  c.fillStyle = mix(P.red, P.cream, .4); c.beginPath(); c.arc(1720, 440, 20, 0, 7); c.fill();
  c.fillStyle = mix(P.navy, P.sky, .45); for (const [bx, bw, bh] of [[0, 30, 44], [30, 22, 76], [52, 44, 34], [96, 14, 96], [110, 42, 54], [152, 20, 40]]) c.fillRect(1682 + bx, 528 - bh, bw, bh);
  // planter by the right door (as ep02's planter: a ball on a stem in a teal pot), flat: one leaf tone + one shade crescent
  const px = 1880, pb = 884;
  c.fillStyle = '#6E5149'; c.fillRect(px - 4, pb - 90, 8, 50);
  c.fillStyle = P.leaf; c.beginPath(); c.arc(px, pb - 120, 50, 0, 7); c.fill();
  c.fillStyle = dk(P.leaf, .14); c.beginPath(); c.arc(px, pb - 120, 50, -.6, 2.2); c.arc(px - 12, pb - 128, 44, 2.2, -.6, true); c.fill();
  c.fillStyle = P.teal; c.beginPath(); c.roundRect(px - 38, pb - 52, 76, 52, 6); c.fill(); c.fillStyle = dk(P.teal, .12); c.fillRect(px - 42, pb - 56, 84, 10);
  c.fillStyle = P.navy; c.beginPath(); c.roundRect(330, 380, 40, 120, 6); c.fill();
  c.setTransform(1, 0, 0, 1, 0, 0);
}
