// Explicit source release: no credentials, personal database, backups or screenshots.
// Run only after the working tree is frozen: node scripts/package-release.mjs --verify
import {mkdir,readdir,readFile,writeFile,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {request as httpRequest} from 'node:http';
import {once} from 'node:events';
import {parseEnv} from 'node:util';
import {validatePublicFile,publicMarkdown,checkLocalLinks,localOnlyDocuments} from './release-policy.mjs';
import {setTimeout as delay} from 'node:timers/promises';
import {dirname,join,relative,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||major===22&&minor<13)throw Error('Node.js 22.13 or later is required.');
if(process.argv[2]!=='--verify'||process.argv.length!==3)throw Error('Freeze the source, then run: node scripts/package-release.mjs --verify');
if(process.platform!=='win32')throw Error('This release check uses Windows PowerShell for ZIP packaging. The application itself does not require this packaging script.');

const directories=['public','lib','tests','docs'];
const rootFiles=['server.mjs','package.json','README.md','LICENSE','THIRD_PARTY_NOTICES.md','.env.example','.env.sandbox-checkout.example','.gitignore','start.cmd','start.ps1'];
const scripts=['package-release.mjs','release-policy.mjs','sandbox-checkout.mjs','check-connections.mjs','evaluate-v4-ai.mjs','evaluate-ai.mjs','build-credits.mjs','render-sound-previews.mjs'];
const allowedExtensions=/\.(?:mjs|js|json|html|css|md|txt|srt|ps1|cmd|webp|png|jpe?g|svg|LICENSE)$/i;
const forbiddenNames=new Set(['.env','data','_history','node_modules','.git','_release']);
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const psQuote=value=>"'"+value.replaceAll("'","''")+"'";
const pathInside=(base,child)=>{const rel=relative(base,child);return rel!==''&&!rel.startsWith('..'+sep)&&rel!=='..'&&!rel.startsWith(sep);};

async function walk(directory){
 const result=[];
 for(const entry of await readdir(join(root,directory),{withFileTypes:true})){
  const name=directory+'/'+entry.name;
  if(localOnlyDocuments.has(name))continue;
  if(forbiddenNames.has(entry.name)||entry.name.endsWith('.log'))throw Error('Unexpected private path inside allowlist: '+name);
  if(entry.isSymbolicLink())throw Error('Release does not follow symlinks: '+name);
  if(entry.isDirectory())result.push(...await walk(name));
  else if(entry.isFile()&&allowedExtensions.test(entry.name))result.push(name);
  else throw Error('Unexpected file type in release allowlist: '+name);
 }
 return result;
}

const files=[...rootFiles,...scripts.map(p=>'scripts/'+p)];
for(const directory of directories)files.push(...await walk(directory));
files.sort();
if(new Set(files).size!==files.length)throw Error('Duplicate path in release allowlist.');
// Known local credentials and provider identifiers are checked without printing their values.
const privateValues=new Set();
for(const name of ['.env','.env.sandbox-checkout','.env.judging']){
 try{const values=parseEnv(await readFile(join(root,name),'utf8'));for(const [key,value] of Object.entries(values))if(/KEY|SECRET|CLIENT_ID|PASSWORD|TOKEN/.test(key)&&value.length>=12)privateValues.add(value);}catch(error){if(error.code!=='ENOENT')throw error;}
}
function collectPrivateIds(value,key=''){
 if(typeof value==='string'&&value.length>=12&&/(?:account|payer|merchant|order|capture|refund|transaction|debug).*(?:id|key|email|email_address)$|(?:^|\.)(?:order|capture|refund|transactionId|referenceId|providerId|paypalOrderId|email_address)$/i.test(key))privateValues.add(value);
 else if(value&&typeof value==='object')for(const [childKey,child] of Object.entries(value))collectPrivateIds(child,key?key+'.'+childKey:childKey);
}
// A clean public checkout has no private evidence folder.
let localEvidence=[];try{localEvidence=await readdir(join(root,'验收'));}catch(error){if(error.code!=='ENOENT')throw error;}
for(const name of localEvidence)if(name.endsWith('.json')){
 try{collectPrivateIds(JSON.parse((await readFile(join(root,'验收',name),'utf8')).replace(/^\uFEFF/,'')));}catch(error){if(error instanceof SyntaxError)throw Error('Cannot scan private JSON evidence: '+name);throw error;}
}
const contents=new Map();
for(const name of files){
 const source=join(root,name),stat=await lstat(source);
 if(!stat.isFile()||stat.isSymbolicLink())throw Error('Only regular source files can be packaged: '+name);
 let bytes=await readFile(source);
 if(name.endsWith('.md'))bytes=Buffer.from(publicMarkdown(name,bytes.toString('utf8')));
 validatePublicFile(name,bytes,{privateValues:[...privateValues]});
 contents.set(name,bytes);
}

checkLocalLinks(contents,['验收/v4-release-check.md','RELEASE_MANIFEST.json']);
const pkg=JSON.parse(contents.get('package.json')),stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
const releaseRoot=join(root,'_release'),run=join(releaseRoot,stamp+'-'+process.pid);
await mkdir(releaseRoot,{recursive:true});
if((await lstat(releaseRoot)).isSymbolicLink())throw Error('Release output cannot be a symlink.');
await mkdir(run); // Existing release directories are never overwritten or removed.
if(!pathInside(releaseRoot,run))throw Error('Invalid release output path.');
const folder='The-Listening-Ledger-v'+pkg.version,payload=join(run,folder),verification=join(run,'verification');
await mkdir(payload);await mkdir(verification);
for(const [name,bytes] of contents){
 for(const targetRoot of [payload,verification]){
  const target=join(targetRoot,name);if(!pathInside(targetRoot,target))throw Error('Invalid release member.');
  await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes,{flag:'wx'});
 }
}

