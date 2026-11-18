// Unisce index.html + js/*.js in un unico file giocabile offline: NYX.html
// Uso: node tools/build.js
const fs = require('fs'),
  path = require('path');
const root = path.join(__dirname, '..');
function bundle() {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  return html.replace(/<script src="(js\/[\w-]+\.js)"><\/script>/g, (m, f) => {
    const code = fs.readFileSync(path.join(root, f), 'utf8').replace(/<\/script/gi, '<\\/script');
    return '<script>\n// ===== ' + f + ' =====\n' + code + '\n</script>';
  });
}
module.exports = { bundle };
if (require.main === module) {
  const html = bundle();
  fs.writeFileSync(path.join(root, 'NYX.html'), html);
  console.log('NYX.html scritto (' + Math.round(html.length / 1024) + ' KB)');
}
