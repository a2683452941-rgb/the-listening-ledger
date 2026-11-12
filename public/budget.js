import {validateRange,validDate,parseMoney,evaluate,totals,money} from './domain.js';
import {categories} from './seed.js';
export function periodRange(mode,anchor){
 if(mode==='month'){if(!/^\d{4}-\d{2}$/.test(anchor)||!validDate(anchor+'-01'))throw Error('请选择有效月份。');const d=new Date(anchor+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);d.setUTCDate(0);return {start:anchor+'-01',end:d.toISOString().slice(0,10)};}
 if(!validDate(anchor))throw Error('请选择有效日期。');const d=new Date(anchor+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);return {start,end:d.toISOString().slice(0,10)};
}
export function validateBudget(b,currency=b?.currency){
 if(!b||!['USD','CNY'].includes(currency)||b.currency!==currency)throw Error('限额币种与账本不一致。');validateRange(b.start,b.end);
 const check=n=>n===null||Number.isSafeInteger(n)&&n>=0&&n<=10000000000;
 if(!check(b.total)||!b.categories||Object.entries(b.categories).some(([k,v])=>!categories.includes(k)||k==='未分类'||!check(v)))throw Error('限额金额无效。');return b;
}
export function budgetFromForm(f,old){const mode=f.get('periodMode');if(!['week','month','custom'].includes(mode))throw Error('请选择有效周期方式。');const limits={};for(const c of categories.filter(x=>x!=='未分类'))if(f.has('cat-'+c))limits[c]=parseMoney(f.get('cat-'+c));return validateBudget({...old,...validateRange(f.get('start'),f.get('end')),periodMode:mode,total:parseMoney(f.get('total')),categories:limits,isDemo:false,version:old.version+1,updatedAt:new Date().toISOString()});}
export function budgetPreview(rows,old,next,edits,snapshot){const before=evaluate(rows,old,edits,snapshot),after=evaluate(rows,next,edits,snapshot);return {stats:totals(after,next,snapshot),changes:after.filter((r,i)=>r.status!==before[i].status).map(r=>({id:r.id,merchant:r.merchant,before:before.find(x=>x.id===r.id).status,after:r.status,reason:r.reason+(r.status==='green'?' '+r.category+'累计'+money(r.categoryCumulative,next.currency)+'；当前总限额'+(next.total===null?'未设置':money(next.total,next.currency))+'，分类限额'+(next.categories[r.category]==null?'未设置':money(next.categories[r.category],next.currency))+'。':'')}))};}
