import {posix} from 'node:path';
import {parseEnv} from 'node:util';

// Release checks report filenames and rule names only; rejected data is never echoed.
export function validatePublicFile(name,bytes,{privateValues=[]}={}){
 const parts=name.replaceAll('\\','/').split('/');
 if(parts.some(p=>['.git','data','_history','_release','node_modules'].includes(p))||parts.some(p=>p.startsWith('.env')&&!['.env.example','.env.sandbox-checkout.example'].includes(p))||/\.(?:log|sqlite|sqlite3|db)(?:-wal|-shm)?$/i.test(name))throw Error('Private path rejected: '+name);
 const text=bytes.toString('utf8');
 for(const value of privateValues)if(value.length>=12&&text.includes(value))throw Error('Private value found in publication file: '+name);
 if(!/\.(?:mjs|js|json|html|css|md|txt|srt|ps1|cmd)$/i.test(name)&&!name.endsWith('.example'))return;
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)||/\bsk-[A-Za-z0-9_-]{24,}\b/.test(text)||/Bearer\s+[A-Za-z0-9._-]{40,}/.test(text))throw Error('Credential-like content found: '+name);
 if(text.includes(['codex','runtimes'].join('-'))||/\b[A-Za-z]:[\\/]+(?:Users|人工智能)/.test(text))throw Error('Machine-specific runtime/path found: '+name);
 if(name.endsWith('.example'))for(const [key,value] of Object.entries(parseEnv(text))){
  if(/^(?:AI_API_KEY|PAYPAL_CLIENT_ID|PAYPAL_CLIENT_SECRET|PAYPAL_TEST_MERCHANT_CLIENT_ID|PAYPAL_TEST_MERCHANT_CLIENT_SECRET)$/.test(key)&&value.trim())throw Error('Configuration template contains a nonempty credential: '+name);
 }
}
export function publicMarkdown(name,text){
 const inDocs=name.startsWith('docs/'),summary=inDocs?'PUBLIC_VERIFICATION.md':'docs/PUBLIC_VERIFICATION.md',release=inDocs?'../验收/v4-release-check.md':'验收/v4-release-check.md';
 return text.replace(/\[([^\]]*)\]\(([^)]+)\)/g,(all,label,target)=>{
  const normalized=target.replace(/^\.\.\//,'');
  if(normalized==='验收/v4-release-check.md')return '['+label+']('+release+')';
  if(/^(?:验收\/|验收截图\/|PRD-)/.test(normalized))return '[Public verification summary — '+label+']('+summary+')';
  return all;
 });
}
export function checkLocalLinks(contents,extraFiles=[]){
 const names=new Set([...contents.keys(),...extraFiles]);
 for(const [name,bytes] of contents){
  if(!name.endsWith('.md'))continue;
  for(const [,raw] of bytes.toString('utf8').matchAll(/\]\(([^)]+)\)/g)){
   let target=raw.replace(/^<|>$/g,'').split('#')[0];
   if(!target||/^(?:https?:|mailto:)/i.test(target))continue;
   try{target=decodeURIComponent(target);}catch{}
   const full=posix.normalize(posix.join(posix.dirname(name),target));
   if(!names.has(full)&&![...names].some(n=>n.startsWith(full.replace(/\/$/,'')+'/')))throw Error('Missing public documentation target: '+name+' -> '+target);
  }
 }
}

