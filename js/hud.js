'use strict';
// ---------- HUD ----------
function panel(x,y,w,h){ctx.fillStyle='rgba(8,5,16,.8)';ctx.fillRect(x,y,w,h);ctx.fillStyle='#ff3df2';ctx.fillRect(x,y,w,1);ctx.fillRect(x,y,1,h);ctx.fillStyle='#3cf2ff';ctx.fillRect(x,y+h-1,w,1);ctx.fillRect(x+w-1,y,1,h);ctx.fillStyle='#fff';ctx.fillRect(x,y,2,1);ctx.fillRect(x+w-2,y+h-1,2,1);}
function bar(x,y,w,h,f,col){ctx.fillStyle='#1a1426';ctx.fillRect(x,y,w,h);ctx.fillStyle=col;ctx.fillRect(x,y,Math.round(w*clamp(f,0,1)),h);ctx.fillStyle='rgba(0,0,0,.45)';for(let i=x+3;i<x+w;i+=4)ctx.fillRect(i,y,1,h);}
function statusTxt(b){switch(b.status){case'active':return[b.nyx?'NYX':b.inCar?'AUTO POLIZIA':b.onFoot?'A PIEDI':'IN GUIDA',b.nyx?'#ff3df2':'#5cff7a'];case'garage':return['IN RIMESSA','#3cf2ff'];
  case'idle':return[b.waitT>0?'FERMO '+fmt(b.waitT):'ATTENDE CARICA','#ffe03c'];case'returning':return['RIENTRO','#ff9de6'];case'amb':return['AUTO MEDICA','#ffffff'];case'waitamb':return['SOCCORSI','#ff9de6'];case'medbay':return['IN CURA '+Math.floor(b.hp/maxHP*100)+'%','#5cff7a'];case'fetch':return['VA ALLA MOTO','#ffe03c'];case'hosp':return['OSPEDALE '+Math.floor(b.hp/maxHP*100)+'%','#ff4d6d'];
  case'out':return[(b.outR==='ARRESTATO'?'ARRESTO':b.outR)+' '+shortT(b.outT),b.outR==='ARRESTATO'?'#3a7bff':'#ff4d6d'];case'captured':return['RAPITO '+shortT(b.capT),'#ff3df2'];case'dead':return['MORTO','#6a5f80'];}return['',''];}
function drawTopBar(){
  const E=nightE();panel(206,4,334,34);
  txt(hhmm(E),212,9,E>=NIGHT?'#ffb03c':'#ffffff',2);
  txt('XENO '+enemies.length+'/20',276,9,enemies.length>=16?'#ff4d6d':ACID);txt('$ '+money,352,9,'#ffe03c');txt('ABBATT. '+kills,404,9,'#ffffff');
  txt(E>=NIGHT?'ALBA: NIENTE RINFORZI':noSpawnT>0?'CHIESA: STOP '+fmt(noSpawnT):'RINFORZO '+fmt(respawnT),276,19,noSpawnT>0?'#e6e0ff':'#ff9de6');txt('POLIZIA '+police.filter(c=>!c.leave&&!c.gone).length,404,19,'#9fd4ff');
  txt(policeOp?'OPERAZIONE POLIZIA '+(10-policeOp.left)+'/10':'G: MAPPA',212,28,policeOp?'#3a7bff':'#7a6f99');txt('RIMESSA: '+garageMeds+' FARMACI',330,28,'#5cff7a');
  txt('OBBLIG. '+bonds.length,476,9,'#ffd27a');txt(bonds.length?'+'+40*bonds.length+'$ '+fmt(bondT):'',476,19,'#ffd27a');txt(radarOn?'W RADAR ON':'W RADAR',476,28,radarOn?'#ffe03c':'#7a6f99');}
