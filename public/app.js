// Transfer local browser settings only after the user clicks the upgrade entry.
const currentOrigin='http://'+location.hostname+':4333',legacyPorts=['4330','4331','4332'];
if(legacyPorts.includes(location.port)){
 const key=location.port==='4330'?'listening-ledger-v1':'listening-ledger-v2';
 document.querySelector('#main').innerHTML='<section class="upgrade-page"><p class="eyebrow">THE THIRD EDITION</p><h1>手记翻到<br>第三版。</h1><p>真实翻页、新的月份藏页，以及更清楚的 AI 核对。<br>把这个浏览器原有的限额、核对记录和书签一起带过去。</p><button id="move-v3" class="primary">带上原有设置，打开第三版 ↗</button><p class="small">旧记录保留；第三版已有内容会先在浏览器备份。</p><p id="migration-status" role="status"></p></section>';
 let child;document.querySelector('#move-v3').onclick=()=>{child=window.open(currentOrigin+'/#migrate-'+location.port,'listening-ledger-v3');document.querySelector('#migration-status').textContent=child?'正在打开第三版，原记录会保留。':'请允许本地页面打开新标签后重试。';};
 window.addEventListener('message',e=>{if(e.origin!==currentOrigin||e.source!==child||e.data?.type!=='ledger-upgrade-request')return;try{child.postMessage({type:'ledger-upgrade-copy',key,raw:localStorage.getItem(key)},currentOrigin);}catch{child.postMessage({type:'ledger-upgrade-copy',error:true},currentOrigin);}});
}else{
 const sourcePort=location.hash.match(/^#migrate-(4330|4331|4332)$/)?.[1];
 if(sourcePort&&window.opener){
  const sourceOrigin='http://'+location.hostname+':'+sourcePort;
  document.querySelector('#main').textContent='正在带入原有设置，原记录会保留。';
  await new Promise(resolve=>{
   const timer=setTimeout(()=>finish('暂未收到旧版设置，请回到旧页面重新打开。'),5000);
   function finish(message){clearTimeout(timer);window.removeEventListener('message',receive);if(message)sessionStorage.setItem('ledger-upgrade-note',message);resolve();}
   function receive(e){if(e.origin!==sourceOrigin||e.source!==window.opener||e.data?.type!=='ledger-upgrade-copy')return;try{if(e.data.error)throw Error();const {raw,key}=e.data;if(raw){if(typeof raw!=='string'||raw.length>1000000||key!==(sourcePort==='4330'?'listening-ledger-v1':'listening-ledger-v2'))throw Error();const parsed=JSON.parse(raw);if(sourcePort!=='4330'&&(!parsed.books||typeof parsed.books!=='object'))throw Error();const existing=localStorage.getItem('listening-ledger-v2');if(existing)localStorage.setItem('ledger-before-v3-import',existing);localStorage.setItem(key+'-before-v3',raw);if(sourcePort==='4330'){localStorage.setItem('listening-ledger-v2',JSON.stringify({activeBook:'demo:'+(parsed.scenario||'week'),books:{['demo:'+(parsed.scenario||'week')]:parsed}}));}else localStorage.setItem(key,raw);}finish(raw?'旧版限额、核对与书签已带入。原记录和导入前副本都保留。':'旧页面没有浏览器记录，将使用本机保存的账本。');}catch{finish('旧版设置格式无法读取，没有覆盖现有账本。');}}
   window.addEventListener('message',receive);window.opener.postMessage({type:'ledger-upgrade-request'},sourceOrigin);
  });history.replaceState(null,'',location.pathname);
 }
 await import('./book.js');const note=sessionStorage.getItem('ledger-upgrade-note');if(note){const p=document.createElement('p');p.className='notice';p.textContent=note;document.querySelector('#main').prepend(p);sessionStorage.removeItem('ledger-upgrade-note');}
}
