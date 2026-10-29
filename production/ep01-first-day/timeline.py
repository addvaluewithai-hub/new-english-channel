# Lays the episode out in time from the voice clips -> timeline.json (the single source of truth for picture and sound).
# Missing clips are estimated, so the picture can be built before the voices arrive.
import json, os, re, wave

HERE = os.path.dirname(os.path.abspath(__file__))
V = os.path.join(HERE, 'voices')
JOBS = json.load(open(os.path.join(HERE, 'tts/jobs.json')))
JOBS['open3'] = {'turns': [{'speaker': 'Mia', 'text': "Hi! I'm Mia."}, {'speaker': 'Youssef', 'text': 'Hello! I... I Youssef.'},
                           {'speaker': 'Mia', 'text': 'Sorry?'}]}
WHO = {'Mia': 'mia', 'Youssef': 'youssef'}
# English model lines in the recap: who says them
SOLO = {k: WHO[v] for k, v in {'r01': 'Mia', 'r02': 'Youssef', 'r03': 'Youssef', 'r04': 'Youssef', 'r05': 'Mia', 'r06': 'Youssef',
                                'r07': 'Youssef', 'r08': 'Mia', 'r09': 'Mia', 'r10': 'Youssef', 'turn': 'Mia'}.items()}


def strip_tags(s):
    import re
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s)).strip()


def clip(k):
    """Duration and words [{t0,t1,w,spk}] of a clip, measured if present, estimated if not."""
    wav, tr = os.path.join(V, k + '.wav'), os.path.join(V, k + '.transcript.json')
    if os.path.exists(wav) and os.path.exists(tr):
        with wave.open(wav) as f:
            dur = f.getnframes() / f.getframerate()
        d = json.load(open(tr))
        words = [{'t0': w['start_ms'] / 1000, 't1': w['end_ms'] / 1000, 'w': w['text'], 'spk': w.get('speaker')} for w in d['words']]
        return dur, words, True
    j = JOBS[k]
    turns = j.get('turns') or [{'speaker': None, 'text': j['text']}]
    words, t = [], .3
    for i, tu in enumerate(turns):
        for w in strip_tags(tu['text']).split():
            n = .42 if any('؀' <= c <= 'ۿ' for c in w) else .34
            words.append({'t0': t, 't1': t + n, 'w': w, 'spk': f'spk:{i}'})
            t += n + .05
        t += .6
    return t, words, False


# What the plate shows: transliterated English goes back to Latin, and ar12 has the line the voice added.
DISPLAY = {'ar12': 'ولو عايز تسأل حد عن اسمه: اسمك إيه؟ <short pause> والرد:'}
LATIN = [('آي يوسف', 'I Youssef'), ('آيم', "I'm"), ('آم', 'am'), ('نايس تو ميت يو', 'Nice to meet you'),
         ('مي تو', 'Me too'), ('هاو آر يو', 'How are you')]


def norm(w):
    w = re.sub(r'[ً-ْـ]', '', w.lower())
    w = re.sub('[أإآ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r"[^\w']", '', w)


def tokens(k):
    """Source tokens [(display, spoken_norm, turn)] of clip k, with transliterations merged into one Latin token."""
    j = JOBS[k]
    turns = j.get('turns') or [{'text': DISPLAY.get(k, j['text'])}]
    out = []
    for ti, tu in enumerate(turns):
        ws = strip_tags(tu['text']).replace('...', '… ').split()
        i = 0
        while i < len(ws):
            for ar, lat in LATIN:
                n = len(ar.split())
                if [norm(x) for x in ws[i:i + n]] == [norm(x) for x in ar.split()]:
                    tail = re.sub(r'^[\w؀-ۿ]+', '', ws[i + n - 1])  # keep trailing punctuation
                    out.append((lat + tail, [norm(x) for x in ws[i:i + n]], ti))
                    i += n
                    break
            else:
                out.append((ws[i], [norm(ws[i])], ti))
                i += 1
    return out


def align(toks, words, dur):
    """Times for each source token from the recognized words; unrecognized tokens share the gaps."""
    from difflib import SequenceMatcher
    # transliterated English is never anchored on its own: the recognizer drops or mangles it, so it fills its gap
    translit = lambda t: t[0][:1].isascii() and any('\u0600' <= c <= '\u06ff' for c in ''.join(t[1]))
    flat = [(ti, f'\0{ti}.{n}' if translit(t) else s) for ti, t in enumerate(toks) for n, s in enumerate(t[1])]
    rec = [norm(w['w']) for w in words]
    times = [None] * len(flat)
    for op, a0, a1, b0, b1 in SequenceMatcher(None, [s for _, s in flat], rec, autojunk=False).get_opcodes():
        if op == 'equal' or (op == 'replace' and a1 - a0 == b1 - b0):
            for i in range(a0, a1):
                if not flat[i][1].startswith('\0'):
                    times[i] = (words[b0 + i - a0]['t0'], words[b0 + i - a0]['t1'])
        elif op == 'replace':  # pair up only the look-alikes, in order
            j = b0
            for i in range(a0, a1):
                for jj in range(j, b1 if not flat[i][1].startswith('\0') else j):
                    if SequenceMatcher(None, flat[i][1], rec[jj]).ratio() >= .6:
                        times[i], j = (words[jj]['t0'], words[jj]['t1']), jj + 1
                        break
    # fill the gaps between anchors, sharing them by length
    i = 0
    while i < len(times):
        if times[i] is None:
            j = i
            while j < len(times) and times[j] is None:
                j += 1
            lo = times[i - 1][1] if i else max(0., (times[j][0] if j < len(times) else dur) - .5 * (j - i))
            hi = times[j][0] if j < len(times) else min(dur, lo + .5 * (j - i))
            lens = [max(2, len(flat[x][1])) for x in range(i, j)]
            tot, acc = sum(lens), lo
            for x, L in zip(range(i, j), lens):
                d = (hi - lo) * L / tot
                times[x] = (acc + .05 * d, acc + .95 * d)
                acc += d
            i = j
        i += 1
    out, x = [], 0
    for disp, parts, ti in toks:
        seg = times[x:x + len(parts)]
        x += len(parts)
        out.append({'t0': seg[0][0], 't1': seg[-1][1], 'w': disp, 'turn': ti})
    return out


