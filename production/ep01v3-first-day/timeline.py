# Episode 1 v3 (the middle cut: v2's hook, tight timing and class + v1's warm narration and full recap explanation, no fast round)
# layout -> timeline.json. Same timing rules and helper as v2 (audible gaps). Earlier header of v2 follows:
# Episode 1 v2 (the tighter test cut) layout -> timeline.json. The alignment of words to the voice is in ../lib/tlkit.py.
# Timing rules of v2: 0.12–0.25 s between clips in a scene (0.4 s at a scene change), title 1.5 s, "your turn" pause 3.5 s,
# end card 2.5 s, a 0.9 s repeat gap only after the model lines the learner repeats (T['repeat']), none in EN-6 / EN-7;
# the fast round EN-7 is one clip per question/answer, the answer placed ANSWER s after the question's last word.
# Every gap here is AUDIBLE silence: a clip is placed so its first sound starts `gap` s after the previous clip's last sound
# (each voice file carries ~.2–.4 s of silence at both ends; those silent edges overlap instead of adding up).
# Run with the lemo-opuscar venv python (numpy + soundfile: the speech edges and the lip-sync gate need them).
import os, sys, json, wave
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
import tlkit, lipsync
from tlkit import Builder
tlkit.WHO.update({'Leo': 'leo', 'Mei': 'mei'})   # the two classmates (v2): their own ids in lines / talk / mouth
lipsync.LEX.update({k: v for k, v in {'hey': 'HH EY', 'leo': 'L IY OW', 'mei': 'M EY'}.items() if k not in lipsync.LEX})

b = Builder(HERE,
            solo={'r01': 'Sara', 'r02': 'Youssef', 'r03': 'Youssef', 'r04': 'Youssef', 'r05': 'Sara', 'r06': 'Youssef',
                  'r07': 'Youssef', 'r08': 'Sara', 'r09': 'Sara', 'r10': 'Youssef', 'turn': 'Sara', 'en1a': 'Youssef',
                  'e6s': 'Sara', 'e6l': 'Leo', 'e6m': 'Mei'},
            # v1's voice added "اسمك إيه؟", so the plate shows it (as in v1)
            display={'ar12': 'ولو عايز تسأل حد عن اسمه: اسمك إيه؟ <short pause> والرد:'})
T = b.T
T['repeat'] = []
REP, ANSWER = .9, 1.3


