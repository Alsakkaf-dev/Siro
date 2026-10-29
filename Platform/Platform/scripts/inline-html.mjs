// بعد بناء Vite: يُدرج في index.html سكربتًا صغيرًا مضمَّنًا (بدون طلب شبكة يحجب العرض) يقوم بـ:
//  1) ضبط المظهر (فاتح/داكن) قبل أول رسم؛
//  2) بدء جلب بيانات الـ API وتنزيل حزمة الصفحة الحالية بالتوازي مع الحزمة الرئيسية.
// الخادم يحسب بصمة sha256 للسكربت المضمَّن عند التشغيل ويضيفها إلى CSP.
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'web');
const htmlFile = join(web, 'index.html');
let html = readFileSync(htmlFile, 'utf8');
const tag = '<script src="/theme-init.js"></script>';
if (!html.includes(tag)) {
  console.log('inline-html: theme-init tag not found (already inlined?)');
  process.exit(0);
}
const theme = readFileSync(join(web, 'theme-init.js'), 'utf8').trim();
const assets = readdirSync(join(web, 'assets')).filter((f) => f.endsWith('.js'));
const file = (name) => assets.find((f) => new RegExp('^' + name + '-[A-Za-z0-9_-]+\\.js$').test(f));
// المسار (بعد /academic/s/:id) -> الحزم
const routes = {
  today: ['Today'],
  semesters: ['Semesters'],
  courses: ['Courses', 'catalog'],
  course: ['CoursePage', 'catalog'],
  timeline: ['Timeline'],
  calculator: ['Calculator'],
  weights: ['Weights'],
  unknowns: ['Unknowns'],
  print: ['PrintSummary'],
  settings: ['Settings'],
  life: ['Life', 'lifeKit', 'life'],
  lifeFinance: ['LifeFinance', 'lifeKit', 'life'],
  lifePrayers: ['LifePrayers', 'lifeKit', 'life'],
  lifeHabits: ['LifeHabits', 'lifeKit', 'life'],
  lifeRoutine: ['LifeRoutine', 'lifeKit', 'life'],
  lifeBody: ['LifeBody', 'lifeKit', 'life'],
  lifeCommands: ['LifeCommands', 'lifeKit', 'life'],
  lifeAlternatives: ['LifeAlternatives', 'sportsKit', 'life'],
  sports: ['Sports', 'sportsKit', 'life'],
  sportsTemplates: ['SportsTemplates', 'sportsKit', 'life'],
  sportsMine: ['SportsMine', 'sportsKit', 'life'],
  search: ['SearchPage'],
  glossary: ['Glossary', 'life'],
  kitchen: ['Kitchen', 'kitchenKit'],
  kitchenStore: ['KitchenStore', 'kitchenKit'],
  kitchenCart: ['KitchenCart', 'kitchenKit'],
  kitchenPantry: ['KitchenPantry', 'kitchenKit'],
  kitchenWallet: ['KitchenWallet', 'kitchenKit'],
  kitchenPrices: ['KitchenPrices', 'kitchenKit'],
  kitchenCodex: ['KitchenCodex', 'kitchenKit'],
  lifeLedger: ['LifeLedger', 'sportsKit', 'lifeKit', 'v8Kit', 'life'],
  lifeRoutineMap: ['LifeRoutineMap', 'sportsKit', 'lifeKit', 'v8Kit', 'kit', 'life'],
  lifeInsights: ['LifeInsights', 'sportsKit', 'lifeKit', 'v8Kit', 'kit', 'life'],
  lifeQadaPlan: ['LifeQadaPlan', 'sportsKit', 'lifeKit', 'v8Kit', 'kit', 'life'],
  review: ['Review', 'lifeKit', 'life'],
};
// الدخول: نزيل وسم السكربت الرئيسي وmodulepreload من الـ HTML ونحقنهما بعد أول رسم (rAF) حتى لا يحجبا FCP.
const mainRe = /\s*<script type="module" crossorigin src="(\/assets\/index-[^"]+\.js)"><\/script>/;
const mainM = mainRe.exec(html);
if (!mainM) throw new Error('inline-html: entry script tag not found');
const entrySrc = mainM[1];
html = html.replace(mainRe, '');
const entryPre = [];
html = html.replace(/\s*<link rel="modulepreload" crossorigin href="([^"]+)">/g, (_m, h) => {
  entryPre.push(h);
  return '';
});
const cssAssets = readdirSync(join(web, 'assets')).filter((f) => f.endsWith('.css'));
const lifeCss = cssAssets.find((f) => /^lifeKit-[A-Za-z0-9_-]+\.css$/.test(f));
const lifeCss2 = cssAssets.find((f) => /^life-[A-Za-z0-9_-]+\.css$/.test(f));
const map = {};
// مقطع معلن غائب = فشل بناء (كان يُسقط بصمت فيضيع الجلب المسبق دون أن ينتبه أحد)
const missing = [];
for (const [k, names] of Object.entries(routes)) {
  map[k] = names.map((n) => {
    const f = file(n);
    if (!f) missing.push(`${k}:${n}`);
    return f;
  }).filter(Boolean).map((f) => '/assets/' + f);
}
if (missing.length) throw new Error('inline-html: مقاطع معلنة غير موجودة في dist/web/assets: ' + missing.join(', '));
const boot = `;(function(){try{
var p=location.pathname,m=p.match(/^\\/academic\\/s\\/([^\\/]+)(?:\\/([^\\/]+))?(?:\\/([^\\/]+))?\$/),pre=window.__pre={};
var G=[],H=[];function g(u){G.push(u)}
g('/api/semesters');if(m)g('/api/semesters/'+m[1]);
var R=${JSON.stringify(map)},C=${JSON.stringify(lifeCss ? '/assets/' + lifeCss : '')},C2=${JSON.stringify(lifeCss2 ? '/assets/' + lifeCss2 : '')},k=null;
if(m){k=!m[2]?null:m[2]==='courses'?(m[3]?'course':'courses'):R[m[2]]?m[2]:null}
else if(p==='/'){k='today';g('/api/life/bundle?files=routine');g('/api/sports/mine');g('/api/library/recent?limit=5')}else if(p==='/glossary')k='glossary';else if(p.indexOf('/kitchen')===0){var KQ={'/kitchen':'kitchen','/kitchen/store':'kitchenStore','/kitchen/cart':'kitchenCart','/kitchen/pantry':'kitchenPantry','/kitchen/wallet':'kitchenWallet','/kitchen/prices':'kitchenPrices','/kitchen/codex':'kitchenCodex'};k=KQ[p.replace(/\\/\$/,'')]||(p.indexOf('/kitchen/store/')===0?'kitchenStore':p.indexOf('/kitchen/codex/')===0?'kitchenCodex':null);if(k&&k!=='kitchen')g('/api/kitchen/state')}else if(p==='/academic')k='semesters';else if(p==='/settings')k='settings';else if(p.indexOf('/life')===0){var L={'/life':['Life','dashboard_summary,finance,prayers,habits,body,routine'],'/life/finance':['LifeFinance','finance'],'/life/prayers':['LifePrayers','prayers'],'/life/habits':['LifeHabits','habits'],'/life/routine':['LifeRoutine','routine'],'/life/body':['LifeBody','body'],'/life/commands':['LifeCommands','finance'],'/life/alternatives':['LifeAlternatives',''],'/life/ledger':['LifeLedger',''],'/life/routine-map':['LifeRoutineMap',''],'/life/insights':['LifeInsights',''],'/life/qada-plan':['LifeQadaPlan','']}[p.replace(/\\/\$/,'')];var Cn={'/life/ledger':'ledger_full.json','/life/routine-map':'ROUTINE_BLOCKS_AR.json','/life/insights':'FINANCE_INSIGHTS_AR.json','/life/qada-plan':'PRAYER_QADA_PLAN_AR.json'}[p.replace(/\\/\$/,'')];if(Cn)g('/api/life/content/'+Cn);if(p==='/life/finance'){g('/api/life/content/ledger_full.json');g('/api/life/content/FINANCE_INSIGHTS_AR.json')}if(L){k='life'+L[0].slice(4);if(k==='life')k='life';if(L[1])g('/api/life/bundle?files='+encodeURIComponent(L[1]))}}else if(p.indexOf('/sports')===0){var q=p.replace(/\\/\$/,'');k={'/sports':'sports','/sports/templates':'sportsTemplates','/sports/mine':'sportsMine'}[q]||null;var X='/api/life/content/SPORTS_EXERCISES.json',P='/api/life/content/SPORTS_PLANS_AR.json';if(q==='/sports'||q==='/sports/templates'){g(X);g(P)}if(q==='/sports/mine'){g(X);g('/api/sports/mine')}}else if(p==='/search')k='search';else if(p==='/review'){k='review';g('/api/life/bundle?files='+encodeURIComponent('prayers,habits,body,finance,routine,dashboard_summary'));g('/api/life/content/SPORTS_PLANS_AR.json');g('/api/sports/mine')}
if(k&&k.indexOf('life')===0&&C)H.push(['preload',C,'style']);if(k&&(k.indexOf('life')===0||k.indexOf('sports')===0||k==='review')&&C2)H.push(['preload',C2,'style']);
if(k&&R[k])R[k].forEach(function(h){H.push(['modulepreload',h])});
var done=0;function go(){if(done)return;done=1;try{
G.forEach(function(u){pre[u]=fetch(u).then(function(r){return r.text().then(function(t){return{ok:r.ok,status:r.status,text:t}})});pre[u].catch(function(){})});
${JSON.stringify(entryPre)}.forEach(function(h){H.push(['modulepreload',h])});
H.forEach(function(a){var l=document.createElement('link');l.rel=a[0];l.href=a[1];if(a[2])l.as=a[2];if(a[0]==='preload'||a[1].indexOf('/assets/')===0)l.crossOrigin='';document.head.appendChild(l)});
var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src=${JSON.stringify(entrySrc)};document.head.appendChild(s)}catch(e){}}
requestAnimationFrame(function(){setTimeout(go,0)});setTimeout(go,500);
}catch(e){}})();`.replace(/\n/g, '');
const js = theme + boot;
html = html.replace(tag, () => `<script>${js}</script>`);
writeFileSync(htmlFile, html);
rmSync(join(web, 'theme-init.js'));
console.log('inline-html: boot script inlined (' + js.length + ' bytes), routes:', JSON.stringify(map).length, 'bytes');
