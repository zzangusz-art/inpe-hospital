# -*- coding: utf-8 -*-
"""인프 병원·산후조리원 청소 정적 사이트 빌드
- _build/partials + _build/pages → 루트의 *.html
- FAQ·사진·요금 데이터는 여기 한 곳에서 관리 → 화면 HTML과 JSON-LD가 같은 원본에서 생성됨
- 실행: python _build/build.py
- 주소(정식 도메인)는 SITE 한 줄만 바꾸면 canonical·sitemap·JSON-LD·llms.txt가 같이 바뀜
"""
import json, re, html, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, '_build')
VER = datetime.datetime.now().strftime('%Y%m%d%H%M')
TODAY = datetime.date.today().isoformat()
SITE = 'https://inpe.kr/hospital/'     # 정식 주소 확정 시 여기만 교체
ORG_ID = 'https://inpe.kr/#org'        # 인프케어(반려동물) 사이트와 같은 회사 엔티티로 묶음
PHONE, TEL = '0507-1314-5792', '050713145792'
EMAIL = 'contact@inpe.kr'

def rd(p):
    with open(os.path.join(B, p), encoding='utf-8') as f:
        return f.read()

def strip(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()

# ---------------------------------------------------------------- FAQ
FAQ = {
'home': [
 ('인프 병원 청소는 어떤 서비스인가요?', '<p>주식회사 인프가 병원 · 의원 · 요양병원 · 산후조리원 같은 의료시설을 대상으로 하는 청소 서비스입니다. <strong>정기청소, 바닥 청소 · 코팅, 병상 매트리스 · 대기실 소파 전문 케어</strong>를 단계별로 나눠 계약할 수 있고, 정기청소 풀패키지에는 월 1회 방역이 들어갑니다. 수도권 전역 현장 실측과 출장은 무료입니다.</p>'),
 ('진료 중에도 작업하나요?', '<p>외래 진료가 끝난 뒤나 주말에 들어가는 것을 원칙으로 합니다. 병동은 층별 · 구역별로 나눠 해당 구역만 비우고 진행하므로 전체가 막히지 않습니다. 24시간 운영 병동은 간호 스테이션과 시간대를 맞춰 교대 시간을 피합니다.</p>'),
 ('약품이 환자나 신생아에게 안전한가요?', '<p>KC 인증을 받은 친환경 · 무독성 자재만 사용하고, 사용 자재 목록은 작업 전에 제출하고 현장에서도 확인해 드립니다. 산후조리원 신생아실 · 수유실은 무향 자재만 쓰고, 작업 후 충분히 환기한 뒤 인계합니다.</p>'),
 ('상주 미화 인력이 있는데도 필요한가요?', '<p>하는 일이 다릅니다. 상주 미화는 매일의 유지 관리이고, 인프가 맡는 건 장비와 약품이 필요한 주기성 작업입니다. 매트리스 추출 세정, 바닥 코팅, 카펫 딥클리닝은 전용 장비 없이는 되지 않습니다. 기존 인력을 대신하지 않고 그 위에 얹는 구조로 제안드립니다.</p>'),
 ('비용은 어떻게 정해지나요?', '<p>정기청소는 평당 2,000~5,000원(월), 바닥 청소는 평당 8,000원부터(1회), 패브릭 전문 케어는 대기실 소파 3인용 80,000원 · 입원실 매트리스 싱글 60,000원이 기준이며 정기계약 기관은 패브릭 케어를 20% 할인합니다. 모두 부가세 별도 참고 단가이고, 현장 실측 후 구역별로 확정합니다. <a href="price.html">요금표와 견적 계산기</a>에서 미리 계산해 보실 수 있습니다.</p>'),
 ('세금계산서와 계약서 처리는 되나요?', '<p>됩니다. 사업자 간 거래로 세금계산서를 발행하고, 연간 정기계약은 별도 계약서로 진행합니다. 입찰이나 수의계약에 필요한 서류가 있으면 기관 양식에 맞춰 제출합니다.</p>'),
 ('한 번만 받아봐도 되나요?', '<p>됩니다. 단발 작업이라고 공정을 줄이지 않습니다. 다만 오래 쌓인 오염은 한 번으로 끝나지 않는 경우가 많아, 받아보신 기관은 대부분 주기를 정해 정기계약으로 넘어갑니다.</p>'),
 ('현장 실측은 어떻게 진행되나요?', '<p>문의 후 1~2일 안에 방문 일정을 잡습니다. 실측은 무료이고 견적을 받으셔도 계약 의무는 없습니다. 병상 수, 대기실 규모, 바닥 소재 정도만 미리 알려주시면 되고, 실측 다음 날 구역별 단가와 작업 시간대를 문서로 드립니다.</p>'),
 ('서비스 지역은 어디인가요?', '<p>인천 남동구 본사를 기점으로 서울 · 인천 · 경기 수도권 전역에 실측과 출장을 무료로 갑니다. 그 밖의 지역은 규모에 따라 상담 후 안내드립니다.</p>'),
 ('인프는 MBTI ‘인프(INFP)’와 관련이 있나요?', '<p>아니요. 인프(INPE)는 청소 · 방역 서비스를 하는 주식회사 인프의 브랜드로, 성격유형 검사 MBTI의 INFP(인프)와는 관련이 없습니다.</p>'),
],
'fabric': [
 ('방수 커버가 씌워진 병원 매트리스도 청소가 필요한가요?', '<p>방수 커버는 쏟아진 액체를 막아 주지만 봉제선 · 지퍼 틈 · 커버가 닳거나 찢어진 부위로는 오염이 들어갑니다. 커버 안쪽 폼에는 땀과 습기가 쌓이기도 합니다. 실측 때 커버 재질과 손상 여부를 같이 보고, 커버 세정만 할지 본체까지 할지 정합니다.</p>'),
 ('청소한 매트리스는 언제 다시 쓸 수 있나요?', '<p>건식청소는 끝나자마자 쓸 수 있습니다. 습건식 + 스팀은 환기 상태에 따라 2~4시간 건조가 필요해, 병동을 층별로 나누고 비는 병상부터 순서대로 진행합니다.</p>'),
 ('병상을 비우지 않고 진행할 수 있나요?', '<p>한 번에 전체 병상을 비우지 않습니다. 퇴원 · 전실로 비는 병상, 교대 시간을 피한 구역부터 차례로 들어가고, 작업 구역과 시간은 전날까지 담당자에게 알려드립니다.</p>'),
 ('인조가죽 · 천연가죽 소파도 되나요?', '<p>됩니다. 다만 가죽은 패브릭과 세정제 · 마감 공정이 달라 천연인지 인조인지 현장에서 확인한 뒤 금액을 안내드립니다.</p>'),
 ('병원 매트리스 · 소파 청소 비용은 얼마인가요?', '<p>습건식 + 스팀 기준으로 입원실 매트리스 싱글 60,000원, 슈퍼싱글 70,000원, 대기실 소파 1인용 40,000원, 3인용 80,000원, 6인용 130,000원입니다. 정기청소 계약 기관은 20% 할인됩니다. 건식만 하면 매트리스 싱글 30,000원, 소파 3인용 40,000원입니다. 부가세 별도.</p>'),
],
'floor': [
 ('병원 바닥 청소는 얼마나 자주 하나요?', '<p>전체 바닥은 연 1~2회가 일반적입니다. 로비 · 복도 · 엘리베이터 앞처럼 통행이 많은 구역만 주기를 짧게 가져가는 방식도 많이 씁니다. 정기청소가 돌면 어느 구역이 빨리 닳는지 기록이 쌓여 주기를 정하기 쉬워집니다.</p>'),
 ('작업 후 언제부터 걸어 다닐 수 있나요?', '<p>바닥재와 코팅 종류에 따라 다릅니다. 보행을 다시 열 수 있는 시각을 작업 전에 알려드리고, 구역을 나눠 진행해 통로 하나는 늘 열어 둡니다.</p>'),
 ('코팅제 냄새가 남지 않나요?', '<p>잔향이 적은 자재를 고르고, 마감 후 환기 시간을 일정에 넣어 둡니다. 냄새에 민감한 구역은 실측 때 따로 표시해 주시면 자재와 작업 시간대를 그에 맞춥니다.</p>'),
 ('에폭시 · 데코타일 · 장판도 되나요?', '<p>됩니다. 소재마다 패드와 약품을 바꿉니다. 타일 · 카펫 청소와 타일 코팅은 정해진 평당 단가로, 폴리싱 · 왁싱은 바닥 상태에 따라 실측 후 별도로 협의합니다.</p>'),
 ('병원 바닥 청소 비용은 얼마인가요?', '<p>1회 기준 타일 청소 평당 8,000원, 카펫 청소 평당 8,000원, 타일 청소 후 코팅까지 하면 평당 10,000원입니다. 폴리싱 · 왁싱은 별도 협의이며 부가세 별도입니다.</p>'),
],
'postpartum': [
 ('신생아실에도 약품을 쓰나요?', '<p>신생아실과 수유실은 무향 자재만 씁니다. 작업 범위와 시간은 조리원 감염관리 담당자와 미리 정하고, 작업 후 충분히 환기한 뒤 인계합니다.</p>'),
 ('산모실 매트리스는 얼마나 자주 청소해야 하나요?', '<p>산모실은 체류 기간이 짧고 사용자가 자주 바뀌어 일반 병실보다 주기를 짧게 잡습니다. 그래서 정기청소에 매트리스 건식청소를 매회 넣는 구성을 권하고, 습건식 + 스팀은 오염 정도에 따라 별도로 진행합니다.</p>'),
 ('산모가 머무는 동안에도 작업하나요?', '<p>객실은 퇴실과 입실 사이 비는 시간에 들어가는 것이 원칙입니다. 복도 · 라운지 같은 공용 공간은 산모 이용이 적은 시간대로 잡습니다.</p>'),
 ('산후조리원 청소 비용은 얼마인가요?', '<p>정기청소는 평당 2,000~5,000원(월)이고, 매트리스 건식청소는 표준형(평당 3,500원~)부터 포함됩니다. 객실 수와 공용 공간 면적을 보고 실측 후 확정합니다. 부가세 별도.</p>'),
],
'price': [
 ('정기청소 단가 폭이 넓은 이유는 무엇인가요?', '<p>포함 범위가 다르기 때문입니다. 기본형(평당 2,000원~)은 바닥 쓸기 · 닦기, 분리수거, 가구 먼지 제거이고, 표준형(평당 3,500원~)은 여기에 소파 · 매트리스 건식청소와 얼룩 제거가, 풀패키지(평당 5,000원)는 탈취 시공과 월 1회 방역이 더해집니다. 실측 때 구역별로 어디까지 넣을지 같이 정합니다.</p>'),
 ('표시된 금액에 부가세가 포함되나요?', '<p>아니요. 사이트의 모든 금액은 부가세 별도 참고 단가입니다. 면적 · 오염도 · 작업 시간대 · 병동 구조에 따라 현장 실측 후 확정합니다.</p>'),
 ('면적은 어떻게 계산하나요?', '<p>청소 대상 구역의 면적을 기준으로 합니다. 외래 · 병동 · 로비 · 사무 구역처럼 나눠서 평수를 재고, 구역마다 들어갈 작업을 따로 정합니다.</p>'),
 ('정기계약 할인은 어떻게 적용되나요?', '<p>정기청소를 계약한 기관은 매트리스 · 소파 패브릭 전문 케어를 20% 할인된 금액으로 받습니다.</p>'),
 ('견적서와 계약서는 어떤 형태로 받나요?', '<p>실측 다음 날 구역별 단가 · 작업 주기 · 시간대를 정리한 견적서를 문서로 드립니다. 세금계산서를 발행하고, 연간 정기계약은 별도 계약서로 진행합니다. 입찰 서류 양식이 있으면 맞춰 제출합니다.</p>'),
],
}

def faq_html(key, open_first=True):
    out = []
    for i, (q, a) in enumerate(FAQ[key]):
        exp = 'true' if (open_first and i == 0) else 'false'
        out.append(f'<div class="acc__item"><button class="acc__btn" type="button" aria-expanded="{exp}"><span><span class="q">Q</span>{html.escape(q)}</span><span class="acc__icon" aria-hidden="true"></span></button><div class="acc__panel"><div><div class="acc__body">{a}</div></div></div></div>')
    return '\n'.join(out)

def faq_ld(key, url):
    return {'@type': 'FAQPage', '@id': url + '#faq', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in FAQ[key]]}

