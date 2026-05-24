const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const downloadsDir = path.join(process.env.USERPROFILE, 'Downloads');
const fontsDir = path.join(__dirname, 'fonts');

// Ensure fonts dir exists
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

// Extract zip files
const zips = ['hackensack.zip', 'honfleur.zip', 'gohan_2.zip'];
zips.forEach(zipName => {
  const zipPath = path.join(downloadsDir, zipName);
  if (fs.existsSync(zipPath)) {
    console.log(`Extracting ${zipName}...`);
    try {
      execSync(`tar -xf "${zipPath}" -C "${fontsDir}"`, { stdio: 'inherit' });
      console.log(`  Done: ${zipName}`);
    } catch (e) {
      console.error(`  Error extracting ${zipName}:`, e.message);
    }
  } else {
    console.log(`Not found: ${zipPath}`);
  }
});

// List fonts directory
console.log('\nFonts directory contents:');
if (fs.existsSync(fontsDir)) {
  const files = fs.readdirSync(fontsDir, { recursive: true });
  files.forEach(f => console.log(`  ${f}`));
}

// Also copy the background image
const bgSrc = 'C:\\Users\\varsh\\.gemini\\antigravity\\brain\\5485cb57-1444-445a-a68e-c9efbb1ae8da\\rainy_cabin_background_1779612524998.png';
const bgDst = path.join(__dirname, 'assets', 'bg-cabin.png');
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
if (fs.existsSync(bgSrc)) {
  fs.copyFileSync(bgSrc, bgDst);
  console.log('\nBackground image copied to assets/bg-cabin.png');
} else {
  console.log('\nBackground source not found:', bgSrc);
}
