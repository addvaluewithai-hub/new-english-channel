// Bean People: palette + the bean character renderer (pure function of a pose).
export const PAL = {
  ink: '#1E2235', cream: '#FAF3E6', sky: '#BFE0E6', teal: '#2B9488',
  mustard: '#F0B53F', tomato: '#E2523F', navy: '#2C3E70',
};
const TAU = Math.PI * 2;
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const cache = new Map();
export function mix(a, b, k) {
  a = PAL[a] || a; b = PAL[b] || b;
  const key = a + b + k;
  if (cache.has(key)) return cache.get(key);
  const A = hex(a), B = hex(b);
  const r = '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
  cache.set(key, r); return r;
}
export const tint = (c, k) => mix(c, 'cream', k);
export const shade = (c, k = 0.25) => mix(c, 'ink', k);
export const INKA = a => `rgba(30,34,53,${a})`;
export const CREAMA = a => `rgba(250,243,230,${a})`;

export const YOUSSEF = {
  id: 'y', W: 150, H: 250, body: '#A8653F', hair: '#1E2235', beard: '#33231F', brow: '#1E2235',
  sleeve: PAL.navy, shoe: PAL.ink, mouthY: 0.578,
};
export const MIA = {
  id: 'm', W: 134, H: 224, body: '#F4BC98', hair: '#B5492A', brow: '#7A2E1C',
  sleeve: PAL.mustard, shoe: shade('teal', 0.15), mouthY: 0.585,
};

export function beanPath(c, w, h) {
  const r = w / 2, rb = w * 0.36, k = 0.5523, bul = w * 0.03, mid = (h - r - rb) * 0.35;
  c.beginPath();
  c.moveTo(-r, -h + r);
  c.bezierCurveTo(-r, -h + r - r * k, -r * k, -h, 0, -h);
  c.bezierCurveTo(r * k, -h, r, -h + r - r * k, r, -h + r);
  c.bezierCurveTo(r + bul, -h + r + mid, r + bul, -rb - mid, r, -rb);
  c.bezierCurveTo(r, -rb + rb * k, r - rb + rb * k, 0, r - rb, 0);
  c.lineTo(-r + rb, 0);
  c.bezierCurveTo(-r + rb - rb * k, 0, -r, -rb + rb * k, -r, -rb);
  c.bezierCurveTo(-r - bul, -rb - mid, -r - bul, -h + r + mid, -r, -h + r);
  c.closePath();
}
const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };

// geometry shared by drawBean and localToWorld
function dims(ch, p) {
  const s = (p.s || 1);
  return { Wb: ch.W / Math.sqrt(s), Hb: ch.H * s, fy: ch.W * 0.07 };
}
// local (u,v) in body units -> world point (for hands holding props)
export function localToWorld(ch, p, u, v) {
  const { Wb, Hb, fy } = dims(ch, p), sc = p.sc || 1, r = p.rot || 0;
  const lx = u * Wb, ly = v * Hb - fy * 0.6;
  return [p.x + sc * (lx * Math.cos(r) - ly * Math.sin(r)), p.gy - (p.lift || 0) + sc * (lx * Math.sin(r) + ly * Math.cos(r))];
}

