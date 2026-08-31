import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import sharp from 'sharp';

const [sourcePath] = process.argv.slice(2);
if (!sourcePath) throw new Error('Usage: node scripts/media/crop-boss-sheet.mjs <sheet>');

const contract = JSON.parse(
  await readFile(new URL('../../content/manifests/chronicle1-media-contract.json', import.meta.url), 'utf8'),
);
const jobs = contract.bosses;
if (jobs.length !== 15) throw new Error(`Expected 15 boss portraits, found ${jobs.length}`);

const outputDirectory = path.resolve('public/assets/chronicle1/bosses');
await mkdir(outputDirectory, { recursive: true });

await Promise.all(jobs.map(async (job, index) => {
  await sharp(sourcePath)
    .resize(3072, 3072, { fit: 'fill' })
    .extract({ left: (index % 4) * 768, top: Math.floor(index / 4) * 768, width: 768, height: 768 })
    .webp({ quality: 90, smartSubsample: true })
    .toFile(path.join(outputDirectory, `${job.id}.webp`));
}));

console.log('Prepared 15 boss portraits.');
