"""Vertical Shorts (1080×1920) cut from the rendered episodes: blurred full-bleed background, the scene cropped to 4:3
in the middle, a hook headline on top and the series line + call to action at the bottom (overlay.html, rendered once).
python3 make_shorts.py [short id ...]   (needs the episode mp4s in production/<ep>/out/)"""
import json, os, subprocess, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
CHROME = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'

SHORTS = {
 'short_ep01': dict(
   ep='ep01-first-day',
   segs=[(35.84, 49.0), (49.0, 58.6), (95.75, 117.11)],          # the mistake + freeze, the second try, the am → I'm recap
   tag='أول يوم في نيويورك 😅', hook='إزاي تقول<br><em class="en">I\'m Youssef</em> صح؟',
   series='<b>يوسف في نيويورك</b> · الحلقة 1', pill='الحلقة كاملة على القناة'),
 'short_ep02': dict(
   ep='ep02-good-morning',
   segs=[(26.6, 50.2), (118.6, 129.5)],                          # Good… night, then the "Good night is a goodbye" recap card
   tag='الساعة 8 الصبح 😴', hook='قالها <em class="en">Good night</em><br>بدل <em class="en">Good morning</em>!',
   series='<b>يوسف في نيويورك</b> · الحلقة 2', pill='الحلقة كاملة على القناة'),
}
XF = .25   # crossfade between segments


def run(cmd):
    subprocess.run(cmd, check=True)


def overlay_png(sid, s):
    out = os.path.join(HERE, f'{sid}_overlay.png')
    q = urllib.parse.urlencode({k: s[k] for k in ('tag', 'hook', 'series', 'pill')})
    js = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const b = await chromium.launch({{ executablePath: '{CHROME}' }});
  const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
  await p.goto('file://{HERE}/overlay.html?{q}');
  await p.waitForSelector('body[data-ready]');
  await p.screenshot({{ path: '{out}', omitBackground: true }});
  await b.close();
}})();"""
    run(['node', '-e', js])
    return out


def make(sid):
    s = SHORTS[sid]
    src = os.path.join(ROOT, 'production', s['ep'], 'out', s['ep'] + '.mp4')
    ov = overlay_png(sid, s)
    n = len(s['segs'])
    f, last_v, last_a, acc = [], None, None, 0.0
    for i, (a, b) in enumerate(s['segs']):
        f.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS[a{i}]")
    for i in range(n):
        d = s['segs'][i][1] - s['segs'][i][0]
        if i == 0:
            last_v, last_a, acc = 'v0', 'a0', d
            continue
        f.append(f"[{last_v}][v{i}]xfade=transition=fade:duration={XF}:offset={acc - XF:.3f}[vx{i}];"
                 f"[{last_a}][a{i}]acrossfade=d={XF}[ax{i}]")
        last_v, last_a, acc = f'vx{i}', f'ax{i}', acc + d - XF
    # vertical layout: blurred, darkened full-bleed background + the scene cropped to 4:3 in the middle + overlay
    f.append(f"[{last_v}]split[bgs][fgs];"
             f"[bgs]scale=-2:1920,crop=1080:1920,boxblur=28:2,eq=brightness=-0.3:saturation=0.8[bg];"
             f"[fgs]crop=1720:1080:100:0,scale=1080:678:flags=lanczos[fg];"
             f"[bg][fg]overlay=0:680[comp];[comp][1:v]overlay=0:0,format=yuv420p[vout]")
    out = os.path.join(HERE, sid + '.mp4')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-loop', '1', '-i', ov,
         '-filter_complex', ';'.join(f), '-map', '[vout]', '-map', f'[{last_a}]', '-t', f'{acc:.3f}',
         '-r', '24', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '160k',
         '-movflags', '+faststart', out])
    print(sid, f'{acc:.1f} s →', out)


if __name__ == '__main__':
    for sid in (sys.argv[1:] or SHORTS):
        make(sid)
