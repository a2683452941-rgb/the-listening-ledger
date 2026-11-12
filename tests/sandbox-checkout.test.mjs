import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SandboxCheckout} from '../lib/sandbox-checkout.mjs';
import {Store} from '../lib/store.mjs';
const response=(data,status=200)=>new Response(JSON.stringify(data),{status});
const payerId='QYR5Z8XDVJNXQ',otherPayerId='AJM9JTWQJCFTA',payerKey=createHash('sha256').update(payerId).digest('hex').slice(0,24);
function fixture(){
 const values=new Map(),store={get:k=>values.get(k),put:(k,v)=>values.set(k,structuredClone(v))},calls=[],config={client:'test-merchant',secret:'fixture-secret'};
 const control={status:'APPROVED',amount:'12.00',captureStatus:'COMPLETED',captureAttempts:0,failAfterCapture:false,accountId:payerId,payerId,createAttempts:0,orderId:'TESTORDER12345678',getError:null,failCreateOnce:false},createdIds=new Map();let requestBody;
 const order=()=>({id:control.orderId,intent:'CAPTURE',status:control.status,payment_source:{paypal:{account_id:control.accountId}},payer:{payer_id:control.payerId},purchase_units:[{...requestBody.purchase_units[0],amount:{currency_code:'USD',value:control.amount},...(control.status==='COMPLETED'?{payments:{captures:[{id:'TESTCAPTURE123',status:control.captureStatus,amount:{currency_code:'USD',value:'12.00'}}]}}:{})}]});
 const request=async(url,options)=>{calls.push({url,options});if(url.endsWith('/oauth2/token'))return response({access_token:'fixture-token'});if(url.endsWith('/capture')){control.captureAttempts++;control.status='COMPLETED';if(control.failAfterCapture)throw Error('sensitive network detail');return response({id:control.orderId});}if(options.method==='POST'){control.createAttempts++;requestBody=JSON.parse(options.body);const key=options.headers['PayPal-Request-Id'];if(!createdIds.has(key))createdIds.set(key,createdIds.size?'TESTORDER22345678':'TESTORDER12345678');control.orderId=createdIds.get(key);if(control.failCreateOnce){control.failCreateOnce=false;throw Error('sensitive create timeout');}return response({id:control.orderId,links:[{rel:'payer-action',href:'https://www.sandbox.paypal.com/checkoutnow?token='+control.orderId}]});}if(control.getError){if(control.getError instanceof Error)throw control.getError;return response(control.getError.body,control.getError.status);}return response(order());};
 return {checkout:new SandboxCheckout(config,store,request),store,request,config,calls,control};
}
test('creation is Sandbox only, fixed amount and reused across restart',async()=>{
 const f=fixture(),first=await f.checkout.create(),before=f.calls.length;
 const again=await new SandboxCheckout(f.config,f.store,f.request).create();assert.equal(again.orderId,first.orderId);assert.equal(f.calls.length,before);
 const create=f.calls.find(x=>x.url.endsWith('/v2/checkout/orders')),body=JSON.parse(create.options.body);
 assert.equal(body.purchase_units[0].amount.value,'12.00');assert.equal(body.purchase_units[0].amount.currency_code,'USD');assert.equal(body.purchase_units[0].custom_id,first.createId);assert.equal(create.options.headers['PayPal-Request-Id'],first.createId);assert.ok(f.calls.every(x=>x.url.startsWith('https://api-m.sandbox.paypal.com/')));
});
test('unknown callback order cannot trigger any PayPal request',async()=>{
 const f=fixture();await f.checkout.create();const before=f.calls.length;await assert.rejects(()=>f.checkout.capture('DIFFERENT_ORDER',payerKey),/不是本辅助工具/);assert.equal(f.calls.length,before);
});
test('unapproved order is checked but never captured',async()=>{
 const f=fixture(),s=await f.checkout.create();f.control.status='CREATED';await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/尚未确认买家批准/);assert.equal(f.control.captureAttempts,0);
});
test('wrong amount is rejected before any capture',async()=>{
 const f=fixture(),s=await f.checkout.create();f.control.amount='120.00';await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/金额不匹配/);assert.equal(f.control.captureAttempts,0);
});
test('approved order is captured once and completed state survives helper restart',async()=>{
 const f=fixture(),s=await f.checkout.create(),done=await f.checkout.capture(s.orderId,payerKey);assert.equal(done.captureId,'TESTCAPTURE123');assert.equal(done.stage,'completed');assert.equal(done.payerAccountKey,payerKey);const before=f.calls.length;
 const reopened=await new SandboxCheckout(f.config,f.store,f.request).capture(s.orderId,payerKey);assert.equal(reopened.captureId,done.captureId);assert.equal(f.control.captureAttempts,1);assert.equal(f.calls.length,before);
});
test('ambiguous capture timeout recovers by GET instead of a second capture',async()=>{
 const f=fixture(),s=await f.checkout.create();f.control.failAfterCapture=true;await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/结果尚未确认/);assert.equal(f.checkout.current().stage,'capturing');
 const done=await new SandboxCheckout(f.config,f.store,f.request).capture(s.orderId,payerKey);assert.equal(done.stage,'completed');assert.equal(f.control.captureAttempts,1);
});
test('pending capture cannot be reported completed',async()=>{
 const f=fixture(),s=await f.checkout.create();f.control.captureStatus='PENDING';await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/尚未确认为完整/);assert.notEqual(f.checkout.current().stage,'completed');
});