// Do not inherit model credentials, NODE_OPTIONS or the author's personal env.
const environment=Object.fromEntries(Object.entries(process.env).filter(([key])=>/^(PATH|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|PATHEXT)$/i.test(key)));
Object.assign(environment,{PORT:'4334',AI_BASE_URL:'',AI_MODEL:'',AI_API_KEY:'',AI_DAILY_LIMIT:'1',PAYPAL_CLIENT_ID:'',PAYPAL_CLIENT_SECRET:''});
async function command(executable,args,cwd){
 const child=spawn(executable,args,{cwd,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});
 let output='',error='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>error+=b);
 const [code]=await once(child,'close');if(code!==0)throw Error('Release command failed ('+code+'): '+output.slice(-5000)+error.slice(-2000));
 return output+error;
}
async function ensurePortFree(){
 const probe=createServer();await new Promise((ok,no)=>{probe.once('error',no);probe.listen(4334,'127.0.0.1',ok);});
 await new Promise((ok,no)=>probe.close(error=>error?no(error):ok()));
}
let server=null,serverError='';
async function stop(){
 if(!server)return;const child=server;server=null;
 if(child.exitCode!==null)return;
 const closed=once(child,'close');child.kill();
 await Promise.race([closed,delay(5000,undefined,{ref:false}).then(()=>{if(child.exitCode===null)child.kill('SIGKILL');})]);
 if(child.exitCode===null)await closed;
}
async function start(){
 await ensurePortFree();serverError='';
 server=spawn(process.execPath,['server.mjs'],{cwd:verification,env:environment,windowsHide:true,stdio:['ignore','ignore','pipe']});
 server.stderr.on('data',b=>serverError=(serverError+b).slice(-2000));
 for(let attempt=0;attempt<60;attempt++){
  if(server.exitCode!==null)throw Error('Verification server exited: '+serverError);
  try{const response=await fetch('http://127.0.0.1:4334/',{signal:AbortSignal.timeout(500)});if(response.ok)return;}catch{}
  await delay(100);
 }
 throw Error('Verification server did not become ready: '+serverError);
}
const checks=[];
async function request(path,{status=200,headers={},body}={}){
 const response=await fetch('http://127.0.0.1:4334'+path,{method:body?'POST':'GET',headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(4000)});
 if(!(Array.isArray(status)?status:[status]).includes(response.status))throw Error('Unexpected HTTP status for '+path+': '+response.status);
 checks.push({path,status:response.status,passed:true});return response;
}
let testOutput;
try{
 await start();
 const html=await (await request('/')).text();if(!html.includes('app.js'))throw Error('Homepage did not contain the application entry point.');
 for(const name of files.filter(name=>/^public\/.*\.(?:js|css)$/.test(name))){const bytes=Buffer.from(await (await request('/'+name.slice(7))).arrayBuffer());if(sha256(bytes)!==sha256(contents.get(name)))throw Error('Served runtime asset mismatch: '+name);}
 const boot=await (await request('/api/bootstrap')).json();
 if(boot.ai.configured!==false||boot.paypal.stage!=='unconfigured'||boot.snapshot.records.length!==0)throw Error('Fresh package did not start with empty, unconfigured services.');
 await request('/.env',{status:[403,404]});await request('/data/ledger.sqlite',{status:[403,404]});await request('/server.mjs',{status:[403,404]});
 await request('/',{status:403,headers:{Origin:'https://untrusted.example'}});
 await request('/',{status:403,headers:{'Sec-Fetch-Site':'cross-site'}});
 // Fetch controls the Host header itself; use node:http to send the actual adversarial header.
 const invalidHost=await new Promise((ok,no)=>{const req=httpRequest({hostname:'127.0.0.1',port:4334,path:'/',headers:{Host:'untrusted.example'}},res=>{res.resume();ok(res.statusCode);});req.on('error',no);req.setTimeout(4000,()=>req.destroy(Error('Host check timed out.')));req.end();});
 if(invalidHost!==403)throw Error('Untrusted Host was not rejected.');checks.push({path:'/',case:'untrusted Host',status:403,passed:true});
 const image=files.find(name=>/^public\/assets\/art\/.*\.webp$/.test(name));if(!image)throw Error('No packaged real-material image was found.');
 const imageData=Buffer.from(await (await request('/'+image.slice(7))).arrayBuffer());if(imageData.toString('ascii',0,4)!=='RIFF')throw Error('Packaged WebP could not be read.');
 const artManifest=await (await request('/assets/asset-manifest.json')).json();
 for(const asset of artManifest.assets){const bytes=Buffer.from(await (await request(asset.url)).arrayBuffer());if(sha256(bytes)!==asset.sha256)throw Error('Served art integrity mismatch: '+asset.assetId);}
 await request('/assets/illustration-prompts.json');await request('/credits.html');
 await request('/.env.sandbox-checkout',{status:[403,404]});
 const {freshState}=await import(pathToFileURL(join(verification,'public/seed.js')).href),state=freshState();state.budget.total=12345;
 const saved=await (await request('/api/state',{body:{book:'demo:practice',state}})).json();if(!saved.saved)throw Error('Fresh example state did not save.');
 await stop();await start();
 const recovered=await (await request('/api/state',{body:{book:'demo:practice'}})).json();if(recovered.state?.budget.total!==12345)throw Error('Example state did not survive restart.');
 await stop();
 const testFiles=(await readdir(join(verification,'tests'))).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>'tests/'+n);
 testOutput=await command(process.execPath,['--test',...testFiles],verification);
 await writeFile(join(run,'offline-tests.txt'),testOutput);
}catch(error){
 await writeFile(join(run,'FAILED.txt'),error.message+'\n');throw error;
}finally{await stop();}

