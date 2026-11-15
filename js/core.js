'use strict';
// =====================================================================
//  NEW YORK XENO (NYX) — post-cyberpunk top-down bike brawler, 199X style
// =====================================================================
const cv=document.getElementById('c'), ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const VW=640,VH=360,CELL=16,MW=480,MH=480,RW=3,BASE=90,BL=16;
const WPX=MW*CELL, HPX=MH*CELL;
const BAT_MAX=180;
let viewScale=1;
function fit(){const s=Math.min(innerWidth/VW,innerHeight/VH);const k=s>=1?Math.floor(s):s;viewScale=k;const w=VW*k,h=VH*k;
  cv.style.width=w+'px';cv.style.height=h+'px';const wr=document.getElementById('wrap');wr.style.width=w+'px';wr.style.height=h+'px';
  // passo delle scanline legato alla scala: niente moire
  const crt=document.getElementById('crt');if(crt){const p=Math.max(2,Math.round(k*1.5));
    crt.style.background='repeating-linear-gradient(to bottom,rgba(0,0,0,.20) 0,rgba(0,0,0,.20) '+Math.max(1,Math.round(k/2))+'px,transparent '+Math.max(1,Math.round(k/2))+'px,transparent '+p+'px),radial-gradient(ellipse at center,transparent 62%,rgba(0,0,0,.6) 100%)';}}
addEventListener('resize',fit);fit();

