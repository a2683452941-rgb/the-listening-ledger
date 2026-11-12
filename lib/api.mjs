import {scenarioRows,categories} from '../public/seed.js';
import {validateRange} from '../public/domain.js';
import {recapFacts} from '../public/recap.js';
import {validateBudget} from '../public/budget.js';
import {classificationInput,inputVersion} from './ai.mjs';
export function createAPI({store,paypal,ai}){
 const validBook=book=>typeof book==='string'&&(/^demo:(week|edge|empty|practice)$/.test(book)||['USD','CNY'].some(c=>book===paypal.account+':'+c));
 const checkedBook=book=>{if(!validBook(book))throw Error('账本不匹配。');return book;};
 const snapshotFor=book=>checkedBook(book).startsWith('demo:')?undefined:paypal.baseline(book);
 const baselines=()=>Object.fromEntries(['USD','CNY'].map(c=>[c,paypal.baseline(paypal.account+':'+c)]));
 const rowsFor=book=>checkedBook(book).startsWith('demo:')?scenarioRows(book==='demo:practice'?'week':book.split(':')[1]):snapshotFor(book).records.filter(x=>x.eligible&&x.currency===book.split(':')[1]);
 const reviewVersion=(saved,id)=>inputVersion({edit:saved?.edits?.[id]||null,history:(saved?.history||[]).filter(h=>h.id===id)});
 const classifyInput=data=>{
  const row=rowsFor(data.book).find(r=>r.id===data.id);if(!row)throw Error('这笔账单不存在或不可纳入。');if(typeof data.supplement!=='string'||data.supplement.length>1000)throw Error('补充说明最多1000字。');
  const saved=store.get('state:'+data.book);
  return classificationInput(row,data.supplement,{reviewRevision:reviewVersion(saved,data.id),language:data.language??saved?.language});
 };
 const summaryInput=data=>{const rows=rowsFor(data.book),saved=store.get('state:'+data.book);if(!saved)throw Error('请先保存当前账本设置。');return recapFacts(rows,saved,data.scope||saved.range,snapshotFor(data.book));};
 const staleError=()=>Error('来源、核对记录或范围已变化；旧建议未应用，请重新分析。');
 return async(path,method,data)=>{
  if(path==='/api/bootstrap'&&method==='GET')return {ai:ai.status(),speech:{provider:'device',configured:true,cloud:false},paypal:{...paypal.status(),account:paypal.account,environment:'sandbox'},snapshot:paypal.snapshot(),baselines:baselines()};
  if(path==='/api/sync'&&method==='POST'){
   checkedBook(data.book);if(data.book.startsWith('demo:'))throw Error('请选择要同步的 PayPal 沙箱币种账本。');validateRange(data.start,data.end);
   const currency=data.book.split(':')[1],saved=store.get('state:'+data.book),budget=saved?.budget||{...(snapshotFor(data.book).range||validateRange(data.start,data.end)),currency,total:null,categories:{},version:1,isDemo:false};validateBudget(budget,currency);
   const snapshot=await paypal.sync(data.start,data.end,{book:data.book,budget});return {snapshot,baselines:baselines(),paypal:{...paypal.status(),account:paypal.account,environment:'sandbox'}};
  }
  if(path==='/api/state'&&method==='POST'){
   checkedBook(data.book);if(!data.state)return {state:store.get('state:'+data.book)};
   validateBudget(data.state.budget,data.book.startsWith('demo:')?'CNY':data.book.split(':')[1]);validateRange(data.state.range.start,data.state.range.end);
   const rows=rowsFor(data.book),saved=store.get('state:'+data.book);
   for(const [id,edit] of Object.entries(data.state.edits||{})){
    if(!edit||!categories.includes(edit.category)||Object.entries(edit).some(([k,v])=>k!=='category'&&(k==='sourceVersion'?typeof v!=='string':!['unknownMerchant','duplicate','manualReview','reminder'].includes(k)||typeof v!=='boolean')))throw Error('核对内容无效。');
    const row=rows.find(r=>r.id===id),previous=saved?.edits?.[id],unchanged=JSON.stringify(edit)===JSON.stringify(previous);
    if(!row){if(data.book.startsWith('demo:')||!unchanged)throw Error('未知账单，不能新增或修改核对记录。');continue;}
    const categoryOnly=edit.sourceVersion===previous?.sourceVersion&&['unknownMerchant','duplicate','manualReview','reminder'].every(key=>!!({...row,...edit})[key]===!!({...row,...previous})[key]);
    if(row.sourceVersion?edit.sourceVersion!==row.sourceVersion&&!unchanged&&!categoryOnly:edit.sourceVersion!==undefined)throw Error('来源版本已变化或不匹配，请重新核对当前账单。');
   }
   store.put('state:'+data.book,data.state);return {saved:true};
  }
  if(path==='/api/ai/latest'&&method==='POST'){
   rowsFor(data.book);const s=store.get('latest-ai:'+data.book+':'+data.id);if(!s)return {suggestion:null};const accepted=store.get('accept:'+s.id);let stale=true;
   try{const current=s.kind==='classify'?classifyInput({book:data.book,id:data.id,supplement:s.input.supplement,language:s.input.language}):summaryInput({book:data.book,scope:{...s.input.scope,language:s.input.language}}),version=inputVersion(current);stale=!s.inputVersion||version!==s.inputVersion&&version!==accepted?.appliedInputVersion;}catch{}
   return {suggestion:{...s,stale,acceptedAt:accepted?.at}};
  }
  if(path==='/api/ai/classify'&&method==='POST'){
   if(!data.consent)throw Error('请先确认发送给模型的字段。');const input=classifyInput(data),version=inputVersion(input),result=await ai.call('classify',input,data.book);
   if(inputVersion(classifyInput(data))!==version)throw staleError();return result;
  }
  if(path==='/api/ai/summary'&&method==='POST'){
   if(!data.consent)throw Error('请确认发送脱敏汇总。');const facts=summaryInput(data);if(!facts.stats.count)throw Error('这段范围没有账单，不需要生成 AI 回顾。');const version=inputVersion(facts),result=await ai.call('summary',facts,data.book);
   if(inputVersion(summaryInput(data))!==version)throw staleError();return result;
  }
  if(path==='/api/ai/accept'&&method==='POST'){
   const s=store.get('suggestion:'+data.suggestion);if(!s||s.book!==data.book||s.input.id!==data.id||s.kind!=='classify'||!categories.includes(s.result.category))throw Error('建议不匹配，未采纳。');
   if(!s.input.sourceRevision||!s.input.reviewRevision||!data.inputVersion||data.inputVersion!==s.inputVersion)throw staleError();
   const saved=store.get('state:'+data.book);if(!saved)throw Error('请先保存当前账本设置，再采纳分类。');const currentInput=classifyInput({...data,language:data.language??s.input.language}),currentVersion=inputVersion(currentInput),key='accept:'+s.id,accepted=store.get(key);
   if(accepted?.appliedInputVersion===currentVersion)return {accepted:true,category:s.result.category,state:saved};
   if(currentVersion!==s.inputVersion)throw staleError();
   const row=rowsFor(data.book).find(r=>r.id===data.id),previousEdit=saved.edits?.[data.id],current={...row,...previousEdit};
   if(current.category===s.result.category)return {accepted:true,category:s.result.category,state:saved,unchanged:true};
   const after={...previousEdit,category:s.result.category},before={category:current.category,unknownMerchant:!!current.unknownMerchant,duplicate:!!current.duplicate,manualReview:!!current.manualReview,reminder:!!current.reminder,...(previousEdit?.sourceVersion?{sourceVersion:previousEdit.sourceVersion}:{})},at=new Date().toISOString();
   const state={...saved,edits:{...saved.edits,[data.id]:after},history:[...(saved.history||[]),{id:data.id,at,before,after:{...before,category:s.result.category},suggestionId:s.id}]};
   const appliedInputVersion=inputVersion({...currentInput,reviewRevision:reviewVersion(state,data.id)});
   store.db?.exec('BEGIN IMMEDIATE');try{store.put('state:'+data.book,state);store.put(key,{at,suggestionId:s.id,inputVersion:s.inputVersion,appliedInputVersion});store.db?.exec('COMMIT');}catch(error){store.db?.exec('ROLLBACK');throw error;}
   return {accepted:true,category:s.result.category,state};
  }
  throw Error('接口不存在。');
 };
}
