import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { createServer } from 'vite';

const EXPECTED_SCENE_COUNT = 386;
const EXPECTED_WIDTH = 1536;
const EXPECTED_HEIGHT = 1024;
const MIN_FILE_BYTES = 32 * 1024;

const root = resolve(import.meta.dirname, '../..');
const sceneArtRoot = resolve(root, 'public/assets/chronicle1/scenes');

const toProjectPath = (path) => relative(root, path).replaceAll('\\', '/');

const duplicateValues = (values) => {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1);
};

const readUInt24LE = (buffer, offset) =>
  buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);

const readWebpDimensions = (buffer) => {
  if (buffer.length < 20) {
    throw new Error('file is too short to contain a WebP image');
  }
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('missing RIFF/WEBP signature');
  }

  const declaredLength = buffer.readUInt32LE(4) + 8;
  if (declaredLength !== buffer.length) {
    throw new Error(`RIFF length is ${declaredLength} bytes but file is ${buffer.length} bytes`);
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4);
    const chunkLength = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + chunkLength;
    if (dataEnd > buffer.length) {
      throw new Error(`${chunkType} chunk extends beyond the file`);
    }

    if (chunkType === 'VP8X') {
      if (chunkLength < 10) {
        throw new Error('VP8X chunk is too short');
      }
      return {
        width: readUInt24LE(buffer, dataOffset + 4) + 1,
        height: readUInt24LE(buffer, dataOffset + 7) + 1,
      };
    }

    if (chunkType === 'VP8 ') {
      if (chunkLength < 10) {
        throw new Error('VP8 chunk is too short');
      }
      if (
        buffer[dataOffset + 3] !== 0x9d ||
        buffer[dataOffset + 4] !== 0x01 ||
        buffer[dataOffset + 5] !== 0x2a
      ) {
        throw new Error('VP8 frame header is invalid');
      }
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === 'VP8L') {
      if (chunkLength < 5 || buffer[dataOffset] !== 0x2f) {
        throw new Error('VP8L frame header is invalid');
      }
      const byte1 = buffer[dataOffset + 1];
      const byte2 = buffer[dataOffset + 2];
      const byte3 = buffer[dataOffset + 3];
      const byte4 = buffer[dataOffset + 4];
      return {
        width: 1 + byte1 + ((byte2 & 0x3f) << 8),
        height: 1 + ((byte2 & 0xc0) >> 6) + (byte3 << 2) + ((byte4 & 0x0f) << 10),
      };
    }

    offset = dataEnd + (chunkLength & 1);
  }

  throw new Error('no VP8X, VP8, or VP8L image chunk was found');
};

const loadScenes = async () => {
  const server = await createServer({
    root,
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true },
  });
  try {
    const content = await server.ssrLoadModule('/src/game/content/chronicle1/index.ts');
    return content.CHRONICLE1_SCENES;
  } finally {
    await server.close();
  }
};

const main = async () => {
  const scenes = await loadScenes();
  if (!Array.isArray(scenes)) {
    throw new Error('CHRONICLE1_SCENES did not export an array');
  }

  const errors = [];
  if (scenes.length !== EXPECTED_SCENE_COUNT) {
    errors.push(`expected ${EXPECTED_SCENE_COUNT} scenes, found ${scenes.length}`);
  }

  for (const scene of scenes) {
    if (typeof scene.id !== 'string' || scene.id.length === 0) {
      errors.push('a Chronicle scene has a missing or invalid id');
    }
    if (typeof scene.illustrationId !== 'string' || scene.illustrationId.length === 0) {
      errors.push(`scene "${scene.id ?? '<unknown>'}" has a missing or invalid illustration id`);
    }
  }
  for (const [id, count] of duplicateValues(scenes.map((scene) => scene.id))) {
    errors.push(`scene id "${id}" is used ${count} times`);
  }
  for (const [id, count] of duplicateValues(scenes.map((scene) => scene.illustrationId))) {
    errors.push(`illustration id "${id}" is used ${count} times`);
  }

  const assetsByHash = new Map();
  let validAssetCount = 0;

  for (const scene of scenes) {
    if (typeof scene.chapterId !== 'string' || typeof scene.illustrationId !== 'string') {
      errors.push(`scene "${scene.id ?? '<unknown>'}" has an invalid chapterId or illustrationId`);
      continue;
    }
    if (!/^ch\d{2}$/.test(scene.chapterId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(scene.illustrationId)) {
      errors.push(
        `scene "${scene.id}" cannot map to an exact scene-art path (${scene.chapterId}/${scene.illustrationId})`,
      );
      continue;
    }

    const assetPath = resolve(sceneArtRoot, scene.chapterId, `${scene.illustrationId}.webp`);
    const displayPath = toProjectPath(assetPath);
    let bytes;
    try {
      bytes = await readFile(assetPath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        errors.push(`missing ${displayPath}`);
        continue;
      }
      errors.push(`cannot read ${displayPath}: ${error.message}`);
      continue;
    }

    if (bytes.length < MIN_FILE_BYTES) {
      errors.push(`${displayPath} is only ${bytes.length} bytes (minimum ${MIN_FILE_BYTES})`);
    }

    try {
      const { width, height } = readWebpDimensions(bytes);
      if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
        errors.push(
          `${displayPath} is ${width}x${height}; expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
        );
      }
    } catch (error) {
      errors.push(`${displayPath} is not a valid WebP: ${error.message}`);
      continue;
    }

    const hash = createHash('sha256').update(bytes).digest('hex');
    const paths = assetsByHash.get(hash) ?? [];
    paths.push(displayPath);
    assetsByHash.set(hash, paths);
    validAssetCount += 1;
  }

  for (const [hash, paths] of assetsByHash) {
    if (paths.length > 1) {
      errors.push(`duplicate artwork SHA-256 ${hash.slice(0, 12)}: ${paths.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    console.error(`Scene-art validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Scene-art validation passed: ${validAssetCount}/${EXPECTED_SCENE_COUNT} unique ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT} WebP assets (${assetsByHash.size} distinct SHA-256 hashes).`,
  );
};

main().catch((error) => {
  console.error(`Scene-art validation could not run: ${error.message}`);
  process.exitCode = 1;
});
