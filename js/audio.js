'use strict';
// ---------- audio ----------
let AC=null,master=null,musicGain=null,noiseBuf=null,musicOn=true,muted=false,nextT=0,step=0;
function initAudio(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  master=AC.createGain();master.gain.value=.45;master.connect(AC.destination);musicGain=AC.createGain();musicGain.gain.value=.10;musicGain.connect(master);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*.5,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  setInterval(schedule,40);}
const mf=m=>440*Math.pow(2,(m-69)/12);
function tone(f,type,t,dur,vol,f2,dest){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest||master);o.start(t);o.stop(t+dur+.02);}
function noise(t,dur,vol,freq,type,dest){const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq||2000;const g=AC.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(dest||master);s.start(t);s.stop(t+dur+.02);}
function sfx(n){if(!AC||muted)return;const t=AC.currentTime;
  switch(n){case'shoot':tone(900,'square',t,.09,.07,200);break;case'rapid':tone(1400,'square',t,.05,.05,500);break;
  case'slash':noise(t,.1,.12,3000,'bandpass');break;case'whip':noise(t,.14,.12,4500,'highpass');tone(1800,'sine',t,.06,.03,600);break;
  case'punch':noise(t,.08,.2,900);tone(140,'sine',t,.08,.15,60);break;case'hit':tone(220,'square',t,.05,.05,120);break;
  case'hurt':tone(160,'sawtooth',t,.15,.08,70);break;case'boom':noise(t,.5,.3,1200);tone(90,'sine',t,.4,.2,30);break;
  case'switch':[0,4,7,12].forEach((k,i)=>tone(mf(72+k),'triangle',t+i*.05,.08,.07));break;
  case'charge':tone(660,'sine',t,.1,.06);tone(990,'sine',t+.08,.12,.06);break;case'alert':tone(1200,'square',t,.05,.04);tone(1200,'square',t+.09,.05,.04);break;
  case'bump':noise(t,.08,.12,500);break;case'buy':[0,7,12].forEach((k,i)=>tone(mf(76+k),'square',t+i*.06,.07,.05));break;
  case'cash':[0,4,7,12,16].forEach((k,i)=>tone(mf(79+k),'square',t+i*.05,.06,.05));break;
  case'siren':for(let i=0;i<4;i++)tone(i%2?620:880,'square',t+i*.18,.17,.035);break;case'nitro':noise(t,.4,.15,800,'bandpass');tone(200,'sawtooth',t,.4,.06,900);break;case'mount':tone(300,'triangle',t,.06,.06,500);break;case'empty':tone(200,'square',t,.2,.05,100);break;}}
const PROG=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
function schedule(){if(!AC||!musicOn||muted){if(AC)nextT=AC.currentTime;return;}
  while(nextT<AC.currentTime+.15){if(nextT<AC.currentTime)nextT=AC.currentTime;const bar=Math.floor(step/16)%4,s=step%16,ch=PROG[bar];
    if(s%2===0)tone(mf(ch[0]-24+(s%4===2?12:0)),'sawtooth',nextT,.16,.5,0,musicGain);
    tone(mf(ch[s%3]+12+(s>=8?12:0)),'square',nextT,.07,.12,0,musicGain);
    if(s%4===0)tone(120,'sine',nextT,.12,.9,40,musicGain);if(s%8===4)noise(nextT,.12,.5,3000,'highpass',musicGain);
    nextT+=60/112/4;step++;}}
