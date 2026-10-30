// Bean widget — draws one of the show's beans (the same bean.js as the episodes: design v3, A3 arms) on a <canvas> at any size,
// with the episodes' idle (breathing, seeded blinks, eye darts, ponytail / quiff springs), time-smoothed arms (smoothArms, as in
// the episodes) and a few reactions.
//
//   const b = mountBean(canvas, { who: 'mia', expr: 'happy' });   // who: youssef | mia (Sara) | lopez | ana
//   b.set('embarrassed');        // mood (blends over ~.25 s)
//   b.react('happy');            // happy | embarrassed | clap | yawn | wave | oops | think | surprised
//   b.talk(1.4);                 // lip sync (the episodes' viseme shapes) for a 1.4 s clip that starts now
//   b.stop(); b.start();
import { CAST, drawChar, EXPR, ARM, pose } from './engine/bean.js';
import { fold, liveFace, lipsync, springAt, smoothArms, CUP, CLAP, DIP, RAISE } from './engine/act.js';
import { speech, talking } from './engine/tl.js';

const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const N = EXPR.neutral;
const YAWN = { ...N, eye: .04, bLy: .3, bRy: .3, bLr: .5, bRr: .5, mw: .085, mo: .1, ms: -.05, mt: 0, blush: .4 };
const TIRED = { ...N, lid: .45, bLy: .1, bRy: .1, ms: .2, blush: .35 };
const REST = ARM.rest, UP = ARM.up;
// clapping: the hands meet in front of the chest (the episodes' CLAP) and part a little; both snap (short follow time)
const CLAPS = { ...CLAP, tau: .045 }, APART = { ...CLAP, dx: -.13, dy: -.05, tau: .045 };
const H0 = 300;   // the framing reference (Youssef's height), so Sara stands a head shorter, as in the show

// reactions: keyed tracks (seconds relative to the start); `lift` is in units of H
function reaction(name, H, who) {
  switch (name) {
    case 'happy': return [
      { t: 0, d: .12, face: EXPR.joy, armL: UP, armR: UP, sq: .9 },
      { t: .12, d: .16, lift: .11 * H, sq: 1.07 }, { t: .3, d: .14, lift: 0, sq: .91 }, { t: .46, d: .2, sq: 1 },
      { t: 1.1, d: .35, face: EXPR.happy, armL: REST, armR: REST }];
    case 'embarrassed': return [
      { t: 0, d: .25, face: EXPR.embarrassed, armR: ARM.scratch, armL: REST, lean: .035, sq: .97 },
      { t: .5, d: .25, lean: -.02 }, { t: .95, d: .25, lean: .02 }, { t: 1.4, d: .3, lean: 0, sq: 1 },
      { t: 2.3, d: .4, armR: REST, face: EXPR.nervous }];
    case 'clap': {
      const k = [{ t: 0, d: .15, face: EXPR.joy, armL: CLAPS, armR: CLAPS }];
      for (let i = 0; i < 6; i++) {
        k.push({ t: .15 + i * .2, d: .08, armL: APART, armR: APART, lift: (i % 2 ? .03 : .015) * H, sq: 1.03 });
        k.push({ t: .25 + i * .2, d: .08, armL: CLAPS, armR: CLAPS, lift: 0, sq: .98 });
      }
      k.push({ t: 1.5, d: .3, sq: 1, armL: REST, armR: REST, face: EXPR.happy });
      return k;
    }
    case 'yawn': return [
      { t: 0, d: .35, face: YAWN, armR: CUP, sq: 1.05, lean: -.02 },
      { t: 1.3, d: .45, face: TIRED, armR: REST, sq: 1, lean: 0 }];
    case 'wave': return [   // the episodes' wave: a short anticipation dip, then the wave
      { t: 0, d: .15, armR: DIP, face: EXPR.happy }, { t: .15, d: .22, armR: ARM.wave }, { t: 1.7, d: .3, armR: REST }];
    case 'oops': return [
      { t: 0, d: .18, face: EXPR.worried, armL: ARM.shrug, armR: ARM.shrug, lean: .025 }, { t: .22, d: .15, lean: -.025 },
      { t: .44, d: .15, lean: .02 }, { t: .66, d: .2, lean: 0 }, { t: 1.4, d: .35, armL: REST, armR: REST, face: EXPR.puzzled },
      { t: 2.4, d: .4, face: who === 'youssef' ? EXPR.neutral : EXPR.happy }];
    case 'think': return [
      { t: 0, d: .25, face: EXPR.puzzled, armR: ARM.scratch }, { t: 1.8, d: .4, armR: REST }];
    case 'surprised': return [
      { t: 0, d: .1, face: EXPR.surprised, armR: RAISE, sq: 1.06, lift: .04 * H }, { t: .2, d: .2, sq: 1, lift: 0 },
      { t: 1, d: .3, face: EXPR.happy, armR: REST }];
    default: return [];
  }
}

