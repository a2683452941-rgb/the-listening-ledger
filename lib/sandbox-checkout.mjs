// Isolated test purchase helper. Sandbox only; never used by the ledger's read API.
import {createHash,randomUUID} from 'node:crypto';
const origin='https://api-m.sandbox.paypal.com';
export const checkoutReturn='http://localhost:4335';
export class CheckoutError extends Error{
 constructor(message,details={}){super(message);for(const key of ['httpStatus','code','issue','operation','debugId'])if(details[key]!==undefined)this[key]=details[key];}
}
export class SandboxCheckout{
 constructor(config,store,request=fetch){this.c=config;this.store=store;this.request=request;this.key='checkout:'+createHash('sha256').update(config.client||'').digest('hex');this.pending=false;}
 current(){return this.store.get(this.key);}
 save(value){this.store.put(this.key,value);return value;}
 async exclusive(fn){if(this.pending)throw new CheckoutError('正在处理本次订单，请等待，不要重复提交。');this.pending=true;try{return await fn();}finally{this.pending=false;}}
 async token(){
  if(!this.c.client||!this.c.secret)throw new CheckoutError('请先在 .env.sandbox-checkout 填写第二个商家应用的 Sandbox 凭据，再重启辅助服务。');
  let response,data;try{response=await this.request(origin+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(this.c.client+':'+this.c.secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(25000)});data=await response.json();}catch{throw new CheckoutError('沙箱认证连接未完成，请稍后重试。');}
  if(!response.ok||!data.access_token)throw new CheckoutError('第二个商家应用的沙箱认证失败，请检查本地配置。');return data.access_token;
 }
 async api(path,token,{body,requestId}={}){
  const operation=body?(path.endsWith('/capture')?'capture':'create'):'get-order';
  let response,data;try{response=await this.request(origin+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation',...(requestId?{'PayPal-Request-Id':requestId}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});data=await response.json();}catch{throw new CheckoutError('PayPal连接中断，结果尚未确认。保留了本次订单，请使用同一入口重试核验，不要另外创建订单。',{operation});}
  if(!response.ok){
   const safeCode=value=>typeof value==='string'&&/^[A-Z][A-Z0-9_]{0,79}$/.test(value)?value:undefined,code=safeCode(data?.name),issue=data?.details?.length===1?safeCode(data.details[0]?.issue):undefined,debugId=typeof data?.debug_id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(data.debug_id)?data.debug_id:undefined;
   const message=operation==='get-order'&&response.status===404?'旧订单目前无法查询（HTTP 404）。这不是付款成功或未付款的证明；本次查询没有发起收款，旧记录已保留。':'PayPal未完成本次请求（HTTP '+response.status+'）。本次订单已保留，请核查沙箱账户及批准情况后重试。';
   throw new CheckoutError(message,{httpStatus:response.status,code,issue,operation,debugId});
  }return data;
 }
 validate(order,saved){
  const units=order.purchase_units,unit=units?.[0];
  if(order.id!==saved.orderId||order.intent!=='CAPTURE'||units?.length!==1||unit.reference_id!=='ledger-notebook'||unit.custom_id!==saved.createId||unit.amount?.currency_code!=='USD'||unit.amount?.value!=='12.00')throw new CheckoutError('订单标识、商品关联或金额不匹配，未继续执行。');
  return unit;
 }
 validatePayer(order,expectedPayerAccountKey){
  const ids=[order.payment_source?.paypal?.account_id,order.payer?.payer_id].filter(id=>id!==undefined);
  if(!ids.length||ids.some(id=>typeof id!=='string'||!/^[2-9A-HJ-NP-Z]{13}$/.test(id))||new Set(ids).size!==1)throw new CheckoutError('PayPal未提供可核验的一致付款账户，未继续操作。请核对账户 A 与本次订单。');
  if(createHash('sha256').update(ids[0]).digest('hex').slice(0,24)!==expectedPayerAccountKey)throw new CheckoutError('PayPal订单的付款账户与当前查账账户不一致，未继续操作。请回到PayPal核对是否使用了账户 A。');
 }
 completed(order,saved,expectedPayerAccountKey){
  this.validatePayer(order,expectedPayerAccountKey);
  const unit=this.validate(order,saved),captures=unit.payments?.captures;
  if(order.status!=='COMPLETED'||captures?.length!==1||captures[0].status!=='COMPLETED'||!captures[0].id||captures[0].amount?.currency_code!=='USD'||captures[0].amount?.value!=='12.00')throw new CheckoutError('支付结果尚未确认为完整的 USD 12.00 收款，请保留订单并稍后核验。');
  return this.save({...saved,stage:'completed',payerAccountKey:expectedPayerAccountKey,captureId:captures[0].id,completedAt:new Date().toISOString()});
 }
 async create(){return this.exclusive(()=>this.createCurrent());}
 async createCurrent(accessToken){
  let saved=this.current();if(saved?.orderId)return saved;
  if(saved&&Date.now()-Date.parse(saved.createdAt)>5*3600000)throw new CheckoutError('之前创建订单的结果未确定且已超过安全重试窗口，请先人工核查，不会自动新建另一笔订单。');
  const token=accessToken||await this.token();saved=saved||this.save({stage:'creating',createId:randomUUID(),captureRequestId:randomUUID(),createdAt:new Date().toISOString()});
  const amount={currency_code:'USD',value:'12.00'};
  const body={intent:'CAPTURE',purchase_units:[{reference_id:'ledger-notebook',custom_id:saved.createId,description:'Listening Ledger sandbox test: study notebook',amount:{...amount,breakdown:{item_total:amount}},items:[{name:'Study notebook (Sandbox test only)',quantity:'1',unit_amount:amount,category:'PHYSICAL_GOODS'}]}],payment_source:{paypal:{experience_context:{brand_name:'Listening Ledger Test Store',user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING',return_url:checkoutReturn+'/return',cancel_url:checkoutReturn+'/cancel'}}}};
  const order=await this.api('/v2/checkout/orders',token,{body,requestId:saved.createId});
  if(typeof order.id!=='string'||!/^[A-Z0-9]{10,32}$/.test(order.id))throw new CheckoutError('PayPal返回的订单标识无法验证，请保留现场核查。');
  // Persist the order ID before examining optional approval links, so retries cannot create a second order.
  saved=this.save({...saved,orderId:order.id,stage:'created'});
  const href=order.links?.find(x=>x.rel==='payer-action'||x.rel==='approve')?.href;
  let url;try{url=new URL(href);}catch{throw new CheckoutError('订单已创建，但未返回可用的批准入口，请先核查这笔订单。');}
  if(url.protocol!=='https:'||url.hostname!=='www.sandbox.paypal.com'||url.username||url.password)throw new CheckoutError('批准入口不是预期的 PayPal Sandbox，已停止。');
  return this.save({...saved,approvalUrl:url.href});
 }
 async renewUnavailable(orderId){return this.exclusive(async()=>{
  const saved=this.current(),age=Date.now()-Date.parse(saved?.createdAt);
  if(!saved?.orderId||orderId!==saved.orderId||saved.stage!=='created'||saved.captureId||saved.payerAccountKey||saved.captureAttemptedAt||saved.completedAt||!Number.isFinite(age)||age<3*3600000)throw new CheckoutError('这笔订单不符合重新准备条件。收款结果不明确、已有收款尝试或新建结果未确定时，请继续核验原订单。');
  const token=await this.token();let unavailable;
  try{await this.api('/v2/checkout/orders/'+encodeURIComponent(orderId),token);}catch(error){
   if(error.operation!=='get-order'||error.httpStatus!==404||error.code!=='RESOURCE_NOT_FOUND'||error.issue!=='INVALID_RESOURCE_ID')throw error;unavailable=error;
  }
  if(!unavailable)throw new CheckoutError('旧订单仍可查询，未创建另一笔订单。请继续核验原订单的批准与付款状态。');
  const at=new Date().toISOString(),archive={...saved,archivedAt:at,archiveReason:'query-unavailable',unavailableCheck:{at,httpStatus:unavailable.httpStatus,code:unavailable.code,issue:unavailable.issue,operation:unavailable.operation,...(unavailable.debugId?{debugId:unavailable.debugId}:{})}};
  const next={stage:'creating',createId:randomUUID(),captureRequestId:randomUUID(),createdAt:at,previousOrderId:saved.orderId};
  this.store.db?.exec('BEGIN IMMEDIATE');try{this.store.put(this.key+':history:'+saved.orderId,archive);this.save(next);this.store.db?.exec('COMMIT');}catch(error){this.store.db?.exec('ROLLBACK');throw error;}
  return this.createCurrent(token);
 });}
 async capture(orderId,expectedPayerAccountKey){return this.exclusive(async()=>{
  if(typeof expectedPayerAccountKey!=='string'||!/^[a-f0-9]{24}$/.test(expectedPayerAccountKey))throw new CheckoutError('查账账户尚未核实，请先启动听账手记并成功同步，再返回重试。');
  const saved=this.current();if(!saved?.orderId||orderId!==saved.orderId)throw new CheckoutError('这不是本辅助工具创建的当前订单，未执行付款。');
  if(saved.payerAccountKey&&saved.payerAccountKey!==expectedPayerAccountKey)throw new CheckoutError('当前查账账户与本订单已绑定的账户不一致，未继续操作。');
  if(saved.stage==='completed'&&saved.payerAccountKey===expectedPayerAccountKey)return saved;
  const token=await this.token(),order=await this.api('/v2/checkout/orders/'+encodeURIComponent(orderId),token);this.validate(order,saved);
  if(order.status==='COMPLETED')return this.completed(order,saved,expectedPayerAccountKey);
  if(saved.stage==='completed')throw new CheckoutError('历史完成记录与PayPal当前状态不一致，未再次收款。请保留订单并核查。');
  if(order.status!=='APPROVED')throw new CheckoutError('PayPal尚未确认买家批准。请使用查账账户在沙箱完成批准，或取消本次操作。');
  this.validatePayer(order,expectedPayerAccountKey);
  const capturing=this.save({...saved,stage:'capturing',payerAccountKey:expectedPayerAccountKey,captureAttemptedAt:new Date().toISOString()});
  const captured=await this.api('/v2/checkout/orders/'+encodeURIComponent(orderId)+'/capture',token,{body:{},requestId:saved.captureRequestId});
  // A separate read verifies full order linkage even if the capture response is minimal.
  if(captured.id!==orderId)throw new CheckoutError('返回的付款订单不匹配，请保留现场核查。');
  return this.completed(await this.api('/v2/checkout/orders/'+encodeURIComponent(orderId),token),capturing,expectedPayerAccountKey);
 });}
}
