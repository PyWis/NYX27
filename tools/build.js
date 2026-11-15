// Unisce index.html + js/*.js in un unico file giocabile offline: NYX.html
// Uso: node tools/build.js
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script src="(js\/[\w-]+\.js)"><\/script>/g,(m,f)=>{
  const code=fs.readFileSync(path.join(root,f),'utf8').replace(/<\/script/gi,'<\\/script');
  return '<script>\n// ===== '+f+' =====\n'+code+'\n</script>';});
fs.writeFileSync(path.join(root,'NYX.html'),html);
console.log('NYX.html scritto ('+Math.round(html.length/1024)+' KB)');
