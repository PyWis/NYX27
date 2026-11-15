'use strict';
// ---------- roster ----------
const ROSTER=[
 {name:'Zephyr',sex:'UOMO',color:'#e8384f',wpn:{k:'gun',cd:.6,dmg:10,spd:3*BASE,rng:20*BL,label:'PISTOLA'},punch:{dmg:2,cd:.4},spd:1,skin:'#c68a5e',hair:'#1b1b1f',visor:'#ffe03c'},
 {name:'Atlas',sex:'UOMO',color:'#3fd46b',wpn:{k:'melee',cd:.3,dmg:3,rad:26,style:'swords',label:'DOPPIA SPADA'},punch:{dmg:2,cd:.4},spd:1,skin:'#8d5a3b',hair:'#0e0e10',visor:'#3cf2ff'},
 {name:'Caspian',sex:'UOMO',color:'#f2f2f2',wpn:null,punch:{dmg:3,cd:.4},spd:2,skin:'#f0c8a0',hair:'#dfe3f0',visor:'#ff3df2'},
 {name:'Vesper',sex:'DONNA',color:'#3a7bff',wpn:{k:'gun',cd:.3,dmg:8,spd:5*BASE,rng:10*BL,label:'PISTOLA RAPIDA'},punch:{dmg:2,cd:.4},spd:1,skin:'#e0b090',hair:'#2b4bd8',visor:'#3cf2ff'},
 {name:'Indigo',sex:'DONNA',color:'#16121f',rim:'#8a6bff',wpn:{k:'melee',cd:.5,dmg:4,rad:44,style:'whip',label:'FRUSTA'},punch:{dmg:2,cd:.4},spd:1,skin:'#a8704a',hair:'#3b1f6b',visor:'#b48cff'},
 {name:'Nova',sex:'DONNA',color:'#ff6ec7',wpn:null,punch:{dmg:1,cd:.3},spd:1,skin:'#f2c6a8',hair:'#ff4fb0',visor:'#ffe03c'},
 // spada laser: tieni premuto l'attacco, la moto si ferma e carica 1 secondo -> colpo mortale tutto intorno
 {name:'Akira',sex:'UOMO',color:'#ff8a1f',wpn:{k:'laser',cd:.6,dmg:999,rad:36,chg:1,label:'SPADA LASER'},punch:{dmg:2,cd:.4},spd:1,skin:'#e8c09a',hair:'#141018',visor:'#ff3d3d',band:'#ff3d3d'},
 // scudo laser: in moto ogni colpo toglie solo 1 di vita - rapina furtiva 70% senza conseguenze
 {name:'Melanie',sex:'DONNA',color:'#ffd21f',wpn:null,punch:{dmg:2,cd:.4},spd:1.5,skin:'#f0c8a0',hair:'#d9452b',visor:'#3cf2ff',laserShield:true,stealth:.7},
];
ROSTER.forEach(r=>r.ui=r.rim||r.color);
const NB=ROSTER.length;          // numero di biker
const LEADERS=[0,3];             // Zephyr e Vesper
const AKIRA=6,MELANIE=7;
const isLeader=i=>LEADERS.includes(i);
const ENEMY_LASER_DMG=35;        // gli Xeno con la spada laser non uccidono in un colpo
const NEON=['#ff3df2','#3cf2ff','#ffe03c','#ff4d6d','#7dff6a','#a66bff'];
const ACID='#c6ff3a';
// ---------- shops: 5 farmacie, 5 meccanici, 20 negozi + 6 edifici speciali ----------
const SHOP_T={pharm:{c:'#5cff7a',name:'FARMACIA',icon:['0011100','0011100','1111111','1111111','1111111','0011100','0011100']},
  mech:{c:'#ffb03c',name:'MECCANICO',icon:['0001110','0011100','0111000','1111110','0001100','0011000','0110000']},
  shop:{c:'#ffe03c',name:'NEGOZIO',icon:['0010000','0111100','1010000','0111000','0010100','1111000','0010000']},
  church:{c:'#e6e0ff',name:'CHIESA',sp:1,icon:['0001000','0001000','0111110','0001000','0001000','0001000','0001000']},
  cop:{c:'#3a7bff',name:'COMMISSARIATO',sp:1,icon:['0001000','0011100','1111111','0111110','0011100','0110110','1100011']},
  nasa:{c:'#9fd4ff',name:'CENTRO NASA',sp:1,icon:['0011100','0100010','1111111','1000001','1111111','0100010','0011100']},
  hosp:{c:'#ff4d6d',name:'OSPEDALE',sp:1,icon:['1100011','1100011','1111111','1111111','1100011','1100011','1100011']},
  bikes:{c:'#ff6ec7',name:'NEGOZIO MOTO',sp:1,icon:['0111110','1000001','1011101','1010101','1011101','1000001','0111110']},
  bank:{c:'#ffd27a',name:'BANCA',sp:1,icon:['0001000','0011100','1111111','0101010','0101010','0101010','1111111']},
  alien:{c:'#c6ff3a',name:'CENTRO ALIENI',sp:1,icon:['0111110','1111111','1001001','1111111','0111110','0010100','0110110']},
  guns:{c:'#d0d0dc',name:'ARMERIA',sp:1,icon:['0000000','1111111','1111111','0011010','0011000','0010000','0000000']}};
const SPECIALS=['church','cop','nasa','hosp','bikes','guns','alien','bank'];
const SHOP_NAMES=['BODEGA 24','SYNTH MART','NEON DELI','KOMBINI 9','RAMEN STOP','CHIP SHOP','VOLT MARKET','DROID DINER','PIXEL GROCER','ZERO BAR',
  'MEGA BAZAAR','NOODLE BOX','PAWN 2099','CYBER CAFE','LOTUS STORE','DOLLAR 99','NIGHT OWL','RETRO VIDEO','GHOST MARKET','SODA LAB'];
let shops=[];
