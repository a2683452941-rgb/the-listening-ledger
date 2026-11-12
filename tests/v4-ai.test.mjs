import test from 'node:test';
import assert from 'node:assert/strict';
import {AI,classificationInput,classificationRevision,inputVersion,validateSuggestion} from '../lib/ai.mjs';
import {recapFacts,renderRecap,validateRecapSelection} from '../public/recap.js';
import {freshState,scenarioRows} from '../public/seed.js';

const memory=()=>{const data=new Map();return {get:(key,fallback=null)=>data.has(key)?structuredClone(data.get(key)):fallback,put:(key,value)=>{data.set(key,structuredClone(value));return value;}};};
const config={key:'test-only',base:'https://model.example/v1',model:'test-model',dailyLimit:40};
const response=value=>new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(value)}}]}),{status:200,headers:{'Content-Type':'application/json'}});
const facts=()=>recapFacts(scenarioRows('week'),freshState());

test('v4 recap rejects Chinese fabricated amounts and every extra model field',async()=>{
 const store=memory(),input=facts();let value={text:'本次共花费一万元，全部在预算内。',recordIds:[]};
 const ai=new AI(config,store,async()=>response(value));
 await assert.rejects(()=>ai.call('summary',input,'demo:week'),/依据/);
 value={factIds:['scope-total'],text:'本次共花费一万元。'};
 await assert.rejects(()=>ai.call('summary',input,'demo:week'),/依据/);
 assert.equal(store.get('latest-ai:demo:week:summary'),null);
});

test('v4 recap enforces one to three unique existing fact IDs',()=>{
 const input=facts();
 for(const value of [null,[],{}, {factIds:[]},{factIds:['missing']},{factIds:['scope-total','scope-total']},{factIds:[12]},{factIds:['scope-total','period-total','total-over','review:N06']},{factIds:['scope-total'],recordIds:['N06']}])assert.throws(()=>validateRecapSelection(value,input),/依据/);
 assert.deepEqual(validateRecapSelection({factIds:['scope-total','review:N06']},input),['scope-total','review:N06']);
});

test('v4 program-generated recap retains mandatory total and category overspending despite model omission',async()=>{
 const input=facts(),ai=new AI(config,memory(),async()=>response({factIds:['review:N06']}));
 const result=await ai.call('summary',input,'demo:week');
 assert.match(result.result.text,/总限额.*¥320.00.*¥300.00.*¥20.00/);
 assert.match(result.result.text,/餐饮分类限额.*¥110.00.*¥100.00.*¥10.00/);
 assert.ok(result.result.mandatoryFactIds.includes('total-over'));
 assert.ok(result.result.factIds.includes('review:N06'));
 assert.equal(result.result.source,'verified-facts');
 assert.equal(result.source,'live-model');
 assert.ok(result.result.recordIds.includes('N06'));
 assert.equal(result.promptVersion,4.1);
});

test('v4 missing PayPal coverage stays mandatory and never promises remaining allowance',()=>{
 const rows=scenarioRows('week').map(r=>({...r,source:'paypal-sandbox'})),input=recapFacts(rows,freshState(),freshState().range,null),result=renderRecap(input,['scope-total']);
 assert.equal(input.coverage.sufficient,false);
 assert.ok(result.mandatoryFactIds.includes('coverage'));
 assert.match(result.text,/未验证完整|尚未补齐/);
 assert.match(result.text,/至少超出 ¥20.00/);
 assert.doesNotMatch(result.text,/剩余 ¥/);
 assert.equal(recapFacts(rows,freshState()).coverage.sufficient,false);
});