function drawHUD(){
  const p=team[active],pb=body(p);
  panel(4,4,198,84);ctx.drawImage(p.por,9,9);if(p.nyx){ctx.fillStyle='rgba(180,60,255,.4)';ctx.fillRect(9,9,24,24);}ctx.fillStyle=p.ui;ctx.fillRect(8,8,26,1);ctx.fillRect(8,33,26,1);ctx.fillRect(8,8,1,26);ctx.fillRect(33,8,1,26);
  txt(p.nyx?'NYX':p.name,40,9,p.nyx?'#ff3df2':p.ui,2);txt(p.nyx?'DEA':p.sex,196,9,'#7a6f99',1,'right');
  txt('VITA',40,27,'#ff9de6');bar(68,27,100,6,p.hp/maxHP,p.hp>maxHP*.5?'#5cff7a':p.hp>maxHP*.25?'#ffe03c':'#ff4d6d');txt(Math.ceil(p.hp)+'',196,27,'#ffffff',1,'right');
  const lowB=p.bat<20;txt('BATT',40,38,'#ff9de6');bar(68,38,100,6,p.bat/BAT_MAX,lowB&&Math.floor(T*4)%2?'#ff4d6d':'#3cf2ff');txt(fmt(p.bat),196,38,lowB?'#ff4d6d':'#ffffff',1,'right');
  const still=p.onFoot||Math.abs(p.v)<4,gar=inGarage(p.x,p.y),per=gar?15:30;
  ctx.fillStyle='#ffe03c';ctx.fillRect(10,39,4,4);ctx.fillRect(11,37,2,1);ctx.fillRect(11,44,2,1);ctx.fillRect(8,40,1,2);ctx.fillRect(15,40,1,2);
  bar(18,40,16,3,still&&p.bat<BAT_MAX?p.chg/per:0,'#ffe03c');if(gar)txt('X2',10,47,'#ff3df2');if(p.medOn&&Math.floor(T*2)%2)txt('+',26,47,'#5cff7a');
  let line;if(p.inCar)line='AUTO POLIZIA: RIMESSA O COMMISSARIATO';else if(p.onFoot)line=p.walkPath?'TORNA ALLA MOTO...':'A PIEDI - PUGNI '+p.punch.dmg+' DANNI';else if(p.bat<=0)line='BATTERIA SCARICA';
  else line=p.wpn?p.wpn.label+' '+(p.wpn.dmg+dmgBonus(p))+' DANNI'+(p.weapons.length>1?' [Q]':''):'NESSUNA ARMA - Z PER I PUGNI';
  txt(line,40,50,p.bat<=0&&!p.onFoot?'#ff4d6d':'#c9c2e6');
  txt('FARMACI '+p.meds+'/3',40,61,'#5cff7a');txt('NITRO '+p.nitro+'/5'+(p.nitroT>0?' ('+Math.ceil(p.nitroT)+'S)':''),112,61,p.nitroT>0?'#3cf2ff':'#ffb03c');
  if(p.nyx)txt('NYX: -10 VITA/MIN - FEDELI '+enemies.filter(e=>e.follow).length,40,72,'#ff3df2');else if((p.i===0||p.i===3)&&inGarage(pb.x,pb.y))txt('R: RICHIAMA TUTTI IN RIMESSA',40,72,p.ui);else txt(p.shield?(p.shieldT===null?'SCUDO PRONTO':'SCUDO '+fmt(p.shieldT)):'NO SCUDO',40,72,p.shield?'#9fd4ff':'#4e4566');if(p.tuned&&!p.nyx&&!((p.i===0||p.i===3)&&inGarage(pb.x,pb.y)))txt('MOTO X'+(p.i===2?'1.2':'1.6'),130,72,'#ff6ec7');
  drawTopBar();
  const cx=VW-34,cy=36;ctx.fillStyle='rgba(8,5,16,.8)';ctx.beginPath();ctx.arc(cx,cy,28,0,6.283);ctx.fill();
  for(let a=0;a<72;a++){ctx.fillStyle=a%18===0?'#ffffff':(a%2?'#ff3df2':'#3cf2ff');ctx.fillRect(Math.round(cx+Math.cos(a/72*6.283)*27),Math.round(cy+Math.sin(a/72*6.283)*27),1,1);}
  txt('N',cx,cy-24,'#ffffff',1,'center','');txt('S',cx,cy+18,'#7a6f99',1,'center','');txt('E',cx+21,cy-3,'#7a6f99',1,'center','');txt('O',cx-21,cy-3,'#7a6f99',1,'center','');
  let ne=null,nd=1e9;for(const e of enemies){if(e.follow&&p.nyx)continue;const b=body(e);const d=dist(b.x,b.y,pb.x,pb.y);if(d<nd){nd=d;ne=b;}}
  const needle=(a,col,len)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(a);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(len,0);ctx.lineTo(-3,-5);ctx.lineTo(0,0);ctx.lineTo(-3,5);ctx.closePath();ctx.fill();ctx.restore();};
  let capE=null,cd2=1e9,capB=null;for(const t of team){if(t.status!=='captured')continue;const e=enemies.find(e=>e.id===t.captor);if(!e)continue;const d=dist(e.x,e.y,pb.x,pb.y);if(d<cd2){cd2=d;capE=e;capB=t;}}
  if(capE)needle(Math.atan2(capE.y-pb.y,capE.x-pb.x),'#ff3df2',14);
  if(ne){needle(Math.atan2(ne.y-pb.y,ne.x-pb.x),ACID,19);ctx.fillStyle='#fff';ctx.fillRect(cx-1,cy-1,2,2);
    txt('XENO '+Math.round(nd/8)+'M',cx,cy+32,nd<260&&Math.floor(T*4)%2?'#ff4d6d':ACID,1,'center');}else txt('NESSUN XENO',cx,cy+32,'#7a6f99',1,'center');
  let my2=cy+42;if(capE){txt('RAPITO '+capB.name+' '+Math.round(cd2/8)+'M',VW-4,my2,'#ff3df2',1,'right');txt(fmtL(capB.capT),VW-4,my2+9,'#ff3df2',1,'right');my2+=20;}
  if(mission){const t=missionTarget();if(mission.carrier<0||mission.carrier===active){needle(Math.atan2(t.y-pb.y,t.x-pb.x),'#ffe03c',11);
      txt((mission.carrier<0?'PACCO DA ':'CONSEGNA A ')+t.name+' '+Math.round(dist(t.x,t.y,pb.x,pb.y)/8)+'M',VW-4,my2,'#ffe03c',1,'right');}
    else txt('PACCO CON '+team[mission.carrier].name,VW-4,my2,'#ffe03c',1,'right');txt('MISSIONE '+mission.pay+'$ - '+fmt(missionT),VW-4,my2+9,'#ffe03c',1,'right');my2+=20;}
  if(radarOn){for(const ty of ['pharm','mech','shop']){let best=null,bd=1e9;for(const s of shops){if(s.type!==ty)continue;const d=dist(s.x,s.y,pb.x,pb.y);if(d<bd){bd=d;best=s;}}
      if(!best)continue;const c=SHOP_T[ty].c;needle(Math.atan2(best.y-pb.y,best.x-pb.x),c,9);txt(SHOP_T[ty].name+' '+Math.round(bd/8)+'M',VW-4,my2,c,1,'right');my2+=9;}}
  const mx=4,my=VH-108,MS=100;panel(mx,my,MS+4,MS+4);
  const pmx=pb.x/32,pmy=pb.y/32;const sx=clamp(Math.round(pmx-MS/2),0,MW/2-MS),sy=clamp(Math.round(pmy-MS/2),0,MH/2-MS);
  ctx.drawImage(miniCv,sx,sy,MS,MS,mx+2,my+2,MS,MS);
  const mark=(x,y,c,s,clampIt=true)=>{let X=Math.round(x/32-sx),Y=Math.round(y/32-sy);if(!clampIt&&(X<0||Y<0||X>=MS||Y>=MS))return;X=clamp(X,0,MS-1);Y=clamp(Y,0,MS-1);ctx.fillStyle=c;ctx.fillRect(mx+2+X-(s>>1),my+2+Y-(s>>1),s,s);};
  for(const s of shops)mark(s.x,s.y,SHOP_T[s.type].c,SHOP_T[s.type].sp?3:2,false);
  if(amb)mark(amb.x,amb.y,Math.floor(T*6)%2?'#ff2b4a':'#ffffff',3,false);if(mission&&Math.floor(T*3)%2){const t=missionTarget();mark(t.x,t.y,'#ffe03c',4);}
  for(const c of police)mark(c.x,c.y,c.mode==='abandoned'?'#9fd4ff':Math.floor(T*6)%2?'#ff2b4a':'#2b6bff',2,false);
  mark(garage.cx,garage.cy,Math.floor(T*2)%2?'#ff3df2':'#ffffff',4);
  for(const b of team)if(b.i!==active&&AVAIL(b.status))mark(b.x,b.y,b.ui,2);
  if(capE&&Math.floor(T*3)%2)mark(capE.x,capE.y,'#ff3df2',3);
  mark(pb.x,pb.y,'#ffffff',3);txt('MAPPA (G)',mx+4,my+4,'#3cf2ff');
  drawRoster();
  msgs.forEach((m,i)=>{ctx.globalAlpha=Math.min(1,m.life);txt(m.t,VW/2,94+i*18,m.c,m.t.length>34?1:2,'center');});ctx.globalAlpha=1;
  if(xenoFullT!==null){txt('XENO 20/20 - ABBATTINE UNO: '+fmt(xenoFullT),VW/2,150,Math.floor(T*4)%2?'#ff4d6d':'#ffffff',2,'center');if(nyxOn())txt('NYX FERMA IL TEMPO: PORTALA IN RIMESSA',VW/2,168,'#ff3df2',1,'center');}
  else if(enemies.length<3&&lowT>0)txt('XENO SOTTO 3: '+fmtL(lowT)+' / 30:00 PER VINCERE',VW/2,150,'#5cff7a',1,'center');
  if(p.bat<15&&p.bat>0&&Math.floor(T*2)%2)txt('BATTERIA BASSA',VW/2,162,'#ff4d6d',1,'center');
  if(nightE()<40)txt('Z SCENDI - E NEGOZI/AUTO - F FARMACO - C CONSEGNA - X NITRO - Q ARMA - G MAPPA - W RADAR - TAB CAMBIA',VW/2,VH-44,'#c9c2e6',1,'center');
  if(hurt>0){ctx.fillStyle=`rgba(255,40,80,${hurt*.9})`;ctx.fillRect(0,0,VW,VH);}}
