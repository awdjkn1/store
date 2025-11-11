#!/usr/bin/env node
// Aggressive px -> rem conversion script
// - Backs up files to ./tmp/px-to-rem-backup-<ts>
// - Annotates @media(max-width: Npx) with a REVIEW comment (keeps the original)
// - Converts numeric px occurrences to rem (divide by 16)
// WARNING: This is aggressive — inspect backups and run visual QA.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'tmp', `px-to-rem-backup-${Date.now()}`);
const EXTENSIONS = ['.css', '.scss', '.less', '.js', '.jsx', '.ts', '.tsx', '.html'];

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      // skip node_modules and .git and tmp backups
      if (['node_modules', '.git', 'tmp'].includes(f)) return;
      walk(p, filelist);
    } else {
      if (EXTENSIONS.includes(path.extname(f).toLowerCase())) filelist.push(p);
    }
  });
  return filelist;
}

function backupFile(src, destDir) {
  const rel = path.relative(ROOT, src);
  const dest = path.join(destDir, rel);
  const destFolder = path.dirname(dest);
  fs.mkdirSync(destFolder, { recursive: true });
  fs.copyFileSync(src, dest);
}

function pxToRem(n) {
  const val = Number(n);
  if (isNaN(val)) return n + 'px';
  const rem = +(val / 16).toFixed(4);
  // trim trailing zeros
  return (rem % 1 === 0 ? String(rem) : String(rem).replace(/(?:\.0+|0+$)/, '')) + 'rem';
}

function processFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Annotate @media(max-width: Npx) lines for review (prepend a comment keeping the original)
  content = content.replace(/@media\s*\(\s*max-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)/gi, (m) => {
    return `/* REVIEW: ORIGINAL_MEDIA_QUERY: ${m} - consider mobile-first rewrite */\n${m}`;
  });

  // Convert px -> rem across file
  // NOTE: This is blunt and will convert most occurrences. It's intentional for an aggressive sweep.
  content = content.replace(/(\d+(?:\.\d+)?)px\b/g, (m, p1) => pxToRem(p1));

  if (content !== original) {
    return { changed: true, content, original };
  }
  return { changed: false };
}

function main() {
  console.log('Starting px->rem aggressive conversion');
  console.log('Root:', ROOT);
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const files = walk(ROOT);
  console.log('Files examined:', files.length);

  let converted = 0;
  let touchedFiles = [];

  files.forEach(file => {
    try {
      const res = processFile(file);
      if (res.changed) {
        // backup original
        backupFile(file, BACKUP_DIR);
        // write new file
        fs.writeFileSync(file, res.content, 'utf8');
        converted++;
        touchedFiles.push(file);
        console.log('Converted:', file);
      }
    } catch (err) {
      console.error('Error processing', file, err.message);
    }
  });

  console.log('\nDone. Converted files:', converted);
  console.log('Backup location:', BACKUP_DIR);
  if (touchedFiles.length) {
    console.log('\nFiles changed (sample up to 50):');
    touchedFiles.slice(0, 50).forEach(f => console.log(' -', path.relative(ROOT, f)));
  }
  process.exit(0);
}

main();
