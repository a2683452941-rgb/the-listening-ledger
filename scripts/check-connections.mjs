// Read-only Sandbox capability check. Never print credentials or access tokens.
import {config} from '../lib/config.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
const report={checkedAt:new Date().toISOString(),environment:'sandbox',oauth:false,query:false,records:0,events:{}};
try{
 if(!config.client||!config.secret)throw Error('Sandbox configuration missing');
 const auth=await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(config.client+':'+config.secret).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(25000)});
 report.oauthStatus=auth.status;const token=await auth.json();if(!auth.ok||!token.access_token)throw Error('OAuth failed');report.oauth=true;
 report.transactionScope=String(token.scope||'').split(' ').some(x=>/reporting\/search/.test(x));
 const end=new Date(),start=new Date(end);start.setUTCDate(start.getUTCDate()-29);
 const q=new URLSearchParams({start_date:start.toISOString(),end_date:end.toISOString(),fields:'transaction_info,cart_info',page_size:'100',page:'1',balance_affecting_records_only:'Y'});
 const response=await fetch('https://api-m.sandbox.paypal.com/v1/reporting/transactions?'+q,{headers:{Authorization:'Bearer '+token.access_token},signal:AbortSignal.timeout(30000)});
 report.queryStatus=response.status;const result=await response.json();report.query=response.ok;
 if(response.ok){report.records=result.transaction_details?.length||0;report.totalPages=result.total_pages;for(const row of result.transaction_details||[]){const i=row.transaction_info,k=i.transaction_event_code+':'+(Number(i.transaction_amount?.value)<0?'debit':'credit');report.events[k]=(report.events[k]||0)+1;}}
 else {report.error=result.name||'Query rejected';report.debugId=result.debug_id||null;}
}catch(error){report.failure=error.name==='TimeoutError'?'Connection timed out':error.message;}
mkdirSync('验收',{recursive:true});writeFileSync('验收/paypal-capability-2026-11-10.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
