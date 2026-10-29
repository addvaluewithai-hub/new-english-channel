// Bean People v2 — shared kit: palette tokens, colour maths, the "form" pass (crescent shade + rim light).
import { mulberry } from '/core/lib.js';

// ---- 8 palette tokens (everything else is derived from these) ----
export const P = {
  ink:     '#2A2742',   // pupils, mouths, brows, text, outlines-free darks
  cream:   '#FFF6E8',   // sclera, bubbles, stucco, window frames
  sky:     '#9BD3EC',   // daylight sky, glass, atmospheric haze
  red:     '#E8483A',   // suitcase, bus, phone box, Mia's shoes
  navy:    '#2E3D7C',   // Youssef's jacket, school sign, lamp posts
  mustard: '#F5B63E',   // Mia's cardigan, sun, trims, highlight word
  teal:    '#1E9D93',   // Mia's skirt + hair tie, school door, planters
  leaf:    '#69B464',   // trees, window boxes
};
// character materials (skin / hair) — kept outside the 8 environment tokens
export const SKIN = { youssef: '#B9773F', mia: '#F9CDAA' };
export const HAIR = { youssef: '#24203A', mia: '#CB5530' };
export const SHADE = '#6F62A8';     // cool violet, multiplied: warm light / cool shadow
export const HAZE = '#CFE8F2';      // atmospheric fade target

// ---- colour helpers ----
const hx = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const toHex = a => '#' + a.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const rgba = (a, al) => { const A = hx(a); return `rgba(${A[0]},${A[1]},${A[2]},${al})`; };
export const dark = (a, t = .2) => mix(a, '#2A2142', t);
export const light = (a, t = .2) => mix(a, '#FFFBF2', t);

// ---- layer pool (offscreen canvases reused every frame) ----
const pool = [];
export function layer(i, w, h) {
  let cv = pool[i];
  if (!cv) { cv = pool[i] = document.createElement('canvas'); cv.width = 16; cv.height = 16; }
  if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, Math.ceil(w)); cv.height = Math.max(cv.height, Math.ceil(h)); }
  return cv;
}

// formed(): draw flat shapes into a layer, then add ONE soft crescent shade (away from the light, upper-left)
// and a thin rim light on the lit side, both computed from the layer's own silhouette. Consistent for every object.
// o: { sx, sy: shade shift (px, toward lower-right), soft (px), shadeA, hx, hy, hiA, occl (bottom occlusion 0..1) }
export function formed(ctx, box, draw, o) {
  // the layer is rendered at screen resolution whatever ctx's current transform is (crisp when the camera zooms)
  const m = ctx.getTransform(), sc = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
  const cs = [[box.x, box.y], [box.x + box.w, box.y], [box.x, box.y + box.h], [box.x + box.w, box.y + box.h]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const CW = ctx.canvas.width, CH = ctx.canvas.height, pad = 64;
  const x0 = Math.floor(Math.max(-pad, Math.min(...cs.map(q => q[0])))), y0 = Math.floor(Math.max(-pad, Math.min(...cs.map(q => q[1]))));
  const x1 = Math.ceil(Math.min(CW + pad, Math.max(...cs.map(q => q[0])))), y1 = Math.ceil(Math.min(CH + pad, Math.max(...cs.map(q => q[1]))));
  const w = x1 - x0 + 2, h = y1 - y0 + 2;
  if (w < 4 || h < 4) return;
  const Y = y => m.d * y + m.f - y0;   // local y → layer y (no rotation in practice)
  o = { ...o, sx: o.sx * sc, sy: o.sy * sc, soft: o.soft * sc, hx: (o.hx || 0) * sc, hy: (o.hy || 0) * sc };
  const L = layer(0, w, h), T = layer(1, w, h), l = L.getContext('2d'), t = T.getContext('2d');
  l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1; l.clearRect(0, 0, w, h);
  l.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0); draw(l); l.setTransform(1, 0, 0, 1, 0, 0);
  const pass = (fill, dx, dy, blur, alpha, op) => {
    t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.globalAlpha = 1; t.filter = 'none';
    t.clearRect(0, 0, w, h); t.fillStyle = fill; t.fillRect(0, 0, w, h);
    if (dx || dy) { t.globalCompositeOperation = 'destination-out'; if (blur > .3) t.filter = `blur(${blur.toFixed(2)}px)`; t.drawImage(L, 0, 0, w, h, dx, dy, w, h); t.filter = 'none'; }
    t.globalCompositeOperation = 'destination-in'; t.drawImage(L, 0, 0, w, h, 0, 0, w, h);
    l.globalCompositeOperation = op; l.globalAlpha = alpha; l.drawImage(T, 0, 0, w, h, 0, 0, w, h);
    l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1;
  };
  // crescent: silhouette minus itself shifted toward the light
  pass(o.shade || SHADE, -o.sx, -o.sy, o.soft, o.shadeA ?? .5, 'multiply');
  // bottom occlusion (soft vertical gradient)
  if (o.occl) {
    const g = t.createLinearGradient(0, Y(o.oy0), 0, Y(o.oy1)); g.addColorStop(0, rgba(o.shade || SHADE, 0)); g.addColorStop(1, rgba(o.shade || SHADE, 1));
    pass(g, 0, 0, 0, o.occl, 'multiply');
  }
  // rim light: silhouette minus itself shifted away from the light, faded toward the bottom
  if (o.hiA) {
    const g = t.createLinearGradient(0, o.hy0 != null ? Y(o.hy0) : 0, 0, o.hy1 != null ? Y(o.hy1) : h); g.addColorStop(0, '#FFFBF0'); g.addColorStop(1, 'rgba(255,251,240,0)');
    pass(g, o.hx, o.hy, o.soft * .5, o.hiA, 'screen');
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(L, 0, 0, w, h, x0, y0, w, h); ctx.restore();
}

// ---- shapes ----
export function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.roundRect(x, y, w, h, r); }
export function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); }
export function poly(c, pts, close = true) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); if (close) c.closePath(); }
// smooth closed curve through points (Catmull-Rom → Bézier)
export function smooth(c, pts, close = true) {
  const n = pts.length; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  const g = i => close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (close) c.closePath();
}
// soft contact shadow (cool, light from upper-left → offset to the right)
export function contact(c, x, y, rx, ry, a = .28) {
  c.save(); c.translate(x, y); c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba('#3B3170', a)); g.addColorStop(.55, rgba('#3B3170', a * .75)); g.addColorStop(1, rgba('#3B3170', 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill(); c.restore();
}

// ---- paper grain (static, seeded, very subtle) ----
let grainCv = null;
export function grain(c, W, H, a = .045) {
  if (!grainCv) {
    grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 256;
    const g = grainCv.getContext('2d'), im = g.createImageData(256, 256), r = mulberry(7);
    for (let i = 0; i < im.data.length; i += 4) { const v = 110 + r() * 145; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0);
  }
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(grainCv, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
}
