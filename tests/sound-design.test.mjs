import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTone,soundProfiles,tonePeakLimit,toneDuration,toneRmsTarget} from '../public/sound-design.js';
const stats=pcm=>{let peak=0,sum=0;for(const v of pcm){peak=Math.max(peak,Math.abs(v));sum+=v*v;}return {peak,rms:Math.sqrt(sum/pcm.length)};};
const rms=(pcm,start,end,rate)=>stats(pcm.subarray(Math.floor(start*rate),Math.floor(end*rate))).rms;

test('all motifs have bounded peaks, similar whole-motif energy, and finish inside the node hold',()=>{
 for(const sampleRate of [44100,48000]){
  const levels=[];
  for(const status of Object.keys(soundProfiles)){
   const pcm=renderTone(status,sampleRate),level=stats(pcm);levels.push(level.rms);
   assert.ok(pcm.every(Number.isFinite));assert.equal(pcm.length,Math.ceil(sampleRate*toneDuration));assert.ok(toneDuration<1.65);
   assert.ok(level.peak<=tonePeakLimit+1e-7);assert.ok(Math.abs(level.rms-toneRmsTarget)<1e-6,'all three receive the same gain without hitting the peak cap');assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);
   assert.ok(pcm.subarray(Math.ceil(1.15*sampleRate)).every(v=>v===0));
  }
  assert.ok(20*Math.log10(Math.max(...levels)/Math.min(...levels))<1,'red must not become a louder warning than green/blue');
 }
});
test('blue leaves a clearly silent question gap, while red separates its two rhythmic groups',()=>{
 const rate=48000,blue=renderTone('blue',rate),red=renderTone('red',rate);
 assert.equal(rms(blue,.31,.7,rate),0);assert.ok(rms(blue,0,.25,rate)>.1);assert.ok(rms(blue,.72,.95,rate)>.1);
 assert.equal(rms(red,.38,.55,rate),0);assert.ok(rms(red,0,.16,rate)>.1);assert.ok(rms(red,.57,.72,rate)>.1);
 assert.notDeepEqual(blue,red);assert.notDeepEqual(renderTone('green'),red);
});
test('green has a continuous soft chord while red has a short strike envelope and blue a brighter register',()=>{
 const rate=48000,green=renderTone('green',rate),red=renderTone('red',rate),blue=renderTone('blue',rate);
 // Protect the perceptual design dimensions; numerical checks do not replace headphone listening.
 assert.ok(rms(green,.01,.04,rate)<rms(green,.11,.14,rate)*.6,'green eases into its chord');
 assert.ok(rms(red,.01,.04,rate)>rms(red,.11,.14,rate)*1.5,'wood strikes have a distinct attack and short decay');
 assert.ok(rms(green,.4,.5,rate)>.08,'green joins its notes, unlike the empty space in red/blue');
 const highFrequencyWeight=pcm=>{let differences=0,energy=0;for(let i=1;i<pcm.length;i++){differences+=(pcm[i]-pcm[i-1])**2;energy+=pcm[i]**2;}return Math.sqrt(differences/energy);};
 assert.ok(highFrequencyWeight(blue)>highFrequencyWeight(green)*2.5);
 assert.ok(highFrequencyWeight(blue)>highFrequencyWeight(red)*2.5);
});
test('unknown status sounds uncertain instead of implying a safe transaction',()=>{assert.deepEqual(renderTone('unrecognized'),renderTone('blue'));});
