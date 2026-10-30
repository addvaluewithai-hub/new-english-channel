"""Episode 3 mix: voices (timeline.json place) + the series theme + foley (events.json) + New York / school ambience -> out/mix.wav"""
import json, os, sys
import numpy as np, soundfile as sf, soxr
from scipy.ndimage import maximum_filter1d, uniform_filter1d
sys.path.insert(0, os.environ.get('LIB', '/home/user/ref/lemo-opuscar') + '/core/audio')
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, creak, thump, step, ding, pop, whoosh, compress, limit, add

HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, 'timeline.json')))
EV = json.load(open(os.environ.get('EVENTS', os.path.join(HERE, 'events.json'))))['ev']
SEC = {s['id']: (s['t0'], s['t1']) for s in T['sections']}
BT = T['beats']
DUR = T['dur']; N = int(DUR * SR) + SR
rng = np.random.default_rng(7)

# ---------------- voices ----------------
vox = np.zeros((N, 2)); dry_dia = np.zeros(N)
for p in T['place']:
    x, sr = sf.read(os.path.join(HERE, 'voices', p['clip'] + '.wav')); x = x if x.ndim == 1 else x.mean(1)
    x = soxr.resample(x, sr, SR)
    f = int(.01 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    loud = np.abs(x) > .01
    rms = np.sqrt(np.mean(x[loud] ** 2)) if loud.any() else .1
    x = hp(x, 85) * (.16 / rms)
    if p['clip'].startswith('ar'):          # the diary: close and warm, dead centre
        x = x + lp(x, 300) * .15
        add(vox, x, p['t'], 1.0, 0)
    else:                                   # the scene: a touch of street/hall room
        rev = np.zeros(len(x) + int(.3 * SR))
        for d, g in [(.023, .13), (.041, .09), (.067, .06), (.11, .035)]:
            s = int(d * SR); rev[s:s + len(x)] += lp(x, 3500) * g
        add(vox, np.concatenate([x, np.zeros(int(.3 * SR))]) + rev, p['t'], .95, 0)
vox = np.stack([compress(vox[:, c], thr=.22, ratio=3) for c in range(2)], 1)
venv = np.abs(vox).max(1)
speech = uniform_filter1d((maximum_filter1d(venv, int(.25 * SR)) > .02).astype(float), int(.3 * SR))

# ---------------- score: "Youssef in London" theme, F major, 104 bpm ----------------
BPM = 104; B = 60 / BPM
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
def uke(m, d=.9, v=1.0):        # nylon pluck: decaying harmonics, bright attack
    tt = t_(d); f = mtof(m)
    x = sum(np.sin(2 * np.pi * f * k * tt) * env_exp(d, .35 / k ** .8) / k ** 1.2 for k in range(1, 7))
    return (x + hp(noise(d), 2500) * env_exp(d, .004) * .25) * v
def glock(m, d=1.4, v=1.0):
    tt = t_(d); f = mtof(m)
    x = sum(a * np.sin(2 * np.pi * f * k * tt) * env_exp(d, tau) for k, a, tau in [(1, 1, .7), (2.76, .3, .25), (5.4, .12, .08)])
    return x * (1 - np.exp(-tt / .001)) * v
def bass(m, d=.5, v=1.0):
    tt = t_(d); f = mtof(m)
    x = np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt) * env_exp(d, .08)
    return x * np.minimum(1, tt / .01) * env_exp(d, .3) * v
def bassoon(m, d=.4, v=1.0):    # comic reed for the awkward moments
    tt = t_(d); ph = 2 * np.pi * np.cumsum(np.full(len(tt), mtof(m))) / SR
    x = np.tanh(2.5 * (np.sin(ph) + .5 * np.sin(2 * ph) + .3 * np.sin(3 * ph)))
    return lp(x, 1800) * np.minimum(1, tt / .03) * np.minimum(1, (d - tt) / .06) * v
def brush(d=.1, v=1.0): return hp(noise(d), 4000) * env_exp(d, .025) * v
def shaker(d=.07, v=1.0): return bp(noise(d), 5000, 11000) * np.sin(np.pi * t_(d) / d) * v

mus = np.zeros((N, 2))
CH = [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]]          # F  Dm  Bb  C
MEL = [72, 69, 72, 77, 76, 74, 72, None,  74, 72, 69, None, 69, 70, 72, None,
       70, 74, 77, 74, 72, 70, 69, 70,    72, None, 67, None, 72, 74, 76, None]
