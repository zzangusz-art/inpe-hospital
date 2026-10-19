// 배포된 주소 점검: node _dev/remote-check.js https://zzangusz-art.github.io/inpe-hospital/
const fs = require('fs'), path = require('path');
const PUP = [path.join(__dirname, '../_reel/node_modules/puppeteer-core'), path.join(__dirname, '../../인프케어_홈페이지/_reel/node_modules/puppeteer-core')].find(p => fs.existsSync(p));
const puppeteer = require(PUP);
const BASE = process.argv[2] || 'https://zzangusz-art.github.io/inpe-hospital/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const res = []; const ok = (n, c, i = '') => res.push([c ? 'PASS' : 'FAIL', n, i]);
(async () => {
  const b = await puppeteer.launch({ protocolTimeout: 60000, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  const mk = async (w, h, mobile) => {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: !!mobile, hasTouch: !!mobile });
    p.on('pageerror', e => errs.push('pageerror ' + e.message));
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', r => { const f = (r.failure() || {}).errorText || ''; if (!/ERR_ABORTED/.test(f)) errs.push('fail ' + r.url() + ' ' + f); });
    return p;
  };
  const d = await mk(1440, 900);
  await d.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000);
  let s = await d.evaluate(() => { const v = document.querySelector('.reel video'); return { t: v.currentTime, src: v.currentSrc, robots: [...document.querySelectorAll('meta[name=robots]')].map(m => m.content), title: document.title, canon: document.querySelector('link[rel=canonical]').href }; });
  ok('홈 로드 · 쇼릴 재생', s.t > 0.5 && /hospital-reel/.test(s.src), JSON.stringify({ t: s.t, src: s.src.split('/').pop() }));
  ok('github.io 검색 제외(noindex)', s.robots.some(x => /noindex/.test(x)), s.robots.join(' | '));
  ok('canonical은 정식 주소', /^https:\/\/inpe\.kr\/hospital\//.test(s.canon), s.canon);
  // 운영 모드(DB 미연결) 폼 제출 → 문자 폴백
  await d.click('.reel__skip'); await sleep(800);
  await d.evaluate(() => document.getElementById('quote').scrollIntoView()); await sleep(800);
  const q = '#quote ';
  await d.click(q + 'label[for=qi-i1]'); await d.click(q + '[data-next]'); await sleep(300); await d.click(q + '[data-next]'); await sleep(300);
  await d.select(q + '[name=region]', '인천'); await d.click(q + '[data-next]'); await sleep(300);
  await d.type(q + '[name=org]', '배포점검병원'); await d.type(q + '[name=name]', '배포점검'); await d.type(q + '[name=phone]', '01000000000'); await d.click(q + '.consent label');
  await d.click(q + '[data-send]'); await sleep(1200);
  s = await d.evaluate(() => ({ t: (document.querySelector('.toast--err') || {}).textContent || '', sms: (document.querySelector('.toast--err a[href^="sms:"]') || {}).href || '' }));
  ok('DB 미연결 → 문자 폴백 안내', /서버가 연결되지/.test(s.t) && /050713145792/.test(s.sms) && /%EB%B0%B0%ED%8F%AC%EC%A0%90%EA%B2%80%EB%B3%91%EC%9B%90|배포점검병원/.test(s.sms), s.t.slice(0, 50));
  // 계산기
  await d.evaluate(() => document.getElementById('calculator').scrollIntoView()); await sleep(600);
  s = await d.evaluate(() => document.getElementById('calc-total').textContent);
  ok('계산기 기본값 958,000', s === '958,000', s);
  const pg = await mk(1440, 900);
  for (const p of ['hospital-fabric.html', 'hospital-floor.html', 'postpartum.html', 'price.html', 'about.html', 'privacy.html']) {
    const r = await pg.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null);
    const extra = await pg.evaluate(() => { try { return JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'].length + ' ld nodes · ' + (/반려|소변|파보/.test(document.querySelector('main').innerText) ? '반려동물 문구 있음!' : '반려동물 문구 없음'); } catch (e) { return 'LD ERR'; } });
    ok('페이지 ' + p, r && r.status() === 200 && !/ERR|있음!/.test(extra), (r ? r.status() : 'x') + ' ' + extra);
  }
  await pg.close();
  for (const p of ['llms.txt', 'sitemap.xml', 'robots.txt', 'assets/video/hospital-reel-1080p.mp4', 'assets/video/hospital-reel-720p.mp4', 'assets/video/hospital-reel-mobile.mp4', 'assets/img/og-hospital.jpg', 'assets/img/clients.png', 'assets/js/app.js', 'assets/css/style.css']) {
    const r = await fetch(BASE + p, { method: 'HEAD' }).catch(() => null);
    ok('파일 ' + p, r && r.status === 200, r ? r.status + ' ' + r.headers.get('content-type') + ' ' + Math.round((+r.headers.get('content-length') || 0) / 1024) + 'KB' : 'x');
  }
  const m = await mk(390, 844, true);
  await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000);
  s = await m.evaluate(() => ({ src: document.querySelector('.reel video').currentSrc.split('/').pop(), t: document.querySelector('.reel video').currentTime, sw: document.documentElement.scrollWidth }));
  ok('모바일 세로 영상 재생 · 가로 넘침 없음', /mobile/.test(s.src) && s.t > 0.5 && s.sw <= 390, JSON.stringify(s));
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  await m.screenshot({ path: path.join(__dirname, 'shots', 'remote_mobile.jpg'), type: 'jpeg', quality: 70 });
  await b.close();
  const u = [...new Set(errs)];
  ok('404 · 스크립트 오류 없음', u.length === 0, u.slice(0, 6).join(' | '));
  res.forEach(r => console.log(r[0], r[1], r[2] ? '— ' + r[2] : ''));
  console.log('TOTAL', res.filter(r => r[0] === 'PASS').length + '/' + res.length);
})().catch(e => { console.error('CRASH', e); process.exit(1); });
