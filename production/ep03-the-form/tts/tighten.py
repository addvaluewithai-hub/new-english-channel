"""Tighten the counting clips: the voice counts with long pauses (~0.8 s between numbers) whatever the style asks, so every
silence longer than MAX is shortened to MAX (cut in its middle, with 10 ms fades); the transcript's word times are moved to match.
The untouched clips are kept in voices/orig/. Usage: python3 tighten.py r01 r02 r03 [--max .32]"""
import json, os, shutil, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, '..', 'voices')
args = sys.argv[1:]; MAX = .32
if '--max' in args: i = args.index('--max'); MAX = float(args[i + 1]); del args[i:i + 2]
os.makedirs(os.path.join(V, 'orig'), exist_ok=True)
for k in args:
    wav, tr = os.path.join(V, k + '.wav'), os.path.join(V, k + '.transcript.json')
    ow, ot = os.path.join(V, 'orig', k + '.wav'), os.path.join(V, 'orig', k + '.transcript.json')
    if not os.path.exists(ow): shutil.copy(wav, ow); shutil.copy(tr, ot)
    x, sr = sf.read(ow); mono = x if x.ndim == 1 else x.mean(1)
    hop = int(.01 * sr); n = len(mono) // hop
    rms = np.array([np.sqrt(np.mean(mono[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    quiet = rms < max(.004, np.percentile(rms, 95) * .04)
    # silent runs (in hops), not touching the clip's ends
    runs, i = [], 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if i > 0 and j < n and (j - i) * hop / sr > MAX: runs.append((i, j))
            i = j
        else: i += 1
    keep, cuts, prev = [], [], 0   # cuts: (time in the original, seconds removed before it)
    removed = 0.
    f = int(.01 * sr)
    for a, b in runs:
        A, B = a * hop, b * hop; mid = (A + B) // 2; half = int(MAX * sr / 2)
        c0, c1 = A + half, B - half            # remove [c0, c1)
        seg = x[prev:c0].copy(); seg[-f:] *= np.linspace(1, 0, f)[:, None] if seg.ndim > 1 else np.linspace(1, 0, f)
        keep.append(seg); removed += (c1 - c0) / sr; cuts.append((c1 / sr, removed)); prev = c1
    tail = x[prev:].copy()
    if keep: tail[:f] *= np.linspace(0, 1, f)[:, None] if tail.ndim > 1 else np.linspace(0, 1, f)
    keep.append(tail)
    y = np.concatenate(keep)
    sf.write(wav, y, sr)
    def move(ms):
        t = ms / 1000; r = 0.
        for at, rem in cuts:
            if t >= at - 1e-6: r = rem
        return int(round((t - r) * 1000))
    d = json.load(open(ot))
    for w in d['words']: w['start_ms'], w['end_ms'] = move(w['start_ms']), move(w['end_ms'])
    d['duration_ms'] = int(len(y) / sr * 1000); d['tightened'] = {'max_gap_s': MAX, 'removed_s': round(removed, 3)}
    json.dump(d, open(tr, 'w'), ensure_ascii=False, indent=1)
    print(k, f'{len(x) / sr:.2f}s -> {len(y) / sr:.2f}s ({len(runs)} gaps)')