function drawRoster(){for(let i=0;i<6;i++){const b=team[i],x=112+i*87,y=VH-30;panel(x,y,86,27);
    ctx.fillStyle=b.color;ctx.fillRect(x+3,y+4,5,19);if(b.rim){ctx.fillStyle=b.rim;ctx.fillRect(x+3,y+4,5,1);ctx.fillRect(x+3,y+22,5,1);}
    if(i===active&&state==='play'&&Math.floor(T*3)%2){ctx.fillStyle='#ffffff';ctx.fillRect(x,y,86,1);ctx.fillRect(x,y+26,86,1);}
    txt(b.name,x+11,y+3,b.status==='dead'?'#6a5f80':b.ui);const[st,sc]=statusTxt(b);txt(st,x+11,y+11,sc);
    if(b.shield){ctx.fillStyle='#9fd4ff';ctx.fillRect(x+80,y+3,3,3);}if(b.tuned){ctx.fillStyle='#ff6ec7';ctx.fillRect(x+75,y+3,3,3);}
    bar(x+11,y+20,72,2,b.hp/maxHP,b.medOn?'#b6ff7a':'#5cff7a');bar(x+11,y+23,72,2,b.bat/BAT_MAX,'#3cf2ff');}}
function drawBigMap(){ctx.fillStyle='rgba(5,3,12,.85)';ctx.fillRect(0,0,VW,VH);const S=1.4,W=MW/2*S,x0=Math.round(VW/2-W/2)-60,y0=8;panel(x0-3,y0-3,W+6,W+6);
  ctx.drawImage(miniCv,0,0,MW/2,MH/2,x0,y0,W,W);const P=(x,y)=>[x0+x/32*S,y0+y/32*S];
  const dot=(x,y,c,s)=>{const[a,b]=P(x,y);ctx.fillStyle=c;ctx.fillRect(Math.round(a-s/2),Math.round(b-s/2),s,s);};
  for(const s of shops){dot(s.x,s.y,SHOP_T[s.type].c,SHOP_T[s.type].sp?4:3);if(SHOP_T[s.type].sp){const[a,b]=P(s.x,s.y);txt(s.name,a,b+4,SHOP_T[s.type].c,1,'center');}}
  if(amb)dot(amb.x,amb.y,'#ff2b4a',4);if(mission){const t=missionTarget();if(Math.floor(T*3)%2)dot(t.x,t.y,'#ffe03c',6);const[a,b2]=[x0+t.x/32*S,y0+t.y/32*S];txt('PACCO',a,b2-11,'#ffe03c',1,'center');}
  for(const c of police)dot(c.x,c.y,c.mode==='abandoned'?'#9fd4ff':'#2b6bff',3);
  for(const t of team){if(t.status==='captured'){const e=enemies.find(e=>e.id===t.captor);if(e)dot(e.x,e.y,'#ff3df2',4);}else if(t.status!=='dead'&&t.i!==active)dot(t.x,t.y,t.ui,3);}
  dot(garage.cx,garage.cy,'#ff3df2',6);{const[a,b]=P(garage.cx,garage.cy);txt('RIMESSA',a,b+5,'#ff3df2',1,'center');}
  if(state==='play'){const pb=body(team[active]);if(Math.floor(T*4)%2)dot(pb.x,pb.y,'#ffffff',5);}
  const lx=x0+W+16;let ly=20;const leg=[['FARMACIA',SHOP_T.pharm.c],['MECCANICO',SHOP_T.mech.c],['NEGOZIO',SHOP_T.shop.c],['EDIFICI SPECIALI','#ffffff'],['POLIZIA','#2b6bff'],['AUTO LIBERA','#9fd4ff'],['RAPITORE','#ff3df2'],['TU','#ffffff']];
  txt('LEGENDA',lx,ly,'#3cf2ff',1);ly+=14;for(const[n,c]of leg){ctx.fillStyle=c;ctx.fillRect(lx,ly+1,4,4);txt(n,lx+8,ly,c);ly+=11;}
  ly+=8;for(const t of SPECIALS){txt(SHOP_T[t].name,lx,ly,SHOP_T[t].c);ly+=11;}
  txt('G PER CHIUDERE',lx,VH-20,'#7a6f99');}
