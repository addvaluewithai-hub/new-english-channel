"""One-time, on the channel owner's computer: authorize uploads and write token.json (keep it private; paste its content
into the GitHub secret YT_TOKEN_JSON). Needs client_secret.json from Google Cloud next to this file.
    pip install google-auth-oauthlib
    python yt_auth.py"""
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl']
flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
creds = flow.run_local_server(port=0, prompt='consent', access_type='offline')
open('token.json', 'w').write(creds.to_json())
print('token.json written. Add its content as the GitHub secret YT_TOKEN_JSON, then delete the file.')
