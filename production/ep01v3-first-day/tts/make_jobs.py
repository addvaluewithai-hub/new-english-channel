# Episode 1 v3 (the middle cut): NO new TTS. Every clip already exists; this only composes tts/jobs.json (the source texts that
# tlkit tokenizes/aligns) from the two earlier builds: v1 (ep01-first-day) for its narration + dialogue, v2 for the new clips.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(HERE, '..', '..')
v1 = json.load(open(os.path.join(P, 'ep01-first-day', 'tts', 'jobs.json')))
v2 = json.load(open(os.path.join(P, 'ep01v2-first-day', 'tts', 'jobs.json')))
FROM_V1 = ['open', 'en2', 'en3', 'turn'] + [f'r{i:02d}' for i in range(1, 11)] + ['ar01', 'ar02', 'ar05', 'ar06', 'ar08'] + [f'ar{i:02d}' for i in range(9, 20)]
FROM_V2 = ['ar00', 'ar07', 'en1a', 'en4', 'en5', 'e6s', 'e6l', 'e6m']
jobs = {**{k: v1[k] for k in FROM_V1}, **{k: v2[k] for k in FROM_V2}}
json.dump(jobs, open(os.path.join(HERE, 'jobs.json'), 'w'), ensure_ascii=False, indent=1)
print(len(jobs), 'jobs (v1:', len(FROM_V1), ' v2:', len(FROM_V2), ') — nothing to dispatch')
