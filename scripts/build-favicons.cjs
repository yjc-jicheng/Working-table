#!/usr/bin/env node
/* Build raster browser icons using sharp (build tooling only). */
'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const sizes = [16, 32, 48, 64];

async function writeICO(source, destination) {
  const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((image, i) => {
    const pos = 6 + i * 16;
    header[pos] = header[pos + 1] = sizes[i];
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(image.length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += image.length;
  });
  await fs.writeFile(destination, Buffer.concat([header, ...images]));
}

(async () => {
  const fallback = path.join(root, 'favicon.png');
  await sharp(path.join(root, 'favicon.svg')).resize(256, 256).png().toFile(fallback);
  await writeICO(fallback, path.join(root, 'favicon.ico'));
  const directory = path.join(root, 'assets', 'schools');
  const images = (await fs.readdir(directory)).filter(name => name.endsWith('.png'));
  for (const name of images) await writeICO(path.join(directory, name), path.join(directory, name.replace(/\.png$/, '.ico')));
  console.log('Built default PNG/ICO and ' + images.length + ' school ICO files');
})().catch(err => { console.error(err); process.exitCode = 1; });
