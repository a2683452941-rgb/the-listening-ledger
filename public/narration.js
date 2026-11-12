// One factual script shared by the screen and the server; amounts remain integer cents.
export function spokenMoney(cents,currency='CNY'){
 if(!Number.isSafeInteger(cents)||cents<0)return '金额待核对';
 const whole=Math.floor(cents/100),fraction=cents%100;
 if(currency==='USD')return whole+'美元'+(fraction?fraction+'美分':'');
 if(currency==='CNY')return whole+'元'+(Math.floor(fraction/10)?Math.floor(fraction/10)+'角':'')+(fraction%10?fraction%10+'分':'');
 return (cents/100).toFixed(2)+' '+currency;
}
export function narration(row){
 const amount=spokenMoney(row.amount,row.currency),merchant=String(row.merchant||'').trim();
 const name=merchant&&merchant.length<=24&&!/[*#]|\d{5}/.test(merchant)?merchant:'这笔消费';
 let reason='这笔没有触发你设置的超额提醒。';
 if(row.status==='blue')reason=row.unknownMerchant?'收款名称还没核对清楚，请确认自己是否认识这笔。':row.category==='未分类'?'分类还没确定，你可以补一句买了什么。':row.doubts?.[0]||'这笔还有信息需要你核对。';
 const alert=row.alerts?.find(x=>x.kind==='category')||row.alerts?.find(x=>x.kind==='total')||row.alerts?.[0];
 if(alert){const lead=alert.kind==='category'?row.category:'已记录购买';const text=alert.kind==='reminder'?'你给这笔设置了留意提醒。':'截至这笔，'+lead+'累计'+spokenMoney(alert.value,row.currency)+'，'+(row.coverage?.sufficient===false?'至少超出限额':'比限额多')+spokenMoney(alert.over,row.currency)+'。';reason=row.status==='blue'?reason+'另外，'+text:text;}
 return name+'，'+amount+'。'+reason;
}
export const auditionText='松果咖啡，十八元。这笔没有触发你设置的超额提醒。另一笔是二十六美元五十美分，分类还需要你核对。';
export function rankVoices(voices){return voices.filter(v=>/^zh|^cmn/i.test(v.lang)).sort((a,b)=>voiceScore(b)-voiceScore(a));}
function voiceScore(v){return (/zh[-_]CN|cmn[-_]CN/i.test(v.lang)?100:0)+(/Natural|Online|Neural|自然/i.test(v.name)?50:0)+(/Xiaoxiao|Xiaoyi|Yunxi|晓晓|晓伊/i.test(v.name)?15:0)+(v.default?2:0);}
