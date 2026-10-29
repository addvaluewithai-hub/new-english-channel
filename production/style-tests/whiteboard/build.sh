#!/bin/sh
# One-command build: picture → mux with the fixed voice track.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 1 --out "$HERE/out/video.mp4"
MUX="$LIB/core/render/mux.sh"; [ -f "$HERE/mux_local.sh" ] && MUX="$HERE/mux_local.sh"
sh "$MUX" "$HERE/out/video.mp4" "$HERE/../audio/test_audio.wav" "$HERE/whiteboard.mp4" 24 0
node core/render/still.mjs "$HERE" 3 10.5 15.2 --out "$HERE/stills"
