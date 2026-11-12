import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from '../lib/store.mjs';
import {PayPal,normalize,queryWindows} from '../lib/paypal.mjs';
import {evaluate,totals,budgetCoverage,reviewRecord,chapters} from '../public/domain.js';
import {budgetPreview} from '../public/budget.js';

const now='2026-11-10T08:00:00.000Z',config={client:'fixture-app',secret:'fixture-secret'};
const clock=()=>new Date(now);
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
const event=(id,day,value,currency='USD',extra={})=>({transaction_info:{transaction_id:id,transaction_event_code:'T0006',transaction_initiation_date:day+'T02:00:00Z',transaction_updated_date:day+'T03:00:00Z',transaction_status:'S',transaction_amount:{currency_code:currency,value},transaction_subject:'Fixture purchase',...extra}});
const budget=(start='2026-11-01',end='2026-11-30',currency='USD')=>({start,end,currency,total:10000,categories:{},version:1});
const storeFor=t=>{const s=new Store(':memory:');t.after(()=>s.close());return s;};
function fixture(t){const s=storeFor(t),control={rows:[],calls:0,mode:'ok'};const paypal=new PayPal(config,s,async url=>{control.calls++;if(String(url).includes('oauth2'))return response({access_token:'fixture-token'});const u=new URL(url),p=Number(u.searchParams.get('page'));if(control.mode==='403')return response({},403);if(control.mode==='fail-page-two'&&p===2)return response({},503);const start=Date.parse(u.searchParams.get('start_date')),end=Date.parse(u.searchParams.get('end_date')),rows=control.rows.filter(r=>{const at=Date.parse(r.transaction_info.transaction_initiation_date);return at>=start&&at<=end;});return response({transaction_details:rows,total_pages:control.mode==='fail-page-two'?2:1,page:p,account_number:'FIXTURE_ACCOUNT'});},clock);return {s,control,paypal,book:paypal.account+':USD'};}
function confirmed(rows){return Object.fromEntries(rows.map(r=>[r.id,{category:'购物',unknownMerchant:false,sourceVersion:r.sourceVersion}]));}

test('narrow requery cannot replace 120-dollar monthly baseline with 40 dollars',async t=>{
 const {paypal,control,book}=fixture(t),b=budget();control.rows=[event('one','2026-11-01','-80.00'),event('two','2026-11-02','-40.00')];
 const full=await paypal.sync(b.start,b.end,{book,budget:b}),before=evaluate(full.records,b,confirmed(full.records),full);assert.equal(before[1].status,'red');assert.equal(totals(before,b,full).spent,12000);
 const calls=control.calls;await assert.rejects(()=>paypal.sync('2026-11-02','2026-11-02',{book,budget:b}),/整个限额周期/);assert.equal(control.calls,calls);assert.equal(paypal.baseline(book).revision,full.revision);assert.equal(totals(evaluate(paypal.baseline(book).records,b,confirmed(full.records),full),b,full).spent,12000);
});

test('missing and legacy coverage never gives a definite remaining balance',()=>{
 const rows=[normalize(event('one','2026-11-01','-40.00'),'fixture',now)],b=budget('2026-11-01','2026-11-07'),legacy={records:rows,range:{start:b.start,end:b.end},syncedAt:now};
 for(const snap of [null,legacy]){const r=evaluate(rows,b,confirmed(rows),snap);assert.equal(r[0].status,'blue');assert.equal(totals(r,b,snap).remaining,null);assert.equal(r[0].coverage.sufficient,false);}
 assert.equal(evaluate(rows,b,confirmed(rows))[0].status,'blue');
});

test('coverage proves each requested empty day and pagination, not record min and max',async t=>{
 const {paypal,book}=fixture(t),b=budget('2026-11-01','2026-11-07'),snap=await paypal.sync(b.start,b.end,{book,budget:b});assert.equal(snap.records.length,0);assert.equal(budgetCoverage(b,snap,now).sufficient,true);
 const partial={...snap,completedWindows:[{start_date:'2026-10-31T16:00:00Z',end_date:'2026-11-01T15:59:59Z',pagesFetched:1,totalPages:1},{start_date:'2026-11-02T16:00:00Z',end_date:'2026-11-07T15:59:59Z',pagesFetched:1,totalPages:1}]};assert.equal(budgetCoverage(b,partial,now).state,'partial');
 assert.equal(budgetCoverage(b,{...snap,paginationComplete:false},now).sufficient,false);assert.equal(budgetCoverage(b,{...snap,completedWindows:[{...snap.completedWindows[0],pagesFetched:1,totalPages:2}]},now).sufficient,false);
});

