export const themes=[
 {name:'晨雾森林',ink:'#476758',paper:'#f1f0e4',accent:'#bdad6f',motif:'forest'},
 {name:'风的邮笺',ink:'#866545',paper:'#f5eee1',accent:'#b99157',motif:'wind'},
 {name:'潮汐来信',ink:'#4a717a',paper:'#eaf0eb',accent:'#86aeb0',motif:'water'},
 {name:'星露之页',ink:'#596681',paper:'#eeedf2',accent:'#9e9eb7',motif:'stars'},
 {name:'落叶小径',ink:'#88644e',paper:'#f4eadd',accent:'#ba9058',motif:'forest'},
 {name:'纸上云游',ink:'#677a83',paper:'#ecf0f0',accent:'#92a9ae',motif:'wind'},
 {name:'月光花园',ink:'#6b7062',paper:'#eef0e6',accent:'#b4ac7b',motif:'stars'}
];
export const categoryThemes={餐饮:{name:'餐桌花园',ink:'#637151',paper:'#eff0e1',accent:'#a7b178',motif:'forest'},购物:{name:'纸上集市',ink:'#91664c',paper:'#f6ebdf',accent:'#c09b70',motif:'market'},教育:{name:'知识星图',ink:'#576486',paper:'#eeedf3',accent:'#a9a5c5',motif:'books'},交通:{name:'远行航线',ink:'#4d737d',paper:'#e9f1f0',accent:'#8db3b9',motif:'water'},娱乐:{name:'午夜小剧场',ink:'#80667c',paper:'#f2eaf1',accent:'#b79bac',motif:'stars'},未分类:{name:'未寄出的信',ink:'#60728b',paper:'#edf1f4',accent:'#a3b6c9',motif:'wind'}};
export function themeFor(key,mode){if(mode==='category')return categoryThemes[key]||categoryThemes.未分类;const d=Number(key.slice(-2))||1;return {...themes[(d-1)%themes.length],variant:d};}
export function ornament(motif){
 const common='<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">';
 const shapes={
 forest:'<path d="M95 265v-72m0 37c-38-8-42-35-33-46 31 2 40 23 33 46Zm0-16c37-6 43-33 34-48-28 3-40 24-34 48Zm6 51c30-41 43-60 72-75M143 222c-12-25-8-42 6-52 20 13 22 34-6 52Z"/><path d="M462 112v-57m0 26-24-27 24-28 26 28Zm-28 10 28-36 30 36Z"/><path d="M65 280q57-19 122 1M438 126q26-13 63 1"/>',
 stars:'<path d="m470 50 6 18 18 6-18 6-6 18-6-18-18-6 18-6ZM112 260l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z"/><path d="M84 63a29 29 0 1 0 35 35 26 26 0 0 1-35-35Z"/><circle cx="450" cy="260" r="32"/><ellipse cx="450" cy="260" rx="49" ry="12" transform="rotate(-24 450 260)"/><path stroke-dasharray="2 6" d="m140 90 80 22 48-48 68 40"/><circle cx="220" cy="112" r="3"/><circle cx="268" cy="64" r="3"/>',
 water:'<path d="M58 260q18-17 36 0t36 0t36 0M58 272q18-17 36 0t36 0t36 0M438 91q18-17 36 0t36 0M438 103q18-17 36 0t36 0M88 213l60 0-14 24h-33ZM119 211v-43l-25 40h25m4-35 22 35h-22"/><circle cx="478" cy="52" r="17"/>',
 wind:'<path d="M80 100c-28 0-24-28-3-26 0-25 37-28 42-2 32-8 41 29 11 30ZM419 251c-28 0-24-28-3-26 0-25 37-28 42-2 32-8 41 29 11 30Z"/><path d="m94 230 65-28-24 57-12-24Zm29 5 36-33M65 252q-24 15-11 29t36-3"/><path d="M423 76h69q20 0 16-16t-22-1m-63 30h45q26 0 21 18t-25 2"/>',
 market:'<path d="M65 262v-55h105v55m-110-55 14-28h86l14 28M62 207q13 17 27 0 13 17 27 0 13 17 27 0 13 17 28 0M84 261v-34h25v34m17-35h29v19h-29Z"/><path d="M439 69h58v53h-58Zm14 0V53a15 15 0 0 1 30 0v16"/>',
 books:'<path d="M63 240q32-16 65 0 30-16 63 0v-64q-34-15-63 0-34-15-65 0Zm65 0v-64m-51 13 36 0m-36 13 36 0m30-13h33m-33 13h33"/><path d="m445 111-12-54 13-3 12 54Zm22-1V47h13v63Zm18 0V66h13v44Z"/><path d="M427 115h80"/>'
 };
 return `<svg class="ornament" viewBox="0 0 560 340" aria-hidden="true">${common}${shapes[motif]||shapes.stars}<path d="m275 29 5-9 5 9-5 9Z"/><circle cx="333" cy="285" r="3"/><path d="M34 36h18m-9-9v18"/></g></svg>`;
}
export function coverArt(){return `<svg viewBox="0 0 440 520" role="img" aria-label="纸页里的星轨、花枝与账单声音地图"><g fill="none" stroke="currentColor" stroke-width="1.2"><rect x="28" y="28" width="384" height="464" rx="150"/><rect x="38" y="38" width="364" height="444" rx="143" stroke-dasharray="2 7"/><path d="M85 400C30 320 180 355 130 263S330 247 292 156 366 95 351 77" stroke-width="2" stroke-dasharray="4 7"/><circle cx="130" cy="263" r="22"/><circle cx="292" cy="156" r="18"/><circle cx="110" cy="365" r="15"/><path d="m294 332 9 24 24 9-24 9-9 24-9-24-24-9 24-9ZM164 107a31 31 0 1 0 37 37 28 28 0 0 1-37-37Z"/><path d="M218 447v-70m0 38c-38-8-42-35-33-46 31 2 40 23 33 46Zm0-16c37-6 43-33 34-48-28 3-40 24-34 48Z"/><path d="M215 220v-18a15 15 0 0 1 30 0v18l-5-5-5 5-5-5-5 5-5-5Z"/><circle cx="225" cy="202" r="1.5"/><circle cx="236" cy="202" r="1.5"/><path d="m338 254 4 12 12 4-12 4-4 12-4-12-12-4 12-4ZM85 178h16m-8-8v16"/></g><circle cx="130" cy="263" r="8" fill="#a4c8b1"/><path d="m292 145 11 11-11 11-11-11Z" fill="#d9957e"/><circle cx="110" cy="365" r="6" fill="#91bbd4"/></svg>`;}