# ---------------------------------------------------------------- 현장 사진 (모두 인프 현장 실사진)
PCARDS = [
 ('mattress-01', 'dust-pad-02', '그레이 매트리스', '이 매트리스에서 나온 필터'),
 ('sofa-02', 'dust-pad-01', '화이트 패브릭 소파', '이 소파에서 나온 필터'),
 ('mattress-03', 'dust-pad-06', '패턴 매트리스', '이 매트리스에서 나온 필터'),
 ('sofa-03', 'dust-pad-03', 'ㄱ자 패브릭 소파', '이 소파에서 나온 필터'),
]
def pcards_html():
    out = []
    for f, b, cf, cb in PCARDS:
        out.append(f'<div class="pcard rv" tabindex="0" role="button" aria-label="{cf} 사진, 눌러서 흡입 필터 보기"><div class="pcard__in"><div class="pcard__f"><img src="assets/img/real/thumb/{f}.webp" alt="인프 시공 {cf}" loading="lazy"><span class="pcard__label">{cf}<em>가구</em></span></div><div class="pcard__b"><img src="assets/img/real/thumb/{b}.webp" alt="{cb}: 흡입된 먼지" loading="lazy"><span class="pcard__label">{cb}<em>필터</em></span></div></div></div>')
    return '\n'.join(out)

