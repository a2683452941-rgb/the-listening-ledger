import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from '../lib/store.mjs';
import {PayPal} from '../lib/paypal.mjs';
import {AI} from '../lib/ai.mjs';
import {createAPI} from '../lib/api.mjs';
import {freshState,transactions} from '../public/seed.js';
import {reviewRecord,evaluate,totals} from '../public/domain.js';

const config={client:'fixture-app',secret:'fixture-secret',key:'fixture-key',base:'https://model.example/v1',model:'fixture-model',dailyLimit:100};
const response=(value,status=200)=>new Response(JSON.stringify(value),{status});
const event=(id,day,amount,currency='USD',extra={})=>({transaction_info:{transaction_id:id,transaction_initiation_date:day+'T02:00:00Z',transaction_updated_date:day+'T03:00:00Z',transaction_status:'S',transaction_event_code:'T0006',transaction_amount:{value:amount,currency_code:currency},transaction_subject:'Fixture purchase',...extra}});
const period=(start='2026-11-01',end='2026-11-07',currency='USD')=>({start,end,currency,total:10000,categories:{},version:1});
function fixture(t){
 const store=new Store(':memory:');t.after(()=>store.close());const control={rows:[],providerCalls:0,modelCalls:0,onModel:null};
 const paypal=new PayPal(config,store,async url=>{control.providerCalls++;if(String(url).includes('oauth2'))return response({access_token:'fixture-token'});const u=new URL(url),start=Date.parse(u.searchParams.get('start_date')),end=Date.parse(u.searchParams.get('end_date'));return response({transaction_details:control.rows.filter(r=>{const at=Date.parse(r.transaction_info.transaction_initiation_date);return at>=start&&at<=end;}),total_pages:1,page:1,account_number:'FIXTURE_ACCOUNT'});},()=>new Date('2026-11-10T08:00:00Z'));
 const ai=new AI(config,store,async(url,options)=>{control.modelCalls++;const input=JSON.parse(JSON.parse(options.body).messages[1].content);if(control.onModel)await control.onModel(input);const value=input.catalog?{factIds:['scope-total']}:{id:input.id,category:'教育',reason:'课程用途',evidence:[{field:'supplement',quote:'课程'}],question:null};return response({choices:[{message:{content:JSON.stringify(value)}}]});});
 return {store,paypal,control,api:createAPI({store,paypal,ai}),book:paypal.account+':USD'};
}
const sandboxState=b=>({...freshState(),budget:b,range:{start:b.start,end:b.end},scenario:null});
const classify=(api,book='demo:week',id='N06',supplement='课程')=>api('/api/ai/classify','POST',{book,id,supplement,consent:true});
const accept=(api,s,extra={})=>api('/api/ai/accept','POST',{book:s.book,id:s.input.id,suggestion:s.id,inputVersion:s.inputVersion,supplement:s.input.supplement,...extra});

test('sync requires selected sandbox book and uses saved budget, ignoring a forged narrow client budget',async t=>{
 const {api,store,control,book}=fixture(t);control.rows=[event('one','2026-11-01','-80.00'),event('two','2026-11-02','-40.00')];const b=period('2026-11-01','2026-11-30');await api('/api/state','POST',{book,state:sandboxState(b)});const first=await api('/api/sync','POST',{book,start:b.start,end:b.end});assert.equal(first.snapshot.records.length,2);const calls=control.providerCalls;
 await assert.rejects(()=>api('/api/sync','POST',{book,start:'2026-11-02',end:'2026-11-02',budget:period('2026-11-02','2026-11-02')}),/整个限额周期/);await assert.rejects(()=>api('/api/sync','POST',{start:b.start,end:b.end}),/不匹配/);await assert.rejects(()=>api('/api/sync','POST',{book:'demo:week',start:b.start,end:b.end}),/沙箱币种/);assert.equal(control.providerCalls,calls);assert.equal(store.get('state:'+book).budget.total,10000);
});

test('first sync needs no fabricated state, and an unsaved narrow follow-up preserves the baseline',async t=>{
 const {api,store,control,book,paypal}=fixture(t);control.rows=[event('one','2026-11-01','-80.00'),event('two','2026-11-02','-40.00')];const first=await api('/api/sync','POST',{book,start:'2026-11-01',end:'2026-11-07'});assert.equal(store.get('state:'+book),null);assert.equal(first.snapshot.records.length,2);await assert.rejects(()=>api('/api/sync','POST',{book,start:'2026-11-02',end:'2026-11-02'}),/整个限额周期/);assert.equal(paypal.baseline(book).revision,first.snapshot.revision);
});

