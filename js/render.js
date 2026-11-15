'use strict';
// ---------- rain ----------
const rain=[];for(let i=0;i<140;i++)rain.push({x:Math.random()*VW,y:Math.random()*VH,s:180+Math.random()*120});
function drawRain(dt){ctx.fillStyle='rgba(150,180,255,.28)';for(const d of rain){d.y+=d.s*dt;d.x-=d.s*.25*dt;if(d.y>VH){d.y=-4;d.x=Math.random()*(VW+60);}if(d.x<0)d.x+=VW;ctx.fillRect(d.x|0,d.y|0,1,3);}
  if(Math.random()<.5){const x=Math.random()*VW|0,y=Math.random()*VH|0;ctx.fillStyle='rgba(180,200,255,.25)';ctx.fillRect(x-1,y,3,1);}}

// ---------- world render ----------
function drawPerson(x,y,a,jacket,head,hair,punchT,walk,female){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);
  const sw=Math.sin(walk)*2;ctx.fillStyle=jacket;ctx.fillRect(-2,-4,4,8);ctx.fillRect(-1+sw,-5,3,2);ctx.fillRect(-1-sw,3,3,2);
  if(punchT>0){ctx.fillRect(1,1,6,2);ctx.fillStyle='#f0c8a0';ctx.fillRect(7,1,2,2);}
  if(female){ctx.fillStyle=hair;ctx.fillRect(-4,-2,3,4);}
  ctx.fillStyle=head;ctx.fillRect(-2,-2,4,4);ctx.fillStyle=hair;ctx.fillRect(-2,-2,2,4);ctx.restore();}
