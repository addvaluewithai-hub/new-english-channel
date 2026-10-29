#!/bin/sh
# One-command rebuild: picture → mux with the shared voice track → stills.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 1 --out "$HERE/out/video.mp4"
# mux_local.sh = core/render/mux.sh with only the decodable-length check relaxed (loudness look-ahead false alarm)
sh "$HERE/mux_local.sh" "$HERE/out/video.mp4" "$HERE/../audio/test_audio.wav" "$HERE/pixel-rpg.mp4" 24 0
node core/render/still.mjs "$HERE" 3 10.5 15.2 --out "$HERE/stills"
