// 진단용: 페이지별 JS 오류 스택과 모바일 가로 넘침 요소 찾기  node _dev/diag.js
const fs = require('fs'), path = require('path');
const PUP = [path.join(__dirname, '../_reel/node_modules/puppeteer-core'), path.join(__dirname, '../../인프케어_홈페이지/_reel/node_modules/puppeteer-core')].find(p => fs.existsSync(p));
const puppeteer = require(PUP);
const BASE = 'http://127.0.0.1:' + (process.env.PORT || 5179) + '/';
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  for (const p of ['', 'hospital-fabric.html', 'hospital-floor.html', 'postpartum.html', 'price.html', 'about.html', 'privacy.html']) {
    for (const mob of [false, true]) {
      const pg = await b.newPage();
      await pg.setViewport(mob ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1440, height: 900 });
      pg.on('pageerror', e => console.log('ERR', p || 'index', mob ? 'mobile' : 'desktop', e.message, (e.stack || '').split('\n').slice(0, 3).join(' | ')));
      await pg.goto(BASE + p, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 800));
      if (mob) {
        const wide = await pg.evaluate(() => { const W = 390; const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const c = getComputedStyle(a); if (c.position === 'fixed' || /hidden|auto|scroll|clip/.test(c.overflowX)) return true; } return false; }; return [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > W + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed' && !clipped(e); }).slice(0, 8).map(e => e.tagName + '.' + String(e.className).slice(0, 40) + ' ' + Math.round(e.getBoundingClientRect().right)); });
        if (wide.length) console.log('WIDE', p || 'index', JSON.stringify(wide));
      }
      await pg.close();
    }
  }
  await b.close();
})();
