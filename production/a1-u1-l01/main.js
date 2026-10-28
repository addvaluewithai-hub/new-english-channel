// "Hello! I'm Youssef" — A1 lesson 1 in the paper pop-up book style. Scene + choreography + render(t).
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, seg, ss, eio, eo, back, TAU, mulberry, track, spring } from './lib.js';
import * as A from './art.js';
import * as P from './people.js';
import { cv, paperFill, GRAIN, INK, sh, rr } from './paper.js';
import { makeBook, texOf, BW, BD, PG } from './book.js';
import { cutMesh, particles, blobShadow } from './cutmesh.js';
import { makePost } from './post.js';
import * as HUD from './hud.js';

const W = 1920, H = 1080;
const TL = await (await fetch('timeline.json')).json();
const BUBW = TL.bubbles;
const T = TL.T, WK = T.work, DUR = T.dur;
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').appendChild(renderer.domElement);
const ov = document.getElementById('ov'), OX = ov.getContext('2d');
const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(30, W / H, .004, 30);
const post = makePost(renderer, scene, cam, W, H);

// ---------- assets ----------
await Promise.all(['500 40px Fredoka', '600 40px Fredoka', '700 40px Fredoka', '40px "Lilita One"', '500 40px "Baloo Bhaijaan 2"', '600 40px "Baloo Bhaijaan 2"', '700 40px "Baloo Bhaijaan 2"', '800 40px "Baloo Bhaijaan 2"', '40px Lalezar'].map(f => document.fonts.load(f, 'Aaأهلا')));
const hdr = await new RGBELoader().loadAsync('/core/assets/polyhaven/lythwood_lounge_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = hdr; scene.background = hdr; scene.backgroundBlurriness = .22;
scene.backgroundRotation.set(0, 2.3, 0); scene.environmentRotation.set(0, 2.3, 0);
const tl = new THREE.TextureLoader();
const wt = n => { const t = tl.load(`/core/assets/polyhaven/walnut_${n}.jpg`); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 1.4); t.anisotropy = 12; return t; };
const wdiff = wt('diff'); wdiff.colorSpace = THREE.SRGBColorSpace;
const desk = new THREE.Mesh(new THREE.BoxGeometry(2.6, .04, 1.7), new THREE.MeshStandardMaterial({ map: wdiff, normalMap: wt('nor'), roughnessMap: wt('rough'), color: '#c9a88a', envMapIntensity: .8 }));
desk.position.set(0, -.02, .25); desk.receiveShadow = true; scene.add(desk);
const gl = new GLTFLoader();
async function prop(name, x, z, s, ry) {
  const m = (await gl.loadAsync(`/core/assets/polyhaven/${name}/${name}.gltf`)).scene;
  m.position.set(x, 0, z); m.scale.setScalar(s); m.rotation.y = ry;
  m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  scene.add(m); return m;
}
const lamp = await prop('desk_lamp_arm_01', -.347, .51, .55, -.76);
lamp.traverse(o => { if (o.isMesh && o.material.name.includes('light')) { o.material = o.material.clone(); o.material.emissive = new THREE.Color('#ffd9a0'); o.material.emissiveIntensity = 6; } });
const tea = await prop('tea_set_01', 0, 0, 1, 0);
{ const keep = { tea_set_01_teapot_01: [.5, .16, .4], tea_set_01_teapot_01_lid: [.5, .16, .4], tea_set_01_cup_small_01: [.36, .46, 2.2], tea_set_01_saucer_circular_04: [.36, .46, 0] }, dead = [];
  tea.traverse(o => { if (!o.name.startsWith('tea_set_01_')) return; const k = keep[o.name]; if (!k) dead.push(o); else { o.position.x = k[0]; o.position.z = k[1]; o.rotation.y = k[2]; if (o.name.includes('cup_small')) o.position.y += .012; } });
  dead.forEach(o => o.parent && o.parent.remove(o)); }
{ // pencil
  const g = new THREE.Group(), M = (c, r = .5, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.0038, .0038, .15, 6), M('#f2b632')), wood = new THREE.Mesh(new THREE.CylinderGeometry(.0038, .0008, .018, 6), M('#e8c79a', .8));
  const lead = new THREE.Mesh(new THREE.CylinderGeometry(.0008, .0001, .004, 6), M('#333', .4)), ferr = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, .012, 12), M('#c9c2b0', .3, 1)), eras = new THREE.Mesh(new THREE.CylinderGeometry(.0039, .0039, .01, 12), M('#e88a8a', .9));
  wood.position.y = .084; lead.position.y = .095; ferr.position.y = -.081; eras.position.y = -.092;
  g.add(body, wood, lead, ferr, eras); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.rotation.set(0, -.4, Math.PI / 2); g.position.set(.3, .0038, .52); scene.add(g);
}

// ---------- the book ----------
function cover() {
  const w = 2048, h = Math.round(2048 * BD / BW), c = cv(w, h), x = c.getContext('2d'), m = cv(w, h), y = m.getContext('2d');
  x.fillStyle = '#1f5566'; x.fillRect(0, 0, w, h);
  const R = mulberry(3);
  for (let i = 0; i < h; i += 3) { x.fillStyle = `rgba(0,0,0,${.05 + R() * .07})`; x.fillRect(0, i, w, 1.2); }
  for (let i = 0; i < w; i += 3) { x.fillStyle = `rgba(255,255,255,${.02 + R() * .04})`; x.fillRect(i, 0, 1.2, h); }
  y.fillStyle = 'rgb(0,235,0)'; y.fillRect(0, 0, w, h);
  const both = fn => { x.save(); fn(x, '#e0b456'); x.restore(); y.save(); fn(y, 'rgb(0,90,255)'); y.restore(); };
  both((k, col) => { k.strokeStyle = col; k.lineWidth = 10; k.strokeRect(90, 90, w - 180, h - 180); k.lineWidth = 4; k.strokeRect(120, 120, w - 240, h - 240); });
  both((k, col) => { k.fillStyle = col; k.textAlign = 'center'; k.textBaseline = 'alphabetic';
    k.font = '230px "Lilita One"'; k.fillText('Hello!', w * .64, h * .38);
    k.font = '170px "Lilita One"'; k.fillText("I'm Youssef", w * .64, h * .58);
    k.direction = 'rtl'; k.font = '120px Lalezar'; k.fillText('أهلًا! أنا يوسف', w * .64, h * .76);
    k.direction = 'ltr'; k.font = '64px "Lilita One"'; k.fillText('ENGLISH · LESSON 1', w * .64, h * .88); });
  const cx = w * .22, cy = h * .52, r = 330;
  both((k, col) => { k.beginPath(); k.arc(cx, cy, r + 26, 0, TAU); k.lineWidth = 14; k.strokeStyle = col; k.stroke(); });
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip(); x.fillStyle = '#cfeaf6'; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  x.fillStyle = '#efe3cc'; x.fillRect(cx - r, cy + r * .45, 2 * r, r);
  const k = cv(P.PW, P.PH); P.drawPerson('youssef', k.getContext('2d'), { armR: 2.5, mouth: 'open', eyes: 'happy' }); x.drawImage(k, cx - r * .62, cy - r * .9, r * 1.2, r * 2.1);
  x.restore(); y.save(); y.beginPath(); y.arc(cx, cy, r, 0, TAU); y.fillStyle = 'rgb(0,200,0)'; y.fill(); y.restore();
  return { c, m };
}
const book = makeBook(cover()); scene.add(book.root);