test('a populated window followed by an explicitly empty response without details commits both windows',async t=>{
 const s=storeFor(t),rows=[event('adjustment','2026-10-20','100.00','USD',{transaction_event_code:'T1900'}),event('income','2026-10-22','56.00'),event('refund','2026-10-22','-26.00','USD',{transaction_event_code:'T1107'})],empty={total_items:0,total_pages:0,page:1},b=budget();
 const paypal=new PayPal(config,s,async url=>{if(String(url).includes('oauth2'))return response({access_token:'fixture-token'});const q=new URL(url).searchParams,window={account_number:'FIXTURE_ACCOUNT',start_date:q.get('start_date'),end_date:q.get('end_date'),last_refreshed_datetime:now};return response({...window,...(q.get('start_date').startsWith('2026-09-30')?{transaction_details:rows,page:1,total_items:3,total_pages:1}:empty)});},clock),book=paypal.account+':USD';
 const first=await paypal.sync('2026-10-01','2026-11-30',{book,budget:b});assert.equal(first.records.length,3);assert.equal(first.records.filter(r=>r.eligible).length,0);assert.deepEqual(first.completedWindows.map(w=>[w.pagesFetched,w.totalPages]),[[1,1],[1,0]]);assert.equal(budgetCoverage(b,first,now).sufficient,true);assert.equal(paypal.status().stage,'query-verified');
 delete empty.page;const repeated=await paypal.sync('2026-10-01','2026-11-30',{book,budget:b});assert.deepEqual(repeated.records.map(r=>r.id),first.records.map(r=>r.id));assert.equal(repeated.changes.length,0);assert.equal(paypal.baseline(book).revision,repeated.revision);
});

test('missing details without explicit numeric zero totals or with the wrong page preserves the baseline',async t=>{
 const {paypal,control,book}=fixture(t),b=budget();control.rows=[event('one','2026-11-01','-20.00')];const old=await paypal.sync(b.start,b.end,{book,budget:b});
 for(const result of [{total_pages:0,page:1},{total_items:0,page:1},{total_items:1,total_pages:0,page:1},{total_items:0,total_pages:1,page:1},{total_items:'0',total_pages:0,page:1},{total_items:0,total_pages:0,page:2},{transaction_details:null,total_items:0,total_pages:0,page:1}]){
  paypal.request=async url=>String(url).includes('oauth2')?response({access_token:'fixture-token'}):response(result);await assert.rejects(()=>paypal.sync(b.start,b.end,{book,budget:b}),/分页/);assert.deepEqual(paypal.baseline(book),old);
 }
});

test('an empty omitted list on page two cannot conceal changed pagination',async t=>{
 const {paypal,control,book}=fixture(t),b=budget();control.rows=[event('one','2026-11-01','-20.00')];const old=await paypal.sync(b.start,b.end,{book,budget:b});
 paypal.request=async url=>String(url).includes('oauth2')?response({access_token:'fixture-token'}):response(new URL(url).searchParams.get('page')==='1'?{transaction_details:control.rows,page:1,total_items:2,total_pages:2}:{page:2,total_items:0,total_pages:0});
 await assert.rejects(()=>paypal.sync(b.start,b.end,{book,budget:b}),/分页/);assert.deepEqual(paypal.baseline(book),old);
});

test('a future budget produces no reverse interval or API request and preserves baseline',async t=>{
 const {paypal,control,book}=fixture(t),oldBudget=budget('2026-11-01','2026-11-07'),old=await paypal.sync(oldBudget.start,oldBudget.end,{book,budget:oldBudget}),calls=control.calls;
 const future=budget('2026-12-01','2026-12-31'),oldStatus=paypal.status();await assert.rejects(()=>paypal.sync(future.start,future.end,{book,budget:future}),/尚未开始/);assert.equal(control.calls,calls);assert.deepEqual(paypal.status(),oldStatus);assert.equal(paypal.baseline(book).revision,old.revision);assert.equal(budgetCoverage(future,old,now).state,'future');assert.equal(budgetCoverage(future,undefined,now).state,'future');assert.deepEqual(queryWindows(future.start,future.end,now),[]);
});

test('ongoing cycle stops at current query time and is only complete for its requested window',async t=>{
 const {paypal,book}=fixture(t),b=budget(),snap=await paypal.sync(b.start,b.end,{book,budget:b});assert.equal(snap.requestedEnd,'2026-11-30');assert.equal(snap.effectiveCutoff,now);assert.equal(snap.coverageState,'completeForRequestedWindow');assert.equal(budgetCoverage(b,snap,now).sufficient,true);assert.match(budgetCoverage(b,snap,now).message,/报表可能延迟/);
});

