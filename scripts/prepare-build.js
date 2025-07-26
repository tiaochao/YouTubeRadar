const fs = require('fs');
const path = require('path');

console.log('Preparing build environment...');

// Create necessary directories
const dirs = [
  'build',
  'build/icons',
  '.next/standalone/.next',
  '.next/standalone/public'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Check for icon files
const iconPath = path.join('build', 'icon.ico');
const pngPath = path.join('build', 'icon.png');

if (!fs.existsSync(iconPath) && fs.existsSync(pngPath)) {
  console.log('WARNING: icon.ico not found, using PNG as fallback');
  // On Windows, you'll need to convert PNG to ICO
  // This is just a placeholder
  try {
    fs.copyFileSync(pngPath, iconPath);
  } catch (err) {
    console.error('Failed to copy icon:', err.message);
  }
}

console.log('Build preparation complete!');