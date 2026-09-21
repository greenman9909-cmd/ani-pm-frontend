const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, 'ani.pm_frontend', 'assets', 'index-DQbZxriH.js'), 'utf8');
const idx = content.indexOf('function VS(') !== -1 ? content.indexOf('function VS(') : content.indexOf('const VS=');
console.log(content.slice(idx, idx + 400));