test('capture requires a verified ledger account key before any API request',async()=>{
 const f=fixture(),s=await f.checkout.create(),before=f.calls.length;
 for(const key of [undefined,null,'','bad','f'.repeat(23),'g'.repeat(24)])await assert.rejects(()=>f.checkout.capture(s.orderId,key),/查账账户/);
 assert.equal(f.calls.length,before);assert.equal(f.control.captureAttempts,0);
});

test('missing, conflicting or foreign payer IDs never trigger capture',async()=>{
 for(const ids of [[undefined,undefined],[payerId,otherPayerId],[otherPayerId,otherPayerId],[null,payerId],['',payerId]]){
  const f=fixture(),s=await f.checkout.create();[f.control.accountId,f.control.payerId]=ids;await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/付款账户/);assert.equal(f.control.captureAttempts,0);assert.equal(f.checkout.current().stage,'created');
 }
});

test('either official payer field can bind the same verified ledger account',async()=>{
 for(const missing of ['accountId','payerId']){const f=fixture(),s=await f.checkout.create();f.control[missing]=undefined;const done=await f.checkout.capture(s.orderId,payerKey);assert.equal(done.payerAccountKey,payerKey);assert.equal(f.control.captureAttempts,1);}
});

test('completed legacy records require a server payer check and never recapture',async()=>{
 const f=fixture(),s=await f.checkout.create();f.control.status='COMPLETED';f.checkout.save({...s,stage:'completed',captureId:'TESTCAPTURE123'});const before=f.calls.length,done=await f.checkout.capture(s.orderId,payerKey);assert.equal(done.payerAccountKey,payerKey);assert.equal(f.calls.length,before+2);assert.equal(f.control.captureAttempts,0);
 for(const status of ['COMPLETED','APPROVED']){const g=fixture(),old=await g.checkout.create();g.checkout.save({...old,stage:'completed',captureId:'TESTCAPTURE123'});g.control.status=status;g.control.accountId=g.control.payerId=otherPayerId;await assert.rejects(()=>g.checkout.capture(old.orderId,payerKey));assert.equal(g.control.captureAttempts,0);assert.equal(g.checkout.current().payerAccountKey,undefined);}
});