// ---------- page art ----------
const PW = 2048, PH = Math.round(2048 * BD / BW), gx = xm => (xm / BW + .5) * PW, gz = zm => zm / BD * PH;
function page(fn) { const c = cv(PW, PH), x = c.getContext('2d'); fn(x); x.save(); x.globalAlpha = .7; x.fillStyle = x.createPattern(GRAIN, 'repeat'); x.fillRect(0, 0, PW, PH); x.restore(); return texOf(c); }
const grad = (x, stops) => { const g = x.createLinearGradient(0, 0, 0, PH); stops.forEach(([o, c]) => g.addColorStop(o, c)); x.fillStyle = g; x.fillRect(0, 0, PW, PH); };
function softClouds(x, seed, n = 7) { const R = mulberry(seed); x.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < n; i++) { const cx = R() * PW, cy = PH * (.08 + R() * .35), w = 180 + R() * 240; for (let k = 0; k < 5; k++) { x.beginPath(); x.ellipse(cx + (k - 2) * w * .22, cy - Math.sin(k / 4 * Math.PI) * w * .12, w * .2, w * .13, 0, 0, TAU); x.fill(); } } }
const londonSky = page(x => {
  grad(x, [[0, '#7cc4ec'], [.65, '#c4e9f5'], [1, '#eaf6f1']]); softClouds(x, 3);
  const R = mulberry(17); x.fillStyle = 'rgba(120,160,190,.35)';           // far skyline
  let px = 0; while (px < PW) { const w = 70 + R() * 130, h = 120 + R() * 260; x.fillRect(px, PH - h, w, h); if (R() < .3) { x.beginPath(); x.arc(px + w / 2, PH - h, w / 2, Math.PI, 0); x.fill(); } px += w + 10; }
  x.fillStyle = 'rgba(120,160,190,.35)'; x.beginPath(); x.moveTo(PW * .72, PH); x.lineTo(PW * .72, PH - 380); x.lineTo(PW * .735, PH - 470); x.lineTo(PW * .75, PH - 380); x.lineTo(PW * .75, PH); x.fill();
});
const londonGround = page(x => {
  x.fillStyle = '#e8dcc6'; x.fillRect(0, 0, PW, PH);
  x.fillStyle = '#d9cbb0'; x.fillRect(0, gz(.05), PW, gz(.012));
  x.fillStyle = '#737885'; x.fillRect(0, gz(.062), PW, gz(.05));
  x.fillStyle = '#fffaf0'; for (let i = 0; i < 12; i++) x.fillRect(i * PW / 12 + 30, gz(.085) - 6, PW / 24, 12);
  x.fillStyle = '#d9cbb0'; x.fillRect(0, gz(.112), PW, gz(.01));
  x.strokeStyle = 'rgba(150,130,100,.35)'; x.lineWidth = 4;
  for (let z = .125; z < .3; z += .022) { x.beginPath(); x.moveTo(0, gz(z)); x.lineTo(PW, gz(z)); x.stroke(); }
  for (let r = 0; r < 9; r++) for (let i = 0; i < 16; i++) { const px = (i + (r % 2) * .5) * PW / 15; x.beginPath(); x.moveTo(px, gz(.125 + r * .022)); x.lineTo(px, gz(.147 + r * .022)); x.stroke(); }
  for (let i = 0; i < 6; i++) { x.fillStyle = '#fffaf0'; x.fillRect(gx(-.21) + i * 34, gz(.064), 22, gz(.046)); }   // zebra crossing
});
const boardSky = page(x => {
  grad(x, [[0, '#a9e6d5'], [.8, '#dff6ee'], [1, '#f4fbf3']]);
  P.bunting(x, 60, 120, PW - 60, 120, 14, ['#ff7aa8', '#ffd23f', '#5ac8ff', '#7ee07a', '#ff9a4a']);
  const R = mulberry(4); x.strokeStyle = 'rgba(60,140,120,.28)'; x.lineWidth = 6; x.lineCap = 'round';
  for (let i = 0; i < 18; i++) { const px = R() * PW, py = 300 + R() * (PH - 450), s = 18 + R() * 20; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k / 10 * TAU, r = k % 2 ? s * .45 : s; x.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } x.closePath(); x.stroke(); }
  x.font = '700 120px Fredoka'; x.fillStyle = 'rgba(60,140,120,.16)'; x.textAlign = 'center'; for (const [s, u, v] of [['A', .1, .5], ['B', .9, .45], ['C', .14, .8], ['?', .86, .8], ['!', .5, .35]]) x.fillText(s, PW * u, PH * v);
});
const boardGround = page(x => {
  grad(x, [[0, '#ffe39a'], [1, '#ffd77a']]);
  for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.035)'; x.fillRect(0, PH * i / 9, PW, PH / 9); }
  const R = mulberry(8); for (let i = 0; i < 140; i++) { x.beginPath(); x.arc(R() * PW, R() * PH, 5 + R() * 6, 0, TAU); x.fillStyle = ['#fffaf0', '#ff9ec1', '#7fd6c4'][i % 3]; x.fill(); }
});
const workSky = page(x => {
  grad(x, [[0, '#e9a95e'], [1, '#f6c98a']]);
  const R = mulberry(5); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${R() < .5 ? '120,70,30' : '255,230,190'},${.12 + R() * .15})`; x.beginPath(); x.arc(R() * PW, R() * PH, 2 + R() * 4, 0, TAU); x.fill(); }   // cork
  const note = (u, v, rot, col, txt) => { x.save(); x.translate(PW * u, PH * v); x.rotate(rot); x.fillStyle = 'rgba(40,25,15,.2)'; x.fillRect(-150 + 8, -110 + 10, 300, 220); x.fillStyle = col; x.fillRect(-150, -110, 300, 220); x.strokeStyle = INK; x.lineWidth = 5; x.strokeRect(-150, -110, 300, 220); x.beginPath(); x.arc(0, -90, 16, 0, TAU); x.fillStyle = '#e8413a'; x.fill(); x.stroke(); x.font = '700 64px Fredoka'; x.fillStyle = '#3a2a24'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, 20); x.restore(); };
  note(.12, .32, -.08, '#fff6c2', 'I ✗'); note(.88, .3, .07, '#d9f2ff', 'I am ✓'); note(.14, .72, .05, '#ffe1ea', 'is'); note(.86, .72, -.06, '#e6ffd9', "I'm");
});
const workGround = page(x => {
  x.fillStyle = '#fbf3e0'; x.fillRect(0, 0, PW, PH);
  x.strokeStyle = 'rgba(110,150,210,.45)'; x.lineWidth = 4; for (let z = .02; z < .3; z += .02) { x.beginPath(); x.moveTo(0, gz(z)); x.lineTo(PW, gz(z)); x.stroke(); }
  x.strokeStyle = 'rgba(232,80,80,.5)'; x.lineWidth = 5; x.beginPath(); x.moveTo(gx(-.19), 0); x.lineTo(gx(-.19), PH); x.stroke();
});
const SPREAD = [{ sky: londonSky, ground: londonGround }, { sky: boardSky, ground: boardGround }, { sky: workSky, ground: workGround }, { sky: londonSky, ground: londonGround }];
const TURNS = [T.turn1, T.turn2, T.turn3];
const RISE = [T.rise0, T.rise1, T.rise2, T.rise3], FOLD = [T.turn1[0], T.turn2[0], T.turn3[0], T.close[0]];

// ---------- pop-up pieces ----------
const POPS = [];
function popper(spread, item, x, y, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const m = cutMesh(item, o); if (o.ry) m.rotation.y = o.ry;
  g.add(m); (o.parent || book.stage).add(g);
  const rec = { g, m, spread, t0: o.t0 ?? RISE[spread] + (o.d ?? (.3 - z) * 1.2), t1: o.t1 ?? FOLD[spread] + (.3 - z) * .6, dir: o.dir ?? (z > .15 ? -1 : 1), sway: o.sway || 0, ph: x * 40 };
  POPS.push(rec); return rec;
}
const riseOf = (r, t) => Math.min(back(seg(t, r.t0, r.t0 + .55), 1.7), 1 - ss(seg(t, r.t1, r.t1 + .4)));
const EXL = {};
function london(s) {
  const E = {};
  popper(s, P.clockTower(.2), -.2, 0, .012);
  popper(s, P.terrace(.11, .12, '#d9776a', 3, { n: 2 }), -.13, 0, .014);
  popper(s, P.terrace(.11, .13, '#e0a35e', 5, { n: 2, door: '#e8413a' }), .145, 0, .012);
  E.school = popper(s, P.school(.15, .16), 0, 0, .03);
  { const it = P.schoolDoor(.066), g = new THREE.Group(); g.add(cutMesh({ ...it, ax: (it.pad / A.PPM) / it.w }, { backCol: '#237a71' })); g.position.set(-.15 * .13, 0, .0008); E.school.g.add(g); E.door = g; }
  popper(s, A.lolliTree(.085, '#5cbf4a', '#3f9934', 21), -.075, 0, .045, { sway: .02 });
  popper(s, A.lolliTree(.075, '#6fcc55', '#4ea93e', 22), .08, 0, .045, { sway: .02 });
  popper(s, P.bus(.12), .15, 0, .08);
  popper(s, P.lampPost(.09), -.105, 0, .118);
  popper(s, P.phoneBox(.07), -.19, 0, .125);
  popper(s, P.hedge(.12, .026, 4), -.15, 0, .27, { dir: -1 });
  popper(s, P.hedge(.1, .024, 9), .16, 0, .275, { dir: -1 });
  const R = mulberry(90 + s); for (let i = 0; i < 4; i++) popper(s, A.flower(.016 + R() * .006, ['#ff7aa8', '#ffd23f', '#ffffff', '#b58cff'][i], i + s * 10), -.04 + i * .03 + (R() - .5) * .01, 0, .26 + R() * .02, { sway: .08, dir: -1 });
  { const g = new THREE.Group(); g.add(cutMesh(A.cloud(.06, 1))); g.position.set(-.12, .21, .03); book.sky.add(g); E.cloud1 = g; }
  { const g = new THREE.Group(); g.add(cutMesh(A.cloud(.05, 2))); g.position.set(.12, .235, .03); book.sky.add(g); E.cloud2 = g; }
  return E;
}
EXL[0] = london(0); EXL[3] = london(3);

// board: six phrase cards
const CARD_DEF = [
  ['Hello!\nHi!', 'أهلًا', '#ffd766'], ["I'm ___.", 'أنا ___', '#9fd6f5'], ['My name is ___.', 'اسمي ___', '#b8e986'],
  ["What's your name?", 'اسمك إيه؟', '#ffb3c7'], ['Nice to meet you.\nNice to meet you too.', 'اتشرّفت بمعرفتك — وأنا كمان', '#d2c4ff'], ['Bye! See you.\nGoodbye!', 'مع السلامة', '#ffc48a'],
];
const CARD_POS = [[-.125, .076, .05], [0, .076, .05], [.125, .076, .05], [-.125, .012, .13], [0, .012, .13], [.125, .012, .13]];
const CARDS = CARD_DEF.map(([en, ar, col], i) => { const [x, st, z] = CARD_POS[i]; return popper(1, P.phraseCard(.112, .064, st, en, ar, col, i + 1), x, 0, z, { t0: TL.cards[i].t, dir: 1 }); });

// workshop: word tiles and pull-tabs
const TH = .032, ROW1 = .1, ROW2 = .18;
const tile = (txt, col, o) => P.wordTile(txt, TH, col, o);
const WT = {
  ar: tile('أنا يوسف', '#c9f0dc', { ar: true }), I: tile('I', '#fffaf0'), slot1: tile('   ', '#e9e2d2', { ink: '#b8ad98' }), you1: tile('Youssef', '#fffaf0'), am: tile('am', '#ffd766'), Im: tile("I'm", '#ffd766'),
  my: tile('My name', '#fffaf0'), slot2: tile('   ', '#e9e2d2'), you2: tile('Youssef', '#fffaf0'), is: tile('is', '#ffd766'),
  metoo: tile('Me too.', '#ffb3c7'), too: tile('Nice to meet you too.', '#b8e986'),
};
const engRow = WK.am - 3.4, row2 = WK.s2 + 2.4;
const WP = {};
WP.ball = popper(2, P.ballItem(.02), 0, 0, .14, { t0: 1e9, t1: 1e9, pop: false });
WP.ar = popper(2, WT.ar, 0, 0, .035, { t0: WK.arabic + .9, t1: WK.clear, dir: 1 });
WP.I = popper(2, WT.I, -.075, 0, ROW1, { t0: engRow, t1: WK.clear });
WP.Im = popper(2, WT.Im, -.068, 0, ROW1 + .0005, { t0: WK.fold + .2, t1: WK.clear });
WP.slot1 = popper(2, WT.slot1, -.012, 0, ROW1 - .001, { t0: engRow + .12, t1: WK.am - .05 });
WP.you1 = popper(2, WT.you1, .075, 0, ROW1, { t0: engRow + .24, t1: WK.clear });
WP.am = popper(2, WT.am, 0, 0, ROW1 + .001, { t0: WK.am - 1.6, t1: WK.fold + .35, pop: false });
WP.tab1 = popper(2, P.pullTab(.16, .022), 0, 0, ROW1 + .001, { t0: WK.am - 1.6, t1: WK.am + 1.2, pop: false });
WP.my = popper(2, WT.my, -.09, 0, ROW2, { t0: row2, t1: WK.clear });
WP.slot2 = popper(2, WT.slot2, -.012, 0, ROW2 - .001, { t0: row2 + .12, t1: WK.is - .05 });
WP.you2 = popper(2, WT.you2, .075, 0, ROW2, { t0: row2 + .24, t1: WK.clear });
WP.is = popper(2, WT.is, 0, 0, ROW2 + .001, { t0: WK.is - 1.4, t1: WK.clear, pop: false });
WP.tab2 = popper(2, P.pullTab(.16, .022), 0, 0, ROW2 + .001, { t0: WK.is - 1.4, t1: WK.is + 1.2, pop: false });
WP.metoo = popper(2, WT.metoo, 0, 0, .12, { t0: WK.metoo, t1: WK.metooCrumple });
WP.ball2 = popper(2, P.ballItem(.012, 9), 0, 0, .12, { t0: 1e9, t1: 1e9 });
WP.too = popper(2, WT.too, 0, 0, .15, { t0: WK.too, t1: FOLD[2] });
for (const k of ['am', 'is', 'tab1', 'tab2']) WP[k].dir = 0;    // these lie flat and slide in
WP.tab1.m.rotation.x = -Math.PI / 2; WP.tab2.m.rotation.x = -Math.PI / 2;
WP.tab1.m.position.set(WT.am.w * .5 + .07, .0004, 0); WP.tab2.m.position.set(WT.is.w * .5 + .07, .0004, 0);

// ---------- characters ----------
function dynPlane(c, h, ax, ay) {
  const t = texOf(c), w = h * c.width / c.height, g = new THREE.PlaneGeometry(w, h); g.translate(w / 2 - ax * w, ay * h - h / 2, 0);
  const mF = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, alphaToCoverage: true, roughness: .85, side: THREE.FrontSide });
  const mB = new THREE.MeshStandardMaterial({ map: t, alphaTest: .5, alphaToCoverage: true, roughness: .9, side: THREE.BackSide });
  mB.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = vec3(.94,.91,.85);'); };
  mB.customProgramCacheKey = () => 'personback';
  const f = new THREE.Mesh(g, mF), b = new THREE.Mesh(g, mB); f.castShadow = true; f.receiveShadow = b.receiveShadow = true;
  f.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: .5, side: THREE.DoubleSide });
  return { f, b, t };
}
function makePerson(who, Hm = .052) {
  const c = cv(P.PW, P.PH); P.drawPerson(who, c.getContext('2d'), {});
  const D = dynPlane(c, Hm * P.PH / (P.FOOT - 60), .5, P.FOOT / P.PH);
  const root = new THREE.Group(), body = new THREE.Group(); body.add(D.f, D.b); root.add(body); book.stage.add(root);
  const shadow = blobShadow(Hm * .3, .5); book.stage.add(shadow);
  let key = '';
  return { root, body, shadow, Hm,
    pose(p) { const k = JSON.stringify(p, (kk, v) => typeof v === 'number' ? Math.round(v * 30) / 30 : v); if (k === key) return; key = k; P.drawPerson(who, c.getContext('2d'), p); D.t.needsUpdate = true; },
    head(v = new THREE.Vector3()) { return v.set(0, Hm * 1.0, 0).applyMatrix4(body.matrixWorld); } };
}
const YOU = makePerson('youssef'), MIA = makePerson('mia', .049);
const bag = cutMesh(P.suitcase(.022)); book.stage.add(bag);

const blinkAt = (t, o = 0) => { const p = (t + o) % 3.9; return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; };
const talking = (who, t) => TL.talk.some(([a, b, w]) => w === who && t >= a && t <= b);
const mouthAt = (who, t, rest = 'smile') => talking(who, t) ? (Math.sin(t * 2 * Math.PI * 4.6) > -.2 ? 'talk' : 'flat') : rest;
function walk(t, t0, t1, a, b) { const k = seg(t, t0, t1), x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k), d = Math.hypot(b[0] - a[0], b[1] - a[1]) * k; return { x, z, ph: d / .02 * TAU, moving: t > t0 && t < t1 }; }
const walking = (S, w) => { if (w.moving) { S.pose.walk = w.ph; S.pose.stride = 1; S.y += Math.abs(Math.sin(w.ph)) * .0012; S.pose.armL = .2 + Math.sin(w.ph) * .45; S.pose.armR = .2 - Math.sin(w.ph) * .45; } };
const retakeBub = i => BUBW.filter(b => b.t0 > T.retake - .5)[i];

function youState(t) {
  const S = { vis: false, x: 0, y: 0, z: .175, face: 1, s: 1, pose: { blink: blinkAt(t), mouth: mouthAt('youssef', t), armL: .12, armR: .12 }, bag: false };
  const p = S.pose;
  if (t >= T.youWalk[0] - .3 && t < T.turn1[0] + .4) {
    S.vis = true; S.s = eo(seg(t, T.youWalk[0] - .3, T.youWalk[0])) * (1 - ss(seg(t, T.turn1[0], T.turn1[0] + .4)));
    const w = walk(t, T.youWalk[0], T.youWalk[1], [-.2, .18], [-.045, .175]); S.x = w.x; S.z = w.z; walking(S, w); S.bag = true;
    if (t > T.wrongStart - .2 && t < T.sorry) { p.armR = lerp(.12, 2.3, ss(seg(t, T.wrongStart - .2, T.wrongStart + .1))) * (1 - ss(seg(t, T.wrongStart + 1.2, T.wrongStart + 1.6))); p.eyes = 'open'; p.brows = 'up'; }
    if (t > T.wrongStart + 1.3 && t < T.sorry) { p.look = [.6, 0]; p.mouth = talking('youssef', t) ? p.mouth : 'smile'; p.sweat = t > T.wrongStart + 2.2; }
    if (t >= T.embarrassed) { p.eyes = t < T.intro + 3 ? 'wide' : 'closed'; p.mouth = 'worried'; p.brows = 'worried'; p.blush = 1; p.sweat = 1; p.look = [.5, .2];
      if (t > T.intro + 3) { p.armR = 2.7 + Math.sin(t * 9) * .15; p.mouth = 'grin'; p.eyes = 'happy'; } }
    return S;
  }
  if (t >= T.rise1 && t < T.turn2[0] + .4) {   // on the phrase board, right side, facing left
    S.vis = true; S.x = .178; S.z = .225; S.face = -1; S.s = eo(seg(t, T.rise1, T.rise1 + .3)) * (1 - ss(seg(t, T.turn2[0], T.turn2[0] + .4)));
    p.look = [.2, 0]; if (talking('youssef', t)) { p.armR = 1.1; p.eyes = 'open'; }
    return S;
  }
  const enter = T.retake - 3.6;
  if (t >= enter && t < T.close[0] + .5) {
    S.vis = true; S.bag = true; S.s = eo(seg(t, enter - .3, enter)) * (1 - ss(seg(t, T.close[0], T.close[0] + .45)));
    const w = walk(t, enter, enter + 2.6, [-.2, .18], [-.045, .175]); S.x = w.x; S.z = w.z; walking(S, w);
    const b1 = retakeBub(1); if (b1 && t > b1.t0 - .2 && t < b1.t1) { p.armR = 2.3 + Math.sin(t * 8) * .12; p.eyes = 'open'; }
    if (t > T.perfect && t < T.perfect + 1.5) { p.eyes = 'happy'; p.mouth = 'grin'; }
    if (t > T.wave) { p.armR = 2.4 + Math.sin(t * 8) * .25; p.eyes = 'happy'; if (!talking('youssef', t)) p.mouth = 'open'; }
    return S;
  }
  return S;
}
function miaState(t) {
  const S = { vis: false, x: .04, y: 0, z: .165, face: -1, s: 1, pose: { blink: blinkAt(t, 1.7), mouth: mouthAt('mia', t), armL: .12, armR: .12 } };
  const p = S.pose;
  if (t >= T.miaOut[0] && t < T.turn1[0] + .4) {
    S.vis = true; S.s = eo(seg(t, T.miaOut[0], T.miaOut[0] + .25)) * (1 - ss(seg(t, T.turn1[0], T.turn1[0] + .4)));
    const w = walk(t, T.miaOut[0], T.miaOut[1], [-.005, .06], [.04, .165]); S.x = w.x; S.z = w.z; walking(S, w); S.face = t < T.miaOut[1] - .2 ? 1 : -1;
    const b0 = BUBW[0]; if (t > b0.t0 - .2 && t < b0.t1) { p.armR = 2.4 + Math.sin(t * 9) * .2; p.eyes = 'happy'; }
    if (t > T.wrongStart + 1 && t < T.intro + 2) { p.eyes = 'wide'; p.brows = 'up'; p.look = [.4, 0]; if (!talking('mia', t)) p.mouth = 'o'; }
    if (t > T.intro + 3) { p.eyes = 'happy'; }
    return S;
  }
  if (t >= T.rise1 && t < T.turn2[0] + .4) {
    S.vis = true; S.x = -.178; S.z = .225; S.face = 1; S.s = eo(seg(t, T.rise1, T.rise1 + .3)) * (1 - ss(seg(t, T.turn2[0], T.turn2[0] + .4)));
    if (talking('mia', t)) { p.armR = 1.2; }
    if (t > T.repeat) { p.armR = 1.6 + Math.sin(t * 3) * .2; p.eyes = 'happy'; }
    return S;
  }
  if (t >= T.rise3 - .2 && t < T.close[0] + .5) {
    S.vis = true; S.s = eo(seg(t, T.rise3, T.rise3 + .3)) * (1 - ss(seg(t, T.close[0], T.close[0] + .45)));
    const step = T.retake - 3.4;
    if (t < step) { S.x = 0; S.z = .2; S.face = 1; p.look = [-.3, .3];
      if (t > T.yourTurn - .2 && t < T.countdown[0]) { p.armR = 1.5; p.eyes = talking('mia', t) ? 'open' : 'happy'; }
      if (t >= T.countdown[0] && t < T.countdown[1]) { p.armL = 1.0; p.armR = .4; p.mouth = 'smile'; p.brows = 'up'; }
    } else { const w = walk(t, step, step + 1.3, [0, .2], [.04, .165]); S.x = w.x; S.z = w.z; walking(S, w); S.face = t < step + 1.2 ? 1 : -1; }
    const b0 = retakeBub(0); if (b0 && t > b0.t0 - .2 && t < b0.t1) { p.armR = 2.4 + Math.sin(t * 9) * .2; p.eyes = 'happy'; }
    if (t > T.wave) { p.armR = 2.4 + Math.sin(t * 7) * .25; p.eyes = 'happy'; }
    return S;
  }
  return S;
}

// ---------- lights ----------
const lampHead = new THREE.Vector3(-.28, .375, .44);
const spot = new THREE.SpotLight('#fff0dc', 0, 3, .75, .55, 2); spot.position.copy(lampHead); spot.target.position.set(.02, 0, .2);
spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.00006; spot.shadow.normalBias = .0004; spot.shadow.radius = 5; spot.shadow.camera.near = .05; spot.shadow.camera.far = 2;
scene.add(spot, spot.target);
const sun = new THREE.DirectionalLight('#fff3e0', 0); sun.castShadow = true; sun.shadow.mapSize.set(3072, 3072); sun.shadow.bias = -.00008; sun.shadow.normalBias = .0003; sun.shadow.radius = 4;
Object.assign(sun.shadow.camera, { left: -.3, right: .3, top: .3, bottom: -.3, near: .1, far: 3 }); sun.target.position.set(0, .05, .12); scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#cfe6ff', '#caa27a', 0); scene.add(hemi);

// ---------- particles: sparkles on opening, puffs ----------
function spriteTex(fn, n = 64) { const c = cv(n, n), x = c.getContext('2d'); fn(x, n); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const starTex = spriteTex((x, n) => { x.translate(n / 2, n / 2); x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? n * .1 : n * .48; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); }, 128);
const puffTex = spriteTex((x, n) => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, cx = n / 2 + Math.cos(a) * n * .15, cy = n / 2 + Math.sin(a) * n * .15, g = x.createRadialGradient(cx, cy, 0, cx, cy, n * .3); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); } }, 128);
const quad = new THREE.PlaneGeometry(1, 1), camQ = new THREE.Quaternion();
const bb = fn => (i, t) => { const p = fn(i, t); if (p) { const e = new THREE.Euler().setFromQuaternion(camQ); p.rx = e.x; p.ry = e.y; p.rz = e.z + (p.spin || 0); } return p; };
const PS = [];
const SPARK = [T.open[0] + .5, T.rise1 - .3, T.perfect];
const sparkle = particles(quad, new THREE.MeshBasicMaterial({ map: starTex, color: new THREE.Color(2.4, 1.9, .9), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 120, bb((i, t) => {
  const R = mulberry(i * 13 + 5), s0 = SPARK[i % 3], t0 = s0 + R() * 2.2, life = 1 + R(), k = (t - t0) / life; if (k < 0 || k > 1) return null;
  const x = lerp(-.2, .2, R()), z = lerp(.04, .26, R());
  return { x: x + Math.sin(k * 6 + i) * .01, y: k * (.08 + R() * .08), z, s: .006 * Math.sin(k * Math.PI) * (.5 + R()), spin: t * 2 + i };
}));
book.stage.add(sparkle); PS.push(sparkle);
const PUFFS = [[WK.arabic - .15, 0, .006, .14, 1], [WK.metooCrumple, 0, .01, .12, .8], [T.youWalk[0] - .3, -.2, .0, .18, .5], [T.retake - 3.9, -.2, 0, .18, .5]];
const puffs = particles(quad, new THREE.MeshBasicMaterial({ map: puffTex, transparent: true, depthWrite: false, color: '#fffaf0' }), PUFFS.length * 7, bb((i, t) => {
  const P0 = PUFFS[(i / 7) | 0], j = i % 7, k = (t - P0[0]) / .55; if (k < 0 || k > 1) return null;
  const a = j / 7 * TAU, r = .014 * P0[4] * eo(k);
  return { x: P0[1] + Math.cos(a) * r, y: P0[2] + .004 * P0[4] + Math.abs(Math.sin(a)) * r * .6, z: P0[3] + Math.sin(a) * r * .3, s: .014 * P0[4] * (.6 + k) * (1 - k * k) };
}));
book.stage.add(puffs); PS.push(puffs);

// ---------- camera ----------
// [t, px,py,pz, tx,ty,tz, fov, aper]  (world: stage + PG)
const Y = PG, CARDW = i => { const [x, st, z] = CARD_POS[i]; return [x, Y + st + .032, z]; };
const cardShot = (t, i, d = .24) => { const [x, y, z] = CARDW(i); return [t, x * .55, y + .03, z + d, x * .8, y - .004, z, 30, 2.6]; };
const boardKeys = [[T.turn1[0] + .3, .06, .3, .78, 0, .05, .12, 30, 1.8], [T.rise1, .0, .14, .55, 0, .06, .1, 30, 2]];
{ // close on each card while the narrator explains it; wide when a character speaks the phrase
  const WIDE = t => [t, 0, .13, .64, 0, .062, .12, 32, 2.0];
  TL.cards.forEach((c, i) => {
    const next = i + 1 < TL.cards.length ? TL.cards[i + 1].t : T.allCards;
    const sp = BUBW.filter(b => b.t0 > c.t && b.t0 < next);
    boardKeys.push(cardShot(c.t - .5, i));
    if (sp.length) { boardKeys.push(cardShot(Math.max(c.t + 1, sp[0].t0 - 1.1), i, .26)); boardKeys.push(WIDE(sp[0].t0 - .3)); boardKeys.push(WIDE(Math.min(next - 1.2, sp[sp.length - 1].t1 + .2))); }
    else boardKeys.push(cardShot(c.t + 2.5, i, .26));
  });
}
boardKeys.push([T.allCards, 0, .13, .64, 0, .07, .12, 32, 2.0], [T.repeatEnd, 0, .135, .66, 0, .07, .12, 32, 2.0]);
const SH = [
  [ // desk → book opens → London two-shot
    [0, .46, .28, 1.08, -.04, .1, .2, 34, 3], [T.open[1], .1, .2, .72, 0, .08, .14, 30, 3], [T.rise0 + 1.6, -.01, .09, .5, -.01, .055, .14, 30, 2.4],
    [T.wrongStart - .5, -.005, .075, .43, -.005, Y + .035, .17, 30, 2.4], [T.silence, -.03, .07, .38, -.03, Y + .036, .17, 30, 2.5],
    [T.sorry + .6, -.045, .066, .31, -.045, Y + .036, .175, 30, 2.6], [T.intro + 4, -.04, .068, .32, -.04, Y + .036, .175, 30, 2.6],
    [T.title[0], -.01, .13, .56, -.005, .07, .13, 30, 2.2], [T.turn1[0] + .2, .02, .2, .66, 0, .07, .12, 30, 2],
  ],
  boardKeys,
  [ // workshop
    [T.turn2[0] + .3, .06, .3, .78, 0, .05, .12, 30, 1.8], [T.rise2 + .3, 0, .13, .42, 0, Y + .01, .1, 30, 2.2], [WK.k1 + 1.2, 0, .07, .3, 0, Y + .018, .14, 30, 2.6],
    [WK.arabic + .6, 0, .12, .36, 0, Y + .02, .06, 30, 2.4], [engRow + .5, .005, .13, .34, .005, Y + .015, .09, 30, 2.4],
    [WK.am - 1.8, .06, .22, .3, .03, Y, .1, 30, 2.6], [WK.am + .9, .03, .2, .28, .01, Y, .1, 30, 2.6],
    [WK.fold - .4, -.005, .11, .31, -.005, Y + .012, .1, 30, 2.7], [WK.fold + 2, 0, .12, .33, 0, Y + .012, .1, 30, 2.6],
    [row2 - .2, 0, .12, .38, 0, Y + .01, .17, 30, 2.4], [WK.is - 1.5, .02, .2, .4, 0, Y, .18, 30, 2.5], [WK.is + 1.4, 0, .17, .4, 0, Y + .005, .18, 30, 2.5],
    [WK.clear, 0, .12, .42, 0, Y + .01, .12, 30, 2.4], [WK.metoo, 0, .09, .34, 0, Y + .012, .12, 30, 2.6], [WK.too + 1, 0, .1, .36, 0, Y + .012, .14, 30, 2.6], [T.turn3[0], 0, .12, .4, 0, Y + .01, .13, 30, 2.4],
  ],
  [ // London again: your turn (Mia close), retake two-shot, close
    [T.turn3[0] + .3, .06, .3, .78, 0, .05, .12, 30, 1.8], [T.rise3 + .4, 0, .08, .46, 0, Y + .035, .2, 30, 2.2],
    [T.yourTurn, 0, .066, .34, 0, Y + .034, .2, 30, 2.6], [T.countdown[1], 0, .064, .32, 0, Y + .034, .2, 30, 2.6],
    [T.retake - 3.8, -.01, .085, .48, -.01, Y + .035, .16, 30, 2.4], [T.retake + 1, -.005, .075, .43, -.005, Y + .035, .17, 30, 2.4],
    [T.perfect - .3, -.03, .07, .38, -.035, Y + .036, .17, 30, 2.5], [T.perfect + 2, -.01, .074, .42, -.01, Y + .035, .17, 30, 2.4],
    [T.cta, -.005, .08, .45, -.005, Y + .035, .17, 30, 2.4], [T.close[0], .02, .16, .62, 0, .07, .13, 30, 2.2], [T.dur, .3, .55, 1.25, 0, .06, .18, 34, 3.2],
  ],
];
const SHOTS = SH.map(keys => ({ t0: keys[0][0], f: track(keys.map(k => [k[0], k.slice(1, 9)])) }));
function camAt(t) { let s = SHOTS[0]; for (const S of SHOTS) if (t >= S.t0) s = S; const v = s.f(t); return { pos: new THREE.Vector3(v[0], v[1], v[2]), tgt: new THREE.Vector3(v[3], v[4], v[5]), fov: v[6], aper: v[7] }; }

// ---------- sound events ----------
const EV = [];
EV.push({ t: T.open[0], type: 'creak' }, { t: T.open[1] - .2, type: 'thump' }, { t: T.open[0] + .6, type: 'sparkle', d: 2.4 });
for (const r of POPS) if (r.t0 < 1e8 && r.dir !== 0) EV.push({ t: r.t0 + .1, type: 'pop' });
for (const [a, b] of TURNS) EV.push({ t: a + .45, type: 'page', d: b - a - .7 });
EV.push({ t: T.doorOpen, type: 'door' }, { t: T.crumple, type: 'crumple' }, { t: T.crumple + .9, type: 'paperhit' }, { t: T.title[0] + .4, type: 'tink' }, { t: T.title[0] + .55, type: 'tink' });
EV.push({ t: WK.k1, type: 'roll', d: 1.2 }, { t: WK.arabic - .15, type: 'poof' }, { t: WK.am - .55, type: 'slide', d: .55 }, { t: WK.am, type: 'snap' }, { t: WK.am, type: 'sting' });
EV.push({ t: WK.fold, type: 'fold', d: .4 }, { t: WK.fold + .35, type: 'sting' }, { t: WK.is - .55, type: 'slide', d: .55 }, { t: WK.is, type: 'snap' }, { t: WK.is, type: 'sting' });
EV.push({ t: WK.metooCrumple, type: 'crumple' }, { t: WK.too, type: 'nice' });
for (let i = 0; i < 4; i++) EV.push({ t: T.countdown[0] + i, type: 'tick' });
EV.push({ t: T.countdown[1], type: 'ding' }, { t: T.perfect, type: 'perfect' }, { t: T.nice, type: 'nice' }, { t: T.close[1] - .1, type: 'thump' }, { t: T.close[0] + .2, type: 'page', d: 1.6 });
for (const r of TL.rep) EV.push({ t: r.say, type: 'yourturn' });
for (const b of BUBW) EV.push({ t: b.t0, type: 'bubble' });
for (const e of HUD.blipTimes(BUBW)) EV.push(e);
{ for (const st of [youState, miaState]) { let prev = 0; for (let f = 0; f < DUR * 30; f++) { const t = f / 30, s = st(t), ph = s.pose.walk || 0; if (s.vis && s.pose.stride && Math.floor(ph / Math.PI) !== Math.floor(prev / Math.PI)) EV.push({ t, type: 'step' }); prev = ph; } } }
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.DUR = DUR;

// ---------- render ----------
const toScreen = v => { const p = v.clone().project(cam); if (p.z > 1) return null; return [(p.x * .5 + .5) * W, (-p.y * .5 + .5) * H]; };
const tmpV = new THREE.Vector3();
function placePerson(A_, S) {
  A_.root.visible = A_.shadow.visible = S.vis && S.s > .01; if (!A_.root.visible) return;
  A_.pose(S.pose); A_.root.position.set(S.x, S.y, S.z); A_.body.scale.set(S.face * S.s, S.s, S.s);
  A_.shadow.position.set(S.x, .0004, S.z); A_.shadow.scale.setScalar(S.s);
}
window.render = function (t) {
  // book open/close
  const op = eio(seg(t, T.open[0], T.open[1])) * (1 - eio(seg(t, T.close[0] + .3, T.close[1])));
  book.setOpen(Math.PI / 2 * op);
  let spread = 0; for (let i = 0; i < 3; i++) if (t >= TURNS[i][0] + .45) spread = i + 1;
  let turning = -1; for (let i = 0; i < 3; i++) if (t >= TURNS[i][0] + .45 && t < TURNS[i][1] - .3) turning = i;
  book.groundMat.map = SPREAD[spread].ground; book.groundMat.needsUpdate = true;
  book.backMat.map = SPREAD[turning >= 0 ? turning : spread].sky; book.backMat.needsUpdate = true;
  if (turning >= 0) {
    const a = TURNS[turning][0] + .45, b = TURNS[turning][1] - .3;
    book.leafFront.material.map = SPREAD[turning].ground; book.leafBack.material.map = SPREAD[turning + 1].sky;
    book.leafFront.material.emissiveMap = book.leafFront.material.map; book.leafBack.material.emissiveMap = book.leafBack.material.map;
    book.leafFront.material.needsUpdate = book.leafBack.material.needsUpdate = true; book.setLeaf(eio(seg(t, a, b)));
  } else book.setLeaf(0);
  // pop-ups
  for (const r of POPS) {
    const k = riseOf(r, t); r.g.visible = k > .002; if (!r.g.visible) continue;
    r.g.rotation.x = r.dir * (Math.PI / 2) * (1 - k); r.g.scale.setScalar(r.dir === 0 ? Math.max(k, .001) : 1);
    if (r.sway) r.m.rotation.z = Math.sin(t * 1.6 + r.ph) * r.sway * k;
  }
  // London mechanisms
  for (const s of [0, 3]) { const E = EXL[s], vis = t > RISE[s] && t < FOLD[s] + 1; E.cloud1.visible = E.cloud2.visible = vis;
    for (const [c, y, ph] of [[E.cloud1, .21, 1], [E.cloud2, .235, 2]]) c.position.y = y + (1 - spring(t - RISE[s] - .4 - ph * .1, 4, .4)) * .16 + Math.sin(t * .8 + ph) * .002 + ss(seg(t, FOLD[s], FOLD[s] + .5)) * .2; }
  EXL[0].door.rotation.y = -1.9 * back(seg(t, T.doorOpen, T.doorOpen + .4), 1.5) * (1 - ss(seg(t, T.miaOut[1], T.miaOut[1] + .6)) * .95);
  EXL[3].door.rotation.y = 0;
  // board: cards bounce while being repeated
  CARDS.forEach((r, i) => { r.m.position.y = 0; r.m.scale.setScalar(1); });
  const REPMAP = [0, 2, 3, 4, 4, 5];
  for (const rp of TL.rep) { if (t > rp.t && t < rp.end) { const r = CARDS[REPMAP[rp.i]], k = seg(t, rp.t, rp.t + .5); r.m.position.y = Math.sin(k * Math.PI) * .012; r.m.scale.setScalar(1 + .06 * Math.sin(seg(t, rp.t, rp.end) * Math.PI)); } }
  for (const c of TL.cards) { const r = CARDS[c.i]; if (t > c.t + .6 && t < c.t + 1.4) r.m.position.y += Math.sin(seg(t, c.t + .6, c.t + 1.4) * TAU) * .003; }
  // workshop mechanics
  { // the crumpled ball rolls in, then poofs into the lesson
    const k = seg(t, WK.k1, WK.k1 + 1.2), on = t > WK.k1 && t < WK.arabic - .1 && spread === 2;
    WP.ball.g.visible = on; WP.ball.g.rotation.x = 0; WP.ball.g.position.set(lerp(.24, 0, eo(k)), 0, .14); WP.ball.m.rotation.z = -lerp(.24, 0, eo(k)) / .02; WP.ball.m.position.y = .014 * 0;
    WP.ball.g.scale.setScalar(on ? 1 - ss(seg(t, WK.arabic - .4, WK.arabic - .1)) * .99 : 1);
  }
  const slide = (r, tab, tA) => { const k = back(seg(t, tA - .55, tA), 1.2); r.g.position.x = lerp(.29, -.012, k); tab.g.position.x = r.g.position.x; };
  slide(WP.am, WP.tab1, WK.am); slide(WP.is, WP.tab2, WK.is);
  for (const [r, z] of [[WP.am, ROW1], [WP.is, ROW2]]) { const k = clamp(riseOf(r, t)); r.g.visible = k > .002 && t < r.t1 + .4; r.g.scale.setScalar(1); r.g.rotation.x = 0; }
  { // I + am fold into I'm; Youssef slides left
    const f = seg(t, WK.fold, WK.fold + .35), g = seg(t, WK.fold + .2, WK.fold + .5);
    if (t > WK.fold) { WP.am.g.scale.x = Math.max(.001, 1 - f); WP.I.g.scale.x = Math.max(.001, 1 - ss(f * 2)); }
    WP.Im.g.scale.x = Math.max(.001, ss(g));
    WP.you1.g.position.x = lerp(.075, .045, ss(seg(t, WK.fold + .2, WK.fold + .6)));
  }
  { // "Me too." crumples, rolls away
    const on = t > WK.metooCrumple && t < WK.metooCrumple + 1.6, k = seg(t, WK.metooCrumple, WK.metooCrumple + 1.4);
    WP.ball2.g.visible = on; WP.ball2.g.rotation.x = 0; WP.ball2.g.position.set(lerp(0, -.27, ss(k)), 0, .12); WP.ball2.m.rotation.z = lerp(0, -.27, ss(k)) / -.012;
    WP.ball2.g.scale.setScalar(on ? eo(seg(t, WK.metooCrumple, WK.metooCrumple + .15)) : 1);
  }
  // characters
  const ys = youState(t), ms = miaState(t);
  placePerson(YOU, ys); placePerson(MIA, ms);
  bag.visible = ys.vis && ys.bag && ys.s > .01; if (bag.visible) { bag.position.set(ys.x - .03, 0, ys.z - .004); bag.scale.setScalar(ys.s); }
  // lights
  const inStory = seg(t, T.open[0] + .4, T.open[1] + 1) * (1 - seg(t, T.close[0], T.close[1] + .5));
  sun.intensity = inStory * 2.5; sun.position.set(-.35, .55, .75);
  spot.intensity = (1 - inStory) * 2.2 + inStory * .35; hemi.intensity = .15 + inStory * .5;
  scene.environmentIntensity = .42 * (1 - inStory) + inStory * .35; scene.backgroundIntensity = .6 + scene.environmentIntensity * .4;
  // camera
  const C = camAt(t);
  cam.position.copy(C.pos); cam.fov = C.fov; cam.lookAt(C.tgt); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); camQ.copy(cam.quaternion);
  post.dof.focus = C.pos.distanceTo(C.tgt); post.dof.aper = C.aper; post.dof.maxCoc = 12;
  post.vig.uniforms.fade.value = 1; post.vig.uniforms.warm.value = .12; post.bloom.strength = .2;
  for (const p of PS) p.userData.update(t);
  scene.updateMatrixWorld(true);
  post.composer.render();
  // overlay
  OX.clearRect(0, 0, W, H);
  const an = {}; if (ys.vis && ys.s > .5) an.youssef = toScreen(YOU.head(tmpV)); if (ms.vis && ms.s > .5) an.mia = toScreen(MIA.head(tmpV));
  const wrong = BUBW.find(b => b.text.startsWith('Hello! I...'));
  HUD.drawBubbles(OX, t, BUBW, an, (b, tt) => b === wrong && tt >= T.crumple);
  if (wrong) HUD.drawCrumpledBubble(OX, t, wrong, an.youssef, T.crumple);
  HUD.drawTitle(OX, t, T.title, 'LESSON 1', "Hello! I'm Youssef", 'الدرس الأول · أهلًا! أنا يوسف');
  const yp = an.youssef ? [an.youssef[0], an.youssef[1] - 60] : null;
  HUD.drawAction(OX, t, [{ t0: T.perfect, text: 'PERFECT!', p: yp, col: ['#fff35a', '#ff9a2e'] }, { t0: T.nice, text: 'NICE!', p: yp, col: ['#a8f0ff', '#3fa1ff'] },
    { t0: WK.too + .3, text: 'RIGHT!', p: [960, 330], col: ['#c9ff9a', '#3fbf5a'] }]);
  for (const rp of TL.rep) HUD.drawTurnBadge(OX, t, rp.say, rp.end, 'دورك… قولها!', null);
  HUD.drawCountdown(OX, t, T.countdown);
  HUD.drawCTA(OX, t, T.cta + .6, T.next);
  HUD.drawNext(OX, t, T.next + .3, T.close[1] + .8);
  HUD.drawSubs(OX, t, TL.subs);
  if (t < .8 || t > DUR - 1.4) { OX.fillStyle = `rgba(0,0,0,${1 - seg(t, 0, .8) * (1 - seg(t, DUR - 1.4, DUR - .1))})`; OX.fillRect(0, 0, W, H); }
};
window.render(0);
window.READY = true;
