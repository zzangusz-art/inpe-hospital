# -*- coding: utf-8 -*-
"""공유용 OG 이미지(1200x630) 생성: python _build/make_og.py
배경은 참고 이미지(병실), 글자는 Noto Sans KR 가변 폰트(Windows 기본 설치본)"""
import os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'img')
W, H = 1200, 630
og = Image.new('RGB', (W, H), (11, 11, 11))
ph = Image.open(os.path.join(IMG, 'stock', 'hosp-room-warm.jpg')).convert('RGB')
pw = int(W * 0.62)
r = max(pw / ph.width, H / ph.height)
ph = ph.resize((int(ph.width * r), int(ph.height * r)), Image.LANCZOS)
ph = ph.crop(((ph.width - pw) // 2, (ph.height - H) // 2, (ph.width - pw) // 2 + pw, (ph.height - H) // 2 + H))
og.paste(ph, (W - pw, 0))
mask = Image.new('L', (pw, 1))
for i in range(pw):
    mask.putpixel((i, 0), int(255 * max(0, 1 - i / (pw * 0.7)) ** 1.3))
og.paste(Image.new('RGB', (pw, H), (11, 11, 11)), (W - pw, 0), mask.resize((pw, H)))
og = Image.alpha_composite(og.convert('RGBA'), Image.new('RGBA', (W, H), (10, 16, 22, 60))).convert('RGB')
d = ImageDraw.Draw(og)
FP = 'C:/Windows/Fonts/NotoSansKR-VF.ttf'
def font(size, wght):
    f = ImageFont.truetype(FP, size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f
logo = Image.open(os.path.join(IMG, 'logo-512.png')).convert('RGBA').resize((92, 92))
og.paste(logo, (80, 150), logo)
d.text((190, 176), '주식회사 인프', font=font(30, 800), fill='white')
d.text((190, 214), 'INPE Co., Ltd.', font=font(18, 400), fill=(160, 160, 160))
d.text((80, 270), '병원·산후조리원 청소', font=font(68, 900), fill='white')
d.text((82, 362), '정기청소 | 병상 매트리스·대기실 소파 | 바닥 청소·코팅', font=font(25, 500), fill=(220, 220, 220))
d.text((82, 404), '야간·주말 구역 분할 · 월간 작업 리포트', font=font(25, 500), fill=(170, 170, 170))
d.text((82, 470), '0507-1314-5792  ·  현장 실측 무료', font=font(26, 700), fill=(255, 90, 0))
d.text((W - 24, H - 18), '참고 이미지', font=font(14, 500), fill=(200, 200, 200), anchor='rs')
og.save(os.path.join(IMG, 'og-hospital.jpg'), quality=88)
print('og-hospital.jpg', os.path.getsize(os.path.join(IMG, 'og-hospital.jpg')) // 1024, 'KB')
