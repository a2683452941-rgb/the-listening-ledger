import http from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {config} from './lib/config.mjs';
import {Store} from './lib/store.mjs';
import {PayPal} from './lib/paypal.mjs';
import {AI} from './lib/ai.mjs';
import {createAPI} from './lib/api.mjs';
const store=new Store(fileURLToPath(new URL('./data/ledger.sqlite',import.meta.url))),paypal=new PayPal(config,store),ai=new AI(config,store),api=createAPI({store,paypal,ai});
const root=new URL('./public/',import.meta.url);
const files=new Map([['/','index.html'],...['index.html','credits.html','style.css','v2.css','v3.css','v4.css','interaction-v4.css','app.js','book.js','book-view.js','reader.js','edition.js','narration.js','recap.js','vendor/page-flip.js','domain.js','seed.js','sound.js','sound-design.js','transport.js','art.js','scenes.js','budget.js','panels.js'].map(x=>['/'+x,x])]);
// Only packaged public image/credit assets are served; no project-directory fallback.
async function addAssets(dir='assets/'){
 for(const entry of await readdir(new URL(dir,root),{withFileTypes:true}).catch(()=>[])){
  const name=dir+entry.name;
  if(entry.isDirectory())await addAssets(name+'/');
  else if(entry.isFile()&&/\.(webp|png|jpe?g|json)$/.test(name))files.set('/'+name,name);
 }
}
await addAssets();
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8',webp:'image/webp',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'};
export function requestAllowed(req){const hosts=['localhost:'+config.port,'127.0.0.1:'+config.port];if(!hosts.includes(req.headers.host))return false;if(req.headers.origin&&!hosts.some(h=>req.headers.origin==='http://'+h))return false;return req.headers['sec-fetch-site']!=='cross-site';}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(!requestAllowed(req)){res.writeHead(403);res.end('Local application access only');return;}
 const path=new URL(req.url,'http://localhost').pathname;
 if(path.startsWith('/api/')){res.setHeader('Content-Type','application/json; charset=utf-8');try{
  if(!['GET','POST'].includes(req.method))throw Error('请求方式不支持。');let data={};if(req.method==='POST'){if(!req.headers['content-type']?.startsWith('application/json'))throw Error('需要JSON请求。');let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>150000)throw Error('请求内容过大。');}data=JSON.parse(body);}
  res.end(JSON.stringify(await api(path,req.method,data)));
 }catch(error){res.statusCode=400;res.end(JSON.stringify({error:error.name==='SyntaxError'?'请求格式错误。':error.message}));}return;}
 const name=files.get(path);if(req.method!=='GET'||!name){res.writeHead(404);res.end('Not found');return;}
 try{const data=await readFile(new URL(name,root));res.writeHead(200,{'Content-Type':types[name.split('.').pop()],'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(data);}catch{res.writeHead(500);res.end('Unable to read application file');}
});
server.listen(config.port,'127.0.0.1',()=>console.log('听账手记 v4 · http://localhost:'+config.port));
