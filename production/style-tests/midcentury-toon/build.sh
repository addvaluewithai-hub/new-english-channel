#!/bin/sh
# One-command rebuild: picture -> out/video.mp4, then mux with the supplied voice track.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 1 --out "$HERE/out/video.mp4"
node core/render/still.mjs "$HERE" 3 10.5 15.2 --out "$HERE/stills"
cd "$HERE"
sh mux_local.sh out/video.mp4 ../audio/test_audio.wav midcentury-toon.mp4 24 3