test('currency books pin independent baseline revisions rather than sharing latest range',async t=>{
 const {paypal,book}=fixture(t),cny=paypal.account+':CNY',usdBudget=budget('2026-11-01','2026-11-07'),cnyBudget=budget('2026-11-01','2026-11-10','CNY');
 const usd=await paypal.sync(usdBudget.start,usdBudget.end,{book,budget:usdBudget}),cnySnap=await paypal.sync(cnyBudget.start,cnyBudget.end,{book:cny,budget:cnyBudget});assert.equal(paypal.baseline(book).revision,usd.revision);
 const changed=budget('2026-11-08','2026-11-10'),updated=await paypal.sync(changed.start,changed.end,{book,budget:changed});assert.equal(paypal.baseline(cny).revision,cnySnap.revision);assert.equal(paypal.baseline(book).revision,updated.revision);assert.equal(paypal.snapshot(usd.revision).revision,usd.revision);assert.equal(updated.previousRevision,usd.revision);
});

test('partial failure keeps current baseline, revision and edits unchanged',async t=>{
 const {paypal,control,book,s}=fixture(t),b=budget();control.rows=[event('one','2026-11-01','-20.00')];const old=await paypal.sync(b.start,b.end,{book,budget:b});const state={edits:confirmed(old.records)};s.put('state:'+book,state);control.mode='fail-page-two';await assert.rejects(()=>paypal.sync(b.start,b.end,{book,budget:b}),/503/);assert.deepEqual(paypal.baseline(book),old);assert.deepEqual(s.get('state:'+book),state);
});

test('source amount change keeps identity and requires a fresh human confirmation',async t=>{
 const {paypal,control,book}=fixture(t),b=budget();control.rows=[event('one','2026-11-01','-20.00')];const before=await paypal.sync(b.start,b.end,{book,budget:b}),edits=confirmed(before.records);control.rows=[event('one','2026-11-01','-30.00','USD',{transaction_updated_date:'2026-11-03T00:00:00Z'})];const after=await paypal.sync(b.start,b.end,{book,budget:b});assert.equal(after.records[0].id,before.records[0].id);assert.equal(evaluate(after.records,b,edits,after)[0].status,'blue');assert.equal(after.changes[0].before.amount,2000);
 const state=reviewRecord(after.records,{edits,history:[]},after.records[0].id,{category:'购物',recognized:true});assert.equal(state.edits[after.records[0].id].sourceVersion,after.records[0].sourceVersion);assert.equal(evaluate(after.records,b,state.edits,after)[0].status,'green');
});

test('blue incomplete coverage preserves known red overage and preview withholds remaining',()=>{
 const rows=[normalize(event('one','2026-11-01','-120.00'),'fixture',now)],b=budget(),edits=confirmed(rows),evaluated=evaluate(rows,b,edits,null);assert.equal(evaluated[0].status,'blue');assert.equal(evaluated[0].alerts[0].over,2000);assert.match(evaluated[0].alerts[0].text,/至少超出/);assert.equal(totals(evaluated,b,null).remaining,null);assert.equal(budgetPreview(rows,b,{...b,total:15000},edits,null).stats.remaining,null);
});

test('purchase gross excludes income, refunds, transfer, payout, fee and unclassified events',()=>{
 const examples=[event('purchase','2026-11-01','-80.00'),event('refund','2026-11-01','80.00','USD',{transaction_event_code:'T1107'}),event('income','2026-11-01','80.00'),event('transfer','2026-11-01','-80.00','USD',{transaction_event_code:'T0300'}),event('payout','2026-11-01','-80.00','USD',{transaction_event_code:'T0001'}),event('fee','2026-11-01','-2.00','USD',{transaction_event_code:'T0100'}),event('unknown','2026-11-01','-80.00','USD',{transaction_event_code:'T9999'})].map(r=>normalize(r,'fixture',now));assert.equal(examples.filter(r=>r.eligible).length,1);assert.equal(examples.filter(r=>r.eligible).reduce((n,r)=>n+r.amount,0),8000);
});

test('verified purchase contexts include postage, gift purchases, auctions and POS; generic channels remain unclassified',()=>{
 for(const code of ['T0002','T0003','T0004','T0005','T0006','T0007','T0008','T0009','T0010','T0012','T0018'])assert.equal(normalize(event(code,'2026-11-01','-12.00','USD',{transaction_event_code:code}),'fixture',now).eligible,true,code);
 for(const code of ['T0000','T0001','T0011','T0013','T0014','T0015','T0016','T0017','T0019','T0020','T0021','T0022','T0023','T0200','T1107','T1115','T1120'])assert.equal(normalize(event(code,'2026-11-01','-12.00','USD',{transaction_event_code:code}),'fixture',now).eligible,false,code);
});

