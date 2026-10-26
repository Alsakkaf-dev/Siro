/* Local-first learning application. YouTube remains the video host. */
(() => {
  'use strict';
  const C=ProgressCore, KEY='mohammed-path-2030', OWNER=KEY+'-player-owner';
  const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const all=PATH.stages.flatMap(s=>C.videos(s).map(v=>({...v,stage:s.stage}))), byId=new Map(all.map(v=>[v.id,v]));
  const tabId=crypto.randomUUID?.() || Math.random().toString(36), titles={learn:'مساحة التعلّم',path:'خريطة المسار',achievements:'رصيد الإنجاز',library:'المكتبة والفرص'};
  let state=C.fresh(), selectedStage=PATH.stages[0], selectedVideo=null, view='learn', player=null, previous=null, apiPromise=null, generation=0;
  let sessionSeconds=0, toastTimer, errorOnLoad='', saveFailed=false, owner=true, apiTimer, pendingNote, routeMarkup='';
  const formatTime=seconds=>{const n=Math.floor(seconds);return n>=3600?`${Math.floor(n/3600)}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`:`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  const human=seconds=>seconds>=3600?`${(seconds/3600).toFixed(1)} س`:`${Math.floor(seconds/60)} د`;
  const num=n=>String(n).padStart(2,'0');
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
  try{
    const saved=localStorage.getItem(KEY);
    if(saved){const parsed=JSON.parse(saved);state=C.validate(parsed,PATH);if(parsed.version===undefined&&!localStorage.getItem(KEY+'-legacy-backup'))localStorage.setItem(KEY+'-legacy-backup',saved);}
  }catch(e){errorOnLoad='تعذّر قراءة التقدم المحفوظ. لم نكتب فوقه؛ يمكنك تصدير بياناتك الأصلية أو استيراد نسخة سليمة.';saveFailed=true;}
  function persist(){
    if(errorOnLoad){$('save-state').textContent='البيانات القديمة تحتاج استعادة';return false;}
    try{localStorage.setItem(KEY,JSON.stringify(state));$('save-state').textContent='محفوظ على جهازك';saveFailed=false;return true;}
    catch(e){$('save-state').textContent='تعذّر الحفظ — صدّر نسخة';if(!saveFailed)toast('مساحة التخزين غير متاحة. تقدمك في هذه الجلسة موجود؛ صدّر نسخة قبل الإغلاق.');saveFailed=true;return false;}
  }
  function showView(name){
    if(!Object.hasOwn(titles,name))name='learn';
    if(name!=='learn'){sample();player?.pauseVideo?.();previous=null;document.body.classList.remove('focus-mode');$('focus-btn').setAttribute('aria-pressed','false');$('focus-btn').textContent='وضع التركيز ⤢';}
    view=name;
    document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==name+'-view');
    document.querySelectorAll('.nav-item').forEach(el=>{el.classList.toggle('active',el.dataset.view===name);el.setAttribute('aria-current',el.dataset.view===name?'page':'false');});
    $('view-title').textContent=titles[name];
    history.replaceState(null,'','#'+name);
    if(name==='path')renderPath();if(name==='achievements')renderAchievements();
  }
  function chooseTab(name,focus=false){
    document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===name;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active&&focus)b.focus();});
    ['about','practice','notes'].forEach(t=>$('panel-'+t).hidden=t!==name);
  }
  function release(){try{if(localStorage.getItem(OWNER)===tabId)localStorage.removeItem(OWNER);}catch{}owner=false;}
  function stopPlayer(){sample();generation++;clearTimeout(apiTimer);player?.destroy?.();player=null;previous=null;release();$('player-host')?.remove();const host=document.createElement('div');host.id='player-host';$('player-frame').prepend(host);$('player-poster').hidden=false;$('player-message').hidden=true;}
  function currentRecord(){if(!selectedVideo)return null;return state.records[selectedVideo.id] ||= C.record();}
  function selectStage(stage,videoId){
    if(!C.unlocked(state,PATH,stage.stage)){toast('أكمل مشاهدة وتطبيق المراحل السابقة لفتح هذه المرحلة.');return;}
    flushNotes();stopPlayer();selectedStage=stage;
    const list=C.videos(stage);
    selectedVideo=list.find(v=>v.id===videoId&&C.videoUnlocked(state,PATH,stage,v))||list.find(v=>!C.complete(state,v)&&C.videoUnlocked(state,PATH,stage,v))||list[0]||null;
    state.lastVideo=selectedVideo?.id||null;state.lastStage=stage.stage;persist();
    $('stage-title').textContent=stage.title;$('stage-eyebrow').textContent=`المرحلة ${num(stage.stage)} من ${PATH.stage_count} · ${stage.hours} ساعة`;
    $('stage-why').textContent=stage.why;$('stage-note').textContent=stage.note;$('stage-note').hidden=!stage.note;
    $('practice-text').textContent=stage.practice_task;
    $('player-frame').hidden=!selectedVideo;document.querySelector('.watch-meter').hidden=!selectedVideo;
    $('lesson-title').textContent=selectedVideo?.title||'مشروعك هو الدرس الأخير.';
    $('lesson-meta').textContent=selectedVideo?`${selectedVideo.channel} · ${selectedVideo.hms}${selectedVideo.optional?' · اختياري':''}`:'لا فيديوهات جديدة. وقت البناء.';
    $('bookmark-btn').hidden=!selectedVideo;$('tab-notes').hidden=!selectedVideo;
    if(selectedVideo){
      $('poster-title').textContent=selectedVideo.title;$('poster-channel').textContent=selectedVideo.channel;$('poster-duration').textContent=selectedVideo.hms;
      $('poster-index').textContent=num(list.findIndex(v=>v.id===selectedVideo.id)+1);
      $('notes').value=state.notes[selectedVideo.id]||'';
      $('play-btn').disabled=false;$('play-btn').innerHTML='<span aria-hidden="true">▶</span> '+(state.records[selectedVideo.id]?.position?'أكمل المشاهدة':'ابدأ المشاهدة');
    }else $('notes').value='';
    noteCount();chooseTab(selectedVideo?'about':'practice');renderAll();showView('learn');
  }
  function renderAll(){renderStats();renderLessons();renderMeter();renderPractice();renderNavigation();}
  function renderStats(){
    const stats=C.xp(state,PATH);$('xp-total').textContent=stats.points.toLocaleString('en-US');$('all-time').textContent=human(stats.seconds);$('side-count').textContent=num(stats.stages);$('side-fill').style.width=`${stats.stages/PATH.stage_count*100}%`;
    $('rank-label').textContent=stats.stages>=10?'مهندس يبني بثقة':stats.stages>=3?'خطوات تتحوّل إلى خبرة':stats.lessons?'بداية تستحق الاستمرار':'فضول يتحوّل إلى مهارة';
    $('route-caption').textContent=`${stats.stages} مكتملة من ${PATH.stage_count}`;
    const nextRouteMarkup=PATH.stages.map(s=>`<button data-stage="${s.stage}" class="${s.stage===selectedStage.stage?'current ':''}${C.stageComplete(state,s)?'done ':''}${!C.unlocked(state,PATH,s.stage)?'locked':''}" aria-label="المرحلة ${s.stage}: ${esc(s.title)}${C.unlocked(state,PATH,s.stage)?'':'، مقفلة'}" title="${esc(s.title)}">${num(s.stage)}</button>`).join('');
    if(nextRouteMarkup!==routeMarkup){$('mini-route').innerHTML=nextRouteMarkup;routeMarkup=nextRouteMarkup;}
    const goal=Math.min(100,sessionSeconds/(state.focusTarget*60)*100);$('goal-fill').style.width=goal+'%';$('goal-time').textContent=`${Math.floor(sessionSeconds/60)} دقيقة من وقت الجلسة`;$('goal-check').textContent=Math.floor(goal)+'%';$('goal-title').textContent=goal>=100?'أعطيت فكرتك مساحة.':'مساحة لفكرة جديدة.';
  }
  function renderLessons(){
    const list=C.videos(selectedStage), done=list.filter(v=>C.complete(state,v)).length;
    $('lesson-count').textContent=list.length;$('rail-progress-label').textContent=`${done} من ${list.length} دروس مكتملة`;$('rail-fill').style.width=(list.length?done/list.length*100:0)+'%';
    let index=0;
    $('lesson-list').innerHTML=selectedStage.groups.map(g=>`<h3 class="group-title">${esc(g.label)}</h3>`+g.videos.map(v=>{
      const complete=C.complete(state,v), open=C.videoUnlocked(state,PATH,selectedStage,v), percent=Math.min(100,C.covered(state.records[v.id])/C.duration(v)*100);index++;
      return `<button class="lesson-row ${selectedVideo?.id===v.id?'selected ':''}${complete?'done':''}" data-video="${esc(v.id)}" ${!open?'disabled':''} ${selectedVideo?.id===v.id?'aria-current="true"':''}><span class="lesson-number" aria-hidden="true">${complete?'✓':!open?'−':num(index)}</span><span><strong dir="auto">${esc(v.title)}</strong><small>${esc(v.hms)}${v.optional?' · اختياري':''}${!open?' · مقفل':''}${complete?' · مكتمل':''}</small><span class="tiny-progress"><i style="width:${complete?100:percent}%"></i></span></span></button>`;
    }).join('')).join('') || '<p class="empty-state">كل ما تحتاجه الآن هو مشروعك.</p>';
  }
  function renderMeter(){
    if(!selectedVideo)return;
    const rec=state.records[selectedVideo.id], percent=Math.min(100,C.covered(rec)/C.duration(selectedVideo)*100);
    $('live-time').textContent=formatTime(rec?.activeSeconds||0);$('coverage-value').textContent=rec?.legacy?'إنجاز سابق':Math.floor(percent)+'%';$('coverage-fill').style.width=(rec?.legacy?100:percent)+'%';
    $('bookmark-btn').textContent=state.bookmarks.includes(selectedVideo.id)?'★':'☆';$('bookmark-btn').setAttribute('aria-pressed',String(state.bookmarks.includes(selectedVideo.id)));
    $('live-dot').classList.toggle('running',!!player&&player.getPlayerState?.()===1&&!document.hidden&&owner);
    const lessonProgress=document.querySelector('.lesson-row.selected .tiny-progress i');
    if(lessonProgress)lessonProgress.style.width=(rec?.legacy?100:percent)+'%';
  }
  function renderPractice(){
    $('practice-check').checked=state.practice[selectedStage.stage]===true;
    const remaining=C.videos(selectedStage).filter(v=>!v.optional&&!C.complete(state,v)).length;
    $('practice-hint').textContent=remaining?`بقي ${remaining} من المقاطع المطلوبة. تُفتح المرحلة التالية بعد المشاهدة والتطبيق معًا.`:C.stageComplete(state,selectedStage)?'أنجزت هذه المرحلة. صدّر تقدمك، ثم تابع رحلتك.':'المشاهدة اكتملت. أكمل التطبيق لتفتح الخطوة التالية.';
  }
  function renderNavigation(){
    const list=C.videos(selectedStage), index=list.findIndex(v=>v.id===selectedVideo?.id);
    $('previous-btn').disabled=index<=0;
    const next=list[index+1];
    if(next){$('next-btn').textContent='الدرس التالي ←';$('next-btn').disabled=!C.videoUnlocked(state,PATH,selectedStage,next);}
    else{const stage=PATH.stages[selectedStage.stage];$('next-btn').textContent=stage?'المرحلة التالية ←':C.stageComplete(state,selectedStage)?'اكتمل المسار ✓':'أكمل التطبيق الختامي';$('next-btn').disabled=!stage||!C.unlocked(state,PATH,stage.stage);}
  }
  function renderPath(){
    const query=$('stage-search').value.trim().toLowerCase();
    const list=PATH.stages.filter(s=>(s.title+' '+s.why+' '+s.groups.map(g=>g.label).join(' ')).toLowerCase().includes(query));
    $('search-empty').hidden=!!list.length;
    $('path-list').innerHTML=list.map(s=>{const complete=C.stageComplete(state,s),open=C.unlocked(state,PATH,s.stage);return `<article class="path-card ${open&&!complete?'current':''}"><span class="stage-number">${num(s.stage)}</span><div><h2>${esc(s.title)}</h2><p>${esc(s.why)}</p><small>${s.video_count} فيديو · ${s.hours} ساعة · ${C.videos(s).filter(v=>C.complete(state,v)).length} مشاهدة مكتملة</small></div><button class="stage-status" data-stage="${s.stage}" ${!open?'disabled':''}>${complete?'مكتملة ✓':open?'افتح المرحلة ←':'مقفلة'}</button></article>`;}).join('');
  }
  function renderAchievements(){
    const stats=C.xp(state,PATH);
    $('achievement-summary').innerHTML=`<div><span>رصيد المعرفة والتطبيق</span><b>${stats.points.toLocaleString('en-US')} <small>XP</small></b></div><div><span>دروس مكتملة</span><b>${stats.lessons}</b></div><div><span>وقت فعلي</span><b>${human(stats.seconds)}</b></div>`;
    const badges=[['↗','الخطوة الأولى','أكمل أول فيديو',stats.lessons>=1],['◇','فهم وتطبيق','أكمل مرحلة مع تطبيقها',stats.stages>=1],['◎','وقت له قيمة','ساعة مشاهدة فعلية',stats.seconds>=3600],['≋','على الطريق','أكمل خمس مراحل',stats.stages>=5],['✧','معرفة تتراكم','أكمل 25 فيديو',stats.lessons>=25],['⌘','منهج المهندس','أكمل مرحلة التحقق',C.stageComplete(state,PATH.stages[9])],['⌁','صانع الأنظمة','أكمل مرحلة التسليم',C.stageComplete(state,PATH.stages[13])],['✓','من الفكرة إلى الأثر','أكمل المراحل الثماني عشرة',stats.stages===18]];
    $('badges').innerHTML=badges.map(([symbol,title,desc,earned])=>`<article class="badge ${earned?'earned':''}"><span class="badge-symbol" aria-hidden="true">${symbol}</span><h3>${title}</h3><p>${desc}</p><small>${earned?'حققتها ✓':'في انتظار خطوتك'}</small></article>`).join('');
    $('bookmarks-list').innerHTML=state.bookmarks.map(id=>{const v=byId.get(id);return `<div class="bookmark-row"><div><h3 dir="auto">${esc(v.title)}</h3><p>${esc(PATH.stages[v.stage-1].title)} · ${esc(v.hms)}</p></div><button class="text-button" data-bookmark-open="${id}">افتح الدرس ←</button><button class="icon-button" data-bookmark-remove="${id}" aria-label="إزالة من المفضلة">×</button></div>`;}).join('')||'<p class="empty-state">احفظ درسًا بالنجمة بجانب عنوانه؛ ستجده هنا عندما تحتاجه.</p>';
  }
  function loadAPI(){
    if(window.YT?.Player)return Promise.resolve();
    if(apiPromise)return apiPromise;
    apiPromise=new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{apiPromise=null;reject(new Error('تعذّر الاتصال بمشغّل YouTube. تحقق من اتصال الإنترنت ثم أعد المحاولة.'));},15000);
      window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);resolve();};
      document.querySelector('script[data-youtube-api]')?.remove();
      const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.dataset.youtubeApi='true';
      script.onerror=()=>{clearTimeout(timeout);apiPromise=null;reject(new Error('تعذّر تحميل YouTube. تحقق من الشبكة أو مانع المحتوى.'));};document.head.append(script);
    });return apiPromise;
  }
  function playerMessage(message,original=false){
    $('player-message').textContent=message;$('player-message').hidden=false;
    if(original&&selectedVideo){const a=document.createElement('a');a.href=selectedVideo.link;a.textContent=' افتح الفيديو الأصلي ↗';a.target='_blank';a.rel='noopener noreferrer';$('player-message').append(a);}
  }
  async function startVideo(){
    if(!selectedVideo||!C.videoUnlocked(state,PATH,selectedStage,selectedVideo))return;
    if(location.protocol==='file:'){playerMessage('لتشغيل الفيديو داخل الموقع، افتح Start-Path.cmd ثم استخدم العنوان المحلي الذي يفتحه. تقدم الصفحة القديمة يمكن نقله بالتصدير والاستيراد.');return;}
    const token=++generation, video=selectedVideo;
    $('play-btn').disabled=true;$('play-btn').textContent='جارٍ تجهيز المشغّل…';$('player-message').hidden=true;
    try{
      await loadAPI();if(token!==generation)return;
      player?.destroy?.();$('player-host')?.remove();const host=document.createElement('div');host.id='player-host';$('player-frame').prepend(host);
      player=new YT.Player('player-host',{host:'https://www.youtube.com',width:'100%',height:'100%',videoId:video.id,
        playerVars:{playsinline:1,rel:0,origin:location.origin,enablejsapi:1,autoplay:0,start:Math.floor(state.records[video.id]?.position||0)},
        events:{
          onReady:event=>{if(token!==generation)return;clearTimeout(apiTimer);event.target.getIframe().title=video.title;$('player-poster').hidden=true;$('player-message').hidden=true;event.target.playVideo();},
          onStateChange:event=>{
            if(token!==generation)return;
            if(event.data===1){owner=true;try{localStorage.setItem(OWNER,tabId);}catch{}previous=null;if(document.hidden||view!=='learn')event.target.pauseVideo();}
            else{sample();previous=null;if(owner)persist();}
            renderMeter();
          },
          onPlaybackRateChange:()=>{previous=null;},
          onError:event=>{if(token!==generation)return;clearTimeout(apiTimer);previous=null;playerMessage(`تعذّر تشغيل هذا الفيديو داخل الموقع (YouTube ${event.data}). قد يكون التضمين ممنوعًا أو الفيديو غير متاح. المشاهدة الخارجية لا تُحتسب آليًا.`,true);$('player-poster').hidden=false;$('play-btn').disabled=false;$('play-btn').textContent='إعادة المحاولة';},
          onAutoplayBlocked:()=>playerMessage('اضغط تشغيل داخل مشغّل YouTube لبدء الدرس.')
        }
      });
      apiTimer=setTimeout(()=>{if(token===generation){playerMessage('لم يستجب مشغّل YouTube. تحقق من الشبكة أو أعد المحاولة.',true);$('play-btn').disabled=false;$('play-btn').textContent='إعادة المحاولة';}},18000);
    }catch(e){if(token!==generation)return;playerMessage(e.message,true);$('play-btn').disabled=false;$('play-btn').textContent='إعادة المحاولة';}
  }
  function sample(){
    if(!player?.getCurrentTime||!selectedVideo)return;
    const current={position:player.getCurrentTime(),rate:player.getPlaybackRate?.()||1,playing:player.getPlayerState?.()===1,visible:!document.hidden&&view==='learn'&&owner,wall:performance.now()};
    if(!Number.isFinite(current.position)||current.position<0)return;
    const rec=currentRecord(),wasComplete=C.complete(state,selectedVideo),before=rec.activeSeconds;
    if(C.sample(rec,previous,current,C.duration(selectedVideo))){
      sessionSeconds+=rec.activeSeconds-before;
      if(!wasComplete&&C.complete(state,selectedVideo)){toast('درس جديد في رصيدك. +50 XP — خطوتك التالية أصبحت أقرب.');renderLessons();renderPractice();renderNavigation();}
      renderStats();renderMeter();persist();
    }
    previous=current;
  }
  function noteCount(){$('note-count').textContent=`${$('notes').value.length} / 20000`;}
  function flushNotes(){
    if(!pendingNote||!selectedVideo)return;
    clearTimeout(pendingNote);pendingNote=null;
    state.notes[selectedVideo.id]=$('notes').value;persist();
  }
  function exportProgress(){
    sample();flushNotes();
    let text=JSON.stringify(state,null,2);
    if(errorOnLoad){try{text=localStorage.getItem(KEY)||text;}catch{}}
    const url=URL.createObjectURL(new Blob([text+'\n'],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='mohammed-path-2030-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('احفظ النسخة في مجلد progress. تتضمن تقدمك وملاحظاتك.');
  }
  document.addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.view)showView(target.dataset.view);
    if(target.dataset.stage)selectStage(PATH.stages[Number(target.dataset.stage)-1]);
    if(target.dataset.video)selectStage(selectedStage,target.dataset.video);
    if(target.dataset.tab)chooseTab(target.dataset.tab);
    if(target.dataset.bookmarkOpen){const v=byId.get(target.dataset.bookmarkOpen),s=PATH.stages[v.stage-1];if(C.videoUnlocked(state,PATH,s,v))selectStage(s,v.id);else toast('هذا الدرس مقفل. أكمل الدروس السابقة أولًا.');}
    if(target.dataset.bookmarkRemove){state.bookmarks=state.bookmarks.filter(id=>id!==target.dataset.bookmarkRemove);persist();renderAchievements();renderMeter();}
  });
  document.querySelector('.lesson-tabs').addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;event.preventDefault();
    const tabs=[...document.querySelectorAll('[data-tab]')].filter(b=>!b.hidden);let i=tabs.indexOf(document.activeElement);
    i=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowLeft'?1:-1)+tabs.length)%tabs.length;chooseTab(tabs[i].dataset.tab,true);
  });
  $('play-btn').onclick=startVideo;
  $('previous-btn').onclick=()=>{const list=C.videos(selectedStage);selectStage(selectedStage,list[list.findIndex(v=>v.id===selectedVideo?.id)-1]?.id);};
  $('next-btn').onclick=()=>{const list=C.videos(selectedStage),next=list[list.findIndex(v=>v.id===selectedVideo?.id)+1];if(next)selectStage(selectedStage,next.id);else if(PATH.stages[selectedStage.stage])selectStage(PATH.stages[selectedStage.stage]);};
  $('practice-check').onchange=()=>{const before=C.stageComplete(state,selectedStage);state.practice[selectedStage.stage]=$('practice-check').checked;persist();renderAll();if(!before&&C.stageComplete(state,selectedStage))toast('مرحلة كاملة. +200 XP — صدّر تقدمك قبل الخطوة التالية.');};
  $('rail-practice').onclick=()=>{chooseTab('practice');$('tab-practice').focus();$('panel-practice').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});};
  $('bookmark-btn').onclick=()=>{if(!selectedVideo)return;const id=selectedVideo.id;state.bookmarks=state.bookmarks.includes(id)?state.bookmarks.filter(x=>x!==id):[...state.bookmarks,id];persist();renderMeter();};
  $('notes').oninput=()=>{noteCount();$('note-status').textContent='جارٍ الحفظ…';clearTimeout(pendingNote);pendingNote=setTimeout(()=>{flushNotes();$('note-status').textContent=saveFailed?'تعذّر الحفظ؛ صدّر نسخة.':'حُفظت ملاحظتك.';},400);};
  $('timestamp-btn').onclick=()=>{if(!selectedVideo)return;const input=$('notes'),stamp=`[${formatTime(player?.getCurrentTime?.()||state.records[selectedVideo.id]?.position||0)}] `;if(input.value.length+stamp.length>20000)return;input.setRangeText(stamp,input.selectionStart,input.selectionEnd,'end');input.dispatchEvent(new Event('input'));input.focus();};
  $('focus-target').value=state.focusTarget;$('focus-target').onchange=()=>{state.focusTarget=Number($('focus-target').value);persist();renderStats();};
  $('focus-btn').onclick=()=>{const focused=document.body.classList.toggle('focus-mode');$('focus-btn').setAttribute('aria-pressed',String(focused));$('focus-btn').textContent=focused?'الخروج من التركيز ⤡':'وضع التركيز ⤢';};
  $('stage-search').oninput=renderPath;
  $('settings-btn').onclick=$('help-btn').onclick=()=>{$('settings-dialog').showModal();};
  $('close-settings').onclick=()=>$('settings-dialog').close();
  $('export-btn').onclick=$('dialog-export').onclick=exportProgress;
  $('import-file').onchange=async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{
      if(file.size>8e6)throw new Error('الملف أكبر من الحد المسموح (8 MB).');
      const imported=C.validate(JSON.parse(await file.text()),PATH);
      // Stop the old timer before replacing state; validation failures never touch current progress.
      flushNotes();stopPlayer();
      localStorage.setItem(KEY,JSON.stringify(imported));state=imported;errorOnLoad='';saveFailed=false;selectedVideo=null;
      $('focus-target').value=state.focusTarget;sessionSeconds=0;restoreSelection();$('settings-dialog').close();toast('استُعيد تقدمك وملاحظاتك بنجاح.');
    }catch(e){toast('تعذّر استيراد الملف. تقدمك الحالي بقي كما هو.');}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden){sample();player?.pauseVideo?.();previous=null;flushNotes();renderMeter();}});
  window.addEventListener('hashchange',()=>showView(location.hash.slice(1)));
  window.addEventListener('pagehide',()=>{flushNotes();sample();release();});
  window.addEventListener('storage',event=>{
    if(event.key===null||(event.key===KEY&&event.newValue===null)){
      owner=false;player?.pauseVideo?.();previous=null;
      clearTimeout(pendingNote);pendingNote=null;state=C.fresh();errorOnLoad='';
      selectedVideo=null;sessionSeconds=0;$('focus-target').value=state.focusTarget;
      restoreSelection();toast('مُسح التقدم من نافذة أخرى. بدأت مساحة جديدة.');return;
    }
    if(event.key===OWNER&&event.newValue&&event.newValue!==tabId){owner=false;player?.pauseVideo?.();previous=null;renderMeter();}
    if(event.key===KEY&&event.newValue){try{
      const updated=C.validate(JSON.parse(event.newValue),PATH);state=updated;
      $('focus-target').value=state.focusTarget;
      if(!C.unlocked(state,PATH,selectedStage.stage)||(selectedVideo&&!C.videoUnlocked(state,PATH,selectedStage,selectedVideo))){
        owner=false;player?.pauseVideo?.();previous=null;
        if(selectedVideo)$('notes').value=state.notes[selectedVideo.id]||'';
        restoreSelection();toast('تغيّر التقدم في نافذة أخرى. عُدت إلى المرحلة المتاحة.');
      }
      renderAll();if(!pendingNote&&selectedVideo){$('notes').value=state.notes[selectedVideo.id]||'';noteCount();}
      if(view==='path')renderPath();if(view==='achievements')renderAchievements();
    }catch{}}
  });
  function restoreSelection(){
    const lastStage=PATH.stages.find(s=>s.stage===state.lastStage);
    if(lastStage&&!C.videos(lastStage).length&&C.unlocked(state,PATH,lastStage.stage)){selectStage(lastStage);return;}
    const v=byId.get(state.lastVideo);
    if(v&&C.videoUnlocked(state,PATH,PATH.stages[v.stage-1],v))selectStage(PATH.stages[v.stage-1],v.id);
    else selectStage(PATH.stages.find(s=>C.unlocked(state,PATH,s.stage)&&!C.stageComplete(state,s))||PATH.stages[0]);
  }
  const initialView=location.hash.slice(1);restoreSelection();showView(initialView);if(errorOnLoad)toast(errorOnLoad);
  setInterval(sample,1000);
})();
