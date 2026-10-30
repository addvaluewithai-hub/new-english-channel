// Episode 2 "Good Morning?" — entry. window.render(t) is a pure function of t (seeded randomness only); everything is keyed to
// timeline.json, so a regenerated timeline (new voice timings) re-times the whole picture and the cue list.
// Modules: kit (tokens, form pass) · bean (characters) · world (the New York street) · ui (type) · tl (timeline) · act (acting) ·
//          story (open · run · hall + coffee · door + bye) · recap (Living Letters recap) · outro (title, your turn, teaser, end card) · cues (window.EV)
import { P, grain, CPU } from './kit.js';
import { setArms } from './bean.js';
import { clamp, seg, ss } from '/core/lib.js';
import { loadTimeline, TL, SEC } from './tl.js';
import { bakeWorld, bakeSets } from './world.js';
import { buildStory, sceneOpen, sceneRun, sceneHall, sceneDoor } from './story.js';
import { buildRecap, sceneRecap } from './recap.js';
import { buildOutro, titleCard, wipe, sceneTurn, sceneSite, sceneNext, endCard, O } from './outro.js';
import { plate } from './ui.js';
import { cue, finishCues } from './cues.js';

const cv = document.getElementById('c'), c = cv.getContext('2d', CPU);
const SW = 1920, SH = 1080;
let X = null;   // section times

function frame(t) {
  const { run, hall, door, recap, turn, site, next } = X;
  if (t < run.t0) { sceneOpen(c, t); titleCard(c, t); return; }
  if (t < hall.t0) return sceneRun(c, t);
  if (t < door.t0) return sceneHall(c, t);
  if (t < recap.t0 - .05) return sceneDoor(c, t);
  if (t < recap.t0 + .7) return wipe(c, seg(t, recap.t0 - .05, recap.t0 + .65), () => sceneDoor(c, t), () => sceneRecap(c, t));
  if (t < turn.t0 - .1) return sceneRecap(c, t);
  if (t < turn.t0 + .65) return wipe(c, seg(t, turn.t0 - .1, turn.t0 + .6), () => sceneRecap(c, t), () => sceneTurn(c, t));
  if (t < (site.t1 > 0 ? site.t0 : next.t0)) return sceneTurn(c, t);
  if (t < next.t0) return sceneSite(c, t);   // the full-screen exercises call-to-action
  if (t < O.bEnd) return sceneNext(c, t);
  if (t < O.bEnd + .5) return wipe(c, seg(t, O.bEnd, O.bEnd + .45), () => sceneNext(c, t), () => endCard(c, t));
  return endCard(c, t);
}

// preview ranges: ?from=door&to=retry (section ids: from its start / to its end) or seconds (?from=33&to=66)
const Q = new URLSearchParams(location.search);
if (Q.get('arms')) setArms(Q.get('arms'));   // ?arms=A2|A3: for cost comparisons only
let OFF = 0;
window.render = t => {
  t += OFF;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  t = clamp(t, 0, TL.dur);
  frame(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  plate(c, t);
  grain(c, SW, SH, .03);
  // fade in from ink at the start, out to ink at the end
  const f = Math.max(1 - seg(t, 0, .6), seg(t, TL.dur - .7, TL.dur - .05));
  if (f > 0) { c.globalAlpha = ss(f); c.fillStyle = P.ink; c.fillRect(0, 0, SW, SH); c.globalAlpha = 1; }
};

(async () => {
  await loadTimeline();
  await document.fonts.load('600 40px "Fredoka"');
  await Promise.all([document.fonts.load('400 40px "Lilita One"'), document.fonts.load('700 40px "Baloo Bhaijaan 2"', 'أول يوسف'),
    document.fonts.load('800 40px "Baloo Bhaijaan 2"', 'أول يوسف'), document.fonts.load('500 40px "Fredoka"'), document.fonts.load('700 40px "Fredoka"')]);
  await document.fonts.ready;
  X = { run: SEC('run'), hall: SEC('hall'), door: SEC('door'), recap: SEC('recap'), turn: SEC('turn'), site: SEC('site'), next: SEC('next') };
  const at = (v, end) => v == null ? null : isNaN(+v) ? (end ? SEC(v).t1 : SEC(v).t0) : +v;
  OFF = at(Q.get('from'), false) ?? 0;
  window.DUR = (at(Q.get('to'), true) ?? TL.dur) - OFF;
  bakeWorld(); bakeSets();
  buildStory(); buildRecap(); buildOutro();
  cue(X.recap.t0 - .05, 'page_turn', { note: 'story → recap' });
  cue(0, 'music_intro', { dur: SEC('run').t1, note: 'light theme under the opening and the run' });
  cue(X.recap.t0 + .3, 'music_recap', { dur: X.recap.t1 - X.recap.t0 - .3, note: 'soft bed under the recap' });
  cue(SEC('next').t0, 'music_outro', { dur: TL.dur - SEC('next').t0 });
  window.EV = finishCues();
  window.render(0);
  window.READY = true;
})();
