'use strict';
// ---------- game state ----------
const NIGHT=12*3600, FINAL=NIGHT+15*60, SAVE_KEY='nyx-save-v3';
let state='title',sel=0,team=[],enemies=[],bullets=[],parts=[],pops=[],fx=[],msgs=[],police=[],active=0;
let cam={x:WPX/2,y:HPX/2},kills=0,copKills=0,respawnT=60,shake=0,hurt=0,flowT=0,paused=false,T=0;
let money=0,garageMeds=0,xenoFullT=null,lowT=0,nextEid=1,meta=null,policeT=0,policeCD=0,saveT=0;
let churchCD=0,noSpawnT=0,policeOp=null,gunMenu=null,mapOpen=false,ceremony=null,dispersed=0;
let maxHP=100,donors=[],wedded=false,trained=false,pendingFast=false;
let alienMark=0,amb=null,mission=null,missionT=900,bonds=[],bondT=60,radarOn=false;
const ambSpr=(()=>{const c=mk(26,14),g=c.getContext('2d');const P=(x,y,w,h,cl)=>{g.fillStyle=cl;g.fillRect(x,y,w,h);};
  P(3,0,4,2,'#000');P(18,0,4,2,'#000');P(3,12,4,2,'#000');P(18,12,4,2,'#000');P(0,1,26,12,'#0c0c12');P(1,2,24,10,'#f4f4f8');P(19,2,6,10,'#e2e2ea');P(17,3,2,8,'#3a5a8a');
  P(1,10,24,1,'#ff2b4a');P(1,3,24,1,'#ff2b4a');P(9,4,2,6,'#ff2b4a');P(7,6,6,2,'#ff2b4a');P(25,3,1,2,'#fffbd0');P(25,9,1,2,'#fffbd0');return c;})();
const dmgBonus=p=>trained&&(p.i===1||p.i===4)?2:0;
const NYX_R=50*8; // 50 metri
const nyxSpr=bikeSprite('#2a0b3d','#ff3df2',true,false,'#120818','#b48cff','#ff3df2');
const nyxOn=()=>state==='play'&&team[active]&&team[active].nyx&&team[active].status==='active';
let pAvail=false,pBody={x:-1e5,y:-1e5},delArm=0,titleMsg='';
const eSprCache={};
function enemySpr(t){if(!eSprCache[t]){const a=ROSTER[t];eSprCache[t]={r:bikeSprite('#86d42a',a.ui,true,true,'#2a1040','#6a1fb0',ACID),e:bikeSprite('#86d42a',a.ui,false,true)};}return eSprCache[t];}
const copSpr=(()=>{const c=mk(26,14),g=c.getContext('2d');const P=(x,y,w,h,cl)=>{g.fillStyle=cl;g.fillRect(x,y,w,h);};
  P(3,0,4,2,'#000');P(18,0,4,2,'#000');P(3,12,4,2,'#000');P(18,12,4,2,'#000');P(0,1,26,12,'#0c0c12');P(1,2,24,10,'#e8e8ef');P(1,2,6,10,'#1a1a24');P(19,2,6,10,'#1a1a24');
  P(15,3,3,8,'#3a5a8a');P(7,3,2,8,'#3a5a8a');P(9,3,6,8,'#f4f4f8');P(9,6,6,2,'#2a4bd8');P(25,3,1,2,'#fffbd0');P(25,9,1,2,'#fffbd0');P(0,3,1,2,'#ff2b4a');P(0,9,1,2,'#ff2b4a');return c;})();
const body=b=>b.inCar?{x:b.inCar.x,y:b.inCar.y}:b.onFoot?{x:b.fx,y:b.fy}:{x:b.x,y:b.y};
function msg(t,c){msgs.push({t,c:c||'#ffffff',life:3.5});if(msgs.length>3)msgs.shift();}
function pop(x,y,t,c){pops.push({x,y,t,c,life:1});}
function spark(x,y,c,n,s){for(let i=0;i<n;i++){const a=R()*6.283,v=s*(.3+R());parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.25+R()*.35,c,sz:1});}}
function boom(x,y){spark(x,y,'#ffe03c',18,120);spark(x,y,'#ff6a2a',18,90);spark(x,y,ACID,10,70);for(let i=0;i<10;i++)parts.push({x,y,vx:(R()-.5)*30,vy:(R()-.5)*30,life:.8+R()*.6,c:'#3a3448',sz:3});fx.push({k:'flash',x,y,t:0,dur:.35,r:60,c:'#ff9a3c'});sfx('boom');shake=5;}
const AVAIL=s=>s==='garage'||s==='idle'||s==='returning';
const atGarage=b=>b.status==='garage'||b.status==='medbay'||(b.status==='active'&&inGarage(body(b).x,body(b).y));
const speedOf=b=>BASE*b.spd*(b.tuned?(b.i===2?1.2:1.6):1)*(b.nyx?2:1)*(wedded&&(b.i===0||b.i===3)?1.2:1);
function setW(b){b.wi=Math.min(b.wi||0,Math.max(0,b.weapons.length-1));b.wpn=b.weapons.length?ROSTER[b.weapons[b.wi]].wpn:null;}

