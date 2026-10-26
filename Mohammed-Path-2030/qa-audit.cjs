const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=__dirname;process.env.TEMP=path.join(root,'maintenance_browser','TEMP');process.env.TMP=path.join(root,'maintenance_browser','TMP');
const {chromium}=require('C:/Users/GIGIABYTE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const C=require('./progress-core'),html=fs.readFileSync(path.join(root,'Mohammed-Path-2030.html'),'utf8'),P=JSON.parse(html.match(/const PATH = (.*?);\s*<\/script>/s)[1]);
const KEY='mohammed-path-2030',url='http://localhost:54321/Mohammed-Path-2030.html';
const mock=`window.YT={Player:class{constructor(id,o){this.o=o;this.position=o.playerVars.start||0;this.rate=1;this.state=2;this.videoId=o.videoId;const f=document.createElement('iframe');f.id=id;document.getElementById(id).replaceWith(f);this.frame=f;window.__player=this;setTimeout(()=>o.events.onReady({target:this}),0)}getIframe(){return this.frame}getCurrentTime(){return this.position}getPlaybackRate(){return this.rate}getPlayerState(){return this.state}playVideo(){this.state=1;this.o.events.onStateChange({data:1,target:this})}pauseVideo(){this.state=2;this.o.events.onStateChange({data:2,target:this})}destroy(){this.frame.remove()}error(code){this.state=-1;this.o.events.onError({data:code,target:this})}}};window.onYouTubeIframeAPIReady();`;
const results=[];let browser;
async function test(name,fn,seed,options={}){
 if(process.env.QA_FILTER && !name.includes(process.env.QA_FILTER))return;
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,...options});
 const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 if(seed)await context.addInitScript(({KEY,seed})=>{
  if(window===top&&location.protocol==='http:'&&!sessionStorage.getItem('qa-seeded')){
   if(localStorage.getItem(KEY)===null)localStorage.setItem(KEY,typeof seed==='string'?seed:JSON.stringify(seed));
   sessionStorage.setItem('qa-seeded','true');
  }
 },{KEY,seed});
 const page=await context.newPage();page.setDefaultTimeout(6000);
 await page.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'application/javascript',body:mock}));
 try{await page.goto(url);await fn(page,context);assert.deepEqual(errors,[]);results.push({name,status:'PASS'});}
 catch(e){results.push({name,status:'FAIL',error:e.message});}
 finally{await context.close();console.log(JSON.stringify(results.at(-1)));}
}
async function pure(name,fn){try{await fn();results.push({name,status:'PASS'});}catch(e){results.push({name,status:'FAIL',error:e.message});}console.log(JSON.stringify(results.at(-1)));}
const completed=()=>{const s=C.fresh();for(const stage of P.stages){for(const v of C.videos(stage))s.records[v.id]={...C.record(),ranges:[[0,C.duration(v)]],activeSeconds:C.duration(v)};s.practice[stage.stage]=true;}return s;};
const load=page=>page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);
const upload=async(page,payload,name='progress.json')=>{await page.click('#settings-btn');await page.setInputFiles('#import-file',{name,mimeType:'application/json',buffer:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload))});await page.waitForTimeout(150);};
(async()=>{
 await pure('No watch credit beyond source duration',()=>{const r=C.record(),s=(position,wall)=>({position,wall,rate:1,playing:true,visible:true});assert.equal(C.sample(r,s(100,0),s(101,1000),100),false);assert.equal(C.covered(r),0);});
 await pure('Tracking arithmetic, pause, seek, hidden, replay, rate and sleep',()=>{
  for(const rate of [.25,.5,1,1.5,2]){const r=C.record(),s=(position,wall,extra={})=>({position,wall,rate,playing:true,visible:true,...extra});C.sample(r,s(0,0),s(rate,1000),100);assert.equal(r.activeSeconds,1);assert.equal(C.covered(r),rate);C.sample(r,s(0,0),s(rate,1000),100);assert.equal(C.covered(r),rate);assert(!C.sample(r,s(0,0),s(90,1000),100));assert(!C.sample(r,s(0,0),s(rate,1000,{playing:false}),100));assert(!C.sample(r,s(0,0),s(rate,1000,{visible:false}),100));assert(!C.sample(r,s(0,0),s(10*rate,10000),100));}
 });
 await pure('Invalid rate and non-finite timing cannot poison records',()=>{for(const rate of [0,-1,NaN,Infinity]){const r=C.record(),s={position:0,wall:0,rate,playing:true,visible:true};assert.equal(C.sample(r,s,{...s,position:1,wall:1000},100),false);assert.equal(r.activeSeconds,0);}});
 await pure('Strict imports, legacy migration and all 18 stage gates',()=>{
  for(const input of [null,[],{}, {watched:[],practice:[]},{watched:['bad'],practice:{}},{...C.fresh(),focusTarget:0},{...C.fresh(),practice:{19:true}},{...C.fresh(),notes:{bad:'x'}}])assert.throws(()=>C.validate(input,P));
  const s=C.fresh();for(const stage of P.stages){assert(C.unlocked(s,P,stage.stage));for(const v of C.videos(stage)){assert(C.videoUnlocked(s,P,stage,v));s.records[v.id]={...C.record(),legacy:true};}if(stage.stage<18)assert(!C.unlocked(s,P,stage.stage+1));s.practice[stage.stage]=true;}
  assert.equal(C.xp(s,P).lessons,169);assert.equal(C.xp(s,P).stages,18);assert.equal(C.xp(s,P).points,12050);assert.equal(C.xp(s,P).seconds,0);C.validate(s,P);
 });
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 await test('Fresh locks, keyboard tabs, modal Escape, focus label reset',async p=>{
  assert.equal(await p.locator('.lesson-row:disabled').count(),3);await p.click('[data-view="path"]');assert.equal(await p.locator('.path-card button:disabled').count(),17);await p.click('[data-view="learn"]');
  await p.focus('#tab-about');await p.keyboard.press('ArrowLeft');assert.equal(await p.getAttribute('#tab-practice','aria-selected'),'true');await p.keyboard.press('End');assert.equal(await p.getAttribute('#tab-notes','aria-selected'),'true');
  await p.click('#settings-btn');await p.keyboard.press('Escape');assert.equal(await p.locator('#settings-dialog').evaluate(e=>e.open),false);
  await p.click('#focus-btn');await p.evaluate(()=>location.hash='path');await p.waitForTimeout(100);await p.click('[data-view="learn"]');assert.equal(await p.textContent('#focus-btn'),'وضع التركيز ⤢');
 });
 await test('Unexpected URL hash falls back to a usable screen',async p=>{await p.goto(url+'#constructor');assert(await p.locator('#learn-view').isVisible());});
 await test('Post-ready player failure exposes an operable Retry',async p=>{await p.click('#play-btn');await p.waitForFunction(()=>window.__player);await p.evaluate(()=>window.__player.error(101));assert(await p.locator('#player-message a').isVisible());assert(await p.getByRole('button',{name:'إعادة المحاولة',exact:true}).isVisible());await p.getByRole('button',{name:'إعادة المحاولة',exact:true}).click();await p.waitForTimeout(100);assert.equal(await p.locator('#player-poster').isVisible(),false);});
 const near=C.fresh(),first=C.videos(P.stages[0])[0],nearEnd=C.duration(first)*.95-4;
 near.records[first.id]={...C.record(),ranges:[[0,nearEnd]],position:nearEnd,activeSeconds:nearEnd};
 await test('Live tracking: threshold, XP once, pause, seek, hidden, reload and keyboard focus',async p=>{
  await p.clock.install();await p.reload();await p.click('#play-btn');await p.waitForFunction(()=>window.__player);await p.clock.runFor(1000);
  await p.focus('#mini-route button:first-child');
  for(let i=0;i<7;i++){await p.evaluate(()=>window.__player.position+=1);await p.clock.runFor(1000);}
  assert.equal(await p.textContent('#xp-total'),'50');assert.equal(await p.locator('.lesson-row:disabled').count(),2);assert.equal(await p.evaluate(()=>document.activeElement.matches('#mini-route button')),true);
  await p.evaluate(()=>window.__player.pauseVideo());const paused=(await load(p)).records[first.id].activeSeconds;await p.clock.runFor(2000);assert.equal((await load(p)).records[first.id].activeSeconds,paused);
  await p.evaluate(()=>window.__player.playVideo());await p.clock.runFor(1000);await p.evaluate(()=>window.__player.position+=500);await p.clock.runFor(1000);assert.equal((await load(p)).records[first.id].activeSeconds,paused);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await p.evaluate(()=>window.__player.state),2);await p.clock.runFor(3000);assert.equal((await load(p)).records[first.id].activeSeconds,paused);
  await p.reload();assert.equal(await p.textContent('#xp-total'),'50');assert.equal((await load(p)).records[first.id].activeSeconds,paused);
 },near);
 await test('Offline YouTube API fails clearly and recovers on retry',async p=>{
  await p.unroute('https://www.youtube.com/iframe_api');await p.route('https://www.youtube.com/iframe_api',r=>r.abort());await p.click('#play-btn');await p.waitForFunction(()=>!document.querySelector('#play-btn').disabled);assert(await p.locator('#player-message').isVisible());
  await p.unroute('https://www.youtube.com/iframe_api');await p.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'application/javascript',body:mock}));await p.click('#play-btn');await p.waitForFunction(()=>window.__player);assert(await p.locator('#player-poster').isHidden());
 });
 await test('Storage quota failure is visible and in-memory notes can still export',async p=>{
  await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError')};});await p.click('#tab-notes');await p.fill('#notes','unsaved but exportable');await p.waitForTimeout(500);assert((await p.textContent('#save-state')).includes('تعذّر'));
  const wait=p.waitForEvent('download');await p.click('#export-btn');const stream=await(await wait).createReadStream();let text='';for await(const chunk of stream)text+=chunk;assert(Object.values(JSON.parse(text).notes).includes('unsaved but exportable'));
 });
 await test('All 169 videos select correct IDs and all 18 stages render',async p=>{
  let n=0;for(const stage of P.stages){await p.click('[data-view="path"]');await p.click(`.stage-status[data-stage="${stage.stage}"]`);assert.equal(await p.textContent('#stage-title'),stage.title);assert.equal(await p.textContent('#practice-text'),stage.practice_task);for(const v of C.videos(stage)){await p.click(`.lesson-row[data-video="${v.id}"]`);assert.equal(await p.textContent('#lesson-title'),v.title);await p.click('#play-btn');await p.waitForFunction(id=>window.__player?.videoId===id,v.id);n++;}}
  assert.equal(n,169);assert(await p.locator('#player-frame').isHidden());assert(await p.locator('#panel-practice').isVisible());
 },completed());
 const final=completed();final.practice[18]=false;
 await test('Final project is not labelled complete before practice',async p=>{await p.click('[data-view="path"]');await p.click('.stage-status[data-stage="18"]');assert.notEqual(await p.textContent('#next-btn'),'اكتمل المسار ✓');await p.reload();assert.equal(await p.textContent('#stage-title'),P.stages[17].title);await p.check('#practice-check');assert.equal(await p.textContent('#next-btn'),'اكتمل المسار ✓');await p.reload();assert.equal(await p.textContent('#stage-title'),P.stages[17].title);C.validate(await load(p),P);},final);
 await test('Notes/timestamps/bookmarks survive rapid switching and reload',async p=>{await p.click('#tab-notes');await p.fill('#notes','نص <script>not code</script>');await p.click('#timestamp-btn');await p.click('#bookmark-btn');await p.click('.lesson-row:nth-of-type(2)');await p.click('.lesson-row[data-video="'+C.videos(P.stages[0])[0].id+'"]');await p.click('#tab-notes');assert((await p.inputValue('#notes')).includes('[00:00]'));await p.reload();await p.click('#tab-notes');assert((await p.inputValue('#notes')).includes('not code'));await p.click('[data-view="achievements"]');assert.equal(await p.locator('.bookmark-row').count(),1);await p.click('[data-bookmark-remove]');assert.equal(await p.locator('.bookmark-row').count(),0);},completed());
 await test('Valid export/import, malformed JSON, bad schema and oversize preserve progress',async p=>{
  await p.click('#tab-notes');await p.fill('#notes','export me');const wait=p.waitForEvent('download');await p.click('#export-btn');const d=await wait;const stream=await d.createReadStream();let txt='';for await(const part of stream)txt+=part;const exported=JSON.parse(txt);assert(Object.values(exported.notes).includes('export me'));
  await upload(p,C.fresh());assert.equal((await load(p)).bookmarks.length,0);await upload(p,exported);assert.deepEqual((await load(p)).records,exported.records);
  for(const bad of ['{bad',JSON.stringify({...C.fresh(),practice:{1:'true'}}),' '.repeat(8000001)]){const before=await load(p);await upload(p,bad);assert.deepEqual(await load(p),before);await p.click('#close-settings');}
 },completed());
 await test('Corrupt saved data is preserved and can be exported',async p=>{assert.equal(await p.evaluate(KEY=>localStorage.getItem(KEY),KEY),'{corrupt');const wait=p.waitForEvent('download');await p.click('#export-btn');const d=await wait,stream=await d.createReadStream();let text='';for await(const chunk of stream)text+=chunk;assert.equal(text.trim(),'{corrupt');},'{corrupt');
 await test('Cleared storage does not resurrect old progress on reload',async p=>{
  await p.evaluate(()=>localStorage.clear());await p.reload();assert.equal(await p.textContent('#xp-total'),'0');assert.deepEqual((await load(p)).records,{});
 },completed());
 await test('Two tabs synchronise notes, practice, favourites and player ownership',async(p,context)=>{
  const q=await context.newPage();await q.goto(url);await p.click('#tab-notes');await p.fill('#notes','tab one');await p.waitForTimeout(600);await q.click('#tab-notes');assert.equal(await q.inputValue('#notes'),'tab one');
  await p.click('#bookmark-btn');await q.waitForTimeout(150);assert.equal(await q.getAttribute('#bookmark-btn','aria-pressed'),'true');
  await p.click('#play-btn');await p.waitForFunction(()=>window.__player);await q.route('https://www.youtube.com/iframe_api',r=>r.fulfill({contentType:'application/javascript',body:mock}));await q.click('#play-btn');await q.waitForFunction(()=>window.__player);await p.waitForFunction(()=>window.__player.state===2);
  await q.click('#tab-practice');await q.check('#practice-check');await p.waitForTimeout(150);await p.click('#tab-practice');assert(await p.isChecked('#practice-check'));
 });
 for(const width of [320,390,768,1024,1440])await test(`Responsive ${width}px, light theme and navigation`,async p=>{for(const view of ['learn','path','achievements','library']){await p.click(`[data-view="${view}"]`);const overflow=await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&getComputedStyle(e).position!=='fixed'&&(r.left<-.5||r.right>innerWidth+.5)}).slice(0,15).map(e=>e.className));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+': '+JSON.stringify(overflow));assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');}},null,{viewport:{width,height:900},colorScheme:'dark',reducedMotion:'reduce'});
 await browser.close();const output=path.join(root,'qa-results.json');
 const previous=process.env.QA_FILTER&&fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):[];
 const combined=[...new Map([...previous,...results].map(r=>[r.name,r])).values()];
 fs.writeFileSync(output,JSON.stringify(combined,null,2));console.log('RESULT',combined.filter(r=>r.status==='PASS').length+'/'+combined.length);if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