GALLERY = [  # 홈 '현장 기록': 가정집처럼 보이는 가구 사진은 빼고 필터·오염물 기록만
 ('dust-bin-01', '흡입기 집진통에 모인 오염물'), ('dust-pad-04', '소파 흡입 필터'), ('dust-hand', '필터에 걸러진 먼지'),
 ('dust-pad-05', '매트리스 흡입 필터'), ('dust-bin-02', '집진통 오염물'), ('dust-pad-07', '소파 흡입 필터'),
]
def gallery_html():
    return '\n'.join(f'<a href="assets/img/real/{n}.jpg" data-lb="field" data-cap="{c}"><img class="sk-img" src="assets/img/real/thumb/{n}.webp" alt="{c}" loading="lazy" width="300" height="300"></a>' for n, c in GALLERY)

# ---------------------------------------------------------------- JSON-LD 공통
AREAS = [{'@type': 'AdministrativeArea', 'name': n} for n in ['서울특별시', '인천광역시', '경기도']]
ORG = {
 '@type': 'Organization', '@id': ORG_ID, 'name': '주식회사 인프', 'legalName': '주식회사 인프',
 'alternateName': ['INPE', '인프', 'INPE Co., Ltd.'], 'url': 'https://inpe.kr/', 'logo': SITE + 'assets/img/logo-512.png',
 'telephone': '+82-507-1314-5792', 'taxID': '868-06-01765', 'founder': {'@type': 'Person', 'name': '이은수'},
 'disambiguatingDescription': '주식회사 인프(INPE)는 청소·방역 서비스 회사이며, 성격유형 MBTI의 INFP(인프)와는 관련이 없습니다.',
 'sameAs': ['https://blog.naver.com/apso11'],
 'contactPoint': [{'@type': 'ContactPoint', 'contactType': 'sales', 'name': '의료시설·기업 청소 상담', 'telephone': '+82-507-1314-5792', 'email': EMAIL, 'areaServed': 'KR', 'availableLanguage': ['Korean']}],
}
OFFERS = [
 ('정기청소 (평당·월)', 2000, 5000), ('바닥 청소 (평당·1회)', 8000, 10000),
 ('대기실 소파 패브릭 케어 (3인용, 습건식+스팀)', 80000, None), ('입원실 매트리스 패브릭 케어 (싱글, 습건식+스팀)', 60000, None),
 ('소독·방역 시공 (1회)', 149000, None), ('월 정기 방역', 99000, None),
]
BIZ = {
 '@type': 'LocalBusiness', '@id': SITE + '#business', 'name': '인프 병원·산후조리원 청소', 'alternateName': ['인프 의료시설 청소', 'INPE 병원 청소'],
 'description': '주식회사 인프가 운영하는 의료시설 청소 서비스입니다. 병원·의원·요양병원·산후조리원의 정기청소, 병상 매트리스·대기실 소파 전문 케어, 바닥 청소·코팅을 야간·주말 구역 분할로 진행하고 월간 작업 리포트를 제출합니다.',
 'url': SITE, 'image': [SITE + 'assets/img/og-hospital.jpg', SITE + 'assets/img/real/team-back.jpg'], 'logo': SITE + 'assets/img/logo-512.png',
 'telephone': '+82-507-1314-5792', 'email': EMAIL, 'priceRange': '평당 ₩2,000~',
 'parentOrganization': {'@id': ORG_ID},
 'address': {'@type': 'PostalAddress', 'streetAddress': '인주대로 770-1, 3층 하나빌딩', 'addressLocality': '남동구', 'addressRegion': '인천광역시', 'postalCode': '21565', 'addressCountry': 'KR'},
 'geo': {'@type': 'GeoCoordinates', 'latitude': 37.4449, 'longitude': 126.7018},
 'openingHoursSpecification': [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'opens': '09:00', 'closes': '18:00'}],
 'areaServed': AREAS,
 'knowsAbout': ['병원 청소', '의원 청소', '요양병원 청소', '산후조리원 청소', '병원 정기청소', '병상 매트리스 청소', '병원 대기실 소파 청소', '병원 바닥 청소', '바닥 코팅', '에폭시 바닥 청소', '카펫 청소', '의료시설 방역'],
 'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': '인프 의료시설 청소 참고 단가 (부가세 별도)', 'itemListElement': [
   {'@type': 'Offer', 'priceCurrency': 'KRW', 'itemOffered': {'@type': 'Service', 'name': n},
    **({'priceSpecification': {'@type': 'PriceSpecification', 'minPrice': lo, 'maxPrice': hi, 'priceCurrency': 'KRW', 'valueAddedTaxIncluded': False}} if hi else {'price': lo})} for n, lo, hi in OFFERS]},
}
WEBSITE = {'@type': 'WebSite', '@id': SITE + '#website', 'url': SITE, 'name': '인프 병원·산후조리원 청소', 'inLanguage': 'ko-KR', 'publisher': {'@id': ORG_ID}}

