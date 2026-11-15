'use strict';
// ---------- main loop ----------
genCity(Math.floor(Math.random()*1e9));
let last=performance.now();
function frame(t){const dt=Math.min(.05,(t-last)/1000);last=t;T+=dt;delArm=Math.max(0,delArm-dt);
  if(pressed.has('KeyM'))musicOn=!musicOn;if(pressed.has('KeyN'))muted=!muted;
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  if(state==='title'){titleInput();if(state==='title')drawTitle(dt);}
  else if(state==='play'||state==='wait'){
    if(gunMenu){const p=team[active];for(let k=0;k<gunMenu.opts.length;k++)if(pressed.has('Digit'+(k+1))||pressed.has('Numpad'+(k+1))){if(money>=10000){money-=10000;p.weapons.push(gunMenu.opts[k]);p.wi=p.weapons.length-1;setW(p);sfx('cash');msg(p.name+' HA UNA NUOVA ARMA: '+p.wpn.label+' (Q PER CAMBIARE)',p.ui);}gunMenu=null;break;}
      if(gunMenu&&(pressed.has('Escape')||pressed.has('KeyE')))gunMenu=null;}
    else if(pressed.has('KeyG'))mapOpen=!mapOpen;
    else if(state==='play'&&(pressed.has('KeyP')||pressed.has('Escape')))paused=!paused;
    const frozen=paused||mapOpen||gunMenu;
    if(!frozen)update(dt);
    if(pendingFast){pendingFast=false;newGame(2);meta.gameT=11*3600;meta.fast=true;msgs=[];msg('NOTTE VELOCE! SI RIPARTE ALLE 05:00','#9fd4ff');msg('RESISTI FINO ALL\'ALBA','#ffe03c');saveGame();}
    if(state==='play'){drawWorld(cam.x,cam.y,frozen?0:dt);drawHUD();if(gunMenu)drawGunMenu();else if(mapOpen)drawBigMap();else if(paused)drawPause();}
    else if(state==='wait'){drawWorld(cam.x,cam.y,dt);drawWait();if(mapOpen)drawBigMap();}
    else{drawWorld(cam.x,cam.y,dt);drawEnd();}
  }else if(state==='end'){drawWorld(cam.x,cam.y,dt);drawEnd();if(pressed.has('Enter')){saved=readSave();state='title';titleMsg='';}}
  pressed.clear();requestAnimationFrame(frame);}
addEventListener('visibilitychange',()=>{if(document.hidden&&(state==='play'||state==='wait'))saveGame();});
addEventListener('pagehide',()=>{if(state==='play'||state==='wait')saveGame();});
requestAnimationFrame(frame);
