// Start explicitly: node scripts/sandbox-checkout.mjs. No PayPal request at startup.
import http from 'node:http';
import {existsSync,readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {Store} from '../lib/store.mjs';
import {SandboxCheckout,CheckoutError,checkoutReturn} from '../lib/sandbox-checkout.mjs';
const path=new URL('../.env.sandbox-checkout',import.meta.url),env=existsSync(path)?parseEnv(readFileSync(path,'utf8')):{};
const checkout=new SandboxCheckout({client:env.PAYPAL_TEST_MERCHANT_CLIENT_ID,secret:env.PAYPAL_TEST_MERCHANT_CLIENT_SECRET},new Store(fileURLToPath(new URL('../data/sandbox-checkout.sqlite',import.meta.url))));
const formKey=randomUUID(),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function page(message='',returned=false){const s=checkout.current(),canRenew=s?.stage==='created'&&!s.captureId&&!s.payerAccountKey&&Date.now()-Date.parse(s.createdAt)>=3*3600000;return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>沙箱测试购买 · 听账手记</title><style>body{font:17px/1.7 system-ui;max-width:760px;margin:60px auto;padding:24px;color:#17313a;background:#f6f4ed}main{background:white;padding:32px;border:1px solid #d5d8d3;border-radius:12px}button,a{font:inherit}button{padding:12px 20px;cursor:pointer}small{color:#52646a}code{word-break:break-all}</style><main><small>开发联调辅助页 · PayPal Sandbox · 不涉及真实资金</small><h1>为账本准备一笔测试购买</h1><p>商品：虚构学习笔记本 · <strong>USD 12.00</strong> · 一次性</p><p>收款方是<strong>第二个商家账户 B</strong>。PayPal 批准页必须登录<strong>已经能查账的账户 A</strong>作为买家；不要登录 B 给自己付款。</p><p>这里只验证沙箱链路，不发货、不提供真实商品或服务。本工具不会保存买家密码。</p>${message?'<p role="status">'+esc(message)+'</p>':''}${!s?.orderId?`<form method="post" action="/create"><input type="hidden" name="key" value="${formKey}"><button>创建 USD 12.00 沙箱测试订单</button></form>`:`<p>订单：<code>${esc(s.orderId)}</code></p>${canRenew?`<section><h2>先检查这笔旧订单</h2><p>创建已超过3小时，批准链接可能不再可用。下方入口会先查询旧订单；符合恢复条件时保留旧记录并准备新的 USD 12.00 沙箱订单，不会付款。</p><form method="post" action="/renew"><input type="hidden" name="key" value="${formKey}"><input type="hidden" name="order" value="${esc(s.orderId)}"><button>检查旧订单并重新准备</button></form></section>`:''}${s.stage==='completed'?`<h2>沙箱付款已完成</h2><p>Capture ID：<code>${esc(s.captureId)}</code></p><p>请回听账手记同步账户 A 的 USD 账本。报表可能延迟，查到收入或查不到都不应伪造成消费。</p><a href="http://localhost:4333/">返回听账手记</a>`:`${s.approvalUrl?`<p><a href="${esc(s.approvalUrl)}" rel="noreferrer">前往 PayPal Sandbox，由我登录并批准 →</a></p>`:'<p>当前订单缺少批准链接，请联系开发者核查；不会另建订单。</p>'}<p>${returned?'已从 PayPal 返回；仍需服务端核验，返回页面不代表付款完成。':'第 1 步：先点击上方蓝色链接，用账户 A 登录 PayPal 并批准。第 2 步：返回这里，再点击下方按钮。'}</p><form method="post" action="/capture"><input type="hidden" name="key" value="${formKey}"><input type="hidden" name="order" value="${esc(s.orderId)}"><button>核验批准并完成这笔沙箱付款</button></form>`}`}</main></html>`;}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
 if(req.headers.host!=='localhost:4335'&&req.headers.host!=='127.0.0.1:4335'){res.writeHead(403);res.end('Local access only');return;}
 const url=new URL(req.url,checkoutReturn);
 try{
  if(req.method==='GET'&&['/','/return','/cancel'].includes(url.pathname)){
   if(url.pathname==='/return'&&url.searchParams.get('token')!==checkout.current()?.orderId)throw new CheckoutError('返回的订单不匹配，未调用付款接口。');
   res.end(page(url.pathname==='/cancel'?'已取消返回；本页没有调用收款接口。需要继续时，请重新进入同一订单批准。':'',url.pathname==='/return'));return;
  }
  if(req.method!=='POST'||!['/create','/capture','/renew'].includes(url.pathname)){res.writeHead(404);res.end('Not found');return;}
  if(![checkoutReturn,'http://127.0.0.1:4335'].includes(req.headers.origin)||req.headers['sec-fetch-site']==='cross-site'||!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')){res.writeHead(403);res.end('Local form only');return;}
  let body='';for await(const chunk of req){body+=chunk;if(body.length>4096)throw new CheckoutError('请求过大。');}const data=new URLSearchParams(body);if(data.get('key')!==formKey)throw new CheckoutError('页面已过期，请刷新后重试。');
  if(url.pathname==='/create')await checkout.create();else if(url.pathname==='/renew')await checkout.renewUnavailable(data.get('order'));else {
   let expectedPayer;try{const r=await fetch('http://localhost:4333/api/bootstrap',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();expectedPayer=(await r.json()).snapshot?.providerAccountKey;}catch{throw new CheckoutError('请先启动原查账服务（4333），再核验同一订单；尚未执行付款。');}
   if(!/^[a-f0-9]{24}$/.test(expectedPayer||''))throw new CheckoutError('原查账账户尚无已验证来源，请先在账本中同步成功，再核验同一订单；尚未执行付款。');
   await checkout.capture(data.get('order'),expectedPayer);
  }
  res.writeHead(303,{Location:'/'});res.end();
 }catch(error){res.statusCode=400;res.end(page(error instanceof CheckoutError?error.message:'本地保存或服务发生错误。请保留当前订单，联系开发者核查；不要另建测试付款。'));}
});
server.listen(4335,'127.0.0.1',()=>console.log('沙箱购买辅助页：'+checkoutReturn+'；仅手动操作时请求 PayPal。'));
server.on('error',()=>{console.error('辅助服务未能启动，请检查4335端口是否已被占用。');process.exitCode=1;});