// ---------- utils ----------
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let rng=mulberry(1);
const rr=()=>rng(), ri=(a,b)=>a+Math.floor(rng()*(b-a+1));
const pickR=(r,a)=>a[Math.floor(r()*a.length)];
const R=Math.random;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const dist=(a,b,c,d)=>Math.hypot(c-a,d-b);
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function hx(h){h=h.replace('#','');return[parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function shade(h,f){const c=hx(h).map(v=>f>=0?v+(255-v)*f:v*(1+f));return'#'+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');}
function hash(n){n=Math.imul(n^61^(n>>>16),9);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return(n>>>0)/4294967296;}
function pc(g,cx,cy,r,col){g.fillStyle=col;for(let dy=-r;dy<=r;dy++){const w=Math.floor(Math.sqrt(r*r-dy*dy));g.fillRect(cx-w,cy+dy,2*w+1,1);}}
const fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
// compatta un array sul posto (niente nuove allocazioni ogni frame)
function compact(a,keep){let j=0;for(let i=0;i<a.length;i++){const v=a[i];if(keep(v))a[j++]=v;}a.length=j;return a;}
// lampeggio: con "riduci lampeggi" attivo resta sempre acceso
let T=0;
const blink=n=>(typeof SET!=='undefined'&&SET.lowFlash)?1:Math.floor(T*n)%2;

// ---------- bitmap font 5x7 ----------
const FONT_SRC={
A:'01110 10001 10001 11111 10001 10001 10001',B:'11110 10001 10001 11110 10001 10001 11110',C:'01110 10001 10000 10000 10000 10001 01110',
D:'11110 10001 10001 10001 10001 10001 11110',E:'11111 10000 10000 11110 10000 10000 11111',F:'11111 10000 10000 11110 10000 10000 10000',
G:'01110 10001 10000 10111 10001 10001 01111',H:'10001 10001 10001 11111 10001 10001 10001',I:'01110 00100 00100 00100 00100 00100 01110',
J:'00111 00010 00010 00010 00010 10010 01100',K:'10001 10010 10100 11000 10100 10010 10001',L:'10000 10000 10000 10000 10000 10000 11111',
M:'10001 11011 10101 10101 10001 10001 10001',N:'10001 10001 11001 10101 10011 10001 10001',O:'01110 10001 10001 10001 10001 10001 01110',
P:'11110 10001 10001 11110 10000 10000 10000',Q:'01110 10001 10001 10001 10101 10010 01101',R:'11110 10001 10001 11110 10100 10010 10001',
S:'01111 10000 10000 01110 00001 00001 11110',T:'11111 00100 00100 00100 00100 00100 00100',U:'10001 10001 10001 10001 10001 10001 01110',
V:'10001 10001 10001 10001 10001 01010 00100',W:'10001 10001 10001 10101 10101 10101 01010',X:'10001 10001 01010 00100 01010 10001 10001',
Y:'10001 10001 10001 01010 00100 00100 00100',Z:'11111 00001 00010 00100 01000 10000 11111',
'0':'01110 10001 10011 10101 11001 10001 01110','1':'00100 01100 00100 00100 00100 00100 01110','2':'01110 10001 00001 00010 00100 01000 11111',
'3':'11111 00010 00100 00010 00001 10001 01110','4':'00010 00110 01010 10010 11111 00010 00010','5':'11111 10000 11110 00001 00001 10001 01110',
'6':'00110 01000 10000 11110 10001 10001 01110','7':'11111 00001 00010 00100 01000 01000 01000','8':'01110 10001 10001 01110 10001 10001 01110',
'9':'01110 10001 10001 01111 00001 00010 01100',' ':'00000 00000 00000 00000 00000 00000 00000',
'.':'00000 00000 00000 00000 00000 01100 01100',',':'00000 00000 00000 00000 01100 00100 01000',':':'00000 01100 01100 00000 01100 01100 00000',
'-':'00000 00000 00000 11111 00000 00000 00000','!':'00100 00100 00100 00100 00100 00000 00100','?':'01110 10001 00001 00010 00100 00000 00100',
'/':'00001 00010 00010 00100 01000 01000 10000',"'":'00100 00100 01000 00000 00000 00000 00000','(':'00010 00100 01000 01000 01000 00100 00010',
')':'01000 00100 00010 00010 00010 00100 01000','+':'00000 00100 00100 11111 00100 00100 00000','%':'11000 11001 00010 00100 01000 10011 00011',
'>':'01000 00100 00010 00001 00010 00100 01000','<':'00010 00100 01000 10000 01000 00100 00010','=':'00000 00000 11111 00000 11111 00000 00000',
'#':'01010 01010 11111 01010 11111 01010 01010','*':'00000 00100 10101 01110 10101 00100 00000','[':'01110 01000 01000 01000 01000 01000 01110',
']':'01110 00010 00010 00010 00010 00010 01110','_':'00000 00000 00000 00000 00000 00000 11111','|':'00100 00100 00100 00100 00100 00100 00100','$':'00100 01111 10100 01110 00101 11110 00100',
// frecce e simboli dei pulsanti PlayStation
'↑':'00100 01110 10101 00100 00100 00100 00100','↓':'00100 00100 00100 00100 10101 01110 00100',
'←':'00000 00100 01000 11111 01000 00100 00000','→':'00000 00100 00010 11111 00010 00100 00000',
'✕':'00000 10001 01010 00100 01010 10001 00000','○':'00000 01110 10001 10001 10001 01110 00000',
'□':'00000 11111 10001 10001 10001 11111 00000','△':'00000 00100 01010 01010 10001 11111 00000'
};
const GL={};for(const k in FONT_SRC)GL[k]=FONT_SRC[k].split(' ').map(r=>parseInt(r,2));
const norm=s=>String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function glyphs(g,s,x,y,sc,col){g.fillStyle=col;for(let i=0;i<s.length;i++){const gl=GL[s[i]]||GL[' '];for(let r=0;r<7;r++){const row=gl[r];if(!row)continue;for(let j=0;j<5;j++)if(row&(1<<(4-j)))g.fillRect(x+(i*6+j)*sc,y+r*sc,sc,sc);}}}
// atlante di glifi: un canvas per colore/scala/ombra con tutti i caratteri.
// Il testo dinamico (timer, soldi, distanze) non crea piu' canvas nuovi.
const GCHARS=Object.keys(FONT_SRC),GIDX={};GCHARS.forEach((c,i)=>GIDX[c]=i);
const atlases=new Map();
function atlas(col,sc,shadow){const key=col+'|'+sc+'|'+shadow;let a=atlases.get(key);if(a)return a;
  a=mk(GCHARS.length*6*sc,8*sc);const g=a.getContext('2d');
  GCHARS.forEach((ch,i)=>{if(shadow)glyphs(g,ch,i*6*sc+sc,sc,sc,shadow);glyphs(g,ch,i*6*sc,0,sc,col);});
  atlases.set(key,a);return a;}
function textW(s,sc){return norm(s).length*6*sc-sc;}
// testo ibrido: le stringhe fisse sono copiate da una cache (una sola drawImage),
// quelle con numeri (timer, soldi, distanze) sono composte dall'atlante senza allocare canvas
const tcache=new Map(),HAS_DIGIT=/\d/;
function txt(s,x,y,col='#fff',sc=1,align='left',shadow='#000'){
  s=norm(s);const cw=6*sc,w=s.length*cw;
  let dx=x;if(align==='center')dx=x-(w>>1);else if(align==='right')dx=x-w;dx=Math.round(dx);y=Math.round(y);
  if(HAS_DIGIT.test(s)){const a=atlas(col,sc,shadow);
    for(let i=0;i<s.length;i++){const k=GIDX[s[i]];if(k===undefined||s[i]===' ')continue;ctx.drawImage(a,k*cw,0,cw,8*sc,dx+i*cw,y,cw,8*sc);}return;}
  const key=s+'|'+col+'|'+sc+'|'+shadow;let c=tcache.get(key);
  if(!c){const a=atlas(col,sc,shadow);c=mk(Math.max(1,w),8*sc);const g=c.getContext('2d');
    for(let i=0;i<s.length;i++){const k=GIDX[s[i]];if(k!==undefined&&s[i]!==' ')g.drawImage(a,k*cw,0,cw,8*sc,i*cw,0,cw,8*sc);}
    tcache.set(key,c);if(tcache.size>900)tcache.delete(tcache.keys().next().value);}
  ctx.drawImage(c,dx,y);
}
// icone 7x7 per l'HUD
const ICONS={
  heart:['0110110','1111111','1111111','1111111','0111110','0011100','0001000'],
  bolt:['0001100','0011000','0110000','1111110','0001100','0011000','0110000'],
  med:['0011100','0011100','1111111','1111111','1111111','0011100','0011100'],
  shield:['1111111','1000001','1011101','1011101','0101010','0110110','0011100'],
  skull:['0111110','1111111','1001001','1111111','0111110','0101010','0000000'],
  sun:['0001000','1001001','0011100','1111111','0011100','1001001','0001000'],
  cop:['0011100','0111110','1101011','1111111','0111110','0100010','0000000'],
  cash:['0001000','0111110','1001000','0111100','0001010','1111100','0001000'],
  rain:['0111110','1111111','1111111','0000000','0100100','1001001','0010010'],
};
function icon(n,x,y,col,sc=1){const ic=ICONS[n];ctx.fillStyle=col;for(let j=0;j<7;j++)for(let i=0;i<7;i++)if(ic[j][i]==='1')ctx.fillRect(x+i*sc,y+j*sc,sc,sc);}