export function drawBean(c, ch, p) {
  const { Wb, Hb, fy } = dims(ch, p);
  const sc = p.sc || 1, f = p.f || 0, lift = p.lift || 0;
  const fx = f * Wb * 0.22;
  const back = f < -0.05 ? 1 : f > 0.05 ? -1 : 1;
  c.save();
  c.translate(p.x, p.gy);
  // contact shadow
  const sh = 1 / (1 + lift / 90);
  c.fillStyle = INKA(0.16 * (p.alpha ?? 1));
  ell(c, 0, 0, ch.W * 0.6 * sh * sc, ch.W * 0.1 * sh * sc); c.fill();
  c.translate(0, -lift); c.scale(sc, sc); c.rotate(p.rot || 0);
  // shoes
  const wa = p.walkAmt || 0, ph = p.walk || 0;
  for (const i of [0, 1]) {
    const phi = ph + i * Math.PI;
    const dx = (i ? 1 : -1) * Wb * 0.19 + f * Wb * 0.07 + Math.sin(phi) * Wb * 0.17 * wa * (f >= 0 ? 1 : -1);
    const up = Math.max(0, Math.cos(phi)) * fy * 1.1 * wa;
    c.fillStyle = i ? ch.shoe : shade(ch.shoe, 0.0);
    ell(c, dx + f * Wb * 0.03, -fy * 0.55 - up, Wb * 0.15, fy * 0.72); c.fill();
  }
  c.translate(0, -fy * 0.6);

  // ponytail (behind body)
  if (ch.id === 'm') {
    const ax = back * Wb * 0.36, ay = -Hb * 0.86, L = Hb * 0.42;
    c.save(); c.translate(ax, ay); c.rotate(-back * 0.62 + (p.tail || 0));
    c.fillStyle = ch.hair; c.beginPath();
    c.moveTo(-Wb * 0.09, 0);
    c.bezierCurveTo(-Wb * 0.24, L * 0.25, -Wb * 0.2, L * 0.82, 0, L);
    c.bezierCurveTo(Wb * 0.1, L * 0.86, Wb * 0.2, L * 0.3, Wb * 0.09, 0);
    c.closePath(); c.fill();
    c.fillStyle = INKA(0.12); c.beginPath();
    c.moveTo(Wb * 0.02, L * 0.1); c.bezierCurveTo(Wb * 0.16, L * 0.35, Wb * 0.08, L * 0.8, 0, L);
    c.bezierCurveTo(Wb * 0.12, L * 0.85, Wb * 0.2, L * 0.3, Wb * 0.09, 0); c.closePath(); c.fill();
    c.restore();
  }
  // Youssef's quiff (merges with the hair cap)
  if (ch.id === 'y') {
    c.fillStyle = ch.hair;
    c.beginPath();
    const qx = fx * 0.7 + Wb * 0.06;
    c.moveTo(qx - Wb * 0.3, -Hb * 0.93);
    c.bezierCurveTo(qx - Wb * 0.26, -Hb * 1.055, qx + Wb * 0.1, -Hb * 1.075, qx + Wb * 0.27, -Hb * 0.985);
    c.bezierCurveTo(qx + Wb * 0.16, -Hb * 0.99, qx + Wb * 0.08, -Hb * 0.96, qx + Wb * 0.02, -Hb * 0.92);
    c.closePath(); c.fill();
  }

  // sleeves sit behind the body; only the hand nubs come in front
  const hands = p.hands || [];
  const HP = [0, 1].map(i => { const s = i ? 1 : -1, h = hands[i] || [s * 0.56, -0.25]; return [h[0] * Wb, h[1] * Hb]; });
  for (const i of [0, 1]) {
    const s = i ? 1 : -1, sxw = s * Wb * 0.36, syw = -Hb * 0.4, [hx, hy] = HP[i];
    c.strokeStyle = ch.sleeve; c.lineWidth = Wb * 0.12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sxw, syw); c.lineTo(sxw + (hx - sxw) * 0.82, syw + (hy - syw) * 0.82); c.stroke();
  }
  // ---- body (clipped layers) ----
  beanPath(c, Wb, Hb);
  c.fillStyle = ch.body; c.fill();
  c.save(); c.clip();
  const sx = fx * 0.6;
  if (ch.id === 'y') {
    // jacket band + white T-shirt + lapels
    c.fillStyle = PAL.navy; c.fillRect(-Wb, -Hb * 0.37, Wb * 2, Hb * 0.5);
    c.fillStyle = PAL.cream; c.beginPath();
    c.moveTo(sx - Wb * 0.1, -Hb * 0.375); c.lineTo(sx + Wb * 0.1, -Hb * 0.375);
    c.lineTo(sx + Wb * 0.075, 10); c.lineTo(sx - Wb * 0.075, 10); c.closePath(); c.fill();
    c.fillStyle = shade('navy', 0.32);
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(sx + s * Wb * 0.2, -Hb * 0.39); c.lineTo(sx + s * Wb * 0.085, -Hb * 0.39);
      c.lineTo(sx + s * Wb * 0.1, -Hb * 0.22); c.closePath(); c.fill();
    }
    // blush sits under the beard
    if (p.blush > 0) {
      c.fillStyle = `rgba(226,82,63,${0.55 * p.blush})`;
      for (const s of [-1, 1]) { ell(c, fx + s * Wb * 0.27, -Hb * 0.655, Wb * 0.09, Hb * 0.03); c.fill(); }
    }
    // hair cap with sideburns
    c.fillStyle = ch.hair; c.beginPath();
    c.moveTo(-Wb, -Hb * 1.3); c.lineTo(Wb, -Hb * 1.3); c.lineTo(Wb, -Hb * 0.73);
    c.lineTo(fx + Wb * 0.4, -Hb * 0.73); c.lineTo(fx + Wb * 0.4, -Hb * 0.63); c.lineTo(fx + Wb * 0.34, -Hb * 0.63);
    c.lineTo(fx + Wb * 0.34, -Hb * 0.785);
    c.bezierCurveTo(fx + Wb * 0.2, -Hb * 0.855, fx - Wb * 0.12, -Hb * 0.855, fx - Wb * 0.34, -Hb * 0.79);
    c.lineTo(fx - Wb * 0.34, -Hb * 0.63); c.lineTo(fx - Wb * 0.4, -Hb * 0.63); c.lineTo(fx - Wb * 0.4, -Hb * 0.73);
    c.lineTo(-Wb, -Hb * 0.73); c.closePath(); c.fill();
    // beard: full short beard with a skin U around the mouth
    const by0 = -Hb * 0.64, yc = -Hb * 0.6, rx = Wb * 0.4, ryo = Hb * 0.1, ri = Wb * 0.255, yc2 = -Hb * 0.6, ryi = Hb * 0.068;
    c.fillStyle = ch.beard; c.beginPath();
    c.moveTo(fx - rx, by0); c.lineTo(fx - rx, yc);
    c.ellipse(fx, yc, rx, ryo, 0, Math.PI, 0, true);
    c.lineTo(fx + rx, by0); c.lineTo(fx + ri, by0); c.lineTo(fx + ri, yc2);
    c.ellipse(fx, yc2, ri, ryi, 0, 0, Math.PI, false);
    c.lineTo(fx - ri, by0); c.closePath(); c.fill();
    // moustache
    c.strokeStyle = ch.beard; c.lineCap = 'round'; c.lineWidth = Hb * 0.022;
    c.beginPath(); c.moveTo(fx - Wb * 0.09, -Hb * 0.622); c.quadraticCurveTo(fx, -Hb * 0.638, fx + Wb * 0.09, -Hb * 0.622); c.stroke();
  } else {
    // cardigan + teal hem + blouse V + buttons
    c.fillStyle = PAL.mustard; c.fillRect(-Wb, -Hb * 0.4, Wb * 2, Hb * 0.5);
    c.fillStyle = PAL.teal; c.fillRect(-Wb, -Hb * 0.14, Wb * 2, Hb * 0.3);
    c.fillStyle = tint('teal', 0.35); c.fillRect(-Wb, -Hb * 0.14, Wb * 2, Hb * 0.022);
    c.fillStyle = PAL.cream; c.beginPath();
    c.moveTo(sx - Wb * 0.11, -Hb * 0.405); c.lineTo(sx + Wb * 0.11, -Hb * 0.405); c.lineTo(sx, -Hb * 0.285); c.closePath(); c.fill();
    c.strokeStyle = shade('mustard', 0.22); c.lineWidth = 3;
    c.beginPath(); c.moveTo(sx, -Hb * 0.285); c.lineTo(sx, -Hb * 0.14); c.stroke();
    c.fillStyle = PAL.cream;
    for (const v of [0.245, 0.19]) { ell(c, sx + Wb * 0.035, -Hb * v, Wb * 0.018, Wb * 0.018); c.fill(); }
    // cheeks
    c.fillStyle = `rgba(226,82,63,${0.28 + 0.4 * (p.blush || 0)})`;
    for (const s of [-1, 1]) { ell(c, fx + s * Wb * 0.25, -Hb * 0.625, Wb * 0.075, Hb * 0.028); c.fill(); }
    // hair cap with side-swept fringe
    c.fillStyle = ch.hair; c.beginPath();
    c.moveTo(-Wb, -Hb * 1.3); c.lineTo(Wb, -Hb * 1.3); c.lineTo(Wb, -Hb * 0.6);
    c.lineTo(fx + Wb * 0.38, -Hb * 0.6);
    c.bezierCurveTo(fx + Wb * 0.37, -Hb * 0.72, fx + Wb * 0.3, -Hb * 0.86, fx + Wb * 0.1, -Hb * 0.865);
    c.bezierCurveTo(fx - Wb * 0.08, -Hb * 0.86, fx - Wb * 0.24, -Hb * 0.82, fx - Wb * 0.36, -Hb * 0.74);
    c.lineTo(fx - Wb * 0.39, -Hb * 0.6); c.lineTo(-Wb, -Hb * 0.6); c.closePath(); c.fill();
  }
  // one flat shade crescent (light from upper left) + hair gloss
  c.fillStyle = INKA(0.13); c.beginPath();
  c.rect(-Wb, -Hb * 1.3, Wb * 2, Hb * 1.4);
  c.ellipse(-Wb * 0.13, -Hb * 0.56, Wb * 0.6, Hb * 0.6, 0, 0, TAU); c.fill('evenodd');
  c.fillStyle = CREAMA(0.2);
  ell(c, -Wb * 0.2 + fx * 0.3, -Hb * 0.9, Wb * 0.13, Hb * 0.028, -0.45); c.fill();
  c.restore();

  // ---- face ----
  const ex = Wb * 0.155 * (1 - 0.22 * Math.abs(f)), lx = p.lx || 0, ly = p.ly || 0;
  const ey = -Hb * 0.705 + ly * Hb * 0.02, er = Wb * 0.048;
  const blink = p.blink || 0, happy = p.happy || 0;
  for (const s of [-1, 1]) {
    const x = fx + s * ex + lx * Wb * 0.035;
    if (happy > 0.5) {
      c.strokeStyle = PAL.ink; c.lineWidth = er * 0.7; c.lineCap = 'round';
      c.beginPath(); c.arc(x, ey + er * 0.6, er * 1.05, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    } else {
      const ry = er * 1.3 * Math.max(0.12, 1 - blink) * (1 - happy * 1.4) * (p.wide || 1);
      c.fillStyle = PAL.ink; ell(c, x, ey, er * (p.wide || 1), Math.max(er * 0.16, ry)); c.fill();
      if (ry > er * 0.7) { c.fillStyle = PAL.cream; ell(c, x - er * 0.3, ey - ry * 0.4, er * 0.3, er * 0.3); c.fill(); }
    }
  }
  // brows
  c.strokeStyle = ch.brow; c.lineCap = 'round'; c.lineWidth = Wb * (ch.id === 'y' ? 0.045 : 0.034);
  const bw = Wb * 0.065, worry = p.worry || 0, arch = p.arch || 0;
  for (const s of [-1, 1]) {
    const bx = fx + s * ex + lx * Wb * 0.02;
    const by = ey - Hb * 0.078 - (p.brow || 0) * Hb * 0.028 - (Math.sign(arch) === s ? Math.abs(arch) * Hb * 0.03 : 0);
    const inner = by - worry * Hb * 0.028, outer = by + worry * Hb * 0.008;
    c.beginPath();
    if (s < 0) { c.moveTo(bx - bw, outer); c.quadraticCurveTo(bx, Math.min(outer, inner) - Hb * 0.012, bx + bw, inner); }
    else { c.moveTo(bx - bw, inner); c.quadraticCurveTo(bx, Math.min(outer, inner) - Hb * 0.012, bx + bw, outer); }
    c.stroke();
  }
  // mouth
  const open = p.open || 0, smile = p.smile || 0, wob = p.wob || 0, round = p.round || 0;
  const mx = fx + lx * Wb * 0.012, my = -Hb * ch.mouthY;
  const mw = Wb * 0.085 * (1 + 0.15 * open + 0.2 * Math.max(0, smile)) * (1 - 0.45 * round);
  if (open > 0.05 || round > 0.05) {
    const oh = Hb * 0.075 * Math.max(open, round * 0.45);
    c.save(); c.beginPath();
    c.moveTo(mx - mw, my - smile * Hb * 0.008);
    c.quadraticCurveTo(mx, my + smile * Hb * 0.012 - round * oh * 0.8, mx + mw, my - smile * Hb * 0.008);
    c.bezierCurveTo(mx + mw * 0.95, my + oh * (1.3 + smile * 0.3), mx - mw * 0.95, my + oh * (1.3 + smile * 0.3), mx - mw, my - smile * Hb * 0.008);
    c.closePath(); c.fillStyle = '#4A1F2A'; c.fill(); c.clip();
    c.fillStyle = tint('tomato', 0.15); ell(c, mx, my + oh * 1.15, mw * 0.62, oh * 0.5); c.fill();
    c.restore();
  } else {
    c.strokeStyle = ch.id === 'y' ? '#3A1C18' : PAL.ink; c.lineWidth = Wb * 0.03; c.lineCap = 'round';
    c.beginPath();
    if (wob > 0) {
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const u = i / n, x = mx - mw + 2 * mw * u;
        const y = my + Math.sin(u * Math.PI * 3 + (p.t || 0) * 9) * Hb * 0.009 * wob - smile * Hb * 0.01 * Math.sin(u * Math.PI);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
    } else {
      c.moveTo(mx - mw, my - smile * Hb * 0.01);
      c.quadraticCurveTo(mx, my + smile * Hb * 0.035, mx + mw, my - smile * Hb * 0.01);
    }
    c.stroke();
  }
  // embarrassment hatch
  if (p.hatch > 0) {
    c.strokeStyle = `rgba(226,82,63,${p.hatch})`; c.lineWidth = Wb * 0.018; c.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const hx = fx + s * Wb * 0.28 + (i - 1) * Wb * 0.045, hy = -Hb * 0.672;
      c.beginPath(); c.moveTo(hx - Wb * 0.018, hy + Hb * 0.018); c.lineTo(hx + Wb * 0.018, hy - Hb * 0.018); c.stroke();
    }
  }
  // arms: stubby sleeve + hand nub
  for (const i of [0, 1]) {
    const [hx, hy] = HP[i];
    c.fillStyle = ch.body; ell(c, hx, hy, Wb * 0.072, Wb * 0.072); c.fill();
    c.fillStyle = INKA(0.12); c.beginPath(); c.arc(hx, hy, Wb * 0.072, -0.2, Math.PI * 0.8); c.fill();
  }
  // Mia's teal bow
  if (ch.id === 'm') {
    const ax = back * Wb * 0.38, ay = -Hb * 0.86;
    c.save(); c.translate(ax, ay); c.rotate(-back * 0.5 + (p.tail || 0) * 0.3);
    c.fillStyle = PAL.teal;
    for (const s of [-1, 1]) {
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * Wb * 0.2, -Wb * 0.14, s * Wb * 0.17, Wb * 0.05); c.closePath(); c.fill();
    }
    c.fillStyle = shade('teal', 0.25); ell(c, 0, 0, Wb * 0.045, Wb * 0.045); c.fill();
    c.restore();
  }
  // sweat drop
  if (p.sweat > 0 && p.sweat < 1) {
    const u = p.sweat, a = Math.min(1, u * 6, (1 - u) * 5);
    const dx = fx + Wb * 0.37, dy = -Hb * (0.9 - 0.12 * u), r = Wb * 0.055;
    c.globalAlpha = a;
    c.fillStyle = mix('sky', 'teal', 0.3); c.beginPath();
    c.moveTo(dx, dy - r * 2.2); c.bezierCurveTo(dx + r * 0.6, dy - r, dx + r * 1.1, dy - r * 0.2, dx + r, dy + r * 0.3);
    c.arc(dx, dy + r * 0.3, r, 0, Math.PI); c.bezierCurveTo(dx - r * 1.1, dy - r * 0.2, dx - r * 0.6, dy - r, dx, dy - r * 2.2); c.fill();
    c.fillStyle = PAL.cream; ell(c, dx - r * 0.35, dy + r * 0.1, r * 0.22, r * 0.35); c.fill();
    c.globalAlpha = 1;
  }
  c.restore();
}

