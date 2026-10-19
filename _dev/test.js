// 헤드리스 Chrome E2E 점검: node _dev/test.js  (미리보기 서버 5179 실행 중이어야 함)
// puppeteer-core는 인프케어 프로젝트의 _reel/node_modules를 그대로 씀 (없으면 이 폴더 _reel에서 npm i puppeteer-core@23)
const fs = require('fs'), path = require('path');
const PUP = [path.join(__dirname, '../_reel/node_modules/puppeteer-core'), path.join(__dirname, '../../인프케어_홈페이지/_reel/node_modules/puppeteer-core')].find(p => fs.existsSync(p));
const puppeteer = require(PUP);
const BASE = 'http://127.0.0.1:' + (process.env.PORT || 5179) + '/';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const LEADS = path.join(__dirname, 'mock-leads.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (name, cond, info = '') => { results.push([cond ? 'PASS' : 'FAIL', name, info]); };
const PAGES = ['index', 'hospital-fabric', 'hospital-floor', 'postpartum', 'price', 'about', 'privacy'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  const mk = async (w, h, mobile) => {
    const pg = await browser.newPage();
    await pg.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
    if (mobile) await pg.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    pg.on('pageerror', e => errs.push('pageerror ' + e.message + ' @ ' + pg.url() + ' ' + String(e.stack || '').split('\n').slice(1, 3).join(' ')));
    pg.on('console', m => { if (m.type() === 'error' && !/__mock\/404/.test(m.text() + ((m.location() || {}).url || ''))) errs.push('console ' + m.text() + ' @ ' + ((m.location() || {}).url || '')); });
    pg.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errs.push('reqfail ' + r.url() + ' ' + (r.failure() || {}).errorText); });
    pg.on('response', r => { if (r.status() >= 400 && !/__mock\/404/.test(r.url())) errs.push('http ' + r.status() + ' ' + r.url()); });
    await pg.evaluateOnNewDocument(() => { const f = () => { if (document.documentElement) document.documentElement.style.scrollBehavior = 'auto'; }; f(); document.addEventListener('DOMContentLoaded', f); });
    return pg;
  };
  const shot = (pg, n, full) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 70, fullPage: !!full });
  const view = async (pg, sel, n, off = 0) => { await pg.evaluate((s, o) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, sel, off); await sleep(1100); if (n) await shot(pg, n); };
  const txt = (pg, sel) => pg.evaluate(s => document.querySelector(s).textContent.trim(), sel);
  if (fs.existsSync(LEADS)) fs.unlinkSync(LEADS);

  /* ---------- 데스크톱 홈 ---------- */
  const d = await mk(1440, 900);
  await d.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(2500);
  let st = await d.evaluate(() => { const v = document.querySelector('.reel video'); return { t: v.currentTime, paused: v.paused, src: v.currentSrc, cls: document.querySelector('.reel').className }; });
  ok('쇼릴 자동재생 · 1440px 화면 1080p', st.t > 0.5 && !st.paused && /hospital-reel-1080p/.test(st.src) && !/is-done/.test(st.cls), JSON.stringify(st));
  await shot(d, '00_reel_playing');
  await d.click('.reel__skip'); await sleep(1400);
  st = await d.evaluate(() => ({ done: document.querySelector('.reel').classList.contains('is-done'), on: [...document.querySelectorAll('.chapter')].map(c => c.classList.contains('is-on')) }));
  ok('건너뛰기 → 1챕터', st.done && st.on[0], JSON.stringify(st));
  await shot(d, '01_hero');
  const reel = await d.evaluate(() => { const r = document.querySelector('.reel'); return { top: r.offsetTop, total: r.offsetHeight - innerHeight }; });
  for (const [p, i, n] of [[0.5, 1, '02_ch2'], [0.8, 2, '03_ch3']]) {
    await d.evaluate(y => window.scrollTo(0, y), reel.top + reel.total * p); await sleep(900); await shot(d, n);
    st = await d.evaluate(() => [...document.querySelectorAll('.chapter')].map(c => c.classList.contains('is-on')));
    ok('스크롤 ' + p * 100 + '% → ' + (i + 1) + '챕터', st[i], JSON.stringify(st));
  }
  st = await d.evaluate(() => ({ own: document.querySelectorAll('.own').length, spaces: document.querySelectorAll('#spaces .space').length, stock: document.querySelectorAll('main img[src*="/stock/"]').length, refText: (document.body.innerText.match(/참고 이미지/g) || []).length }));
  ok('홈: 병원 사진 · 인프 현장 표시 · 공간 갤러리 7곳 · 참고 이미지 문구 없음', st.stock >= 14 && st.own >= 2 && st.spaces === 7 && st.refText === 0, JSON.stringify(st));
  for (const [id, n] of [['what', '04_what'], ['spaces', '04b_spaces'], ['problems', '05_problems'], ['plans', '06_plans'], ['ops', '08_ops'], ['safe', '10_safe'], ['proof', '12_proof'], ['trust', '15_trust'], ['how', '16_how'], ['area', '17_area']]) await view(d, '#' + id, n);
  await view(d, '#plans .tables', '07_plans_tables', -120);
  await view(d, '.sched', '09_sched', -100);
  // 안심존 탭
  await view(d, '#safe .tabs__list', null, -120);
  await d.click('#tab-label'); await sleep(500); await shot(d, '11a_safe_label');
  await d.click('#tab-report'); await sleep(500); await shot(d, '11b_safe_report');
  st = await d.evaluate(() => ({ r: !document.getElementById('panel-report').hidden, s: document.getElementById('panel-stand').hidden }));
  ok('안심존 탭 전환', st.r && st.s);
  // 카드 플립 · 라이트박스
  ok('현장 기록: 필터·오염물 갤러리 6장(인프 현장)', await d.evaluate(() => document.querySelectorAll('#proof .gallery a').length === 6 && !document.querySelector('.pcards')));
  await view(d, '.gallery', null, -200); await d.click('.gallery a'); await sleep(700);
  ok('라이트박스', await d.evaluate(() => document.getElementById('modal-lightbox').classList.contains('is-on')));
  await d.keyboard.press('Escape'); await sleep(500);
  // 공정 시퀀스
  const seq = await d.evaluate(() => { const s = document.getElementById('process'); return { top: s.offsetTop, total: s.offsetHeight - innerHeight }; });
  await d.evaluate(y => window.scrollTo(0, y), seq.top + seq.total * 0.95); await sleep(900); await shot(d, '13_seq');
  st = await d.evaluate(() => [...document.querySelectorAll('.seq__step')].map(s => s.classList.contains('is-cur')).indexOf(true));
  ok('공정 시퀀스 마지막 단계', st === 5, 'cur=' + st);

  // 계산기
  await view(d, '#calculator', '14a_calc_default', 60);
  st = { t: await txt(d, '#calc-total'), y: await txt(d, '#calc-year') };
  ok('기본값: 100평 표준형 35만 + 매트리스10·소파2 76만 - 20% = 958,000 / 연 4,808,000', st.t === '958,000' && st.y === '4,808,000원', JSON.stringify(st));
  await d.click('label[for=cp-full]'); await d.click('label[for=cf-coat]'); await sleep(200);
  await d.click('#calc-area', { clickCount: 3 }); await d.type('#calc-area', '200'); await sleep(300);
  st = { t: await txt(d, '#calc-total'), y: await txt(d, '#calc-year'), fa: await d.evaluate(() => !document.querySelector('[data-floor-area]').hidden), range: await d.evaluate(() => document.querySelector('[name=areaRange]').value) };
  ok('풀패키지 200평 100만 + 코팅 50평 50만 + 패브릭 60.8만 = 2,108,000 / 연 13,108,000', st.t === '2,108,000' && st.y === '13,108,000원' && st.fa && st.range === '200', JSON.stringify(st));
  await d.click('[data-step="1"][data-for=mattress]'); await sleep(200);
  st = { m: await d.evaluate(() => document.querySelector('[name=mattress]').value), t: await txt(d, '#calc-total') };
  ok('매트리스 + 버튼 → 11개, 2,156,000', st.m === '11' && st.t === '2,156,000', JSON.stringify(st));
  await d.click('label[for=cp-none]'); await sleep(200);
  st = { t: await txt(d, '#calc-total'), y: await txt(d, '#calc-year'), lines: await d.evaluate(() => document.getElementById('calc-lines').textContent) };
  ok('정기 안 함 → 할인 없음: 50만 + 66만 + 16만 = 1,320,000', st.t === '1,320,000' && st.y === '1,320,000원' && !/할인/.test(st.lines), JSON.stringify(st));
  await d.click('label[for=cp-std]'); await d.click('label[for=cf-none]'); await sleep(200);
  await d.click('#calc-area', { clickCount: 3 }); await d.type('#calc-area', '600'); await sleep(200);
  ok('대규모(600평) 안내 문구', await d.evaluate(() => !document.getElementById('calc-hint').hidden));
  await d.click('#calc-area', { clickCount: 3 }); await d.type('#calc-area', '100'); await sleep(200);
  await d.evaluate(() => { const e = document.querySelector('[name=mattress]'); e.value = '10'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(200); await shot(d, '14b_calc');
  ok('계산기 원상복귀 958,000', (await txt(d, '#calc-total')) === '958,000');

  // 계산 → 드로어 프리필 → 제출 (가짜 엔드포인트)
  await d.evaluate(() => { window.INPE_CONFIG.LEAD_ENDPOINT = location.origin + '/__mock/lead'; });
  await d.click('#calc-go'); await sleep(900);
  const dq = '#drawer-quote ';
  st = await d.evaluate(() => { const f = document.querySelector('#drawer-quote form'); return { open: document.getElementById('drawer-quote').classList.contains('is-on'), items: [...f.querySelectorAll('[name=items]:checked')].map(i => i.value), py: f.sizePy.value, beds: f.beds.value, sofas: f.sofas.value, detail: f.detail.value, est: f.dataset.estimate }; });
  ok('계산 결과 → 신청서 프리필', st.open && st.items.join() === '정기청소,매트리스·소파 케어' && st.py === '100' && st.beds === '10' && st.sofas === '2' && /연간 예상 4,808,000원/.test(st.detail) && st.est === '4808000', JSON.stringify(st));
  await shot(d, '18_drawer_step1');
  await d.evaluate(() => document.querySelectorAll('#drawer-quote [name=items]').forEach(i => { i.checked = false; }));
  await d.click(dq + '[data-next]'); await sleep(300);
  ok('서비스 미선택 시 다음 단계 차단', await d.evaluate(() => document.querySelector('#drawer-quote [name=items]').closest('.field').classList.contains('is-err')));
  await d.click(dq + 'label[for=dq-i1]'); await d.click(dq + 'label[for=dq-i3]'); await d.click(dq + 'label[for=dq-o4]');
  await d.click(dq + '[data-next]'); await sleep(400);
  await d.click(dq + 'label[for=dq-f1]'); await shot(d, '19_drawer_step2');
  await d.click(dq + '[data-next]'); await sleep(400);
  await d.click(dq + '[data-next]'); await sleep(300);
  ok('지역 미선택 시 차단', await d.evaluate(() => document.querySelector('#drawer-quote [name=region]').closest('.field').classList.contains('is-err')));
  await d.select(dq + '[name=region]', '인천'); await d.type(dq + '[name=area]', '남동구 구월동');
  await d.click(dq + 'label[for=dq-s1]'); await d.click(dq + 'label[for=dq-s3]');
  await shot(d, '20_drawer_step3');
  await d.click(dq + '[data-next]'); await sleep(400);
  await d.click(dq + '[data-send]'); await sleep(300);
  st = await d.evaluate(() => ['org', 'name', 'phone', 'agree'].map(n => document.querySelector('#drawer-quote [name=' + n + ']').closest('.field').classList.contains('is-err')));
  ok('빈 담당자 정보 제출 차단 (기관명·성함·연락처·동의)', st.every(Boolean), JSON.stringify(st));
  await d.type(dq + '[name=org]', '테스트산후조리원'); await d.type(dq + '[name=name]', '김담당'); await d.type(dq + '[name=phone]', '01012345678');
  await d.type(dq + '[name=email]', 'wrong-email'); await d.click(dq + '.consent label'); await d.click(dq + '[data-send]'); await sleep(300);
  ok('이메일 형식 오류 차단', await d.evaluate(() => document.querySelector('#drawer-quote [name=email]').closest('.field').classList.contains('is-err')));
  await d.click(dq + '[name=email]', { clickCount: 3 }); await d.type(dq + '[name=email]', 'test@example.com');
  ok('전화번호 자동 하이픈', (await d.evaluate(() => document.querySelector('#drawer-quote [name=phone]').value)) === '010-1234-5678');
  await shot(d, '21_drawer_step4');
  await d.click(dq + '[data-send]'); await sleep(1500);
  st = await d.evaluate(() => ({ modal: document.getElementById('modal-done').classList.contains('is-on'), id: document.querySelector('[data-done-id]').textContent, name: document.querySelector('[data-done-name]').textContent }));
  ok('제출 성공 → 완료 모달 + 접수번호', st.modal && /^IH/.test(st.id) && st.name === '김담당', JSON.stringify(st));
  await shot(d, '22_done');
  const L = (fs.existsSync(LEADS) ? JSON.parse(fs.readFileSync(LEADS, 'utf8')) : [{}])[0];
  ok('DB 저장 (기관·유형·서비스·규모·바닥·시간대·이메일·연간금액·유입)', L.org === '테스트산후조리원' && L.orgType === '산후조리원' && L.items.join() === '정기청소,매트리스·소파 케어' && L.sizePy === '100' && L.beds === '10' && L.floor.join() === '타일' && L.slot.length === 2 && L.email === 'test@example.com' && L.estimate === 4808000 && L.attr && L.attr.landing,
    JSON.stringify({ org: L.org, t: L.orgType, items: L.items, py: L.sizePy, floor: L.floor, slot: L.slot, est: L.estimate }));
  await d.keyboard.press('Escape'); await sleep(400);

  // 실패 경로 (인라인 폼) → 문자 폴백 + 아웃박스
  await d.evaluate(() => { window.INPE_CONFIG.LEAD_ENDPOINT = location.origin + '/__mock/404'; localStorage.removeItem('inpeh_outbox'); localStorage.removeItem('inpeh_last'); });
  await view(d, '#quote', null);
  const qi = '#quote ';
  await d.click(qi + 'label[for=qi-i2]'); await d.click(qi + '[data-next]'); await sleep(300); await d.click(qi + '[data-next]'); await sleep(300);
  await d.select(qi + '[name=region]', '서울'); await d.click(qi + '[data-next]'); await sleep(300);
  await d.type(qi + '[name=org]', '실패의원'); await d.type(qi + '[name=name]', '이실패'); await d.type(qi + '[name=phone]', '010-9999-8888'); await d.click(qi + '.consent label');
  await d.click(qi + '[data-send]'); await sleep(1500);
  st = await d.evaluate(() => { const a = document.querySelector('.toast--err a[href^="sms:"]'); return { toast: document.querySelectorAll('.toast--err').length, outbox: JSON.parse(localStorage.getItem('inpeh_outbox') || '[]').length, sms: a ? decodeURIComponent(a.getAttribute('href')) : '' }; });
  ok('전송 실패 → 에러 토스트 + 문자 본문(기관명) + 아웃박스', st.toast && /인프 병원청소 실측 요청/.test(st.sms) && /실패의원/.test(st.sms) && st.outbox === 1, JSON.stringify(st).slice(0, 200));
  await shot(d, '23_error_toast');
  // FAQ · 점검표 모달
  await view(d, '#faq', null);
  await d.click('#faq .acc__item:nth-child(3) .acc__btn'); await sleep(600);
  st = await d.evaluate(() => [...document.querySelectorAll('#faq .acc__btn')].map(b => b.getAttribute('aria-expanded')));
  ok('FAQ 아코디언 단일 열림', st.filter(x => x === 'true').length === 1 && st[2] === 'true', JSON.stringify(st));
  await shot(d, '24_faq');
  await d.evaluate(() => document.querySelector('.quick [data-open=modal-check]').click()); await sleep(600);
  ok('실측 전 점검표 모달 (10항목)', await d.evaluate(() => document.getElementById('modal-check').classList.contains('is-on') && document.querySelectorAll('#modal-check .chk li').length === 10));
  await shot(d, '25_checklist'); await d.keyboard.press('Escape'); await sleep(400);
  await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(900); await shot(d, '26_footer');
  st = await d.evaluate(() => [...document.querySelectorAll('#trust .stat b span')].map(s => parseFloat(getComputedStyle(s).fontSize)));
  ok('숫자 크기 40px 이상', st.length === 4 && st.every(x => x >= 40), st.join(','));

  /* ---------- 1920 화면 → 4K ---------- */
  const big = await mk(1920, 1080);
  await big.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(3500);
  st = await big.evaluate(() => { const v = document.querySelector('.reel video'); return { t: v.currentTime, src: v.currentSrc, w: v.videoWidth, h: v.videoHeight }; });
  ok('1920 화면 → 4K 영상 재생(3840x2160)', /hospital-reel-4k/.test(st.src) && st.w === 3840 && st.h === 2160 && st.t > 0.3, JSON.stringify(st));
  await shot(big, '00b_reel_4k'); await big.close();

  /* ---------- 모바일 ---------- */
  const m = await mk(390, 844, true);
  await m.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(2500);
  st = await m.evaluate(() => document.querySelector('.reel video').currentSrc);
  ok('모바일 세로 영상 선택', /hospital-reel-mobile/.test(st), st);
  ok('모바일 영상 1080x2280', await m.evaluate(() => { const v = document.querySelector('.reel video'); return v.videoWidth === 1080 && v.videoHeight === 2280; }));
  await shot(m, 'm00_reel');
  await m.evaluate(() => document.querySelector('.reel__skip').click()); await sleep(1300);
  await shot(m, 'm01_hero');
  const mw = [];
  for (const [id, n] of [['what', 'm02_what'], ['plans', 'm03_plans'], ['ops', 'm04_ops'], ['safe', 'm05_safe'], ['calculator', 'm06_calc'], ['trust', 'm07_trust'], ['quote', 'm08_quote']]) { await view(m, '#' + id, n); mw.push(await m.evaluate(() => document.documentElement.scrollWidth)); }
  ok('모바일 가로 스크롤 없음', mw.every(w => w <= 390), mw.join(','));
  ok('모바일 하단 바', await m.evaluate(() => getComputedStyle(document.querySelector('.mbar')).display !== 'none'));
  await m.evaluate(() => window.scrollTo(0, 0)); await sleep(400);
  await m.evaluate(() => document.querySelector('.hdr__menu').click()); await sleep(800); await shot(m, 'm09_nav');
  ok('모바일 메뉴 드로어', await m.evaluate(() => document.getElementById('drawer-nav').classList.contains('is-on')));
  await m.keyboard.press('Escape'); await sleep(400);
  await m.evaluate(() => document.querySelector('.mbar .is-main').click()); await sleep(800); await shot(m, 'm10_quote_drawer');
  ok('모바일 실측 신청 드로어', await m.evaluate(() => document.getElementById('drawer-quote').classList.contains('is-on')));

  /* ---------- 전 페이지 공통 ---------- */
  for (const p of PAGES) {
    for (const [w, h, mob, tag] of [[1440, 900, false, 'p_'], [390, 844, true, 'pm_']]) {
      const s = await mk(w, h, mob);
      await s.goto(BASE + (p === 'index' ? '' : p + '.html'), { waitUntil: 'networkidle2' }); await sleep(700);
      const info = await s.evaluate(() => {
        let ld = 'none', faqN = 0;
        try { const g = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph']; ld = g.map(n => [].concat(n['@type']).join('/')).join(','); const f = g.find(n => n['@type'] === 'FAQPage'); faqN = f ? f.mainEntity.length : 0; } catch (e) { ld = 'ERR ' + e.message; }
        const cl = document.body.cloneNode(true); cl.querySelectorAll('script,[data-xref]').forEach(e => e.remove()); const body = cl.textContent;
        return { h1: (document.querySelector('h1') || {}).textContent || '', ld, faqN, faqDom: document.querySelectorAll('#faq .acc__item').length, sw: document.documentElement.scrollWidth, iw: innerWidth,
          pet: (body.match(/반려|소변|파보|칼리시|강아지|고양이/g) || []).length, ph: (document.documentElement.outerHTML.match(/\{\{[a-z_]+\}\}/g) || []).length,
          canon: (document.querySelector('link[rel=canonical]') || {}).href, title: document.title, imgs: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src') && !/^data:/.test(i.getAttribute('src'))).map(i => i.getAttribute('src')) };
      });
      if (!mob) {
        const badge = await s.evaluate(() => ({ refText: (document.body.innerText.match(/참고 이미지/g) || []).length + [...document.images].filter(i => /참고 이미지/.test(i.alt)).length, credits: document.querySelectorAll('.credits li').length }));
        ok(p + ' 참고 이미지 문구 없음(본문·alt)', badge.refText === 0, JSON.stringify(badge));
        if (p === 'about') ok('about 사진 출처 목록', badge.credits >= 20, 'credits ' + badge.credits);
        await shot(s, tag + p, true);
        ok(p + ' 로드 · JSON-LD · 제목', !/ERR/.test(info.ld) && info.h1 && info.title, info.ld.slice(0, 120));
        ok(p + ' FAQ 화면=구조화 데이터', info.faqN === info.faqDom, info.faqN + ' vs ' + info.faqDom);
        ok(p + ' 반려동물 문구·자리표시자 없음', info.pet === 0 && info.ph === 0, 'pet ' + info.pet + ' ph ' + info.ph);
        ok(p + ' 깨진 이미지 없음', info.imgs.length === 0, info.imgs.join(','));
        ok(p + ' canonical', /^https:\/\/inpe\.kr\/hospital\//.test(info.canon), info.canon);
      } else {
        await shot(s, tag + p);
        ok(p + ' 모바일 가로 넘침 없음', info.sw <= info.iw, info.sw + '/' + info.iw);
      }
      await s.close();
    }
  }

  await browser.close();
  const uniqErr = [...new Set(errs)];
  ok('콘솔/네트워크 오류 없음', uniqErr.length === 0, uniqErr.slice(0, 8).join(' | '));
  for (const [s, n, i] of results) console.log(s, n, i ? ' — ' + String(i).slice(0, 240) : '');
  console.log('\nTOTAL', results.filter(r => r[0] === 'PASS').length + '/' + results.length);
})().catch(e => { console.error(e); process.exit(1); });
