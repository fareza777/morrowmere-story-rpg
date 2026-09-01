import manifestJson from '../../../production/chronicle1/media/audio-manifest.json';
import provenanceJson from '../../../production/chronicle1/media/audio-provenance.json';
import voiceProfilesJson from '../../../production/chronicle1/media/voice-profiles.json';
import voiceScriptJson from '../../../production/chronicle1/media/voice-script.json';

export const OPENING_MUSIC_ID = 'music-opening-score' as const;
export const OPENING_MUSIC_SRC = '/audio/chronicle1/music/music-opening-score.mp3' as const;

export const MUSIC_IDS = Object.freeze([
  'music-title', OPENING_MUSIC_ID, 'music-camp', 'music-merchant', 'music-kings-road', 'music-greywatch', 'music-old-forest',
  'music-redwater', 'music-embervault', 'music-greywatch-siege', 'music-crownless-keep',
  'music-false-coronation', 'music-ending-road',
] as const);

export type MusicId = (typeof MUSIC_IDS)[number];
export type SfxGroup = 'weapons' | 'defense' | 'magic' | 'status' | 'enemy' | 'ui' | 'narrative' | 'ambience';

export interface AudioExternalSource {
  readonly title: string;
  readonly author: string;
  readonly license: 'CC0-1.0';
  readonly licenseUrl: string;
  readonly sourceUrl: string;
  readonly downloadUrl: string;
}

export interface AudioProvenance {
  readonly id: string;
  readonly assetId: string;
  readonly generator: string;
  readonly creationDate: string;
  readonly sourceMasterSha256: string;
  readonly outputSha256: string;
  readonly licenseBasis: string;
  readonly commercialDistribution: boolean;
  readonly externalSource: readonly AudioExternalSource[] | null;
}

export interface MusicAsset {
  readonly id: MusicId;
  readonly src: string;
  readonly durationMs: number;
  readonly loop: boolean;
  readonly loopStartMs: number | null;
  readonly loopEndMs: number | null;
  readonly mood: string;
  readonly intensity: number;
  readonly accent: string;
  readonly loudnessLufs: number;
  readonly truePeakDbtp: number;
  readonly bytes: number;
  readonly sha256: string;
  readonly provenanceId: string;
  readonly provenance: AudioProvenance;
}

export interface SfxAsset {
  readonly id: string;
  readonly group: SfxGroup;
  readonly design: string;
  readonly brief: string;
  readonly src: string;
  readonly durationMs: number;
  readonly loop: boolean;
  readonly loudnessLufs: number;
  readonly truePeakDbtp: number;
  readonly bytes: number;
  readonly sha256: string;
  readonly provenanceId: string;
  readonly provenance: AudioProvenance;
}

export type VoiceSpeaker = 'Eldrin' | 'Mara' | 'Rukhar' | 'Caldus' | 'Lyra' | 'Talla' | 'Voss';

export interface VoiceScriptCue {
  readonly id: string;
  readonly group: 'opening' | 'main' | 'companion';
  readonly sceneId?: string;
  readonly speaker: VoiceSpeaker;
  readonly startMs?: number;
  readonly endMs?: number;
  readonly spokenText: string;
  readonly captionText: string;
  readonly audioSrc: string | null;
  readonly delivery: 'local-web-speech-fallback' | 'file' | 'bundled-kokoro-onnx';
}

export interface VoiceProfile {
  readonly speaker: VoiceSpeaker;
  readonly local: { readonly lang: string; readonly rate: number; readonly pitch: number };
  readonly provider: { readonly voiceId: string | null; readonly modelId: string; readonly status: string };
}

const provenanceById = new Map(
  provenanceJson.assets.map((entry) => [entry.id, Object.freeze(entry as AudioProvenance)] as const),
);

function provenanceFor(id: string): AudioProvenance {
  const entry = provenanceById.get(id);
  if (!entry) throw new Error(`Missing audio provenance ${id}.`);
  return entry;
}

const musicRows = manifestJson.music as readonly (Omit<MusicAsset, 'id' | 'provenance'> & { readonly id: string })[];
if (musicRows.map((row) => row.id).join('|') !== MUSIC_IDS.join('|')) {
  throw new Error('Chronicle I music manifest does not match the locked score IDs.');
}

export const MUSIC_ASSETS: readonly MusicAsset[] = Object.freeze(
  musicRows.map((row) => Object.freeze({
    ...row,
    id: row.id as MusicId,
    provenance: provenanceFor(row.provenanceId),
  } as MusicAsset)),
);

export const SFX_ASSETS: readonly SfxAsset[] = Object.freeze(
  manifestJson.sfx.map((row) => Object.freeze({
    ...row,
    group: row.group as SfxGroup,
    provenance: provenanceFor(row.provenanceId),
  } as SfxAsset)),
);

if (SFX_ASSETS.length !== 84) throw new Error('Chronicle I requires exactly 84 SFX assets.');

export const AUDIO_MANIFEST = Object.freeze(manifestJson);
export const VOICE_SCRIPT: readonly VoiceScriptCue[] = Object.freeze(
  voiceScriptJson.cues.map((cue) => Object.freeze(cue as VoiceScriptCue)),
);
export const OPENING_VOICE_CUES = Object.freeze(
  VOICE_SCRIPT.filter((cue) => cue.group === 'opening'),
);
export const VOICE_PROFILES: readonly VoiceProfile[] = Object.freeze(
  voiceProfilesJson.profiles.map((profile) => Object.freeze(profile as VoiceProfile)),
);