test('a bound order cannot move to another ledger and recovery rechecks its payer',async()=>{
 const f=fixture(),s=await f.checkout.create();f.control.failAfterCapture=true;await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/结果尚未确认/);assert.equal(f.checkout.current().payerAccountKey,payerKey);
 const before=f.calls.length;await assert.rejects(()=>f.checkout.capture(s.orderId,'f'.repeat(24)),/查账账户/);assert.equal(f.calls.length,before);
 f.control.accountId=f.control.payerId=otherPayerId;await assert.rejects(()=>f.checkout.capture(s.orderId,payerKey),/付款账户/);assert.equal(f.control.captureAttempts,1);assert.equal(f.checkout.current().stage,'capturing');
});
test('foreign approval domains are rejected and external details are not displayed',async()=>{
 const f=fixture(),request=async(url,options)=>url.endsWith('/oauth2/token')?response({access_token:'fixture-token'}):response({id:'TESTORDER12345678',links:[{rel:'payer-action',href:'https://www.paypal.com/checkoutnow'}]});
 const helper=new SandboxCheckout(f.config,f.store,request);await assert.rejects(()=>helper.create(),/不是预期的 PayPal Sandbox/);assert.ok(helper.current().orderId);
 const network=new SandboxCheckout(f.config,{get:()=>null,put:()=>{}},async()=>{throw Error('secret fixture-secret');});await assert.rejects(()=>network.create(),e=>!e.message.includes('fixture-secret')&&/认证连接未完成/.test(e.message));
});

const unavailable={status:404,body:{name:'RESOURCE_NOT_FOUND',debug_id:'fixture-debug-404',details:[{issue:'INVALID_RESOURCE_ID'}],message:'private response must stay hidden'}};
const ageOrder=(f,hours=4)=>f.checkout.save({...f.checkout.current(),createdAt:new Date(Date.now()-hours*3600000).toISOString()});

test('a stale unavailable created order is archived before one replacement is prepared without capture',async()=>{
 const f=fixture();await f.checkout.create();const old=ageOrder(f),before=f.calls.length;assert.equal((await f.checkout.create()).orderId,old.orderId);assert.equal(f.calls.length,before);
 f.control.getError=unavailable;const next=await f.checkout.renewUnavailable(old.orderId);assert.notEqual(next.orderId,old.orderId);assert.notEqual(next.createId,old.createId);assert.notEqual(next.captureRequestId,old.captureRequestId);assert.equal(next.previousOrderId,old.orderId);assert.equal(next.stage,'created');assert.equal(f.control.captureAttempts,0);assert.equal(f.control.createAttempts,2);
 const archived=f.store.get(f.checkout.key+':history:'+old.orderId);assert.equal(archived.orderId,old.orderId);assert.equal(archived.createId,old.createId);assert.equal(archived.captureRequestId,old.captureRequestId);assert.equal(archived.unavailableCheck.code,'RESOURCE_NOT_FOUND');assert.equal(archived.unavailableCheck.issue,'INVALID_RESOURCE_ID');assert.ok(!JSON.stringify(archived).includes('private response'));
 const after=f.calls.length;await assert.rejects(()=>f.checkout.renewUnavailable(old.orderId));assert.equal((await f.checkout.create()).orderId,next.orderId);assert.equal(f.calls.length,after);
});

test('replacement refuses recent, mismatched or capture-touched orders before API calls',async()=>{
 for(const patch of [{createdAt:new Date().toISOString()},{createdAt:'invalid'},{stage:'capturing'},{stage:'completed'},{captureId:'TESTCAPTURE123'},{payerAccountKey:payerKey},{captureAttemptedAt:new Date().toISOString()},{completedAt:new Date().toISOString()}]){
  const f=fixture();await f.checkout.create();const old=ageOrder(f);f.checkout.save({...old,...patch});const before=f.calls.length;await assert.rejects(()=>f.checkout.renewUnavailable(old.orderId));assert.equal(f.calls.length,before);assert.equal(f.control.createAttempts,1);
 }
 const f=fixture();await f.checkout.create();ageOrder(f);const before=f.calls.length;await assert.rejects(()=>f.checkout.renewUnavailable('ANOTHER_ORDER'));assert.equal(f.calls.length,before);
});

