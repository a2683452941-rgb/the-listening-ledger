import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {renderTone,soundProfiles,toneDuration,toneRmsTarget,tonePeakLimit} from '../public/sound-design.js';

// Same PCM as Sound.tone(), at 70% master volume and a centered equal-power pan.
// These are synthesized reference files, not recordings of a speaker/headphone or device voice.
const output=fileURLToPath(new URL('../验收/声音预览/',import.meta.url));
const sampleRate=48000,volume=.7,channels=2;
await mkdir(output,{recursive:true});
const metrics=[];
for(const [status,filename] of [['green','green-settle.wav'],['red','red-attention.wav'],['blue','blue-question.wav']]){
 const pcm=renderTone(status,sampleRate),wav=Buffer.alloc(44+pcm.length*channels*2);
 wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);
 wav.writeUInt16LE(channels,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*channels*2,28);wav.writeUInt16LE(channels*2,32);wav.writeUInt16LE(16,34);
 wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
 let peak=0,sum=0;
 for(let i=0;i<pcm.length;i++){
  const value=pcm[i]*volume*Math.SQRT1_2,quantized=Math.round(value*32767);peak=Math.max(peak,Math.abs(value));sum+=value*value;
  wav.writeInt16LE(quantized,44+i*4);wav.writeInt16LE(quantized,46+i*4);
 }
 await writeFile(join(output,filename),wav);
 const perChannelRms=Math.sqrt(sum/pcm.length),pcmRms=perChannelRms/(volume*Math.SQRT1_2);
 metrics.push({status,name:soundProfiles[status].name,instrument:soundProfiles[status].instrument,filename,durationSeconds:toneDuration,pcmPeak:Number((peak/(volume*Math.SQRT1_2)).toFixed(6)),pcmRms:Number(pcmRms.toFixed(6)),gainVersusRevision2Db:Number((20*Math.log10(pcmRms/.16)).toFixed(3)),perChannelPeak:Number(peak.toFixed(6)),perChannelRms:Number(perChannelRms.toFixed(6))});
}
await writeFile(join(output,'sound-metrics.json'),JSON.stringify({designRevision:4,source:'public/sound-design.js renderTone (same PCM as browser)',sampleRate,channels,volume,requestedPcmRms:toneRmsTarget,pcmPeakLimit:tonePeakLimit,centerPan:'equal-power',hardwareRecording:false,metrics},null,2)+'\n');
console.log(JSON.stringify({output,metrics},null,2));
