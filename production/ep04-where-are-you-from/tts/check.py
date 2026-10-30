# Voice check: Gemini's recognized_text next to a Whisper (small) transcription of each clip.
# /home/user/ref/lemo-opuscar/.venv/bin/python check.py [key ...]   -> prints and writes check.json
import json, os, sys
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, '..', 'voices')
keys = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(V) if f.endswith('.wav'))
m = WhisperModel('small', device='cpu', compute_type='int8')
out = json.load(open(os.path.join(HERE, 'check.json'))) if os.path.exists(os.path.join(HERE, 'check.json')) else {}
for k in keys:
    tr = json.load(open(os.path.join(V, k + '.transcript.json')))
    lang = 'ar' if k.startswith('ar') else 'en'
    segs, _ = m.transcribe(os.path.join(V, k + '.wav'), language=lang, beam_size=5, word_timestamps=False)
    w = ' '.join(s.text.strip() for s in segs)
    out[k] = {'source': tr.get('source_text'), 'gemini': tr.get('recognized_text'), 'whisper': w, 'dur': tr.get('duration_ms')}
    print(f"== {k} ({tr.get('duration_ms')} ms)\n  src: {tr.get('source_text')}\n  gem: {tr.get('recognized_text')}\n  whi: {w}", flush=True)
json.dump(out, open(os.path.join(HERE, 'check.json'), 'w'), ensure_ascii=False, indent=1)