T = {'dur': 0, 'fps': 24, 'sections': [], 'narration': [], 'lines': [], 'talk': [], 'beats': {}, 'recap': [], 'place': [],
     'estimated': []}
t = 0.0


def section(name):
    if T['sections']:
        T['sections'][-1]['t1'] = round(t, 3)
    T['sections'].append({'id': name, 't0': round(t, 3)})


def put(k, gap_after=.35, scene=None):
    """Place clip k at the current time, record its words, advance the clock."""
    global t
    dur, words, real = clip(k)
    if not real:
        T['estimated'].append(k)
    T['place'].append({'clip': k, 't': round(t, 3), 'dur': round(dur, 3)})
    a = lambda x: round(t + x, 3)
    toks = align(tokens(k), words, dur)
    if k.startswith('ar'):
        T['narration'].append({'id': k, 't0': a(toks[0]['t0']), 't1': a(toks[-1]['t1']), 'ar': ' '.join(w['w'] for w in toks),
                               'words': [{'t0': a(w['t0']), 't1': a(w['t1']), 'w': w['w']} for w in toks]})
    else:
        turns = JOBS[k].get('turns')
        for ti in sorted({w['turn'] for w in toks}):
            ws = [w for w in toks if w['turn'] == ti]
            who = WHO[turns[ti]['speaker']] if turns else SOLO[k]
            T['lines'].append({'id': k, 'who': who, 'scene': scene, 't0': a(ws[0]['t0']), 't1': a(ws[-1]['t1']),
                               'text': ' '.join(w['w'] for w in ws),
                               'words': [{'t0': a(w['t0']), 't1': a(w['t1']), 'w': w['w']} for w in ws]})
            for w in ws:
                T['talk'].append([a(w['t0']), a(w['t1']), who])
    start = t
    t += dur + gap_after
    return start, start + dur


def beat(name, at=None):
    T['beats'][name] = round(t if at is None else at, 3)


def hold(s):
    global t
    t += s


# 1. Opening
section('open')
hold(.6)
put('ar01', .3)
put('ar02', .5)
beat('title')
hold(3.2)
# 2a. Street
section('street')
hold(.4)
put('ar03', .6)
beat('school_seen')
s, e = put('ar04', .2)
beat('door_open', e - .6)
# 2b. Door: the mistake
section('door')
hold(.5)
put('open3', 0, scene='door')
beat('sorry', T['lines'][-1]['t0'])
beat('freeze', T['lines'][-1]['t1'] + .15)
hold(.6)
put('ar05', .5)
beat('unfreeze')
# 2c. Second try
section('retry')
put('en2', .4, scene='retry')
beat('come_in', T['lines'][-1]['t0'])
put('ar06', .6)
# 2d. The day passes
section('day')
beat('day_start')
put('ar07', 1.2)
# 2e. Goodbye
section('bye')
hold(.4)
put('en3', 0, scene='bye')
beat('eight', T['lines'][-1]['t0'])
hold(.5)
put('ar08', 1.0)
# 3. Recap
section('recap')
beat('recap_title')
hold(2.0)
REPEAT = 1.1   # room to repeat after a model line
for k, gap, item in [('ar09', .4, None), ('r01', .35, 'hi'), ('r02', REPEAT, 'hi'),
                     ('ar10', .4, 'am'), ('r03', REPEAT, 'am'), ('ar11', .4, 'im'), ('r04', REPEAT, 'im'),
                     ('ar12', .4, 'name'), ('r05', .4, 'name'), ('r06', REPEAT, 'name'),
                     ('ar13', .4, 'too'), ('r07', REPEAT, 'too'), ('ar14', .4, 'sorry'), ('r08', REPEAT, 'sorry'),
                     ('ar15', .4, 'bye'), ('r09', .35, 'bye'), ('r10', REPEAT, 'bye')]:
    s, e = put(k, gap, scene='recap')
    if item:
        if not T['recap'] or T['recap'][-1]['id'] != item:
            T['recap'].append({'id': item, 't0': round(s, 3)})
        T['recap'][-1]['t1'] = round(t, 3)
# 4. Your turn
section('turn')
put('ar16', .4)
put('turn', .3, scene='turn')
beat('pause_start')
hold(4.5)
beat('pause_end')
put('ar17', .6)
# 5. Next time
section('next')
put('ar18', .5)
beat('end_card')
hold(4.0)
T['sections'][-1]['t1'] = round(t, 3)
T['dur'] = round(t, 3)
T['talk'].sort()
json.dump(T, open(os.path.join(HERE, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
print(f"dur {T['dur']:.2f}s  estimated: {T['estimated'] or 'none'}")
for s in T['sections']:
    print(f"  {s['id']:7s} {s['t0']:7.2f} {s['t1']:7.2f}")