test('bootstrap and summaries use per-currency pinned baselines even when latest source changes',async t=>{
 const {api,control,book,paypal}=fixture(t),cny=paypal.account+':CNY';control.rows=[event('USD-one','2026-11-01','-80.00'),event('CNY-one','2026-11-08','-40.00','CNY')];await api('/api/state','POST',{book,state:sandboxState(period())});const usd=await api('/api/sync','POST',{book,start:'2026-11-01',end:'2026-11-07'});await api('/api/state','POST',{book:cny,state:sandboxState(period('2026-11-08','2026-11-10','CNY'))});const next=await api('/api/sync','POST',{book:cny,start:'2026-11-08',end:'2026-11-10'}),boot=await api('/api/bootstrap','GET');assert.equal(boot.snapshot.revision,next.snapshot.revision);assert.equal(boot.baselines.USD.revision,usd.snapshot.revision);assert.equal(boot.baselines.CNY.revision,next.snapshot.revision);const recap=await api('/api/ai/summary','POST',{book,consent:true});assert.equal(recap.input.stats.spent,8000);assert.equal(recap.input.sourceRevision,usd.snapshot.revision);assert.equal(recap.input.coverage.sufficient,true);
});

test('two configured sandbox apps keep event identities, state and baseline pointers separate',async t=>{
 const {api,store,paypal,control,book}=fixture(t),b=period();control.rows=[event('same-provider-id','2026-11-01','-20.00')];await api('/api/state','POST',{book,state:sandboxState(b)});const first=await api('/api/sync','POST',{book,start:b.start,end:b.end});
 const other=new PayPal({...config,client:'other-fixture-app'},store,paypal.request,paypal.clock),otherBook=other.account+':USD',otherAPI=createAPI({store,paypal:other,ai:{status:()=>({configured:false})}});control.rows=[event('same-provider-id','2026-11-01','-70.00')];await otherAPI('/api/state','POST',{book:otherBook,state:sandboxState({...b,total:15000})});const second=await otherAPI('/api/sync','POST',{book:otherBook,start:b.start,end:b.end});assert.notEqual(first.snapshot.records[0].id,second.snapshot.records[0].id);assert.equal(paypal.baseline(book).records[0].amount,2000);assert.equal(other.baseline(otherBook).records[0].amount,7000);assert.equal(store.get('state:'+book).budget.total,10000);assert.equal(store.get('state:'+otherBook).budget.total,15000);await assert.rejects(()=>otherAPI('/api/state','POST',{book}),/不匹配/);
});

test('source version acknowledgment must match current source while unchanged old edits remain saved',async t=>{
 const {api,control,book,paypal}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];const first=await api('/api/sync','POST',{book,start:b.start,end:b.end}),id=first.snapshot.records[0].id;let state=reviewRecord(first.snapshot.records,sandboxState(b),id,{category:'购物',recognized:true});await api('/api/state','POST',{book,state});
 control.rows=[event('one','2026-11-01','-30.00','USD',{transaction_updated_date:'2026-11-03T00:00:00Z'})];const second=await api('/api/sync','POST',{book,start:b.start,end:b.end});await api('/api/state','POST',{book,state:{...state,volume:.2}});assert.equal(evaluate(second.snapshot.records,b,state.edits,second.snapshot)[0].status,'blue');
 for(const version of ['forged',first.snapshot.records[0].sourceVersion,undefined]){const invalid=structuredClone(state);invalid.edits[id]={...invalid.edits[id],category:'教育',manualReview:true,sourceVersion:version};if(version===undefined)delete invalid.edits[id].sourceVersion;await assert.rejects(()=>api('/api/state','POST',{book,state:invalid}),/来源版本/);}
 state=reviewRecord(second.snapshot.records,state,id,{category:'购物',recognized:true});await api('/api/state','POST',{book,state});assert.equal(evaluate(paypal.baseline(book).records,b,state.edits,paypal.baseline(book))[0].status,'green');
});