const musicById = new Map(MUSIC_ASSETS.map((asset) => [asset.id, asset] as const));
const sfxById = new Map(SFX_ASSETS.map((asset) => [asset.id, asset] as const));
const voiceProfileBySpeaker = new Map(VOICE_PROFILES.map((profile) => [profile.speaker, profile] as const));
const voiceCueBySceneId = new Map(
  VOICE_SCRIPT.flatMap((cue) => cue.sceneId ? [[cue.sceneId, cue] as const] : []),
);

export const SFX_CUE_VARIANTS = Object.freeze({
  ui: ['sfx-ui-tap'], confirm: ['sfx-ui-confirm'], back: ['sfx-ui-back'], page: ['sfx-ui-page'], inventory: ['sfx-ui-inventory'],
  attack: ['sfx-sword-light-1', 'sfx-sword-light-2', 'sfx-sword-light-3'],
  'heavy-attack': ['sfx-sword-heavy-1', 'sfx-sword-heavy-2'], axe: ['sfx-axe-hit-1', 'sfx-axe-hit-2'], mace: ['sfx-mace-hit-1', 'sfx-mace-hit-2'],
  bow: ['sfx-bow-release'], 'arrow-hit': ['sfx-arrow-hit'], miss: ['sfx-combat-miss', 'sfx-arrow-miss'], critical: ['sfx-combat-critical'],
  block: ['sfx-shield-block-1', 'sfx-shield-block-2', 'sfx-shield-block-3'], parry: ['sfx-parry-1', 'sfx-parry-2'], guard: ['sfx-guard-set'],
  magic: ['sfx-fire-cast', 'sfx-ice-cast', 'sfx-lightning-cast'], fire: ['sfx-fire-cast', 'sfx-fire-impact'], ice: ['sfx-ice-cast', 'sfx-ice-impact'],
  lightning: ['sfx-lightning-cast', 'sfx-lightning-impact'], ward: ['sfx-ward-cast', 'sfx-ward-impact'], heal: ['sfx-heal-cast', 'sfx-heal-impact'], curse: ['sfx-curse-cast', 'sfx-curse-impact'],
  equip: ['sfx-ui-equip'], unequip: ['sfx-ui-unequip'], consume: ['sfx-ui-consume'], loot: ['sfx-ui-loot'], coins: ['sfx-ui-coins'],
  'merchant-buy': ['sfx-ui-buy'], 'merchant-sell': ['sfx-ui-sell'], 'level-up': ['sfx-ui-level-up'], 'quest-update': ['sfx-ui-quest-update'],
  choice: ['sfx-narrative-choice'], warning: ['sfx-narrative-warning'], reveal: ['sfx-narrative-reveal'], 'chapter-title': ['sfx-narrative-chapter-title'],
  'camp-arrival': ['sfx-narrative-camp-arrival'], victory: ['sfx-combat-victory'], defeat: ['sfx-combat-defeat'], flee: ['sfx-combat-flee'],
  door: ['sfx-narrative-door'], 'coronation-bell': ['sfx-narrative-coronation-bell'],
  'enemy-hit': ['sfx-goblin-hit', 'sfx-orc-hit', 'sfx-human-hit', 'sfx-beast-hit', 'sfx-undead-hit'],
  'enemy-death': ['sfx-goblin-death', 'sfx-orc-death', 'sfx-human-death', 'sfx-beast-death', 'sfx-undead-death'],
  'boss-roar': ['sfx-boss-roar'], 'boss-phase': ['sfx-boss-phase'],
} as const satisfies Readonly<Record<string, readonly string[]>>);

export type SemanticSfxCue = keyof typeof SFX_CUE_VARIANTS;
export type SfxCue = SemanticSfxCue | string;
export type AmbienceId = 'ambience-rain' | 'ambience-forest' | 'ambience-flood' | 'ambience-forge' | 'ambience-siege' | 'ambience-keep';

export const OPENING_SHOT_SFX: Readonly<Record<string, readonly string[]>> = Object.freeze({
  'opening-06-the-first-arrow': ['sfx-arrow-hit'],
  'opening-07-goblin-attack': ['sfx-narrative-warning'],
  'opening-08-player-responds': ['sfx-narrative-reveal'],
  'opening-09-royal-armory-mark': ['sfx-narrative-reveal'],
  'opening-10-false-orc-banner': ['sfx-sword-light-1'],
  'opening-11-wounded-witness': ['sfx-heal-cast'],
  'opening-12-enemy-riders': ['sfx-narrative-warning'],
  'opening-14-title-reveal': ['sfx-narrative-chapter-title'],
});

export function musicAsset(id: string): MusicAsset | undefined { return musicById.get(id as MusicId); }
export function sfxAsset(id: string): SfxAsset | undefined { return sfxById.get(id); }
export function voiceProfile(speaker: VoiceSpeaker): VoiceProfile | undefined { return voiceProfileBySpeaker.get(speaker); }
export function voiceCueForScene(sceneId: string): VoiceScriptCue | undefined { return voiceCueBySceneId.get(sceneId); }

function isSemanticSfxCue(cue: string): cue is SemanticSfxCue {
  return Object.prototype.hasOwnProperty.call(SFX_CUE_VARIANTS, cue);
}

export function resolveSfxCue(cue: SfxCue, variantIndex = 0): SfxAsset | undefined {
  const direct = sfxById.get(cue);
  if (direct) return direct;
  if (!isSemanticSfxCue(cue)) return undefined;
  const variants = SFX_CUE_VARIANTS[cue];
  return sfxById.get(variants[Math.abs(variantIndex) % variants.length]!);
}
