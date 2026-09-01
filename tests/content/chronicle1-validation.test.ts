import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateChroniclePlayability, validateContent } from '../../src/game/content/validate';
import {
  CHRONICLE1_ART_IDS,
  CHRONICLE1_AUDIO_IDS,
  CHRONICLE1_CONTENT,
  CHRONICLE1_ENDINGS,
  CHRONICLE1_ENCOUNTERS,
  CHRONICLE1_ENEMIES,
  CHRONICLE1_EPILOGUE_FRAGMENTS,
  CHRONICLE1_ITEMS,
  CHRONICLE1_MEDIA_CONTRACT,
  CHRONICLE1_MERCHANTS,
  CHRONICLE1_NEW_ITEMS,
  CHRONICLE1_SCENES,
  CHRONICLE1,
  CHRONICLE1_COMPANIONS,
  CHRONICLE1_FACTIONS,
  CHRONICLE1_ROUTES,
  CHRONICLE1_VOICE_CUES,
} from '../../src/game/content/chronicle1';
import type { ItemId } from '../../src/game/domain/ids';

const REPOSITORY_ROOT = process.cwd();
const EXPORTER_PATH = join(REPOSITORY_ROOT, 'scripts/content/export-chronicle1-manifest.mjs');
const MANIFEST_PATH = join(REPOSITORY_ROOT, 'content/manifests/chronicle1-media-contract.json');

function expectUniqueIds(entries: readonly { readonly id: string }[]): void {
  expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
}

function expectSortedById(entries: readonly { readonly id: string }[]): void {
  expect(entries.map((entry) => entry.id)).toEqual(
    [...entries].map((entry) => entry.id).sort((left, right) => left.localeCompare(right)),
  );
}

describe('Chronicle I production content index', () => {
  it('assembles every authored catalog into one valid runtime index', () => {
    expect(CHRONICLE1_CONTENT.events.size).toBe(332);
    expect(CHRONICLE1_CONTENT.items.size).toBe(160);
    expect(CHRONICLE1_CONTENT.enemies.size).toBe(215);
    expect(CHRONICLE1_CONTENT.encounters.size).toBe(48);
    expect(CHRONICLE1_CONTENT.companions.size).toBe(5);
    expect(CHRONICLE1_CONTENT.merchants.size).toBe(6);
    expect(validateContent(CHRONICLE1_CONTENT)).toEqual([]);
    expect(validateChroniclePlayability({
      chronicle: CHRONICLE1,
      routes: CHRONICLE1_ROUTES,
      factions: CHRONICLE1_FACTIONS,
      companions: CHRONICLE1_COMPANIONS,
      merchants: CHRONICLE1_MERCHANTS,
      events: CHRONICLE1_SCENES,
      encounters: CHRONICLE1_ENCOUNTERS,
      dialogueCatalog: {
        environmentArtIds: new Set(CHRONICLE1_MEDIA_CONTRACT.scenes.map((entry) => entry.id)),
        characterArt: CHRONICLE1_MEDIA_CONTRACT.characters,
        voiceCues: CHRONICLE1_VOICE_CUES,
      },
    })).toEqual([]);

    expect([...CHRONICLE1_CONTENT.events.keys()]).toEqual(CHRONICLE1_SCENES.map((scene) => scene.id));
    expect([...CHRONICLE1_CONTENT.items.keys()]).toEqual(CHRONICLE1_ITEMS.map((item) => item.id));
    expect([...CHRONICLE1_CONTENT.enemies.keys()]).toEqual(CHRONICLE1_ENEMIES.map((enemy) => enemy.id));
    expect([...CHRONICLE1_CONTENT.encounters.keys()]).toEqual(
      CHRONICLE1_ENCOUNTERS.map((encounter) => encounter.id),
    );
  });

  it('keeps merchant stock real, useful, and gated by Chronicle progression', () => {
    const newItemIds = new Set(CHRONICLE1_NEW_ITEMS.map((item) => item.id));
    const questGatedItemIds = new Set(
      CHRONICLE1_NEW_ITEMS
        .filter((item) => item.gates.questId !== undefined)
        .map((item) => item.id),
    );

    for (const item of CHRONICLE1_NEW_ITEMS) {
      const runtimeItem = CHRONICLE1_CONTENT.items.get(item.id as ItemId);
      expect(runtimeItem, item.id).toBeDefined();
      expect(runtimeItem!.tags, item.id).toContain(`min-chapter:${item.gates.minChapter}`);
      if (item.gates.minReputation !== undefined) {
        expect(runtimeItem!.tags, item.id).toContain(`min-reputation:${item.gates.minReputation}`);
      }
    }

    for (const merchantMetadata of CHRONICLE1_MERCHANTS) {
      const merchant = CHRONICLE1_CONTENT.merchants.get(merchantMetadata.id);
      expect(merchant, merchantMetadata.id).toBeDefined();
      expect(merchant!.stockItemIds.length, merchantMetadata.id).toBeGreaterThanOrEqual(6);
      expect(new Set(merchant!.stockItemIds).size, merchantMetadata.id).toBe(merchant!.stockItemIds.length);
      for (const itemId of merchant!.stockItemIds) {
        expect(CHRONICLE1_CONTENT.items.has(itemId), `${merchantMetadata.id}:${itemId}`).toBe(true);
        expect(newItemIds.has(itemId), `${merchantMetadata.id}:${itemId}`).toBe(true);
        expect(questGatedItemIds.has(itemId), `${merchantMetadata.id}:${itemId}`).toBe(false);
      }
    }
  });

  it('publishes the complete non-secret media contract and ending catalogs', () => {
    expect(CHRONICLE1_MEDIA_CONTRACT.scenes).toHaveLength(332);
    expect(CHRONICLE1_MEDIA_CONTRACT.itemIcons).toHaveLength(100);
    expect(CHRONICLE1_MEDIA_CONTRACT.enemyPortraits).toHaveLength(80);
    expect(CHRONICLE1_MEDIA_CONTRACT.bosses).toHaveLength(15);
    expect(CHRONICLE1_MEDIA_CONTRACT.voiceCues).toHaveLength(24);

    expect(Object.fromEntries(
      [...new Set(CHRONICLE1_MEDIA_CONTRACT.voiceCues.map((cue) => cue.speaker))]
        .sort()
        .map((speaker) => [
          speaker,
          CHRONICLE1_MEDIA_CONTRACT.voiceCues.filter((cue) => cue.speaker === speaker).length,
        ]),
    )).toEqual({ Caldus: 2, Eldrin: 14, Lyra: 2, Mara: 1, Rukhar: 2, Talla: 1, Voss: 2 });

    for (const group of [
      CHRONICLE1_MEDIA_CONTRACT.scenes,
      CHRONICLE1_MEDIA_CONTRACT.itemIcons,
      CHRONICLE1_MEDIA_CONTRACT.enemyPortraits,
      CHRONICLE1_MEDIA_CONTRACT.bosses,
      CHRONICLE1_MEDIA_CONTRACT.voiceCues,
    ]) expectUniqueIds(group);

    const sceneIds = new Set(CHRONICLE1_SCENES.map((scene) => scene.id));
    for (const cue of CHRONICLE1_MEDIA_CONTRACT.voiceCues) {
      expect(sceneIds.has(cue.sceneId), cue.id).toBe(true);
      expect(
        CHRONICLE1_SCENES.find((scene) => scene.id === cue.sceneId)?.voiceCues?.some(
          (sceneCue) => sceneCue.id === cue.id,
        ),
        cue.id,
      ).toBe(true);
    }

    for (const art of [
      ...CHRONICLE1_MEDIA_CONTRACT.scenes,
      ...CHRONICLE1_MEDIA_CONTRACT.itemIcons,
      ...CHRONICLE1_MEDIA_CONTRACT.enemyPortraits,
      ...CHRONICLE1_MEDIA_CONTRACT.bosses,
    ]) expect(CHRONICLE1_ART_IDS.has(art.id), art.id).toBe(true);
    for (const cue of CHRONICLE1_MEDIA_CONTRACT.voiceCues) {
      expect(CHRONICLE1_AUDIO_IDS.has(cue.id), cue.id).toBe(true);
    }

    expect(CHRONICLE1_ENDINGS).toHaveLength(4);
    expect(CHRONICLE1_EPILOGUE_FRAGMENTS).toHaveLength(24);
  });
});

