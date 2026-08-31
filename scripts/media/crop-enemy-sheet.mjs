import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import sharp from 'sharp';

const [sourcePath, startText, countText] = process.argv.slice(2);
const start = Number.parseInt(startText ?? '', 10);
const count = Number.parseInt(countText ?? '', 10);

if (!sourcePath || !Number.isInteger(start) || !Number.isInteger(count) || start < 0 || count < 1 || count > 16) {
  throw new Error('Usage: node scripts/media/crop-enemy-sheet.mjs <sheet> <start> <count<=16>');
}

const contract = JSON.parse(
  await readFile(new URL('../../content/manifests/chronicle1-media-contract.json', import.meta.url), 'utf8'),
);
const jobs = contract.enemyPortraits.slice(start, start + count);
if (jobs.length !== count) throw new Error(`Requested ${count} portraits at ${start}, found ${jobs.length}`);

const outputDirectory = path.resolve('public/assets/chronicle1/enemies');
await mkdir(outputDirectory, { recursive: true });

await Promise.all(jobs.map(async (job, index) => {
  const left = (index % 4) * 768;
  const top = Math.floor(index / 4) * 768;
  await sharp(sourcePath)
    .resize(3072, 3072, { fit: 'fill' })
    .extract({ left, top, width: 768, height: 768 })
    .webp({ quality: 88, smartSubsample: true })
    .toFile(path.join(outputDirectory, `${job.id}.webp`));
}));

console.log(`Prepared ${jobs.length} enemy portraits (${start}-${start + jobs.length - 1}).`);