function drawGunMenu(){const p=team[active];ctx.fillStyle='rgba(5,3,12,.8)';ctx.fillRect(0,0,VW,VH);panel(150,90,340,170);txt('ARMERIA - 10000$',VW/2,100,'#d0d0dc',2,'center');
  txt('SCEGLI L\'ARMA DI UN COLLEGA PER '+p.name,VW/2,124,'#c9c2e6',1,'center');
  gunMenu.opts.forEach((i,k)=>{const w=ROSTER[i].wpn;txt((k+1)+' - '+w.label+' (DI '+ROSTER[i].name+') '+w.dmg+' DANNI/'+w.cd+'S',170,146+k*18,ROSTER[i].ui);});
  txt('ESC PER ANNULLARE',VW/2,240,'#7a6f99',1,'center');}

// ---------- title & screens ----------
let logo=null;
function makeLogo(){const sc=10,t='NYX',w=t.length*6*sc,h=8*sc;const c=mk(w+8,h+8),g=c.getContext('2d');
  glyphs(g,t,6,6,sc,'#2a0b3d');glyphs(g,t,3,3,sc,'#3cf2ff');
  const m=mk(w,h),mg=m.getContext('2d');glyphs(mg,t,0,0,sc,'#fff');mg.globalCompositeOperation='source-in';const gr=mg.createLinearGradient(0,0,0,7*sc);
  gr.addColorStop(0,'#ffe03c');gr.addColorStop(.5,'#ff3df2');gr.addColorStop(1,'#7a2bff');mg.fillStyle=gr;mg.fillRect(0,0,w,h);
  mg.globalCompositeOperation='destination-out';for(let y=Math.floor(3.6*sc),k=1;y<7*sc;y+=4+k,k++)mg.fillRect(0,y,w,k>3?2:1);g.drawImage(m,0,0);return c;}
