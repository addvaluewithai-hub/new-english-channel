"""Episode 3 vocabulary, shared by tts/make_jobs.py (IPA pinning) and timeline.py (lip sync): numbers with their stress,
the new words, the transliterations the diary voice uses. Extends lib/pron.py and lib/lipsync.py from inside the episode."""
import pron, lipsync

# ---- episode 3 vocabulary: General American IPA (stress marked) + ARPAbet for the lip sync ----
WORDS = {   # word: (ipa, arpabet)
 'zero': ('ˈzɪroʊ', 'Z IH R OW'), 'one': ('wʌn', 'W AH N'), 'two': ('tu', 'T UW'), 'three': ('θri', 'TH R IY'), 'four': ('fɔr', 'F AO R'),
 'five': ('faɪv', 'F AY V'), 'six': ('sɪks', 'S IH K S'), 'seven': ('ˈsɛvən', 'S EH V AH N'), 'eight': ('eɪt', 'EY T'), 'nine': ('naɪn', 'N AY N'),
 'ten': ('tɛn', 'T EH N'), 'eleven': ('ɪˈlɛvən', 'IH L EH V AH N'), 'twelve': ('twɛlv', 'T W EH L V'),
 'thirteen': ('θɝˈtin', 'TH ER T IY N'), 'fourteen': ('fɔrˈtin', 'F AO R T IY N'), 'fifteen': ('fɪfˈtin', 'F IH F T IY N'),
 'sixteen': ('sɪkˈstin', 'S IH K S T IY N'), 'seventeen': ('ˌsɛvənˈtin', 'S EH V AH N T IY N'), 'eighteen': ('eɪˈtin', 'EY T IY N'),
 'nineteen': ('naɪnˈtin', 'N AY N T IY N'), 'twenty': ('ˈtwɛnti', 'T W EH N T IY'), 'thirty': ('ˈθɝdi', 'TH ER D IY'),
 'forty': ('ˈfɔrdi', 'F AO R D IY'), 'fifty': ('ˈfɪfti', 'F IH F T IY'), 'sixty': ('ˈsɪksti', 'S IH K S T IY'),
 'seventy': ('ˈsɛvənti', 'S EH V AH N T IY'), 'eighty': ('ˈeɪdi', 'EY D IY'), 'ninety': ('ˈnaɪndi', 'N AY N D IY'),
 'hundred': ('ˈhʌndrəd', 'HH AH N D R AH D'), '26': ('ˈtwɛnti sɪks', 'T W EH N T IY S IH K S'),
 'twenty-six': ('ˈtwɛnti sɪks', 'T W EH N T IY S IH K S'), 'six-zero': ('sɪks ˈzɪroʊ', 'S IH K S Z IH R OW'),
 'years': ('jɪrz', 'Y IH R Z'), 'old': ('oʊld', 'OW L D'), 'have': ('hæv', 'HH AE V'),
 'can': ('kæn', 'K AE N'), 'help': ('hɛlp', 'HH EH L P'), 'this': ('ðɪs', 'DH IH S'), 'is': ('ɪz', 'IH Z'), 'form': ('fɔrm', 'F AO R M'),
 'thank': ('θæŋk', 'TH AE NG K'), 'nice': ('naɪs', 'N AY S'), 'from': ('frʌm', 'F R AH M'), 'cairo': ('ˈkaɪroʊ', 'K AY R OW'),
 'how': ('haʊ', 'HH AW'), 'are': ('ɑr', 'AA R'), 'not': ('nɑt', 'N AA T'), 'say': ('seɪ', 'S EY'), 'great': ('ɡreɪt', 'G R EY T'),
 'me': ('mi', 'M IY'), 'ha': ('hɑ', 'HH AA'), 'no': ('noʊ', 'N OW'), 'class': ('klæs', 'K L AE S'), 'starts': ('stɑrts', 'S T AA R T S'),
 'now': ('naʊ', 'N AW'), 'room': ('rum', 'R UW M'), 'good': ('ɡʊd', 'G UH D'), 'morning': ('ˈmɔrnɪŋ', 'M AO R N IH NG'),
 'where': ('wɛr', 'W EH R'), 'lopez': ('ˈloʊpɛz', 'L OW P EH Z'), 'tired': ('ˈtaɪɚd', 'T AY ER D'), "i'm": ('aɪm', 'AY M'),
}
for w, (ipa, arp) in WORDS.items():
    pron.OVERRIDE[w] = ipa
    lipsync.LEX[w] = arp
# transliterations in the diary voice -> (English shown on the plate, IPA)
pron.PHRASES += [
    ('آيم توينتي سيكس ييرز أولد', "I'm 26 years old", 'aɪm ˈtwɛnti sɪks jɪrz oʊld'),
    ('آيم توينتي سيكس ييرز', "I'm 26 years", 'aɪm ˈtwɛnti sɪks jɪrz'),
    ('آيم توينتي سيكس', "I'm 26", 'aɪm ˈtwɛnti sɪks'),
    ('آيم تايرد', "I'm tired", 'aɪm ˈtaɪɚd'),
    ('توينتي سيكس', 'twenty-six', 'ˈtwɛnti sɪks'),
    ('سيكستين', 'sixteen', 'sɪkˈstin'),
    ('سيكستي', 'sixty', 'ˈsɪksti'),
    ('أولد', 'old', 'oʊld'),
    ('تيين', '-teen', 'tin'),
    ('تيي', 'tee', 'ti'),   # the -ty ending: the voice spelled "-ty" as letters (T-Y) or said "tie"; the plate shows -ty (timeline.py display)
    ('وير آر يو فروم', 'Where are you from', 'wɛr ɑr ju frʌm'),
]