def crumbs(path, name):
    items = [{'@type': 'ListItem', 'position': 1, 'name': '홈', 'item': SITE}]
    if path:
        items.append({'@type': 'ListItem', 'position': 2, 'name': name, 'item': SITE + path})
    return {'@type': 'BreadcrumbList', '@id': SITE + path + '#breadcrumb', 'itemListElement': items}

def webpage(path, title, desc):
    return {'@type': 'WebPage', '@id': SITE + path + '#webpage', 'url': SITE + path, 'name': title, 'description': desc, 'inLanguage': 'ko-KR',
            'isPartOf': {'@id': SITE + '#website'}, 'about': {'@id': SITE + '#business'}, 'breadcrumb': {'@id': SITE + path + '#breadcrumb'}, 'dateModified': TODAY}

def service(path, name, stype, desc, price, unit=None):
    off = {'@type': 'Offer', 'priceCurrency': 'KRW', 'price': price, 'url': SITE + path}
    if unit:
        off['priceSpecification'] = {'@type': 'UnitPriceSpecification', 'price': price, 'priceCurrency': 'KRW', 'unitText': unit, 'valueAddedTaxIncluded': False}
    return {'@type': 'Service', '@id': SITE + path + '#service', 'name': name, 'serviceType': stype, 'description': desc, 'provider': {'@id': SITE + '#business'},
            'areaServed': AREAS, 'audience': {'@type': 'BusinessAudience', 'audienceType': '병원·의원·요양병원·산후조리원'}, 'offers': off}