let saved=readSave();
function titleInput(){
  if(pressed.has('ArrowRight')||pressed.has('KeyD'))sel=(sel+1)%6;if(pressed.has('ArrowLeft')||pressed.has('KeyA'))sel=(sel+5)%6;
  if(pressed.has('ArrowDown')||pressed.has('ArrowUp')||pressed.has('KeyW')||pressed.has('KeyS'))sel=(sel+3)%6;
  const live=saved&&!saved.meta.ended;
  if(pressed.has('Backspace')||pressed.has('Delete')){if(saved){if(delArm>0){delSave();saved=null;meta=null;delArm=0;titleMsg='SALVATAGGIO CANCELLATO';}else{delArm=2.5;titleMsg='PREMI DI NUOVO CANC PER CANCELLARE';}}}
  if(pressed.has('Enter')||pressed.has('KeyT')){if(live)loadGame(saved);else newGame(sel);}}
function drawTitle(dt){
  const cx=WPX/2+Math.cos(T*.03)*1800,cy=HPX/2+Math.sin(T*.04)*1800;drawWorld(cx,cy,dt);
  ctx.fillStyle='rgba(5,3,12,.62)';ctx.fillRect(0,0,VW,VH);
  if(!logo)logo=makeLogo();ctx.drawImage(logo,VW/2-logo.width/2|0,4);
  txt('NEW YORK XENO',VW/2,90,'#3cf2ff',2,'center','#2a0b3d');txt('POST-CYBERPUNK MOTO WARS - DALLE 18:00 ALLE 06:00',VW/2,108,'#ff9de6',1,'center');
  const cw=196,chh=58,x0=(VW-3*cw-8)/2|0;const live=saved&&!saved.meta.ended;
  for(let i=0;i<6;i++){const r=ROSTER[i],x=x0+(i%3)*(cw+4),y=120+Math.floor(i/3)*(chh+4);panel(x,y,cw,chh);
    if(i===sel&&!live){ctx.fillStyle=Math.floor(T*4)%2?'#ffffff':r.ui;ctx.fillRect(x,y,cw,2);ctx.fillRect(x,y+chh-2,cw,2);ctx.fillRect(x,y,2,chh);ctx.fillRect(x+cw-2,y,2,chh);}
    if(!r._por)r._por=portrait(r);ctx.drawImage(r._por,x+6,y+5);
    if(!r._spr)r._spr=bikeSprite(r.color,r.rim,true,false,'#1e1a28',r.color==='#16121f'?'#2a2440':r.color,r.visor);
    ctx.save();ctx.translate(x+18,y+43);ctx.scale(1.5,1.5);ctx.drawImage(r._spr,-10,-6);ctx.restore();
    txt(r.name,x+36,y+5,r.ui,2);txt(r.sex,x+cw-6,y+5,'#7a6f99',1,'right');const w=r.wpn;
    txt(w?'ARMA: '+w.label:'ARMA: NESSUNA',x+36,y+22,'#ffffff');
    txt(w?(w.k==='gun'?w.dmg+' DANNI/'+w.cd+'S GITTATA '+w.rng/BL:w.dmg+' DANNI/'+w.cd+'S RAGGIO '+w.rad):'SOLO A MANI NUDE',x+36,y+31,'#c9c2e6');
    txt('PUGNI '+r.punch.dmg+' / '+r.punch.cd+'S   MOTO X'+r.spd,x+36,y+40,'#ff9de6');}
  const y0=246;const bl=Math.floor(T*2)%2?'#ffe03c':'#ffffff';
  if(saved&&saved.meta.ended){const e=saved.meta.ended;txt('ULTIMA NOTTE: '+(e.win?'VITTORIA':'SCONFITTA')+' - '+e.reason+' - XENO ABBATTUTI '+e.kills,VW/2,y0,e.win?'#5cff7a':'#ff4d6d',1,'center');}
  if(live)txt('NOTTE IN CORSO (ORE '+hhmm(saved.meta.gameT)+') - INVIO: CONTINUA   CANC: CANCELLA',VW/2,y0+12,bl,1,'center');
  else txt('SCEGLI IL BIKER - INVIO: INIZIA LA NOTTE (ORE 18:00)',VW/2,y0+12,bl,1,'center');
  if(titleMsg)txt(titleMsg,VW/2,y0+24,'#ff9de6',1,'center');
  const L=['FRECCE GUIDA - SPAZIO ARMA/PUGNO - Z SCENDI/SALI - TAB CAMBIA - X NITRO - Q ARMA - G MAPPA - W RADAR',
    'E: NEGOZI, RAPINE, EDIFICI SPECIALI E FURTO AUTO DELLA POLIZIA - F FARMACO - C CONSEGNA FARMACI IN RIMESSA',
    'A 0 VITA TI ARRENDI: LO XENO TI CATTURA (30 MIN PER UCCIDERLO) O SCAPPI (20%, IN RIMESSA DOPO 3 MIN CON 1 DI VITA)',
    'VINCI: XENO SOTTO 3 PER 30 MIN O NESSUNO XENO ALL\'ALBA - PERDI SE ARRIVANO A 20 PER 1 MINUTO',
    'OGNI MINUTO GIOCATO E UN MINUTO DI NOTTE - SALVATAGGIO NEL BROWSER - P PAUSA - M MUSICA - N AUDIO'];
  L.forEach((l,i)=>txt(l,VW/2,y0+38+i*11,i<2?'#c9c2e6':'#7a6f99',1,'center'));}