STRUM = [0, 1.5, 2, 3.5]                                                 # beats with a strum
def play(t0, t1, mel=True, strum=True, low=True, perc=True, lvl=1.0, bar0=0):
    bar, t = bar0, t0
    while t < t1 - .05:
        ch = CH[bar % 4]
        if low:
            add(mus, bass(ch[0] - 12, .45, .55 * lvl), t, 1, 0); add(mus, bass(ch[0] - 5, .4, .4 * lvl), t + 2 * B, 1, 0)
        if strum:
            for b in STRUM:
                if t + b * B < t1:
                    for i, m in enumerate(ch + [ch[0] + 12]):
                        add(mus, uke(m, .7, .09 * lvl), t + b * B + i * .012, 1, -.3)
        if perc:
            for k in range(8):
                if t + k * B / 2 < t1: add(mus, shaker(.07, .035 * lvl * (1.4 if k % 2 else 1)), t + k * B / 2, 1, .35)
            for k in (1, 3):
                if t + k * B < t1: add(mus, brush(.12, .07 * lvl), t + k * B, 1, .2)
        if mel:
            for k in range(8):
                m = MEL[(bar % 4) * 8 + k]; tt = t + k * B / 2
                if m and tt < t1: add(mus, glock(m + 12, 1.2, .2 * lvl), tt, 1, .2)
        bar += 1; t += 4 * B
def sting(at, notes=(72, 77, 81, 84), v=.45, dt=.07):
    for i, m in enumerate(notes): add(mus, glock(m, 1.6, v), at + i * dt, 1, .1)
def block(t0, t1, fade_in=.0, fade_out=.6, **kw):
    global mus
    keep = mus; mus = np.zeros((N, 2)); play(t0, t1 + fade_out, **kw)
    a, b = int(t0 * SR), int((t1 + fade_out) * SR)
    env = np.zeros(N); env[a:b] = 1
    if fade_in: env[a:a + int(fade_in * SR)] = np.linspace(0, 1, int(fade_in * SR))
    e0 = int(t1 * SR); env[e0:b] = np.linspace(1, 0, b - e0)
    mus = keep + mus * env[:, None]

o, dk, fx_, sx, rm, rc, tu, nx = (SEC[k] for k in ('open', 'desk', 'fix', 'sixty', 'room', 'recap', 'turn', 'next'))
# the opening walk: the theme, calm (he is early this time); the title sting; a soft strum carries us into the reception
block(o[0] + .3, BT['title'] - .1, fade_in=.8, mel=True, lvl=.5)
sting(BT['title'], v=.3)                                                          # title card
block(BT['title'] + .4, dk[0] + 1.2, mel=False, strum=True, perc=False, lvl=.45, fade_out=.8)
block(dk[0] + 1.4, BT['mistake'] - .2, fade_in=.6, mel=False, strum=True, perc=False, lvl=.3, fade_out=.25)   # the desk: a light strum
for i, (m, d) in enumerate([(50, .22), (49, .22), (48, .9)]):                    # the freeze: dun dun duuun (comic reed)
    add(mus, bassoon(m, d, .3), BT['freeze'] + .1 + i * .26, 1, 0)
for i, m in enumerate([69, 72, 77]): add(mus, glock(m + 12, 1.4, .25), BT['mia_enters'] + .1 + i * .12, 1, .1)   # Sara chime
block(BT['mia_enters'] + 1.2, BT['write'] - .3, fade_in=.8, mel=False, strum=True, perc=False, lvl=.35, fade_out=.3)
block(BT['write'] - .1, BT['sixteen'] - .25, mel=False, strum=True, perc=True, lvl=.35, fade_out=.15)       # 26 is written: the pulse returns
for i, m in enumerate([60, 67, 72, 79]): add(mus, glock(m + 12, 1.0, .3), BT['sixteen'] - .05 + i * .05, 1, .1)   # "Sixteen?!": a quick up-run
add(mus, bassoon(55, .35, .22), BT['sixteen'] + .45, 1, 0)
sting(BT['laugh'], (79, 84), .35, .1)                                             # her delighted laugh
block(BT['walk'] - .2, rc[0] - .2, fade_in=.8, mel=True, lvl=.5, fade_out=.4)    # to Room 4: the theme, warm and curious
sting(BT['door_open'], (72, 76, 79), .3, .12)                                      # the door of Room 4
sting(rc[0] + .2, (77, 81, 84), .4, .09)                                          # recap title
block(rc[0] + 1.6, rc[1], fade_in=1.0, mel=False, strum=False, perc=True, lvl=.5)   # recap: bass + brushes only
block(tu[0], BT['pause_start'] - .1, mel=False, strum=True, perc=False, lvl=.4, fade_out=.3)
sting(BT['pause_end'] + .2, (72, 76, 79, 84), .45)                                  # praise
si = SEC['site']
block(si[0] + .2, si[1] - .3, fade_in=.6, mel=False, strum=True, perc=False, lvl=.4, fade_out=.3)   # the site nudge: soft strum
block(nx[0], DUR - 1.2, fade_in=.5, mel=True, lvl=.5, fade_out=1.0)                # theme out
for m, dt in zip([65, 69, 72, 77], [0, .2, .4, .75]): add(mus, glock(m + 12, 2.4, .25), DUR - 2.4 + dt, 1, 0)
MUSIC = .15          # music well in the background (the owner asked twice for it quieter)
mus *= (1 - .9 * speech)[:, None]   # under speech the music almost disappears

