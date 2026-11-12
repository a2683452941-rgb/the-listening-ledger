import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicFile,publicMarkdown,checkLocalLinks} from '../scripts/release-policy.mjs';

test('release rejects private paths and filled main/helper credential templates',()=>{
 for(const name of ['docs/TEAMMATE_GUIDE_ZH.md','docs/PITCH_RECORDING_KIT_ZH_EN.md','docs/DEMO_SUBTITLES_EN.srt','docs/DEMO_SCRIPT_EN.md','docs\\TEAMMATE_GUIDE_ZH.md'])assert.throws(()=>validatePublicFile(name,Buffer.from('')),/Local-only document/);
 for(const name of ['.env','.env.sandbox-checkout','.env.judging','data/ledger.sqlite','lib/local.log','_history/old.js'])assert.throws(()=>validatePublicFile(name,Buffer.from('')),/Private path/);
 for(const [name,key] of [['.env.example','AI_API_KEY'],['.env.sandbox-checkout.example','PAYPAL_TEST_MERCHANT_CLIENT_SECRET']]){
  assert.doesNotThrow(()=>validatePublicFile(name,Buffer.from(key+'=\n')));
  assert.throws(()=>validatePublicFile(name,Buffer.from(key+'=filled-value\n')),/nonempty credential/);
  assert.throws(()=>validatePublicFile(name,Buffer.from('export '+key+' = "filled-value"\n')),/nonempty credential/);
 }
});

test('release rejects known private identifiers and secrets without echoing their values',()=>{
 const secret=['test','private','provider','identifier'].join('-');
 assert.throws(()=>validatePublicFile('docs/example.md',Buffer.from('Record: '+secret),{privateValues:[secret]}),error=>error.message.includes('docs/example.md')&&!error.message.includes(secret));
 assert.throws(()=>validatePublicFile('public/example.js',Buffer.from(['sk','a'.repeat(30)].join('-'))),/Credential-like/);
 assert.throws(()=>validatePublicFile('docs/subtitles.srt',Buffer.from(['sk','a'.repeat(30)].join('-'))),/Credential-like/);
 const localPath=['C:','Users','Example','app'].join(String.fromCharCode(92));
 assert.throws(()=>validatePublicFile('README.md',Buffer.from(localPath)),/Machine-specific/);
 assert.throws(()=>validatePublicFile('README.md',Buffer.from('`'+localPath+'`')),/Machine-specific/);
});

test('public evidence references name the summary and preserve external/public links',()=>{
 const result=publicMarkdown('docs/TESTING.md','[private run](../验收/live.json) [screen](../验收截图/page.png) [report](../验收/v4-release-check.md) [source](https://example.com)');
 assert.equal(result,'[Public verification summary — private run](PUBLIC_VERIFICATION.md) [Public verification summary — screen](PUBLIC_VERIFICATION.md) [report](../验收/v4-release-check.md) [source](https://example.com)');
 assert.equal(publicMarkdown('README.md','[old PRD](PRD-v4.md)'),'[Public verification summary — old PRD](docs/PUBLIC_VERIFICATION.md)');
});

test('release catches missing local documentation targets after public link conversion',()=>{
 const contents=new Map([['README.md',Buffer.from('[guide](docs/JUDGING_ACCESS.md) [section](#start)')],['docs/JUDGING_ACCESS.md',Buffer.from('[result](../验收/v4-release-check.md)')]]);
 assert.doesNotThrow(()=>checkLocalLinks(contents,['验收/v4-release-check.md']));
 assert.throws(()=>checkLocalLinks(contents),/Missing public documentation target/);
});
