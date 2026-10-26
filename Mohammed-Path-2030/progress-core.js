/* Pure progress rules, shared by the browser and regression checks. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ProgressCore = api;
})(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  const THRESHOLD = .95;
  const duration = video => video.hms.split(':').reduce((sum,n) => sum * 60 + Number(n), 0);
  const videos = stage => stage.groups.flatMap(g => g.videos);
  function merge(ranges, start, end) {
    const list = [...ranges, [start,end]].sort((a,b) => a[0]-b[0]);
    const merged = [];
    for (const r of list) {
      const last = merged[merged.length-1];
      // YouTube timestamps jitter slightly between polls; coalesce sub-100ms gaps.
      if (last && r[0] <= last[1]+.1) last[1] = Math.max(last[1],r[1]);
      else merged.push([...r]);
    }
    return merged;
  }
  const covered = record => (record?.ranges || []).reduce((sum,r) => sum+r[1]-r[0],0);
  const fresh = () => ({version:2,records:{},practice:{},notes:{},bookmarks:[],lastVideo:null,lastStage:null,focusTarget:25});
  const record = () => ({ranges:[],activeSeconds:0,position:0,legacy:false});
  const complete = (state,video) => state.records[video.id]?.legacy === true || covered(state.records[video.id]) >= duration(video)*THRESHOLD;
  const stageComplete = (state,stage) => videos(stage).filter(v=>!v.optional).every(v=>complete(state,v)) && state.practice[stage.stage] === true;
  const unlocked = (state,path,number) => path.stages.filter(s=>s.stage<number).every(s=>stageComplete(state,s));
  function videoUnlocked(state,path,stage,video) {
    if(!unlocked(state,path,stage.stage)) return false;
    const list=videos(stage), index=list.findIndex(v=>v.id===video.id);
    return index>=0 && list.slice(0,index).filter(v=>!v.optional).every(v=>complete(state,v));
  }
  function sample(rec, previous, current, seconds) {
    if (!previous || !current.visible || !previous.visible || !current.playing || !previous.playing) return false;
    if (!Number.isFinite(seconds) || seconds<=0 ||
        ![current.wall,previous.wall,current.position,previous.position,current.rate,previous.rate].every(Number.isFinite) ||
        current.rate<=0 || previous.rate<=0 || current.position<0 || previous.position<0) return false;
    const wall = (current.wall - previous.wall)/1000, delta = current.position-previous.position;
    if (wall<=0 || wall>3 || delta<=0 || current.rate !== previous.rate || delta > wall*current.rate + .65) return false;
    // Only the portion supported by elapsed playback time is credited. Replays do not add coverage.
    const end = Math.min(seconds,current.position), start = Math.max(0,current.position-Math.min(delta,wall*current.rate));
    if(end<=start) return false;
    rec.ranges=merge(rec.ranges,start,end);
    rec.activeSeconds += (end-start)/current.rate;
    rec.position=Math.min(seconds,current.position);
    return true;
  }
  function validate(payload,path) {
    const all = path.stages.flatMap(videos), ids = new Set(all.map(v=>v.id)), durations=Object.fromEntries(all.map(v=>[v.id,duration(v)]));
    const plain = o => o !== null && typeof o==='object' && !Array.isArray(o);
    const fail = () => {throw new Error('ملف التقدم غير صالح. لم يتغير تقدمك الحالي.');};
    const result=fresh();
    if(!plain(payload)) fail();
    // Explicit migration: preserve old manually confirmed progress, never invent watch time.
    if(payload.version === undefined) {
      if(!Array.isArray(payload.watched) || !plain(payload.practice)) fail();
      for(const id of payload.watched) {if(typeof id!=='string'||!ids.has(id)) fail(); result.records[id]={...record(),legacy:true};}
    } else {
      if(payload.version!==2 || !plain(payload.records) || !plain(payload.practice) || !plain(payload.notes) || !Array.isArray(payload.bookmarks)) fail();
      for(const [id,r] of Object.entries(payload.records)) {
        if(!ids.has(id)||!plain(r)||!Array.isArray(r.ranges)||r.ranges.length>20000||typeof r.legacy!=='boolean') fail();
        for(const k of ['activeSeconds','position']) if(!Number.isFinite(r[k])||r[k]<0) fail();
        if(r.position>durations[id]+1||r.activeSeconds>1e8) fail();
        let previous=-1;
        for(const pair of r.ranges) {
          if(!Array.isArray(pair)||pair.length!==2||!pair.every(Number.isFinite)||pair[0]<0||pair[1]<=pair[0]||pair[1]>durations[id]+.01||pair[0]<=previous) fail();
          previous=pair[1];
        }
        result.records[id]={ranges:r.ranges.map(r=>[...r]),activeSeconds:r.activeSeconds,position:r.position,legacy:r.legacy};
      }
      for(const [id,note] of Object.entries(payload.notes)) {if(!ids.has(id)||typeof note!=='string'||note.length>20000) fail();result.notes[id]=note;}
      if(payload.bookmarks.some(id=>!ids.has(id))) fail();
      result.bookmarks=[...new Set(payload.bookmarks)];
      if(payload.lastVideo!==null && !ids.has(payload.lastVideo)) fail();
      result.lastVideo=payload.lastVideo;
      if(payload.lastStage!==undefined&&payload.lastStage!==null){
        if(!Number.isInteger(payload.lastStage)||!path.stages.some(s=>s.stage===payload.lastStage))fail();
        result.lastStage=payload.lastStage;
      }
      if(![15,25,45,60].includes(payload.focusTarget)) fail();
      result.focusTarget=payload.focusTarget;
    }
    for(const [stage,done] of Object.entries(payload.practice)) {
      if(!path.stages.some(s=>String(s.stage)===stage)||typeof done!=='boolean') fail();
      result.practice[stage]=done;
    }
    return result;
  }
  function xp(state,path) {
    const all=path.stages.flatMap(videos);
    const lessons=all.filter(v=>complete(state,v)).length;
    const stages=path.stages.filter(s=>stageComplete(state,s)).length;
    return {lessons,stages,points:lessons*50+stages*200,seconds:Object.values(state.records).reduce((n,r)=>n+r.activeSeconds,0)};
  }
  return {THRESHOLD,duration,videos,merge,covered,fresh,record,complete,stageComplete,unlocked,videoUnlocked,sample,validate,xp};
});
