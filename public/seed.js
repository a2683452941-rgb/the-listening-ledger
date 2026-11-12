export const categories=['餐饮','购物','教育','交通','娱乐','未分类'];
const row=(id,date,merchant,amount,category,extra={})=>({id,time:date+'+08:00',merchant,amount,currency:'CNY',category,source:'demo',unknownMerchant:false,duplicate:false,...extra});
export const transactions=[
 row('N01','2026-11-01T09:00:00','松果咖啡',1800,'餐饮'),
 row('N02','2026-11-01T12:00:00','河岸午餐',4200,'餐饮'),
 row('N03','2026-11-02T10:00:00','云梯课堂',8000,'教育'),
 row('N04','2026-11-03T15:00:00','纸上小店',7000,'购物'),
 row('N05','2026-11-04T12:00:00','山间餐馆',5000,'餐饮'),
 row('N06','2026-11-04T18:00:00','DEMO*042',2000,'未分类',{unknownMerchant:true}),
 row('N07','2026-11-05T16:00:00','绒线铺',4000,'购物')
];
export const defaultBudget={id:'DEMO-WEEK',start:'2026-11-01',end:'2026-11-07',currency:'CNY',total:30000,categories:{餐饮:10000,购物:10000,教育:10000},version:1,isDemo:true};
export function freshState(){return {version:1,scenario:'week',edits:{},history:[],budget:structuredClone(defaultBudget),range:{start:'2026-11-01',end:'2026-11-07'},mode:'date',pageKey:'2026-11-04',pagePart:0,onlyReview:false,position:0,volume:.7,muted:false,opened:false};}
export function scenarioRows(name){
 if(name==='empty')return [];
 if(name==='edge')return [
  row('E01','2026-11-01T09:00:00','示例课程',10000,'教育'),
  row('E02','2026-11-02T09:00:00','示例市集',15000,'购物'),
  row('E03','2026-11-03T09:00:00','DEMO*重复',6000,'未分类',{unknownMerchant:true,duplicate:true}),
  row('E04','2026-11-03T09:01:00','DEMO*重复',6000,'未分类',{duplicate:true})
 ];
 return transactions;
}