test('queryable orders and ambiguous lookup failures never trigger replacement',async()=>{
 const cases=[{status:'APPROVED'},{status:'COMPLETED'},{status:'PAYER_ACTION_REQUIRED'},{error:{status:403,body:{name:'NOT_AUTHORIZED'}}},{error:{status:500,body:{name:'INTERNAL_SERVER_ERROR'}}},{error:{status:404,body:{name:'RESOURCE_NOT_FOUND'}}},{error:{status:404,body:{name:'RESOURCE_NOT_FOUND',details:[{issue:'OTHER_REASON'}]}}},{error:{status:404,body:{name:'OTHER_CODE',details:[{issue:'INVALID_RESOURCE_ID'}]}}},{error:Error('sensitive timeout')}];
 for(const entry of cases){const f=fixture();await f.checkout.create();const old=ageOrder(f);if(entry.status)f.control.status=entry.status;f.control.getError=entry.error||null;await assert.rejects(()=>f.checkout.renewUnavailable(old.orderId));assert.deepEqual(f.checkout.current(),old);assert.equal(f.control.createAttempts,1);assert.equal(f.control.captureAttempts,0);assert.equal(f.store.get(f.checkout.key+':history:'+old.orderId),undefined);}
});

test('uncertain replacement creation keeps its request ID and cannot renew the old order again',async()=>{
 const f=fixture();await f.checkout.create();const old=ageOrder(f);f.control.getError=unavailable;f.control.failCreateOnce=true;await assert.rejects(()=>f.checkout.renewUnavailable(old.orderId),/结果尚未确认/);const pending=f.checkout.current();assert.equal(pending.stage,'creating');assert.equal(pending.previousOrderId,old.orderId);assert.ok(!pending.orderId);assert.ok(f.store.get(f.checkout.key+':history:'+old.orderId));
 const before=f.calls.length;await assert.rejects(()=>f.checkout.renewUnavailable(old.orderId));assert.equal(f.calls.length,before);const done=await f.checkout.create();assert.equal(done.createId,pending.createId);assert.equal(done.captureRequestId,pending.captureRequestId);const posts=f.calls.filter(x=>x.url.endsWith('/v2/checkout/orders'));assert.equal(posts[1].options.headers['PayPal-Request-Id'],posts[2].options.headers['PayPal-Request-Id']);assert.equal(f.control.captureAttempts,0);
});

test('order lookup errors expose only sanitized diagnostic fields, never provider response content',async()=>{
 const f=fixture(),saved=await f.checkout.create();f.control.getError=unavailable;await assert.rejects(()=>f.checkout.capture(saved.orderId,payerKey),error=>error.httpStatus===404&&error.code==='RESOURCE_NOT_FOUND'&&error.issue==='INVALID_RESOURCE_ID'&&error.operation==='get-order'&&error.debugId==='fixture-debug-404'&&!JSON.stringify(error).includes('private response')&&!error.message.includes('private response'));assert.equal(f.control.captureAttempts,0);
});

test('failed replacement-state write rolls back the archive and preserves the current order',async t=>{
 const f=fixture();await f.checkout.create();const old=ageOrder(f),store=new Store(':memory:');t.after(()=>store.close());const checkout=new SandboxCheckout(f.config,store,f.request);store.put(checkout.key,old);f.control.getError=unavailable;
 const put=store.put.bind(store);store.put=(key,value)=>{if(key===checkout.key)throw Error('fixture save failure');return put(key,value);};await assert.rejects(()=>checkout.renewUnavailable(old.orderId),/fixture save failure/);assert.deepEqual(checkout.current(),old);assert.equal(store.get(checkout.key+':history:'+old.orderId),null);assert.equal(f.control.createAttempts,1);assert.equal(f.control.captureAttempts,0);
});