const passed=Number(testOutput.match(/(?:#|ℹ) pass (\d+)/)?.[1]),failed=Number(testOutput.match(/(?:#|ℹ) fail (\d+)/)?.[1]);
if(!Number.isInteger(passed)||failed!==0)throw Error('Could not verify the offline test summary.');
const time=new Date().toISOString(),archiveName=folder+'.zip';
const report=`# v0.4 clean source-package check\n\nChecked at ${time}. This is a local release preparation, not a public repository, deployment or event submission.\n\n- Runtime: Node ${process.version}; Windows; fresh independent directory.\n- Configuration: no .env or previous database copied; model and PayPal environment values explicitly empty.\n- Server: port 4334; only the verification processes created by this check were started and stopped.\n- HTTP checks: ${checks.length} passed; homepage, unconfigured bootstrap, all image assets, manifest/credits/prompts, sensitive-file rejection, Origin/Host/cross-site rejection.\n- Persistence: synthetic practice limit 12345 minor units saved, server restarted, identical value recovered.\n- Offline tests: ${passed} passed, ${failed} failed; no paid model/PayPal calls.\n- Publication source: explicit allowlist; no .env/data/_history/logs/old projects/raw private evidence copied. Blank main/helper templates and optional Sandbox helper included.\n- Privacy: known local credentials/provider identifiers, credential-like strings and filled templates rejected; private evidence links explicitly point to the public verification summary. Local documentation targets checked.\n- Image/third-party notices included; five generated illustrations identified separately from retained CC0 physical-source derivatives.\n- ZIP: ${archiveName}; local output under _release/${relative(releaseRoot,run).replaceAll('\\','/')}/. ZIP inventory and SHA-256 are recorded in release-result.json alongside the archive.\n\nThe archive contains source only. Test-created SQLite data stays in the separate local verification directory and is not archived. RELEASE_MANIFEST.json lists packaged file hashes and the source digest.\n\n## Remaining gates\n\nThis clean run deliberately makes no external API call. Current external-service results and limits are summarized in docs/PUBLIC_VERIFICATION.md; this report does not override them. Free judge access, physical-device/headphone acceptance, public video and final submission remain separate gates. See docs/JUDGING_ACCESS.md for the current access handoff status.\n`;
await mkdir(join(payload,'验收'),{recursive:true});
await writeFile(join(payload,'验收/v4-release-check.md'),report);
const members=[...files,'验收/v4-release-check.md'].sort(),manifestEntries=[];
for(const name of members){const bytes=await readFile(join(payload,name));manifestEntries.push({path:name,bytes:bytes.length,sha256:sha256(bytes)});}
const sourceDigest=sha256(manifestEntries.map(e=>e.path+'\0'+e.sha256).join('\n'));
await writeFile(join(payload,'RELEASE_MANIFEST.json'),JSON.stringify({version:pkg.version,createdAt:time,node:process.version,sourceDigest,files:manifestEntries},null,2)+'\n');

const archive=join(run,archiveName),powershell=process.env.SystemRoot?join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'):'powershell.exe';
const zipScript=`$ErrorActionPreference = 'Stop'\n[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)\nCompress-Archive -LiteralPath ${psQuote(payload)} -DestinationPath ${psQuote(archive)} -CompressionLevel Optimal\nAdd-Type -AssemblyName System.IO.Compression.FileSystem\n$zipCheck = [System.IO.Compression.ZipFile]::OpenRead(${psQuote(archive)})\ntry { ConvertTo-Json -Compress -InputObject @($zipCheck.Entries | Where-Object { $_.Name -ne '' } | ForEach-Object { $_.FullName.Replace('\\','/') }) } finally { $zipCheck.Dispose() }`;
const zipEntries=JSON.parse(await command(powershell,['-NoProfile','-NonInteractive','-Command',zipScript],run));
const expected=[...members,'RELEASE_MANIFEST.json'].map(name=>folder+'/'+name).sort();
if(JSON.stringify(zipEntries.sort())!==JSON.stringify(expected))throw Error('ZIP inventory differs from the explicit source list; release not verified.');
const result={checkedAt:time,version:pkg.version,node:process.version,sourceDigest,archive:archiveName,archiveSha256:sha256(await readFile(archive)),archiveBytes:(await lstat(archive)).size,files:expected.length,archiveMembers:expected,offline:{passed,failed},http:checks,servicesConfigured:false,externalCalls:false,privacyScan:{knownPrivateValuesChecked:privateValues.size,rawEvidenceExcluded:true,templatesEmpty:true,documentationLinksChecked:true}};
await writeFile(join(run,'release-result.json'),JSON.stringify(result,null,2)+'\n');
await writeFile(join(root,'验收/v4-release-check.md'),report);
console.log(JSON.stringify({output:relative(root,run),archive:archiveName,archiveSha256:result.archiveSha256,archiveBytes:result.archiveBytes,sourceDigest,files:expected.length,offline:result.offline,httpChecks:checks.length,externalCalls:false},null,2));
