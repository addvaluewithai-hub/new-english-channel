# Episode 1 v2 (the tighter test cut) layout -> timeline.json. The alignment of words to the voice is in ../lib/tlkit.py.
# Timing rules of v2: 0.12–0.25 s between clips in a scene (0.4 s at a scene change), title 1.5 s, "your turn" pause 3.5 s,
# end card 2.5 s, a 0.9 s repeat gap only after the model lines the learner repeats (T['repeat']), none in EN-6 / EN-7;
# the fast round EN-7 is one clip per question/answer, the answer placed ANSWER s after the question's last word.
import os, sys, json, wave
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'lib'))
import tlkit, lipsync
from tlkit import Builder
tlkit.WHO.update({'Leo': 'leo', 'Mei': 'mei'})   # the two classmates (v2): their own ids in lines / talk / mouth
lipsync.LEX.update({k: v for k, v in {'hey': 'HH EY', 'leo': 'L IY OW', 'mei': 'M EY'}.items() if k not in lipsync.LEX})

b = Builder(HERE,
            solo={'r01': 'Sara', 'r02': 'Youssef', 'r03': 'Youssef', 'r04': 'Youssef', 'r05': 'Sara', 'r06': 'Youssef',
                  'r07': 'Youssef', 'r08': 'Sara', 'r09': 'Sara', 'r10': 'Youssef', 'turn': 'Sara', 'en1a': 'Youssef',
                  'e6s': 'Sara', 'e6l': 'Leo', 'e6m': 'Mei',
                  'e7q1': 'Sara', 'e7q2': 'Sara', 'e7q3': 'Sara', 'e7q4': 'Sara',
                  'e7a1': 'Youssef', 'e7a2': 'Youssef', 'e7a3': 'Youssef', 'e7a4': 'Youssef'})
T = b.T
T['repeat'] = []
REP, ANSWER = .9, 1.3


def R(k, gap, item, rep=False):
    """a recap clip (as Builder.recap): rep = the learner repeats it (a 0.9 s gap, recorded in T['repeat'])"""
    s, e = b.put(k, REP if rep else gap, scene='recap')
    if not T['recap'] or T['recap'][-1]['id'] != item:
        T['recap'].append({'id': item, 't0': round(s, 3)})
    T['recap'][-1]['t1'] = round(b.t, 3)
    if rep:
        T['repeat'].append({'clip': k, 't0': round(T['lines'][-1]['t1'] + .15, 3), 't1': round(b.t + .05, 3)})


def lead_tail(k):
    """(silence before the first word, silence after the last word) of a clip"""
    dur, words, _ = b.clip(k)
    return words[0]['t0'], dur - words[-1]['t1']


# 0. Hook: straight in on the door; freeze on "Sorry?"; AR-00 over the freeze; a VHS rewind into the title
b.section('open')
b.hold(.15)
b.put('open', 0, scene='door')
b.beat('sorry', b.last_line()['t0'])
b.beat('freeze', b.last_line()['t1'] + .1)
b.hold(.05)
s, e = b.put('ar00', 0)
b.beat('rewind', T['narration'][-1]['t1'] - .05)
b.t = T['beats']['rewind'] + .6
b.beat('title')
b.hold(1.5)
# 1. The street: AR-01 while he walks, then he rehearses out loud (EN-1a); the door opens
b.section('street')
b.hold(.1)
b.put('ar01', .15)
b.put('en1a', .2, scene='street')
b.beat('door_open', b.t - .1)
# 2. The door: after "Sorry?" — AR-05 over a short close-up, then EN-2, AR-06 as they go in
b.section('door')
b.hold(.45)
b.put('ar05', .2)
b.section('retry')
b.put('en2', .2, scene='retry')
b.beat('come_in', b.last_line()['t0'])
b.put('ar06', .4)
# 3. The class: Leo, then Mei; AR-07 over the wide shot
b.section('class')
b.hold(.15)
b.put('en4', .2, scene='class')
b.put('en5', .25, scene='class')
b.beat('wide', b.t - .1)
b.put('ar07', .4)
# 4. Goodbye (afternoon, at the door)
b.section('bye')
b.hold(.2)
b.put('en3', 0, scene='bye')
b.beat('eight', b.last_line()['t0'])
b.hold(.15)
b.put('ar08', .4)
# 5. Recap: the title card (no line), the items, the name trio, then the fast round
b.section('recap')
b.beat('recap_title')
b.hold(1.2)
R('r01', .15, 'hi'); R('r02', 0, 'hi', rep=True)
R('ar10', .2, 'am'); R('r03', .25, 'am'); R('ar11', .12, 'im'); R('r04', 0, 'im', rep=True)
R('e6s', .12, 'names'); R('e6l', .12, 'names'); R('e6m', .35, 'names')
R('r05', .15, 'name'); R('r06', 0, 'name', rep=True)
R('ar13', .15, 'too'); R('r07', 0, 'too', rep=True)
R('r08', 0, 'sorry', rep=True)
R('r09', .15, 'bye'); R('r10', 0, 'bye', rep=True)
b.section('fast')
R('ar12', .25, 'fast')
for i in range(1, 5):
    q, a = f'e7q{i}', f'e7a{i}'
    gap = max(.1, ANSWER - lead_tail(q)[1] - lead_tail(a)[0])
    R(q, gap, 'fast')
    T['beats'][f'q{i}'] = T['lines'][-1]['t0']
    R(a, .3 if i < 4 else .45, 'fast')
    T['beats'][f'a{i}'] = T['lines'][-1]['t0']
# 6. Your turn
b.section('turn')
b.put('ar16', .15)
b.put('turn', .2, scene='turn')
b.beat('pause_start')
b.hold(3.5)
b.beat('pause_end')
b.put('ar17', .3)
# 7. Solve the exercises on the site
b.section('site')
b.beat('site_card')
b.hold(.3)
b.put('ar19', .3)
# 8. Next time
b.section('next')
b.put('ar18', .3)
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
