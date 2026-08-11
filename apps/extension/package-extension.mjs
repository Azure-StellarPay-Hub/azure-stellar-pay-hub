/**
 * Packages the Chrome extension for submission to the Chrome Web Store.
 *
 * Usage:
 *   node package-extension.mjs          → creates dist/stellar-pay-extension-0.1.0.zip
 *   node package-extension.mjs --ci     → CI mode: skips icon validation, generates placeholders
 *
 * The output ZIP is ready for upload at:
 *   https://chrome.google.com/webstore/devconsole
 */

import { execSync } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Vendored zip builder (no external dependency required)
// See: https://en.wikipedia.org/wiki/ZIP_(file_format)
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CI_MODE = process.argv.includes('--ci');

const DIST_DIR = join(__dirname, 'dist');
const MANIFEST_PATH = join(__dirname, 'manifest.json');

// Files to include in the ZIP (relative to extension root).
// Compiled JS files come from esbuild; source TS files are bundled and not listed.
const BUNDLE_FILES = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'background.js',
  'options.html',
  'options.js',
];

// ── Simple ZIP builder (store-only, no compression) ────────────────────────
function crc32(data) {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;

  for (const [name, data] of files) {
    const nameBuf = Buffer.from(name, 'utf-8');
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // general purpose bit flag (UTF-8)
    localHeader.writeUInt16LE(0, 8); // compression: store
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc-32
    localHeader.writeUInt32LE(data.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuf.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length

    chunks.push(localHeader, nameBuf, data);

    const cdEntry = Buffer.alloc(46);
    cdEntry.writeUInt32LE(0x02014b50, 0); // central directory signature
    cdEntry.writeUInt16LE(20, 4); // version made by
    cdEntry.writeUInt16LE(20, 6); // version needed
    cdEntry.writeUInt16LE(0x0800, 8); // general purpose bit flag
    cdEntry.writeUInt16LE(0, 10); // compression: store
    cdEntry.writeUInt16LE(0, 12); // mod time
    cdEntry.writeUInt16LE(0, 14); // mod date
    cdEntry.writeUInt32LE(crc, 16); // crc-32
    cdEntry.writeUInt32LE(data.length, 20); // compressed size
    cdEntry.writeUInt32LE(data.length, 24); // uncompressed size
    cdEntry.writeUInt16LE(nameBuf.length, 28); // file name length
    cdEntry.writeUInt16LE(0, 30); // extra field length
    cdEntry.writeUInt16LE(0, 32); // file comment length
    cdEntry.writeUInt16LE(0, 34); // disk number start
    cdEntry.writeUInt16LE(0, 36); // internal file attributes
    cdEntry.writeUInt32LE(0, 38); // external file attributes
    cdEntry.writeUInt32LE(offset, 42); // relative offset of local header

    centralDirectory.push(Buffer.concat([cdEntry, nameBuf]));
    offset += 30 + nameBuf.length + data.length;
  }

  const cdBuf = Buffer.concat(centralDirectory);
  const eocd = Buffer.alloc(22);
  const cdOffset = offset;
  eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with central directory
  eocd.writeUInt16LE(files.length, 8); // entries on this disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(cdBuf.length, 12); // central directory size
  eocd.writeUInt32LE(cdOffset, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...chunks, cdBuf, eocd]);
}

