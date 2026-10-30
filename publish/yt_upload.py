"""Upload one episode to YouTube with all its metadata: video, title, description, tags, Arabic captions, thumbnail, playlist.
Runs in GitHub Actions (see .github/workflows/youtube.yml). Secrets: YT_CLIENT_SECRET_JSON (OAuth client), YT_TOKEN_JSON (the
owner's refresh token from yt_auth.py). Usage: python yt_upload.py <ep id e.g. ep01> <video.mp4> <captions.srt> <thumb.jpg> <privacy>"""
import json, os, re, sys
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

ep, video, srt, thumb, privacy = sys.argv[1:6]
HERE = os.path.dirname(os.path.abspath(__file__))
PLAYLIST_TITLE = "يوسف في نيويورك – A1"

# ---- metadata from publish/<ep>.md (## العنوان / ## الوصف / ## التاجز) ----
md = open(os.path.join(HERE, ep + '.md'), encoding='utf-8').read()
sect = lambda name: re.search(r'^## ' + name + r'\n(.*?)(?=^## |\Z)', md, re.S | re.M).group(1).strip()
title, desc, tags = sect('العنوان'), sect('الوصف'), [t.strip() for t in sect('التاجز').split(',') if t.strip()]
assert len(title) <= 100, 'title too long'

creds = Credentials.from_authorized_user_info(json.loads(os.environ['YT_TOKEN_JSON']))
yt = build('youtube', 'v3', credentials=creds)

body = {'snippet': {'title': title, 'description': desc, 'tags': tags, 'categoryId': '27',   # Education
                    'defaultLanguage': 'ar', 'defaultAudioLanguage': 'ar'},
        'status': {'privacyStatus': privacy, 'selfDeclaredMadeForKids': False}}
req = yt.videos().insert(part='snippet,status', body=body, media_body=MediaFileUpload(video, chunksize=8 * 1024 * 1024, resumable=True))
res = None
while res is None:
    status, res = req.next_chunk()
    if status:
        print(f'upload {int(status.progress() * 100)}%')
vid = res['id']
print('video', vid, f'https://youtu.be/{vid}')

if os.path.exists(srt):
    yt.captions().insert(part='snippet', body={'snippet': {'videoId': vid, 'language': 'ar', 'name': 'العربية', 'isDraft': False}},
                         media_body=MediaFileUpload(srt, mimetype='application/octet-stream')).execute()
    print('captions ok')
if os.path.exists(thumb):
    yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(thumb, mimetype='image/jpeg')).execute()
    print('thumbnail ok')

# playlist: find or create, then add
pl = None
for p in yt.playlists().list(part='snippet', mine=True, maxResults=50).execute().get('items', []):
    if p['snippet']['title'] == PLAYLIST_TITLE:
        pl = p['id']
if not pl:
    pl = yt.playlists().insert(part='snippet,status', body={'snippet': {'title': PLAYLIST_TITLE, 'description': 'مسلسل تعليمي: كل حلقة موقف من حياة يوسف في نيويورك والإنجليزي اللي محتاجه فيه. المستوى A1.'},
                                                               'status': {'privacyStatus': 'public'}}).execute()['id']
yt.playlistItems().insert(part='snippet', body={'snippet': {'playlistId': pl, 'resourceId': {'kind': 'youtube#video', 'videoId': vid}}}).execute()
print('playlist ok')

out = os.environ.get('GITHUB_OUTPUT')
if out:
    open(out, 'a').write(f'video_id={vid}\nurl=https://youtu.be/{vid}\n')
