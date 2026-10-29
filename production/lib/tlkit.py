"""Lays an episode out in time from its voice clips -> timeline.json (the single source of truth for picture and sound).
Each episode's timeline.py only describes the layout; aligning words to the voice lives here.
Missing clips are estimated, so the picture can be built before the voices arrive."""
import json, os, re, wave
from difflib import SequenceMatcher

WHO = {'Mia': 'mia', 'Youssef': 'youssef'}
# transliterations the diary voice says -> how the plate shows them (one Latin token). Episodes may add their own.
LATIN = [('آي يوسف', 'I Youssef'), ('آيم', "I'm"), ('آم', 'am'), ('نايس تو ميت يو', 'Nice to meet you'),
         ('مي تو', 'Me too'), ('هاو آر يو', 'How are you')]
AR_RANGE = '؀-ۿ'


def strip_tags(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s)).strip()


def norm(w):
    w = re.sub(r'[ً-ْـ]', '', w.lower())
    w = re.sub('[أإآ]', 'ا', w).replace('ة', 'ه').replace('ى', 'ي')
    return re.sub(r"[^\w']", '', w)


def is_ar(s):
    return any('؀' <= c <= 'ۿ' for c in s)


class Builder:
    """b = Builder(episode dir); b.section/put/hold/beat/item; b.finish() writes timeline.json"""

    def __init__(self, here, solo=None, display=None, latin=(), extra_jobs=None):
        self.here = here
        self.V = os.path.join(here, 'voices')
        self.JOBS = json.load(open(os.path.join(here, 'tts/jobs.json')))
        self.JOBS.update(extra_jobs or {})
        self.SOLO = {k: WHO[v] for k, v in (solo or {}).items()}   # single-voice English clips: who says them
        self.DISPLAY = display or {}                                  # clip -> text the plate shows (when the voice ad-libbed)
        self.LATIN = list(latin) + LATIN
        self.T = {'dur': 0, 'fps': 24, 'sections': [], 'narration': [], 'lines': [], 'talk': [], 'beats': {}, 'recap': [],
                  'place': [], 'estimated': []}
        self.t = 0.0

    # ---- clips ----
    def clip(self, k):
        """Duration and words [{t0,t1,w,spk}] of a clip, measured if present, estimated if not."""
        wav, tr = os.path.join(self.V, k + '.wav'), os.path.join(self.V, k + '.transcript.json')
        if os.path.exists(wav) and os.path.exists(tr):
            with wave.open(wav) as f:
                dur = f.getnframes() / f.getframerate()
            d = json.load(open(tr))
            words = [{'t0': w['start_ms'] / 1000, 't1': w['end_ms'] / 1000, 'w': w['text'], 'spk': w.get('speaker')} for w in d['words']]
            return dur, words, True
        j = self.JOBS[k]
        turns = j.get('turns') or [{'speaker': None, 'text': j['text']}]
        words, t = [], .3
        for i, tu in enumerate(turns):
            for w in strip_tags(tu['text']).split():
                n = .42 if is_ar(w) else .34
                words.append({'t0': t, 't1': t + n, 'w': w, 'spk': f'spk:{i}'})
                t += n + .05
            t += .6
        return t, words, False

    def tokens(self, k):
        """Source tokens [(display, spoken_norm, turn)] of clip k, with transliterations merged into one Latin token."""
        j = self.JOBS[k]
        turns = j.get('turns') or [{'text': self.DISPLAY.get(k, j['text'])}]
        out = []
        for ti, tu in enumerate(turns):
            ws = strip_tags(tu['text']).replace('...', '… ').split()
            i = 0
            while i < len(ws):
                for ar, lat in self.LATIN:
                    n = len(ar.split())
                    if [norm(x) for x in ws[i:i + n]] == [norm(x) for x in ar.split()]:
                        tail = re.sub(r'^[\wء-ي]+', '', ws[i + n - 1])  # keep trailing punctuation
                        out.append((lat + tail.translate(str.maketrans('،؟؛', ',?;')), [norm(x) for x in ws[i:i + n]], ti))
                        i += n
                        break
                else:
                    out.append((ws[i], [norm(ws[i])], ti))
                    i += 1
        return out

    @staticmethod
    def align(toks, words, dur):
        """Times for each source token from the recognized words; unrecognized tokens share the gaps."""
        # transliterated English is never anchored on its own: the recognizer drops or mangles it, so it fills its gap
        translit = lambda t: t[0][:1].isascii() and is_ar(''.join(t[1]))
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

    # ---- layout ----
    def section(self, name):
        T = self.T
        if T['sections']:
            T['sections'][-1]['t1'] = round(self.t, 3)
        T['sections'].append({'id': name, 't0': round(self.t, 3)})

    def put(self, k, gap_after=.35, scene=None):
        """Place clip k at the current time, record its words, advance the clock. Returns (start, end of speech)."""
        T, t = self.T, self.t
        dur, words, real = self.clip(k)
        if not real:
            T['estimated'].append(k)
        T['place'].append({'clip': k, 't': round(t, 3), 'dur': round(dur, 3)})
        a = lambda x: round(t + x, 3)
        toks = self.align(self.tokens(k), words, dur)
        if k.startswith('ar'):
            T['narration'].append({'id': k, 't0': a(toks[0]['t0']), 't1': a(toks[-1]['t1']), 'ar': ' '.join(w['w'] for w in toks),
                                   'words': [{'t0': a(w['t0']), 't1': a(w['t1']), 'w': w['w']} for w in toks]})
        else:
            turns = self.JOBS[k].get('turns')
            for ti in sorted({w['turn'] for w in toks}):
                ws = [w for w in toks if w['turn'] == ti]
                who = WHO[turns[ti]['speaker']] if turns else self.SOLO[k]
                T['lines'].append({'id': k, 'who': who, 'scene': scene, 't0': a(ws[0]['t0']), 't1': a(ws[-1]['t1']),
                                   'text': ' '.join(w['w'] for w in ws),
                                   'words': [{'t0': a(w['t0']), 't1': a(w['t1']), 'w': w['w']} for w in ws]})
                for w in ws:
                    T['talk'].append([a(w['t0']), a(w['t1']), who])
        self.t += dur + gap_after
        return t, t + dur

    def last_line(self):
        return self.T['lines'][-1]

    def beat(self, name, at=None):
        self.T['beats'][name] = round(self.t if at is None else at, 3)

    def hold(self, s):
        self.t += s

    def recap(self, seq, repeat=1.1):
        """seq: [(clip, gap, item id or None)]; items group consecutive clips into recap cards. 'R' as gap = room to repeat."""
        T = self.T
        for k, gap, item in seq:
            s, e = self.put(k, repeat if gap == 'R' else gap, scene='recap')
            if item:
                if not T['recap'] or T['recap'][-1]['id'] != item:
                    T['recap'].append({'id': item, 't0': round(s, 3)})
                T['recap'][-1]['t1'] = round(self.t, 3)

    def finish(self):
        T = self.T
        T['sections'][-1]['t1'] = round(self.t, 3)
        T['dur'] = round(self.t, 3)
        T['talk'].sort()
        import lipsync
        lipsync.build(T, self.V)
        json.dump(T, open(os.path.join(self.here, 'timeline.json'), 'w'), ensure_ascii=False, indent=1)
        print(f"dur {T['dur']:.2f}s  estimated: {T['estimated'] or 'none'}  mouth segments: {len(T['mouth'])} + {len(T['mouth_nar'])} narration")
        for s in T['sections']:
            print(f"  {s['id']:7s} {s['t0']:7.2f} {s['t1']:7.2f}")
        return T
