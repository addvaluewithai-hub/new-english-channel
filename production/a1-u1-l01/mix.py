"""Mix: voices (from timeline.json) + an original toy-box score + paper foley (from events.json) + ambience → out/mix.wav"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
sys.path.insert(0, os.environ.get('LIB', '/home/user/ref/lemo-opuscar') + '/core/audio')
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, creak, thump, step, ding, pop, whoosh, compress, limit, add

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'timeline.json'))); T = TL['T']; WK = T['work']
EV = json.load(open(os.path.join(HERE, 'events.json')))['ev']
DUR = T['dur']; N = int(DUR * SR) + SR
rng = np.random.default_rng(11)

# ---------------- voices ----------------
vox = np.zeros((N, 2)); cache = {}
def load(f):
    if f not in cache:
        x, sr = sf.read(os.path.join(HERE, 'voices', f)); x = x if x.ndim == 1 else x.mean(1)
        cache[f] = soxr.resample(x, sr, SR)
    return cache[f]
GAIN = {'nar': 1.0, 'mia': 1.0, 'youssef': 1.0}; PAN = {'nar': 0, 'mia': .12, 'youssef': -.12}
for p in TL['place']:
    x = load(p['file'])[int(p['s0'] * SR):int(p['s1'] * SR)].copy()
    f = int(.015 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    rms = np.sqrt(np.mean(x[np.abs(x) > .01] ** 2)) if np.any(np.abs(x) > .01) else .1
    x = hp(x, 90) * (.16 / rms)
    add(vox, x, p['t'], GAIN[p['role']], PAN[p['role']])
vox = np.stack([compress(vox[:, c], thr=.22, ratio=3) for c in range(2)], 1)
venv = np.abs(vox).max(1); from scipy.ndimage import maximum_filter1d, uniform_filter1d
speech = uniform_filter1d((maximum_filter1d(venv, int(.25 * SR)) > .02).astype(float), int(.3 * SR))

# ---------------- score ----------------
BPM = 96; B = 60 / BPM
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def musicbox(m, d=1.6, v=1.0):
    tt = t_(d); f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * f * k * tt) * env_exp(d, tau) for k, a, tau in [(1, 1, .9), (2.01, .35, .4), (3.98, .18, .15), (5.4, .08, .06)])
    return x * (1 - np.exp(-tt / .002)) * v
def pluck(m, d=.6, v=1.0):        # pizzicato-ish: decaying harmonics with a soft attack noise
    tt = t_(d); f = mtof(m)
    x = sum(np.sin(2 * np.pi * f * k * tt) * env_exp(d, .25 / k) / k for k in range(1, 6))
    return (x + lp(noise(d), 2000) * env_exp(d, .006) * .3) * v
def toy(m, d=.9, v=1.0):
    tt = t_(d); f = mtof(m)
    x = np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 3.02 * tt) * env_exp(d, .08) + .25 * np.sin(2 * np.pi * f * 4.1 * tt) * env_exp(d, .04)
    return x * env_exp(d, .35) * v
def clar(m, d=1.0, v=1.0):        # soft clarinet-like (odd harmonics, vibrato)
    tt = t_(d); f = mtof(m) * (1 + .004 * np.sin(2 * np.pi * 5 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + .35 * np.sin(3 * ph) + .12 * np.sin(5 * ph)
    e = np.minimum(1, tt / .06) * np.minimum(1, (d - tt) / .12)
    return x * e * v
def brush(d=.12, v=1.0): return hp(noise(d), 3000) * env_exp(d, .03) * v

mus = np.zeros((N, 2))
CH = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]            # C  Am  F  G
MEL = [76, 74, 72, 74, 76, 76, 76, None, 74, 74, 76, 74, 72, None, 79, None,
       76, 74, 72, 74, 76, 79, 77, 76, 74, 72, 74, 76, 72, None, None, None]   # 8 bars of quavers? (2 per beat → 4 bars)
def section(t0, t1, mel=True, bass=True, brushes=True, inst=musicbox, lvl=1.0, chords=True):
    bar = 0; t = t0
    while t < t1 - .05:
        ch = CH[bar % 4]
        if bass: add(mus, pluck(ch[0] - 12, .9, .5 * lvl), t, 1, -.2); add(mus, pluck(ch[0] - 5, .7, .32 * lvl), t + 2 * B, 1, -.2)
        if chords:
            for k in range(4):
                if t + k * B < t1: add(mus, toy(ch[(k % 3)] + 12, .8, .12 * lvl), t + k * B + B / 2, 1, .25)
        if brushes:
            for k in range(4):
                if t + k * B < t1: add(mus, brush(.12, .05 * lvl), t + k * B + B / 2, 1, .3)
        if mel:
            for k in range(8):
                m = MEL[(bar % 4) * 8 + k]; tt = t + k * B / 2
                if m and tt < t1: add(mus, inst(m, 1.4, .3 * lvl), tt, 1, .1)
        bar += 1; t += 4 * B
def sting(at, notes=(72, 76, 79, 84), v=.5):
    for i, m in enumerate(notes): add(mus, musicbox(m, 1.6, v), at + i * .07, 1, .15)

TU = T['turn1'], T['turn2'], T['turn3']
section(0.0, 2.9, mel=True, bass=False, brushes=False, lvl=.6)                     # desk: music box alone
section(2.9, T['silence'] - .3, lvl=1.0)                                           # London: full
section(T['intro'] + 1.0, T['title'][0], mel=False, brushes=False, lvl=.6)        # under the intro: soft bed
section(T['title'][0], TU[0][1] + .8, lvl=1.0)                                     # title: motif returns
section(TU[0][1], T['repeat'], mel=False, lvl=.55)                                 # phrase board: light bed
section(T['repeat'], T['repeatEnd'], mel=False, chords=False, brushes=True, lvl=.5)   # repeat round: pulse only
section(TU[1][0], WK['am'] - 1.1, inst=clar, mel=True, lvl=.45)                    # workshop: clarinet colour
section(WK['am'] + .3, WK['clear'], inst=clar, mel=False, lvl=.4)
section(WK['clear'], TU[2][0], inst=clar, mel=False, lvl=.4)
section(TU[2][0], T['yourTurn'], mel=False, lvl=.5)
section(T['retake'] - 3.8, T['cta'], lvl=.9)                                       # retake: full again
section(T['cta'], T['close'][1] + 1.6, mel=True, bass=True, brushes=False, lvl=.6)
for m, dt in zip([72, 76, 79, 84], [0, .25, .5, .9]): add(mus, musicbox(m, 2.6, .5), T['close'][1] + dt, 1, 0)   # final cadence
for e in EV:
    if e['type'] == 'sting': sting(e['t'], v=.45)
    if e['type'] == 'perfect': sting(e['t'], (72, 76, 79, 84, 88), .55)
    if e['type'] == 'nice': sting(e['t'], (79, 84), .45)
    if e['type'] == 'ding': sting(e['t'], (84,), .5)
# fade the score out before the held silence, and duck it under speech
def fade_out(at, d):
    a, b = int(at * SR), int((at + d) * SR); mus[a:b] *= np.linspace(1, 0, b - a)[:, None]
fade_out(T['silence'] - .45, .3)
duck = 1 - .72 * speech
mus *= duck[:, None]

# ---------------- foley ----------------
fx = np.zeros((N, 2))
def crinkle(d=.12, v=1.0):
    x = hp(noise(d), 2500) * (rng.random(int(round(d * SR))) > .82) * env_exp(d, d / 2.5); return norm(x) * v
def page(d=1.6):
    tt = t_(d); e = np.sin(np.pi * tt / d) ** 2
    return norm(bp(noise(d), 600, 5000) * e * (.6 + .4 * np.sin(2 * np.pi * 3 * tt)) + crinkle(d, .3)) * .6
def popup(): return norm(pop() * .8 + np.pad(crinkle(.1), (0, int(.08 * SR))) * .6)
def crumple():
    d = .55; x = np.zeros(int(d * SR))
    for i in range(14): s = int(rng.random() * (d - .06) * SR); c = crinkle(.05, .5 + rng.random()); x[s:s + len(c)] += c[:len(x) - s]
    return norm(x)
def click(f=2400, d=.04, v=1.0): tt = t_(d); return (np.sin(2 * np.pi * f * tt) * env_exp(d, .006) + hp(noise(d), 3000) * env_exp(d, .003) * .5) * v
def slide(d=.55): tt = t_(d); return norm(bp(noise(d), 800, 3500) * np.sin(np.pi * tt / d)) * .5
def door(): return norm(creak() * .8)
def tick(): return click(1800, .05, .9) + np.pad(click(3600, .03, .3), (0, int(.05 * SR) - int(.03 * SR)))
def sparkle_(d=2.4):
    x = np.zeros(int(d * SR))
    for i in range(16): s = int(rng.random() * (d - .5) * SR); b = ding(.12)[:int(.5 * SR)] * env_exp(.5, .12); x[s:s + len(b)] += b * (.6 + .4 * rng.random())
    return x
G = dict(pop=.32, page=.5, creak=.5, thump=.6, door=.45, crumple=.7, paperhit=.35, tink=.25, roll=.35, poof=.3, slide=.4, snap=.5, fold=.4,
         tick=.45, step=.12, sparkle=.25, bubble=.18, yourturn=.22)
for e in EV:
    k, t = e['type'], e['t']
    if k == 'pop': add(fx, popup(), t, G[k], float(rng.uniform(-.4, .4)))
    elif k == 'page': add(fx, page(max(.8, e.get('d', 1.6))), t, G[k])
    elif k == 'creak': add(fx, creak(), t, G[k]); add(fx, creak(), t + .25, G[k] * .7)
    elif k == 'thump': add(fx, thump(1, 80), t, G[k])
    elif k == 'door': add(fx, door(), t, G[k], .1)
    elif k == 'crumple': add(fx, crumple(), t, G[k])
    elif k == 'paperhit': add(fx, thump(1, 160) * .5 + np.pad(crinkle(.08), (0, int(.27 * SR))), t, G[k])
    elif k == 'tink': add(fx, ding(.4)[:int(.4 * SR)] * env_exp(.4, .1), t, G[k], .2)
    elif k == 'roll': d = e.get('d', 1); add(fx, crinkle(d, 1) * .6 + bp(noise(d), 200, 900) * env_exp(d, d) * .3, t, G[k])
    elif k == 'poof': add(fx, whoosh(.4, 1), t, G[k])
    elif k == 'slide': add(fx, slide(e.get('d', .55)), t, G[k], .3)
    elif k == 'snap': add(fx, click(1500, .05, 1) + thump(.4, 120)[:int(.05 * SR)], t, G[k])
    elif k == 'fold': add(fx, crinkle(.35, 1) + slide(.35) * .5, t, G[k])
    elif k == 'tick': add(fx, tick(), t, G[k])
    elif k == 'step': add(fx, step(), t, G[k], float(rng.uniform(-.2, .2)))
    elif k == 'sparkle': add(fx, sparkle_(e.get('d', 2.4)), t, G[k])
    elif k == 'bubble': add(fx, pop(.6), t, G[k])
    elif k == 'yourturn': add(fx, click(1200, .06, .8) + click(1600, .06, .6), t, G[k])

# ---------------- ambience ----------------
amb = np.zeros((N, 2))
room = lp(brown(DUR + 1), 400)[:N] * .025; amb += room[:, None]
def city(a, b):
    d = b - a; x = bp(noise(d), 150, 1200) * .012 * (.8 + .2 * np.sin(2 * np.pi * .13 * t_(d)))
    e = np.minimum(1, np.minimum(t_(d) / 1.0, (d - t_(d)) / 1.0)); add(amb, x * e, a, 1)
city(T['rise0'], T['turn1'][0] + 1); city(T['rise3'], T['close'][1])

mix = vox * 1.0 + mus * .55 + fx * .9 + amb
mix = np.stack([limit(mix[:, c], .95) for c in range(2)], 1)
mix = norm(mix, .89)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR)
print('mix written', round(len(mix) / SR, 2), 's')
