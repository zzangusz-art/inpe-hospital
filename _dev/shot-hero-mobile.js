// 모바일 히어로 하단 겹침 확인용: node _dev/shot-hero-mobile.js
const fs = require('fs'), path = require('path');
const PUP = [path.join(__dirname, '../_reel/node_modules/puppeteer-core'), path.join(__dirname, '../../인프케어_홈페이지/_reel/node_modules/puppeteer-core')].find(p => fs.existsSync(p));
const puppeteer = require(PUP);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  for (const [w, h, n] of [[390, 844, 'mh_390'], [360, 740, 'mh_360']]) {
    const p = await b.newPage();
    await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
    await p.goto('http://127.0.0.1:5179/', { waitUntil: 'networkidle2' }); await new Promise(r => setTimeout(r, 1500));
    await p.evaluate(() => document.querySelector('.reel__skip').click()); await new Promise(r => setTimeout(r, 2500));
    const boxes = await p.evaluate(() => ['.reel__trust', '.reel__replay', '.reel__scroll', '.reel__cta'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return s + ' ' + [r.left, r.top, r.right, r.bottom].map(Math.round).join(','); }));
    console.log(n, JSON.stringify(boxes));
    await p.screenshot({ path: path.join(__dirname, 'shots', n + '.jpg'), type: 'jpeg', quality: 75 });
    await p.close();
  }
  await b.close();
})();