test('v4 reading scope totals and full-period alert facts are explicitly separate',()=>{
 const state=freshState(),input=recapFacts(scenarioRows('week'),state,{start:'2026-11-05',end:'2026-11-05'}),result=renderRecap(input,['scope-total']);
 assert.equal(input.stats.spent,4000);
 assert.match(result.text,/11-05.*¥40.00/);
 const total=input.catalog.find(f=>f.factId==='total-over');
 assert.equal(total.verifiedParameters.amount,32000);
 assert.equal(total.verifiedParameters.over,2000);
 assert.equal(input.catalog.find(f=>f.factId==='scope-total').verifiedParameters.amount,4000);
});

test('v4 recap cache invalidates for budget, review, scope, source and language changes',()=>{
 const rows=scenarioRows('week'),state=freshState(),initial=recapFacts(rows,state),before=inputVersion(initial);
 const cases=[];
 const limit=structuredClone(state);limit.budget={...limit.budget,total:40000,version:2};cases.push(recapFacts(rows,limit));
 const review=structuredClone(state);review.edits.N06={category:'教育',unknownMerchant:false};review.history.push({id:'N06'});cases.push(recapFacts(rows,review));
 cases.push(recapFacts(rows,state,{start:'2026-11-04',end:'2026-11-04'}));
 cases.push(recapFacts(rows,state,{...state.range,language:'en'}));
 cases.push(recapFacts(rows,state,state.range,{revision:'new',paginationComplete:false}));
 for(const next of cases)assert.notEqual(inputVersion(next),before);
});

test('v4 summary fallback and English text use the same verified numeric facts',()=>{
 const input=facts(),zh=renderRecap(input),en=renderRecap(input,undefined,'en');
 assert.equal(zh.source,'verified-facts');
 assert.deepEqual(zh.recordIds,en.recordIds);
 assert.match(en.text,/Total limit:.*320.00.*300.00.*20.00/);
 assert.match(en.text,/before refunds/);
 assert.ok(en.facts.every(f=>input.catalog.some(c=>c.factId===f.factId)));
});

test('v4 empty scope never calls the model and rule recap stays empty',async()=>{
 const state=freshState(),input=recapFacts(scenarioRows('week'),state,{start:'2026-12-01',end:'2026-12-01'});let calls=0;
 const ai=new AI(config,memory(),async()=>{calls++;return response({factIds:['scope-total']});});
 await assert.rejects(()=>ai.call('summary',input,'demo:week'),/依据/);
 assert.equal(calls,0);
 assert.equal(ai.status().used,0);
 assert.equal(renderRecap(input).text,'');
});

test('v4 classification version detects source changes without disclosing amounts or accounts',()=>{
 const row={...scenarioRows('week')[5],account:'private-account',transactionId:'private-transaction',secret:'do-not-send'},a=classificationInput(row,'线上课程',{reviewRevision:'one'});
 for(const field of ['amount','account','transactionId','secret'])assert.equal(a[field],undefined);
 assert.notEqual(classificationRevision(row),classificationRevision({...row,amount:3000}));
 assert.notEqual(inputVersion(a),inputVersion(classificationInput(row,'线上课程',{reviewRevision:'two'})));
 assert.notEqual(inputVersion(a),inputVersion(classificationInput(row,'购买软件',{reviewRevision:'one'})));
 assert.notEqual(inputVersion(a),inputVersion(classificationInput(row,'线上课程',{reviewRevision:'one',language:'en'})));
 const bad={id:row.id,category:'教育',reason:'课程',evidence:[null]};
 assert.throws(()=>validateSuggestion(bad,a),/引用/);
});

test('v4 recap catalog excludes raw merchant names and retains manual category change evidence',()=>{
 const state=freshState();state.edits.N06={category:'教育',unknownMerchant:false};
 const input=recapFacts(scenarioRows('week'),state);
 assert.doesNotMatch(JSON.stringify(input),/松果咖啡|DEMO\*042/);
 const result=renderRecap(input,['category-change:N06']);
 assert.match(result.text,/未分类.*教育/);
 assert.match(result.text,/不等于确认商户/);
 assert.ok(result.recordIds.includes('N06'));
});