test('adopting only AI category preserves the old source acknowledgment and requires corrected amount review',async t=>{
 const {api,control,book}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];const first=await api('/api/sync','POST',{book,start:b.start,end:b.end}),id=first.snapshot.records[0].id;let state=reviewRecord(first.snapshot.records,sandboxState(b),id,{category:'购物',recognized:true});await api('/api/state','POST',{book,state});
 control.rows=[event('one','2026-11-01','-30.00','USD',{transaction_updated_date:'2026-11-03T00:00:00Z'})];const second=await api('/api/sync','POST',{book,start:b.start,end:b.end}),suggestion=await classify(api,book,id);state=(await accept(api,suggestion)).state;const current=evaluate(second.snapshot.records,b,state.edits,second.snapshot)[0];assert.equal(current.category,'教育');assert.equal(current.status,'blue');assert.match(current.reason,/提供方更新/);assert.equal(state.edits[id].sourceVersion,first.snapshot.records[0].sourceVersion);
});

test('first AI category save without a source acknowledgment cannot confirm an unknown merchant',async t=>{
 const {api,control,book}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];const snap=(await api('/api/sync','POST',{book,start:b.start,end:b.end})).snapshot,id=snap.records[0].id,state=sandboxState(b);state.edits[id]={category:'教育',unknownMerchant:true,duplicate:false,manualReview:false,reminder:false};await api('/api/state','POST',{book,state});assert.equal(evaluate(snap.records,b,state.edits,snap)[0].status,'blue');const forged=structuredClone(state);forged.edits[id].unknownMerchant=false;await assert.rejects(()=>api('/api/state','POST',{book,state:forged}),/来源版本/);
});

test('historical edits outside current cycle survive but cannot be inserted or changed',async t=>{
 const {api,control,book}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];const first=await api('/api/sync','POST',{book,start:b.start,end:b.end}),id=first.snapshot.records[0].id,state=reviewRecord(first.snapshot.records,sandboxState(b),id,{category:'购物',recognized:true});await api('/api/state','POST',{book,state});const next={...state,budget:period('2026-11-08','2026-11-10'),range:{start:'2026-11-08',end:'2026-11-10'}};await api('/api/state','POST',{book,state:next});await api('/api/sync','POST',{book,...next.range});await api('/api/state','POST',{book,state:{...next,volume:.2}});const changed=structuredClone(next);changed.edits[id].category='教育';await assert.rejects(()=>api('/api/state','POST',{book,state:changed}),/未知账单/);changed.edits={invented:{category:'购物',sourceVersion:'fake'}};await assert.rejects(()=>api('/api/state','POST',{book,state:changed}),/未知账单/);
});

test('classification acceptance atomically saves category only; repeat acknowledgment is idempotent',async t=>{
 const {api,store}=fixture(t),state=freshState();await api('/api/state','POST',{book:'demo:week',state});const s=await classify(api),result=await accept(api,s);assert.equal(result.accepted,true);assert.equal(result.category,'教育');assert.deepEqual(store.get('state:demo:week'),result.state);assert.deepEqual(result.state.edits.N06,{category:'教育'});assert.equal(result.state.history[0].after.unknownMerchant,true);const at=store.get('accept:'+s.id).at;await accept(api,s);assert.equal(store.get('accept:'+s.id).at,at);assert.equal(store.get('state:demo:week').history.length,1);assert.equal(evaluate(transactions,result.state.budget,result.state.edits)[5].status,'blue');assert.equal(totals(evaluate(transactions,result.state.budget,result.state.edits),result.state.budget).spent,32000);const latest=(await api('/api/ai/latest','POST',{book:'demo:week',id:'N06'})).suggestion;assert.equal(latest.stale,false);assert.equal(latest.acceptedAt,at);
});

test('failed acceptance write rolls back both category history and accepted marker; retry applies once',async t=>{
 const {api,store}=fixture(t),state=freshState();await api('/api/state','POST',{book:'demo:week',state});const suggestion=await classify(api),put=store.put.bind(store);let failed=false;store.put=(key,value)=>{if(key==='accept:'+suggestion.id&&!failed){failed=true;throw Error('fixture disk failure');}return put(key,value);};await assert.rejects(()=>accept(api,suggestion),/disk failure/);assert.deepEqual(store.get('state:demo:week'),state);assert.equal(store.get('accept:'+suggestion.id),null);const retry=await accept(api,suggestion);assert.equal(retry.state.history.length,1);assert.equal(retry.state.edits.N06.category,'教育');assert.ok(store.get('accept:'+suggestion.id).at);
});