// ── Generate placeholder icons ─────────────────────────────────────────────
function generatePlaceholderIcons() {
  const iconsDir = join(__dirname, 'icons');
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  // Minimal valid 1×1 purple PNG (89 bytes). Sufficient for packaging but
  // Chrome Web Store will reject these — replace with real icons before submitting.
  // From: https://en.wikipedia.org/wiki/PNG#File_format
  const MINIMAL_PNG = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk, 13 bytes
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // 1×1 pixel
    0x08,
    0x02,
    0x00,
    0x00,
    0x00, // RGB, 8-bit
    0x90,
    0x77,
    0x53,
    0xde, // IHDR CRC
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41,
    0x54, // IDAT chunk, 12 bytes
    0x08,
    0xd7,
    0x63,
    0x68,
    0x99,
    0xf4,
    0x00,
    0x00,
    0x81,
    0x9e,
    0x01,
    0x7f,
    0x0a,
    0x01,
    0x86,
    0x68, // compressed purple pixel
    0xb3,
    0xeb,
    0x5f,
    0xbb, // IDAT CRC
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44, // IEND chunk
    0xae,
    0x42,
    0x60,
    0x82, // IEND CRC
  ]);

  let hasRealIcons = false;
  for (const size of [16, 48, 128]) {
    const path = join(iconsDir, `icon${size}.png`);
    if (!existsSync(path)) {
      createWriteStream(path).end(MINIMAL_PNG);
      const label = CI_MODE ? '(CI mode — valid placeholder)' : '(REPLACE before submitting!)';
      console.log(`  ⚠️  Created placeholder: icons/icon${size}.png ${label}`);
    } else {
      console.log(`  ✓ Found real icon: icons/icon${size}.png`);
      hasRealIcons = true;
    }
  }

  if (!hasRealIcons && !CI_MODE) {
    console.error(`\n❌ No real icons found in apps/extension/icons/.
   The Chrome Web Store requires proper 16×16, 48×48, and 128×128 PNG icons.
   Add real icon files before submitting, or pass --ci to use placeholders.\n`);
    process.exit(1);
  }

  if (!hasRealIcons && CI_MODE) {
    console.log(
      '  ℹ️  CI mode: using minimal placeholder icons (not suitable for store submission)\n',
    );
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  const version = manifest.version;
  const outZip = join(DIST_DIR, `stellar-pay-extension-${version}.zip`);

  console.log(`Packaging StellarPay Hub extension v${version}...\n`);

  // 1. Generate placeholder icons if missing
  generatePlaceholderIcons();

  // 2. Build the extension (TypeScript → JS)
  console.log('Building extension...');
  execSync('node build.mjs', { cwd: __dirname, stdio: 'inherit' });

  // 3. Collect files for ZIP
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true });
  }

  const zipFiles = [];
  for (const file of BUNDLE_FILES) {
    const filePath = join(__dirname, file);
    if (existsSync(filePath)) {
      const data = readFileSync(filePath);
      zipFiles.push([file, data]);
      console.log(`  ✓ ${file} (${data.length} bytes)`);
    } else {
      console.warn(`  ⚠️  Skipping ${file} — file not found`);
    }
  }

  // Also include icons (use glob-style pattern)
  const iconsDir = join(__dirname, 'icons');
  if (existsSync(iconsDir)) {
    for (const size of [16, 48, 128]) {
      const iconPath = join(iconsDir, `icon${size}.png`);
      const zipPath = `icons/icon${size}.png`;
      if (existsSync(iconPath)) {
        const data = readFileSync(iconPath);
        zipFiles.push([zipPath, data]);
        console.log(`  ✓ ${zipPath} (${data.length} bytes)`);
      }
    }
  }

  // 4. Create ZIP
  console.log(`\nWriting ${zipFiles.length} files to ${outZip}...`);
  const zipBuffer = buildZip(zipFiles);
  createWriteStream(outZip).end(zipBuffer);
  console.log(`✅ Done! ${(zipBuffer.length / 1024).toFixed(1)} KB`);

  // 5. Print submission instructions
  console.log(`
📦 Chrome Web Store submission ready:
   ${outZip}

Next steps:
   1. Visit https://chrome.google.com/webstore/devconsole
   2. Create a new item or update an existing one
   3. Upload the ZIP file
   4. Fill in store listing details (description, screenshots, etc.)
   5. Replace placeholder icons in apps/extension/icons/ with real 16×16, 48×48, and 128×128 PNGs
   6. Submit for review
`);
}

main().catch((err) => {
  console.error('❌ Packaging failed:', err);
  process.exit(1);
});
