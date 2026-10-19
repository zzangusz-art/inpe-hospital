/* =========================================================
   인프 병원·산후조리원 청소 — app.js (인프케어 app.js 기반)  (vanilla, 외부 라이브러리 없음)
   ========================================================= */
(function () {
  'use strict';
  var C = window.INPE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEMO = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var won = function (n) { return n.toLocaleString('ko-KR') + '원'; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  /* rAF가 멈추는 환경(숨겨진 탭·일부 인앱 브라우저)에서도 스크롤 연출이 갱신되도록 폴백 */
  var raf = function (cb) { var ran = false, id = requestAnimationFrame(function () { ran = true; cb(); }); setTimeout(function () { if (!ran) { cancelAnimationFrame(id); cb(); } }, 120); };
  document.documentElement.classList.remove('no-js');

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };

  var SVG = {
    check: '<svg viewBox="0 0 24 24" class="ico"><polyline points="20 6 9 17 4 12"/></svg>',
    alert: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>',
    info: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="ico"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };

  /* =======================================================
     전환 추적 (설정값이 있을 때만 로드)
     ======================================================= */
  var Track = {
    init: function () {
      var s;
      if (C.GA4_ID) {
        s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.GA4_ID; document.head.appendChild(s);
        window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date()); window.gtag('config', C.GA4_ID);
      }
      if (C.NAVER_WCS_ID) {
        s = document.createElement('script'); s.src = 'https://wcs.naver.net/wcslog.js';
        s.onload = function () { if (!window.wcs_add) window.wcs_add = {}; window.wcs_add.wa = C.NAVER_WCS_ID; if (window.wcs) window.wcs_do(); };
        document.head.appendChild(s);
      }
      if (C.META_PIXEL_ID) {
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        window.fbq('init', C.META_PIXEL_ID); window.fbq('track', 'PageView');
      }
      if (C.KAKAO_PIXEL_ID) {
        s = document.createElement('script'); s.src = '//t1.daumcdn.net/kas/static/kp.js';
        s.onload = function () { if (window.kakaoPixel) window.kakaoPixel(C.KAKAO_PIXEL_ID).pageView(); };
        document.head.appendChild(s);
      }
    },
    ev: function (name, params) {
      params = params || {};
      try {
        if (window.gtag) window.gtag('event', name, params);
        window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: name }, params));
        if (name === 'generate_lead') {
          if (window.fbq) window.fbq('track', 'Lead', { value: params.value || 0, currency: 'KRW' });
          if (window.wcs && window.wcs.cnv) { var _nasa = {}; _nasa.cnv = window.wcs.cnv('4', String(params.value || 1)); window.wcs_do(_nasa); }
          if (window.kakaoPixel && C.KAKAO_PIXEL_ID) window.kakaoPixel(C.KAKAO_PIXEL_ID).participation();
        }
        if ((name === 'click_call' || name === 'click_sms') && window.fbq) window.fbq('track', 'Contact');
      } catch (e) { /* 추적 실패는 사용자 흐름에 영향 주지 않음 */ }
    }
  };

  /* 유입 경로 저장 (광고 키워드까지 리드에 같이 저장) */
  var Attr = {
    KEYS: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'n_media', 'n_query', 'n_rank', 'n_ad_group', 'n_ad', 'n_keyword', 'n_campaign_type'],
    init: function () {
      var q = new URLSearchParams(location.search), a = {}, has = false;
      this.KEYS.forEach(function (k) { if (q.get(k)) { a[k] = q.get(k); has = true; } });
      var ref = document.referrer && document.referrer.indexOf(location.host) === -1 ? document.referrer : '';
      var cur = store.get('inpeh_attr', null);
      if (has || !cur || (ref && !cur.utm_source)) {
        a.referrer = ref || (cur && cur.referrer) || '(direct)';
        a.landing = location.pathname + location.search;
        a.at = new Date().toISOString();
        store.set('inpeh_attr', a);
      }
    },
    get: function () { return store.get('inpeh_attr', {}); }
  };

  /* =======================================================
     토스트
     ======================================================= */
  var toastBox;
  function toast(msg, o) {
    o = o || {};
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; toastBox.setAttribute('role', 'status'); toastBox.setAttribute('aria-live', 'polite'); document.body.appendChild(toastBox); }
    var type = o.type || 'info', t = o.timeout == null ? 5200 : o.timeout;
    var el = document.createElement('div'); el.className = 'toast toast--' + type;
    var ico = type === 'ok' ? SVG.check : type === 'err' ? SVG.alert : SVG.info;
    var acts = (o.actions || []).map(function (a, i) { return a.href ? '<a href="' + a.href + '" data-i="' + i + '">' + a.label + '</a>' : '<button type="button" data-i="' + i + '">' + a.label + '</button>'; }).join('');
    el.innerHTML = '<span class="toast__ico">' + ico + '</span><div class="toast__body">' + (o.title ? '<b>' + o.title + '</b>' : '') + '<span>' + msg + '</span>' + (o.sub ? '<small>' + o.sub + '</small>' : '') + (acts ? '<div class="toast__acts">' + acts + '</div>' : '') + '</div><button class="toast__x" type="button" aria-label="알림 닫기">' + SVG.x + '</button>' + (t ? '<i class="toast__bar" style="animation-duration:' + t + 'ms"></i>' : '');
    var kill = function () { if (el.classList.contains('is-out')) return; el.classList.add('is-out'); setTimeout(function () { el.remove(); }, 360); };
    el.querySelector('.toast__x').onclick = kill;
    $$('[data-i]', el).forEach(function (b) { b.addEventListener('click', function () { var a = o.actions[+b.dataset.i]; if (a.onClick) a.onClick(); if (!a.keep) kill(); }); });
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    var timer = t ? setTimeout(kill, t) : null;
    el.addEventListener('mouseenter', function () { if (timer) { clearTimeout(timer); var b = el.querySelector('.toast__bar'); if (b) b.style.animationPlayState = 'paused'; } });
    el.addEventListener('mouseleave', function () { if (t) { var b = el.querySelector('.toast__bar'); if (b) b.style.animationPlayState = 'running'; timer = setTimeout(kill, 2200); } });
    return el;
  }
  window.inpeToast = toast;

  /* =======================================================
     오버레이: 모달 / 드로어 (공용 스크림, 포커스 트랩, ESC)
     ======================================================= */
  var Overlay = (function () {
    var scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim);
    var stack = [];
    var FOCUS = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])';
    function open(el, opener) {
      if (!el || stack.some(function (s) { return s.el === el; })) return;
      stack.push({ el: el, opener: opener || document.activeElement });
      el.classList.add('is-on'); el.setAttribute('aria-hidden', 'false');
      scrim.classList.add('is-on'); document.body.classList.add('is-locked');
      setTimeout(function () { var f = $(el.dataset.focus || FOCUS, el); if (f) f.focus({ preventScroll: true }); }, 60);
      el.dispatchEvent(new CustomEvent('overlay:open'));
    }
    function close(el) {
      var i = -1; stack.forEach(function (s, k) { if (s.el === el) i = k; });
      if (i < 0) return;
      var s = stack.splice(i, 1)[0];
      el.classList.remove('is-on'); el.setAttribute('aria-hidden', 'true');
      if (!stack.length) { scrim.classList.remove('is-on'); document.body.classList.remove('is-locked'); }
      if (s.opener && s.opener.focus) s.opener.focus({ preventScroll: true });
      el.dispatchEvent(new CustomEvent('overlay:close'));
    }
    function top() { return stack.length ? stack[stack.length - 1].el : null; }
    scrim.addEventListener('click', function () { var t = top(); if (t) close(t); });
    document.addEventListener('keydown', function (e) {
      var t = top(); if (!t) return;
      if (e.key === 'Escape') { close(t); return; }
      if (e.key === 'Tab') {
        var f = $$(FOCUS, t).filter(function (n) { return n.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    document.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]');
      if (o) { e.preventDefault(); open(document.getElementById(o.dataset.open), o); return; }
      var c = e.target.closest('[data-close]');
      if (c) { e.preventDefault(); var host = c.closest('.modal,.drawer'); if (host) close(host); }
    });
    return { open: open, close: close, top: top };
  })();
  window.inpeOverlay = Overlay;

  /* =======================================================
     헤더·진행바·퀵메뉴
     ======================================================= */
  function initChrome() {
    var hdr = $('.hdr'), bar = $('.progress-top'), quick = $('.quick'), mbar = $('.mbar'), reel = $('.reel');
    var last = 0, ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
      var after = reel ? reel.offsetTop + reel.offsetHeight - window.innerHeight * 0.9 : 30;
      if (hdr) {
        hdr.classList.toggle('is-solid', y > after);
        if (y > after + 300 && y > last + 6 && !document.body.classList.contains('is-locked')) hdr.classList.add('is-hidden');
        else if (y < last - 6 || y < after) hdr.classList.remove('is-hidden');
      }
      if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
      var showQ = reel ? y > reel.offsetTop + window.innerHeight * 0.6 : y > 240;
      if (quick) quick.classList.toggle('is-on', showQ);
      if (mbar) mbar.classList.toggle('is-on', reel ? showQ : true);
      last = y;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; raf(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
    var cur = (location.pathname.split('/').pop() || 'index.html');
    $$('.nav a, .mnav a').forEach(function (a) { if (a.getAttribute('href') === cur) a.setAttribute('aria-current', 'page'); });
    $$('.mnav a').forEach(function (a) { a.addEventListener('click', function () { var d = a.closest('.drawer'); if (d) Overlay.close(d); }); });
  }

  /* =======================================================
     HERO — 15초 쇼릴 + 스크롤 시퀀스
     ======================================================= */
  function initReel() {
    var R = $('.reel'); if (!R) return;
    var v = $('video', R), poster = $('.reel__poster', R), chapters = $$('.chapter', R), idx = $$('.reel__index button', R);
    var bgs = $$('.reel__bg', R), ring = $('.reel__ring .fg', R), frame = $('.reel__frame', R), shade = $('.reel__shade', R);
    var portrait = window.innerHeight > window.innerWidth * 1.05;
    var conn = navigator.connection || {};
    var saveData = !!conn.saveData || /2g/.test(conn.effectiveType || '');
    /* 화면 가로 실제 픽셀 1600 이상이면 4K, 작거나 회선이 느리면 1080p, 세로 화면은 모바일(1080x2280) */
    var px = window.innerWidth * (window.devicePixelRatio || 1);
    var slow = /(^|-)(2g|3g)$/.test(conn.effectiveType || '');   // downlink 추정값은 첫 방문 때 1.5 같은 임시값이라 쓰지 않음
    var src = portrait ? v.dataset.srcMobile : (px >= 1600 && !slow && v.dataset.src4k ? v.dataset.src4k : v.dataset.src1080);
    var pst = portrait ? v.dataset.posterMobile : v.dataset.posterDesktop;
    if (poster && pst) poster.src = pst;
    var done = false, cur = -1;
    document.body.classList.add('reel-playing');

    function finish(reason) {
      if (done) return; done = true;
      R.classList.add('is-done'); document.body.classList.remove('reel-playing');
      if (reason !== 'ended') { try { v.pause(); } catch (e) { } }
      v.style.transition = 'opacity .9s'; v.style.opacity = '0';
      update(true);
    }
    if (!src) { var rpl = $('.reel__replay', R), hud = $('.reel__hud', R); if (rpl) rpl.hidden = true; if (hud) hud.hidden = true; }
    if (RM || saveData || !src) { R.classList.add('is-static'); v.removeAttribute('autoplay'); finish('static'); }
    else {
      v.src = src; v.muted = true; v.playsInline = true;
      var p = v.play(); if (p && p.catch) p.catch(function () { R.classList.add('is-static'); finish('blocked'); });
      setTimeout(function () { if (!done && v.readyState < 2) { R.classList.add('is-static'); finish('slow'); } }, 9000);
    }
    v.addEventListener('timeupdate', function () { if (ring) ring.style.strokeDashoffset = (69.1 * (1 - v.currentTime / (v.duration || 15))).toFixed(2); });
    v.addEventListener('ended', function () { finish('ended'); Track.ev('reel_complete'); });
    $('.reel__skip', R).addEventListener('click', function () { finish('skip'); Track.ev('reel_skip', { at: Math.round(v.currentTime) }); });
    $('.reel__replay', R).addEventListener('click', function () {
      done = false; cur = -1; R.classList.remove('is-done', 'is-static'); document.body.classList.add('reel-playing');
      chapters.forEach(function (c) { c.classList.remove('is-on'); });
      window.scrollTo({ top: R.offsetTop, behavior: 'smooth' });
      v.style.opacity = '1'; if (!v.src) v.src = src; v.currentTime = 0; v.play();
    });
    idx.forEach(function (b, i) {
      b.addEventListener('click', function () {
        var total = R.offsetHeight - window.innerHeight;
        window.scrollTo({ top: R.offsetTop + total * ((i + 0.35) / chapters.length), behavior: RM ? 'auto' : 'smooth' });
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (!done) { if (e.isIntersecting) v.play().catch(function () { }); else v.pause(); } }); }, { threshold: 0.15 }).observe(R);
    }
    function prog() { var total = Math.max(1, R.offsetHeight - window.innerHeight), v = -R.getBoundingClientRect().top / total; return v > 0 ? clamp(v, 0, 1) : 0; }
    function update(force) {
      var p = prog();
      if (!done && p > 0.03) finish('scroll');
      if (!done && !force) return;
      var n = chapters.length, f = p * n, i = clamp(Math.floor(f * 0.9999), 0, n - 1);
      if (i !== cur) {
        cur = i;
        chapters.forEach(function (c, k) { c.classList.toggle('is-on', k === i); c.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
        idx.forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
        bgs.forEach(function (b, k) { b.style.opacity = k === i ? '1' : '0'; });
      }
      bgs.forEach(function (b, k) { var lp = clamp(f - k, 0, 1); b.style.transform = 'scale(' + (1.14 - 0.1 * lp).toFixed(4) + ') translateY(' + (-2 * lp).toFixed(2) + '%)'; });
      var endP = clamp((p - 0.86) / 0.14, 0, 1);
      var ins = Math.min(window.innerWidth, window.innerHeight) * 0.035 * endP;
      frame.style.setProperty('--inset', ins.toFixed(1) + 'px');
      frame.style.setProperty('--round', (28 * endP).toFixed(1) + 'px');
      if (shade) shade.style.setProperty('--shade', (0.85 + 0.15 * endP).toFixed(3));
    }
    var tick = false;
    window.addEventListener('scroll', function () { if (!tick) { tick = true; raf(function () { tick = false; update(); }); } }, { passive: true });
  }

  /* =======================================================
     리빌·카운터
     ======================================================= */
  function initReveal() {
    var els = $$('.rv, .img-rv');
    if (!('IntersectionObserver' in window) || RM) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }
  function initCounters() {
    var els = $$('[data-count]'); if (!els.length) return;
    function run(el) {
      var to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = null, dur = 1600;
      if (RM) { el.textContent = to.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); return; }
      function f(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = (to * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (p < 1) requestAnimationFrame(f); }
      requestAnimationFrame(f);
    }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* =======================================================
     탭·아코디언
     ======================================================= */
  function initTabs() {
    $$('[data-tabs]').forEach(function (w) {
      var tabs = $$('[role=tab]', w);
      function sel(i, focus) {
        tabs.forEach(function (t, k) {
          var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1;
          var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on;
        });
        if (focus) tabs[i].focus();
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { sel(i); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); sel((i + 1) % tabs.length, true); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); sel((i - 1 + tabs.length) % tabs.length, true); }
        });
      });
      w._sel = function (id) { tabs.forEach(function (t, i) { if (t.id === id) sel(i); }); };
    });
    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-tab-go]'); if (!g) return;
      var t = document.getElementById(g.dataset.tabGo); if (!t) return;
      var w = t.closest('[data-tabs]'); if (w && w._sel) { e.preventDefault(); w._sel(t.id); w.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }
    });
  }
  function initAccordion() {
    $$('.acc__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true', acc = b.closest('.acc');
        if (acc && acc.hasAttribute('data-single') && !open) $$('.acc__btn[aria-expanded="true"]', acc).forEach(function (o) { o.setAttribute('aria-expanded', 'false'); });
        b.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (!open) Track.ev('faq_open', { q: b.textContent.trim().slice(0, 60) });
      });
    });
  }

  /* =======================================================
     비포/애프터·필터 카드·라이트박스·이미지 스켈레톤
     ======================================================= */
  function initBA() {
    $$('.ba').forEach(function (ba) {
      var r = $('input[type=range]', ba);
      var set = function (v) { ba.style.setProperty('--pos', v + '%'); };
      r.addEventListener('input', function () { set(r.value); });
      set(r.value);
      if (!RM && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return; io.disconnect();
          var t0 = null; (function f(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1800), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; var val = 85 - 70 * Math.sin(e * Math.PI) * 0.5 - 35 * e; r.value = val; set(val); if (p < 1) requestAnimationFrame(f); })(performance.now());
        }, { threshold: 0.5 });
        io.observe(ba);
      }
    });
  }
  function initCards() {
    $$('.pcard').forEach(function (c) {
      c.addEventListener('click', function () { c.classList.toggle('is-flip'); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.classList.toggle('is-flip'); } });
    });
  }
  function initLightbox() {
    var m = document.getElementById('modal-lightbox'); if (!m) return;
    var img = $('.lb__img', m), cap = $('.lb__cap', m), cnt = $('.lb__count', m), list = [], i = 0;
    function show(k) { i = (k + list.length) % list.length; var it = list[i]; img.src = it.src; img.alt = it.alt; cap.textContent = it.alt; cnt.textContent = (i + 1) + ' / ' + list.length; }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lb]'); if (!a) return;
      e.preventDefault();
      var g = a.dataset.lb; list = $$('[data-lb="' + g + '"]').map(function (n) { return { src: n.getAttribute('href'), alt: n.dataset.cap || (n.querySelector('img') || {}).alt || '' }; });
      show($$('[data-lb="' + g + '"]').indexOf(a)); Overlay.open(m, a);
    });
    $('.lb__prev', m).onclick = function () { show(i - 1); };
    $('.lb__next', m).onclick = function () { show(i + 1); };
    m.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  }
  function initImgSkeleton() {
    $$('img.sk-img').forEach(function (im) {
      var host = im.parentElement; host.classList.add('sk');
      var ok = function () { host.classList.remove('sk'); };
      if (im.complete && im.naturalWidth) ok(); else { im.addEventListener('load', ok); im.addEventListener('error', ok); }
    });
  }

  /* =======================================================
     6단계 공정 — 스크롤 시퀀스 캔버스
     ======================================================= */
  function initSeq() {
    var S = $('.seq'); if (!S) return;
    var cv = $('.seq__canvas', S), ctx = cv.getContext('2d'), steps = $$('.seq__step', S), barEl = $('.seq__bar', S);
    var srcs = { before: 'assets/img/real/mattress-before.jpg', after: 'assets/img/real/mattress-after.jpg', under: 'assets/img/real/sofa-under-02.jpg', dust: 'assets/img/real/dust-bin-01.jpg' };
    var IM = {}, left = 0, W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var NAMES = ['UV-C 살균', '건식 흡입', '습식 세정', '고온 스팀', '하부·틈새', '음이온 마감'];
    Object.keys(srcs).forEach(function (k) { left++; var im = new Image(); im.onload = function () { if (--left === 0) draw(); }; im.src = srcs[k]; IM[k] = im; });
    function size() { var r = cv.getBoundingClientRect(); W = Math.round(r.width * dpr); H = Math.round(r.height * dpr); cv.width = W; cv.height = H; draw(); }
    function cover(im, x, y, w, h, z) { if (!im || !im.naturalWidth) return; z = z || 1; var ir = im.naturalWidth / im.naturalHeight, rr = w / h, sw, sh; if (ir > rr) { sh = im.naturalHeight; sw = sh * rr; } else { sw = im.naturalWidth; sh = sw / rr; } sw /= z; sh /= z; ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, x, y, w, h); }
    function rnd(i) { var s = Math.sin(i * 127.1) * 43758.5453; return s - Math.floor(s); }
    function prog() { var total = Math.max(1, S.offsetHeight - window.innerHeight), v = -S.getBoundingClientRect().top / total; return v > 0 ? clamp(v, 0, 1) : 0; }
    function draw() {
      if (!W || left > 0) return;
      var p = prog(), s = clamp(p * 6, 0, 5.999), st = Math.floor(s), lp = s - st, u = W / 1000;
      ctx.clearRect(0, 0, W, H);
      if (st === 0) {
        cover(IM.before, 0, 0, W, H, 1.04);
        var bx = W * lp, g = ctx.createLinearGradient(bx - 160 * u, 0, bx + 40 * u, 0);
        g.addColorStop(0, 'rgba(124,92,255,0)'); g.addColorStop(.8, 'rgba(150,120,255,.45)'); g.addColorStop(1, 'rgba(124,92,255,0)');
        ctx.fillStyle = 'rgba(124,92,255,.10)'; ctx.fillRect(0, 0, bx, H);
        ctx.fillStyle = g; ctx.fillRect(bx - 160 * u, 0, 200 * u, H);
        ctx.fillStyle = '#fff'; ctx.fillRect(bx - 1.5 * u, 0, 3 * u, H);
      } else if (st === 1) {
        cover(IM.before, 0, 0, W, H, 1.04);
        ctx.fillStyle = 'rgba(0,0,0,' + (0.15 * lp) + ')'; ctx.fillRect(0, 0, W, H);
        var nx = W * (0.15 + 0.7 * lp), ny = H * 0.82;
        for (var i = 0; i < 120; i++) {
          var x0 = rnd(i) * W, y0 = rnd(i + 99) * H * 0.75, k = clamp(lp * 1.6 - rnd(i + 7) * 0.6, 0, 1);
          var x1 = x0 + (nx - x0) * k, y1 = y0 + (ny - y0) * k;
          ctx.fillStyle = 'rgba(70,60,45,' + (0.75 * (1 - k)) + ')'; ctx.beginPath(); ctx.arc(x1, y1, (2 + rnd(i + 3) * 3) * u * (1 - k * 0.7), 0, 6.283); ctx.fill();
        }
        ctx.fillStyle = '#FF5A00'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(nx - 60 * u, ny - 14 * u, 120 * u, 28 * u, 14 * u) : ctx.rect(nx - 60 * u, ny - 14 * u, 120 * u, 28 * u); ctx.fill();
      } else if (st === 2) {
        cover(IM.before, 0, 0, W, H, 1.04);
        ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0);
        var lvl = H * lp * 1.1;
        for (var xx = 0; xx <= W; xx += 10 * u) ctx.lineTo(xx, lvl + Math.sin(xx / (60 * u) + lp * 8) * 14 * u);
        ctx.lineTo(W, 0); ctx.closePath(); ctx.clip(); cover(IM.after, 0, 0, W, H, 1.04);
        ctx.fillStyle = 'rgba(80,160,255,.08)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      } else if (st === 3) {
        cover(IM.after, 0, 0, W, H, 1.04);
        for (var j = 0; j < 14; j++) {
          var sx = rnd(j + 5) * W, sy = H - ((lp * 1.4 + rnd(j)) % 1) * H * 1.1, sr = (60 + rnd(j + 2) * 90) * u;
          var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr); sg.addColorStop(0, 'rgba(255,255,255,.42)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
        }
      } else if (st === 4) {
        cover(IM.under, 0, 0, W, H, 1.12 - 0.08 * lp);
        ctx.strokeStyle = '#FF5A00'; ctx.lineWidth = 3 * u; ctx.setLineDash([10 * u, 8 * u]);
        ctx.strokeRect(W * .12, H * .3, W * .76 * Math.min(1, lp * 1.5), H * .5); ctx.setLineDash([]);
      } else {
        cover(IM.after, 0, 0, W, H, 1.04);
        for (var q = 0; q < 70; q++) { var a = rnd(q) * W, b = (rnd(q + 40) * H + lp * 140 * u * (rnd(q + 9) + .3)) % H; ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.5 * rnd(q + 1)) + ')'; ctx.beginPath(); ctx.arc(a, H - b, (1.2 + rnd(q + 2) * 2.2) * u, 0, 6.283); ctx.fill(); }
        var sp = clamp((lp - 0.35) / 0.4, 0, 1);
        if (sp > 0) { ctx.save(); ctx.globalAlpha = sp; ctx.translate(W - 120 * u, 110 * u); ctx.rotate(-0.18); ctx.strokeStyle = '#FF5A00'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.arc(0, 0, 70 * u, 0, 6.283); ctx.stroke(); ctx.fillStyle = '#FF5A00'; ctx.font = '900 ' + (30 * u) + 'px "Noto Sans KR"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('완료', 0, 2 * u); ctx.restore(); }
      }
      // HUD
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H - 54 * u, W, 54 * u);
      ctx.fillStyle = '#FF5A00'; ctx.fillRect(0, H - 4 * u, W * p, 4 * u);
      ctx.font = '700 ' + (20 * u) + 'px "Noto Sans KR"'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
      ctx.fillText((st + 1) + '단계  ' + NAMES[st], 22 * u, H - 28 * u);
      ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(Math.round(p * 100) + '%', W - 22 * u, H - 28 * u);
      steps.forEach(function (el, k) { el.classList.toggle('is-on', k <= st); el.classList.toggle('is-cur', k === st); });
      if (barEl) barEl.style.setProperty('--p', p.toFixed(3));
    }
    var tick = false;
    window.addEventListener('scroll', function () { if (!tick) { tick = true; raf(function () { tick = false; draw(); }); } }, { passive: true });
    window.addEventListener('resize', size);
    size();
  }

  /* =======================================================
     견적 계산기 (의료시설 참고 단가 · 부가세 별도)
     ======================================================= */
  var PRICE = {
    plan: {
      basic: ['기본형', 2000, '바닥 쓸기 · 닦기, 분리수거, 가구 · 집기 먼지 제거'],
      std: ['표준형', 3500, '기본형 + 소파 · 매트리스 건식청소, 얼룩 제거'],
      full: ['풀패키지', 5000, '표준형 + 탈취 시공, 월 1회 방역'],
      none: ['정기청소 안 함', 0, '바닥 · 패브릭 작업만 건별로 계산합니다']
    },
    floor: { none: ['', 0], tile: ['타일 청소', 8000], carpet: ['카펫 청소', 8000], coat: ['타일 청소 + 코팅', 10000] },
    mattress: 60000, sofa: 80000, disc: 0.2
  };
  window.INPE_PRICE = PRICE;
  var lastCalc = null;
  function initCalc() {
    var F = $('#calc'); if (!F) return;
    var out = { total: $('#calc-total'), year: $('#calc-year'), lines: $('#calc-lines'), hint: $('#calc-hint'), desc: $('#calc-plan-desc'), fbox: $('[data-floor-area]', F) };
    var LIM = { area: 20000, farea: 20000, mattress: 999, sofa: 200 };
    var nf = function (n) { return n.toLocaleString('ko-KR'); };
    function val(n) { var e = F.querySelector('[name="' + n + '"]:checked'); return e ? e.value : null; }
    function int(n) { var v = parseInt(String(F[n].value).replace(/[^\d]/g, ''), 10); return clamp(isNaN(v) ? 0 : v, 0, LIM[n]); }
    function calc(ev) {
      var area = int('area'), plan = val('plan') || 'std', fl = val('floor') || 'none', farea = int('farea'), mt = int('mattress'), sf = int('sofa');
      if (ev && ev.target === F.area) F.areaRange.value = clamp(area, 10, 1000);
      out.desc.textContent = PRICE.plan[plan][0] + ': ' + PRICE.plan[plan][2];
      out.fbox.hidden = fl === 'none';
      var monthly = area * PRICE.plan[plan][1];
      var floorAmt = fl === 'none' ? 0 : farea * PRICE.floor[fl][1];
      var fabric = mt * PRICE.mattress + sf * PRICE.sofa, disc = plan !== 'none' ? Math.round(fabric * PRICE.disc) : 0;
      var first = monthly + floorAmt + fabric - disc, year = monthly * 12 + floorAmt + fabric - disc;
      var lines = [];
      if (plan !== 'none') lines.push(['정기청소 ' + PRICE.plan[plan][0] + ' · ' + nf(area) + '평 (월)', monthly]);
      if (fl !== 'none') lines.push([PRICE.floor[fl][0] + ' · ' + nf(farea) + '평', floorAmt]);
      if (mt) lines.push(['입원실 매트리스 × ' + mt, mt * PRICE.mattress]);
      if (sf) lines.push(['대기실 소파 × ' + sf, sf * PRICE.sofa]);
      if (disc) lines.push(['정기계약 패브릭 할인 20%', -disc]);
      lines.push(['현장 실측 · 출장 (수도권)', 0]);
      out.total.textContent = nf(first);
      out.year.textContent = won(year);
      out.lines.innerHTML = lines.map(function (l) { return '<li><span>' + l[0] + '</span><b>' + (l[1] > 0 ? won(l[1]) : l[1] < 0 ? '−' + won(-l[1]) : '무료') + '</b></li>'; }).join('');
      out.hint.hidden = !(area >= 500 || mt >= 100);
      $$('[data-step]', F).forEach(function (b) { var n = b.dataset.for, v = int(n); b.disabled = +b.dataset.step < 0 ? v <= 0 : v >= LIM[n]; });
      var items = [];
      if (plan !== 'none') items.push('정기청소');
      if (fl !== 'none') items.push('바닥 청소·코팅');
      if (mt || sf) items.push('매트리스·소파 케어');
      if (plan === 'full') items.push('소독·방역');
      var txt = [];
      if (plan !== 'none') txt.push('정기청소 ' + PRICE.plan[plan][0] + ' ' + nf(area) + '평 월 ' + won(monthly));
      if (fl !== 'none') txt.push(PRICE.floor[fl][0] + ' ' + nf(farea) + '평 ' + won(floorAmt));
      if (mt || sf) txt.push('매트리스 ' + mt + ' · 소파 ' + sf + ' ' + won(fabric - disc) + (disc ? '(20% 할인)' : ''));
      lastCalc = { total: first, year: year, items: items, area: plan !== 'none' ? area : 0, mattress: mt, sofa: sf, floor: fl === 'carpet' ? ['카펫'] : fl === 'none' ? [] : ['타일'],
        text: '[견적 계산기] ' + txt.join(' / ') + ' / 연간 예상 ' + won(year) + ' (부가세 별도)' };
    }
    F.areaRange.addEventListener('input', function () { F.area.value = F.areaRange.value; calc(); });
    F.addEventListener('input', function (e) {
      var t = e.target; if (t === F.areaRange) return;
      if (t.tagName === 'INPUT' && t.classList.contains('num')) { var c = t.value.replace(/[^\d]/g, ''); if (c !== t.value) t.value = c; }
      calc(e);
    });
    F.addEventListener('change', calc);
    F.addEventListener('focusout', function (e) { var n = e.target.name; if (LIM[n] !== undefined) { e.target.value = int(n); calc(); } });
    F.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]'); if (!b) return;
      var n = b.dataset.for; F[n].value = clamp(int(n) + (+b.dataset.step), 0, LIM[n]); calc();
    });
    calc();
    var go = $('#calc-go');
    if (go) go.addEventListener('click', function () {
      if (!lastCalc || !lastCalc.total) { toast('정기청소 구성이나 작업 항목을 하나 이상 골라 주세요.', { type: 'err' }); return; }
      Track.ev('calc_to_form', { value: lastCalc.year });
      var d = document.getElementById('drawer-quote');
      Form.prefill(d, lastCalc);
      Overlay.open(d, go);
    });
  }

  /* =======================================================
     상담 신청 폼 (스텝·검증·사진 압축·전송·아웃박스)
     ======================================================= */
  var Form = {
    prefill: function (root, c) {
      var f = $('form.qform', root); if (!f || !c) return;
      $$('[name="items"]', f).forEach(function (i) { i.checked = c.items.indexOf(i.value) > -1; });
      $$('[name="floor"]', f).forEach(function (i) { if (c.floor.indexOf(i.value) > -1) i.checked = true; });
      if (f.sizePy && c.area) f.sizePy.value = c.area;
      if (f.beds && c.mattress) f.beds.value = c.mattress;
      if (f.sofas && c.sofa) f.sofas.value = c.sofa;
      if (f.detail) f.detail.value = c.text;
      f.dataset.estimate = c.year;
      toast('계산하신 조건이 신청서에 담겼습니다.', { type: 'ok', timeout: 3200 });
    }
  };

  function fmtPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 12);
    if (/^0507/.test(d) || /^050/.test(d)) return d.replace(/^(\d{4})(\d{0,4})(\d{0,4}).*/, function (m, a, b, c) { return [a, b, c].filter(Boolean).join('-'); });
    if (/^02/.test(d)) return d.replace(/^(02)(\d{0,4})(\d{0,4}).*/, function (m, a, b, c) { return [a, b, c].filter(Boolean).join('-'); });
    return d.replace(/^(\d{3})(\d{0,4})(\d{0,4}).*/, function (m, a, b, c) { return [a, b, c].filter(Boolean).join('-'); });
  }
  function validPhone(v) { var d = v.replace(/\D/g, ''); return /^01[016789]\d{7,8}$/.test(d) || /^0\d{8,11}$/.test(d); }
  function compress(file) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var max = 1280, s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        res({ name: file.name.replace(/\.[^.]+$/, '') + '.jpg', type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.72) });
      };
      im.onerror = function () { URL.revokeObjectURL(url); res(null); };
      im.src = url;
    });
  }
  function smsBody(p) {
    var size = [p.sizePy && p.sizePy + '평', p.beds && '병상 ' + p.beds, p.sofas && '소파 ' + p.sofas].filter(Boolean).join(', ');
    return '[인프 병원청소 실측 요청]\n기관: ' + (p.org || '') + (p.orgType ? ' (' + p.orgType + ')' : '') + '\n담당자: ' + (p.name || '') + ' ' + (p.phone || '') + (p.email ? '\n이메일: ' + p.email : '') +
      '\n서비스: ' + (p.items || []).join(', ') + (size ? '\n규모: ' + size : '') + '\n지역: ' + [p.region, p.area].filter(Boolean).join(' ') +
      ((p.slot || []).length ? '\n작업 가능: ' + p.slot.join(', ') : '') + (p.date ? '\n실측 희망일: ' + p.date : '') + (p.detail ? '\n내용: ' + p.detail : '');
  }
  function smsHref(body) { return 'sms:' + (C.SMS_TO || '') + (/iPhone|iPad|Mac/.test(navigator.userAgent) ? '&' : '?') + 'body=' + encodeURIComponent(body); }
  function send(payload) {
    if (!C.LEAD_ENDPOINT) return Promise.reject(new Error('NO_ENDPOINT'));
    var ctrl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    return fetch(C.LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'REJECTED'); return j; });
  }
  function flushOutbox() {
    var box = store.get('inpeh_outbox', []); if (!box.length || !C.LEAD_ENDPOINT) return;
    var rest = [];
    box.reduce(function (pr, item) {
      return pr.then(function () { item.retry = true; return send(item).then(function (j) { toast('이전에 전송되지 않았던 신청서가 접수되었습니다. (접수번호 ' + j.id + ')', { type: 'ok', timeout: 7000 }); Track.ev('generate_lead', { form: item.form, value: item.estimate || 0, retry: 1 }); }).catch(function () { rest.push(item); }); });
    }, Promise.resolve()).then(function () { store.set('inpeh_outbox', rest); });
  }
  function initForms() {
    $$('form.qform:not(.pform)').forEach(function (f) {
      var steps = $$('.qstep', f), marks = $$('.qform__steps li', f), cur = 0, started = 0, photos = [];
      var btnPrev = $('[data-prev]', f), btnNext = $('[data-next]', f), btnSend = $('[data-send]', f);
      var fid = f.dataset.form || 'quote';
      if (f.date) { var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); f.date.min = t.toISOString().slice(0, 10); }
      f.addEventListener('focusin', function () { if (!started) { started = Date.now(); Track.ev('form_start', { form: fid }); } });
      if (f.phone) f.phone.addEventListener('input', function () { var p = f.phone.selectionStart, l = f.phone.value.length; f.phone.value = fmtPhone(f.phone.value); try { f.phone.setSelectionRange(p + (f.phone.value.length - l), p + (f.phone.value.length - l)); } catch (e) { } });
      function err(name, on, msg) {
        var el = f.querySelector('[name="' + name + '"]'); if (!el) return;
        var fld = el.closest('.field'); if (!fld) return;
        fld.classList.toggle('is-err', !!on); var m = $('.field__err', fld); if (m && msg) m.textContent = msg;
      }
      function check(i) {
        var ok = true;
        if (steps[i].dataset.need === 'items') {
          var n = $$('[name="items"]:checked', f).length;
          err('items', !n, '필요한 서비스를 하나 이상 선택해 주세요.'); if (!n) ok = false;
        }
        if (steps[i].dataset.need === 'region') { var rg = !!f.region.value; err('region', !rg, '지역을 선택해 주세요.'); if (!rg) ok = false; }
        if (steps[i].dataset.need === 'contact') {
          var og = !!f.org && f.org.value.trim().length >= 2; err('org', !og, '기관명을 입력해 주세요.'); if (!og) ok = false;
          var nm = f.name.value.trim().length >= 2; err('name', !nm, '성함을 2자 이상 입력해 주세요.'); if (!nm) ok = false;
          var ph = validPhone(f.phone.value); err('phone', !ph, '연락 가능한 번호를 정확히 입력해 주세요.'); if (!ph) ok = false;
          var ev = f.email ? f.email.value.trim() : '', em = !ev || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ev); err('email', !em, '이메일 주소 형식을 확인해 주세요.'); if (!em) ok = false;
          var ag = f.agree.checked; err('agree', !ag, '개인정보 수집·이용에 동의해 주세요.'); if (!ag) ok = false;
        }
        if (!ok) { var first = $('.is-err input, .is-err select', steps[i]); if (first) first.focus(); }
        return ok;
      }
      function go(i) {
        cur = clamp(i, 0, steps.length - 1);
        steps.forEach(function (s, k) { s.hidden = k !== cur; });
        marks.forEach(function (m, k) { m.classList.toggle('is-done', k < cur); m.classList.toggle('is-cur', k === cur); });
        btnPrev.hidden = cur === 0; btnNext.hidden = cur === steps.length - 1; btnSend.hidden = cur !== steps.length - 1;
        if (cur === steps.length - 1) summary();
        var h = $('h3', steps[cur]); if (h && started) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
        Track.ev('form_step', { form: fid, step: cur + 1 });
      }
      function data() {
        var g = function (n) { return $$('[name="' + n + '"]:checked', f).map(function (e) { return e.value; }); };
        var v = function (n) { return f[n] && f[n].value !== undefined ? String(f[n].value).trim() : ''; };
        return {
          form: fid, org: v('org'), orgType: (f.querySelector('[name="orgType"]:checked') || {}).value || '', name: v('name'), phone: v('phone'), email: v('email'),
          items: g('items'), sizePy: v('sizePy'), beds: v('beds'), sofas: v('sofas'), floor: g('floor'), detail: v('detail'),
          region: f.region.value, area: v('area'), slot: g('slot'), date: v('date'),
          estimate: +(f.dataset.estimate || 0), agree: f.agree.checked, hp: f.website ? f.website.value : '', dwell: started ? Date.now() - started : 0,
          attr: Attr.get(), page: location.href, ua: navigator.userAgent, ts: new Date().toISOString()
        };
      }
      function summary() {
        var d = data(), box = $('.qform__summary', f); if (!box) return;
        var row = function (k, x) { return x ? '<div><span>' + k + '</span><b>' + x + '</b></div>' : ''; };
        var size = [d.sizePy && d.sizePy + '평', d.beds && '병상 ' + d.beds, d.sofas && '소파 ' + d.sofas].filter(Boolean).join(' · ');
        box.innerHTML = row('기관 유형', d.orgType) + row('서비스', d.items.join(', ')) + row('규모', size) + row('바닥', d.floor.join(', ')) + row('지역', [d.region, d.area].filter(Boolean).join(' ')) +
          row('작업 시간대', d.slot.join(', ')) + row('실측 희망일', d.date) + row('사진', photos.length ? photos.length + '장' : '') + (d.estimate ? row('연간 예상', won(d.estimate) + '~') : '');
      }
      btnNext.addEventListener('click', function () { if (check(cur)) go(cur + 1); });
      btnPrev.addEventListener('click', function () { go(cur - 1); });
      ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, function (e) { var fl = e.target.closest('.field.is-err'); if (fl && (ev === 'input' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) fl.classList.remove('is-err'); }); });
      // photos
      var up = $('.upl', f);
      if (up) {
        var inp = $('input[type=file]', up), list = $('.upl__list', up), drop = $('.upl__drop', up);
        var render = function () { list.innerHTML = photos.map(function (p, i) { return '<div class="upl__item"><img src="' + p.data + '" alt="첨부 사진 ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="사진 삭제">×</button></div>'; }).join(''); };
        var add = function (files) {
          var arr = Array.prototype.slice.call(files).filter(function (x) { return /^image\//.test(x.type); });
          if (photos.length + arr.length > 3) { toast('사진은 최대 3장까지 첨부할 수 있습니다.', { type: 'err' }); arr = arr.slice(0, 3 - photos.length); }
          Promise.all(arr.map(compress)).then(function (r) { r.filter(Boolean).forEach(function (p) { photos.push(p); }); render(); if (r.length) toast('사진 ' + r.length + '장을 첨부했습니다. 오염 상태를 보고 더 정확히 안내드립니다.', { type: 'ok', timeout: 3000 }); });
        };
        inp.addEventListener('change', function () { add(inp.files); inp.value = ''; });
        list.addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (b) { photos.splice(+b.dataset.rm, 1); render(); } });
        ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
        ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
        drop.addEventListener('drop', function (e) { add(e.dataTransfer.files); });
      }
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!check(cur)) return;
        var d = data(); d.photos = photos.slice();
        if (d.hp) return; // 스팸봇
        var recent = store.get('inpeh_last', null);
        if (recent && recent.phone === d.phone && Date.now() - recent.at < 120000) { toast('같은 번호로 방금 접수된 신청이 있습니다. 담당자가 곧 연락드립니다.', { type: 'info' }); return; }
        btnSend.disabled = true; var label = btnSend.innerHTML; btnSend.innerHTML = '<i class="spinner"></i> 접수 중…';
        send(d).then(function (j) {
          store.set('inpeh_last', { phone: d.phone, at: Date.now() });
          Track.ev('generate_lead', { form: fid, value: d.estimate || 0, currency: 'KRW', items: d.items.join('|') });
          var host = f.closest('.drawer'); if (host) Overlay.close(host);
          var m = document.getElementById('modal-done');
          if (m) { $('[data-done-id]', m).textContent = j.id || '-'; $('[data-done-name]', m).textContent = d.name; Overlay.open(m); }
          toast('담당자가 확인 후 영업시간 내 연락드립니다.', { title: '신청이 접수되었습니다', type: 'ok', timeout: 7000 });
          f.reset(); photos = []; var l = $('.upl__list', f); if (l) l.innerHTML = ''; delete f.dataset.estimate; go(0);
        }).catch(function (er) {
          var body = smsBody(d), noEp = er && er.message === 'NO_ENDPOINT';
          if (!noEp) { var box = store.get('inpeh_outbox', []); var copy = Object.assign({}, d); delete copy.photos; box.push(copy); store.set('inpeh_outbox', box.slice(-5)); }
          Track.ev('lead_error', { form: fid, reason: er && er.message });
          toast(noEp ? '온라인 접수 서버가 연결되지 않았습니다. 작성하신 내용을 문자로 바로 보내실 수 있어요.' : '네트워크 문제로 접수가 확인되지 않았습니다. 내용은 이 기기에 보관했고 다음 방문 때 자동 재전송합니다. 지금 바로 문자나 전화로도 연결됩니다.', {
            title: '접수를 완료하지 못했습니다', type: 'err', timeout: 0,
            actions: [{ label: '문자로 보내기', href: smsHref(body) }, { label: '전화하기', href: 'tel:' + (C.SMS_TO || '') }, { label: '내용 복사', keep: true, onClick: function () { copyText(body, '신청 내용을 복사했습니다.'); } }]
          });
        }).then(function () { btnSend.disabled = false; btnSend.innerHTML = label; });
      });
      go(0);
    });
  }

  function initPartner() {
    $$('form.pform').forEach(function (f) {
      var btn = $('[type=submit]', f), t0 = 0;
      f.addEventListener('focusin', function () { if (!t0) t0 = Date.now(); });
      if (f.phone) f.phone.addEventListener('input', function () { f.phone.value = fmtPhone(f.phone.value); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = [];
        var mark = function (n, on) { var el = f.querySelector('[name="' + n + '"]'); var fl = el && el.closest('.field'); if (fl) fl.classList.toggle('is-err', on); if (on) bad.push(el); };
        mark('company', f.company.value.trim().length < 1); mark('name', f.name.value.trim().length < 2); mark('phone', !validPhone(f.phone.value)); mark('agree', !f.agree.checked);
        if (bad.length) { bad[0].focus(); return; }
        if (f.website.value) return;
        var d = { form: 'partner', company: f.company.value.trim(), name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), items: [f.ptype.value], memo: f.message.value.trim(), agree: true, dwell: t0 ? Date.now() - t0 : 0, attr: Attr.get(), page: location.href, ua: navigator.userAgent, ts: new Date().toISOString() };
        btn.disabled = true; var label = btn.innerHTML; btn.innerHTML = '<i class="spinner"></i> 보내는 중…';
        send(d).then(function (j) {
          Track.ev('generate_lead', { form: 'partner', value: 0 });
          toast('담당자가 확인 후 연락드립니다. (접수번호 ' + j.id + ')', { title: '제휴 문의가 접수되었습니다', type: 'ok', timeout: 7000 }); f.reset();
        }).catch(function () {
          toast('접수를 확인하지 못했습니다. 아래 버튼으로 바로 연락 주세요.', { title: '전송 실패', type: 'err', timeout: 0, actions: [{ label: '메일 보내기', href: 'mailto:' + C.EMAIL + '?subject=' + encodeURIComponent('[제휴문의] ' + d.company) + '&body=' + encodeURIComponent([d.items[0], d.name + ' / ' + d.phone, d.memo].join('\n')) }, { label: '전화하기', href: 'tel:' + C.SMS_TO }] });
        }).then(function () { btn.disabled = false; btn.innerHTML = label; });
      });
      ['input', 'change'].forEach(function (ev) { f.addEventListener(ev, function (e) { var fl = e.target.closest('.field.is-err'); if (fl && (ev === 'input' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT')) fl.classList.remove('is-err'); }); });
    });
  }

  /* =======================================================
     실시간 접수 현황 (시트의 실제 접수만·마스킹)
     ======================================================= */
  var DEMO_ROWS = [
    { t: '방금', name: '○○○', area: '인천 남동', svc: '정기청소 · 병원(입원 병동)', st: '접수' },
    { t: '1시간 전', name: '○○○', area: '서울 송파', svc: '매트리스·소파 케어 · 산후조리원', st: '상담 중' },
    { t: '3시간 전', name: '○○○', area: '경기 부천', svc: '바닥 청소·코팅 · 의원·클리닉', st: '완료' }
  ];
  function stClass(s) { return /완료/.test(s) ? 'st--done' : /진행|출동|방문/.test(s) ? 'st--ing' : ''; }
  function initBoard() {
    var box = $('#board'); if (!box) return;
    var sec = box.closest('section'), body = $('.board__body', box), seen = {}, first = true;
    body.innerHTML = Array.apply(null, Array(5)).map(function () { return '<div class="board__row"><span class="sk" style="width:60%"></span><span class="sk" style="width:70%"></span><span class="sk" style="width:85%"></span><span class="sk sk--pill"></span></div>'; }).join('');
    function paint(rows) {
      if (!rows.length) { body.innerHTML = '<div class="board__empty">오늘 접수 내역이 아직 없습니다. 첫 상담을 신청해 보세요.</div>'; return; }
      body.innerHTML = rows.slice(0, 6).map(function (r) {
        var isNew = !first && !seen[r.id || r.t + r.name]; seen[r.id || r.t + r.name] = 1;
        return '<div class="board__row' + (isNew ? ' board__new' : '') + '"><span class="muted num">' + r.t + '</span><span>' + r.name + ' · ' + r.area + '</span><span>' + r.svc + '</span><span class="st ' + stClass(r.st) + '">' + r.st + '</span></div>';
      }).join('');
      if (!first && C.LIVE_TOAST) { var fresh = rows.filter(function (r) { return r._fresh; })[0]; if (fresh) toast(fresh.area + ' · ' + fresh.svc, { title: '방금 상담 신청이 접수되었습니다', type: 'info', timeout: 4500 }); }
      first = false;
    }
    function load() {
      if (!C.LEAD_ENDPOINT || !C.LIVE_FEED) {
        if (DEMO) { setTimeout(function () { paint(DEMO_ROWS); $('.board__demo', box) && ($('.board__demo', box).hidden = false); }, 900); }
        else if (sec) sec.hidden = true;
        return;
      }
      fetch(C.LEAD_ENDPOINT + '?feed=1', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
        var rows = (j && j.rows) || [];
        rows.forEach(function (r) { if (!first && !seen[r.id]) r._fresh = true; });
        paint(rows);
      }).catch(function () { if (first && sec) sec.hidden = true; });
    }
    load();
    if (C.LEAD_ENDPOINT && C.LIVE_FEED) setInterval(function () { if (!document.hidden) load(); }, 60000);
  }

  /* =======================================================
     리뷰 필터·더보기
     ======================================================= */
  function initReviews() {
    var w = $('#review-list'); if (!w) return;
    var cards = $$('.review', w), chips = $$('.chip', w.parentElement), more = $('#reviews-more'), limit = 6, cat = 'all';
    function paint() {
      var shown = 0;
      cards.forEach(function (c) { var ok = cat === 'all' || c.dataset.cat === cat; var vis = ok && shown < limit; c.hidden = !vis; if (ok) shown++; });
      var total = cards.filter(function (c) { return cat === 'all' || c.dataset.cat === cat; }).length;
      if (more) more.hidden = total <= limit;
    }
    chips.forEach(function (ch) { ch.addEventListener('click', function () { chips.forEach(function (c) { c.setAttribute('aria-pressed', c === ch ? 'true' : 'false'); }); cat = ch.dataset.cat; limit = 6; paint(); }); });
    if (more) more.addEventListener('click', function () { limit += 6; paint(); });
    paint();
  }

  /* =======================================================
     기타: 복사·전화/문자 추적·TOC
     ======================================================= */
  function copyText(t, msg) {
    var ok = function () { toast(msg || '복사했습니다.', { type: 'ok', timeout: 2400 }); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, function () { fallback(); });
    else fallback();
    function fallback() { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast(t, { title: '아래 내용을 직접 복사해 주세요' }); } a.remove(); }
  }
  function initMisc() {
    document.addEventListener('click', function (e) {
      var c = e.target.closest('[data-copy]'); if (c) { e.preventDefault(); copyText(c.dataset.copy, c.dataset.copyMsg); return; }
      if (e.target.closest('[data-print-check]')) { document.body.classList.add('print-check'); window.print(); setTimeout(function () { document.body.classList.remove('print-check'); }, 600); return; }
      var a = e.target.closest('a[href^="tel:"], a[href^="sms:"]');
      if (a) {
        var isTel = a.getAttribute('href').indexOf('tel:') === 0;
        Track.ev(isTel ? 'click_call' : 'click_sms', { where: a.dataset.where || '' });
        if (isTel && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
          e.preventDefault();
          toast('PC에서는 전화 연결이 되지 않아 번호를 복사해 드렸어요.', { title: C.PHONE, type: 'info', actions: [{ label: '온라인 견적 신청', onClick: function () { Overlay.open(document.getElementById('drawer-quote')); } }] });
          copyText(C.PHONE, '전화번호 ' + C.PHONE + ' 를 복사했습니다.');
        }
      }
    });
    var toc = $$('.toc a'); if (toc.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) toc.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id); }); }); }, { rootMargin: '-30% 0px -60% 0px' });
      toc.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t) io.observe(t); });
    }
    $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  }

  /* boot */
  Attr.init(); Track.init();
  initChrome(); initReel(); initReveal(); initCounters(); initTabs(); initAccordion(); initBA(); initCards(); initLightbox(); initImgSkeleton();
  initSeq(); initCalc(); initForms(); initPartner(); initBoard(); initReviews(); initMisc();
  setTimeout(flushOutbox, 2500);
})();
