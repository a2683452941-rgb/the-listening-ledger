import {evaluate,dayOf,validateRange,budgetCoverage,totals,money} from './domain.js';

const categoryNames={餐饮:'Dining',购物:'Shopping',教育:'Education',交通:'Transport',娱乐:'Entertainment',未分类:'Uncategorized'};
const factError=()=>Error('回顾无法对应账单依据，请重试或查看规则摘要。');

// Select reading facts without changing the budget period used to explain alerts.
export function recapFacts(rows,state,scope=state.range,snapshot){
 const range=validateRange(scope.start,scope.end),evaluated=evaluate(rows,state.budget,state.edits,snapshot);
 let selected=evaluated.filter(r=>dayOf(r)>=range.start&&dayOf(r)<=range.end);
 if(scope.recordIds!==undefined){
  if(!Array.isArray(scope.recordIds)||scope.recordIds.length>250||new Set(scope.recordIds).size!==scope.recordIds.length||scope.recordIds.some(id=>!selected.some(r=>r.id===id)))throw Error('回顾范围包含无效账单。');
  selected=selected.filter(r=>scope.recordIds.includes(r.id));
 }
 const known=r=>Number.isSafeInteger(r.amount)&&r.amount>=0&&r.currency===state.budget.currency;
 const actualSnapshot=snapshot===undefined&&rows.some(r=>r.source==='paypal-sandbox')?null:snapshot;
 const coverage=budgetCoverage(state.budget,actualSnapshot),period=totals(evaluated,state.budget,actualSnapshot),language=(scope.language??state.language)==='en'?'en':'zh-CN';
 const sourceRevision=snapshot?.revision||snapshot?.syncedAt||(rows.some(r=>r.source==='paypal-sandbox')?'unverified':'demo-v1');
 const input={schemaVersion:4,language,scope:{...range,...(scope.recordIds?{recordIds:scope.recordIds}:{})},currency:state.budget.currency,budgetVersion:state.budget.version,budgetPeriod:{start:state.budget.start,end:state.budget.end},sourceRevision,reviewRevision:state.reviewRevision??state.history?.length??0,coverage,stats:{count:selected.length,spent:selected.filter(known).reduce((sum,r)=>sum+r.amount,0),review:selected.filter(r=>r.status==='blue').length,missing:selected.filter(r=>!known(r)).length},records:selected.map(r=>({id:r.id,category:r.category,status:r.status,reasons:[...r.doubts,...r.alerts.map(x=>x.text)]})),catalog:[]};
 const add=(factId,kind,verifiedParameters,recordIds=[],mandatory=false)=>input.catalog.push({factId,kind,verifiedParameters,recordIds,mandatory,sourceRevision});
 if(!selected.length)return input;
 add('scope-total','scope-total',{amount:input.stats.spent,count:input.stats.count,start:range.start,end:range.end,currency:input.currency,missing:input.stats.missing},selected.map(r=>r.id));
 if(!coverage.sufficient)add('coverage','coverage',{message:coverage.message||'预算数据尚未补齐，暂时不能判断剩余额度。',state:coverage.state,cutoff:coverage.effectiveCutoff||null},[],true);
 const inPeriod=selected.filter(r=>r.inPeriod);
 if(inPeriod.length){
  add('period-total','period-total',{amount:period.spent,start:state.budget.start,end:state.budget.end,currency:input.currency,complete:coverage.sufficient,source:actualSnapshot===undefined?'demo':'paypal',cutoff:coverage.effectiveCutoff||null},[]);
  if(Number.isSafeInteger(state.budget.total)&&period.spent>state.budget.total)add('total-over','over',{amount:period.spent,limit:state.budget.total,over:period.spent-state.budget.total,currency:input.currency,category:null,complete:coverage.sufficient},inPeriod.filter(r=>r.alerts.some(a=>a.kind==='total')).map(r=>r.id),true);
  for(const category of Object.keys(state.budget.categories||{})){
   const cap=state.budget.categories[category],amount=evaluated.filter(r=>r.inPeriod&&r.counted&&r.category===category).reduce((sum,r)=>sum+r.amount,0);
   if(Number.isSafeInteger(cap)&&amount>cap)add('category-over:'+category,'over',{amount,limit:cap,over:amount-cap,currency:input.currency,category,complete:coverage.sufficient},inPeriod.filter(r=>r.category===category&&r.alerts.some(a=>a.kind==='category')).map(r=>r.id),true);
  }
 }
 for(const r of selected){
  if(r.doubts.length)add('review:'+r.id,'review',{category:r.category,reasons:r.doubts},[r.id]);
  if(r.reminder)add('reminder:'+r.id,'reminder',{},[r.id],true);
  const original=rows.find(x=>x.id===r.id);
  if(original&&r.category!==original.category)add('category-change:'+r.id,'category-change',{before:original.category,after:r.category},[r.id]);
 }
 return input;
}

