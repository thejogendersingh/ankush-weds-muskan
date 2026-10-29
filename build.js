const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TARGET_DIRS = ['public', 'dist'];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const target of TARGET_DIRS) {
  const targetDir = path.join(ROOT, target);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  copyRecursive(path.join(ROOT, 'index.html'), path.join(targetDir, 'index.html'));
  copyRecursive(path.join(ROOT, 'favicon.ico'), path.join(targetDir, 'favicon.ico'));
  copyRecursive(path.join(ROOT, 'assets'), path.join(targetDir, 'assets'));
  console.log(`Synced static assets to ${target}/`);
}

console.log('Build complete: Root, public, and dist all have complete site files.');
