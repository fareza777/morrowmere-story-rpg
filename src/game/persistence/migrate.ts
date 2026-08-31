import type { ContentIndex } from '../content/schema';
import { createCampaign } from '../state/create';
import type { GameStateV2, ProfileState } from '../state/types';
import type { HeroClass } from '../types';

const heroClasses = new Set<HeroClass>(['warrior', 'mage', 'warden']);

function isLegacy(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && (value as { schemaVersion?: unknown }).schemaVersion === 1;
}

function legacySettings(value: unknown): ProfileState['settings'] | null {
  if (!value || typeof value !== 'object') return null;
  const settings = value as Record<string, unknown>;
  if (typeof settings.textScale !== 'number' || !Number.isFinite(settings.textScale)
    || typeof settings.highContrast !== 'boolean' || typeof settings.reducedMotion !== 'boolean'
    || typeof settings.sound !== 'boolean' || typeof settings.music !== 'boolean' || typeof settings.narration !== 'boolean') return null;
  return { textScale: settings.textScale, highContrast: settings.highContrast, reducedMotion: settings.reducedMotion, sound: settings.sound, music: settings.music, narration: settings.narration };
}

function validName(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 48 ? value.trim() : undefined;
}

/** Starts a clean Chronicle I campaign; the old story position is deliberately never inferred. */
export function migrateSave(value: unknown, content: ContentIndex, createdAt: string): GameStateV2 | null {
  if (!isLegacy(value)) return null;
  const legacy = value;
  const oldHero = legacy.hero && typeof legacy.hero === 'object' ? legacy.hero as Record<string, unknown> : {};
  const heroClass: HeroClass = heroClasses.has(oldHero.class as HeroClass) ? oldHero.class as HeroClass : 'warrior';
  const name = validName(oldHero.name);
  const seed = typeof legacy.seed === 'number' && Number.isFinite(legacy.seed) ? legacy.seed : 0;
  const initial = createCampaign({ heroClass, name, seed, updatedAt: createdAt, chapterId: 'ch01' }, content);
  const settings = legacySettings(legacy.settings) ?? initial.profile.settings;
  const eventIds = Array.isArray(legacy.discoveredEvents) ? legacy.discoveredEvents.filter((id): id is string => typeof id === 'string' && content.events.has(id as never)) : [];
  const enemyIds = Array.isArray(legacy.discoveredEnemies) ? legacy.discoveredEnemies.filter((id): id is string => typeof id === 'string' && content.enemies.has(id as never)) : [];
  return { ...initial, profile: { settings, discoveries: { events: [...new Set(eventIds)] as never, enemies: [...new Set(enemyIds)], codex: [] } } };
}
