const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const root = __dirname;
const scratch = path.join(root, 'maintenance_browser');
fs.mkdirSync(scratch, {recursive:true});
for (const key of ['TEMP','TMP']) {
  const dir = path.join(scratch,key); fs.mkdirSync(dir,{recursive:true}); process.env[key]=dir;
}
const {chromium} = require('C:/Users/GIGIABYTE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const results = [], errors = [];
let context, page;
const storage = () => page.evaluate(() => localStorage.getItem('mohammed-path-2030'));
const locked = n => page.locator('#stage-'+n).evaluate(el => el.classList.contains('is-locked'));
async function test(name, fn) {
  try { await fn(); results.push({name, status:'PASS'}); }
  catch(e) { results.push({name,status:'FAIL',error:e.message}); }
  console.log(JSON.stringify(results[results.length-1]));
}
async function videos(n) {
  for (const checkbox of await page.locator('#stage-'+n+' input[data-video]').all()) await checkbox.check();
}
async function restored(expected) {
  assert.equal(await storage(),expected);
  assert.equal(await locked(3),false);
  assert.equal(await locked(4),true);
  for (const n of [1,2]) {
    for (const checkbox of await page.locator('#stage-'+n+' input[type=checkbox]').all()) assert.equal(await checkbox.isChecked(),true);
  }
}
(async () => {
  try {
    context = await chromium.launchPersistentContext(path.join(scratch,'clean-profile'), {
      executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, timeout:30000,
      downloadsPath:path.join(scratch,'downloads'), acceptDownloads:true,
      args:['--disable-crash-reporter','--disable-breakpad','--no-first-run','--no-default-browser-check'],
      env:{...process.env}
    });
    page = context.pages()[0];
    page.on('console',msg => {if(msg.type()==='error') errors.push(msg.text());});
    page.on('pageerror',err=>errors.push(err.message));
    await page.goto(pathToFileURL(path.join(root,'Mohammed-Path-2030.html')).href);
    await test('fresh_storage_stage_1_open_2_to_18_locked',async()=>{
      assert.equal(await storage(),null); assert.equal(await locked(1),false);
      assert.equal(await page.locator('.stage').count(),18);
      for(let n=2;n<=18;n++) {
        assert.equal(await locked(n),true);
        for(const input of await page.locator('#stage-'+n+' input').all()) assert.equal(await input.isDisabled(),true);
        for(const link of await page.locator('#stage-'+n+' a.play').all()) assert.equal(await link.getAttribute('href'),null);
      }
    });
    await test('stage_1_videos_only_stage_2_locked',async()=>{
      await videos(1); assert.equal(await page.locator('[data-practice="1"]').isChecked(),false); assert.equal(await locked(2),true);
    });
    await test('practice_checked_stage_2_unlocks',async()=>{
      await page.locator('[data-practice="1"]').check(); assert.equal(await locked(2),false);
    });
    await test('practice_unchecked_stage_2_relocks',async()=>{
      await page.locator('[data-practice="1"]').uncheck(); assert.equal(await locked(2),true);
    });
    await test('complete_1_and_2_stage_3_open_stage_4_locked',async()=>{
      await page.locator('[data-practice="1"]').check(); await videos(2); await page.locator('[data-practice="2"]').check();
      assert.equal(await locked(3),false); assert.equal(await locked(4),true);
    });
    const expected = await storage();
    await test('reload_keeps_progress',async()=>{await page.reload();await restored(expected);});
    await test('export_clear_import_restores_progress',async()=>{
      const pending = page.waitForEvent('download'); await page.locator('#export-btn').click();
      const download = await pending; const exported = path.join(scratch,'export.json'); await download.saveAs(exported);
      assert.deepEqual(JSON.parse(fs.readFileSync(exported,'utf8')),JSON.parse(expected));
      await page.evaluate(()=>localStorage.clear()); await page.reload(); assert.equal(await storage(),null); assert.equal(await locked(2),true);
      await page.locator('#import-file').setInputFiles(exported);
      await page.waitForFunction(()=>document.querySelector('#status').textContent==='تم استيراد التقدم.');
      await restored(expected);
    });
    await test('broken_json_rejected_progress_kept',async()=>{
      const broken=path.join(scratch,'broken.json');fs.writeFileSync(broken,'{"watched": [');
      await page.locator('#import-file').setInputFiles(broken);
      await page.waitForFunction(()=>document.querySelector('#status').textContent==='الملف غير مفهوم. التقدم الحالي بقي كما هو.');
      await restored(expected);
    });
  } catch(e) {results.push({name:'browser_setup_or_execution',status:'FAIL',error:e.stack});}
  finally {
    if(page) await test('cleanup_zero_progress',async()=>{
      await page.evaluate(()=>localStorage.clear());await page.reload();assert.equal(await storage(),null);
      assert.equal(await page.locator('input:checked').count(),0);assert.equal(await locked(1),false);
      for(let n=2;n<=18;n++) assert.equal(await locked(n),true);
    });
    if(context) await context.close();
    console.log(JSON.stringify({results,consoleErrors:errors},null,2));
    if(results.some(r=>r.status!=='PASS')||errors.length) process.exitCode=1;
  }
})();
