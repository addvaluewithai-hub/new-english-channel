# Downloads finished episode-4 clips from the gemini-tts runs: python3 fetch.py [vN] [limit]
# Looks through the latest runs' logs for channel-ep04-<key>-<ver> Cloudinary URLs and saves voices/<key>.wav|.transcript.json
import json, os, re, subprocess, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(HERE, '..', 'voices')
ver = sys.argv[1] if len(sys.argv) > 1 else 'v1'; lim = sys.argv[2] if len(sys.argv) > 2 else '80'
seen = json.load(open(os.path.join(HERE, 'runs_seen.json'))) if os.path.exists(os.path.join(HERE, 'runs_seen.json')) else {}
runs = json.loads(subprocess.run(['gh', 'run', 'list', '-R', 'addvaluewithai-hub/gemini-tts', '-L', lim, '--json', 'databaseId,status,conclusion'],
                                 capture_output=True, text=True, check=True).stdout)
pat = re.compile(r'https://res\.cloudinary\.com/[^" \s]*channel-ep04-([a-z0-9]+)-' + ver + r'\.(wav|transcript\.json)')
got = {}
for r in runs:
    rid = str(r['databaseId'])
    if r['status'] != 'completed' or rid in seen: continue
    log = subprocess.run(['gh', 'run', 'view', rid, '-R', 'addvaluewithai-hub/gemini-tts', '--log'], capture_output=True, text=True).stdout
    hits = {(m.group(1), m.group(2)): m.group(0) for m in pat.finditer(log)}
    seen[rid] = sorted({k for k, _ in hits}) or (['-'] if r['conclusion'] == 'success' and 'channel-ep04' not in log else ['?'])
    if 'channel-ep04' in log and not hits: print('run', rid, r['conclusion'], 'mentions ep04 but no urls for', ver)
    for (k, ext), url in hits.items():
        urllib.request.urlretrieve(url, os.path.join(V, f'{k}.{ext}')); got.setdefault(k, []).append(ext)
json.dump(seen, open(os.path.join(HERE, 'runs_seen.json'), 'w'))
print('downloaded:', sorted(got))
