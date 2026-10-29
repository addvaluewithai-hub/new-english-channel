"""Lip sync: mouth shapes over time from the text and the voice.
Each spoken word (already timed by the voice transcript) is turned into a run of visemes from its letters/phonemes,
spread across the word's time by typical durations, then gated by the audio's loudness so pauses close the mouth.
Shapes (the Preston Blair set): X rest · A closed (M B P) · B slightly open, teeth (most consonants, EE) · C open (EH AE)
· D wide open (AA) · E rounded open (AO ER) · F puckered (UW OW W) · G teeth on lip (F V) · H tongue up (L)."""
import os, re

# ---- English: a small ARPAbet lexicon for the show's vocabulary, plus a letter fallback ----
LEX = {
 'hi': 'HH AY', 'hello': 'HH AH L OW', "i'm": 'AY M', 'i': 'AY', 'mia': 'M IY AH', 'youssef': 'Y UW S EH F', 'sorry': 'S AA R IY',
 "what's": 'W AH T S', 'what': 'W AH T', 'your': 'Y AO R', 'name': 'N EY M', 'my': 'M AY', 'is': 'IH Z', 'nice': 'N AY S',
 'to': 'T UW', 'meet': 'M IY T', 'you': 'Y UW', 'too': 'T UW', 'come': 'K AH M', 'in': 'IH N', 'bye': 'B AY', 'see': 'S IY',
 'tomorrow': 'T AH M AA R OW', 'goodbye': 'G UH D B AY', 'class': 'K L AE S', 'at': 'AE T', 'eight': 'EY T', 'am': 'AE M',
 'good': 'G UH D', 'morning': 'M AO R N IH NG', 'night': 'N AY T', 'how': 'HH AW', 'are': 'AA R', 'oh': 'OW', 'so': 'S OW',
 'ok': 'OW K EY', 'okay': 'OW K EY', 'a': 'AH', 'little': 'L IH T AH L', 'tired': 'T AY ER D', 'coffee': 'K AO F IY',
 'yes': 'Y EH S', 'please': 'P L IY Z', 'thank': 'TH AE NG K', 'thanks': 'TH AE NG K S', "you're": 'Y UH R',
 'welcome': 'W EH L K AH M', 'one': 'W AH N', 'more': 'M AO R', 'thing': 'TH IH NG', 'this': 'DH IH S', 'form': 'F AO R M',
 'for': 'F AO R', 'afternoon': 'AE F T ER N UW N', 'evening': 'IY V N IH NG', 'not': 'N AA T', 'bad': 'B AE D',
 'and': 'AE N D', 'old': 'OW L D', 'have': 'HH AE V', '26': 'T W EH N T IY S IH K S', 'twenty-six': 'T W EH N T IY S IH K S',
 'years': 'Y IH R Z', 'me': 'M IY', 'the': 'DH AH', 'it': 'IH T', "it's": 'IH T S', 'do': 'D UW', 'where': 'W EH R',
 'from': 'F R AH M', 'live': 'L IH V', 'cairo': 'K AY R OW', 'london': 'L AH N D AH N', 'egypt': 'IY JH IH P T',
 'engineer': 'EH N JH IH N IH R', 'an': 'AE N', 'friend': 'F R EH N D', 'he': 'HH IY', 'she': 'SH IY', 'his': 'HH IH Z',
 'her': 'HH ER', 'tom': 'T AA M', 'sara': 'S AA R AH', 'no': 'N OW', 'can': 'K AE N', 'spell': 'S P EH L', 'that': 'DH AE T',
 'number': 'N AH M B ER', 'phone': 'F OW N', 'email': 'IY M EY L', 'again': 'AH G EH N', 'slowly': 'S L OW L IY',
 'excuse': 'IH K S K Y UW Z', 'fine': 'F AY N', 'great': 'G R EY T', 'really': 'R IY L IY', 'pretty': 'P R IH T IY',
 'happy': 'HH AE P IY', 'sad': 'S AE D', 'excited': 'IH K S AY T IH D', 'twenty': 'T W EH N T IY', 'six': 'S IH K S',
}
PH2V = {'P': 'A', 'B': 'A', 'M': 'A', 'F': 'G', 'V': 'G', 'L': 'H', 'W': 'F', 'UW': 'F', 'OW': 'F', 'UH': 'F', 'OY': 'E',
        'AO': 'E', 'ER': 'E', 'AA': 'D', 'AW': 'D', 'AY': 'D', 'EH': 'C', 'AE': 'C', 'AH': 'C', 'EY': 'C', 'IY': 'B', 'IH': 'B',
        'Y': 'B'}
VOWELS = {'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'}
DIPH = {'AY', 'AW', 'OW', 'OY', 'EY'}
LETTER = {'a': 'AE', 'e': 'EH', 'i': 'IH', 'o': 'OW', 'u': 'AH', 'y': 'IY', 'p': 'P', 'b': 'B', 'm': 'M', 'f': 'F', 'v': 'V',
          'l': 'L', 'w': 'W'}


def en_phones(word):
    w = word.lower().strip(".,!?…;:\"'()")
    w = w.replace('’', "'")
    if w in LEX:
        return LEX[w].split()
    out = []
    for ch in w:
        out.append(LETTER.get(ch, 'T' if ch.isalpha() else None))
    return [p for p in out if p]