# ---------------------------------------------------------------- 페이지 정의
PAGES = [
 dict(src='index.html', path='', page='home', name='홈', pri='1.0',
      title='병원·산후조리원 청소 | 정기청소·병상 매트리스·바닥 코팅 — 인프',
      og='병원·산후조리원 청소 — 진료를 멈추지 않는 3단계 관리 | 인프',
      desc='주식회사 인프의 의료시설 청소. 병원·의원·요양병원·산후조리원 정기청소(평당 2,000원~), 병상 매트리스·대기실 소파 전문 케어, 바닥 청소·코팅을 야간·주말 구역 분할로 진행합니다. 수도권 실측 무료.',
      kw='병원 청소, 병원 청소업체, 의원 청소, 요양병원 청소, 산후조리원 청소, 병원 정기청소, 병상 매트리스 청소, 병원 소파 청소, 병원 바닥 청소, 병원 바닥 코팅, 의료시설 청소, 인천 병원 청소, 인프',
      faq='home'),
 dict(src='hospital-fabric.html', path='hospital-fabric.html', page='fabric', name='병상 매트리스·대기실 소파', pri='0.9',
      title='병원 매트리스·대기실 소파 청소 | 습건식+스팀 6단계 — 인프',
      og='병상 매트리스·대기실 소파 청소 | 인프',
      desc='입원실 매트리스는 커버를 바꿔도 본체가 남습니다. 인프는 UV-C 살균, 건식 흡입, 습식 추출, 고온 스팀 순서로 병상 매트리스와 대기실 소파를 청소합니다. 매트리스 싱글 60,000원, 소파 3인용 80,000원, 정기계약 20% 할인.',
      kw='병원 매트리스 청소, 병상 매트리스 청소, 입원실 매트리스, 요양병원 매트리스 청소, 병원 대기실 소파 청소, 병원 소파 청소, 의료시설 패브릭 청소, 인프',
      faq='fabric'),
 dict(src='hospital-floor.html', path='hospital-floor.html', page='floor', name='바닥 청소·코팅', pri='0.9',
      title='병원 바닥 청소·코팅 | 타일·에폭시·카펫 야간 시공 — 인프',
      og='병원 바닥 청소·코팅 | 인프',
      desc='코팅층이 벗겨진 병원 바닥은 오염이 바닥재에 직접 뱁니다. 인프는 복도·로비·병동 바닥을 야간·주말에 구역을 나눠 청소하고 코팅합니다. 타일·카펫 청소 평당 8,000원, 청소+코팅 평당 10,000원.',
      kw='병원 바닥 청소, 병원 바닥 코팅, 병원 복도 청소, 타일 코팅, 에폭시 바닥 청소, 데코타일 청소, 병원 카펫 청소, 바닥 왁스, 인프',
      faq='floor'),
 dict(src='postpartum.html', path='postpartum.html', page='postpartum', name='산후조리원 청소', pri='0.9',
      title='산후조리원 청소 | 산모실 매트리스·신생아실 무향 관리 — 인프',
      og='산후조리원 청소 | 인프',
      desc='산후조리원은 객실 회전이 빠르고 신생아 공간은 향이 남으면 안 됩니다. 인프는 산모실 매트리스 건식청소를 정기청소에 매회 넣고, 신생아실·수유실은 무향 자재로 관리합니다. 정기청소 평당 2,000원~.',
      kw='산후조리원 청소, 산후조리원 정기청소, 산후조리원 매트리스 청소, 산모실 청소, 신생아실 청소, 조리원 방역, 인프',
      faq='postpartum'),
 dict(src='price.html', path='price.html', page='price', name='요금·견적', pri='0.8',
      title='병원 청소 비용 | 정기청소 평당 단가·바닥·매트리스 요금표 — 인프',
      og='병원 청소 요금표와 견적 계산기 | 인프',
      desc='병원 정기청소 평당 2,000~5,000원(월), 바닥 청소 평당 8,000원~, 입원실 매트리스 60,000원, 대기실 소파 80,000원. 연면적과 병상 수를 넣으면 월·연간 예상 금액이 계산됩니다. 부가세 별도.',
      kw='병원 청소 비용, 병원 청소 단가, 병원 정기청소 가격, 병원 바닥 청소 가격, 병원 매트리스 청소 가격, 산후조리원 청소 비용, 평당 청소 단가, 인프',
      faq='price'),
 dict(src='about.html', path='about.html', page='about', name='회사 소개', pri='0.6',
      title='회사 소개 · 주식회사 인프 | 의료시설 청소',
      og='주식회사 인프 — 장비·인력·약품을 직접 운용하는 청소 회사',
      desc='주식회사 인프 소개. 2021년부터 수도권에서 정기청소와 패브릭·바닥 전문청소를 해왔습니다. 누적 시공 2,400건, 고객 만족도 4.97점, 전문 인력 50명. 자사 장비 직영, 재하도급 없음.',
      kw='주식회사 인프, 인프 청소, INPE, 병원 청소업체, 의료시설 청소 회사, 인프 회사 소개', faq=None),
 dict(src='privacy.html', path='privacy.html', page='privacy', name='개인정보처리방침', pri='0.2',
      title='개인정보처리방침 | 인프 병원·산후조리원 청소', og='개인정보처리방침 | 인프',
      desc='주식회사 인프 의료시설 청소 상담의 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간, 처리 위탁, 개인정보 보호책임자 안내.',
      kw='인프 개인정보처리방침', faq=None),
]

