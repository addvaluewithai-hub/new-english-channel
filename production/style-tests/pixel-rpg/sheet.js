// sheet.js — model sheet (?sheet=1): sprites, turnaround, poses, portraits, palette
import { FB, C, T, LUT, makeOut, RGB, NPAL } from './px.js';
import { youssefSide, figure } from './rig.js';
import { portraitY, portraitM } from './portraits.js';
const fb = new FB(), out = makeOut(document.getElementById('c'));
function put(s, x, y) { fb.blit(s, x - (s.ox || 0), y - (s.oy || 0)); }
window.render = () => {
  fb.clear(C.silver); fb.rect(0, 0, 320, 80, C.skyL);
  let x = 16; for (const p of ['walk0', 'walk1', 'walk2', 'walk3', 'idle', 'lookup', 'hop']) { put(youssefSide(p), x, 50); x += 22; }
  put(figure({ who: 'y', view: 'back' }), x + 4, 50); x += 22;
  put(figure({ who: 'y', view: 'front' }), x + 4, 50); x += 22;
  put(figure({ who: 'y', view: 'front', head: 'frontEmb', armL: [-5, -9] }), x + 4, 50); x += 22;
  put(figure({ who: 'y', view: 'back', armR: [7, 10] }), x + 4, 50); x += 22;
  x = 16;
  for (const o of [{}, { head: 'frontTalk' }, { head: 'frontBlink' }, { armL: [-8, -9], head: 'frontTalk', sway: 1 }, { head: 'frontPuz', tilt: 1 }, { legL: -1 }, { legR: -1 }]) { put(figure({ who: 'm', view: 'front', ...o }), x, 125); x += 22; }
  x = 8;
  for (const p of [portraitY('happy'), portraitY('nervous', 1), portraitY('embarrassed'), portraitM('smile'), portraitM('smile', 1), portraitM('puzzled', 1), portraitM('smile', 0, true)]) { fb.rect(x - 1, 137, 34, 34, C.ink); fb.rect(x, 138, 32, 32, C.navy); fb.blit(p, x, 138); x += 38; }
  for (let i = 0; i < NPAL; i++) fb.rect(4 + i * 6, 174, 5, 5, i);
  out.present(fb, LUT.full); out.show();
};
window.DUR = 1; window.READY = true;
