const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

// Fallback image paths to check (for background image)
const BG_FALLBACKS = [
  path.join(ROOT, 'assets', 'bg-cabin.png'),
  path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain',
    '5485cb57-1444-445a-a68e-c9efbb1ae8da', 'cabin_no_rain_1779615655514.png'),
  path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain',
    '5485cb57-1444-445a-a68e-c9efbb1ae8da', 'media__1779615072686.png'),
  path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain',
    '5485cb57-1444-445a-a68e-c9efbb1ae8da', 'rainy_cabins_dark_1779615179446.png'),
  path.join(process.env.USERPROFILE || '', '.gemini', 'antigravity', 'brain',
    '5485cb57-1444-445a-a68e-c9efbb1ae8da', 'rainy_cabin_background_1779612524998.png'),
];

// On startup, copy the background image to assets if it doesn't exist
function setupAssets() {
  const assetsDir = path.join(ROOT, 'assets');
  const targetBg = path.join(assetsDir, 'bg-cabin.png');

  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  if (!fs.existsSync(targetBg)) {
    for (const fallback of BG_FALLBACKS) {
      if (fallback !== targetBg && fs.existsSync(fallback)) {
        fs.copyFileSync(fallback, targetBg);
        console.log(`  Background image copied from: ${fallback}`);
        return;
      }
    }
    console.log('  Warning: No background image found. The app will use CSS gradient fallback.');
  } else {
    console.log('  Background image: OK');
  }
}

// Also setup fonts directory
function setupFonts() {
  const fontsDir = path.join(ROOT, 'fonts');
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads');
  const zips = [
    { zip: 'hackensack.zip', name: 'hackensack' },
    { zip: 'honfleur.zip', name: 'honfleur' },
    { zip: 'gohan_2.zip', name: 'gohan' },
  ];

  const fontFiles = fs.readdirSync(fontsDir);
  if (fontFiles.filter(f => f.endsWith('.ttf') || f.endsWith('.otf')).length > 0) {
    console.log(`  Fonts: OK (${fontFiles.length} files)`);
  } else {
    console.log('  Fonts: Using Google Fonts fallback (download from dafont.com for custom fonts)');
  }
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  // Special handling for background image — check fallback locations
  if (urlPath === '/assets/bg-cabin.png') {
    for (const fallback of BG_FALLBACKS) {
      if (fs.existsSync(fallback)) {
        const data = fs.readFileSync(fallback);
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'max-age=86400' });
        res.end(data);
        return;
      }
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

console.log('');
console.log('  🍅 Promodoro — Aesthetic Study Timer');
console.log('  ════════════════════════════════════');
setupAssets();
setupFonts();

server.listen(PORT, () => {
  console.log('');
  console.log(`  ✨ Server running at http://localhost:${PORT}`);
  console.log('  Press Ctrl+C to stop');
  console.log('');
});
