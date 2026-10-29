#!/bin/sh
# One-command rebuild of the rubber-hose style test.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 1 --out "$HERE/out/video.mp4"
sh "$HERE/mux_local.sh" "$HERE/out/video.mp4" "$HERE/../audio/test_audio.wav" "$HERE/rubber-hose.mp4" 24 3
node core/render/still.mjs "$HERE" 3 10.5 15.2 --out "$HERE/stills"
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/rubber-hose.srt"
