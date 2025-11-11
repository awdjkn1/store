#!/usr/bin/env node
// convert-inline-px-to-rem.js
// Aggressively convert px -> rem inside JS/JSX/TS/TSX files under src
// - Creates .bak backups
// - Replaces numeric px occurrences globally
// - Adds header comment marking file as converted

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile() && EXTENSIONS.includes(path.extname(full))) results.push(full);
  }
  return results;
}

function pxToRemReplacement(match, p1) {
  if (!p1) return match;
  if (p1 === '0') return '0';
  const num = parseFloat(p1);
  const rem = (num / 16);
  const s = rem.toFixed(4).replace(/\.?(?:0+)$/, '');
  return s + 'rem';
}

function processFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('CONVERTED inline px→rem by')) {
    console.log('[skip] already converted:', file);
    return { file, changed: false };
  }

  let out = content;
  // Bold, aggressive global replacement of Npx -> N/16 rem
  out = out.replace(/(\d*\.?\d+)px\b/g, pxToRemReplacement);

  // Prepend a header comment (JS comment style)
  const header = `/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on ${new Date().toISOString()} */\n`;
  out = header + out;

  fs.writeFileSync(file + '.bak', content, 'utf8');
  fs.writeFileSync(file, out, 'utf8');
  console.log('[modified]', file);
  return { file, changed: true };
}

function main() {
  console.log('Scanning for JS/TS files under', SRC_DIR);
  if (!fs.existsSync(SRC_DIR)) {
    console.error('Directory not found:', SRC_DIR);
    process.exit(1);
  }
  const files = walk(SRC_DIR);
  console.log('Found', files.length, 'files to consider');
  let changedCount = 0;
  for (const f of files) {
    try {
      const r = processFile(f);
      if (r.changed) changedCount++;
    } catch (err) {
      console.error('Error processing', f, err.message);
    }
  }
  console.log(`Done. Modified ${changedCount} file(s). Backups have .bak suffix.`);
}

main();
