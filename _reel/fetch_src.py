# -*- coding: utf-8 -*-
"""영상 렌더용 고해상도 원본 사진 받기: python _reel/fetch_src.py
- 4K(3840x2160)에서 느린 줌(최대 1.12배)을 해도 확대 없이 쓰도록 원본에 가까운 크기(가로 최대 5200)로 받음
- 저장: _reel/src/<이름>.jpg (저장소에는 올리지 않음 · .gitignore)"""
import json, os, io, urllib.request
from PIL import Image, ImageOps
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
NAMES = ['hosp-room-warm', 'hosp-ward-3beds', 'clinic-waiting-sofa', 'hosp-corridor-night']
stock = json.load(open(os.path.join(ROOT, '_build', 'stock.json'), encoding='utf-8'))
os.makedirs(os.path.join(HERE, 'src'), exist_ok=True)
for n in NAMES:
    out = os.path.join(HERE, 'src', n + '.jpg')
    if os.path.exists(out):
        print('있음', n, Image.open(out).size); continue
    url = f"https://images.unsplash.com/{stock[n]['src']}?fm=jpg&q=95&w=5200&fit=max"   # fit=max: 원본보다 키우지 않음
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=120).read()
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    im.save(out, 'JPEG', quality=95, subsampling=0)
    print('%-22s %dx%d  %dKB' % (n, im.width, im.height, os.path.getsize(out) // 1024))
