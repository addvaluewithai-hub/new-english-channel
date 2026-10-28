// time render+screenshot for several quality settings: node bench.mjs (run from LIB root with the film dir as argv[2])
import { openDemo } from '/home/user/ref/lemo-opuscar/core/render/page.mjs';
const dir = process.argv[2];
for (const q of (process.argv[3] || 'x=1').split(',')) {
  const { browser, page } = await openDemo(dir, { q: q.replace(/;/g, '&') });
  for (const t of [9.5, 60]) await page.evaluate(t => window.render(t), t);   // warm-up
  const ts = [];
  for (const t of [9.6, 60.2, 140.5, 198]) { const a = Date.now(); await page.evaluate(t => window.render(t), t); await page.screenshot({ type: 'jpeg', quality: 95 }); ts.push(Date.now() - a); }
  console.log(q, ts.join(' '), 'avg', Math.round(ts.reduce((a, b) => a + b) / ts.length));
  await browser.close();
}
process.exit(0);
