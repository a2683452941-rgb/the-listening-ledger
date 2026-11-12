import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sceneFor,sceneArt,sceneCatalog,coverArt} from '../public/edition.js';
import {transactions,freshState} from '../public/seed.js';
import {evaluate,reviewRecord} from '../public/domain.js';
const base=new URL('../',import.meta.url);
const manifest=JSON.parse((await readFile(new URL('public/assets/asset-manifest.json',base),'utf8')).replace(/^\uFEFF/,''));
test('released images preserve integrity and distinguish physical-source licenses from generated provenance',async()=>{
 const files=await readdir(new URL('public/assets/art/',base));
 assert.deepEqual(files.sort(),manifest.assets.map(a=>a.localFile.split('/').at(-1)).sort());
 assert.equal(manifest.assets.filter(a=>a.sourceKind==='generated').length,5);
 assert.equal(manifest.assets.filter(a=>a.sourceKind!=='generated').length,18);
 for(const a of manifest.assets){
  if(a.sourceKind==='generated'){
   assert.equal(a.sourceEvidence.generationTool,'image_gen');
   assert.equal(a.sourceEvidence.userApprovedGenerativeImages,true);
   assert.notEqual(a.license,'CC0 1.0 Universal');
   assert.ok(a.rightsNote);
   assert.match(a.credit,/AI生成/);
   assert.match(a.localFile,/\.png$/);
   assert.match(a.promptFile,/^\/assets\/.+\.json$/);
   const prompts=JSON.parse(await readFile(new URL('public'+a.promptFile,base),'utf8'));
   assert.ok(prompts.prompts[a.assetId],a.assetId+' needs its generation prompt');
  }else{
   assert.ok(a.originalItemUrl.startsWith('https://'));
   assert.ok(a.originalFileUrl.startsWith('https://'));
   assert.equal(a.license,'CC0 1.0 Universal');
   assert.equal(a.mayRedistributeWithSource,true);
   assert.ok(a.sourceEvidence.isPublicDomain===true||a.sourceEvidence.creationMethod==='PBRPhotogrammetry');
  }
  const data=await readFile(new URL(a.localFile,base));
  assert.equal(createHash('sha256').update(data).digest('hex'),a.sha256);
  assert.equal(data.length,a.bytes);
  if(a.sourceKind==='generated'){
   assert.deepEqual([...data.subarray(0,8)],[137,80,78,71,13,10,26,10]);
   assert.equal(data.readUInt32BE(16),a.width);
   assert.equal(data.readUInt32BE(20),a.height);
  }
 }
 assert.ok(manifest.assets.reduce((n,a)=>n+a.bytes,0)<=20*1024*1024);
});
test('catalog scenes, continuations and generic dates render stable declared images or an explicit blank',()=>{
 const ids=new Set(manifest.assets.map(a=>a.assetId));
 const all=[...sceneCatalog(),{key:'2027-02-01',mode:'date',items:transactions.slice(0,2)},{key:'2027-02-02',mode:'date',items:[]}];
 for(const p of all)for(const part of [0,1])for(const side of ['map','plate']){
  const scene=sceneFor(p.key,p.mode,part,p.items),html=sceneArt(scene,side);
  assert.equal(html,sceneArt(sceneFor(p.key,p.mode,part,p.items),side));
  assert.ok(html.includes('data-art-version="5"'));
  assert.ok(!html.includes('<svg'));
  for(const [,id] of html.matchAll(/data-art-id="([^"]+)"/g))assert.ok(ids.has(id),id);
  if(side==='map'&&scene.unresolved)assert.doesNotMatch(html,/<img\b/);
  else if(scene.assets.length)assert.ok(html.includes('alt=""'));
  else{assert.doesNotMatch(html,/<img\b/);assert.match(html,/empty-art/);}
 }
 for(const mode of ['date','category'])for(const [,id] of coverArt(mode).matchAll(/data-art-id="([^"]+)"/g))assert.ok(ids.has(id));
});
test('the example dates match coffee, study, stationery, meal and yarn while unresolved records remain unpictured',()=>{
 const week=sceneCatalog().filter(x=>x.mode==='date').map(x=>sceneFor(x.key,x.mode,0,x.items));
 assert.deepEqual(week.map(t=>t.assets),[['daily-coffee-lunch'],['daily-study'],['daily-stationery'],['daily-meal'],['daily-yarn'],[],[]]);
 assert.equal(new Set(week.map(t=>t.layout)).size,7);
 assert.equal(week[3].unresolved,1);
 assert.equal(week[3].unpictured,1);
 assert.match(sceneArt(week[3],'plate'),/1 笔待核对，未据此配图/);
 assert.doesNotMatch(sceneArt(week[3],'map'),/<img\b/,'a dining illustration must not sit behind an unresolved merchant node');
});
test('empty dates and unknown descriptions never acquire a guessed decorative subject',()=>{
 const empty=sceneFor('2026-11-06','date');
 assert.equal(empty.empty,true);assert.deepEqual(empty.assets,[]);
 assert.match(sceneArt(empty,'plate'),/这一页，留给空白/);
 for(const row of [{...transactions[0],unknownMerchant:true},{...transactions[0],category:'未分类'}]){
  const scene=sceneFor('2026-11-01','date',0,[row]);
  assert.deepEqual(scene.assets,[]);
  assert.match(sceneArt(scene,'plate'),/还没弄清的，先不配图/);
 }
 const unmatched=sceneFor('购物','category',0,[{...transactions[3],merchant:'已确认的普通商店'}]);
 assert.deepEqual(unmatched.assets,[]);
 assert.match(sceneArt(unmatched,'plate'),/没有合适的插画，保留笔记/);
});
test('moving the same content between dates or continuation pages preserves its subject',()=>{
 const items=transactions.slice(0,2),first=sceneFor('2026-11-01','date',0,items);
 for(const [date,part] of [['2026-11-02',0],['2026-12-01',0],['2027-02-12',1]]){
  const next=sceneFor(date,'date',part,items);
  assert.deepEqual(next.assets,first.assets);
  assert.deepEqual(next.contentCategories,first.contentCategories);
  assert.equal(next.heading,first.heading);
 }
 assert.notEqual(sceneFor('购物','category').layout,sceneFor('购物','category',1).layout);
});
test('human classification changes the subject without art rendering changing amounts, states or review history',()=>{
 const rows=structuredClone(transactions),state=freshState();
 const original=structuredClone(rows),before=evaluate(rows,state.budget),target=before.find(r=>r.id==='N06');
 assert.equal(target.status,'blue');
 assert.deepEqual(sceneFor('2026-11-04','date',0,[target]).assets,[]);
 const classified=reviewRecord(rows,state,'N06',{category:'教育',recognized:false});
 const stillUnknown=evaluate(rows,classified.budget,classified.edits).find(r=>r.id==='N06');
 assert.equal(stillUnknown.status,'blue');
 assert.deepEqual(sceneFor('2026-11-04','date',0,[stillUnknown]).assets,[]);
 const reviewed=reviewRecord(rows,classified,'N06',{category:'教育',recognized:true});
 const evaluated=evaluate(rows,reviewed.budget,reviewed.edits),after=evaluated.find(r=>r.id==='N06');
 assert.equal(after.status,'green');assert.equal(after.amount,target.amount);
 const snapshot=structuredClone({evaluated,reviewed});
 const art=sceneFor('2026-11-04','date',0,[after]);
 assert.deepEqual(art.assets,['daily-study']);
 sceneArt(art,'plate');sceneArt(art,'map');
 assert.deepEqual({evaluated,reviewed},snapshot);
 assert.deepEqual(rows,original);
});
test('mixed pages limit illustrations to two and disclose unresolved or additional themes',()=>{
 const items=[transactions[0],transactions[2],transactions[6],transactions[5]],scene=sceneFor('2026-11-01','date',0,items);
 assert.equal(scene.assets.length,2);assert.equal(scene.additional,1);assert.equal(scene.unresolved,1);
 const html=sceneArt(scene,'plate');
 assert.equal([...html.matchAll(/<figure\b/g)].length,2);
 assert.match(html,/1 笔待核对，未据此配图/);
 assert.match(html,/其余主题请看右页明细/);
 const unmatched=sceneFor('2026-11-01','date',0,[transactions[2],{...transactions[3],merchant:'已确认的普通商店'}]);
 assert.equal(unmatched.unpictured,1);
 assert.match(sceneArt(unmatched,'plate'),/1 笔暂无对应插画/);
});
