// Apps Script Code.gs 로컬 검증 (구글 서비스 목업)  node _dev/gas-test.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const rows = []; const mails = []; const files = []; let cacheStore = {}; let validation = null;
const sheet = {
  appendRow: r => rows.push(r), getLastRow: () => rows.length, setFrozenRows() {}, setColumnWidth() {},
  getRange: (a, b, c, d) => typeof a === 'string' ? { setDataValidation: v => { validation = v; } } : ({
    setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; },
    getValues: () => rows.slice(a - 1, a - 1 + c).map(r => r.slice(0, d))
  })
};
const ctx = {
  console, JSON, Date, String, Number, Math,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => rows.length ? sheet : null, insertSheet: () => sheet, getUrl: () => 'https://docs.google.com/x' }), flush() {},
    newDataValidation: () => ({ requireValueInList(v) { this.v = v; return this; }, build() { return this.v; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: k => cacheStore[k] || null, put: (k, v) => { cacheStore[k] = v; } }) },
  Utilities: { formatDate: () => '261019', base64Decode: s => Buffer.from(s, 'base64'), newBlob: (b, t, n) => ({ b, t, n }) },
  DriveApp: { getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => ({ createFile: blob => { files.push(blob.n); return { setDescription() { return { getUrl: () => 'https://drive/' + blob.n }; } }; } }), getRootFolder() {} },
  MailApp: { sendEmail: o => mails.push(o), getRemainingDailyQuota: () => 100 },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
  UrlFetchApp: { fetch() {} },
  ContentService: { createTextOutput: s => ({ setMimeType() { return { getContent: () => s }; } }), MimeType: { JSON: 'json' } },
  Logger: { log: console.log }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../apps-script/Code.gs'), 'utf8'), ctx);
const H = vm.runInContext('HEAD', ctx), col = n => H.indexOf(n);
const post = d => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(d) } }).getContent());
const jpg = 'data:image/jpeg;base64,' + Buffer.from('fakejpeg').toString('base64');
const r1 = post({ form: 'dq', org: '테스트병원', orgType: '병원(입원 병동)', name: '김담당', phone: '010-1111-2222', email: 'kim@hospital.kr', items: ['정기청소', '매트리스·소파 케어'], sizePy: '150', beds: '40', sofas: '6', floor: ['타일', '에폭시'], slot: ['평일 진료 종료 후', '토요일 오후'], date: '2026-10-22', region: '인천', area: '남동구 구월동', estimate: 4808000, detail: '3층 매트리스 냄새', agree: true, photos: [{ name: 'a.jpg', type: 'image/jpeg', data: jpg }], attr: { utm_source: 'naver', n_query: '병원 청소업체' }, ua: 'iPhone' });
const r2 = post({ form: 'dq', org: '테스트병원', name: '김담당', phone: '010-1111-2222', items: ['정기청소'], agree: true });
const r3 = post({ form: 'dq', org: 'A', name: '이', phone: '123', agree: true });
const r4 = post({ form: 'dq', org: '박의원', name: '박테스트', phone: '010-3333-4444', agree: false });
const r5 = post({ name: '봇', phone: '010', hp: 'spam' });
const r6 = post({ form: 'qi', org: '이메일없는조리원', orgType: '산후조리원', name: '최담당', phone: '01055556666', email: 'not-an-email', items: ['바닥 청소·코팅'], agree: true });
const feed = JSON.parse(ctx.doGet({ parameter: { feed: '1' } }).getContent());
const R = rows[1];
let pass = 0, total = 0;
const check = (n, c, i) => { total++; if (c) pass++; console.log(c ? 'PASS' : 'FAIL', n, i ? '— ' + i : ''); };
check('정상 접수 + 접수번호 IH', r1.ok && /^IH261019-/.test(r1.id), JSON.stringify(r1));
check('헤더 + 데이터 행 저장, 열 수 일치', rows.length === 3 && rows[0][0] === '접수일시' && R.length === H.length && rows[2].length === H.length, 'rows=' + rows.length + ' cols ' + R.length + '/' + H.length);
check('기관명·유형·담당자·이메일 제자리', R[col('기관명')] === '테스트병원' && R[col('기관 유형')] === '병원(입원 병동)' && R[col('담당자')] === '김담당' && R[col('이메일')] === 'kim@hospital.kr');
check('규모·바닥·시간대·희망일 제자리', R[col('면적(평)')] === '150' && R[col('병상·매트리스')] === '40' && R[col('대기실 소파')] === '6' && R[col('바닥 소재')] === '타일, 에폭시' && R[col('작업 가능 시간')] === '평일 진료 종료 후, 토요일 오후' && R[col('실측 희망일')] === '2026-10-22');
check('서비스·연간 예상금액·상세', R[col('서비스')] === '정기청소, 매트리스·소파 케어' && R[col('연간 예상금액')] === 4808000 && R[col('상세')] === '3층 매트리스 냄새');
check('유입 키워드 저장', R[col('검색어(utm_term/n_query)')] === '병원 청소업체' && R[col('utm_source')] === 'naver' && R[col('기기')] === '모바일');
check('사진 드라이브 저장 + 링크', files.length === 1 && /drive/.test(R[col('사진')]), files.join(','));
check('연락처 앞자리 0 보존(텍스트 저장)', R[col('연락처')] === "'010-1111-2222");
check('알림 메일 (제목에 기관명·유형, 답장 주소)', mails.length === 2 && /테스트병원/.test(mails[0].subject) && /병원\(입원 병동\)/.test(mails[0].subject) && mails[0].replyTo === 'kim@hospital.kr', mails.map(m => m.subject).join(' | '));
check('이메일 형식 틀리면 답장 주소 안 넣음', !('replyTo' in mails[1]));
check('같은 번호 2분 내 중복 → 기존 번호 반환', r2.ok && r2.dup && r2.id === r1.id);
check('전화번호 오류 거부', !r3.ok, r3.error);
check('동의 없으면 거부', !r4.ok, r4.error);
check('스팸봇 조용히 무시(저장 안 함)', r5.ok && rows.length === 3);
check('피드: 기관명 마스킹', feed.ok && feed.rows.length === 2 && feed.rows[0].name === '이○○' && feed.rows[1].name === '테○○' && feed.rows[1].area === '인천 남동구', JSON.stringify(feed.rows));
check('상태 목록 (실측 예정·견적 발송·계약)', Array.isArray(validation) && validation.includes('실측 예정') && validation.includes('계약'), JSON.stringify(validation));
console.log('\nTOTAL', pass + '/' + total);
