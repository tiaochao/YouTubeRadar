const fs = require('fs');
const path = require('path');

console.log('Copying files for standalone build...');

// Helper function to copy directory recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy static files
const staticSrc = '.next/static';
const staticDest = '.next/standalone/.next/static';
if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
  console.log('Copying static files...');
  copyRecursiveSync(staticSrc, staticDest);
}

// Copy public files
const publicSrc = 'public';
const publicDest = '.next/standalone/public';
if (fs.existsSync(publicSrc)) {
  console.log('Copying public files...');
  copyRecursiveSync(publicSrc, publicDest);
}

// Copy env file
if (fs.existsSync('.env.local')) {
  console.log('Copying environment file...');
  fs.copyFileSync('.env.local', '.next/standalone/.env.local');
}

console.log('File copying complete!');