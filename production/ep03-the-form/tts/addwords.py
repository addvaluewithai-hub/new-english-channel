"""Anchor the English inside the Arabic narration: Gemini's ar-EG transcript drops the English words, so the timeline had to
estimate them. Whisper (small, Arabic) hears them (in Latin, or as Arabic-script look-alikes); its word times are moved onto
Gemini's clock (median offset over the Arabic words both recognise) and inserted into voices/<k>.transcript.json, marked
"src": "whisper" (re-running replaces them). Usage: <lemo venv python> addwords.py ar03 ar04 ...
Run after tighten.py (it reads the current, tightened wav)."""
import json, os, re, sys
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, '..', 'voices')
# Arabic-script spellings Whisper uses for the English of this episode -> the English word (normalised like tlkit.norm)
LOOK = {'سكستين': 'sixteen', 'سيكستين': 'sixteen', 'سكستي': 'sixty', 'سيكستي': 'sixty', 'تين': 'teen', 'هتي': 'ty', 'تي': 'ty',
        'لديك': 'have', 'سنوات': 'years', 'أولد': 'old', 'اولد': 'old'}
# per clip: which recognised words to take (in order) and what they are; '' = take a Latin word as it is
PLAN = {
    'ar03': [('i', 'i'), ('have', 'have'), ('26', '26'), ('years', 'years')],
    'ar04': [("i'm", "i'm"), ('26', '26'), ("i'm", "i'm"), ('tired', 'tired')],
    'ar05': [('سكستين', 'sixteen'), ('سكستي', 'sixty')],
    'ar08': [('تين', 'teen')],
    'ar09': [('هتي', 'ty')],
    'ar10': [('تين', 'teen'), ('تين', 'ty')],
    'ar11': [('how', 'how'), ('old', 'old'), ('are', 'are'), ('you', 'you'), ("i'm", "i'm")],
    'ar12': [('26', '26'), ('سنوات', 'years'), ('26', '26'), ('سنوات', 'years'), ('أولد', 'old')],
    'ar17': [('where', 'where'), ('are', 'are'), ('you', 'you'), ('from', 'from')],
}
norm = lambda w: re.sub(r"[^\w']", '', re.sub('[أإآ]', 'ا', w.lower()).replace('ة', 'ه').replace('ى', 'ي'))
m = WhisperModel('small', device='cpu', compute_type='int8')
for k in sys.argv[1:]:
    tr = os.path.join(V, k + '.transcript.json'); d = json.load(open(tr))
    d['words'] = [w for w in d['words'] if w.get('src') != 'whisper']
    segs, _ = m.transcribe(os.path.join(V, k + '.wav'), language='ar', word_timestamps=True, beam_size=5)
    ws = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
    # clock offset: Gemini start - Whisper start over shared Arabic words (Whisper clamps its first word to 0)
    gem = [(norm(w['text']), w['start_ms'] / 1000) for w in d['words']]
    offs = []
    for txt, a, b in ws[1:]:
        n = norm(txt)
        for g, t in gem:
            if n and n == g and abs(t - a) < 1.0: offs.append(t - a); break
    off = sorted(offs)[len(offs) // 2] if offs else 0.
    added, i = [], 0
    for want, eng in PLAN[k]:
        while i < len(ws) and norm(ws[i][0]) != norm(want): i += 1
        if i >= len(ws): print(k, 'not heard:', want); break
        txt, a, b = ws[i]; i += 1
        a = max(a + off, (added[-1]['end_ms'] / 1000 if added else 0) + .01)
        added.append({'text': eng, 'start_ms': int(a * 1000), 'end_ms': int(max(a + .12, b + off) * 1000), 'src': 'whisper'})
    if added and ws and norm(ws[0][0]) == norm(PLAN[k][0][0]):   # the first word: Whisper's 0.0 is a clamp — start at the voice's onset
        import numpy as np, soundfile as sf
        x, sr = sf.read(os.path.join(V, k + '.wav')); x = x if x.ndim == 1 else x.mean(1)
        e = np.abs(x); on = int(np.argmax(e > .1 * e.max())) / sr
        added[0]['start_ms'] = int(on * 1000)
    d['words'] = sorted(d['words'] + added, key=lambda w: w['start_ms'])
    d['whisper_words'] = {'offset_s': round(off, 3), 'n': len(added)}
    json.dump(d, open(tr, 'w'), ensure_ascii=False, indent=1)
    print(k, f'offset {off:+.2f}s', [(w['text'], w['start_ms']) for w in added])
