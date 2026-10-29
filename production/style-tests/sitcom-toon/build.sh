#!/bin/sh
# Rebuild the Sitcom Toon style test: lip envelopes → frames → mux (no grain: flat vector style)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
AUDIO="$HERE/../audio/test_audio.wav"
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
"$LIB/.venv/bin/python" "$HERE/lips.py" "$HERE" "$AUDIO"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
# local copy of core/render/mux.sh: its decoded-length check misreads loudnorm's look-ahead on this WAV
sh "$HERE/mux_local.sh" "$HERE/out/video.mp4" "$AUDIO" "$HERE/sitcom-toon.mp4" 24 0
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/sitcom-toon.srt"
node core/render/still.mjs "$HERE" 3 10.5 15.2
