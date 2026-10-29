#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/../audio/test_audio.wav" "$HERE/cel-anime.mp4" 24 2
