# 인프 병원·산후조리원 청소 홈페이지

병원·의원·요양병원·산후조리원 정기청소, 병상 매트리스·대기실 소파 전문 케어, 바닥 청소·코팅 — 주식회사 인프

## 구조
- `*.html` — 빌드 결과물 (직접 수정하지 말고 `_build/`에서 수정 후 `python _build/build.py`)
- `assets/` — css · js · 이미지 · 15초 쇼릴 영상
- `assets/js/config.js` — 상담 DB 주소 · 연락처 · 광고 픽셀 설정
- `apps-script/` — 구글 시트 + 메일 알림 수신 코드와 설정 가이드
- `_reel/` — 쇼릴 영상 렌더러 (`bash _reel/render_all.sh`)
- `_dev/` — 미리보기 서버(5179) · E2E 점검(`node _dev/test.js`) · Apps Script 목업 점검(`node _dev/gas-test.js`)
- `project.md` — 결정 사항과 남은 일
