"""Single source of truth for the edit: voice placements, lip-sync spans, subtitles, cards and section times.
Writes timeline.json (read by the page, the mixer and the subtitle exporter).
All voice timings come from the factory/Whisper word timestamps in voices/."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
V = lambda f: os.path.join(HERE, 'voices', f)
fac = {k: json.load(open(V(k + '.transcript.json')))['words'] for k in ['open3', 'models', 'retake']}

place, talk, subs, bubbles, T = [], [], [], [], {}

def words_in(src, s0, s1):
    """factory words (seconds) inside [s0, s1] of a character clip"""
    return [(w['start_ms'] / 1000, w['end_ms'] / 1000, w['text']) for w in fac[src] if s0 <= w['start_ms'] / 1000 < s1]

def char(src, s0, s1, who, at, text, bubble=True, hold=0.6):
    """place a character line; returns its end time on the timeline"""
    place.append(dict(file=src + '.wav', s0=s0, s1=s1, t=round(at, 3), role=who))
    for a, b, _ in words_in(src, s0, s1):
        talk.append([round(at + a - s0, 3), round(at + b - s0 + .04, 3), who])
    ws = words_in(src, s0, s1)
    if bubble and ws:
        bubbles.append(dict(who=who, t0=round(at + ws[0][0] - s0 - .15, 3), t1=round(at + (s1 - s0) + hold, 3), text=text))
    return at + (s1 - s0)

def nar(src, s0, s1, at, cues):
    """place narration; cues = [(src_time_start, src_time_end, arabic_text)]"""
    place.append(dict(file=src + '.wav', s0=s0, s1=s1, t=round(at, 3), role='nar'))
    for a, b, txt in cues:
        subs.append(dict(t0=round(at + a - s0, 3), t1=round(at + b - s0, 3), text=txt))
    return at + (s1 - s0)

# ---------------- A. desk + book opening ----------------
T['open'] = [0.6, 2.8]
T['rise0'] = 2.9
T['doorOpen'] = 4.3
T['miaOut'] = [4.5, 5.6]
T['youWalk'] = [3.6, 6.4]

# ---------------- B. the wrong first sentence ----------------
t = 6.7
t = char('open3', 0.1, 1.6, 'mia', t, "Hi! I'm Mia.") + .35
T['wrongStart'] = t
t = char('open3', 1.8, 5.5, 'youssef', t, 'Hello! I... I Youssef.', hold=1.2)
T['silence'] = t + .1
t += 1.0                                             # held silence before Mia's "Sorry?"
T['sorry'] = t
t = char('open3', 5.75, 6.76, 'mia', t, 'Sorry?', hold=1.6)
T['crumple'] = T['sorry'] + .55                     # Youssef's bubble crumples into a paper ball
T['embarrassed'] = T['sorry']
t += 1.0

# ---------------- C. narrator intro + title ----------------
T['intro'] = t
t = nar('nar-intro', 0.0, 11.08, t, [(0, 4.7, 'يوسف لسه واصل لندن… وأول جملة قالها بالإنجليزي طلعت غلط.'),
                                      (4.7, 10.92, 'في الدرس ده هنعرف ليه… وهنتعلم إزاي تسلّم وتعرّف نفسك صح، من أول مرة.')])
T['title'] = [t + .3, t + 5.3]
t = T['title'][1]

# ---------------- D. page turn → phrase board ----------------
T['turn1'] = [t - .4, t + 2.4]
T['rise1'] = t + 1.6
t += 3.2

# ---------------- E. the six phrases ----------------
M = dict(hello=(0.1, 1.3), hi=(2.05, 3.2), im_mia=(3.65, 5.0), myname=(5.85, 7.75), whats=(8.15, 9.6), nice=(10.6, 12.25),
         nicetoo=(12.85, 14.3), byesee=(14.4, 16.3), goodbye=(21.1, 22.4), iam=(26.2, 27.95), im_you=(31.0, 32.5),
         turn_q=(36.4, 39.7), turn_nice=(43.75, 45.6))
WHO = dict(hello='mia', hi='youssef', im_mia='mia', myname='youssef', whats='mia', nice='mia', nicetoo='youssef', byesee='mia',
           goodbye='youssef', iam='youssef', im_you='youssef', turn_q='mia', turn_nice='mia')
TXT = dict(hello='Hello!', hi='Hi!', im_mia="I'm Mia.", myname='My name is Youssef.', whats="What's your name?", nice='Nice to meet you.',
           nicetoo='Nice to meet you too.', byesee='Bye! See you.', goodbye='Goodbye!', iam='I am Youssef.', im_you="I'm Youssef.",
           turn_q="Hi! I'm Mia. What's your name?", turn_nice='Nice to meet you!')
def model(k, at, bubble=True):
    a, b = M[k]; return char('models', a, b, WHO[k], at, TXT[k], bubble=bubble, hold=.5)

cards = []   # phrase cards on the board: pop time + highlight spans
def card(i, at): cards.append(dict(i=i, t=round(at, 3), hi=[]))

P = 'nar-phrases'
T['phrases'] = t
card(0, t + .85); t = nar(P, 0.0, 6.6, t, [(0, 6.52, 'أول كلمة: Hello… أو Hi، وهي أبسط. الاتنين معناهم: أهلًا.')]) + .3
t = model('hello', t) + .25; t = model('hi', t) + .6
card(1, t + 1.7); t = nar(P, 7.2, 13.3, t, [(7.2, 13.18, 'عشان تقول اسمك، قول: I\'m… وبعدها اسمك. يعني: أنا ميا.')]) + .3
t = model('im_mia', t) + .6
card(2, t + .55); t = nar(P, 13.8, 18.1, t, [(13.8, 17.98, 'أو تقول: My name is… يعني: اسمي يوسف.')]) + .3
t = model('myname', t) + .6
card(3, t + 2.1); t = nar(P, 19.0, 24.0, t, [(19.0, 23.88, 'ولو عايز تسأل حد عن اسمه: What\'s your name? يعني: اسمك إيه؟')]) + .3
t = model('whats', t) + .6
card(4, t + 1.5); t = nar(P, 24.55, 29.8, t, [(24.55, 29.7, 'ولما تتعرّف على حد، تقول: Nice to meet you، يعني: اتشرّفت بمعرفتك.')]) + .3
t = model('nice', t) + .4
t = nar(P, 29.85, 32.4, t, [(29.85, 32.2, 'والرد: Nice to meet you too.')]) + .3
t = model('nicetoo', t) + .6
card(5, t + .3); t = nar(P, 32.85, 38.0, t, [(32.85, 37.78, 'وفي الآخر، وإنت بتمشي: Bye… See you… أو Goodbye.')]) + .3
t = model('byesee', t) + .25; t = model('goodbye', t) + .7
T['allCards'] = t
t = nar(P, 38.35, 39.96, t, [(38.35, 39.8, 'يلا، قولها معايا.')]) + .6
# repeat-after-me round: model, then a gap for the viewer
T['repeat'] = t
rep = []
for i, k in enumerate(['hello', 'myname', 'whats', 'nice', 'nicetoo', 'byesee']):
    a, b = M[k]; t0 = t
    t = model(k, t, bubble=False)
    gap = (b - a) + 1.3
    rep.append(dict(i=i, t=round(t0, 3), say=round(t, 3), end=round(t + gap, 3)))
    t += gap
T['repeatEnd'] = t

# ---------------- F. page turn → workshop ----------------
T['turn2'] = [t - .2, t + 2.6]
T['rise2'] = t + 1.8
t += 3.4

# ---------------- G. the mistakes ----------------
K = 'nar-mistakes'; W = {}
W['k1'] = t
t = nar(K, 0.0, 3.1, t, [(0, 3.02, 'طب ليه يوسف قال: I Youssef؟')])
W['arabic'] = t + .5
t = nar(K, 3.1, 10.44, t + .2, [(3.1, 6.48, 'لأن في العربي بنقول: أنا يوسف… من غير فعل.'), (6.48, 10.44, 'لكن الإنجليزي لازم يكون فيه فعل في النص: am')])
W['am'] = t - .75                                       # the "am" tab slides in on the word
W['iam'] = t + .2
t = nar(K, 10.44, 13.42, t + .1, [(10.44, 13.42, 'يعني: I am Youssef…')]) + .2
t = model('iam', t) + .4
W['fold'] = t + 1.0                                     # I + am fold into I'm on "I'm"
t = nar(K, 13.42, 16.1, t, [(13.42, 16.0, 'وبنختصرها: I\'m Youssef.')]) + .2
t = model('im_you', t) + .7
W['s2'] = t + .4
t0 = t; t = nar(K, 16.5, 25.15, t, [(16.5, 19.22, 'ونفس الكلام في: اسمي يوسف.'), (19.22, 21.12, 'مش My name Youssef…'), (21.12, 25.06, 'لازم is: My name is Youssef.')])
W['is'] = t0 + (21.62 - 16.5)
t += .7
W['clear'] = t - .3                                     # sentences fold down
W['k7'] = t
t0 = t; t = nar(K, 25.0, 30.6, t + .4, [(25.0, 30.48, 'وغلطة تانية مشهورة: لما حد يقولك Nice to meet you… ما تردّش Me too.')])
W['metoo'] = t0 + .4 + (29.7 - 25.0)
W['metooCrumple'] = t + .4
t = nar(K, 31.0, 33.44, t + .5, [(31.0, 33.0, 'الرد الصح: Nice to meet you too.')])
W['too'] = t - 1.3
t = model('nicetoo', t + .3) + 1.0
T['work'] = W

# ---------------- H. page turn → London again ----------------
T['turn3'] = [t - .2, t + 2.6]
T['rise3'] = t + 1.8
t += 3.4

# ---------------- I. your turn ----------------
T['yourTurn'] = t
t = model('turn_q', t) + .4
t = nar('nar-turn', 0.0, 7.6, t, [(0, 4.08, 'دورك! وقّف الفيديو، وقول اسمك بصوت عالي:'), (4.08, 7.4, 'My name is… أو I\'m…')]) + .2
T['countdown'] = [t, t + 4.0]
t += 4.3
t = model('turn_nice', t) + .3
t = nar('nar-turn', 10.9, 14.0, t, [(10.9, 13.7, 'وإنت ترد: Nice to meet you too!')]) + .6

# ---------------- J. the retake ----------------
t = nar('nar-outro', 0.0, 3.4, t, [(0, 3.12, 'يلا نرجع ليوسف… المرة دي هيقولها صح.')]) + .4
T['retake'] = t
R = [(0.15, 1.6, 'mia', "Hi! I'm Mia."), (2.05, 4.1, 'youssef', "Hello, Mia. I'm Youssef."), (4.65, 6.4, 'mia', "Sorry? What's your name?"),
     (6.75, 9.5, 'youssef', 'Youssef. My name is Youssef.'), (9.85, 11.4, 'mia', 'Nice to meet you, Youssef.'), (11.75, 12.85, 'youssef', 'Nice to meet you too.'),
     (13.25, 14.85, 'mia', 'Bye, Youssef! See you.'), (15.45, 16.2, 'youssef', 'Goodbye!')]
rt = {}
for i, (a, b, who, txt) in enumerate(R):
    at = T['retake'] + a + i * .25
    char('retake', a, b, who, at, txt, hold=.35); rt[i] = (at, at + b - a)
T['perfect'] = rt[1][1] + .1
T['nice'] = rt[5][1] + .1
T['wave'] = rt[6][0]
t = rt[7][1] + 1.0

# ---------------- K. call to action + close ----------------
T['cta'] = t
t = nar('nar-outro', 6.5, 12.1, t, [(6.5, 11.84, 'وإنت كمان… اكتب في الكومنتات: Hi! I\'m… واسمك.')]) + .3
T['next'] = t
t = nar('nar-outro', 13.2, 16.24, t, [(13.2, 16.0, 'ونشوفك في الدرس الجاي: How are you?')]) + .5
T['close'] = [t, t + 2.4]
T['dur'] = round(t + 4.6, 2)

out = dict(T=T, place=place, talk=sorted(talk), subs=subs, bubbles=bubbles, cards=cards, rep=rep)
json.dump(out, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print('duration', T['dur'], 'placements', len(place), 'subs', len(subs), 'bubbles', len(bubbles))
