// One route, one timer; pausing a held note never replays that note on resume.
export class Transport {
 constructor({clock={now:()=>performance.now(),set:(f,t)=>setTimeout(f,t),clear:id=>clearTimeout(id)},change=()=>{},arrive=()=>{},travel=900,hold=1600}={}){Object.assign(this,{clock,change,arrive,travel,hold});this.count=0;this.cursor=0;this.phase='travel';this.running=false;this.remaining=travel;this.timer=null;this.epoch=0;}
 load(count,cursor=0){this.stop();this.count=count;this.cursor=Math.min(Math.max(cursor,0),Math.max(0,count-1));this.phase='travel';this.remaining=this.travel;this.change(this);}
 start(){if(!this.count)return;if(this.phase==='ended'){this.cursor=0;this.phase='travel';this.remaining=this.travel;}if(this.running)return;this.running=true;this.schedule();this.change(this);}
 schedule(){const epoch=++this.epoch;this.deadline=this.clock.now()+this.remaining;this.timer=this.clock.set(()=>{if(epoch!==this.epoch||!this.running)return;this.timer=null;if(this.phase==='travel'){this.phase='hold';this.remaining=this.hold;this.arrive(this.cursor);}else if(this.cursor+1>=this.count){this.phase='ended';this.running=false;this.remaining=0;this.change(this);return;}else{this.cursor++;this.phase='travel';this.remaining=this.travel;}this.change(this);this.schedule();},this.remaining);}
 pause(){if(this.running){this.remaining=Math.max(0,this.deadline-this.clock.now());this.running=false;this.clock.clear(this.timer);this.epoch++;this.timer=null;}this.change(this);}
 stop(){this.running=false;this.clock.clear(this.timer);this.epoch++;this.timer=null;}
 seek(i,auto=false){this.pause();this.cursor=Math.min(Math.max(i,0),Math.max(0,this.count-1));this.phase='travel';this.remaining=this.travel;if(auto)this.start();else this.change(this);}
 get progress(){if(this.phase==='ended')return this.count;if(this.phase==='hold')return this.cursor+1;const left=this.running?Math.max(0,this.deadline-this.clock.now()):this.remaining;return this.cursor+1-left/this.travel;}
}
