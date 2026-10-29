"""Subtitles (.srt) from timeline.json: Youssef's Arabic diary + the English lines"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB', '/home/user/ref/lemo-opuscar')
T = json.load(open(os.path.join(HERE, 'timeline.json')))
NAME = {'mia': 'Mia', 'youssef': 'Youssef'}
cues = [dict(t0=n['t0'], t1=max(n['t1'] + .35, n['t0'] + 1.8), text=n['ar']) for n in T['narration']]
cues += [dict(t0=l['t0'], t1=max(l['t1'] + .3, l['t0'] + 1.5), text=f"{NAME[l['who']]}: {l['text']}") for l in T['lines']]
cues.sort(key=lambda c: c['t0'])
for a, b in zip(cues, cues[1:]): a['t1'] = min(a['t1'], b['t0'] - .05)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([sys.executable, f'{LIB}/core/render/srt.py', os.path.join(HERE, 'out', 'cues.json'),
                os.path.join(HERE, 'ep02-good-morning.srt')], check=True)
