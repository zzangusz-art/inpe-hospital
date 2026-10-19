# -*- coding: utf-8 -*-
"""참고 이미지(Unsplash) 내려받기 · 최적화
- _build/stock.json 목록 → assets/img/stock/<이름>.jpg (가로 최대 1920, 메타데이터 제거) + thumb/<이름>.webp (720)
- 이미 있으면 건너뜀. 실행: python _build/fetch_stock.py
"""
import json, os, io, urllib.request
from PIL import Image, ImageOps
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'stock')
os.makedirs(os.path.join(OUT, 'thumb'), exist_ok=True)
data = json.load(open(os.path.join(ROOT, '_build', 'stock.json'), encoding='utf-8'))
for name, v in data.items():
    if name.startswith('_'):
        continue
    jp, wp = os.path.join(OUT, name + '.jpg'), os.path.join(OUT, 'thumb', name + '.webp')
    if os.path.exists(jp) and os.path.exists(wp):
        continue
    url = f"https://images.unsplash.com/{v['src']}?w=2000&q=85&fm=jpg"
    raw = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read()
    im = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    if im.width > 1920:
        im = im.resize((1920, round(im.height * 1920 / im.width)), Image.LANCZOS)
    if im.height > 1800:  # 세로 사진은 높이 1800으로
        im = im.resize((round(im.width * 1800 / im.height), 1800), Image.LANCZOS)
    im.save(jp, 'JPEG', quality=80, optimize=True, progressive=True)
    t = im.copy(); t.thumbnail((720, 720), Image.LANCZOS)
    t.save(wp, 'WEBP', quality=78)
    print('%-26s %4dx%-4d %4dKB' % (name, im.width, im.height, os.path.getsize(jp) // 1024))
print('ok')
