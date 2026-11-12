import {transactions} from './seed.js';
// Art follows confirmed content; illustrations are not evidence of purchased goods.
// Generated and physical-source assets are separately credited in the manifest.
const months=['冬光与新页','信件与灯影','新芽标本','雨窗街巷','花园与长桌','长昼书桌','水波与树荫','晚风小摊','新笔记','行囊与层林','深秋收藏','冬日收存'];
const categories={
 餐饮:{name:'餐桌备忘',caption:'AT THE TABLE',ink:'#514735',paper:'#faf6ed',accent:'#967347',layout:0},
 购物:{name:'日常选物',caption:'THINGS WE CHOOSE',ink:'#624534',paper:'#f8f2e9',accent:'#94664b',layout:3},
 教育:{name:'学习夹册',caption:'NOTES IN THE MARGINS',ink:'#3f504b',paper:'#f1f3ed',accent:'#66766c',layout:1},
 交通:{name:'沿途档案',caption:'PASSAGES & PLACES',ink:'#3e5156',paper:'#f0f4f2',accent:'#667e80',layout:2},
 娱乐:{name:'幕间收藏',caption:'AFTER THE CURTAIN',ink:'#54413e',paper:'#f6efeb',accent:'#846457',layout:4},
 未分类:{name:'待整理夹页',caption:'ROOM FOR A QUESTION',ink:'#53524a',paper:'#f4f3ed',accent:'#797568',layout:5}
};
const illustrations={
 coffee:{id:'daily-coffee-lunch',title:'咖啡与餐桌',heading:'在一餐之间，<br>记下日常。',kind:'generated'},
 meal:{id:'daily-meal',title:'一餐的片刻',heading:'把一餐，<br>留在纸上。',kind:'generated'},
 study:{id:'daily-study',title:'学习与笔记',heading:'为新的想法，<br>翻开一页。',kind:'generated'},
 stationery:{id:'daily-stationery',title:'纸与文具',heading:'把喜欢的小物，<br>慢慢收好。',kind:'generated'},
 yarn:{id:'daily-yarn',title:'绒线与手作',heading:'一缕绒线，<br>一页日常。',kind:'generated'},
 transit:{id:'station-photo',title:'车站影像 · 出行主题',heading:'沿途的片刻，<br>留作一页。',kind:'physical'},
 leisure:{id:'theater-drawing',title:'剧场画稿 · 休闲主题',heading:'留一点时间，<br>给生活。',kind:'physical'}
};
function illustrationFor(row){
 if(row.unknownMerchant||row.category==='未分类')return null;
 if(row.category==='教育')return illustrations.study;
 if(row.category==='餐饮')return /咖啡|coffee|cafe/i.test(row.merchant||'')?illustrations.coffee:illustrations.meal;
 // Specific shopping subjects require a supporting description.
 if(row.category==='购物')return /绒线|毛线|编织|yarn|knit/i.test(row.merchant||'')?illustrations.yarn:/纸|文具|stationery|sketch/i.test(row.merchant||'')?illustrations.stationery:null;
 if(row.category==='交通')return illustrations.transit;
 if(row.category==='娱乐')return illustrations.leisure;
 return null;
}
export function sceneFor(key,mode,part=0,items=[]){
 const month=Number(key.slice(5,7))||11,day=Number(key.slice(8,10))||1,c=categories[mode==='category'?key:'未分类']||categories.未分类,layout=mode==='date'?(day-1+part)%7:(c.layout+part)%7;
 const selected=[];let unpictured=0;
 for(const row of items){const art=illustrationFor(row);if(!art){unpictured++;continue;}if(!selected.some(a=>a.id===art.id))selected.push(art);}
 // Coffee-and-lunch already covers both dining entries on the same page.
 if(selected.includes(illustrations.coffee)&&selected.includes(illustrations.meal))selected.splice(selected.indexOf(illustrations.meal),1);
 const art=selected.slice(0,2),contentCategories=[...new Set(items.filter(r=>!r.unknownMerchant&&r.category!=='未分类'&&categories[r.category]).map(r=>r.category))];
 const empty=!items.length,unresolved=items.filter(r=>r.unknownMerchant||r.category==='未分类').length;
 const title=empty?'留白的一页':art.length===1?art[0].title:art.length>1?'这一页的生活片段':unresolved?'等待你补上名字':'日常支出笔记';
 const heading=empty?'把这一页，<br>留给空白。':art.length===1?art[0].heading:art.length>1?'不同的小事，<br>落在同一页。':unresolved?'等弄清这一笔，<br>再画下它。':'先记下花费，<br>再慢慢整理。';
 return {...c,key,mode,part,month,day,layout,variant:day+31*part,chapter:mode==='date'?months[month-1]:key,edition:mode==='date'?'日期手记':'生活图鉴',season:month===12?'winter':'autumn',paper:mode==='date'?'#faf6ed':c.paper,ink:mode==='date'?'#584b3d':c.ink,accent:mode==='date'?'#96754d':c.accent,name:title+(part?' · 续叶 '+(part+1):''),caption:mode==='date'?'A DAY IN SMALL DETAILS':c.caption,heading,art,assets:art.map(a=>a.id),motif:art[0]?.id||'blank',contentCategories,empty,unresolved,unpictured,additional:Math.max(0,selected.length-2),dark:false,custom:mode==='category'||month===11||month===12};
}
export function scenePoints(n,t){
 const profiles=[[[180,110],[500,235],[340,65]],[[165,95],[475,200],[235,270]],[[155,115],[395,240],[545,100]],[[170,95],[490,230],[370,65]],[[185,115],[495,230],[370,65]],[[170,115],[480,235],[345,65]],[[170,110],[490,240],[400,65]]];
 if(n<=3)return profiles[t.layout%7].slice(0,n);
 return Array.from({length:n},(_,i)=>[175+(i%2)*335,80+Math.floor(i/2)*175]);
}
const image=(asset,role,eager=false)=>`<img class="real-art-image ${role}" src="/assets/art/${asset}.${asset.startsWith('daily-')?'png':'webp'}" data-art-id="${asset}" alt="" loading="${eager?'eager':'lazy'}" decoding="async" draggable="false">`;
export function sceneArt(t,side='map'){
 const hero=side==='plate',classes=`editorial-art ${hero?'plate-editorial':'map-editorial map-scene'} ${t.mode}-editorial layout-${t.layout}`;
 if(!hero&&t.unresolved)return `<div class="${classes}" data-art-version="5" aria-hidden="true"></div>`;
 if(!t.art.length)return `<div class="${classes} empty-art" data-art-version="5" aria-hidden="true"><span class="blank-date">${t.empty?String(t.day).padStart(2,'0'):'?'}</span><p>${t.empty?'这一页，留给空白。':t.unresolved?'还没弄清的，先不配图。':'没有合适的插画，保留笔记。'}</p></div>`;
 const note=[t.unresolved?`${t.unresolved} 笔待核对，未据此配图`:t.unpictured?`${t.unpictured} 笔暂无对应插画`:null,t.additional?'其余主题请看右页明细':null].filter(Boolean).join(' · ');
 return `<div class="${classes} ${t.art.length>1?'mixed':''}" data-art-version="5" aria-hidden="true">${(hero?t.art:t.art.slice(0,1)).map(a=>`<figure class="daily-illustration">${image(a.id,'content-art-image')}<figcaption>${a.title}</figcaption></figure>`).join('')}${hero?`<div class="art-context"><span>按本页记录选图</span><strong>${t.contentCategories.join(' · ')}</strong>${note?`<small>${note}</small>`:''}</div>`:''}</div>`;
}
export function coverArt(mode){
 const date=mode==='date';
 return `<div class="cover-engraving real-cover-art ${date?'chronicle-art':'archive-art'}" aria-hidden="true">${image(date?'daily-coffee-lunch':'daily-study','collage-cover-main',true)}<span class="cover-art-tag">${date?'一日一叶':'生活的分类笔记'}<small>${date?'A PERSONAL CHRONICLE':'AN EVERYDAY ARCHIVE'}</small></span></div>`;
}
export function sceneCatalog(){return [...Array.from({length:7},(_,i)=>{const key='2026-11-'+String(i+1).padStart(2,'0');return {key,mode:'date',items:transactions.filter(r=>r.time.startsWith(key))};}),...Object.keys(categories).map(key=>({key,mode:'category',items:transactions.filter(r=>r.category===key)}))];}