# ---------------------------------------------------------------- 참고 이미지(Unsplash) 크레딧
STOCK = {k: v for k, v in json.load(open(os.path.join(B, 'stock.json'), encoding='utf-8')).items() if not k.startswith('_')}
def credits_html(used):
    return '\n'.join(f'<li>{STOCK[n]["ko"]} — <a href="https://unsplash.com/photos/{STOCK[n]["slug"]}" target="_blank" rel="noopener nofollow">{STOCK[n]["user"]}</a> / Unsplash</li>' for n in STOCK if n in used)

def build():
    head, header, footer = rd('partials/head.html'), rd('partials/header.html'), rd('partials/footer.html')
    qf, calc = rd('partials/quote-form.html'), rd('partials/calc.html')
    # 쇼릴 영상: 파일이 있을 때만 연결 (없으면 사진 챕터만 보이는 정적 히어로)
    has_reel = os.path.exists(os.path.join(ROOT, 'assets/video/hospital-reel-1080p.mp4'))
    reel_attrs = ('\n        data-src1080="assets/video/hospital-reel-1080p.mp4" data-src720="assets/video/hospital-reel-720p.mp4" data-src-mobile="assets/video/hospital-reel-mobile.mp4"'
                  '\n        data-poster-desktop="assets/video/poster-desktop.jpg" data-poster-mobile="assets/video/poster-mobile.jpg"') if has_reel else ''
    reps_common = {
        '{{calc}}': calc, '{{quote_form_inline}}': qf.replace('{{fid}}', 'qi'),
        '{{pcards}}': pcards_html(), '{{gallery}}': gallery_html(), '{{reel_attrs}}': reel_attrs,
    }
    for k in FAQ:
        reps_common['{{faq_' + k + '}}'] = faq_html(k)
    # 페이지·영상 렌더러에서 실제로 쓰는 참고 이미지만 크레딧에 올림 + 파일 존재 확인
    srcs = ''.join(rd('pages/' + p['src']) for p in PAGES) + rd('partials/head.html') + open(os.path.join(ROOT, '_reel', 'reel.html'), encoding='utf-8').read()
    used = {n for n in STOCK if re.search(r'stock/(thumb/)?' + re.escape(n) + r'\.|[\'"]' + re.escape(n) + r'[\'"]', srcs)}
    for n in used:
        for f in ('assets/img/stock/' + n + '.jpg', 'assets/img/stock/thumb/' + n + '.webp'):
            if not os.path.exists(os.path.join(ROOT, f)):
                raise SystemExit('참고 이미지 파일 없음: ' + f + ' (python _build/fetch_stock.py)')
    for m in set(re.findall(r'assets/img/stock/(?:thumb/)?([a-z0-9-]+)\.(?:jpg|webp)', srcs)) - set(STOCK):
        raise SystemExit('stock.json에 없는 참고 이미지: ' + m)
    reps_common['{{credits}}'] = credits_html(used)
    print('참고 이미지 사용', len(used), '/', len(STOCK), '· 미사용', sorted(set(STOCK) - used))
    report = []
    for p in PAGES:
        url = SITE + p['path']
        graph = [ORG, BIZ, WEBSITE, webpage(p['path'], p['title'], p['desc']), crumbs(p['path'], p['name'])]
        if p['faq']:
            graph.append(faq_ld(p['faq'], url))
        if p['page'] == 'home':
            graph.append(service('', '의료시설 정기청소', '병원·의원·산후조리원 정기청소', '바닥 쓸기·닦기, 분리수거, 가구·집기 먼지 제거부터 소파·매트리스 건식청소, 탈취, 월 1회 방역까지 3가지 구성으로 나눈 월 단위 정기청소', 2000, '평당·월'))
            if os.path.exists(os.path.join(ROOT, 'assets/video/hospital-reel-1080p.mp4')):
                graph.append({'@type': 'VideoObject', '@id': SITE + '#reel', 'name': '인프 병원·산후조리원 청소 소개 (15초)',
                              'description': '병상 매트리스 세정, 대기실 소파 추출 청소, 흡입 필터 기록, 야간 구역 분할 작업 방식을 담은 15초 영상',
                              'thumbnailUrl': SITE + 'assets/video/poster-desktop.jpg', 'uploadDate': TODAY + 'T09:00:00+09:00', 'duration': 'PT15S',
                              'contentUrl': SITE + 'assets/video/hospital-reel-1080p.mp4', 'publisher': {'@id': ORG_ID}})
        if p['page'] == 'fabric':
            graph.append(service(p['path'], '병상 매트리스·대기실 소파 패브릭 케어', '의료시설 매트리스·소파 청소 (습건식+스팀)', p['desc'], 60000, '매트리스 싱글 1개'))
            graph.append({'@type': 'HowTo', '@id': url + '#howto', 'name': '병원 매트리스·소파 패브릭 케어 6단계', 'step': [
                {'@type': 'HowToStep', 'position': i + 1, 'name': n, 'text': t} for i, (n, t) in enumerate([
                    ('UV-C 살균', '약품 없이 자외선으로 표면을 처리합니다. 젖지 않아 바로 다음 공정으로 넘어갑니다.'),
                    ('건식 청소', '섬유 속 먼지와 각질을 먼저 흡입해 걷어냅니다. 이 단계를 건너뛰면 먼지가 물과 뭉쳐 얼룩이 됩니다.'),
                    ('습식 청소', '소재별 전용 세정제로 얼룩을 분해한 뒤 추출합니다.'),
                    ('고온 스팀', '고온 스팀으로 잔여 오염물과 세균을 처리합니다.'),
                    ('하부·틈새', '소파 하부, 매트리스 측면과 틈새까지 청소합니다.'),
                    ('음이온·마감', '공기를 정화하고 마무리합니다. 신생아 구역은 무향으로 마감합니다.')])]})
        if p['page'] == 'floor':
            graph.append(service(p['path'], '병원 바닥 청소·코팅', '의료시설 바닥 청소·코팅 (타일·에폭시·데코타일·카펫)', p['desc'], 8000, '평당·1회'))
        if p['page'] == 'postpartum':
            graph.append(service(p['path'], '산후조리원 청소', '산후조리원 정기청소·산모실 매트리스·신생아실 무향 관리', p['desc'], 2000, '평당·월'))
        jsonld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1)
        body = rd('pages/' + p['src'])
        for k, v in reps_common.items():
            body = body.replace(k, v)
        hd = head
        for k, v in {'{{title}}': html.escape(p['title']), '{{desc}}': html.escape(p['desc']), '{{keywords}}': html.escape(p['kw']),
                     '{{og_title}}': html.escape(p['og']), '{{site}}': SITE, '{{path}}': p['path'], '{{page}}': p['page'], '{{jsonld}}': jsonld, '{{ver}}': VER,
                     '{{preload}}': '<link rel="preload" as="image" href="assets/img/stock/hosp-room-warm.jpg">' if p['page'] == 'home' else ''}.items():
            hd = hd.replace(k, v)
        hdr = header.replace('{{hdr_class}}', '' if p['page'] == 'home' else ' is-solid-always')
        ft = footer.replace('{{quote_form_drawer}}', qf.replace('{{fid}}', 'dq')).replace('{{ver}}', VER)
        out = hd + re.sub(r'(?<=[가-힣A-Za-z]) · (?=[가-힣A-Za-z])', '·', hdr + body + ft)
        left = re.findall(r'\{\{[a-z_]+\}\}', out)
        if left:
            raise SystemExit(f"{p['src']}: 치환 안 된 자리표시자 {left}")
        with open(os.path.join(ROOT, p['src']), 'w', encoding='utf-8', newline='\n') as f:
            f.write(out)
        report.append((p['src'], len(out), len(p['title']), len(p['desc'])))

    # sitemap
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in PAGES:
        sm.append(f'  <url><loc>{SITE}{p["path"]}</loc><lastmod>{TODAY}</lastmod><priority>{p["pri"]}</priority></url>')
    sm.append('</urlset>')
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(sm) + '\n')

    # llms.txt (FAQ·요금은 위 데이터에서 생성)
    L = [f'# 인프 병원·산후조리원 청소 (주식회사 인프)', '',
         '> 주식회사 인프(INPE Co., Ltd.)가 운영하는 의료시설 청소 서비스입니다. 병원·의원·요양병원·산후조리원을 대상으로 정기청소, 바닥 청소·코팅, 병상 매트리스·대기실 소파 전문 케어를 단계별로 제공하고, 진료를 멈추지 않도록 야간·주말에 구역을 나눠 작업합니다. 본사는 인천 남동구이며 수도권 전역 실측·출장은 무료입니다.', '',
         "※ 이름 구분: '인프(INPE)'는 성격유형 MBTI의 'INFP(인프)'와 관련이 없는 청소·방역 회사입니다.", '',
         '## 기본 정보', '- 운영사: 주식회사 인프 (대표 이은수, 사업자등록번호 868-06-01765)', '- 주소: 인천광역시 남동구 인주대로 770-1, 3층 하나빌딩',
         f'- 전화: {PHONE} (평일 09:00–18:00)', f'- 이메일: {EMAIL}', f'- 웹사이트: {SITE}', '- 반려동물 가정 청소는 별도 브랜드 인프케어(https://inpe.kr/)에서 안내합니다.', '',
         '## 페이지']
    for p in PAGES[:-1]:
        L.append(f'- [{p["name"]}]({SITE}{p["path"]}): {p["desc"]}')
    L += ['', '## 참고 단가 (부가세 별도, 현장 실측 후 확정)',
          '- 정기청소(월): 기본형 평당 2,000원~ / 표준형 평당 3,500원~ / 풀패키지 평당 5,000원(월 1회 방역 포함)',
          '- 바닥 청소(1회): 타일 평당 8,000원 / 카펫 평당 8,000원 / 타일 청소+코팅 평당 10,000원 / 폴리싱·왁싱 별도 협의',
          '- 패브릭 전문 케어(습건식+스팀): 입원실 매트리스 싱글 60,000원 / 대기실 소파 3인용 80,000원 / 정기계약 기관 20% 할인',
          '- 소독·방역 시공 1회 149,000원~ / 월 정기 방역 99,000원',
          '- 권장 주기: 외래 중심 의원 주 1~2회, 입원 병동 보유 병원 주 2~3회, 산후조리원 주 2~3회 + 산모실 매트리스 건식 매회', '',
          '## 자주 묻는 질문']
    for q, a in FAQ['home'] + FAQ['fabric'] + FAQ['floor'] + FAQ['postpartum']:
        L.append(f'- {q} {strip(a)}')
    with open(os.path.join(ROOT, 'llms.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write(re.sub(r'(?<=[가-힣A-Za-z]) · (?=[가-힣A-Za-z])', '·', '\n'.join(L)) + '\n')

    # robots.txt
    host = re.match(r'https?://[^/]+', SITE).group(0)
    rb = ['# 인프 병원·산후조리원 청소', 'User-agent: *', 'Allow: /', 'Disallow: /_build/', 'Disallow: /_reel/', 'Disallow: /_dev/', '',
          '# AI 검색·답변 엔진 (인용 노출 허용)'] + [f'User-agent: {a}\nAllow: /' for a in ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Google-Extended', 'Googlebot', 'Yeti', 'Bingbot']] + ['', f'Sitemap: {SITE}sitemap.xml']
    with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(rb) + '\n')

    for r in report:
        print('%-22s %7d bytes  title %2d자  desc %3d자' % r)

if __name__ == '__main__':
    build()