function drawEnd(){ctx.fillStyle='rgba(5,3,12,.78)';ctx.fillRect(0,0,VW,VH);const e=meta.ended;
  txt(e.win?'VITTORIA':'GAME OVER',VW/2,90,e.win?'#5cff7a':'#ff4d6d',4,'center','#2a0b3d');txt(e.reason,VW/2,140,'#ffffff',e.reason.length>34?1:2,'center');
  txt('XENO ABBATTUTI: '+e.kills+(copKills?'  (+'+copKills+' POLIZIA)':'')+(dispersed?'  (+'+dispersed+' SPARITI)':''),VW/2,175,ACID,e.kills>99||copKills||dispersed?1:2,'center');txt('ORA: '+hhmm(e.at)+'   CASSA: '+money+'$',VW/2,197,'#3cf2ff',2,'center');
  txt('INVIO PER TORNARE AL TITOLO',VW/2,240,Math.floor(T*2)%2?'#ffe03c':'#ffffff',1,'center');}
function drawWait(){ctx.fillStyle='rgba(5,3,12,.6)';ctx.fillRect(0,0,VW,VH);drawTopBar();drawRoster();
  txt('NESSUN BIKER DISPONIBILE',VW/2,110,'#ff4d6d',2,'center');txt('LA NOTTE CONTINUA: ASPETTA CHE QUALCUNO TORNI IN RIMESSA',VW/2,136,'#c9c2e6',1,'center');
  let y=160;for(const b of team){if(b.status==='dead')continue;const[st,sc]=statusTxt(b);txt(b.name+' - '+st,VW/2,y,sc,1,'center');y+=12;}
  msgs.forEach((m,i)=>{ctx.globalAlpha=Math.min(1,m.life);txt(m.t,VW/2,60+i*12,m.c,1,'center');});ctx.globalAlpha=1;}
