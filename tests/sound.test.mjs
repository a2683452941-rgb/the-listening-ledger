import test from 'node:test';
import assert from 'node:assert/strict';
import {Sound} from '../public/sound.js';
import {renderTone} from '../public/sound-design.js';
function setup(){
 const notes=[],utterances=[],gains=[],panners=[];let cancelled=0;
 const param=()=>({value:0,events:[],setValueAtTime(value,at){this.value=value;this.events.push({value,at});},setTargetAtTime(value,at,constant){this.value=value;this.events.push({value,at,constant});}});
 const node=()=>({connect(target){this.target=target;},disconnect(){this.disconnected=true;}});
 class Context{
  currentTime=0;state='running';destination={};sampleRate=48000;
  createBuffer(channels,length,sampleRate){const pcm=new Float32Array(length);return {numberOfChannels:channels,length,sampleRate,getChannelData:()=>pcm};}
  createBufferSource(){const o={...node(),start(at){this.started=true;this.startAt=at;},stop(at){this.stopped=(this.stopped||0)+1;this.stopAt=at;}};notes.push(o);return o;}
  createGain(){const gain={...node(),gain:param()};gains.push(gain);return gain;}
  createStereoPanner(){const panner={...node(),pan:param()};panners.push(panner);return panner;}
 }
 globalThis.window={AudioContext:Context,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{cancel(){cancelled++;},getVoices(){return [{name:'测试中文',lang:'zh-CN',localService:true}];},speak(u){utterances.push(u);},pause(){},resume(){}}};
 globalThis.SpeechSynthesisUtterance=window.SpeechSynthesisUtterance;globalThis.speechSynthesis=window.speechSynthesis;
 return {notes,utterances,gains,panners,get cancelled(){return cancelled;}};
}
test('switching status fades the whole old motif; mute cancels pending notes and prevents new sound',async()=>{
 const {notes,gains}=setup(),s=new Sound();await s.enable();s.setMuted(false);s.tone('green');s.context.currentTime=.1;s.tone('red');
 assert.equal(notes[0].stopped,1);assert.ok(notes[0].stopAt<=.15);assert.equal(gains[1].gain.events.at(-1).value,0);
 const current=s.nodes[0];notes[0].onended();assert.deepEqual(s.nodes,[current]);assert.equal(notes[0].disconnected,true);
 s.setMuted(true);assert.equal(notes[1].stopped,1);assert.equal(s.nodes.length,0);assert.equal(s.tone('blue'),false);assert.equal(notes.length,2);
});
test('browser uses the shared preview PCM, reuses decoded motifs, and releases ended nodes',async()=>{
 const {notes,gains,panners}=setup(),s=new Sound();await s.enable();s.setMuted(false);s.tone('green',99);
 assert.deepEqual(notes[0].buffer.getChannelData(0),renderTone('green'));assert.equal(panners[0].pan.value,.6);
 s.tone('green');assert.equal(notes[0].buffer,notes[1].buffer);notes[0].onended();notes[1].onended();
 assert.equal(s.nodes.length,0);assert.ok(notes.every(n=>n.disconnected));assert.ok(panners.every(n=>n.disconnected));assert.ok(gains.slice(1).every(n=>n.disconnected));assert.equal(gains[0].disconnected,undefined);
});
test('rapid switching waits for the previous fade so louder motifs never overlap',async()=>{
 const {notes}=setup(),s=new Sound();await s.enable();s.setMuted(false);s.tone('green');assert.equal(notes[0].startAt,0);
 s.context.currentTime=.12;s.tone('red');assert.ok(notes[1].startAt>=notes[0].stopAt);
 s.context.currentTime=.13;s.tone('blue');assert.ok(notes[2].startAt>=notes[1].stopAt);assert.ok(notes[2].startAt>=notes[0].stopAt);
 s.context.currentTime=.14;s.setMuted(true);s.setMuted(false);s.tone('green');assert.ok(notes[3].startAt>=notes[2].stopAt);
 s.context.currentTime=2;for(const n of [...notes])n.onended();s.tone('blue');assert.equal(notes.at(-1).startAt,2,'after silence the first note must still start immediately');
});
test('saved volume applies at start and the slider changes the active sound smoothly, including silence',async()=>{
 const {notes,gains,utterances}=setup(),s=new Sound();s.setVolume(.8);await s.enable();s.setMuted(false);s.tone('blue');
 assert.equal(gains[0].gain.events[0].value,.8);s.context.currentTime=.3;s.setVolume(.6);assert.equal(gains[0].gain.events.at(-1).value,.6);assert.ok(gains[0].gain.events.at(-1).constant>0);assert.equal(notes.length,1);
 s.setVolume(3);assert.equal(s.volume,1);s.setVolume(NaN);assert.equal(s.volume,1);const updates=[];s.speak('十二美元',x=>updates.push(x));s.setVolume(-1);
 assert.equal(gains[0].gain.events.at(-1).value,0);assert.equal(s.tone('red'),false);utterances[0].onend();assert.deepEqual(updates,[]);
});
test('speech replaces state audio and a stale utterance cannot update current UI',async()=>{const {notes,utterances}=setup(),s=new Sound();await s.enable();s.setMuted(false);s.tone('red');const updates=[];s.speak('first',x=>updates.push(x));assert.equal(notes[0].stopped,1);s.speak('second',x=>updates.push(x));utterances[0].onend();assert.deepEqual(updates,[]);utterances[1].onend();assert.deepEqual(updates,['朗读结束']);s.stop();utterances[1].onend();assert.equal(updates.length,1);});
test('speech unavailable and audio unavailable report readable fallback',async()=>{setup();const notices=[],s=new Sound(x=>notices.push(x));s.setMuted(false);delete window.speechSynthesis;assert.equal(s.speak('demo'),false);delete window.AudioContext;assert.equal(await s.enable(),false);assert.equal(notices.length,2);});
test('no Chinese device voice is disclosed instead of silently reading with an English default',()=>{const {utterances}=setup(),notices=[],s=new Sound(x=>notices.push(x));window.speechSynthesis.getVoices=()=>[{name:'English',lang:'en-US'}];s.setMuted(false);assert.equal(s.speak('二十元'),false);assert.equal(utterances.length,0);assert.match(notices[0],/没有可用的中文音色/);});
test('selected device voice and rate are applied, and mute invalidates late speech callbacks',()=>{const {utterances}=setup(),s=new Sound();s.setMuted(false);s.setVoice('测试中文',.9);const messages=[];s.speak('二十元',x=>messages.push(x));assert.equal(utterances[0].voice.name,'测试中文');assert.equal(utterances[0].rate,.9);s.setMuted(true);utterances[0].onend();assert.deepEqual(messages,[]);assert.equal(s.speak('下一笔'),false);});
test('a browser audio resume that never resolves times out with a readable fallback',async()=>{setup();window.AudioContext=class{state='suspended';resume(){return new Promise(()=>{});}};const notices=[],s=new Sound(x=>notices.push(x));assert.equal(await s.enable(),false);assert.match(notices[0],/仍可阅读/);});
