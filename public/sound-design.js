// Original, deterministic status motifs. These are emotional cues, not fraud scores.
// [frequency in Hz, start in seconds, sounding duration in seconds].
export const soundProfiles={
 green:{name:'暖和弦',description:'低柔三音连成稳定和弦',instrument:'felt',notes:[[261.63,0,1.08],[329.63,.12,.96],[392,.24,.84]]},
 red:{name:'木敲提醒',description:'干燥木敲，短短、短长',instrument:'wood',notes:[[330,0,.18],[330,.2,.18],[294,.56,.18],[294,.78,.3]]},
 blue:{name:'玻璃问句',description:'轻玻璃铃、留白、上行问句',instrument:'glass',notes:[[1046.5,0,.3],[1318.51,.71,.43]]}
};
export const tonePeakLimit=.88;
export const toneRmsTarget=.16*Math.SQRT2;
export const toneDuration=1.25;
export const toneKey=status=>Object.hasOwn(soundProfiles,status)?status:'blue';

// The app and downloadable previews use exactly this PCM renderer.
// Each status has a distinct instrument, register and envelope, not just a different melody.
export function renderTone(status,sampleRate=48000){
 const samples=new Float32Array(Math.ceil(sampleRate*toneDuration)),profile=soundProfiles[toneKey(status)];
 for(const [frequency,start,duration] of profile.notes){
  const first=Math.round(start*sampleRate),length=Math.round(duration*sampleRate);
  let noiseSeed=1709;
  for(let i=0;i<length;i++){
   const t=i/sampleRate,phase=2*Math.PI*frequency*t;let wave,attack,release,decay;
   if(profile.instrument==='felt'){
    // Overlapping mellow chord tones; a broad soft onset instead of separate electronic beeps.
    wave=Math.sin(phase)+.12*Math.sin(phase*2)+.045*Math.sin(phase*3);
    attack=Math.min(1,t/.065);release=Math.min(1,(duration-t)/.22);decay=Math.exp(-t/.8);
   }else if(profile.instrument==='wood'){
    // Brief noise contact and damped, inharmonic wood-body modes. Seeded for repeatable previews.
    noiseSeed=(Math.imul(noiseSeed,1664525)+1013904223)|0;
    const noise=(noiseSeed>>>0)/2147483648-1;
    wave=.9*Math.sin(phase)+.18*Math.sin(phase*1.47)*Math.exp(-t*12)+.08*Math.sin(phase*2.19)*Math.exp(-t*24)+.1*noise*Math.exp(-t*75);
    attack=Math.min(1,t/.004);release=Math.min(1,(duration-t)/.016);decay=Math.exp(-t/.15);
   }else{
    // High glass-like partials and a separated second chime keep uncertainty airy and questioning.
    wave=Math.sin(phase)+.22*Math.sin(phase*2.756)*Math.exp(-t*8)+.07*Math.sin(phase*4.072)*Math.exp(-t*14);
    attack=Math.min(1,t/.009);release=Math.min(1,(duration-t)/.06);decay=Math.exp(-t/.32);
   }
   samples[first+i]+=wave*attack*release*decay;
  }
 }
 let energy=0,peak=0;
 for(const sample of samples){energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
 // Match approximate whole-motif energy, with conservative digital headroom.
 // This does not claim equal perceived loudness on every speaker or headphone.
 const scale=Math.min(toneRmsTarget/Math.sqrt(energy/samples.length),tonePeakLimit/peak);
 for(let i=0;i<samples.length;i++)samples[i]*=scale;
 return samples;
}