// ---------- clock: la notte parte sempre alle 18:00 e avanza solo giocando ----------
const nightE=()=>meta?meta.gameT:0;
function hhmm(E){const m=Math.floor(18*60+E/60)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
const fmtL=s=>{s=Math.max(0,Math.ceil(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0'):m+':'+String(x).padStart(2,'0');};
const shortT=s=>s>=600?Math.ceil(s/60)+'M':fmt(s);

// ---------- setup ----------
function makeTeam(){return ROSTER.map((r,i)=>{const b={...r,i,x:garage.bays[i].x,y:garage.bays[i].y,a:-Math.PI/2,v:0,hp:maxHP,bat:BAT_MAX,chg:0,onFoot:false,fx:0,fy:0,fa:0,walk:0,
  status:'garage',waitT:0,outT:0,outR:'',capT:0,captor:0,path:null,pi:0,cd:0,punchT:0,chkT:0,waitCharge:false,meds:0,medOn:false,nitro:0,nitroT:0,lastSrc:'',lastE:0,
  weapons:r.wpn?[i]:[],wi:0,tuned:false,shield:false,shieldT:null,inCar:null,walkPath:null,wpi:0,
  spr:bikeSprite(r.color,r.rim,true,false,'#1e1a28',r.color==='#16121f'?'#2a2440':r.color,r.visor),sprE:bikeSprite(r.color,r.rim,false,false),por:portrait(r)};setW(b);return b;});}
function resetRun(){enemies=[];bullets=[];parts=[];pops=[];fx=[];msgs=[];police=[];kills=0;copKills=0;respawnT=60;shake=0;hurt=0;paused=false;money=0;garageMeds=0;xenoFullT=null;lowT=0;
  policeT=0;policeCD=0;churchCD=0;noSpawnT=0;policeOp=null;gunMenu=null;mapOpen=false;ceremony=null;dispersed=0;maxHP=100;donors=[];wedded=false;trained=false;alienMark=0;amb=null;mission=null;missionT=900;bonds=[];bondT=60;radarOn=false;}
function newGame(start){
  const seed=Math.floor(Math.random()*1e9);genCity(seed);resetRun();meta={seed,gameT:0,ended:null};
  team=makeTeam();active=start;team[active].status='active';
  for(let i=0;i<10;i++)spawnEnemy();
  const p=team[active];cam.x=p.x;cam.y=p.y;buildFlow(p.x,p.y);state='play';
  msg('ORE 18:00 - LA NOTTE DI NEW YORK XENO E INIZIATA','#3cf2ff');msg('RESISTI FINO ALL\'ALBA',ACID);sfx('switch');saveGame();
}
function spawnEnemy(){
  const pb=pAvail?pBody:{x:garage.cx,y:garage.cy};let n=null;
  for(let k=0;k<80;k++){const c=nodes[Math.floor(R()*nodes.length)];if(dist(c.x,c.y,garage.cx,garage.cy)>1000&&dist(c.x,c.y,pb.x,pb.y)>800){n=c;break;}}
  if(!n)n=nodes[Math.floor(R()*nodes.length)];const e=addEnemy(Math.floor(R()*6),n.x,n.y,25,nextEid++);if(nyxOn())e.follow=true;return e;}
function addEnemy(t,x,y,hp,id){const a=ROSTER[t];const ni=nearestNodeLOS(x,y);const n=nodes[ni];
  const e={id,t,wpn:a.wpn,punch:a.punch,spd:a.spd,ui:a.ui,x,y,a:0,v:0,hp,state:'wander',tn:n.nb[Math.floor(R()*n.nb.length)].to,pn:ni,
    onFoot:false,fx:0,fy:0,fa:0,cd:0,lock:0,stuck:0,rev:0,punchT:0,walk:0,hitT:0,dead:false};enemies.push(e);return e;}

// ---------- save / load ----------
function serialize(){return{v:3,meta,money,kills,copKills,garageMeds,xenoFullT,lowT,respawnT,active,nextEid,churchCD,noSpawnT,policeOp,dispersed,maxHP,donors,wedded,trained,alienMark,mission,missionT,bonds,bondT,state:state==='wait'?'wait':'play',
  team:team.map(b=>({status:b.status,x:b.x,y:b.y,a:b.a,hp:b.hp,bat:b.bat,chg:b.chg,waitT:b.waitT,outT:b.outT,outR:b.outR,capT:b.capT,captor:b.captor,meds:b.meds,medOn:b.medOn,
    nitro:b.nitro,path:b.path,pi:b.pi,weapons:b.weapons,wi:b.wi,tuned:b.tuned,shield:b.shield,shieldT:b.shieldT,nyx:!!b.nyx,px:b.px,py:b.py,ambDest:b.ambDest,onFoot:b.onFoot||!!b.inCar,fx:body(b).x,fy:body(b).y})),
  enemies:enemies.map(e=>({id:e.id,t:e.t,x:e.x,y:e.y,hp:e.hp,follow:!!e.follow})),shops:shops.map(s=>({anger:s.anger,calm:s.calm})),
  police:police.filter(c=>!c.gone).map(c=>({x:c.x,y:c.y,a:c.a,mode:c.mode==='driven'?'abandoned':c.mode,impT:c.impT,abT:c.abT,cops:c.cops.map(k=>k.hp)}))};}
function saveGame(){if(!meta)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(serialize()));}catch(e){}}
function readSave(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
function delSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
function loadGame(S){
  meta=S.meta;genCity(meta.seed);resetRun();
  ({money,kills,copKills,garageMeds,xenoFullT,lowT,respawnT,nextEid,churchCD,noSpawnT,policeOp}=S);
  maxHP=S.maxHP||100;team=makeTeam();S.team.forEach((d,i)=>{Object.assign(team[i],d);setW(team[i]);});active=S.active;
  for(const d of S.enemies)addEnemy(d.t,d.x,d.y,d.hp,d.id).follow=!!d.follow;dispersed=S.dispersed||0;maxHP=S.maxHP||100;donors=S.donors||[];wedded=!!S.wedded;trained=!!S.trained;alienMark=S.alienMark||0;mission=S.mission||null;missionT=S.missionT||900;bonds=S.bonds||[];bondT=S.bondT||60;
  S.shops.forEach((d,i)=>{if(shops[i]){shops[i].anger=d.anger;shops[i].calm=d.calm;}});
  for(const d of S.police||[]){const c=newCar(d.x,d.y);c.a=d.a;c.mode=d.mode;c.impT=d.impT||0;c.abT=d.abT||0;c.cops.forEach((k,i)=>k.hp=d.cops[i]);police.push(c);}
  for(const b of team){if(b.status==='amb'){const h=shops.find(x=>x.type==='hosp');if(b.ambDest==='hosp'&&!team.some(t=>t.status==='hosp')){b.status='hosp';b.px=h.x;b.py=h.y;}else{b.status='medbay';b.px=garage.cx;b.py=garage.cy+20;}}
    if(b.status==='fetch')startFetch(b,b.px,b.py,true);
    if(b.status==='waitamb'){if(inGarage(b.x,b.y))toBay(b,'garage');else{b.status='idle';b.waitT=0;}}}
  state=S.state==='wait'?'wait':'play';if(state==='play'&&team[active].status!=='active')state='wait';
  const b=state==='play'?body(team[active]):{x:garage.cx,y:garage.cy};cam.x=b.x;cam.y=b.y;buildFlow(b.x,b.y);
  msg('BENTORNATO - ORE '+hhmm(meta.gameT),'#3cf2ff');checkEnd();}
function toBay(b,st){const bay=garage.bays[b.i];b.x=bay.x;b.y=bay.y;b.a=-Math.PI/2;b.v=0;b.onFoot=false;b.path=null;b.walkPath=null;if(st)b.status=st;}
function release(b){b.status='garage';b.hp=b.outR==='FUGGITO'?1:Math.max(b.hp,30);toBay(b);msg(b.name+' E DI NUOVO IN RIMESSA',b.ui);}

// ---------- end conditions ----------
function endGame(win,reason){if(state==='end')return;state='end';meta.ended={win,reason,kills,at:meta.gameT};saveGame();msgs=[];sfx(win?'cash':'boom');}
function checkEnd(){
  if(state==='end'||!meta)return;const E=nightE();
  if(team.every(b=>b.status==='dead'))return endGame(false,'TUTTI I BIKER NYX SONO MORTI');
  if(E>=NIGHT&&enemies.length===0)return endGame(true,'ALL\'ALBA NESSUNO XENO E RIMASTO IN CITTA');
  if(nyxOn())return; // con Nyx attiva non si va in game over
  if(E>=FINAL)return endGame(false,'ALLE 6:15 GLI XENO SONO ANCORA IN CITTA');
  if(lowT>=1800)return endGame(true,'XENO SOTTO QUOTA 3 PER MEZZ\'ORA');
  if(xenoFullT!==null&&xenoFullT<=0)return endGame(false,'GLI XENO HANNO RAGGIUNTO QUOTA 20');}

// ---------- team logic ----------
function charge(b,dt,still){
  if(!still){b.chg=0;return;}if(b.bat>=BAT_MAX){b.chg=0;return;}
  const per=inGarage(b.x,b.y)?15:30;b.chg+=dt;
  if(b.chg>=per){b.chg-=per;b.bat=Math.min(BAT_MAX,b.bat+10);if(b===team[active]&&pAvail){pop(b.x,b.y-14,'+10S SOLE','#ffe03c');sfx('charge');}}}
function heal(b,dt){if(b.status==='dead'||b.status==='captured'||b.status==='out'||b.status==='hosp'||b.hp<=0)return;
  if(b.medOn){b.hp=Math.min(maxHP,b.hp+25/60*dt);if(b.hp>=maxHP){b.medOn=false;if(b===team[active])msg('CURA COMPLETATA','#5cff7a');}}
  else if(atGarage(b))b.hp=Math.min(maxHP,b.hp+2/60*dt);}
function garageAutoMed(){if(garageMeds<=0)return;let w=null;for(const b of team)if(atGarage(b)&&b.hp<maxHP&&!b.medOn&&(!w||b.hp<w.hp))w=b;
  if(w){garageMeds--;w.medOn=true;if(state==='play')msg('FARMACO DELLA RIMESSA A '+w.name,'#5cff7a');}}
function dismount(p){const cand=[p.a+Math.PI/2,p.a-Math.PI/2,p.a+Math.PI];let fx=p.x,fy=p.y;
  for(const a of cand){const x=p.x+Math.cos(a)*12,y=p.y+Math.sin(a)*12;if(!blocked(x,y,3)){fx=x;fy=y;break;}}
  p.onFoot=true;p.fx=fx;p.fy=fy;p.v=0;p.fa=p.a;p.nitroT=0;p.walkPath=null;sfx('mount');}
function park(p){if(p.inCar)exitCar(p,false);p.onFoot=false;p.v=0;p.nitroT=0;p.walkPath=null;
  if(inGarage(p.x,p.y))toBay(p,'garage');else{p.status='idle';p.waitT=180+R()*420;p.chkT=0;p.waitCharge=false;}}
function nextAvail(from){for(let k=1;k<=6;k++){const j=(from+k)%6;if(AVAIL(team[j].status))return j;}return -1;}
function activate(n){active=n;const q=team[n];q.status='active';q.path=null;q.onFoot=false;q.v=0;q.walkPath=null;}
function leaveActive(){if(team.every(b=>b.status==='dead'))return endGame(false,'TUTTI I BIKER NYX SONO MORTI');
  const n=nextAvail(active);if(n>=0){activate(n);msg(team[n].name+' PRENDE IL COMANDO',team[n].ui);}else state='wait';saveGame();}
function endNyx(p,why){if(!p.nyx)return;p.nyx=false;ceremony=null;for(const e of enemies)if(e.follow){e.follow=false;e.kneel=false;e.onFoot=false;e.state='wander';e.tn=-1;}if(why)msg(why,'#b48cff');}
function switchBiker(){if(team[active].nyx){msg('NYX E ATTIVA: NON PUOI CAMBIARE BIKER','#ff3df2');return;}const n=nextAvail(active);if(n<0||n===active){msg('NESSUN ALTRO BIKER DISPONIBILE','#ff4d6d');return;}
  endNyx(team[active],'NYX TORNA NOVA: I FEDELI SI DISPERDONO');
  park(team[active]);activate(n);sfx('switch');msg(team[n].name+' IN SELLA',team[n].ui);}
function defeat(){
  const p=team[active];if(p.inCar)exitCar(p,false);const wasNyx=p.nyx;endNyx(p,'');const pb=body(p);boom(pb.x,pb.y);p.medOn=false;p.hp=0;
  if(wasNyx&&p.lastSrc==='nyx'){p.status='out';p.outR='ESAUSTA';p.outT=1800;msg('NYX SI E CONSUMATA PRIMA DELLA RIMESSA: FUORI 30 MIN','#b48cff');toBay(p);return leaveActive();}
  if(p.lastSrc==='police'){p.status='out';p.outR='ARRESTATO';p.outT=3600;msg(p.name+' ARRESTATO! FUORI GIOCO 1 ORA','#3a7bff');}
  else if(p.lastSrc==='xeno'){let cap=enemies.find(e=>e.id===p.lastE&&!e.dead);
    if(!cap){let bd=500;for(const e of enemies){const d=dist(e.x,e.y,pb.x,pb.y);if(!e.dead&&d<bd){bd=d;cap=e;}}}
    if(!cap||R()<0.2){p.status='out';p.outR='FUGGITO';p.outT=180;msg(p.name+' SI ARRENDE MA SCAPPA! IN RIMESSA TRA 3 MIN','#ffe03c');}
    else{p.status='captured';p.captor=cap.id;p.capT=1800;msg(p.name+' CATTURATO! UCCIDI LO XENO ENTRO 30 MIN','#ff3df2');}}
  else{p.status='out';p.outR='FERITO';p.outT=1800;msg(p.name+' FERITO DAL NEGOZIANTE! FUORI 30 MIN','#ff4d6d');}
  toBay(p);leaveActive();}
function freeCaptives(e){for(const t of team)if(t.status==='captured'&&t.captor===e.id){t.status='garage';t.hp=Math.max(t.hp,25);toBay(t);msg(t.name+' LIBERATO! TORNA IN RIMESSA',t.ui);}}
function damageEnemy(e,d){if(e.dead)return;e.hp-=d;e.hitT=.12;const b=body(e);pop(b.x,b.y-12,'-'+d,'#ffffff');spark(b.x,b.y,ACID,5,60);sfx('hit');
  if(e.state==='wander'){e.state='chase';e.lock=0;}
  if(e.hp<=0){e.dead=true;kills++;boom(b.x,b.y);freeCaptives(e);if(kills%5===0)msg(kills+' XENO ABBATTUTI!',ACID);}}
function damageCop(c,d){if(c.hp<=0)return;c.hp-=d;pop(c.x,c.y-12,'-'+d,'#9fd4ff');spark(c.x,c.y,'#ff4d6d',4,50);sfx('hit');if(c.hp<=0){spark(c.x,c.y,'#3a7bff',12,80);sfx('boom');}}
// kind: 'weapon' | 'punch' — lo scudo NASA ferma solo le armi Xeno
function damagePlayer(d,src,from,kind){if(!pAvail)return;const p=team[active];const b=body(p);
  if(src==='xeno'&&kind==='weapon'&&p.shield){if(p.shieldT===null){p.shieldT=1200;msg('SCUDO NASA ATTIVATO: 20 MINUTI','#9fd4ff');}spark(b.x,b.y,'#9fd4ff',6,70);pop(b.x,b.y-14,'SCUDO','#9fd4ff');sfx('hit');return;}
  p.hp-=d;p.lastSrc=src;p.lastE=from&&from.id||0;hurt=.25;shake=Math.max(shake,3);pop(b.x,b.y-14,'-'+d,'#ff4d6d');sfx('hurt');}
function copsOut(){const a=[];for(const c of police)if(c.mode==='cops')for(const k of c.cops)if(k.out&&k.hp>0)a.push(k);return a;}
function playerAttack(p){const w=p.wpn;p.cd=w.cd;const fast=w===ROSTER[3].wpn,dmg=w.dmg+dmgBonus(p);
  if(w.k==='gun'){const x=p.x+Math.cos(p.a)*11,y=p.y+Math.sin(p.a)*11;bullets.push({x,y,vx:Math.cos(p.a)*w.spd,vy:Math.sin(p.a)*w.spd,life:w.rng/w.spd,dmg,o:'p',c:fast?'#9fd4ff':'#fff59a'});
    fx.push({k:'flash',x,y,t:0,dur:.08,r:14,c:'#ffe9a0'});sfx(fast?'rapid':'shoot');}
  else{fx.push({k:w.style,x:p.x,y:p.y,a:p.a,t:0,dur:w.style==='whip'?.3:.22,r:w.rad,c:w.style==='whip'?'#b48cff':'#d8fff0',own:p});sfx(w.style==='whip'?'whip':'slash');
    for(const e of enemies){const b=body(e);if(dist(b.x,b.y,p.x,p.y)<w.rad+6)damageEnemy(e,dmg);}
    for(const c of copsOut())if(dist(c.x,c.y,p.x,p.y)<w.rad+6)damageCop(c,dmg);}}
function playerPunch(p){p.cd=p.punch.cd;p.punchT=.12;const px=p.fx+Math.cos(p.fa)*9,py=p.fy+Math.sin(p.fa)*9;let hit=false;
  for(const e of enemies){const b=body(e);if(dist(b.x,b.y,px,py)<12){damageEnemy(e,p.punch.dmg);hit=true;}}
  for(const c of copsOut())if(dist(c.x,c.y,px,py)<12){damageCop(c,p.punch.dmg);hit=true;}
  if(hit){pop(px,py-8,'POW!','#ffe03c');spark(px,py,'#ffffff',4,50);}sfx('punch');}
function nearShop(b){let best=null,bd=24;for(const s of shops){const d=dist(s.x,s.y,b.x,b.y);if(d<bd){bd=d;best=s;}}return best;}
function nearFreeCar(b){for(const c of police)if(c.mode==='abandoned'&&dist(c.x,c.y,b.x,b.y)<20)return c;return null;}
const nearIdle=(i,s)=>team[i]&&team[i].status==='idle'&&dist(team[i].x,team[i].y,s.x,s.y)<90;
function shopHint(s,p){switch(s.type){
  case'pharm':return'E: FARMACO 100$';case'mech':return'E: ELETTRONITRO 50$';case'shop':return s.cd>0?'ATTENTO '+Math.ceil(s.cd)+'S':'E: RAPINA (A PIEDI)';
  case'church':if(p&&p.i===3&&!wedded&&nearIdle(0,s))return'E: MATRIMONIO CON ZEPHYR 10000$';return churchCD>0?'TORNA TRA '+fmtL(churchCD):'E: FERMA GLI XENO 10 MIN';case'cop':return p&&p.inCar?'':team.some(t=>t.status==='out'&&t.outR==='ARRESTATO')?'E: CAUZIONE 1000$':'VIENI CON L\'AUTO DELLA POLIZIA';
  case'nasa':return'E: SCUDO ANTI-XENO 500$';case'hosp':if(p&&p.meds>=3)return'E: DONA 3 FARMACI ('+donors.length+'/2 BIKER)';return team.some(b=>b.status==='hosp')?'OSPEDALE OCCUPATO':'E: RICOVERO GRATIS +10/MIN';
  case'bikes':return p&&p.tuned?'MOTO GIA POTENZIATA':'E: MOTO X'+(p&&p.i===2?'1.2':'1.6')+' 5000$';case'bank':return'E: OBBLIGAZIONE 1000$ (+40$/MIN X 30)';case'alien':return p&&(p.i===0||p.i===3)?'E: RAPPORTO ('+(kills-alienMark)+' XENO = '+(kills-alienMark)*25+'$)':'SOLO ZEPHYR O VESPER';case'guns':if(p&&p.i===1&&!trained&&nearIdle(4,s))return'E: ALLENAMENTO CON INDIGO';return'E: SECONDA ARMA 10000$';}return'';}
function useShop(p,s,b){
  switch(s.type){
  case'pharm':if(p.meds>=3)msg('MASSIMO 3 FARMACI ALLA VOLTA','#ffe03c');else if(money<100)msg('SERVONO 100$','#ff4d6d');else{money-=100;p.meds++;sfx('buy');pop(b.x,b.y-16,'+1 FARMACO','#5cff7a');}break;
  case'mech':if(p.nitro>=5)msg('MASSIMO 5 ELETTRONITRO','#ffe03c');else if(money<50)msg('SERVONO 50$','#ff4d6d');else{money-=50;p.nitro++;sfx('buy');pop(b.x,b.y-16,'+1 NITRO','#ffb03c');}break;
  case'shop':if(!p.onFoot)msg('SCENDI DALLA MOTO (Z) PER RAPINARE','#ffe03c');else if(s.cd>0)msg('IL NEGOZIANTE TI TIENE D\'OCCHIO '+Math.ceil(s.cd)+'S','#ffe03c');
    else{const dmg=[10,20,30,40,60][Math.min(4,s.anger)];let amt=30+Math.floor(R()*91);const big=R()<0.1;if(big)amt*=4;
      money+=amt;s.anger=Math.min(5,s.anger+1);s.calm=0;s.cd=20;sfx('cash');pop(b.x,b.y-24,'+'+amt+'$',big?'#ff3df2':'#ffe03c');
      msg(big?'COLPO GROSSO! +'+amt+'$':'RAPINA: +'+amt+'$ - IL NEGOZIANTE REAGISCE -'+dmg,big?'#ff3df2':'#ffe03c');damagePlayer(dmg,'shop');}break;
  case'church':
    if(!wedded&&p.i===3&&nearIdle(0,s)){if(money<10000)msg('IL RITO COSTA 10000$','#ff4d6d');else{money-=10000;wedded=true;sfx('cash');
      for(let i=0;i<40;i++)parts.push({x:s.x+(R()-.5)*40,y:s.y-10,vx:(R()-.5)*60,vy:-20-R()*40,life:1.5,c:pickR(R,['#ff6ec7','#ffffff','#ffe03c','#3a7bff','#e8384f']),sz:2});
      msg('ZEPHYR E VESPER SONO SPOSI! LE LORO MOTO VANNO X1.2','#ff6ec7');}break;}
    if(!wedded&&p.i===0&&nearIdle(3,s)){msg('ZEPHYR DEVE ARRIVARE IN CHIESA PRIMA DI VESPER','#ff6ec7');break;}
    if(churchCD>0)msg('LA CHIESA TI ASCOLTERA TRA '+fmtL(churchCD),'#ffe03c');else{noSpawnT=600;churchCD=3600;sfx('charge');msg('PREGHIERA ACCOLTA: NESSUN NUOVO XENO PER 10 MIN','#e6e0ff');}break;
  case'cop':{const ar=team.filter(t=>t.status==='out'&&t.outR==='ARRESTATO').sort((a,b)=>b.outT-a.outT);
    if(!ar.length){msg('IL COMMISSARIO VUOLE VEDERE UN\'AUTO DELLA POLIZIA','#3a7bff');break;}
    if(money<1000){msg('LA CAUZIONE COSTA 1000$','#ff4d6d');break;}
    money-=1000;sfx('cash');release(ar[0]);msg('CAUZIONE PAGATA: '+ar[0].name+' E LIBERO'+(ar.length>1?' ('+(ar.length-1)+' ANCORA DENTRO)':''),'#3a7bff');break;}
  case'bank':if(money<1000)msg('UN\'OBBLIGAZIONE COSTA 1000$','#ff4d6d');else{money-=1000;bonds.push(30);sfx('buy');msg('OBBLIGAZIONE N.'+bonds.length+': +40$ AL MINUTO PER 30 MINUTI','#ffd27a');}break;
  case'alien':{if(p.i!==0&&p.i!==3){msg('SOLO ZEPHYR O VESPER POSSONO ENTRARE NEL CENTRO ALIENI','#c6ff3a');break;}
    const n=kills-alienMark;alienMark=kills;if(n<=0){msg('NESSUNO XENO ABBATTUTO DALL\'ULTIMA VISITA','#c6ff3a');break;}
    money+=n*25;sfx('cash');msg('CENTRO ALIENI: '+n+' XENO ABBATTUTI = +'+n*25+'$','#c6ff3a');if(n>=10)callAmbulance(p,s);break;}
  case'nasa':if(p.shield)msg('SCUDO GIA INSTALLATO','#ffe03c');else if(money<500)msg('SERVONO 500$','#ff4d6d');else{money-=500;p.shield=true;p.shieldT=null;sfx('buy');msg('SCUDO NASA SU '+p.name+': 20 MIN DAL PRIMO COLPO','#9fd4ff');}break;
  case'hosp':if(p.meds>=3){if(donors.includes(p.i)){msg('SERVONO I FARMACI DI UN ALTRO BIKER','#ffe03c');break;}
      p.meds-=3;donors.push(p.i);sfx('buy');
      if(donors.length>=2){donors=[];if(maxHP>=250)msg('VITA MASSIMA GIA AL LIMITE (250)','#ffe03c');else{maxHP=Math.min(250,maxHP+25);for(const t of team)if(t.status!=='dead')t.hp=Math.min(maxHP,t.hp+25);sfx('cash');msg('+25 VITA MASSIMA PER TUTTO IL TEAM: '+maxHP,'#5cff7a');}}
      else msg('3 FARMACI DONATI DA '+p.name+': SERVE UN SECONDO BIKER','#5cff7a');break;}
    if(p.nyx)msg('NYX NON PUO ESSERE RICOVERATA','#ff3df2');else if(team.some(t=>t.status==='hosp'))msg('OSPEDALE OCCUPATO: UN BIKER ALLA VOLTA','#ff4d6d');else if(p.hp>=maxHP)msg('SEI IN PERFETTA SALUTE','#5cff7a');
    else{p.onFoot=false;p.v=0;p.nitroT=0;p.walkPath=null;p.status='hosp';msg(p.name+' RICOVERATO: +10 VITA AL MINUTO','#ff4d6d');leaveActive();}break;
  case'bikes':if(p.tuned)msg('MOTO GIA POTENZIATA','#ffe03c');else if(money<5000)msg('SERVONO 5000$','#ff4d6d');else{money-=5000;p.tuned=true;sfx('cash');msg('MOTO POTENZIATA: VELOCITA X'+(p.i===2?'1.2':'1.6'),'#ff6ec7');}break;
  case'guns':{if(!trained&&p.i===1&&nearIdle(4,s)){trained=true;sfx('slash');sfx('cash');msg('ATLAS E INDIGO SI ALLENANO: +2 DANNI ALLE LORO ARMI','#3fd46b');break;}
    if(!trained&&p.i===4&&nearIdle(1,s)){msg('INDIGO DEVE ENTRARE PER PRIMA, POI ATLAS','#8a6bff');break;}
    const max=ROSTER[p.i].wpn?2:1;const opts=[0,1,3,4].filter(i=>!p.weapons.includes(i));
    if(p.weapons.length>=max)msg('HAI GIA LA SECONDA ARMA','#ffe03c');else if(money<10000)msg('SERVONO 10000$','#ff4d6d');else gunMenu={opts};break;}}}
function interact(p){
  const b=body(p);
  if(pressed.has('KeyE')){const car=p.onFoot&&!p.inCar?nearFreeCar(b):null;const s=nearShop(b);
    if(car)enterCar(p,car);
    else if(s&&!p.inCar&&mission&&mission.carrier<0&&s.i===mission.from){mission.carrier=p.i;sfx('buy');msg('PACCO PRESO: CONSEGNALO A '+shops[mission.to].name,'#ffe03c');}
    else if(s&&!p.inCar&&mission&&mission.carrier===p.i&&s.i===mission.to){money+=mission.pay;sfx('cash');pop(b.x,b.y-20,'+'+mission.pay+'$','#ffe03c');msg('PACCO CONSEGNATO: +'+mission.pay+'$','#ffe03c');mission=null;}
    else if(s&&!p.inCar)useShop(p,s,b);}
  if(p.inCar)return;
  if(pressed.has('KeyW')){radarOn=!radarOn;msg(radarOn?'RADAR NEGOZI ACCESO':'RADAR NEGOZI SPENTO','#ffe03c');sfx('alert');}
  if(pressed.has('KeyF')){if(!p.meds)msg('NESSUN FARMACO CON TE','#ffe03c');else if(p.medOn)msg('CURA GIA IN CORSO','#ffe03c');else if(p.hp>=maxHP)msg('VITA GIA PIENA','#5cff7a');
    else{p.meds--;p.medOn=true;msg('FARMACO: +25 VITA AL MINUTO','#5cff7a');sfx('charge');}}
  if(pressed.has('KeyC')){if(!inGarage(b.x,b.y))msg('PORTA I FARMACI IN RIMESSA','#ffe03c');else if(!p.meds)msg('NESSUN FARMACO DA CONSEGNARE','#ffe03c');
    else{garageMeds+=p.meds;msg(p.meds+' FARMACI CONSEGNATI ALLA RIMESSA','#5cff7a');p.meds=0;sfx('buy');garageAutoMed();}}
  if(pressed.has('KeyX')){if(p.onFoot)msg('IL NITRO SI USA IN MOTO','#ffe03c');else if(p.nitroT>0)msg('NITRO GIA ATTIVO','#ffe03c');else if(!p.nitro)msg('NESSUN ELETTRONITRO - COMPRALO DAL MECCANICO','#ffe03c');
    else{p.nitro--;p.nitroT=20;sfx('nitro');msg('ELETTRONITRO! VELOCITA X2 PER 20S','#3cf2ff');}}
  if(pressed.has('KeyR')){if(p.i!==0&&p.i!==3)msg('SOLO ZEPHYR E VESPER POSSONO RICHIAMARE GLI ALTRI','#7a6f99');
    else if(!inGarage(b.x,b.y))msg(p.name+' PUO RICHIAMARE SOLO DALLA RIMESSA','#ffe03c');
    else{let n=0;for(const t of team)if(t.status==='idle'){const pl=planReturn(t);if(pl){t.path=pl.pts;t.pi=0;t.status='returning';t.waitT=0;n++;}}
      msg(n?p.name+' RICHIAMA TUTTI IN RIMESSA ('+n+')':'NESSUN BIKER DA RICHIAMARE',p.ui);if(n)sfx('switch');}}
  if(pressed.has('KeyQ')){if(p.weapons.length>1){p.wi=(p.wi+1)%p.weapons.length;setW(p);msg('ARMA: '+p.wpn.label,'#ffffff');sfx('mount');}else msg('UNA SOLA ARMA - L\'ARMERIA NE VENDE UNA SECONDA','#7a6f99');}
}
// ---------- police car theft ----------
function enterCar(p,c){c.mode='driven';p.inCar=c;p.walkPath=null;c.v=0;sfx('mount');msg('AUTO RUBATA! PORTALA IN RIMESSA O AL COMMISSARIATO','#3a7bff');}
function exitCar(p,walk){const c=p.inCar;if(!c)return;p.inCar=null;if(c.mode==='driven'){c.mode='abandoned';c.abT=0;}c.v=0;
  let fx=c.x,fy=c.y;for(const a of [c.a+Math.PI/2,c.a-Math.PI/2,c.a+Math.PI]){const x=c.x+Math.cos(a)*14,y=c.y+Math.sin(a)*14;if(!blocked(x,y,3)){fx=x;fy=y;break;}}
  p.onFoot=true;p.fx=fx;p.fy=fy;p.fa=c.a;if(walk)startWalk(p);}
function startWalk(p){const pts=[];
  if(!los(p.fx,p.fy,p.x,p.y)){const s=nearestNodeLOS(p.fx,p.fy),t=nearestNodeLOS(p.x,p.y);const path=dijkstra(s,t)||[];for(const i of path)pts.push({x:nodes[i].x,y:nodes[i].y});}
  pts.push({x:p.x,y:p.y});p.walkPath=pts;p.wpi=0;msg(p.name+' TORNA A PIEDI ALLA MOTO','#c9c2e6');}
function deliverCar(p,c){const amt=200+Math.floor(R()*201);money+=amt;c.mode='impound';c.impT=900;c.x=garage.cx;c.y=garage.cy-4;c.a=0;c.v=0;
  p.inCar=null;p.onFoot=true;p.fx=garage.cx;p.fy=garage.cy+18;sfx('cash');pop(garage.cx,garage.cy-20,'+'+amt+'$','#ffe03c');
  msg('AUTO DELLA POLIZIA IN RIMESSA: +'+amt+'$ (RESTA 15 MIN)','#ffe03c');startWalk(p);}
function copHQ(p,c){const hq=shops.find(s=>s.type==='cop');c.gone=true;p.inCar=null;p.onFoot=true;p.fx=hq.x;p.fy=hq.y;
  if(R()<0.3){policeOp={left:10,t:6};msg('IL COMMISSARIO TI CREDE: LA POLIZIA CATTURERA 10 XENO!','#3a7bff');sfx('siren');startWalk(p);}
  else{msg('IL COMMISSARIO NON TI CREDE: '+p.name+' ARRESTATO 5 MIN','#ff4d6d');p.status='out';p.outR='ARRESTATO';p.outT=300;toBay(p);leaveActive();}}
function driveCar(p,c,dt,U,D,L,Rt){
  const maxV=BASE*1.15,acc=maxV*1.1;
  if(U)c.v=Math.min(maxV,c.v+acc*dt);else if(D&&c.v>0)c.v=Math.max(0,c.v-maxV*2*dt);else if(D)c.v=Math.max(-maxV*.3,c.v-acc*.5*dt);
  else{const f=maxV*.6*dt;c.v=Math.abs(c.v)<=f?0:c.v-Math.sign(c.v)*f;}
  const steer=(Rt?1:0)-(L?1:0);c.a+=steer*2.5*Math.min(1,.3+Math.abs(c.v)/60)*dt*(c.v<-1?-1:1);
  if(moveCol(c,'x','y',Math.cos(c.a)*c.v*dt,Math.sin(c.a)*c.v*dt,6)){if(Math.abs(c.v)>40){spark(c.x+Math.cos(c.a)*12,c.y+Math.sin(c.a)*12,'#ffd27a',6,80);sfx('bump');}c.v*=.5;}
  p.fx=c.x;p.fy=c.y;p.fa=c.a;
  if(inGarage(c.x,c.y))return deliverCar(p,c);
  const hq=shops.find(s=>s.type==='cop');if(hq&&dist(c.x,c.y,hq.x,hq.y)<36)return copHQ(p,c);
  if(pressed.has('KeyZ'))exitCar(p,true);}
function updatePlayer(p,dt){
  const L=keys.ArrowLeft||keys.KeyA,Rt=keys.ArrowRight||keys.KeyD,U=keys.ArrowUp,D=keys.ArrowDown||keys.KeyS,atk=keys.Space;
  p.cd-=dt;p.punchT-=dt;if(p.nitroT>0){p.nitroT-=dt;if(p.nitroT<=0)msg('NITRO ESAURITO','#7a6f99');}
  if(p.inCar){driveCar(p,p.inCar,dt,U,D,L,Rt);charge(p,dt,true);return;}
  if(!p.onFoot){
    const boost=p.nitroT>0?2:1,maxV=speedOf(p)*boost,acc=maxV*1.3,can=p.bat>0;
    if(U&&can)p.v=Math.min(maxV,p.v+acc*dt);
    else if(D&&p.v>0)p.v=Math.max(0,p.v-maxV*2.4*dt);
    else if(D&&can)p.v=Math.max(-speedOf(p)*.3,p.v-acc*.5*dt);
    else{const f=maxV*.7*dt;p.v=Math.abs(p.v)<=f?0:p.v-Math.sign(p.v)*f;}
    if(p.v>maxV)p.v=Math.max(maxV,p.v-maxV*dt);
    const steer=(Rt?1:0)-(L?1:0);const tr=3.1*Math.min(1,.4+Math.abs(p.v)/70)/(maxV>BASE*1.5?1.15:1);p.a+=steer*tr*dt*(p.v<-1?-1:1);
    const hit=moveCol(p,'x','y',Math.cos(p.a)*p.v*dt,Math.sin(p.a)*p.v*dt,5);
    if(hit){if(Math.abs(p.v)>45){spark(p.x+Math.cos(p.a)*8,p.y+Math.sin(p.a)*8,'#ffd27a',6,80);sfx('bump');shake=Math.max(shake,2);}p.v*=.5;}
    if(Math.abs(p.v)>4&&!p.nyx){p.bat=Math.max(0,p.bat-dt);p.chg=0;if(p.bat<=0&&!p.batWarn){msg('BATTERIA SCARICA! FERMO AL SOLE O Z PER SCENDERE','#ff4d6d');p.batWarn=true;}}
    if(p.bat>0)p.batWarn=false;
    if(p.nitroT>0&&Math.abs(p.v)>20)parts.push({x:p.x-Math.cos(p.a)*10,y:p.y-Math.sin(p.a)*10,vx:-Math.cos(p.a)*30+(R()-.5)*20,vy:-Math.sin(p.a)*30+(R()-.5)*20,life:.3,c:R()<.5?'#3cf2ff':'#ffffff',sz:2});
    if(atk&&p.wpn&&p.cd<=0)playerAttack(p);
    if(pressed.has('KeyZ'))dismount(p);
    charge(p,dt,Math.abs(p.v)<4);
  }else{
    let dx=(Rt?1:0)-(L?1:0),dy=(D?1:0)-(U?1:0);
    if(dx||dy){p.walkPath=null;const l=Math.hypot(dx,dy);dx/=l;dy/=l;p.fa=Math.atan2(dy,dx);p.walk+=dt*12;moveCol(p,'fx','fy',dx*48*dt,dy*48*dt,3);}
    else if(p.walkPath){const q=p.walkPath[p.wpi];const ddx=q.x-p.fx,ddy=q.y-p.fy,d=Math.hypot(ddx,ddy),sp=48*dt;p.fa=Math.atan2(ddy,ddx);p.walk+=dt*12;
      if(d<=sp){p.fx=q.x;p.fy=q.y;p.wpi++;if(p.wpi>=p.walkPath.length){p.walkPath=null;p.onFoot=false;sfx('mount');msg(p.name+' DI NUOVO IN SELLA',p.ui);}}else{p.fx+=ddx/d*sp;p.fy+=ddy/d*sp;}}
    if(atk&&p.cd<=0)playerPunch(p);
    if(pressed.has('KeyZ')){if(dist(p.fx,p.fy,p.x,p.y)<26){p.onFoot=false;p.walkPath=null;sfx('mount');}else msg('TROPPO LONTANO DALLA MOTO','#ffe03c');}
    charge(p,dt,true);
  }
}
function startFetch(b,x,y,quiet){b.px=x;b.py=y;b.status='fetch';const pts=[];
  if(!los(x,y,b.x,b.y)){const s0=nearestNodeLOS(x,y),t0=nearestNodeLOS(b.x,b.y);for(const i of dijkstra(s0,t0)||[])pts.push({x:nodes[i].x,y:nodes[i].y});}
  pts.push({x:b.x,y:b.y});b.fpath=pts;b.fpi=0;if(!quiet)msg(b.name+' VA A RECUPERARE LA MOTO A PIEDI',b.ui);}
// ---------- auto medica (centro alieni) ----------
function board(b,dest){b.status='amb';b.ambDest=dest;b.onFoot=false;b.v=0;b.walkPath=null;b.path=null;b.px=amb.x;b.py=amb.y;amb.riders.push(b);}
function callAmbulance(p,s){garageMeds+=3;garageAutoMed();msg('ARRIVA L\'AUTO MEDICA: 3 FARMACI ALLA RIMESSA','#ff4d6d');sfx('siren');
  const hosp=shops.find(x=>x.type==='hosp');const busy=team.some(t=>t.status==='hosp');
  const cand=team.filter(t=>(AVAIL(t.status)||t===p)&&t.hp<maxHP).sort((a,b)=>a.hp/maxHP-b.hp/maxHP);const worst=cand[0]||null;
  amb={x:s.x,y:s.y,a:0,legs:[],li:0,path:null,pi:0,riders:[]};
  if(worst&&worst!==p){worst.status='waitamb';worst.path=null;worst.v=0;}
  const ride=p.hp<maxHP;if(ride){if(p.inCar)exitCar(p,false);board(p,worst===p&&!busy?'hosp':'medbay');}
  if(worst&&worst!==p&&worst.status!=='garage')amb.legs.push({x:worst.x,y:worst.y,act:'pick',w:worst.i});
  amb.legs.push({x:garage.cx,y:garage.cy,act:'garage',w:worst?worst.i:-1});
  if(worst&&!busy)amb.legs.push({x:hosp.x,y:hosp.y,act:'hosp'});
  if(ride)leaveActive();}
function ambAction(leg){const busy=team.some(t=>t.status==='hosp');
  if(leg.act==='pick'){const w=team[leg.w];if(w.status==='waitamb'){board(w,busy?'medbay':'hosp');msg('L\'AUTO MEDICA CARICA '+w.name,'#ff4d6d');}}
  else if(leg.act==='garage'){for(const b of amb.riders.filter(b=>b.ambDest==='medbay')){b.status='medbay';b.px=garage.cx+(b.i-2.5)*10;b.py=garage.cy+20;msg(b.name+' IN CURA IN RIMESSA (MOTO LASCIATA FUORI)',b.ui);}
    amb.riders=amb.riders.filter(b=>b.status==='amb');const w=leg.w>=0?team[leg.w]:null;if(w&&w.status==='waitamb'){if(busy)w.status='garage';else board(w,'hosp');}}
  else if(leg.act==='hosp'){for(const b of amb.riders){if(team.some(t=>t.status==='hosp')){b.status='medbay';b.px=garage.cx;b.py=garage.cy+20;continue;}b.status='hosp';b.px=leg.x;b.py=leg.y;msg(b.name+' RICOVERATO DALL\'AUTO MEDICA','#ff4d6d');}amb.riders=[];}}
function updateAmb(dt){if(!amb)return;const leg=amb.legs[amb.li];if(!leg){amb=null;return;}
  if(!amb.path){const s0=nearestNodeLOS(amb.x,amb.y),t0=nearestNodeLOS(leg.x,leg.y);amb.path=(dijkstra(s0,t0)||[]).map(i=>({x:nodes[i].x,y:nodes[i].y}));amb.path.push({x:leg.x,y:leg.y});amb.pi=0;}
  const q=amb.path[amb.pi];const dx=q.x-amb.x,dy=q.y-amb.y,d=Math.hypot(dx,dy),sp=170*dt;if(d>0.5)amb.a+=clamp(angDiff(Math.atan2(dy,dx),amb.a),-8*dt,8*dt);
  if(d<=sp){amb.x=q.x;amb.y=q.y;amb.pi++;if(amb.pi>=amb.path.length){ambAction(leg);amb.li++;amb.path=null;if(amb.li>=amb.legs.length){amb=null;return;}}}else{amb.x+=dx/d*sp;amb.y+=dy/d*sp;}
  for(const b of amb.riders){b.px=amb.x;b.py=amb.y;}}
// ---------- missioni a tempo (ogni 15 minuti) ----------
function newMission(){const pool=shops.filter(x=>x.type==='shop'&&x.anger===0);if(!pool.length){mission=null;return;}const from=pool[Math.floor(R()*pool.length)];
  const others=shops.filter(x=>x.type==='shop'&&x!==from);const to=others[Math.floor(R()*others.length)];const d=dist(from.x,from.y,to.x,to.y);
  let pay=100;if(d>WPX*.75)pay+=50;if(d>WPX)pay+=50;mission={from:from.i,to:to.i,carrier:-1,pay};msg('MISSIONE: '+from.name+' CERCA UN CORRIERE ('+pay+'$)','#ffe03c');sfx('alert');}
function missionTarget(){if(!mission)return null;return shops[mission.carrier<0?mission.from:mission.to];}
function planReturn(b){const s=nearestNodeLOS(b.x,b.y);const path=dijkstra(s,garage.node);if(!path)return null;
  const pts=path.map(i=>({x:nodes[i].x,y:nodes[i].y}));pts.push({x:garage.bays[b.i].x,y:garage.bays[b.i].y});
  let len=0,px=b.x,py=b.y;for(const q of pts){len+=dist(px,py,q.x,q.y);px=q.x;py=q.y;}return{pts,len};}
function updateMate(b,dt){
  if(b.shield&&b.shieldT!==null){b.shieldT-=dt;if(b.shieldT<=0){b.shield=false;b.shieldT=null;msg('SCUDO NASA DI '+b.name+' ESAURITO','#7a6f99');}}
  switch(b.status){
  case'garage':charge(b,dt,true);break;
  case'idle':charge(b,dt,true);b.waitT-=dt;
    if(b.waitT<=0){b.chkT-=dt;if(b.chkT<=0){b.chkT=2;const pl=planReturn(b);
      if(pl&&b.bat>=pl.len/speedOf(b)+3){b.path=pl.pts;b.pi=0;b.status='returning';b.waitCharge=false;}else b.waitCharge=true;}}break;
  case'returning':{if(!b.path){b.status='idle';b.waitT=0;break;}const q=b.path[b.pi];const dx=q.x-b.x,dy=q.y-b.y,d=Math.hypot(dx,dy);const sp=speedOf(b)*dt;
    b.a+=clamp(angDiff(Math.atan2(dy,dx),b.a),-8*dt,8*dt);
    if(d<=sp){b.x=q.x;b.y=q.y;b.pi++;if(b.pi>=b.path.length)toBay(b,'garage');}else{b.x+=dx/d*sp;b.y+=dy/d*sp;b.v=speedOf(b);}
    b.bat=Math.max(0,b.bat-dt);b.chg=0;if(b.bat<=0&&b.status==='returning'){b.status='idle';b.waitT=0;b.path=null;}
    if(b.status!=='returning')b.v=0;break;}
  case'hosp':b.hp=Math.min(maxHP,b.hp+10/60*dt);charge(b,dt,true);if(b.hp>=maxHP){const h=shops.find(x=>x.type==='hosp');if(dist(b.x,b.y,h.x,h.y)>60){msg(b.name+' DIMESSO DALL\'OSPEDALE','#ff4d6d');startFetch(b,h.x,h.y);break;}b.status='idle';b.waitT=0;b.chkT=0;msg(b.name+' DIMESSO DALL\'OSPEDALE','#ff4d6d');}break;
  case'medbay':charge(b,dt,true);if(b.hp>=maxHP)startFetch(b,b.px,b.py);break;
  case'fetch':{charge(b,dt,true);const q=b.fpath&&b.fpath[b.fpi];if(!q){b.status='idle';b.waitT=0;break;}const dx=q.x-b.px,dy=q.y-b.py,d=Math.hypot(dx,dy),sp=48*dt;b.pfa=Math.atan2(dy,dx);b.walk+=dt*12;
    if(d<=sp){b.px=q.x;b.py=q.y;b.fpi++;if(b.fpi>=b.fpath.length){b.fpath=null;msg(b.name+' HA RECUPERATO LA MOTO',b.ui);if(inGarage(b.x,b.y))toBay(b,'garage');else{b.status='idle';b.waitT=0;b.chkT=0;}}}
    else{b.px+=dx/d*sp;b.py+=dy/d*sp;}break;}
  case'out':b.outT-=dt;if(b.outT<=0)release(b);break;
  case'captured':b.capT-=dt;if(b.capT<=0){b.status='dead';msg(b.name+' E STATO UCCISO DAGLI XENO','#ff4d6d');checkEnd();}break;}}
// ---------- main update ----------
function update(dt){
  meta.gameT+=dt;const E=nightE();
  pAvail=state==='play';
  if(pAvail&&pressed.has('Tab'))switchBiker();
  const pp=pAvail?team[active]:null;
  if(pp){updatePlayer(pp,dt);if(state==='play'&&team[active]===pp&&pp.status==='active')interact(pp);}
  pAvail=state==='play';const ap=pAvail?team[active]:null;pBody=ap?body(ap):{x:-1e5,y:-1e5};
  for(const b of team){if(b!==ap)updateMate(b,dt);else if(b.shield&&b.shieldT!==null){b.shieldT-=dt;if(b.shieldT<=0){b.shield=false;b.shieldT=null;msg('SCUDO NASA ESAURITO','#7a6f99');}}heal(b,dt);}
  garageAutoMed();
  flowT-=dt;if(ap&&flowT<=0){flowT=.25;buildFlow(pBody.x,pBody.y);}
  for(const e of enemies)updateEnemy(e,dt);
  for(let i=0;i<enemies.length;i++){const a=enemies[i],A=body(a);for(let j=i+1;j<enemies.length;j++){const b=enemies[j],B=body(b);const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy);
      if(d>0&&d<13){const k=(13-d)/2/d;if(a.onFoot)moveCol(a,'fx','fy',-dx*k,-dy*k,3);else moveCol(a,'x','y',-dx*k,-dy*k,5);if(b.onFoot)moveCol(b,'fx','fy',dx*k,dy*k,3);else moveCol(b,'x','y',dx*k,dy*k,5);}}
    const dx=A.x-pBody.x,dy=A.y-pBody.y,d=Math.hypot(dx,dy);if(d>0&&d<12){const k=(12-d)/d;if(a.onFoot)moveCol(a,'fx','fy',dx*k,dy*k,3);else moveCol(a,'x','y',dx*k,dy*k,5);}}
  managePolice(dt);for(const c of police)updatePolice(c,dt);police=police.filter(c=>!c.gone);
  for(const b of bullets){const steps=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy)*dt/5));
    for(let s=0;s<steps&&!b.dead;s++){b.x+=b.vx*dt/steps;b.y+=b.vy*dt/steps;
      if(solidAt(b.x,b.y)){b.dead=true;spark(b.x,b.y,'#ffd27a',4,60);break;}
      if(b.o==='p'){for(const e of enemies){if(e.dead)continue;const q=body(e);if(dist(q.x,q.y,b.x,b.y)<8){damageEnemy(e,b.dmg);b.dead=true;break;}}
        if(!b.dead)for(const k of copsOut())if(dist(k.x,k.y,b.x,b.y)<7){damageCop(k,b.dmg);b.dead=true;break;}}
      else if(pAvail&&dist(pBody.x,pBody.y,b.x,b.y)<(team[active].inCar?11:7)){damagePlayer(b.dmg,b.o==='c'?'police':'xeno',b.from,'weapon');b.dead=true;}}
    b.life-=dt;if(b.life<=0)b.dead=true;}
  bullets=bullets.filter(b=>!b.dead);
  // operazione di polizia (commissariato): cattura 10 Xeno, uno ogni 12 secondi
  if(policeOp){policeOp.t-=dt;if(policeOp.t<=0){policeOp.t=12;const live=enemies.filter(e=>!e.dead);
    if(live.length){const e=live[Math.floor(R()*live.length)];e.dead=true;copKills++;freeCaptives(e);policeOp.left--;fx.push({k:'flash',x:e.x,y:e.y,t:0,dur:.5,r:50,c:'#3a7bff'});
      msg('LA POLIZIA HA CATTURATO UNO XENO ('+(10-policeOp.left)+'/10)','#3a7bff');}
    if(policeOp.left<=0||!live.length)policeOp=null;}}
  enemies=enemies.filter(e=>!e.dead);
  for(const q of parts){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.92;q.vy*=.92;q.life-=dt;}parts=parts.filter(q=>q.life>0);
  for(const q of pops){q.y-=18*dt;q.life-=dt;}pops=pops.filter(q=>q.life>0);
  for(const f of fx)f.t+=dt;fx=fx.filter(f=>f.t<f.dur);
  for(const m of msgs)m.life-=dt;msgs=msgs.filter(m=>m.life>0);
  for(const s of shops){s.cd-=dt;if(s.anger>0){s.calm+=dt;if(s.calm>=900){s.anger--;s.calm=0;}}else s.calm=0;}
  updateAmb(dt);
  bondT-=dt;if(bondT<=0){bondT=60;if(bonds.length){const g=40*bonds.length;money+=g;bonds=bonds.map(x=>x-1).filter(x=>x>0);msg('OBBLIGAZIONI: +'+g+'$','#ffd27a');}}
  missionT-=dt;if(missionT<=0){missionT=900;if(mission)msg('MISSIONE SCADUTA: PACCO PERSO','#ff4d6d');newMission();}
  churchCD=Math.max(0,churchCD-dt);if(noSpawnT>0){noSpawnT-=dt;if(noSpawnT<=0)msg('LA PROTEZIONE DELLA CHIESA E FINITA','#e6e0ff');}
  respawnT-=dt;if(respawnT<=0){respawnT=60;if(E<NIGHT&&noSpawnT<=0&&enemies.length<20){spawnEnemy();msg('UN NUOVO XENO E ENTRATO IN CITTA',ACID);}}
  if(enemies.length>=20){if(xenoFullT===null){xenoFullT=60;msg('20 XENO! 1 MINUTO PER ABBATTERNE UNO','#ff4d6d');}xenoFullT=nyxOn()?Math.max(1,xenoFullT-dt):xenoFullT-dt;}else xenoFullT=null;
  if(enemies.length<3)lowT+=dt;else lowT=0;
  if(ap&&ap.i===5&&!ap.nyx&&churchCD<=0&&state==='play'){const ch=shops.find(s=>s.type==='church');if(ch&&dist(pBody.x,pBody.y,ch.x,ch.y)<32){
      ap.nyx=true;churchCD=3600;fx.push({k:'flash',x:pBody.x,y:pBody.y,t:0,dur:1,r:120,c:'#b48cff'});sfx('switch');sfx('nitro');
      msg('NOVA SI TRASFORMA IN NYX, DEA DELLA NOTTE','#ff3df2');msg('PORTALA IN RIMESSA PRIMA CHE SI CONSUMI','#b48cff');}}
  if(ap&&ap.nyx&&ap===team[active]){ap.hp-=10/60*dt;if(ap.hp<=0)ap.lastSrc='nyx';
    if(!ceremony){for(const e of enemies){if(e.follow)continue;const q=body(e);if(dist(q.x,q.y,pBody.x,pBody.y)<NYX_R){e.follow=true;e.onFoot=false;pop(e.x,e.y-16,'FEDELE','#b48cff');}}}
    if(R()<.5)parts.push({x:pBody.x+(R()-.5)*14,y:pBody.y+(R()-.5)*14,vx:(R()-.5)*10,vy:-15-R()*15,life:.6,c:R()<.5?'#ff3df2':'#b48cff',sz:1});
    if(!ceremony&&inGarage(pBody.x,pBody.y)){const fol=enemies.filter(e=>e.follow);
      if(!fol.length){endNyx(ap,'NYX E IN RIMESSA MA NESSUN FEDELE LA SEGUE: TORNA NOVA');}
      else{ceremony={t:0,said:false,list:fol};for(const e of fol){e.kneel=true;e.v=0;const a=Math.atan2(pBody.y-e.y,pBody.x-e.x);e.onFoot=true;e.fx=e.x+Math.cos(a)*10;e.fy=e.y+Math.sin(a)*10;e.fa=a;}
        msg('DEA DELLA NOTTE, NOI SIAMO I SUOI FEDELI',ACID);}}}
  if(ceremony){ceremony.t+=dt;if(!ceremony.said&&ceremony.t>2.5){ceremony.said=true;msg('NYX: SPARITE!','#ff3df2');sfx('boom');}
    if(ceremony.t>4){const p=team[active];for(const e of ceremony.list){if(e.dead)continue;e.dead=true;dispersed++;freeCaptives(e);spark(e.fx,e.fy,'#b48cff',14,80);fx.push({k:'flash',x:e.fx,y:e.fy,t:0,dur:.5,r:30,c:'#b48cff'});}
      enemies=enemies.filter(e=>!e.dead);const nn=ceremony.list.length;for(const t of team)if(t!==p&&t.status!=='dead')t.hp=Math.min(maxHP,t.hp+5*nn);msg(nn+' XENO SPARITI: +'+5*nn+' VITA AGLI ALTRI BIKER','#b48cff');ceremony=null;endNyx(p,'NYX TORNA NOVA');}}
  if(ap&&ap.i===2&&!meta.fast&&meta.gameT<300&&state==='play'){const n=shops.find(s=>s.type==='nasa');if(n&&dist(pBody.x,pBody.y,n.x,n.y)<32)pendingFast=true;}
  if(ap&&ap.hp<=0)defeat();
  if(state==='wait'){const n=nextAvail(active);if(n>=0){activate(n);state='play';msg(team[n].name+' E PRONTO',team[n].ui);}}
  checkEnd();
  const q=team[active],tb=state==='play'?body(q):{x:garage.cx,y:garage.cy};const v=q.inCar?q.inCar.v:q.v,a=q.inCar?q.inCar.a:q.a;const lead=state==='play'&&(!q.onFoot||q.inCar)?.35:0;
  const tx=tb.x+Math.cos(a)*v*lead,ty=tb.y+Math.sin(a)*v*lead;const k=1-Math.exp(-6*dt);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;
  shake=Math.max(0,shake-dt*12);hurt=Math.max(0,hurt-dt);
  saveT-=dt;if(saveT<=0){saveT=5;saveGame();}
}
