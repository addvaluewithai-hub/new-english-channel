// Model sheet: characters in several poses + props + cards, drawn flat (2D only)
import { cv } from './paper.js';
import * as P from './people.js';
await Promise.all(['700 40px Fredoka', '700 40px "Baloo Bhaijaan 2"', '40px "Lilita One"'].map(f => document.fonts.load(f, 'Aaأهلا')));
const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; document.body.appendChild(c);
const x = c.getContext('2d'); x.fillStyle = '#efe6d4'; x.fillRect(0, 0, 1920, 1080);
const poses = [
  ['youssef', {}], ['youssef', { mouth: 'talk', armR: 2.4, eyes: 'happy' }], ['youssef', { eyes: 'wide', mouth: 'worried', brows: 'worried', blush: 1, sweat: 1 }], ['youssef', { walk: 1.2, stride: 1, armL: .5, armR: -.2 }],
  ['mia', {}], ['mia', { mouth: 'open', armR: 2.6, eyes: 'happy' }], ['mia', { mouth: 'o', brows: 'up', eyes: 'wide', look: [-.6, 0] }],
];
poses.forEach(([w, p], i) => { const k = cv(P.PW, P.PH); P.drawPerson(w, k.getContext('2d'), p); x.drawImage(k, 20 + i * 200, 20, 200, 350); });
const items = [P.terrace(.1, .12, '#d9776a', 3), P.clockTower(.16), P.phoneBox(.06), P.lampPost(.07), P.bus(.11), P.school(.13, .12), P.suitcase(.02), P.hedge(.1, .025, 4), P.schoolDoor(.035)];
let px = 20; for (const it of items) { const h = 300, w = h * it.c.width / it.c.height; x.drawImage(it.c, px, 400, w, h); px += w + 10; }
const cards = [P.phraseCard(.112, .064, .03, 'Hello!\nHi!', 'أهلًا', '#ffd766', 1), P.phraseCard(.112, .064, .03, 'Nice to meet you.\nNice to meet you too.', 'اتشرّفت بمعرفتك — وأنا كمان', '#d2c4ff', 5), P.wordTile('I', .03, '#fffaf0'), P.wordTile('am', .03, '#ffd766'), P.wordTile('Youssef', .03, '#fffaf0'), P.wordTile('أنا', .03, '#c9f0dc', { ar: true }), P.pullTab(.1, .02)];
px = 20; for (const it of cards) { const h = it.c.height > it.c.width ? 300 : 200, w = h * it.c.width / it.c.height; x.drawImage(it.c, px, 730, w, h); px += w + 14; }
window.DUR = 1; window.render = () => {}; window.READY = true;
