#!/bin/sh
# Render picture, then mux with the supplied voice track (same settings as core/render/mux.sh, run by hand: see TREATMENT.md)
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/home/user/ref/lemo-opuscar}
A="$HERE/../audio/test_audio.wav"
cd "$LIB"
node core/render/video.mjs "$HERE" --fps 24 --workers 2 --out "$HERE/out/video.mp4"
J=$(ffmpeg -hide_banner -nostats -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
LN="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$A" -filter_complex "[0:v]fps=24,noise=c0s=2:allf=t,format=yuv420p[v];[1:a]$LN,aresample=48000,apad=whole_dur=17[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -r 24 -c:a aac -b:a 256k -movflags +faststart -shortest "$HERE/cel-anime.mp4"
