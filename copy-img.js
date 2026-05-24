const fs = require('fs');
const path = require('path');

const src = path.join(process.env.USERPROFILE, '.gemini', 'antigravity', 'brain', '5485cb57-1444-445a-a68e-c9efbb1ae8da', 'cabin_no_rain_1779615655514.png');
const dest = path.join(__dirname, 'assets', 'bg-cabin.png');

if (!fs.existsSync(path.join(__dirname, 'assets'))) {
  fs.mkdirSync(path.join(__dirname, 'assets'));
}

try {
  fs.copyFileSync(src, dest);
  console.log('✅ Background image successfully copied to assets/bg-cabin.png!');
} catch (e) {
  console.error('❌ Failed to copy image:', e.message);
}
