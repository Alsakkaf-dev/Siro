const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.env.TEMP=path.join(__dirname,'maintenance_browser','TEMP');process.env.TMP=path.join(__dirname,'maintenance_browser','TMP');
const {chromium}=require('C:/Users/GIGIABYTE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const C=require('./progress-core'),html=fs.readFileSync(path.join(__dirname,'Mohammed-Path-2030.html'),'utf8'),P=JSON.parse(html.match(/const PATH = (.*?);\s*<\/script>/s)[1]);
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];try{
 for(const stageNumber of [1,2,6]){
  const context=await browser.newContext({viewport:{width:1280,height:900}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const state=C.fresh();for(const stage of P.stages.filter(s=>s.stage<stageNumber)){for(const v of C.videos(stage))state.records[v.id]={...C.record(),legacy:true};state.practice[stage.stage]=true;}
  state.lastVideo=C.videos(P.stages[stageNumber-1])[0].id;
  await context.addInitScript(s=>{if(window===top&&location.protocol==='http:')localStorage.setItem('mohammed-path-2030',JSON.stringify(s));},state);
  try{await p.goto('http://localhost:54321/Mohammed-Path-2030.html');await p.click('#play-btn');await p.waitForFunction(()=>document.querySelector('#live-time').textContent!=='00:00',{},{timeout:25000});
   const time=await p.textContent('#live-time');assert.equal(errors.length,0);
   await p.click('[data-view="path"]');const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('mohammed-path-2030')).records);await p.waitForTimeout(2000);assert.deepEqual(await p.evaluate(()=>JSON.parse(localStorage.getItem('mohammed-path-2030')).records),saved);
   results.push({stage:stageNumber,status:'PASS',time,errors});
  }catch(e){results.push({stage:stageNumber,status:'FAIL',error:e.message,message:await p.locator('#player-message').textContent(),errors});}
  await context.close();console.log(JSON.stringify(results.at(-1)));
 }
 fs.writeFileSync(path.join(__dirname,'qa-real-results.json'),JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
