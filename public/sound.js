import {rankVoices} from './narration.js';
import {renderTone,toneKey} from './sound-design.js';
export class Sound {
 constructor(notify=()=>{}){this.volume=.7;this.muted=true;this.nodes=[];this.buffers=new Map();this.notify=notify;this.speechEpoch=0;this.toneReadyAt=0;}
 async enable(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error();this.context??=new AC();if(this.context.state!=='running'){let timer;try{await Promise.race([this.context.resume(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('audio timeout')),1500);})]);}finally{clearTimeout(timer);}}if(this.context.state!=='running')throw Error();if(!this.master){this.master=this.context.createGain();this.master.gain.setValueAtTime(this.volume,this.context.currentTime);this.master.connect(this.context.destination);}return true;}catch{this.notify('音频暂不可用，仍可阅读账单。请点击播放重试。');return false;}}
 stopTone(){for(const {source,gain} of this.nodes){try{this.toneReadyAt=this.context.currentTime+.04;gain.gain.setTargetAtTime(0,this.context.currentTime,.008);source.stop(this.toneReadyAt);}catch{}}this.nodes=[];}
 stopSpeech(){this.speechEpoch++;window.speechSynthesis?.cancel();}
 stop(){this.stopTone();this.stopSpeech();}
 setVolume(value){const next=Number(value);if(!Number.isFinite(next))return;this.volume=Math.max(0,Math.min(1,next));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.015);if(this.volume===0)this.stopSpeech();}
 setVoice(name='',rate=1){this.voiceName=name;this.voiceRate=Math.max(.8,Math.min(1.2,Number(rate)||1));}
 setMuted(value){this.muted=value;if(value)this.stop();}
 tone(status,pan=0){
  this.stop();if(this.muted||this.volume===0||this.context?.state!=='running'||!this.master)return false;
  const ctx=this.context,key=toneKey(status);
  if(!this.buffers.has(key)){const pcm=renderTone(key,ctx.sampleRate),buffer=ctx.createBuffer(1,pcm.length,ctx.sampleRate);buffer.getChannelData(0).set(pcm);this.buffers.set(key,buffer);}
  const source=ctx.createBufferSource(),gain=ctx.createGain(),panner=ctx.createStereoPanner?.();source.buffer=this.buffers.get(key);gain.gain.setValueAtTime(1,ctx.currentTime);source.connect(gain);
  if(panner){panner.pan.value=Math.max(-.6,Math.min(.6,Number(pan)||0));gain.connect(panner);panner.connect(this.master);}else gain.connect(this.master);
  const node={source,gain,panner};this.nodes.push(node);
  source.onended=()=>{source.disconnect();gain.disconnect();panner?.disconnect();this.nodes=this.nodes.filter(n=>n!==node);};source.start(Math.max(ctx.currentTime,this.toneReadyAt));return true;
 }
 speak(text,done=()=>{}){
  this.stop();if(this.muted){this.notify('当前静音：文字内容已展示。');return false;}
  if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){this.notify('此浏览器不支持朗读，请阅读下方文字。');return false;}
  const voices=rankVoices(speechSynthesis.getVoices()),voice=voices.find(v=>v.name===this.voiceName)||voices[0];
  if(!voice){this.notify('设备还没有可用的中文音色，请打开朗读设置检查；文字仍可阅读。');return false;}
  const epoch=this.speechEpoch,u=new SpeechSynthesisUtterance(text);u.lang=voice.lang;u.rate=this.voiceRate||1;u.pitch=1;u.volume=this.volume;u.voice=voice;
  u.onend=()=>{if(epoch===this.speechEpoch)done('朗读结束');};u.onerror=e=>{if(epoch!==this.speechEpoch)return;if(!['interrupted','canceled'].includes(e.error)){this.notify('朗读暂不可用，金额和原因仍可阅读。');done('朗读不可用');}};speechSynthesis.speak(u);return true;
 }
 pauseSpeech(){if(window.speechSynthesis?.paused)speechSynthesis.resume();else window.speechSynthesis?.pause();}
}
