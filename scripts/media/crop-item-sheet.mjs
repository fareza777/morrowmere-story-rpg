import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import sharp from 'sharp';

const [sourcePath, startText, countText, columnsText = '4', rowsText = columnsText] = process.argv.slice(2);

if (!sourcePath || startText === undefined || countText === undefined) {
  throw new Error('Usage: node scripts/media/crop-item-sheet.mjs <sheet> <start> <count>');
}

const start = Number.parseInt(startText, 10);
const count = Number.parseInt(countText, 10);
const columns = Number.parseInt(columnsText, 10);
const rows = Number.parseInt(rowsText, 10);

if (
  !Number.isInteger(start) || !Number.isInteger(count) || !Number.isInteger(columns) || !Number.isInteger(rows)
  || start < 0 || count < 1 || columns < 1 || rows < 1 || count > columns * rows
) {
  throw new Error('start/count/grid dimensions must describe a non-empty rectangular sheet');
}

const contract = JSON.parse(
  await readFile(new URL('../../content/manifests/chronicle1-media-contract.json', import.meta.url), 'utf8'),
);
const jobs = contract.itemIcons.slice(start, start + count);

if (jobs.length !== count) {
  throw new Error(`Requested ${count} icons at ${start}, found ${jobs.length}`);
}

const outputDirectory = path.resolve('public/assets/chronicle1/items');
await mkdir(outputDirectory, { recursive: true });

await Promise.all(
  jobs.map(async (job, index) => {
    const left = (index % columns) * 512;
    const top = Math.floor(index / columns) * 512;
    await sharp(sourcePath)
      .resize(columns * 512, rows * 512, { fit: 'fill' })
      .extract({ left, top, width: 512, height: 512 })
      .webp({ quality: 90, smartSubsample: true })
      .toFile(path.join(outputDirectory, `${job.id}.webp`));
  }),
);

console.log(`Prepared ${jobs.length} item icons (${start}-${start + jobs.length - 1}).`);
