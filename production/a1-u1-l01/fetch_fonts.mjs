// Download the film's fonts (OFL, Google Fonts) into fonts/ and write fonts.css
import fs from 'fs';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const fams = ['family=Fredoka:wght@500;600;700', 'family=Lilita+One', 'family=Baloo+Bhaijaan+2:wght@500;700;800', 'family=Lalezar'];
let out = '', n = 0; fs.mkdirSync('fonts', { recursive: true });
for (const f of fams) {
  let css = await (await fetch(`https://fonts.googleapis.com/css2?${f}&display=block`, { headers: { 'User-Agent': UA } })).text();
  for (const u of [...new Set(css.match(/https:\/\/[^)]+/g) || [])]) {
    const name = `f${n++}.woff2`;
    fs.writeFileSync('fonts/' + name, Buffer.from(await (await fetch(u)).arrayBuffer()));
    css = css.split(u).join('fonts/' + name);
  }
  out += css;
}
fs.writeFileSync('fonts.css', out); console.log('font files', n);
