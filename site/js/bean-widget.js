// Bean widget — draws one of the show's beans (the same bean.js as the episodes) on a <canvas> at any size,
// with the episodes' idle (breathing, seeded blinks, eye darts) and a few reactions.
//
//   const b = mountBean(canvas, { who: 'mia', expr: 'happy' });
//   b.set('embarrassed');        // mood (blends over ~.25 s)
//   b.react('happy');            // happy bounce | embarrassed | clap | yawn | wave | oops | think
//   b.talk(1.4);                 // mouth moves for 1.4 s (while a clip plays)
//   b.stop(); b.start();
import { CAST, drawChar, EXPR, ARM, pose } from './engine/bean.js';
import { fold, liveFace, CUP, CLAP } from './engine/act.js';
import { clamp } from './engine/lib.js';

const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = EXPR.neutral;
const YAWN = { ...N, eye: .04, bLy: .3, bRy: .3, bLr: .5, bRr: .5, mw: .085, mo: .1, ms: -.05, mt: 0, blush: .4 };
const TIRED = { ...N, lid: .45, bLy: .1, bRy: .1, ms: .2, blush: .35 };
const APART = { dx: -.04, dy: -.1, bend: -.1, w: 0 };
const UP = ARM.up, REST = ARM.rest;

// reactions: keyed tracks (seconds relative to the start); `lift` is in units of H
function reaction(name, H, who) {
  switch (name) {
    case 'happy': return [
      { t: 0, d: .12, face: EXPR.joy, armL: UP, armR: UP, sq: .9 },
      { t: .12, d: .16, lift: .11 * H, sq: 1.07 }, { t: .3, d: .14, lift: 0, sq: .91 }, { t: .46, d: .2, sq: 1 },
      { t: 1.1, d: .35, face: EXPR.happy, armL: REST, armR: REST }];
    case 'embarrassed': return [
      { t: 0, d: .18, face: EXPR.embarrassed, armR: ARM.scratch, armL: REST, lean: .035, sq: .97 },
      { t: .5, d: .25, lean: -.02 }, { t: .95, d: .25, lean: .02 }, { t: 1.4, d: .3, lean: 0, sq: 1 },
      { t: 2.3, d: .4, armR: REST, face: EXPR.nervous }];
    case 'clap': {
      const k = [{ t: 0, d: .15, face: EXPR.joy, armL: CLAP, armR: CLAP }];
      for (let i = 0; i < 6; i++) {
        k.push({ t: .15 + i * .2, d: .09, armL: APART, armR: APART, lift: (i % 2 ? .03 : .015) * H, sq: 1.03 });
        k.push({ t: .25 + i * .2, d: .09, armL: CLAP, armR: CLAP, lift: 0, sq: .98 });
      }
      k.push({ t: 1.5, d: .3, sq: 1, armL: REST, armR: REST, face: EXPR.happy });
      return k;
    }
    case 'yawn': return [
      { t: 0, d: .35, face: YAWN, armR: CUP, sq: 1.05, lean: -.02 },
      { t: 1.3, d: .45, face: TIRED, armR: REST, sq: 1, lean: 0 }];
    case 'wave': return [
      { t: 0, d: .15, armR: ARM.wave, face: EXPR.happy }, { t: 1.5, d: .3, armR: REST }];
    case 'oops': return [
      { t: 0, d: .15, face: EXPR.worried, armR: ARM.shrug, lean: .025 }, { t: .22, d: .15, lean: -.025 },
      { t: .44, d: .15, lean: .02 }, { t: .66, d: .2, lean: 0 }, { t: 1.4, d: .35, armR: REST, face: EXPR.puzzled },
      { t: 2.4, d: .4, face: who === 'mia' ? EXPR.happy : EXPR.neutral }];
    case 'think': return [
      { t: 0, d: .2, face: EXPR.puzzled, armR: ARM.scratch }, { t: 1.8, d: .4, armR: REST }];
    case 'surprised': return [
      { t: 0, d: .1, face: EXPR.surprised, sq: 1.06, lift: .04 * H }, { t: .2, d: .2, sq: 1, lift: 0 }, { t: 1, d: .3, face: EXPR.happy }];
    default: return [];
  }
}

export function mountBean(canvas, opts = {}) {
  const who = opts.who || 'youssef', sp = CAST[who], H = sp.H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let base = pose({ face: EXPR[opts.expr] || EXPR.neutral, armL: REST, armR: REST, turn: opts.turn || 0 });
  let keys = [];                      // absolute-time keys (moods + reactions)
  const t0 = performance.now() / 1000 - (who === 'mia' ? 7.3 : 0);
  let talkT0 = -1, talkT1 = -1, raf = 0, running = false, visible = true, dirty = true;
  let W = 0, Hc = 0, dpr = 1;
  const now = () => performance.now() / 1000 - t0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width || canvas.width)), h = Math.max(1, Math.round(r.height || canvas.height));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== W || h !== Hc || canvas.width !== Math.round(w * dpr)) {
      W = w; Hc = h; canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); dirty = true;
    }
  }
  function state(t) {
    // bake keys that have fully played into the base so the list stays short
    while (keys.length && keys[0].t + (keys[0].d ?? .22) + .05 < t) {
      base = fold([{ ...keys[0], t: -1e9, d: 1 }], 0, base); keys.shift();
    }
    return fold(keys, t, base);
  }
  function draw(t = now()) {
    resize();
    const s = state(t);
    const k = Math.min(Hc / (1.3 * H), W / (1.02 * H));
    const p = pose({ ...s, x: W / 2, y: Hc * .955, k });
    p.breathe = REDUCED ? 0 : Math.sin(t / 3.2 * Math.PI * 2);
    p.face = liveFace(who, t, s.face, { darts: !REDUCED, talk: talkT0 >= 0 && t < talkT1 ? t - talkT0 : -1 });
    if ((s.armR && s.armR.w > 0) || (s.armL && s.armL.w > 0)) p.wave = t * 2.2;
    if (who === 'mia') p.pony = Math.sin(t * 1.3) * .03 - (s.lean || 0) * 2 - clamp((s.lift || 0) / H, -.2, .2) * .8;
    else p.quiff = (s.lean || 0) * -1.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hc);
    drawChar(ctx, sp, p);
    dirty = false;
  }
  function loop() {
    raf = 0;
    if (!running || !visible) return;
    const t = now();
    const busy = keys.length || (talkT0 >= 0 && t < talkT1);
    if (!REDUCED || busy || dirty) draw(t);
    if (!REDUCED || busy) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (running && visible && !raf) raf = requestAnimationFrame(loop); };
  const api = {
    who,
    set(expr, extra = {}) { keys.push({ t: now(), d: .25, face: EXPR[expr] || EXPR.neutral, ...extra }); dirty = true; kick(); return api; },
    react(name) { const t = now(); for (const k of reaction(name, H, who)) keys.push({ ...k, t: t + k.t }); keys.sort((a, b) => a.t - b.t); kick(); return api; },
    talk(sec) { talkT0 = now(); talkT1 = talkT0 + Math.max(.3, sec || 1); kick(); return api; },
    draw, start() { running = true; kick(); return api; },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; return api; },
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; kick(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { dirty = true; kick(); }).observe(canvas);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; kick(); });
  return api.start();
}

// draw every [data-bean] canvas on the page: data-bean="mia" data-expr="happy"
export function mountAll(root = document) {
  const out = [];
  root.querySelectorAll('canvas[data-bean]').forEach(c => out.push(mountBean(c, { who: c.dataset.bean, expr: c.dataset.expr || 'neutral', turn: +(c.dataset.turn || 0) })));
  return out;
}