test('acceptance requires saved state and an already matching category does not invent a history update',async t=>{
 const {api,store}=fixture(t),suggestion=await classify(api);await assert.rejects(()=>accept(api,suggestion),/先保存/);assert.equal(store.get('accept:'+suggestion.id),null);const state=freshState();state.edits.N06={category:'教育'};await api('/api/state','POST',{book:'demo:week',state});const matching=await classify(api),result=await accept(api,matching);assert.equal(result.unchanged,true);assert.deepEqual(store.get('state:demo:week'),state);assert.equal(store.get('accept:'+matching.id),null);
});

test('classification acceptance rejects changed supplement, missing version, foreign book and old version suggestions',async t=>{
 const {api,store,book}=fixture(t);await api('/api/state','POST',{book:'demo:week',state:freshState()});const s=await classify(api);await assert.rejects(()=>accept(api,s,{supplement:'不是课程'}),/已变化/);await assert.rejects(()=>accept(api,s,{inputVersion:undefined}),/已变化/);await assert.rejects(()=>accept(api,s,{book}),/不匹配/);const legacy={...s,id:'legacy',input:{id:'N06'},inputVersion:'old'};store.put('suggestion:legacy',legacy);await assert.rejects(()=>accept(api,legacy,{supplement:'课程'}),/已变化/);assert.equal(store.get('accept:'+s.id),null);
});

test('classification result arriving after a human review change is rejected and marked stale on reopen',async t=>{
 const {api,control}=fixture(t);await api('/api/state','POST',{book:'demo:week',state:freshState()});control.onModel=async()=>{await api('/api/state','POST',{book:'demo:week',state:reviewRecord(transactions,freshState(),'N06',{category:'购物',recognized:false})});};await assert.rejects(()=>classify(api),/已变化/);const latest=await api('/api/ai/latest','POST',{book:'demo:week',id:'N06'});assert.equal(latest.suggestion.stale,true);await assert.rejects(()=>accept(api,latest.suggestion),/已变化/);
});

test('classification acceptance rejects a source amount correction even if descriptive text did not change',async t=>{
 const {api,control,book}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];await api('/api/state','POST',{book,state:sandboxState(b)});const first=await api('/api/sync','POST',{book,start:b.start,end:b.end}),id=first.snapshot.records[0].id,s=await classify(api,book,id);control.rows=[event('one','2026-11-01','-30.00','USD',{transaction_updated_date:'2026-11-03T00:00:00Z'})];await api('/api/sync','POST',{book,start:b.start,end:b.end});await assert.rejects(()=>accept(api,s),/已变化/);
});

test('summary arriving after budget change is rejected without replacing saved budget',async t=>{
 const {api,control,store}=fixture(t);await api('/api/state','POST',{book:'demo:week',state:freshState()});control.onModel=async()=>{const state=freshState();state.budget={...state.budget,total:20000,version:2};await api('/api/state','POST',{book:'demo:week',state});};await assert.rejects(()=>api('/api/ai/summary','POST',{book:'demo:week',consent:true}),/已变化/);assert.equal(store.get('state:demo:week').budget.total,20000);assert.equal((await api('/api/ai/latest','POST',{book:'demo:week',id:'summary'})).suggestion.stale,true);
});

test('summary arriving after source sync is rejected even when row count is unchanged',async t=>{
 const {api,control,book}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];await api('/api/state','POST',{book,state:sandboxState(b)});await api('/api/sync','POST',{book,start:b.start,end:b.end});control.onModel=async()=>{control.rows=[event('one','2026-11-01','-30.00','USD',{transaction_updated_date:'2026-11-03T00:00:00Z'})];await api('/api/sync','POST',{book,start:b.start,end:b.end});};await assert.rejects(()=>api('/api/ai/summary','POST',{book,consent:true}),/已变化/);
});

test('legacy source coverage cannot yield a favorable AI summary even if the model selects the total',async t=>{
 const {api,control,book,paypal,store}=fixture(t),b=period();control.rows=[event('one','2026-11-01','-20.00')];const snap=(await api('/api/sync','POST',{book,start:b.start,end:b.end})).snapshot;store.put('paypal-revision:'+paypal.account+':'+snap.revision,{records:snap.records,range:snap.range,syncedAt:snap.syncedAt,revision:snap.revision});await api('/api/state','POST',{book,state:sandboxState(b)});const result=await api('/api/ai/summary','POST',{book,consent:true});assert.equal(result.input.coverage.sufficient,false);assert.ok(result.result.mandatoryFactIds.includes('coverage'));assert.match(result.result.text,/补齐|核实|完整/);
});
