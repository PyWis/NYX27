'use strict';
// ---------- input ----------
const keys={},pressed=new Set();
const BLOCK=['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
addEventListener('keydown',e=>{if(BLOCK.includes(e.code))e.preventDefault();initAudio();if(AC&&AC.state==='suspended')AC.resume();if(!e.repeat)pressed.add(e.code);keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
cv.addEventListener('mousedown',()=>{cv.focus();initAudio();if(AC&&AC.state==='suspended')AC.resume();});
cv.focus();