def en_visemes(word):
    """[(shape, weight)] for an English word: diphthongs get a second, closing shape."""
    out = []
    for p in en_phones(word):
        v = PH2V.get(p, 'B')
        if p in DIPH:
            tail = {'AY': 'B', 'AW': 'F', 'OW': 'F', 'OY': 'B', 'EY': 'B'}[p]
            out += [(v, 1.3), (tail, .7)]
        elif p in VOWELS:
            out.append((v, 1.6))
        elif p in ('P', 'B', 'T', 'D', 'K', 'G'):
            out.append((v, .7))
        else:
            out.append((v, 1.0))
    return out


# ---- Arabic: the script is nearly phonemic, so letters map to shapes; unwritten short vowels open the mouth a little ----
AR = {'ب': 'A', 'م': 'A', 'ف': 'G', 'ڤ': 'G', 'و': 'F', 'ا': 'D', 'آ': 'D', 'أ': 'D', 'إ': 'B', 'ى': 'C', 'ي': 'B', 'ل': 'H',
      'ش': 'E', 'ج': 'E', 'ة': 'C', 'ه': 'C', 'ع': 'C', 'ح': 'C', 'ء': 'C',
      'َ': 'C', 'ُ': 'F', 'ِ': 'B', 'ً': 'C', 'ٌ': 'F', 'ٍ': 'B'}
AR_CONS = set('تثدذرزسصضطظكقنغخ')


def ar_visemes(word):
    out, prev_cons = [], False
    for ch in word:
        if ch in ('ّ', 'ْ', 'ـ'):          # shadda / sukun / tatweel: no shape of their own
            continue
        if ch in AR:
            v = AR[ch]
            out.append((v, 1.5 if v in 'CDF' and ch in 'اآأوى' else 1.0))
            prev_cons = False
        elif ch in AR_CONS:
            if prev_cons:
                out.append(('C', .6))                     # an unwritten short vowel between two consonants
            out.append(('B', .9))
            prev_cons = True
        elif ch.isalpha():
            out.append(('B', .9)); prev_cons = True
    return out


def visemes(word):
    return ar_visemes(word) if any('؀' <= c <= 'ۿ' for c in word) else en_visemes(word)


# ---- the audio gate: where the voice is quiet, the mouth rests ----
def envelope(path, hop=.005):
    """RMS envelope of a wav at 200 Hz, normalised to its loud parts. None if the audio libs are missing."""
    try:
        import numpy as np, soundfile as sf
    except ImportError:
        return None
    x, sr = sf.read(path)
    x = x if x.ndim == 1 else x.mean(1)
    n = int(sr * hop)
    e = np.sqrt(np.convolve(x * x, np.ones(n) / n, 'same'))[::n]
    ref = np.percentile(e, 97) or 1
    return e / ref, hop


def gate_open(env, t):
    if env is None:
        return 1.0
    e, hop = env
    i = int(t / hop)
    return float(e[min(len(e) - 1, max(0, i))])


def track(words, who, clip_t, env, min_len=.07, quiet=.1):
    """Mouth segments [[t0, t1, who, shape]] for timed words [{t0,t1,w}] (absolute times); clip_t = the clip's start."""
    segs = []
    for w in words:
        vs = visemes(w['w']) or [('C', 1)]
        tot = sum(k for _, k in vs)
        t = w['t0']
        for shape, k in vs:
            d = (w['t1'] - w['t0']) * k / tot
            segs.append([t, t + d, shape])
            t += d
    # gate: a quiet stretch inside a word closes the mouth
    if env is not None:
        gated = []
        for t0, t1, s in segs:
            steps = max(1, int((t1 - t0) / .02))
            cur, c0 = None, t0
            for i in range(steps + 1):
                tt = t0 + (t1 - t0) * i / steps
                sh = s if gate_open(env, tt - clip_t) > quiet else 'X'
                if sh != cur:
                    if cur is not None and tt > c0:
                        gated.append([c0, tt, cur])
                    cur, c0 = sh, tt
            if cur is not None and t1 > c0:
                gated.append([c0, t1, cur])
        segs = gated
    # merge equal neighbours, drop too-short ones into the previous shape
    out = []
    for t0, t1, s in segs:
        if out and out[-1][2] == s and t0 - out[-1][1] < .03:
            out[-1][1] = t1
        elif out and (t1 - t0) < min_len and t0 - out[-1][1] < .03:
            out[-1][1] = t1
        else:
            out.append([t0, t1, s])
    return [[round(a, 3), round(b, 3), who, s] for a, b, s in out if s != 'X']


def build(T, voices_dir):
    """Adds T['mouth'] (dialogue, by speaker) and T['mouth_nar'] (the diary voice, Youssef) from the timeline."""
    place = {p['clip']: p['t'] for p in T['place']}
    envs = {}
    for k, t in place.items():
        p = os.path.join(voices_dir, k + '.wav')
        envs[k] = envelope(p) if os.path.exists(p) else None
    mouth, nar = [], []
    for l in T['lines']:
        mouth += track(l['words'], l['who'], place[l['id']], envs.get(l['id']))
    for n in T['narration']:
        nar += track(n['words'], 'youssef', place[n['id']], envs.get(n['id']))
    T['mouth'] = sorted(mouth)
    T['mouth_nar'] = sorted(nar)
    return T
