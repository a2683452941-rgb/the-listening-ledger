import {createHash,randomUUID} from 'node:crypto';
import {validateRange,budgetCoverage} from '../public/domain.js';
const origin='https://api-m.sandbox.paypal.com';
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,24);
// Reviewed against https://developer.paypal.com/reports/reference/t-codes (2026-11-10).
// Generic/mobile/funded payments alone do not establish a purchase; keep them in the source ledger.
const purchaseCodes=new Set(['T0002','T0003','T0004','T0005','T0006','T0007','T0008','T0009','T0010','T0012','T0018']);
export const accountKey=c=>'sandbox-'+hash(c.client||'unconfigured');
export function amountCents(value){if(typeof value!=='string'||!/^[-+]?\d+(\.\d{1,2})?$/.test(value))return null;const [whole,fraction='']=value.replace(/^[-+]/,'').split('.'),n=(Number(whole)*100+Number(fraction.padEnd(2,'0')))*(value.startsWith('-')?-1:1);return Number.isSafeInteger(n)?n:null;}
export function normalize(item,account,at){
 const t=item.transaction_info;if(!t?.transaction_id||!t.transaction_event_code||!Number.isFinite(Date.parse(t.transaction_initiation_date)))throw Error('交易响应缺少有效标识或时间，本批未保存。');
 const amount=amountCents(t.transaction_amount?.value),currency=t.transaction_amount?.currency_code,code=t.transaction_event_code;
 const type=['T1107','T1115','T1120'].includes(code)?'退款':/^T01/.test(code)||['T1108','T1109'].includes(code)?'费用':/^T(02|03|04|05|06|07|20)/.test(code)||['T0001','T0015','T0016','T0017','T1900'].includes(code)?'账户转账或调整':/^T11/.test(code)||t.transaction_status==='V'?'撤销':amount>0?'收入':!purchaseCodes.has(code)?'类型待检查':'购买支出';
 const eligible=type==='购买支出'&&amount<0&&['USD','CNY'].includes(currency)&&t.transaction_status==='S';
 const reason=amount===null?'金额格式待检查':!['USD','CNY'].includes(currency)?'币种暂不支持纳入':t.transaction_status!=='S'?'尚非有效完成状态':type!=='购买支出'?type:amount>=0?'不是支出方向':'已完成购买事件，账户金额为支出方向';
 const time=new Date(Date.parse(t.transaction_initiation_date)+8*3600000).toISOString().slice(0,19)+'+08:00';
 const id='PP-'+hash([account,t.transaction_id,code,currency,t.transaction_initiation_date].join('|'));
 const description=[t.transaction_subject,t.transaction_note,...(item.cart_info?.item_details||[]).map(x=>x.item_name)].filter(x=>typeof x==='string').join(' · ').slice(0,1500);
 const sourceVersion=hash([id,amount,t.transaction_status,description].join('|'));
 return {id,time,merchant:t.transaction_subject?.slice(0,100)||'PayPal 对方描述待核对',description,amount:amount===null?null:Math.abs(amount),signedAmount:amount,currency,category:'未分类',unknownMerchant:true,source:'paypal-sandbox',eligible,type,reason,transactionId:t.transaction_id,eventCode:code,providerStatus:t.transaction_status,originalTime:t.transaction_initiation_date,updatedTime:t.transaction_updated_date,reference:t.paypal_reference_id||null,referenceType:t.paypal_reference_id_type||null,syncedAt:at,account,sourceVersion};
}
export function queryWindows(start,end,cutoff){validateRange(start,end);let t=Date.parse(start+'T00:00:00+08:00'),last=Date.parse(end+'T23:59:59+08:00'),out=[];if(cutoff!==undefined){const at=Date.parse(cutoff);if(!Number.isFinite(at))throw Error('统计截至时间无效。');last=Math.min(last,Math.floor(at/1000)*1000);}while(t<=last){const stop=Math.min(last,t+30*86400000-1000);out.push({start_date:new Date(t).toISOString(),end_date:new Date(stop).toISOString()});t=stop+1000;}return out;}
export class PayPal{
 constructor(config,store,request=fetch,clock=()=>new Date()){this.c=config;this.store=store;this.request=request;this.clock=clock;this.account=accountKey(config);this.pending=null;}
 status(){return this.store.get('paypal-status:'+this.account,{stage:this.c.client&&this.c.secret?'configured':'unconfigured',message:this.c.client&&this.c.secret?'已配置，交易查询待验证':'尚未配置沙箱凭据'});}
 snapshot(revision){return this.store.get(revision?'paypal-revision:'+this.account+':'+revision:'paypal-snapshot:'+this.account,{records:[],range:null,syncedAt:null,coverageState:'none',paginationComplete:false,accountKey:this.account,environment:'sandbox'});}
 baseline(book){const revision=this.store.get('paypal-baseline:'+book);return this.snapshot(revision||undefined);}
 async sync(start,end,options={}){if(this.pending)throw Error('已有同步正在进行，请等待结果。');this.pending=this.run(start,end,options);try{return await this.pending;}finally{this.pending=null;}}
 async run(start,end,{book,budget}={}){let oauth=false,attempted=false;const at=this.clock().toISOString();try{
  if(book&&!['USD','CNY'].some(c=>book===this.account+':'+c))throw Error('账本不匹配。');
  if(budget){validateRange(budget.start,budget.end);if(book&&budget.currency!==book.split(':')[1])throw Error('限额币种与账本不一致。');}
  const windows=queryWindows(start,end,at),old=book?this.baseline(book):this.snapshot();
  if(!windows.length||budget&&Date.parse(budget.start+'T00:00:00+08:00')>Date.parse(at))throw Error('周期尚未开始，未查询未来数据；已有记录保留。');
  const required=budget||old.range;
  if(required){const requestedStart=Date.parse(start+'T00:00:00+08:00'),requestedEnd=Date.parse(windows.at(-1).end_date),requiredStart=Date.parse(required.start+'T00:00:00+08:00'),requiredEnd=Math.min(Date.parse(required.end+'T23:59:59+08:00'),Math.floor(Date.parse(at)/1000)*1000);if(requestedStart>requiredStart||requestedEnd<requiredEnd)throw Error('查询范围未覆盖整个限额周期，请同步完整周期；已有预算基线保留。');}
  if(!this.c.client||!this.c.secret)throw Error('尚未配置沙箱凭据。');
  attempted=true;const ar=await this.request(origin+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(this.c.client+':'+this.c.secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(20000)});
  if(!ar.ok)throw Error('沙箱认证失败，请检查服务端配置。');const auth=await ar.json();if(!auth.access_token)throw Error('沙箱认证响应缺少令牌。');oauth=true;
  const merged=new Map(),completedWindows=[];let apiAccount=null;
  for(const win of windows){let page=1,totalPages=1,expectedPages=null;do{
   const query=new URLSearchParams({...win,page:String(page),page_size:'100',fields:'transaction_info,cart_info',balance_affecting_records_only:'Y'});
   const response=await this.request(origin+'/v1/reporting/transactions?'+query,{headers:{Authorization:'Bearer '+auth.access_token},signal:AbortSignal.timeout(25000)});
   if(response.status===403){const err=Error('认证成功，但交易查询无权限（403）。当前应用尚未获准读取交易；后台没有开关时，需要向PayPal开发者支持核实该账户与应用的查询资格。示例账本仍可使用。');err.code='permission';throw err;}
   if(!response.ok)throw Error('PayPal交易查询未完成（HTTP '+response.status+'），保留上次快照。');
   const result=await response.json(),details=result.transaction_details===undefined&&result.total_items===0&&result.total_pages===0&&page===1?[]:result.transaction_details;
   if(!Array.isArray(details)||!Number.isInteger(result.total_pages)||result.total_pages<0||result.total_pages>100)throw Error('交易分页响应无法验证，本批未保存。');
   if(result.page!==undefined&&result.page!==page||expectedPages!==null&&expectedPages!==result.total_pages||result.total_pages===0&&details.length)throw Error('交易分页在查询中发生变化，请重新同步；本批未保存。');
   if(apiAccount&&result.account_number&&apiAccount!==result.account_number)throw Error('交易查询账户不一致，本批未保存。');apiAccount=result.account_number||apiAccount;
   if(apiAccount&&old.providerAccountKey&&hash(apiAccount)!==old.providerAccountKey)throw Error('应用关联账户发生变化，请核对账户；旧基线保留。');
   totalPages=result.total_pages;expectedPages=totalPages;for(const item of details){const r=normalize(item,this.account,at);if(Date.parse(r.originalTime)<Date.parse(win.start_date)||Date.parse(r.originalTime)>Date.parse(win.end_date))throw Error('提供方返回范围外的交易，本批未保存。');const previous=merged.get(r.id);if(!previous||Date.parse(r.updatedTime||r.originalTime)>=Date.parse(previous.updatedTime||previous.originalTime))merged.set(r.id,r);}page++;
  }while(page<=totalPages);completedWindows.push({...win,pagesFetched:page-1,totalPages});}
  const records=[...merged.values()].sort((a,b)=>a.time.localeCompare(b.time)||a.id.localeCompare(b.id));
  for(const r of records){const before=old.records.find(x=>x.id===r.id);if(before){const older=Date.parse(r.updatedTime||r.originalTime)<Date.parse(before.updatedTime||before.originalTime);if(older)throw Error('提供方返回了较旧交易版本，请稍后重试；已有基线保留。');r.requiresReview=!!before.requiresReview||before.signedAmount!==r.signedAmount||before.providerStatus!==r.providerStatus||before.sourceVersion&&before.sourceVersion!==r.sourceVersion;}}
  const changes=records.filter(r=>{const before=old.records.find(x=>x.id===r.id);return before&&(before.providerStatus!==r.providerStatus||before.signedAmount!==r.signedAmount);}).map(r=>({id:r.id,before:old.records.find(x=>x.id===r.id),after:r,at}));
  const snapshot={records,range:{start,end},requestedStart:start,requestedEnd:end,effectiveCutoff:windows.at(-1).end_date,fetchedAt:at,syncedAt:at,revision:randomUUID(),previousRevision:old.revision||null,accountKey:this.account,environment:'sandbox',providerAccountKey:apiAccount?hash(apiAccount):null,completedWindows,paginationComplete:true,coverageState:'completeForRequestedWindow',accountLabel:apiAccount?'账户 …'+apiAccount.slice(-4):'应用 …'+this.account.slice(-4),changes:[...(old.changes||[]),...changes].slice(-200)};
  if(budget&&!budgetCoverage(budget,snapshot,at).sufficient)throw Error('返回窗口不足以覆盖限额周期；本批未作为预算依据。');
  this.store.db?.exec('BEGIN IMMEDIATE');try{
   this.store.put('paypal-revision:'+this.account+':'+snapshot.revision,snapshot);
   this.store.put('paypal-snapshot:'+this.account,snapshot);
   if(book)this.store.put('paypal-baseline:'+book,snapshot.revision);
   this.store.put('paypal-status:'+this.account,{stage:records.some(r=>r.eligible)?'ready':'query-verified',oauth:true,message:records.some(r=>r.eligible)?'交易查询成功，已取得可纳入的支出':'交易查询成功，尚无可纳入的支出；不代表账户没有消费',checkedAt:at});this.store.db?.exec('COMMIT');
  }catch(error){this.store.db?.exec('ROLLBACK');throw error;}return snapshot;
 }catch(error){const message=error.name==='TimeoutError'?'连接超时，保留上次同步快照。':error.message;if(attempted)this.store.put('paypal-status:'+this.account,{stage:error.code==='permission'?'permission':oauth?'sync-failed':'auth-failed',oauth,message,checkedAt:at});throw Error(message);}}
}
