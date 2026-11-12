import {PageFlip} from './vendor/page-flip.js';
// The page engine only owns paper and gestures. Ledger mutations and audio stay outside.
export class Reader{
 constructor(root,{cover,leaves,start=0,closed=false,onPage=()=>{},onMotion=()=>{},reduced=false}){
  this.root=root;this.onPage=onPage;this.onMotion=onMotion;this.reduced=reduced;this.current=start;this.closed=closed;this.count=leaves.length;this.ready=false;this.moving=false;
  this.mark();
  this.portrait=matchMedia('(max-width:800px)').matches;
  const width=Math.floor(Math.min(root.clientWidth,this.portrait?520:1200)/(this.portrait?1:2));
  const height=this.portrait?Math.max(650,Math.min(760,innerHeight-180)):Math.max(650,Math.min(750,innerHeight-245));
  const leaf=(html,hard=false)=>{const el=document.createElement('div');el.className='paper-leaf';if(hard)el.dataset.density='hard';el.innerHTML=html;return el;};
  const elements=[leaf(cover,true)];
  for(const p of leaves){if(!this.portrait)elements.push(leaf(p.left));elements.push(leaf(p.right));}
  if(elements.length%2===1)elements.push(leaf('<div class="endpaper"><p>把日子轻轻合上。</p><small>记录仍在，随时再翻开。</small></div>'));
  elements.push(leaf(cover,true));root.append(...elements);root.tabIndex=-1;
  this.flip=new PageFlip(root,{width,height,size:'fixed',showCover:true,usePortrait:this.portrait,autoSize:true,startPage:closed?0:this.physical(start),drawShadow:true,maxShadowOpacity:.28,flippingTime:reduced?120:900,mobileScrollSupport:false,clickEventForward:true,disableFlipByClick:true,showPageCorners:!reduced,swipeDistance:35});
  this.flip.on('init',()=>{this.ready=true;this.mark();});
  this.flip.on('changeState',e=>{
   if(!this.ready)return;
   if(e.data==='user_fold'||e.data==='flipping'){if(!this.moving){this.moving=true;this.onMotion();}root.dataset.closed='false';root.classList.add('paper-moving');}
   if(e.data==='read'){root.classList.remove('paper-moving');const moved=this.moving;this.moving=false;if(moved)this.settled();}
  });
  this.flip.on('flip',()=>{if(this.ready&&!this.moving)queueMicrotask(()=>this.settled());});
  this.flip.loadFromHTML(elements);
  // Only paper edges initiate a drag; text selection and ledger controls remain ordinary DOM.
  const guard=e=>{const p=e.touches?.[0]||e,rect=root.getBoundingClientRect(),left=e.target.closest('.grip-left')||p.clientX-rect.left<42,right=e.target.closest('.grip-right')||rect.right-p.clientX<42;if(e.target.closest('.cover-start')||!left&&!right||right&&!this.closed&&this.current===this.count-1)e.stopPropagation();};
  root.addEventListener('mousedown',guard,true);root.addEventListener('touchstart',guard,{capture:true,passive:true});
 }
 physical(index){return this.portrait?index+1:index*2+1;}
 logical(index){return this.portrait?index-1:Math.floor((index-1)/2);}
 mark(){this.root.dataset.readingPage=String(this.current);this.root.dataset.closed=String(this.closed);}
 settled(){
  if(!this.ready)return;const physical=this.flip.getCurrentPageIndex();
  if(physical===0){this.closed=true;this.mark();this.onPage(this.current,{closed:true});return;}
  const logical=this.logical(physical);if(logical<0||logical>=this.count)return;
  const resumed=this.closed&&logical===this.current,changed=this.closed||logical!==this.current;this.closed=false;this.current=logical;this.mark();this.onPage(logical,{changed,resumed,closed:false});
 }
 open(){if(!this.closed||this.moving)return;this.root.focus({preventScroll:true});this.onMotion();this.flip.flip(this.physical(this.current),'bottom');}
 go(index){if(index<0||index>=this.count||index===this.current&&!this.closed||this.moving)return false;this.onMotion();if(this.reduced){this.flip.turnToPage(this.physical(index));this.settled();}else this.flip.flip(this.physical(index),'bottom');return true;}
 close(){if(this.moving)return;this.onMotion();if(this.reduced){this.flip.turnToPage(0);this.settled();}else this.flip.flip(0,'bottom');}
 destroy(){this.ready=false;this.flip.destroy();}
}
