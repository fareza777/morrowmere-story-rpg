import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHRONICLE1_CONTENT, CHRONICLE1_DUNGEONS } from '../../src/game/content/chronicle1';

const root = resolve(import.meta.dirname, '../..');
const EXPECTED_DIMENSIONS = { width: 1536, height: 1024 };
const ROAD_TACTICS_ASSET_PATHS = [
  'public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-needle-briar.webp',
  'public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-riverless-altar.webp',
  'public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-hound-chant.webp',
  'public/assets/chronicle1/scenes/ch01/scene-ch01-road-gloamwood-hidden-beggar.webp',
  'public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-silent-oars.webp',
  'public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-ink-warden.webp',
  'public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-watchtower-debt.webp',
  'public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-corpse-lantern.webp',
  'public/assets/chronicle1/scenes/ch02/scene-ch02-road-drowned-basin-warden.webp',
  'public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-ash-priestess.webp',
  'public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-cinder-drill.webp',
  'public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-scorch-festival.webp',
  'public/assets/chronicle1/scenes/ch05/scene-ch05-road-embervault-ore-bone-road.webp',
  'public/assets/chronicle1/scenes/ch08/scene-ch08-road-crownless-sigil-court.webp',
  'public/assets/chronicle1/scenes/ch08/scene-ch08-road-crownless-iron-chime.webp',
  'public/assets/chronicle1/scenes/ch08/scene-ch08-road-crownless-barnacle-pit.webp',
  'public/assets/chronicle1/travel/travel-road-scout.webp',
  'public/assets/chronicle1/travel/travel-road-press-on.webp',
  'public/assets/chronicle1/travel/travel-road-make-camp.webp',
  'public/assets/chronicle1/travel/travel-road-companion.webp',
] as const;

const readUInt24LE = (buffer: Buffer, offset: number) =>
  buffer[offset]! | (buffer[offset + 1]! << 8) | (buffer[offset + 2]! << 16);

const readWebpDimensions = (buffer: Buffer) => {
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkType = buffer.toString('ascii', offset, offset + 4);
    const chunkLength = buffer.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + chunkLength;
    if (dataEnd > buffer.length) throw new Error(`${chunkType} chunk extends beyond the file`);

    if (chunkType === 'VP8X') {
      return {
        width: readUInt24LE(buffer, dataOffset + 4) + 1,
        height: readUInt24LE(buffer, dataOffset + 7) + 1,
      };
    }
    if (chunkType === 'VP8 ') {
      return {
        width: buffer.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: buffer.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }
    if (chunkType === 'VP8L') {
      const byte1 = buffer[dataOffset + 1]!;
      const byte2 = buffer[dataOffset + 2]!;
      const byte3 = buffer[dataOffset + 3]!;
      const byte4 = buffer[dataOffset + 4]!;
      return {
        width: 1 + byte1 + ((byte2 & 0x3f) << 8),
        height: 1 + ((byte2 & 0xc0) >> 6) + (byte3 << 2) + ((byte4 & 0x0f) << 10),
      };
    }
    offset = dataEnd + (chunkLength & 1);
  }
  throw new Error('no VP8X, VP8, or VP8L image chunk was found');
};

const wrongDimensionFixture = () => {
  const fixture = Buffer.alloc(30);
  fixture.write('RIFF', 0, 'ascii');
  fixture.writeUInt32LE(22, 4);
  fixture.write('WEBPVP8X', 8, 'ascii');
  fixture.writeUInt32LE(10, 16);
  fixture[24] = 0xfe; // 1535px wide, encoded as width minus one.
  fixture[25] = 0x05;
  fixture[27] = 0xff; // 1024px high, encoded as height minus one.
  fixture[28] = 0x03;
  return fixture;
};

describe('Road Tactics artwork', () => {
  it('rejects a deliberately wrong-dimension WebP fixture', () => {
    const dimensions = readWebpDimensions(wrongDimensionFixture());
    expect(dimensions).toEqual({ width: 1535, height: 1024 });
    expect(dimensions).not.toEqual(EXPECTED_DIMENSIONS);
  });

  it('accepts the 403-scene Chronicle contract and four canonical action-card assets', () => {
    const result = spawnSync(process.execPath, ['scripts/media/validate-scene-art.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('403/403 unique 1536x1024 WebP scene assets');
    expect(result.stdout).toContain('4/4 unique 1536x1024 WebP action-card assets');
    expect(result.stdout).toContain('24/24 unique 1536x1024 WebP battlefield assets');
  }, 60_000);

  it('keeps every canonical encounter and action-card asset present, valid, and distinct', () => {
    const hashes = new Set<string>();
    for (const relativePath of ROAD_TACTICS_ASSET_PATHS) {
      const assetPath = resolve(root, relativePath);
      expect(existsSync(assetPath), relativePath).toBe(true);
      const bytes = readFileSync(assetPath);
      expect(bytes.length, relativePath).toBeGreaterThanOrEqual(32 * 1024);
      expect(bytes.toString('ascii', 0, 4), relativePath).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12), relativePath).toBe('WEBP');
      expect(readWebpDimensions(bytes), relativePath).toEqual(EXPECTED_DIMENSIONS);
      hashes.add(createHash('sha256').update(bytes).digest('hex'));
    }
    expect(hashes.size).toBe(ROAD_TACTICS_ASSET_PATHS.length);
  });

  it('maps every dungeon encounter variant to unique descriptive battlefield art', () => {
    const dungeonEncounterIds = [
      ...new Set(
        CHRONICLE1_DUNGEONS.flatMap((dungeon) =>
          dungeon.nodes.flatMap((node) => [
            ...(node.encounterId ? [node.encounterId] : []),
            ...(node.encounterVariants ?? []),
          ]),
        ),
      ),
    ];
    expect(dungeonEncounterIds).toHaveLength(24);

    const battlefieldHashes = new Set<string>();
    const artIds = dungeonEncounterIds.map((id) => {
      const encounter = CHRONICLE1_CONTENT.encounters.get(id);
      expect(encounter, id).toBeDefined();
      expect(encounter?.battlefieldArtId, id).toBe(id);
      expect(encounter?.battlefieldArtAlt, id).toMatch(/^.+\.$/u);
      const relativePath = `public/assets/chronicle1/battles/${encounter?.battlefieldArtId}.webp`;
      const assetPath = resolve(root, relativePath);
      expect(existsSync(assetPath), relativePath).toBe(true);
      const bytes = readFileSync(assetPath);
      expect(bytes.length, relativePath).toBeGreaterThanOrEqual(32 * 1024);
      expect(bytes.toString('ascii', 0, 4), relativePath).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12), relativePath).toBe('WEBP');
      expect(readWebpDimensions(bytes), relativePath).toEqual(EXPECTED_DIMENSIONS);
      battlefieldHashes.add(createHash('sha256').update(bytes).digest('hex'));
      return encounter?.battlefieldArtId;
    });
    expect(new Set(artIds).size).toBe(24);
    expect(battlefieldHashes.size).toBe(24);
  });
});