function drawPause(){ctx.fillStyle='rgba(5,3,12,.78)';ctx.fillRect(0,0,VW,VH);txt('PAUSA',VW/2,24,'#ff3df2',3,'center','#2a0b3d');
  const L=[['FRECCE GUIDA - SPAZIO ARMA O PUGNO - Z SCENDI/SALI - TAB CAMBIA BIKER - W RADAR NEGOZI','#c9c2e6'],['X NITRO - Q CAMBIA ARMA - F FARMACO - C CONSEGNA FARMACI - G MAPPA','#c9c2e6'],
   ['FARMACIA: FARMACO 100$ (MAX 3, +25 VITA/MIN)','#5cff7a'],['MECCANICO: ELETTRONITRO 50$ (MAX 5, X2 PER 20S)','#ffb03c'],['NEGOZIO: RAPINA A PIEDI 30-120$ - DANNI 10/20/30/40/60 - FA SALIRE LA RABBIA','#ffe03c'],
   ['CHIESA: NESSUN NUOVO XENO PER 10 MIN (OGNI 60 MIN)','#e6e0ff'],['COMMISSARIATO: PORTA UN\'AUTO DELLA POLIZIA - 30% CATTURANO 10 XENO, ALTRIMENTI ARRESTO 5 MIN','#3a7bff'],
   ['CENTRO NASA: SCUDO ANTI ARMI XENO 500$ - DURA 20 MIN DAL PRIMO COLPO','#9fd4ff'],['OSPEDALE: RICOVERO GRATIS +10 VITA/MIN - UN BIKER ALLA VOLTA','#ff4d6d'],
   ['NEGOZIO MOTO: 5000$ VELOCITA X1.6 PERMANENTE (CASPIAN X1.2)','#ff6ec7'],['ARMERIA: 10000$ SECONDA ARMA DI UN COLLEGA','#d0d0dc'],
   ['OSPEDALE: 3 FARMACI DONATI DA 2 BIKER DIVERSI = +25 VITA MAX AL TEAM (FINO A 250)','#5cff7a'],['CHIESA: ZEPHYR, POI VESPER = MATRIMONIO 10000$ (MOTO X1.2) - ARMERIA: INDIGO, POI ATLAS = +2 DANNI','#ff6ec7'],
   ['CASPIAN AL CENTRO NASA ENTRO LE 18:05 = NOTTE VELOCE (RIPARTE ALLE 05:00)','#9fd4ff'],
   ['BANCA: OBBLIGAZIONE 1000$ = 40$ AL MINUTO PER 30 MIN - COMMISSARIATO: CAUZIONE 1000$ A ARRESTATO','#ffd27a'],
   ['CENTRO ALIENI (ZEPHYR/VESPER): 25$ PER XENO ABBATTUTO - 10+ XENO = AUTO MEDICA','#c6ff3a'],['MISSIONI: OGNI 15 MIN UN PACCO DA CONSEGNARE - 100$ (+50 OLTRE 75% MAPPA, +50 OLTRE 100%)','#ffe03c'],
   ['UCCIDI I 2 AGENTI: RUBA L\'AUTO (E) E PORTALA IN RIMESSA = 200-400$','#9fd4ff'],['RIMESSA: +2 VITA/MIN, RICARICA X2, ZONA SICURA - M MUSICA - N AUDIO - P RIPRENDI','#7a6f99']];
  L.forEach((l,i)=>txt(l[0],VW/2,56+i*14,l[1],1,'center'));}
