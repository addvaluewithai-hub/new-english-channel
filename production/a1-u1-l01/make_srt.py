"""Subtitles (.srt) from timeline.json: Arabic narration + English character lines"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB', '/home/user/ref/lemo-opuscar')
TL = json.load(open(os.path.join(HERE, 'timeline.json')))
cues = [dict(t0=s['t0'], t1=max(s['t1'] + .35, s['t0'] + 1.8), text=s['text']) for s in TL['subs']]
cues += [dict(t0=b['t0'] + .1, t1=max(b['t1'], b['t0'] + 1.8), text=('Mia: ' if b['who'] == 'mia' else 'Youssef: ') + b['text']) for b in TL['bubbles']]
cues.sort(key=lambda c: c['t0'])
for a, b in zip(cues, cues[1:]): a['t1'] = min(a['t1'], b['t0'] - .05)
json.dump(cues, open(os.path.join(HERE, 'out', 'cues.json'), 'w'), ensure_ascii=False)
subprocess.run([sys.executable, f'{LIB}/core/render/srt.py', os.path.join(HERE, 'out', 'cues.json'), os.path.join(HERE, 'lesson-01-hello-im-youssef.srt')], check=True)
