#!/bin/sh
# Rebuild urban-sketch.mp4 from source. LIB = the Lemo-Opuscar library folder.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
export PLAYWRIGHT_CHROME=${PLAYWRIGHT_CHROME:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
# mux_local.sh = core/render/mux.sh with one change: decoded length measured by a plain decode
# (the stock check reads loudnorm's last progress tick, which lags ~3 s and rejected this valid 17 s WAV)
sh "$HERE/mux_local.sh" "$HERE/out/video.mp4" "$HERE/../audio/test_audio.wav" "$HERE/urban-sketch.mp4" 24 2
node core/render/still.mjs "$HERE" 3 10.5 15.2
