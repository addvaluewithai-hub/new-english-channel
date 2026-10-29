// Resumable render: the film is cut into chunks of CH seconds, each saved as out/chunks/c_NNNN.mp4 as soon as it is done.
// A restart skips finished chunks.   node render_chunks.mjs <film dir> [workers=2] [q] [chunkSec=8] [from=0] [to=all]
// SHARD=k NSHARDS=n renders only chunks with index % n == k (one machine of a GitHub Actions matrix); JOIN=0 skips the final join.
import fs from 'fs'; import path from 'path'; import { spawn, execFileSync } from 'child_process';
const LIB = process.env.LIB || '/home/user/ref/lemo-opuscar';
const { openDemo, closeServer } = await import(LIB + '/core/render/page.mjs');
const [dir, WK = '2', Q = 'res=0.75&taps=32', CH = '8', FROM = '0', TO = ''] = process.argv.slice(2);
const FPS = 24, out = path.join(dir, 'out', 'chunks'); fs.mkdirSync(out, { recursive: true });
const probe = await openDemo(dir, { q: Q }); const DUR = await probe.page.evaluate(() => window.DUR); await probe.browser.close();
const TOTAL = Math.round(DUR * FPS), per = Math.round(+CH * FPS), NCH = Math.ceil(TOTAL / per);
const NS = +(process.env.NSHARDS || 1), SK = +(process.env.SHARD || 0);
const todo = [...Array(NCH).keys()].filter(i => i % NS === SK && i >= +FROM && (TO === '' || i < +TO) && !fs.existsSync(path.join(out, `c_${String(i).padStart(4, '0')}.mp4`)));
console.log(`chunks ${NCH}, to render ${todo.length}`);
const t0 = Date.now(); let done = 0;
await Promise.all([...Array(+WK)].map(async (_, w) => {
  const mine = todo.filter((_, k) => k % +WK === w); if (!mine.length) return;
  const { browser, page } = await openDemo(dir, { q: Q });
  for (const i of mine) {
    const name = `c_${String(i).padStart(4, '0')}.mp4`, tmp = `tmp_${w}.mp4`;
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', tmp], { cwd: out, stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise(r => ff.on('close', r));
    for (let f = i * per; f < Math.min(TOTAL, (i + 1) * per); f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); if (await closed !== 0) { console.error('ffmpeg failed on', name); process.exit(1); }
    fs.renameSync(path.join(out, tmp), path.join(out, name)); done++;
    const el = (Date.now() - t0) / 1000; console.log(`${name} done ${done}/${todo.length}  ${el.toFixed(0)}s  eta ${((todo.length - done) * el / done / 60).toFixed(0)} min`);
  }
  await browser.close();
}));
// join when every chunk exists
const all = [...Array(NCH).keys()].map(i => `c_${String(i).padStart(4, '0')}.mp4`);
if (process.env.JOIN !== '0' && all.every(n => fs.existsSync(path.join(out, n)))) {
  fs.writeFileSync(path.join(out, 'list.txt'), all.map(n => `file '${n}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', '../video.mp4'], { cwd: out, stdio: 'inherit' });
  console.log('ALL DONE → out/video.mp4');
}
closeServer(); process.exit(0);