# ---------------- foley (from the page's events) ----------------
fx = np.zeros((N, 2))
def over(*parts):
    """Sum sounds of different lengths: over(x, (y, delay), ...)"""
    parts = [(p, 0) if isinstance(p, np.ndarray) else p for p in parts]
    out = np.zeros(max(len(p) + int(d * SR) for p, d in parts))
    for p, d in parts: out[int(d * SR):int(d * SR) + len(p)] += p
    return out
def tick(): return norm(hp(noise(.03), 3000) * env_exp(.03, .003) + np.sin(2 * np.pi * 2600 * t_(.03)) * env_exp(.03, .005))
def alarm(d=1.6):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * 2300 * tt)) * (np.sin(2 * np.pi * 14 * tt) > 0)
    return lp(x, 6000) * np.minimum(1, (d - tt) / .1) * .5
def bus(d=4.0):
    tt = t_(d); e = np.sin(np.pi * tt / d) ** 2
    eng = lp(brown(d), 160) * .8 + bp(noise(d), 300, 900) * .25
    return norm(eng * e) * .8
def taxi(d=4.0):   # the yellow cab passing: a lighter, higher engine than the old bus, with a tyre hiss
    tt = t_(d); e = np.sin(np.pi * tt / d) ** 2
    eng = lp(brown(d), 260) * .6 + bp(noise(d), 600, 1800) * .3
    return norm(eng * e) * .7
def wheels(d):
    tt = t_(d); x = bp(noise(d), 1500, 5000) * .25 * (1 + .5 * np.sin(2 * np.pi * 7 * tt)) + lp(brown(d), 300) * .3
    return x * np.minimum(1, np.minimum(tt / .15, (d - tt) / .15))
def squiggle(d=.5):
    tt = t_(d); f = 900 + 500 * np.sin(2 * np.pi * 9 * tt)
    return norm(bp(noise(d), 1500, 5000) * .4 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .3) * np.sin(np.pi * tt / d) * .6
def freeze_hit():
    d = .5; tt = t_(d)
    return norm(lp(noise(d), 2500) * env_exp(d, .03) + np.sin(2 * np.pi * 180 * tt * (1 - .5 * tt)) * env_exp(d, .12))
def caret(): return norm(over(pop() * .6, tick() * .5))
def write_(d=.6):
    tt = t_(d); return bp(noise(d), 2500, 7000) * (.6 + .4 * np.sin(2 * np.pi * 11 * tt)) * np.sin(np.pi * tt / d) * .4
