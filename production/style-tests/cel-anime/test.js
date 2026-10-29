import { W, H, LWK } from './cel.js';
import { YOUSSEF, MIA } from './pal.js';
import { head } from './head.js';
import { figure, walkPose } from './body.js';
export function test(g, e, t, name) {
  g.fillStyle = '#cfd6e0'; g.fillRect(0, 0, W, H);
  if (name === 'model') {
    const ex = [['y', 'neutral'], ['y', 'excited'], ['y', 'nervous'], ['y', 'shock'], ['m', 'smile'], ['m', 'smileopen'], ['m', 'puzzled'], ['m', 'talk']];
    ex.forEach(([w, x], i) => { g.save(); g.translate(150 + (i % 4) * 260, 170 + Math.floor(i / 4) * 330); g.scale(1.05, 1.05); head(g, w === 'y' ? YOUSSEF : MIA, { who: w, expr: x, sweat: x === 'shock' ? .5 : null, sweatSize: 1.6 }); g.restore(); });
    const wp = walkPose(t % 1);
    g.save(); g.translate(1230, 1060); g.scale(.68, .68); figure(g, { who: 'y', P: YOUSSEF, legs: { n: [0.04, .05], f: [-.04, .05] }, arms: { n: [-.12, .15, 'rest'], f: [.1, .2, 'rest'] }, headO: { expr: 'smile' } }); g.restore();
    g.save(); g.translate(1480, 1060); g.scale(.68, .68); figure(g, { who: 'y', P: YOUSSEF, mirror: true, ...wp, arms: { n: [-wp.armSwing, .3, 'fist'], f: [wp.armSwing, .3, 'fist'] }, headO: { expr: 'excited' } }); g.restore();
    g.save(); g.translate(1740, 1060); g.scale(.65, .65); figure(g, { who: 'm', P: MIA, legs: { n: [0.03, .02], f: [-.05, .04] }, arms: { n: [-.1, .2, 'rest'], f: [2.3, .8, 'open'] }, headO: { expr: 'smileopen' } }); g.restore();
  }
  if (name === 'close') {
    LWK.k = .7;
    g.save(); g.translate(500, 480); g.scale(3.6, 3.6); head(g, YOUSSEF, { who: 'y', expr: 'shock', sweat: .4, sweatSize: 1.5 }); g.restore();
    g.save(); g.translate(1460, 480); g.scale(3.6, 3.6); head(g, MIA, { who: 'm', expr: 'puzzled' }); g.restore();
    LWK.k = 1;
  }
}
