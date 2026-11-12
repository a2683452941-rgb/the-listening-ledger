import test from 'node:test';
import assert from 'node:assert/strict';
import {spokenMoney,narration,rankVoices} from '../public/narration.js';
import {sceneFor,sceneCatalog,sceneArt} from '../public/edition.js';
import {recapFacts} from '../public/recap.js';
import {freshState,scenarioRows} from '../public/seed.js';
import {evaluate,reviewRecord} from '../public/domain.js';
import {createAPI} from '../lib/api.mjs';

test('twenty fixed amount scripts preserve currency, cents, zero and large amounts',()=>{
 const cases=[[0,'CNY','0元'],[1,'CNY','0元1分'],[10,'CNY','0元1角'],[11,'CNY','0元1角1分'],[99,'CNY','0元9角9分'],[100,'CNY','1元'],[105,'CNY','1元5分'],[1800,'CNY','18元'],[2650,'CNY','26元5角'],[10000000000,'CNY','100000000元'],[0,'USD','0美元'],[1,'USD','0美元1美分'],[10,'USD','0美元10美分'],[99,'USD','0美元99美分'],[100,'USD','1美元'],[105,'USD','1美元5美分'],[2650,'USD','26美元50美分'],[999999,'USD','9999美元99美分'],[null,'CNY','金额待核对'],[-1,'USD','金额待核对']];
 for(const [amount,currency,expected] of cases)assert.equal(spokenMoney(amount,currency),expected);
});
test('narration retains unknown merchant and overspending together, without guessing a brand',()=>{const s=freshState();s.budget.total=100;const r=evaluate(scenarioRows('week'),s.budget)[5],text=narration(r);assert.match(text,/这笔消费，20元/);assert.match(text,/自己是否认识/);assert.match(text,/另外/);assert.match(text,/比限额多279元/);assert.doesNotMatch(text,/诈骗|安全商户/);});
test('no applicable budget is described as missing, not within budget',()=>{const s=freshState();s.budget.total=null;s.budget.categories={};const r=evaluate(scenarioRows('week'),s.budget)[0];assert.match(narration(r),/未设置适用预算/);assert.doesNotMatch(narration(r),/没有触发/);});
test('voice preference ranks Mandarin natural voices and does not mutate the device list',()=>{const voices=[{name:'English',lang:'en-US'},{name:'Chinese basic',lang:'zh-CN'},{name:'Chinese Natural',lang:'zh-CN'},{name:'Taiwan',lang:'zh-TW'}],copy=structuredClone(voices);assert.equal(rankVoices(voices)[0].name,'Chinese Natural');assert.equal(rankVoices(voices).length,3);assert.deepEqual(voices,copy);});
test('content-matched edition samples seven dates and six categories without inventing records for empty chapters',()=>{
 const all=sceneCatalog();assert.equal(all.length,13);
 const dates=all.filter(x=>x.mode==='date'),categories=all.filter(x=>x.mode==='category');
 assert.equal(dates.length,7);assert.equal(categories.length,6);
 assert.ok(all.every(x=>Array.isArray(x.items)));
 assert.deepEqual(dates.flatMap(x=>x.items).map(r=>r.id).sort(),scenarioRows('week').map(r=>r.id).sort());
 assert.deepEqual(categories.flatMap(x=>x.items).map(r=>r.id).sort(),scenarioRows('week').map(r=>r.id).sort());
 assert.equal(new Set(dates.map(x=>sceneFor(x.key,x.mode,0,x.items).layout)).size,7);
 assert.equal(new Set(categories.map(x=>sceneFor(x.key,x.mode,0,x.items).layout)).size,6);
 for(const p of all){
  const scene=sceneFor(p.key,p.mode,0,p.items);assert.ok(scene.custom);
  assert.match(sceneArt(scene),/editorial-art/);
  if(!p.items.length){assert.equal(scene.empty,true);assert.deepEqual(scene.assets,[]);}
 }
 assert.equal(sceneFor('2026-02-01','date').custom,false);
});
test('page recap is scoped to selected records while alerts still use the full budget period',()=>{const s=freshState(),f=recapFacts(scenarioRows('week'),s,{...s.range,recordIds:['N05','N06']});assert.equal(f.stats.spent,7000);assert.equal(f.stats.count,2);assert.equal(f.stats.review,1);assert.ok(f.records[0].reasons.some(x=>x.includes('110.00')));assert.deepEqual(f.budgetPeriod,{start:'2026-11-01',end:'2026-11-07'});assert.deepEqual(f.scope.recordIds,['N05','N06']);});
test('reading outside the budget period still totals real records and explains missing applicable rules',()=>{const s=freshState();s.budget.end='2026-11-02';const f=recapFacts(scenarioRows('week'),s,{start:'2026-11-03',end:'2026-11-05'});assert.equal(f.stats.spent,18000);assert.equal(f.stats.review,4);assert.equal(f.stats.missing,0);});
test('recap rejects nonexistent, repeated and out-of-range references',()=>{const s=freshState(),rows=scenarioRows('week');for(const ids of [['missing'],['N01','N01'],['N07']])assert.throws(()=>recapFacts(rows,s,{start:'2026-11-01',end:'2026-11-01',recordIds:ids}),/无效账单/);});
test('recap input changes after a limit or classification correction, invalidating model cache',()=>{const rows=scenarioRows('week'),s=freshState(),before=recapFacts(rows,s);const after=reviewRecord(rows,s,'N06',{category:'教育',recognized:false});assert.notDeepEqual(recapFacts(rows,after),before);after.budget={...after.budget,version:2,total:40000};assert.notDeepEqual(recapFacts(rows,after),before);assert.equal(before.stats.spent,recapFacts(rows,after).stats.spent);});
test('practice book persists separately and empty recap does not call the model',async()=>{const data=new Map(),store={get:k=>data.get(k),put:(k,v)=>data.set(k,structuredClone(v))};let calls=0;const api=createAPI({store,paypal:{account:'test-account'},ai:{call:async(kind,input)=>{calls++;return input;}}});const original=freshState();original.budget.total=45000;await api('/api/state','POST',{book:'demo:week',state:original});await api('/api/state','POST',{book:'demo:practice',state:freshState()});assert.equal(data.get('state:demo:week').budget.total,45000);const f=await api('/api/ai/summary','POST',{book:'demo:practice',consent:true,scope:{start:'2026-11-04',end:'2026-11-04'}});assert.equal(f.stats.spent,7000);await assert.rejects(()=>api('/api/ai/summary','POST',{book:'demo:practice',consent:true,scope:{start:'2026-12-01',end:'2026-12-01'}}),/没有账单/);assert.equal(calls,1);});

