'use strict';
// =====================================================================
//  NEW YORK XENO (NYX) — post-cyberpunk top-down bike brawler, 199X style
// =====================================================================
const cv=document.getElementById('c'), ctx=cv.getContext('2d');
ctx.imageSmoothingEnabled=false;
const VW=640,VH=360,CELL=16,MW=480,MH=480,RW=3,BASE=90,BL=16;
const WPX=MW*CELL, HPX=MH*CELL;
const BAT_MAX=180;
function fit(){const s=Math.min(innerWidth/VW,innerHeight/VH);const k=s>=1?Math.floor(s):s;const w=VW*k,h=VH*k;
  cv.style.width=w+'px';cv.style.height=h+'px';const wr=document.getElementById('wrap');wr.style.width=w+'px';wr.style.height=h+'px';}
addEventListener('resize',fit);fit();

// ---------- utils ----------
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let rng=mulberry(1);
const rr=()=>rng(), ri=(a,b)=>a+Math.floor(rng()*(b-a+1));
const pickR=(r,a)=>a[Math.floor(r()*a.length)];
const R=Math.random;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b,c,d)=>Math.hypot(c-a,d-b);
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function hx(h){h=h.replace('#','');return[parseInt(h.substr(0,2),16),parseInt(h.substr(2,2),16),parseInt(h.substr(4,2),16)];}
function shade(h,f){const c=hx(h).map(v=>f>=0?v+(255-v)*f:v*(1+f));return'#'+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');}
function hash(n){n=Math.imul(n^61^(n>>>16),9);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return(n>>>0)/4294967296;}
function pc(g,cx,cy,r,col){g.fillStyle=col;for(let dy=-r;dy<=r;dy++){const w=Math.floor(Math.sqrt(r*r-dy*dy));g.fillRect(cx-w,cy+dy,2*w+1,1);}}
const fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

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
']':'01110 00010 00010 00010 00010 00010 01110','_':'00000 00000 00000 00000 00000 00000 11111','|':'00100 00100 00100 00100 00100 00100 00100','$':'00100 01111 10100 01110 00101 11110 00100'
};
const GL={};for(const k in FONT_SRC)GL[k]=FONT_SRC[k].split(' ').map(r=>parseInt(r,2));
const norm=s=>String(s).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function glyphs(g,s,x,y,sc,col){g.fillStyle=col;for(let i=0;i<s.length;i++){const gl=GL[s[i]]||GL[' '];for(let r=0;r<7;r++){const row=gl[r];if(!row)continue;for(let j=0;j<5;j++)if(row&(1<<(4-j)))g.fillRect(x+(i*6+j)*sc,y+r*sc,sc,sc);}}}
const tcache=new Map();
function textW(s,sc){return norm(s).length*6*sc-sc;}
function txt(s,x,y,col='#fff',sc=1,align='left',shadow='#000'){
  s=norm(s);const key=s+'|'+col+'|'+sc+'|'+shadow;let c=tcache.get(key);
  if(!c){c=mk(Math.max(1,s.length*6*sc),8*sc);const g=c.getContext('2d');if(shadow)glyphs(g,s,sc,sc,sc,shadow);glyphs(g,s,0,0,sc,col);tcache.set(key,c);if(tcache.size>700)tcache.delete(tcache.keys().next().value);}
  let dx=x;if(align==='center')dx=x-(c.width>>1);else if(align==='right')dx=x-c.width;ctx.drawImage(c,Math.round(dx),Math.round(y));
}