let serial = 0;
export function mountBean(canvas, opts = {}) {
  const who = CAST[opts.who] ? opts.who : 'youssef', sp = CAST[who], H = sp.H;
  const mouthKey = `${who}#${++serial}`;          // this widget's own viseme track (two beans of one character never share a mouth)
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let base = pose({ face: EXPR[opts.expr] || EXPR.neutral, armL: REST, armR: REST, turn: opts.turn || 0 });
  let keys = [];                      // absolute-time keys (moods + reactions)
  const C = { keys, base };           // the arm track for smoothArms (same shape as an episode character)
  const t0 = performance.now() / 1000 - (who === 'mia' ? 7.3 : who === 'youssef' ? 0 : 3.1);
  let raf = 0, running = false, visible = true, dirty = true;
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
  // keys that finished long enough ago are baked into the base so the list stays short. "Long enough" = past the arm smoothing
  // window (1 s) and the ponytail spring window (1.4 s), so baking never changes the simulated history.
  function bake(t) {
    while (keys.length && keys[0].t + (keys[0].d ?? .22) + 1.6 < t) {
      const { t: _t, d: _d, _av, ...k } = keys[0];
      base = fold([{ ...k, t: -1e9, d: 1 }], 0, base); keys.shift();
      delete base._av;   // smoothArms caches each pose's arm vector on the object (_av): the new base needs its own
    }
    C.keys = keys; C.base = base;
  }
  const state = t => fold(keys, t, base);
  const springState = tt => { const s = state(tt); return { lift: s.lift || 0, lean: s.lean || 0, x: 0 }; };
  function draw(t = now()) {
    resize(); bake(t);
    const s = state(t);
    const k = Math.min(Hc / (1.3 * H0), W / (1.27 * H0));   // 1.27 H0 wide holds the widest reaction (a wave)
    // blinks and darts as in the episodes (their seeded blink list covers 400 s, so the idle clock wraps)
    const tw = 5 + (t % 380);
    let face = liveFace(who, tw, s.face, { talk: false, darts: !REDUCED });
    face = lipsync(face, mouthKey, t);
    const p = pose({ ...s, ...smoothArms(C, t), x: W / 2, y: Hc * .955, k, face, wave: t * 1.9,
      pony: who === 'mia' ? springAt(springState, t) : 0, quiff: who === 'youssef' ? springAt(springState, t, .25) : 0,
      breathe: REDUCED ? 0 : Math.sin(t * Math.PI * 2 / 3.2 + (who === 'mia' ? 1 : 0)) });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hc);
    drawChar(ctx, sp, p);
    dirty = false;
  }
  // busy = something is still moving: a key in progress (or its arm / spring follow-through), or the mouth
  const busy = t => keys.some(k => k.t + (k.d ?? .22) + 1.6 >= t) || talking(mouthKey, t);
  function loop() {
    raf = 0;
    if (!running || !visible) return;
    const t = now(), b = busy(t);
    if (!REDUCED || b || dirty) draw(t);
    if (!REDUCED || b) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (running && visible && !raf) raf = requestAnimationFrame(loop); };
  const api = {
    who,
    set(expr, extra = {}) { keys.push({ t: now(), d: .25, face: EXPR[expr] || EXPR.neutral, ...extra }); dirty = true; kick(); return api; },
    react(name) { const t = now(); for (const k of reaction(name, H, who)) keys.push({ ...k, t: t + k.t }); keys.sort((a, b) => a.t - b.t); kick(); return api; },
    // a clip of `sec` seconds starts now; the voice starts ≈ .2 s in and the mp3 ends with ≈ .3 s of silence
    talk(sec, { lead = .2, tail = .3 } = {}) {
      const t = now(), d = Math.max(.3, (sec || 1) - lead - tail);
      speech(mouthKey, t + lead, d, t); kick(); return api;
    },
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
