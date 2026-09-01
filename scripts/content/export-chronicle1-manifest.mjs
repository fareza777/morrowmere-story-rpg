import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_PATH = resolve(REPOSITORY_ROOT, 'content/manifests/chronicle1-media-contract.json');

function sortedById(entries) {
  return [...entries].sort((left, right) => left.id.localeCompare(right.id));
}

export async function exportChronicle1Manifest() {
  const server = await createServer({
    root: REPOSITORY_ROOT,
    configFile: false,
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true },
  });

  try {
    const module = await server.ssrLoadModule('/src/game/content/chronicle1/media-contract.ts');
    const contract = module.CHRONICLE1_MEDIA_CONTRACT;
    const payload = {
      version: 1,
      scenes: sortedById(contract.scenes),
      itemIcons: sortedById(contract.itemIcons),
      enemyPortraits: sortedById(contract.enemyPortraits),
      bosses: sortedById(contract.bosses),
      voiceCues: sortedById(contract.voiceCues),
    };

    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return OUTPUT_PATH;
  } finally {
    await server.close();
  }
}

const entryPath = process.argv[1] ? resolve(process.argv[1]).toLowerCase() : '';
if (fileURLToPath(import.meta.url).toLowerCase() === entryPath) {
  await exportChronicle1Manifest();
}
