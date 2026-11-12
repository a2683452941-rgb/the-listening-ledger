import {categories} from './seed.js';
export const statusLabels={green:'预算内',red:'需要关注',blue:'待核对'};
export const money=(n,currency='CNY')=>Number.isSafeInteger(n)?(currency==='CNY'?'¥':currency+' ')+(n/100).toFixed(2):'金额待补充';
export const validDate=s=>typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s+'T00:00:00Z')) && new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function parseMoney(s){if(s.trim()==='')return null;if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('请输入非负金额，最多两位小数。');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||n>10000000000)throw Error('金额过大，请检查输入。');return n;}
export function validateRange(start,end){if(!validDate(start)||!validDate(end)||start>end)throw Error('请选择正确的起止日期。');if((Date.parse(end)-Date.parse(start))/86400000>61)throw Error('示例版每次最多浏览62天。');return {start,end};}
export function daysBetween(start,end){validateRange(start,end);const out=[];for(let t=Date.parse(start+'T00:00:00Z');t<=Date.parse(end+'T00:00:00Z');t+=86400000)out.push(new Date(t).toISOString().slice(0,10));return out;}
export const dayOf=r=>r.time?.slice(0,10);
const validAmount=n=>Number.isSafeInteger(n)&&n>=0;
// Coverage proves requested windows, never real-time completeness of the account.
export function budgetCoverage(budget,snapshot,now=new Date().toISOString()){
 const result=(state,sufficient,message,cutoff=null)=>({state,sufficient,message,reason:message,effectiveCutoff:cutoff});
 const start=Date.parse(budget?.start+'T00:00:00+08:00'),end=Date.parse(budget?.end+'T23:59:59+08:00'),current=Date.parse(now);
 if(start>current)return result('future',false,'周期尚未开始，预算未评估。');
 if(snapshot===undefined)return result('complete',true,'示例账本的记录范围已知。');
 if(!Number.isFinite(start)||!Number.isFinite(end)||!snapshot?.paginationComplete||snapshot.coverageState!=='completeForRequestedWindow'||!Array.isArray(snapshot.completedWindows)||!snapshot.completedWindows.length)return result('none',false,'预算数据尚未验证完整，请同步整个限额周期。',snapshot?.effectiveCutoff||null);
 const fetched=Date.parse(snapshot.fetchedAt||snapshot.syncedAt),cutoff=Date.parse(snapshot.effectiveCutoff);
 if(!Number.isFinite(fetched)||!Number.isFinite(cutoff)||cutoff>fetched)return result('none',false,'同步截至时间无法验证，请重新同步整个周期。');
 const requiredEnd=Math.min(end,Math.floor(fetched/1000)*1000),windows=snapshot.completedWindows.map(w=>({start:Date.parse(w.start_date),end:Date.parse(w.end_date),valid:Number.isInteger(w.totalPages)&&w.totalPages>=0&&w.pagesFetched===Math.max(1,w.totalPages)})).sort((a,b)=>a.start-b.start);
 let cursor=start;
 for(const w of windows){if(!w.valid||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.end<w.start||w.end>cutoff)return result('partial',false,'查询窗口或分页不完整，预算数据仍待补齐。',snapshot.effectiveCutoff);if(w.end<cursor)continue;if(w.start>cursor)break;cursor=Math.max(cursor,w.end+1000);}
 if(requiredEnd<start||cursor<=requiredEnd)return result('partial',false,'查询范围未覆盖整个限额周期，剩余额度待补齐数据。',snapshot.effectiveCutoff);
 return result('complete',true,'按截至上次同步已导入的记录判断；PayPal报表可能延迟。',snapshot.effectiveCutoff);
}
export function evaluate(rows,budget,edits={},snapshot){
 let total=0;const sums={};const fmt=n=>money(n,budget?.currency),coverage=budgetCoverage(budget,snapshot===undefined&&rows.some(r=>r.source==='paypal-sandbox')?null:snapshot);
 return [...rows].sort((a,b)=>a.time.localeCompare(b.time)||a.id.localeCompare(b.id)).map(original=>{
  const r={...original,...edits[original.id]},date=dayOf(r),inPeriod=budget&&date>=budget.start&&date<=budget.end;
  const currencyOK=!budget||r.currency===budget.currency;
  const known=validAmount(r.amount)&&currencyOK;
  const doubts=[],alerts=[];
  if(!known)doubts.push('金额或币种需要核对，本笔未计入预算合计。');
  if(r.unknownMerchant)doubts.push('你还没有确认这笔商户描述。');
  if(r.category==='未分类'||!categories.includes(r.category))doubts.push('消费分类尚未确认。');
  if(r.duplicate)doubts.push('这条示例记录可能重复，需要你核对；目前仍逐笔计入。');
  if(r.manualReview)doubts.push('你选择了继续核对这笔消费。');
  if(original.requiresReview&&edits[original.id]?.sourceVersion!==original.sourceVersion)doubts.push('提供方更新了这笔记录，请按新的金额与状态重新核对。');
  if(inPeriod&&known){total+=r.amount;sums[r.category]=(sums[r.category]||0)+r.amount;}
  const applicable=inPeriod&&(budget.total!==null&&budget.total!==undefined||budget.categories[r.category]!==undefined&&budget.categories[r.category]!==null);
  if(!applicable)doubts.push(inPeriod?'尚未设置适用预算。':'这笔不在当前预算周期内，请设置对应预算。');
  if(inPeriod&&!coverage.sufficient)doubts.push(coverage.message);
  if(inPeriod&&known){
   if(validAmount(budget.total)&&total>budget.total)alerts.push({kind:'total',value:total,limit:budget.total,over:total-budget.total,text:`截至这笔，已导入购买累计${fmt(total)}，超过总预算${fmt(budget.total)}，${coverage.sufficient?'多出':'至少超出'}${fmt(total-budget.total)}。`});
   const cap=budget.categories[r.category],sum=sums[r.category]||0;
   if(validAmount(cap)&&sum>cap)alerts.push({kind:'category',value:sum,limit:cap,over:sum-cap,text:`截至这笔，${r.category}累计${fmt(sum)}，超过分类预算${fmt(cap)}，${coverage.sufficient?'多出':'至少超出'}${fmt(sum-cap)}。`});
  }
  if(r.reminder)alerts.push({kind:'reminder',text:'你为这笔消费设置了留意提醒。'});
  const status=doubts.length?'blue':alerts.length?'red':'green';
  return {...r,original,status,doubts,alerts,inPeriod,counted:!!(known&&inPeriod),cumulative:total,categoryCumulative:sums[r.category]||0,budgetVersion:budget?.version,coverage,reason:doubts[0]||alerts.find(x=>x.kind==='category')?.text||alerts[0]?.text||(r.source==='paypal-sandbox'?'按截至上次同步已导入的记录，这笔没有触发适用限额，也没有待核对标记。':'按这份示例与当前限额，这笔没有触发适用限额，也没有待核对标记。')};
 });
}
export function totals(evaluated,budget,snapshot){const period=evaluated.filter(x=>x.inPeriod),spent=period.filter(x=>x.counted).reduce((s,r)=>s+r.amount,0),coverage=snapshot===undefined&&evaluated[0]?.coverage?evaluated[0].coverage:budgetCoverage(budget,snapshot);return {spent,review:period.filter(x=>x.status==='blue').length,missing:period.filter(x=>!x.counted).length,limit:budget?.total??null,coverage,remaining:coverage.sufficient&&validAmount(budget?.total)?budget.total-spent:null};}
export function reviewRecord(rows,state,id,changes,at=new Date().toISOString()){
 const original=rows.find(x=>x.id===id);if(!original)throw Error('找不到这笔示例账单。');
 if(!categories.includes(changes.category))throw Error('请选择账单分类。');
 const before={...original,...state.edits[id]};
 const after={category:changes.category,unknownMerchant:!changes.recognized,duplicate:!!before.duplicate&&!changes.duplicateChecked,manualReview:!!changes.manualReview,reminder:!!changes.reminder};
 if(original.sourceVersion)after.sourceVersion=original.sourceVersion;
 return {...state,edits:{...state.edits,[id]:after},history:[...state.history,{id,at,before:{category:before.category,unknownMerchant:before.unknownMerchant,duplicate:before.duplicate,manualReview:!!before.manualReview,reminder:!!before.reminder},after}]};
}
export function chapters(rows,range,mode,onlyReview=false){
 const visible=rows.filter(r=>dayOf(r)>=range.start&&dayOf(r)<=range.end&&(!onlyReview||r.status==='blue'));
 const keys=mode==='date'?daysBetween(range.start,range.end):categories.filter(c=>visible.some(r=>r.category===c));
 return keys.flatMap(key=>{
  const items=visible.filter(r=>(mode==='date'?dayOf(r):r.category)===key),parts=Math.max(1,Math.ceil(items.length/10));
  return Array.from({length:parts},(_,part)=>({key,part,parts,items:items.slice(part*10,part*10+10)}));
 });
}