describe('Chronicle I media manifest exporter', () => {
  it('writes the exact sorted payload byte-identically on repeat', () => {
    execFileSync(process.execPath, [EXPORTER_PATH], { cwd: REPOSITORY_ROOT, stdio: 'pipe' });
    const firstExport = readFileSync(MANIFEST_PATH, 'utf8');
    execFileSync(process.execPath, [EXPORTER_PATH], { cwd: REPOSITORY_ROOT, stdio: 'pipe' });
    const secondExport = readFileSync(MANIFEST_PATH, 'utf8');
    expect(secondExport).toBe(firstExport);

    const manifest = JSON.parse(secondExport) as {
      readonly version: number;
      readonly scenes: readonly { readonly id: string }[];
      readonly itemIcons: readonly { readonly id: string }[];
      readonly enemyPortraits: readonly { readonly id: string }[];
      readonly bosses: readonly { readonly id: string }[];
      readonly voiceCues: readonly { readonly id: string }[];
    };
    expect(Object.keys(manifest)).toEqual([
      'version',
      'scenes',
      'itemIcons',
      'enemyPortraits',
      'bosses',
      'voiceCues',
    ]);
    expect(manifest.version).toBe(1);
    expect(manifest.scenes).toHaveLength(332);
    expect(manifest.itemIcons).toHaveLength(100);
    expect(manifest.enemyPortraits).toHaveLength(80);
    expect(manifest.bosses).toHaveLength(15);
    expect(manifest.voiceCues).toHaveLength(24);
    for (const group of [
      manifest.scenes,
      manifest.itemIcons,
      manifest.enemyPortraits,
      manifest.bosses,
      manifest.voiceCues,
    ]) expectSortedById(group);

    for (const key of ['scenes', 'itemIcons', 'enemyPortraits', 'bosses', 'voiceCues'] as const) {
      expect(manifest[key]).toEqual(
        [...CHRONICLE1_MEDIA_CONTRACT[key]].sort((left, right) => left.id.localeCompare(right.id)),
      );
    }

    expect(secondExport).not.toMatch(/(?:sk_[A-Za-z0-9]+|api[_-]?key|provider|[A-Z]:\\|\/Users\/)/i);
  }, 30_000);
});