EDGE = {}
def edges(k):
    """(first sound, last sound) of clip k in s: 20 ms RMS frames above -32 dB of the clip's loud level (a missing clip: its words)"""
    if k not in EDGE:
        w = os.path.join(HERE, 'voices', k + '.wav')
        if os.path.exists(w):
            x, sr = sf.read(w); x = x if x.ndim == 1 else x.mean(1)
            n = int(.02 * sr); e = np.sqrt(np.convolve(x * x, np.ones(n) / n, 'same'))[::n // 2]
            on = np.where(e > np.percentile(e, 98) * 10 ** (-32 / 20))[0]
            EDGE[k] = (max(0, on[0] * n / 2 / sr - .02), min(len(x) / sr, on[-1] * n / 2 / sr + .03))
        else:
            dur, words, _ = b.clip(k); EDGE[k] = (words[0]['t0'], words[-1]['t1'])
    return EDGE[k]


def put(k, gap=.2, scene=None):
    """place k so its first sound starts `gap` s after the cursor (the last sound so far, or a hold); the cursor moves to its last sound"""
    lead, end = edges(k)
    b.t += gap - lead
    s, _ = b.put(k, 0, scene)
    b.t = s + end
    return s, s + end


def R(k, gap, item, rep=False):
    """a recap clip: rep = the learner repeats it (0.9 s of silence after it, recorded in T['repeat'])"""
    s, e = put(k, gap, scene='recap')
    if item is None:
        return s, e
    if not T['recap'] or T['recap'][-1]['id'] != item:
        T['recap'].append({'id': item, 't0': round(max(T['recap'][-1]['t1'] if T['recap'] else 0, s + edges(k)[0] - .15), 3)})
    if rep:
        T['repeat'].append({'clip': k, 't0': round(e + .1, 3), 't1': round(e + REP - .05, 3)})
        b.t = e + REP
    T['recap'][-1]['t1'] = round(b.t, 3)
    return s, e


# 0. Hook: straight in on the door; freeze on "Sorry?"; AR-00 over the freeze; a VHS rewind into the title
b.section('open')
b.hold(.2)
put('open', 0, scene='door')
b.beat('sorry', b.last_line()['t0'])
b.beat('freeze', b.last_line()['t1'] + .1)
put('ar00', .35)
b.beat('rewind', b.t - .1)
b.t = T['beats']['rewind'] + .6
b.beat('title')
b.hold(1.5)
# 1. The street: v1's AR-01 + AR-02 while he walks, then he rehearses out loud (EN-1a); the door opens
b.section('street')
put('ar01', .3)
put('ar02', .25)
put('en1a', .25, scene='street')
b.hold(.1)
b.beat('door_open')
# 2. The door: after "Sorry?" — v1's AR-05 over a short close-up, then EN-2, v1's AR-06 as they go in
b.section('door')
put('ar05', .5)
b.hold(.1)
b.section('retry')
put('en2', .15, scene='retry')
b.beat('come_in', b.last_line()['t0'])
put('ar06', .25)
b.hold(.15)
# 3. The class (v2): Leo, then Mei; v2's AR-07 over the wide shot
b.section('class')
put('en4', .3, scene='class')
put('en5', .25, scene='class')
b.beat('wide', b.t + .1)
put('ar07', .3)
b.hold(.15)
# 4. Goodbye (afternoon, at the door); v1's AR-08
b.section('bye')
put('en3', .3, scene='bye')
b.beat('eight', b.last_line()['t0'])
put('ar08', .2)
b.hold(.25)
# 5. Recap: v1's narration (AR-09 … AR-15) at v2's pace, + the EN-6 name trio; no fast round
b.section('recap')
b.beat('recap_title')
b.hold(1.0)
R('ar09', 0, None)
R('r01', .25, 'hi'); R('r02', .2, 'hi', rep=True)
R('ar10', 0, 'am'); R('r03', .25, 'am'); R('ar11', .2, 'im'); R('r04', .15, 'im', rep=True)
R('e6s', 0, 'names'); R('e6l', .15, 'names'); R('e6m', .15, 'names')
R('ar12', .35, 'name'); R('r05', .2, 'name'); R('r06', .2, 'name', rep=True)
R('ar13', 0, 'too'); R('r07', .2, 'too', rep=True)
R('ar14', 0, 'sorry'); R('r08', .2, 'sorry', rep=True)
R('ar15', 0, 'bye'); R('r09', .2, 'bye'); R('r10', .2, 'bye', rep=True)
b.hold(.1)
# 6. Your turn
b.section('turn')
put('ar16', .3)
put('turn', .2, scene='turn')
b.hold(.2)
b.beat('pause_start')
b.hold(3.5)
b.beat('pause_end')
put('ar17', .15)
b.hold(.2)
# 7. Solve the exercises on the site
b.section('site')
b.beat('site_card')
put('ar19', .35)
b.hold(.5)
# 8. Next time
b.section('next')
put('ar18', .2)
b.hold(.3)
b.beat('end_card')
b.hold(2.5)
b.finish()

# ---- density stats (the point of v2) ----
dur = T['dur']
spoken = sorted([(w['t0'], w['t1']) for l in T['lines'] for w in l['words']] + [(w['t0'], w['t1']) for n in T['narration'] for w in n['words']])
# coverage: the share of the runtime within 0.35 s of a spoken word
iv = []
for a, z in spoken:
    a, z = max(0, a - .35), min(dur, z + .35)
    if iv and a <= iv[-1][1]: iv[-1][1] = max(iv[-1][1], z)
    else: iv.append([a, z])
cov = sum(z - a for a, z in iv)
# silences >= 1 s: gaps between spoken words (and the edges)
edges, last, sil = [], 0., []
for a, z in spoken:
    if a - last >= 1: sil.append((last, a))
    last = max(last, z)
if dur - last >= 1: sil.append((last, dur))
en = sum(w['t1'] - w['t0'] for l in T['lines'] for w in l['words'])
en_merged = []
for a, z in sorted((w['t0'], w['t1']) for l in T['lines'] for w in l['words']):
    if en_merged and a <= en_merged[-1][1]: en_merged[-1][1] = max(en_merged[-1][1], z)
    else: en_merged.append([a, z])
en = sum(z - a for a, z in en_merged)
print(f"STATS duration {dur:.1f}s ({int(dur // 60)}:{dur % 60:04.1f})  coverage {100 * cov / dur:.1f}%  "
      f"silences>=1s: {len(sil)} totalling {sum(z - a for a, z in sil):.1f}s  English speech {en:.1f}s = {100 * en / dur:.1f}% of runtime")
for a, z in sil:
    print(f"   silence {a:6.2f}-{z:6.2f} ({z - a:.2f}s)")
latin = [(w['t0'], w['t1']) for n in T['narration'] for w in n['words'] if w['w'][:1].isascii() and w['w'][:1].isalpha()]
en2 = []
for a, z in sorted([tuple(x) for x in en_merged] + latin):
    if en2 and a <= en2[-1][1]: en2[-1][1] = max(en2[-1][1], z)
    else: en2.append([a, z])
spans = sum(l['t1'] - l['t0'] for l in T['lines'])
print(f"      English incl. the English inside the narration: {sum(z - a for a, z in en2):.1f}s = {100 * sum(z - a for a, z in en2) / dur:.1f}%;"
      f"  English line spans (first to last word of each line): {spans:.1f}s = {100 * spans / dur:.1f}%")
