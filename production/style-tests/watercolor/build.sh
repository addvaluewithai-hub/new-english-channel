#!/bin/sh
# one-command rebuild: picture → video → mux with the supplied voice track
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
[ -f "$HERE/paper.jpg" ] || (cd "$HERE" && "$LIB/.venv/bin/python" paper.py)
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 1 --out "$HERE/out/video.mp4"
node core/render/still.mjs "$HERE" 3 10.5 15.2 --out "$HERE/stills"
sh "$HERE/mux_local.sh" "$HERE/out/video.mp4" "$HERE/../audio/test_audio.wav" "$HERE/watercolor.mp4" 24 1
