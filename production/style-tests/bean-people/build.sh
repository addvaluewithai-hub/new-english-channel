#!/bin/sh
# One-command rebuild: picture -> out/video.mp4, review stills, then mux with the supplied voice track.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
node core/render/still.mjs "$HERE" 3 10.5 15.5 --out "$HERE/stills"
cd "$HERE"
sh mux_local.sh out/video.mp4 ../audio/test_audio.wav bean-people.mp4 24 0
