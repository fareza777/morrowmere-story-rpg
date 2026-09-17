import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
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

describe('Road Tactics artwork', () => {
  it('accepts the 402-scene Chronicle contract and four canonical action-card assets', () => {
    const result = spawnSync(process.execPath, ['scripts/media/validate-scene-art.mjs'], {
      cwd: root,
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('402/402 unique 1536x1024 WebP scene assets');
    expect(result.stdout).toContain('4/4 unique 1536x1024 WebP action-card assets');
  }, 15_000);

  it('keeps every canonical encounter and action-card asset present, valid, and distinct', () => {
    const hashes = new Set<string>();
    for (const relativePath of ROAD_TACTICS_ASSET_PATHS) {
      const assetPath = resolve(root, relativePath);
      expect(existsSync(assetPath), relativePath).toBe(true);
      const bytes = readFileSync(assetPath);
      expect(bytes.length, relativePath).toBeGreaterThanOrEqual(32 * 1024);
      expect(bytes.toString('ascii', 0, 4), relativePath).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12), relativePath).toBe('WEBP');
      hashes.add(createHash('sha256').update(bytes).digest('hex'));
    }
    expect(hashes.size).toBe(ROAD_TACTICS_ASSET_PATHS.length);
  });
});
