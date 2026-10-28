#!/bin/sh
# One command: timeline → events → frames → mix → master → subtitles
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}; export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the lemo-opuscar library folder"; exit 1; }
python3 "$HERE/timeline.py"
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/lesson-01-hello-im-youssef.mp4" 24 1
"$LIB/.venv/bin/python" "$HERE/make_srt.py"