function factText(fact,language){
 const p=fact.verifiedParameters,en=language==='en',amount=n=>money(n,p.currency),category=c=>en?(categoryNames[c]||c):c;
 switch(fact.kind){
  case 'scope-total':return en?`In ${p.start}–${p.end}, these ${p.count} records total ${amount(p.amount)} in completed purchases, before refunds.${p.missing?' Some amounts are excluded pending review.':''}`:`本次阅读范围 ${p.start}—${p.end} 共 ${p.count} 笔，已记录购买合计 ${amount(p.amount)}（未扣退款）。${p.missing?'有金额待核对记录未计入。':''}`;
  case 'period-total':return en?`The limit period ${p.start}–${p.end} contains ${amount(p.amount)} in imported purchases, before refunds. ${p.source==='demo'?'These are fictional demonstration records, not real funds.':p.complete?'This is based on the saved query window, not a live account balance.':'More records are needed to determine the remaining allowance.'}`:`限额周期 ${p.start}—${p.end} 已记录购买合计 ${amount(p.amount)}（未扣退款）。${p.source==='demo'?'按这份示例和当前限额计算，不代表真实资金。':p.complete?'依据已保存查询范围，不代表实时账户余额。':'剩余额度待补齐数据。'}`;
  case 'over':return en?`${p.category?category(p.category)+' limit':'Total limit'}: imported purchases ${amount(p.amount)} exceed the ${amount(p.limit)} limit by ${p.complete?'':'at least '}${amount(p.over)}.`:`${p.category?p.category+'分类限额':'总限额'}：已导入购买 ${amount(p.amount)}，限额 ${amount(p.limit)}，${p.complete?'超出':'至少超出'} ${amount(p.over)}。`;
  case 'coverage':return en?(p.state==='future'?'The limit period has not started. Its allowance has not been evaluated.':'The saved records do not establish coverage of the limit period. More records are needed; no remaining allowance is confirmed.'):p.message;
  case 'review':return en?'This record needs your review. Open its source to check the outstanding items.':`这笔记录仍需核对：${p.reasons.join(' ')}`;
  case 'reminder':return en?'You set a personal attention reminder for this record.':'你为这笔消费设置了留意提醒。';
  case 'category-change':return en?`You changed this record from ${category(p.before)} to ${category(p.after)}. This does not confirm the merchant.`:`你已将这笔从「${p.before}」归为「${p.after}」。分类改变不等于确认商户。`;
  default:throw factError();
 }
}

export function validateRecapSelection(value,input){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==1||!Object.hasOwn(value,'factIds')||!Array.isArray(value.factIds)||value.factIds.length<1||value.factIds.length>3||new Set(value.factIds).size!==value.factIds.length||!Array.isArray(input.catalog)||!input.catalog.length||value.factIds.some(id=>typeof id!=='string'||!input.catalog.some(f=>f.factId===id)))throw factError();
 return [...value.factIds];
}

// Both model-selected and fallback summaries render only server-created facts.
export function renderRecap(input,factIds,language=input.language){
 if(!Array.isArray(input.catalog))throw factError();
 const chosen=factIds===undefined?input.catalog.filter(f=>!f.mandatory).slice(0,3).map(f=>f.factId):validateRecapSelection({factIds},input);
 const mandatory=input.catalog.filter(f=>f.mandatory).map(f=>f.factId),ids=[...new Set([...mandatory,...chosen])];
 const facts=ids.map(id=>{const f=input.catalog.find(x=>x.factId===id);return {...f,text:factText(f,language)};});
 return {factIds:chosen,mandatoryFactIds:mandatory,facts,text:facts.map(f=>f.text).join('\n'),recordIds:[...new Set(facts.flatMap(f=>f.recordIds))],source:'verified-facts'};
}