def squeeze(): return norm(over(whoosh(.25), pop() * .5))
def chirp():
    d = .25; tt = t_(d); f = 3800 + 1200 * np.sin(2 * np.pi * 18 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 2 * .3

def gulp():
    d = .28; tt = t_(d); f = 420 * (1 - .55 * tt / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** 1.5 * .8
def buzz(d=.35):
    tt = t_(d); x = np.sign(np.sin(2 * np.pi * 110 * tt)) * .5 + np.sign(np.sin(2 * np.pi * 113 * tt)) * .5
    return lp(x, 1400) * np.minimum(1, np.minimum(tt / .01, (d - tt) / .04)) * .5
def ratchet(d):
    x = np.zeros(int(d * SR)); t = 0.
    while t < d - .05:
        a = int(t * SR); k = tick()[:len(x) - a]; x[a:a + len(k)] += k * .6; t += .045 + .1 * (t / d) ** 2
    return x
def page_turn(d=.7):
    tt = t_(d); return norm(bp(noise(d), 500, 6000) * np.sin(np.pi * tt / d) ** 2 * (.6 + .4 * np.sin(2 * np.pi * 4 * tt))) * .7
def confetti(d=1.2):
    x = np.zeros(int(d * SR))
    for i in range(10):
        a = int(rng.random() * (d - .2) * SR); p = pop() * (.3 + .4 * rng.random()); x[a:a + len(p)] += p[:len(x) - a]
    return x + bp(noise(d), 3000, 9000) * env_exp(d, .4) * .15
def chime2(): return over(glock(84, .5, .5), (glock(88, .7, .5), .12))
def chatter(d=3.0):   # a classroom behind a door: a few muffled voices (band-passed noise at syllable rate), soft
    tt = t_(d); x = np.zeros(len(tt))
    for v in range(5):
        lo = float(rng.uniform(250, 500)); env = np.clip(np.sin(2 * np.pi * float(rng.uniform(3.5, 5.5)) * tt + float(rng.uniform(0, 6))), 0, 1) ** 2
        env *= np.clip(np.sin(2 * np.pi * float(rng.uniform(.25, .5)) * tt + float(rng.uniform(0, 6))), .15, 1)
        x += lp(bp(noise(d), lo, lo * 3.2), 1600) * env
    return norm(x) * np.minimum(1, np.minimum(tt / .5, (d - tt) / .8)) * .5

def yawn_(d=1.2):
    tt = t_(d); f = 260 * (1 + .25 * np.sin(np.pi * tt / d)) * (1 - .3 * tt / d)
    x = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .3 + bp(noise(d), 300, 1200) * .5, 1500)
    return x * np.sin(np.pi * tt / d) ** 1.3 * .5
def slurp(d=.45):
    tt = t_(d); f = 1800 - 900 * tt / d
    return (bp(noise(d), 800, 4000) * (.5 + .5 * np.sin(2 * np.pi * 22 * tt)) * .6 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .15) * np.sin(np.pi * tt / d) ** .7
def paper_(d=.35):
    tt = t_(d); return hp(noise(d), 2500) * (rng.random(len(tt)) > .7) * np.sin(np.pi * tt / d) * .6
def stars_(d=1.0):
    x = np.zeros(int(d * SR))
    for i, m in enumerate([84, 88, 91, 96]):
        g = glock(m, .8, .3); a = int(i * .11 * SR); x[a:a + len(g)] += g[:len(x) - a]
    return x

H = {   # event type -> (sound, gain, pan)
    'door':      lambda e: (norm(over(creak(), (creak() * .7, .2))), .4, .15),
    'door_close':lambda e: (thump(1, 90), .45, .15),
    'pop':       lambda e: (pop(), .25, float(rng.uniform(-.3, .3))),
    'bubble':    lambda e: (pop(), .2, float(rng.uniform(-.3, .3))),
    'whoosh':    lambda e: (whoosh(e.get('dur', .4)), .3, 0),
    'wipe':      lambda e: (whoosh(e.get('dur', .6)), .35, 0),
    'squiggle':  lambda e: (squiggle(e.get('dur', .5)), .35, 0),
    'ding':      lambda e: (ding(), .22, .1),
    'correct':   lambda e: (ding(), .22, .1),
    'clock_tick':lambda e: (tick(), .25, .1),
    'tick':      lambda e: (tick(), .25, .1),
    'alarm':     lambda e: (alarm(e.get('dur', 1.6)), .14, .2),
    'step':      lambda e: (step(), .05, float(rng.uniform(-.15, .15))),
    'footstep':  lambda e: (step(), .05, float(rng.uniform(-.15, .15))),
    'footsteps': lambda e: (step(), .05, float(rng.uniform(-.15, .15))),
    'land':      lambda e: (thump(.5, 120), .12, 0),
    'bus':       lambda e: (bus(e.get('dur', 4.0)), .3, -.3),
    'taxi':      lambda e: (taxi(e.get('dur', 4.0)), .16, -.3),
    'suitcase':  lambda e: (wheels(e.get('dur', 2.0)), .15, .1),
    'wheels':    lambda e: (wheels(e.get('dur', 2.0)), .15, .1),
    'freeze':    lambda e: (freeze_hit(), .35, 0),
    'caret':     lambda e: (caret(), .3, 0),
    'insert':    lambda e: (caret(), .3, 0),
    'squeeze':   lambda e: (squeeze(), .3, 0),
    'merge':     lambda e: (squeeze(), .3, 0),
    'write':     lambda e: (write_(e.get('dur', .6)), .25, 0),
    'type':      lambda e: (tick(), .15, 0),
    'sweat':     lambda e: (pop() * .5, .15, 0),
    'blink':     lambda e: (np.zeros(10), 0, 0),
    'sparkle':   lambda e: (ding() * .5, .15, .2),
    'bird':      lambda e: (chirp(), .2, .5),
    'tap':       lambda e: (over(tick() * .6, thump(.4, 220)[:int(.06 * SR)] * .5), .3, .2),
    'yawn':      lambda e: (yawn_(min(1.6, e.get('dur', 1.2))), .22, -.1),
    'laugh':     lambda e: (np.zeros(10), 0, 0),              # the laugh is in Mia's voice
    'sip':       lambda e: (slurp(), .3, -.1),
    'paper':     lambda e: (paper_(), .3, 0),
    'stars':     lambda e: (stars_(e.get('dur', 1.0)), .2, .1),
    'suitcase_roll': lambda e: (wheels(e.get('dur', 2.0)), .08, .1),
    'thought':   lambda e: (over(pop() * .6, (pop() * .4, .06)), .2, -.2),
    'cut_in':    lambda e: (whoosh(.25), .18, 0),
    'cut':       lambda e: (np.zeros(10), 0, 0),
    'page_turn': lambda e: (page_turn(), .4, 0),
    'door_open': lambda e: (norm(over(creak(), (creak() * .7, .2))), .4, .15),
    'unfreeze':  lambda e: (whoosh(.3)[::-1].copy(), .2, 0),
    'clock_spin':lambda e: (ratchet(e.get('dur', 4.0)), .2, .1),
    'error_buzz':lambda e: (buzz(), .18, 0),
    'repeat':    lambda e: (chime2(), .15, 0),
    'mic_on':    lambda e: (tick(), .3, 0),
    'countdown_tick': lambda e: (over(tick(), glock(79, .3, .3)), .35, 0),
    'confetti':  lambda e: (confetti(), .3, 0),
    'cheer':     lambda e: (ding() * .4, .15, -.2),
    'gulp':      lambda e: (gulp(), .4, 0),
    'click':     lambda e: (tick(), .3, .2),
    'bell':      lambda e: (ding(), .2, .2),
    'chatter':   lambda e: (chatter(e.get('dur', 3.0)), .18, -.4),       # episode 3: the class behind the door of Room 4
}
MUSICAL = {'sting', 'sting_shock', 'sting_end', 'music_intro', 'music_recap', 'music_outro', 'ambience_street', 'ambience_afternoon', 'ambience_hall'}   # covered by the score
unknown = {}
for e in EV:
    k = e['type']
    if k in H:
        x, g, p = H[k](e)
        if g: add(fx, x, e['t'], g, p)
    elif k not in MUSICAL:
        unknown[k] = unknown.get(k, 0) + 1
if unknown: print('unhandled event types:', unknown)

# ---------------- ambience ----------------
amb = np.zeros((N, 2))
def street(a, b, lvl=1.0):
    d = b - a; tt = t_(d)
    x = lp(brown(d), 250) * .03 + bp(noise(d), 200, 1500) * .008 * (.8 + .2 * np.sin(2 * np.pi * .09 * tt))
    e = np.minimum(1, np.minimum(tt / .8, (d - tt) / .8)); add(amb, x * e * lvl * 1.8, a, 1, -.1)
    t = a + 1.5
    while t < b - 1:
        if rng.random() < .5: add(amb, chirp(), t, .12 * lvl, float(rng.uniform(-.7, .7)))
        t += float(rng.uniform(1.2, 3.5))
street(o[0], o[1] + .3)                       # the walk to school
room = lp(brown(DUR + 1), 300)[:N] * .01; amb += room[:, None]
hall = bp(noise(rm[1] - dk[0] + 1.5), 150, 900) * .012; add(amb, hall * np.minimum(1, np.minimum(t_(len(hall) / SR) / .8, (len(hall) / SR - t_(len(hall) / SR)) / .8)), dk[0] - .5, 1, 0)   # the reception: a bigger, duller room

FX = .4             # sound effects well under the voices (owner: footsteps and effects were too loud)
fx *= (1 - .6 * speech)[:, None]   # and quieter still while anyone talks
mix = vox + mus * MUSIC + fx * FX + amb
if os.environ.get('STEMS'):   # level check: rms per section of each stem
    for s_ in T['sections']:
        a, b = int(s_['t0'] * SR), int(s_['t1'] * SR)
        db = lambda x: round(20 * np.log10(np.sqrt(np.mean(x[a:b] ** 2)) + 1e-9), 1)
        print(f"{s_['id']:7s} vox {db(vox)} mus {db(mus * MUSIC)} fx {db(fx * FX)} amb {db(amb)}")
mix = np.stack([limit(mix[:, c], .6) for c in range(2)], 1)
mix = norm(mix, .89)[:int(DUR * SR)]
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', os.environ.get('MIXOUT', 'mix.wav')), mix.astype(np.float32), SR)
print('mix written', round(len(mix) / SR, 2), 's')