test('general account corrections are adjustments in either direction, never purchases or income',()=>{
 for(const value of ['120.00','-120.00']){const row=normalize(event('correction','2026-11-01',value,'USD',{transaction_event_code:'T1900'}),'fixture',now);assert.equal(row.type,'账户转账或调整');assert.equal(row.reason,'账户转账或调整');assert.equal(row.eligible,false);}
});

test('repeated sync deduplicates events, keeps current source confirmation and history',async t=>{
 const {paypal,control,book}=fixture(t),b=budget();control.rows=[event('one','2026-11-01','-20.00'),event('one','2026-11-01','-20.00')];const first=await paypal.sync(b.start,b.end,{book,budget:b}),second=await paypal.sync(b.start,b.end,{book,budget:b});assert.equal(second.records.length,1);assert.equal(second.records[0].sourceVersion,first.records[0].sourceVersion);assert.equal(second.changes.length,0);assert.equal(evaluate(second.records,b,confirmed(first.records),second)[0].status,'green');
});

test('snapshot and book pointer commit atomically when a write fails',async t=>{
 const {paypal,s,book}=fixture(t),b=budget(),old=await paypal.sync(b.start,b.end,{book,budget:b}),put=s.put.bind(s);let failed=false;s.put=(key,value)=>{if(key==='paypal-baseline:'+book&&!failed){failed=true;throw Error('simulated disk write failure');}return put(key,value);};await assert.rejects(()=>paypal.sync(b.start,b.end,{book,budget:b}),/disk write/);assert.equal(paypal.snapshot().revision,old.revision);assert.equal(paypal.baseline(book).revision,old.revision);
});

test('mismatched book account and currency are rejected before external work',async t=>{
 const {paypal,book,control}=fixture(t);await assert.rejects(()=>paypal.sync('2026-11-01','2026-11-07',{book:'another:USD',budget:budget()}),/不匹配/);await assert.rejects(()=>paypal.sync('2026-11-01','2026-11-07',{book,budget:budget('2026-11-01','2026-11-07','CNY')}),/币种/);assert.equal(control.calls,0);
});

test('equal allowance, one-cent excess, zero and unset limits have exact distinct results',()=>{
 const b=budget('2026-11-01','2026-11-07'),base={time:'2026-11-01T10:00:00+08:00',merchant:'Fixture',category:'购物',currency:'USD',source:'demo',unknownMerchant:false},rows=[{...base,id:'a',amount:10000},{...base,id:'b',amount:1}],result=evaluate(rows,b);
 assert.equal(result[0].status,'green');assert.equal(result[1].status,'red');assert.equal(result[1].alerts.find(a=>a.kind==='total').over,1);assert.equal(totals(result,b).spent,10001);
 assert.equal(evaluate([{...base,id:'zero',amount:0}],{...b,total:0})[0].status,'green');assert.equal(evaluate([{...base,id:'cent',amount:1}],{...b,total:0})[0].status,'red');assert.equal(evaluate([{...base,id:'none',amount:0}],{...b,total:null})[0].status,'blue');
});

test('same-time IDs sort deterministically across pagination and +08 day boundaries',()=>{
 const b=budget('2026-11-01','2026-11-07'),rows=Array.from({length:14},(_,i)=>({id:String(i).padStart(2,'0'),time:'2026-11-01T10:00:00+08:00',merchant:'Fixture',category:'购物',currency:'USD',source:'demo',unknownMerchant:false,amount:1000})),forward=evaluate(rows,b),reverse=evaluate([...rows].reverse(),b);
 assert.deepEqual(reverse.map(r=>[r.id,r.cumulative,r.status]),forward.map(r=>[r.id,r.cumulative,r.status]));const pages=chapters(reverse,{start:'2026-11-01',end:'2026-11-01'},'date');assert.deepEqual(pages.flatMap(p=>p.items.map(r=>r.id)),rows.map(r=>r.id));assert.equal(new Set(pages.flatMap(p=>p.items.map(r=>r.id))).size,14);
 const before=normalize(event('before','2026-11-01','-1.00','USD',{transaction_initiation_date:'2026-11-01T15:59:59Z'}),'fixture',now),after=normalize(event('after','2026-11-01','-1.00','USD',{transaction_initiation_date:'2026-11-01T16:00:00Z'}),'fixture',now);assert.equal(before.time.slice(0,10),'2026-11-01');assert.equal(after.time.slice(0,10),'2026-11-02');
});