function drawSpr(s,x,y,a,w,h){ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);ctx.drawImage(s,-(w||20)/2,-(h||12)/2);ctx.restore();}
function drawWorld(cx,cy,dt){
  const sx=shake?(Math.random()-.5)*shake*2:0,sy=shake?(Math.random()-.5)*shake*2:0;
  const ox=Math.round(cx-VW/2+sx),oy=Math.round(cy-VH/2+sy);
  ctx.save();ctx.translate(-ox,-oy);
  ctx.fillStyle=asphPat;ctx.fillRect(ox,oy,VW,VH);
  const X0=ox-60,Y0=oy-60,X1=ox+VW+60,Y1=oy+VH+60;
  for(const e of edges){const A=nodes[e.a],B=nodes[e.b];
    if(e.h){if(A.y<Y0||A.y>Y1)continue;const xa=Math.min(A.x,B.x),xb=Math.max(A.x,B.x);if(xb<X0||xa>X1)continue;
      ctx.fillStyle='#6e6230';const s0=Math.max(xa+40,Math.floor(X0/16)*16),s1=Math.min(xb-40,X1);for(let x=Math.ceil(s0/16)*16;x<s1;x+=16)ctx.fillRect(x,A.y-1,8,2);
      if(xb-xa>90){ctx.fillStyle='#4e4862';for(let y=A.y-22;y<A.y+22;y+=6){ctx.fillRect(xa+27,y,8,3);ctx.fillRect(xb-35,y,8,3);}}}
    else{if(A.x<X0||A.x>X1)continue;const ya=Math.min(A.y,B.y),yb=Math.max(A.y,B.y);if(yb<Y0||ya>Y1)continue;
      ctx.fillStyle='#6e6230';const s0=Math.max(ya+40,Math.floor(Y0/16)*16),s1=Math.min(yb-40,Y1);for(let y=Math.ceil(s0/16)*16;y<s1;y+=16)ctx.fillRect(A.x-1,y,2,8);
      if(yb-ya>90){ctx.fillStyle='#4e4862';for(let x=A.x-22;x<A.x+22;x+=6){ctx.fillRect(x,ya+27,3,8);ctx.fillRect(x,yb-35,3,8);}}}}
  for(const b of blocks){const bx=b.x*CELL,by=b.y*CELL,bw=b.w*CELL,bh=b.h*CELL;if(bx>ox+VW||by>oy+VH||bx+bw<ox||by+bh<oy)continue;ctx.drawImage(blockCanvas(b),bx,by);}
  ctx.fillStyle='#07050c';if(ox<0)ctx.fillRect(ox,oy,-ox,VH);if(oy<0)ctx.fillRect(ox,oy,VW,-oy);if(ox+VW>WPX)ctx.fillRect(WPX,oy,ox+VW-WPX,VH);if(oy+VH>HPX)ctx.fillRect(ox,HPX,VW,oy+VH-HPX);
  for(const l of lamps){if(l.x<X0||l.x>X1||l.y<Y0||l.y>Y1)continue;ctx.fillStyle='#14111c';ctx.fillRect(l.x-1,l.y-1,3,3);ctx.fillStyle=l.c;ctx.fillRect(l.x,l.y,1,1);}
  const vis=(x,y)=>x>X0&&x<X1&&y>Y0&&y<Y1;
  const playing=state==='play';
  for(const b of team){if(b.i===active&&playing)continue;if(b.status==='dead'||!vis(b.x,b.y))continue;
    const empty=b.status==='out'||b.status==='captured'||b.status==='hosp'||b.status==='amb'||b.status==='medbay'||b.status==='fetch'||b.status==='waitamb';drawSpr(empty?b.sprE:b.spr,b.x,b.y,b.a);
    if(b.status==='idle'){txt(b.name,b.x,b.y-18,b.ui,1,'center');txt(b.waitT>0?fmt(b.waitT):'IN CARICA',b.x,b.y+9,'#ffe03c',1,'center');}
    else if(b.status==='returning')txt(b.name,b.x,b.y-18,b.ui,1,'center');
    else if(empty)txt(b.status==='captured'?'RAPITO':b.status==='hosp'?'OSPEDALE':b.status==='amb'?'AUTO MEDICA':b.status==='waitamb'?'SOCCORSI':b.status==='medbay'?'IN CURA':b.status==='fetch'?'ASPETTA':b.outR,b.x,b.y+9,'#ff4d6d',1,'center');}
  for(const b of team){if((b.status==='fetch'||b.status==='medbay')&&vis(b.px,b.py)){drawPerson(b.px,b.py,b.pfa||0,shade(b.ui,-.2),b.skin,b.hair,0,b.status==='fetch'?b.walk:0,b.sex==='DONNA');txt(b.name,b.px,b.py-12,b.ui,1,'center');}}
  if(amb&&vis(amb.x,amb.y)){drawSpr(ambSpr,amb.x,amb.y,amb.a,26,14);txt('AUTO MEDICA',amb.x,amb.y-16,'#ff4d6d',1,'center');}
  if(mission){const t=missionTarget();if(vis(t.x,t.y)&&Math.floor(T*3)%2)txt(mission.carrier<0?'PACCO!':'CONSEGNA QUI',t.x,t.y-31,'#ffe03c',1,'center');}
  for(const e of enemies){const s=enemySpr(e.t);if(!vis(e.x,e.y)&&!vis(e.fx,e.fy))continue;
    if(e.onFoot){drawSpr(s.e,e.x,e.y,e.a);drawPerson(e.fx,e.fy,e.fa,'#4a1a7a',ACID,'#2a0b3d',e.punchT,e.walk,false);}else drawSpr(s.r,e.x,e.y,e.a);
    if(e.follow&&nyxOn()&&!e.kneel&&Math.floor(T*2+e.id)%4===0){ctx.fillStyle='#b48cff';ctx.fillRect(Math.round(e.x)-1,Math.round(e.y)-12,3,3);}
    if(e.kneel&&ceremony)txt(ceremony.said?'...':'DEA DELLA NOTTE',e.fx,e.fy-14,ACID,1,'center');
    const caps=team.filter(t=>t.status==='captured'&&t.captor===e.id);
    caps.forEach((t,i)=>{const cx2=Math.round(e.x-Math.cos(e.a)*(14+i*8)),cy2=Math.round(e.y-Math.sin(e.a)*(14+i*8));ctx.fillStyle=t.color;ctx.fillRect(cx2-3,cy2-3,6,6);ctx.fillStyle='#000';ctx.fillRect(cx2-2,cy2-3,1,6);ctx.fillRect(cx2+1,cy2-3,1,6);
      txt(t.name+' '+fmt(t.capT),e.x,e.y-26-i*9,Math.floor(T*3)%2?'#ff3df2':t.ui,1,'center');});
    const b=body(e);if(e.hitT>0){ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(b.x-5,b.y-5,10,10);}
    if(e.hp<25){ctx.fillStyle='#000';ctx.fillRect(b.x-8,b.y-12,16,3);ctx.fillStyle=ACID;ctx.fillRect(b.x-7,b.y-11,Math.max(0,14*e.hp/25),1);}}
  for(const c of police){if(vis(c.x,c.y)){drawSpr(copSpr,c.x,c.y,c.a,26,14);
      if(c.mode==='abandoned'&&pAvail&&dist(c.x,c.y,pBody.x,pBody.y)<60)txt(team[active].onFoot&&!team[active].inCar?'E: RUBA L\'AUTO':'AUTO INCUSTODITA',c.x,c.y-16,'#9fd4ff',1,'center');
      if(c.mode==='impound')txt('RESTA '+fmt(c.impT),c.x,c.y-14,'#9fd4ff',1,'center');}
    if(c.mode==='cops')for(const k of c.cops)if(k.out&&k.hp>0&&vis(k.x,k.y))drawPerson(k.x,k.y,k.fa,'#1d2a6b','#c68a5e','#0e0e14',0,k.walk,false);
    if(c.arrest>0&&pAvail){const w=Math.round(20*c.arrest/1.2);ctx.fillStyle='#000';ctx.fillRect(pBody.x-11,pBody.y+10,22,4);ctx.fillStyle='#3a7bff';ctx.fillRect(pBody.x-10,pBody.y+11,w,2);txt('ARRESTO',pBody.x,pBody.y+16,'#9fd4ff',1,'center');}}
  for(const s of shops){if(!vis(s.x,s.y))continue;const d=pAvail?dist(s.x,s.y,pBody.x,pBody.y):1e9;
    if(s.anger>0){for(let i=0;i<s.anger;i++){ctx.fillStyle='#ff4d6d';ctx.fillRect(s.x-s.anger*2+i*4,s.y+6,3,2);}}
    if(d<90||SHOP_T[s.type].sp&&d<220){const T2=SHOP_T[s.type];txt(s.name,s.x,s.y-22,T2.c,1,'center');
      let h=shopHint(s,team[active]);if(mission&&mission.carrier<0&&s.i===mission.from)h='E: PRENDI IL PACCO ('+mission.pay+'$)';else if(mission&&mission.carrier===active&&s.i===mission.to)h='E: CONSEGNA IL PACCO';if(d<24&&h)txt(h,s.x,s.y-13,'#ffffff',1,'center');if(s.anger>0&&d<24)txt('RABBIA '+s.anger,s.x,s.y+10,'#ff4d6d',1,'center');}}
  if(playing){const p=team[active];
    if(p.inCar){drawSpr(p.sprE,p.x,p.y,p.a);}
    else if(p.onFoot){drawSpr(p.sprE,p.x,p.y,p.a);drawPerson(p.fx,p.fy,p.fa,shade(p.ui,-.2),p.skin,p.hair,p.punchT,p.walk,p.sex==='DONNA');
      if(dist(p.fx,p.fy,p.x,p.y)<26&&Math.floor(T*3)%2)txt('Z: SALI',p.x,p.y-18,'#ffffff',1,'center');}
    else drawSpr(p.nyx?nyxSpr:p.spr,p.x,p.y,p.a);
    const pb=body(p);if(mission&&mission.carrier===p.i){ctx.fillStyle='#8a5a2a';ctx.fillRect(Math.round(pb.x)+4,Math.round(pb.y)+3,5,4);ctx.fillStyle='#ffe03c';ctx.fillRect(Math.round(pb.x)+6,Math.round(pb.y)+3,1,4);}
    if(Math.floor(T*4)%2===0){ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(pb.x)-1,Math.round(pb.y)-11,3,1);ctx.fillRect(Math.round(pb.x),Math.round(pb.y)-10,1,1);}
    if(p.walkPath){ctx.fillStyle='rgba(255,255,255,.35)';const q=p.walkPath[p.walkPath.length-1];ctx.fillRect(Math.round(q.x)-1,Math.round(q.y)-14,3,3);}}
  for(const f of fx){const k=f.t/f.dur;const o=f.own?body(f.own):f;
    if(f.k==='swords'){ctx.fillStyle=f.c;for(let s=0;s<2;s++){const a=f.a+k*6.283+s*Math.PI;for(let r2=6;r2<f.r;r2+=1.5)ctx.fillRect(Math.round(o.x+Math.cos(a)*r2),Math.round(o.y+Math.sin(a)*r2),1,1);
        ctx.globalAlpha=.5;for(let t=1;t<6;t++){const a2=a-t*.18;ctx.fillRect(Math.round(o.x+Math.cos(a2)*f.r),Math.round(o.y+Math.sin(a2)*f.r),1,1);}ctx.globalAlpha=1;}}
    else if(f.k==='whip'){ctx.fillStyle=f.c;const base=f.a+k*6.283;for(let i=0;i<40;i++){const t=i/40;const a=base-t*1.2;const rad=6+(f.r-6)*Math.min(1,t*1.6)*(.6+.4*Math.sin(k*Math.PI));
        ctx.fillRect(Math.round(o.x+Math.cos(a)*rad),Math.round(o.y+Math.sin(a)*rad),t<.5?2:1,1);}}}
  for(const b of bullets){ctx.fillStyle=b.c;ctx.fillRect(Math.round(b.x)-1,Math.round(b.y)-1,2,2);const l=Math.hypot(b.vx,b.vy);ctx.globalAlpha=.5;ctx.fillRect(Math.round(b.x-b.vx/l*4),Math.round(b.y-b.vy/l*4),1,1);ctx.globalAlpha=1;}
  for(const q of parts){ctx.globalAlpha=Math.min(1,q.life*3);ctx.fillStyle=q.c;ctx.fillRect(Math.round(q.x),Math.round(q.y),q.sz,q.sz);}ctx.globalAlpha=1;
  // glow pass
  ctx.globalCompositeOperation='lighter';ctx.imageSmoothingEnabled=true;
  const hl=(b)=>{if(!vis(b.x,b.y))return;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.globalAlpha=.22;ctx.drawImage(cone,8,-24);ctx.restore();ctx.globalAlpha=1;};
  for(const l of lamps){if(l.x<X0||l.x>X1||l.y<Y0||l.y>Y1)continue;glow(l.x,l.y,46,l.c,.2);}
  for(let i=0;i<neons.length;i++){const n=neons[i];if(n.x<X0||n.x>X1||n.y<Y0||n.y>Y1)continue;let a=.32+.06*Math.sin(T*2+n.ph);if(n.fl&&Math.sin(T*23+n.ph*7)>.55)a*=.15;
    glow(n.x+n.w/2,n.y+n.h/2,Math.max(n.w,n.h)*.8+12,n.c,a);}
  for(const s of shops)if(s.type==='church'&&vis(s.x,s.y)){const L=s.L;glow((L.x+L.w/2)*CELL,(L.y+L.h/2)*CELL,46,'#7a2bff',.22+.06*Math.sin(T*1.5));}
  if(amb&&vis(amb.x,amb.y)){const on=Math.floor(T*8)%2;glow(amb.x,amb.y,22,on?'#ff2b4a':'#ffffff',.6);hl(amb);}
  for(const s of shops)if(vis(s.x,s.y))glow(s.x,s.y,SHOP_T[s.type].sp?52:34,SHOP_T[s.type].c,.3+.05*Math.sin(T*3+s.i));
  if(vis(garage.cx,garage.cy))glow(garage.cx,garage.cy,110,'#ff3df2',.16+.05*Math.sin(T*2));
  for(const b of team){if(b.status==='returning'||(b.status==='active'&&playing&&!b.onFoot))hl(b);}
  for(const e of enemies){if(!e.onFoot){hl(e);glow(e.x,e.y,14,ACID,.18);}}
  for(const c of police){if(!vis(c.x,c.y))continue;if(c.mode==='cops'||c.mode==='driven')hl(c);if(c.mode!=='cops'&&c.mode!=='driven')continue;
    const on=Math.floor(T*6)%2;const rx=c.x+Math.cos(c.a+Math.PI/2)*3,ry=c.y+Math.sin(c.a+Math.PI/2)*3,bx=c.x-Math.cos(c.a+Math.PI/2)*3,by=c.y-Math.sin(c.a+Math.PI/2)*3;
    const big=c.state==='chase'||c.mode==='driven';glow(rx,ry,big?26:16,'#ff2b4a',on?.7:.15);glow(bx,by,big?26:16,'#2b6bff',on?.15:.7);}
  for(const b of bullets)glow(b.x,b.y,8,b.c,.6);
  for(const f of fx){if(f.k==='flash')glow(f.x,f.y,f.r*(1-f.t/f.dur*.5),f.c,(1-f.t/f.dur)*.9);else{const o=f.own?body(f.own):f;glow(o.x,o.y,f.r+8,f.c,.25*(1-f.t/f.dur));}}
  if(playing){const p=team[active],pb=body(p);if(p.nyx){glow(pb.x,pb.y,NYX_R,'#7a2bff',.10);glow(pb.x,pb.y,26,'#ff3df2',.35+.15*Math.sin(T*5));}if(p.nitroT>0)glow(p.x,p.y,22,'#3cf2ff',.35);if(p.shield&&!p.inCar)glow(pb.x,pb.y,18,'#9fd4ff',p.shieldT===null?.12:.22+.08*Math.sin(T*8));}
  ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=false;
  for(const q of pops){ctx.globalAlpha=Math.min(1,q.life*2);txt(q.t,q.x,q.y,q.c,1,'center');}ctx.globalAlpha=1;
  ctx.restore();
  drawRain(dt);
}
