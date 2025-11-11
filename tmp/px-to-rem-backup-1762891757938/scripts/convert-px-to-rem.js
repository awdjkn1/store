#!/usr/bin/env node
// convert-px-to-rem.js
// Bulk-convert px -> rem for CSS files in the store repo.
// - Creates a .bak backup of each modified file
// - Replaces occurrences of Npx with (N/16)rem (keeps 0px -> 0)
// - Inserts a header comment marking the file as converted
// - Adds REVIEW comments before any @media (max-width: Npx) occurrences

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSS_GLOB_DIR = path.join(ROOT, 'src'); // start scanning from src (conservative)

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    // skip node_modules and .git
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.css')) results.push(full);
  }
  return results;
}

function pxToRem(match, p1) {
  if (!p1) return match;
  if (p1 === '0') return '0';
  const num = parseFloat(p1);
  const rem = (num / 16);
  // keep up to 4 decimal places, trim trailing zeros
  const s = rem.toFixed(4).replace(/\.?(?:0+)$/, '');
  return s + 'rem';
}

function processFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('CONVERTED px→rem by')) {
    console.log('[skip] already converted:', file);
    return { file, changed: false };
  }

  let out = content;

  // Annotate media queries that use max-width for later manual mobile-first conversion
  out = out.replace(/@media\s*\(\s*max-width:\s*(\d+)px\s*\)/g, function (m, n) {
    return `/* REVIEW-MOBILE-FIRST: original ${m} - please verify and lift mobile rules into defaults if appropriate */\n@media (max-width: ${n}px)`;
  });

  // Convert px -> rem globally. This is aggressive; we convert all numeric px occurrences.
  // We intentionally convert transforms and shadows too per the "aggressive" directive.
  out = out.replace(/(\d*\.?\d+)px\b/g, pxToRem);

  // Prepend header comment
  const header = `/* CONVERTED px→rem by scripts/convert-px-to-rem.js on ${new Date().toISOString()} */\n`;
  out = header + out;

  // Backup original
  fs.writeFileSync(file + '.bak', content, 'utf8');
  fs.writeFileSync(file, out, 'utf8');
  console.log('[modified]', file);
  return { file, changed: true };
}

function main() {
  console.log('Scanning for CSS files under', CSS_GLOB_DIR);
  if (!fs.existsSync(CSS_GLOB_DIR)) {
    console.error('Directory not found:', CSS_GLOB_DIR);
    process.exit(1);
  }
  const files = walk(CSS_GLOB_DIR);
  console.log('Found', files.length, 'css files to consider');
  const changed = [];
  for (const f of files) {
    try {
      const r = processFile(f);
      if (r.changed) changed.push(f);
    } catch (err) {
      console.error('Error processing', f, err.message);
    }
  }
  console.log(`Done. Modified ${changed.length} file(s). Backups have .bak suffix.`);
}

main();
