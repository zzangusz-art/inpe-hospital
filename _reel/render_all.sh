#!/bin/bash
# 4K(대형·고해상도 화면) / 1080p(일반 화면) / 모바일 세로(1080x2280) 렌더 → 포스터 추출
# 먼저 python fetch_src.py 로 원본 고해상도 사진(_reel/src)을 받아 두세요
set -e
cd "$(dirname "$0")"
CRF=18 node render.js 3840 2160 ../assets/video/hospital-reel-4k.mp4
CRF=18 node render.js 1920 1080 ../assets/video/hospital-reel-1080p.mp4
CRF=20 node render.js 1080 2280 ../assets/video/hospital-reel-mobile.mp4
cd ../assets/video
ffmpeg -y -loglevel error -ss 14.95 -i hospital-reel-1080p.mp4 -frames:v 1 -q:v 2 poster-desktop.jpg
ffmpeg -y -loglevel error -ss 14.95 -i hospital-reel-mobile.mp4 -frames:v 1 -q:v 2 poster-mobile.jpg
for f in *.mp4; do ffprobe -v error -show_entries stream=width,height,nb_frames,bit_rate,profile,level -show_entries format=duration,size -of compact "$f"; done
echo RENDER_DONE
