"""English pronunciation pinning for Gemini TTS.
Every English phrase (inside Arabic narration, or a whole English line) is wrapped in <lang>/<phoneme> markup with
General American IPA, so the voice says it the same way every time (the technique proven in the owner's `tts` repo).
The transcript side strips the tags (tlkit.strip_tags)."""
import re
from lipsync import LEX, en_phones

# Egyptian transliteration as written in the scripts -> (English text, IPA)
PHRASES = [
    ('آي يوسف', 'I Youssef', 'aɪ ˈjuːsɛf'),
    ('آيم', "I'm", 'aɪm'),
    ('آم', 'am', 'æm'),
    ('نايس تو ميت يو', 'Nice to meet you', 'naɪs tə mit ju'),
    ('مي تو', 'Me too', 'mi tu'),
    ('هاو أولد آر يو', 'How old are you', 'haʊ oʊld ɑr ju'),
    ('هاو آر يو', 'How are you', 'haʊ ɑr ju'),
    ('جود مورنينج', 'Good morning', 'ɡʊd ˈmɔrnɪŋ'),
    ('جود نايت', 'Good night', 'ɡʊd naɪt'),
    ('يور ويلكم', "You're welcome", 'jʊr ˈwɛlkəm'),
    ('ويلكم', 'Welcome', 'ˈwɛlkəm'),
    ('آند يو', 'And you', 'ænd ju'),
    ('ثانك يو', 'Thank you', 'θæŋk ju'),
    ('بليز', 'Please', 'pliz'),
    ('سوري', 'Sorry', 'ˈsɑri'),
    ('آي هاف توينتي سيكس ييرز', 'I have 26 years', 'aɪ hæv ˈtwɛnti sɪks jɪrz'),
]
NOTE = (" Bracketed tags and XML/IPA pronunciation markup in the text are silent instructions and must never be spoken; "
        "say the tagged English with a clean, natural General American pronunciation.")
NOTE_AR = NOTE + " Then continue in Egyptian Arabic."

# ARPAbet (as in lipsync.LEX) -> General American IPA
A2I = {'AA': 'ɑ', 'AE': 'æ', 'AH': 'ə', 'AO': 'ɔ', 'AW': 'aʊ', 'AY': 'aɪ', 'EH': 'ɛ', 'ER': 'ɚ', 'EY': 'eɪ', 'IH': 'ɪ',
       'IY': 'i', 'OW': 'oʊ', 'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'u', 'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f',
       'G': 'ɡ', 'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'r', 'S': 's',
       'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v', 'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ'}
# a few words whose dictionary form needs a stressed/contextual vowel
OVERRIDE = {'youssef': 'ˈjusɛf', 'sara': 'ˈsɛrə', 'a': 'ə', 'the': 'ðə', 'to': 'tə', 'you': 'ju', 'and': 'ænd',
            'ok': 'oʊˈkeɪ', 'okay': 'oʊˈkeɪ', 'new': 'nu', 'york': 'jɔrk', 'brooklyn': 'ˈbrʊklɪn', 'queens': 'kwinz',
            'eight': 'eɪt', 'oh': 'oʊ', 'so': 'soʊ', 'i': 'aɪ', 'my': 'maɪ', 'hi': 'haɪ', 'bye': 'baɪ'}


def word_ipa(word):
    w = word.lower().strip(".,!?…;:\"'()").replace('’', "'")
    if w in OVERRIDE:
        return OVERRIDE[w]
    if w in LEX:
        return ''.join(A2I.get(p, '') for p in LEX[w].split())
    return None


def en(text, ipa):
    return f'<lang xml:lang="en-US"><phoneme alphabet="ipa" ph="{ipa}">{text}</phoneme></lang>'


def tag(text):
    """Arabic line: replace every transliterated English phrase with the tagged English."""
    for ar, enx, ipa in sorted(PHRASES, key=lambda p: -len(p[0])):
        text = re.sub(ar + r'(?=[\s،؛؟.!…:]|$)', en(enx, ipa), text)
    return text


MISSING = set()


def tag_line(text):
    """Whole English line: one <lang> run per sentence with the IPA of all its words; event tags stay outside."""
    out = []
    for part in re.split(r'(<[^>]+>)', text):
        if not part or part.startswith('<'):
            out.append(part); continue
        for sent in re.split(r'(?<=[.!?…])\s+', part.strip()):
            if not sent:
                continue
            words = sent.split()
            ipas = []
            for w in words:
                i = word_ipa(w)
                if i is None:
                    MISSING.add(w); ipas = None; break
                ipas.append(i)
            out.append(en(sent, ' '.join(ipas)) if ipas else sent)
            out.append(' ')
    return re.sub(r'\s+', ' ', ''.join(out)).strip()


def has_english(text):
    return '<lang' in text