// the red suitcase; pivot = bottom centre (wheel line), `ang` tilts the top toward +x
export function drawSuitcase(c, x, gy, ang, rod) {
  const w = 76, h = 98;
  c.save();
  c.fillStyle = INKA(0.15); ell(c, x + Math.sin(ang) * h * 0.25, gy, 50, 9); c.fill();
  c.translate(x, gy - 9); c.rotate(ang);
  if (rod > 2) {
    c.strokeStyle = shade('navy', 0.1); c.lineWidth = 6; c.lineCap = 'round';
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 12, -h + 4); c.lineTo(s * 12, -h - rod); c.stroke(); }
    c.lineWidth = 10; c.strokeStyle = PAL.ink; c.beginPath(); c.moveTo(-16, -h - rod); c.lineTo(16, -h - rod); c.stroke();
  } else {
    c.strokeStyle = PAL.ink; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-14, -h + 2); c.lineTo(-14, -h - 9); c.lineTo(14, -h - 9); c.lineTo(14, -h + 2); c.stroke();
  }
  c.fillStyle = PAL.tomato; c.beginPath(); c.roundRect(-w / 2, -h, w, h, 14); c.fill();
  c.fillStyle = shade('tomato', 0.2);
  for (const s of [-1, 1]) c.fillRect(s * 20 - 5, -h, 10, h);
  c.fillStyle = INKA(0.12); c.beginPath(); c.roundRect(w / 2 - 16, -h, 16, h, [0, 14, 14, 0]); c.fill();
  c.fillStyle = CREAMA(0.35); c.beginPath(); c.roundRect(-w / 2 + 7, -h + 8, 7, h * 0.45, 4); c.fill();
  // luggage tag
  c.fillStyle = PAL.mustard; c.beginPath(); c.roundRect(-w / 2 - 4, -h + 26, 16, 22, 4); c.fill();
  c.fillStyle = PAL.ink;
  for (const s of [-1, 1]) { ell(c, s * 26, 2, 9, 9); c.fill(); }
  c.restore();
}
