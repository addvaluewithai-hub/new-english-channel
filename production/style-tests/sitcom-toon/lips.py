# lip-sync envelopes from the finished voice track: RMS (open) + spectral centroid (wide/round) at 24 Hz
import sys, json, numpy as np, soundfile as sf
here = sys.argv[1]; wav = sys.argv[2]
x, sr = sf.read(wav, always_2d=True); x = x.mean(1)
hop = sr // 24; n = len(x) // hop
o, b = [], []
win = np.hanning(hop * 2)
for k in range(n):
    s = x[max(0, k * hop - hop // 2): k * hop + hop + hop // 2]
    if len(s) < hop * 2: s = np.pad(s, (0, hop * 2 - len(s)))
    r = np.sqrt(np.mean(s ** 2))
    F = np.abs(np.fft.rfft(s * win)); f = np.fft.rfftfreq(len(s), 1 / sr)
    c = (F * f).sum() / (F.sum() + 1e-9)
    o.append(r); b.append(c)
o = np.array(o); b = np.array(b)
ref = np.percentile(o[o > 1e-4], 95)
o = np.clip(o / ref, 0, 1) ** .7
b = np.clip((b - 800) / 2200, 0, 1)
json.dump({'fps': 24, 'o': [round(float(v), 3) for v in o], 'b': [round(float(v), 3) for v in b]}, open(f'{here}/lips.json', 'w'))
print(n, 'frames', 'dur', len(x) / sr)
