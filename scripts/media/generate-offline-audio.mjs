import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const WORK = resolve(ROOT, '.media-work/chronicle1/audio');
const MUSIC_OUTPUT = resolve(ROOT, 'public/audio/chronicle1/music');
const SFX_OUTPUT = resolve(ROOT, 'public/audio/chronicle1/sfx');
const PRODUCTION = resolve(ROOT, 'production/chronicle1/media');
const SAMPLE_RATE = 22_050;
const CREATED_AT = '2026-09-01';
const LICENSE_BASIS = 'Project-owned original procedural synthesis; commercial Google Play distribution permitted.';

const MUSIC = [
  { id: 'music-title', root: 45, mood: 'resolute mystery', intensity: 0.55, accent: 'cello, wooden flute, frame drum', motif: [0, 2, 3, 7, 5, 3, 2, -2] },
  { id: 'music-camp', root: 48, mood: 'shelter and reflection', intensity: 0.25, accent: 'wooden flute, soft dulcimer, low strings', motif: [0, 3, 5, 3, 2, 0, -2, 0] },
  { id: 'music-merchant', root: 50, mood: 'wary warmth', intensity: 0.32, accent: 'hammered dulcimer, hand drum, plucked strings', motif: [0, 2, 5, 7, 5, 2, 3, 0] },
  { id: 'music-kings-road', root: 47, mood: 'forward travel', intensity: 0.42, accent: 'frame drum, cello ostinato, wooden flute', motif: [0, 0, 3, 5, 7, 5, 3, 2] },
  { id: 'music-greywatch', root: 43, mood: 'guarded civic resolve', intensity: 0.48, accent: 'low strings, restrained horn-like reeds, frame drum', motif: [0, 5, 3, 2, 0, -2, 0, 3] },
  { id: 'music-old-forest', root: 46, mood: 'watchful woodland', intensity: 0.34, accent: 'breathy flute, bowed drone, wood percussion', motif: [0, 3, 7, 5, 2, 5, 3, -2] },
  { id: 'music-redwater', root: 44, mood: 'tense negotiation', intensity: 0.5, accent: 'cello, low dulcimer, sparse frame drum', motif: [0, 2, 3, 6, 5, 3, -1, 0] },
  { id: 'music-embervault', root: 41, mood: 'industrial secrecy', intensity: 0.58, accent: 'hammered metal, low strings, measured drum', motif: [0, 1, 5, 3, 1, -2, 0, 6] },
  { id: 'music-greywatch-siege', root: 40, mood: 'urgent defense', intensity: 0.78, accent: 'frame drums, cello ostinato, hard dulcimer', motif: [0, 3, 0, 5, 3, 7, 5, 2] },
  { id: 'music-crownless-keep', root: 42, mood: 'controlled dread', intensity: 0.62, accent: 'low strings, distant bell, breathy flute', motif: [0, 1, 4, 3, -1, 0, 6, 4] },
  { id: 'music-false-coronation', root: 39, mood: 'ceremonial confrontation', intensity: 0.72, accent: 'low bell, cello, disciplined frame drum', motif: [0, 5, 1, 6, 3, 1, -2, 0] },
  { id: 'music-ending-road', root: 48, mood: 'earned hope', intensity: 0.38, accent: 'wooden flute, warm strings, light dulcimer', motif: [0, 3, 5, 7, 10, 7, 5, 3] },
];

function entries(group, rows) {
  return rows.map(([id, design, durationMs, brief], index) => ({ id, group, design, durationMs, variant: index, brief }));
}

const SFX = [
  ...entries('weapons', [
    ['sfx-sword-light-1', 'blade-light', 320, 'Fast light sword cut with a close steel edge and short air tail.'],
    ['sfx-sword-light-2', 'blade-light', 350, 'Diagonal light sword cut with brighter steel contact.'],
    ['sfx-sword-light-3', 'blade-light', 300, 'Compact thrust-and-cut with a dry metal finish.'],
    ['sfx-sword-heavy-1', 'blade-heavy', 520, 'Heavy two-handed sword swing ending in a dense impact.'],
    ['sfx-sword-heavy-2', 'blade-heavy', 570, 'Broad heavy sword arc with lower steel resonance.'],
    ['sfx-axe-hit-1', 'axe', 470, 'Axe head bites wood and armor with a short haft rattle.'],
    ['sfx-axe-hit-2', 'axe', 510, 'Deeper axe chop with a hard split and low body.'],
    ['sfx-mace-hit-1', 'mace', 490, 'Blunt mace impact with armor ring and low thump.'],
    ['sfx-mace-hit-2', 'mace', 540, 'Heavy rounded mace blow with a different metal decay.'],
    ['sfx-bow-release', 'bow', 380, 'Bowstring snap, limb recoil, and brief arrow departure.'],
    ['sfx-arrow-hit', 'arrow-hit', 430, 'Arrow strikes a firm target with shaft vibration.'],
    ['sfx-arrow-miss', 'arrow-miss', 620, 'Arrow passes through air without any impact.'],
  ]),
  ...entries('defense', [
    ['sfx-shield-block-1', 'shield', 520, 'Sword caught on a wooden shield with iron rim resonance.'],
    ['sfx-shield-block-2', 'shield', 570, 'Heavy shield block with a low board thump.'],
    ['sfx-shield-block-3', 'shield', 480, 'Glancing shield catch with a short rim scrape.'],
    ['sfx-parry-1', 'parry', 420, 'Quick blade parry with two distinct steel contacts.'],
    ['sfx-parry-2', 'parry', 460, 'Firm crossed-blade parry with brighter ring.'],
    ['sfx-armor-hit-1', 'armor', 500, 'Weapon glances from plate over padded cloth.'],
    ['sfx-armor-hit-2', 'armor', 540, 'Lower armor impact with linked metal rattle.'],
    ['sfx-guard-set', 'guard', 450, 'Shield and boots settle into a defensive stance.'],
  ]),
  ...entries('magic', [
    ['sfx-fire-cast', 'magic-cast-fire', 820, 'Fire gathers with a rising heated rush.'],
    ['sfx-fire-impact', 'magic-impact-fire', 930, 'Fire spell lands in a contained burst.'],
    ['sfx-ice-cast', 'magic-cast-ice', 860, 'Ice forms through bright crystalline tones.'],
    ['sfx-ice-impact', 'magic-impact-ice', 980, 'Ice impact cracks into several clean fragments.'],
    ['sfx-lightning-cast', 'magic-cast-lightning', 680, 'Electric charge rises in uneven pulses.'],
    ['sfx-lightning-impact', 'magic-impact-lightning', 760, 'Lightning snaps into a hard dry strike.'],
    ['sfx-ward-cast', 'magic-cast-ward', 900, 'Protective ward opens with a stable harmonic swell.'],
    ['sfx-ward-impact', 'magic-impact-ward', 720, 'Ward absorbs force with a rounded magical knock.'],
    ['sfx-heal-cast', 'magic-cast-heal', 980, 'Healing energy rises in warm separated tones.'],
    ['sfx-heal-impact', 'magic-impact-heal', 1_050, 'Healing resolves with a soft grounded cadence.'],
    ['sfx-curse-cast', 'magic-cast-curse', 960, 'Curse gathers in an unstable descending texture.'],
    ['sfx-curse-impact', 'magic-impact-curse', 1_020, 'Curse lands with a dry low pulse and dissonant tail.'],
  ]),
  ...entries('status', [
    ['sfx-status-poison', 'status-poison', 760, 'Poison status with liquid movement and a muted warning tone.'],
    ['sfx-status-bleed', 'status-bleed', 520, 'Bleed status with two restrained heartbeat-like hits.'],
    ['sfx-status-burn', 'status-burn', 720, 'Burn status with close flame and a clear hot tick.'],
    ['sfx-status-freeze', 'status-freeze', 780, 'Freeze status closes in with a brittle ice lock.'],
    ['sfx-status-stun', 'status-stun', 580, 'Stun status with a blunt onset and short ringing disorientation.'],
    ['sfx-status-cleanse', 'status-cleanse', 860, 'Cleanse lifts a noisy layer into a calm resolving tone.'],
    ['sfx-status-buff', 'status-buff', 780, 'Positive buff climbs in three firm steps.'],
    ['sfx-status-debuff', 'status-debuff', 820, 'Negative debuff falls in uneven muted steps.'],
  ]),
  ...entries('enemy', [
    ['sfx-goblin-hit', 'voice-goblin-hit', 480, 'Small goblin pain bark without speech.'],
    ['sfx-goblin-death', 'voice-goblin-death', 880, 'Goblin defeat cry falling into breath.'],
    ['sfx-orc-hit', 'voice-orc-hit', 560, 'Deep orc pain grunt without words.'],
    ['sfx-orc-death', 'voice-orc-death', 1_080, 'Orc defeat growl with a heavy final breath.'],
    ['sfx-human-hit', 'voice-human-hit', 460, 'Human combat pain grunt without words.'],
    ['sfx-human-death', 'voice-human-death', 980, 'Human defeat exhale without intelligible speech.'],
    ['sfx-beast-hit', 'voice-beast-hit', 540, 'Wounded beast snarl with rough breath.'],
    ['sfx-beast-death', 'voice-beast-death', 1_120, 'Beast defeat cry descending into a growl.'],
    ['sfx-undead-hit', 'voice-undead-hit', 620, 'Dry undead reaction with bone-like rattle.'],
    ['sfx-undead-death', 'voice-undead-death', 1_180, 'Undead collapse with breathless rasp and brittle debris.'],
    ['sfx-boss-roar', 'voice-boss-roar', 1_650, 'Large boss roar built from layered nonverbal formants.'],
    ['sfx-boss-phase', 'boss-phase', 1_450, 'Boss phase change with a low surge and sharp reveal.'],
  ]),
  ...entries('ui', [
    ['sfx-ui-tap', 'ui-tap', 90, 'Dry readable button tap.'],
    ['sfx-ui-confirm', 'ui-confirm', 260, 'Short positive confirmation pair.'],
    ['sfx-ui-back', 'ui-back', 220, 'Soft descending back-navigation cue.'],
    ['sfx-ui-page', 'ui-page', 360, 'Parchment page movement without excessive texture.'],
    ['sfx-ui-inventory', 'ui-inventory', 420, 'Leather pack opens with a small buckle click.'],
    ['sfx-ui-equip', 'ui-equip', 430, 'Equipment settles with leather and metal contact.'],
    ['sfx-ui-unequip', 'ui-unequip', 390, 'Equipment releases with a softer reversed gesture.'],
    ['sfx-ui-consume', 'ui-consume', 520, 'Consumable use with stopper and clear finish.'],
    ['sfx-ui-loot', 'ui-loot', 620, 'Loot discovery with cloth movement and bright marker.'],
    ['sfx-ui-coins', 'ui-coins', 560, 'Several distinct coins settle on wood.'],
    ['sfx-ui-buy', 'ui-buy', 480, 'Purchase confirms with coin and low positive tick.'],
    ['sfx-ui-sell', 'ui-sell', 500, 'Sale confirms with two coins and a different cadence.'],
    ['sfx-ui-level-up', 'ui-level-up', 1_200, 'Level gain rises through a restrained heroic cadence.'],
    ['sfx-ui-quest-update', 'ui-quest', 820, 'Quest update uses page, stamp, and a clear final tone.'],
  ]),
  ...entries('narrative', [
    ['sfx-narrative-choice', 'narrative-choice', 420, 'Meaningful choice locks in with a low paired tone.'],
    ['sfx-narrative-warning', 'narrative-warning', 780, 'Readable warning pulse without alarm fatigue.'],
    ['sfx-narrative-reveal', 'narrative-reveal', 1_050, 'Evidence reveal opens from low tension into clarity.'],
    ['sfx-narrative-chapter-title', 'narrative-chapter', 1_450, 'Chapter title cadence with drum and restrained low strings.'],
    ['sfx-narrative-camp-arrival', 'narrative-camp', 1_080, 'Camp arrival settles into warm wood and cloth.'],
    ['sfx-combat-victory', 'combat-victory', 1_600, 'Victory cadence is confident but not bombastic.'],
    ['sfx-combat-defeat', 'combat-defeat', 1_700, 'Defeat cadence falls without melodramatic distortion.'],
    ['sfx-combat-miss', 'combat-miss', 520, 'Weapon misses through open air with no impact layer.'],
    ['sfx-combat-critical', 'combat-critical', 860, 'Critical hit combines hard body impact, metal crack, and brief high marker.'],
    ['sfx-combat-flee', 'combat-flee', 1_100, 'Successful retreat uses quick steps and a receding threat pulse.'],
    ['sfx-narrative-door', 'narrative-door', 1_180, 'Heavy keep door opens with wood, hinge, and latch.'],
    ['sfx-narrative-coronation-bell', 'narrative-bell', 2_600, 'Large coronation bell toll with a controlled long decay.'],
  ]),
  ...entries('ambience', [
    ['ambience-rain', 'ambience-rain', 8_000, 'Steady readable rain with no thunder spike.'],
    ['ambience-forest', 'ambience-forest', 8_000, 'Woodland air, leaves, and sparse distant bird shapes.'],
    ['ambience-flood', 'ambience-flood', 8_000, 'Moving flood water with occasional close eddies.'],
    ['ambience-forge', 'ambience-forge', 8_000, 'Forge room with fire bed, bellows, and distant measured metal.'],
    ['ambience-siege', 'ambience-siege', 8_000, 'Distant siege activity, wind, and restrained impacts.'],
    ['ambience-keep', 'ambience-keep', 8_000, 'Stone keep interior with low air and occasional distant door movement.'],
  ]),
];

const OPENING_LINES = [
  'The job should have taken three days. Escort two wagons of medicine north to Greywatch, collect your pay, and leave before the border frost. In Morrowmere, that counts as honest work.',
  'The kingdom has lived eighteen years without a king. Its roads belong to toll collectors, deserters, and anything strong enough to hold a blade. Goblin raids are common. Orc patrols stay west of Redwater. Everyone knows where the danger lies.',
  'Until this morning.',
  'The first arrow kills the driver. The second carries the mark of the royal armory. When the attackers retreat, they leave an orc banner beside a dead officer—as if they want the truth found too quickly.',
  'Someone is preparing a war.',
  'You have no title, no army, and no lord to protect you. You have one wounded witness, one sealed order, and a road that now leads straight to Greywatch.',
  'By nightfall, half the border will want what you carry.',
  'This is where your chronicle begins.',
];

const OPENING_TIMES = [[0, 21_000], [21_000, 36_000], [36_000, 42_000], [42_000, 64_000], [64_000, 71_000], [71_000, 86_000], [86_000, 96_000], [96_000, 105_000]];

function stableSeed(text) {
  const digest = createHash('sha256').update(text).digest();
  return digest.readUInt32LE(0) || 1;
}

function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return ((value >>> 0) / 0xffff_ffff) * 2 - 1;
  };
}

function midi(note) { return 440 * (2 ** ((note - 69) / 12)); }
function sine(frequency, time, phase = 0) { return Math.sin(Math.PI * 2 * frequency * time + phase); }
function triangle(frequency, time) { return (2 / Math.PI) * Math.asin(sine(frequency, time)); }
function saw(frequency, time) { return 2 * ((frequency * time) - Math.floor(0.5 + frequency * time)); }
function clamp(value) { return Math.max(-1, Math.min(1, value)); }
function loopFrequency(frequency, duration) { return Math.round(frequency * duration) / duration; }

function periodicNoisePartials(seed, duration, count, minHz, maxHz) {
  const random = randomSource(seed);
  const minimumCycles = Math.ceil(minHz * duration);
  const maximumCycles = Math.floor(maxHz * duration);
  return Array.from({ length: count }, () => ({
    frequency: (minimumCycles + Math.floor(((random() + 1) / 2) * (maximumCycles - minimumCycles + 1))) / duration,
    phase: random() * Math.PI,
  }));
}

function periodicNoise(partials, time) {
  let value = 0;
  for (const partial of partials) value += sine(partial.frequency, time, partial.phase);
  return value / Math.sqrt(partials.length);
}

function normalize(samples, target = 0.88) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > 0 ? target / peak : 1;
  for (let index = 0; index < samples.length; index += 1) samples[index] = clamp(samples[index] * scale);
  return samples;
}

function synthMusic(config, trackIndex) {
  const duration = 80;
  const total = SAMPLE_RATE * duration;
  const samples = new Float32Array(total);
  const scale = [0, 2, 3, 5, 7, 8, 10, 12];
  const chordRoots = [0, -2, 3, -4];
  const beatsPerSecond = 1.6;
  const vibratoFrequency = loopFrequency(4.6 + trackIndex * 0.03, duration);

  for (let index = 0; index < total; index += 1) {
    const time = index / SAMPLE_RATE;
    const beat = time * beatsPerSecond;
    const wholeBeat = Math.floor(beat);
    const beatPhase = beat - wholeBeat;
    const bar = Math.floor(wholeBeat / 4);
    const chordRoot = config.root + chordRoots[Math.floor(bar / 2) % chordRoots.length];
    const motif = config.motif[wholeBeat % config.motif.length];
    const melodyFrequency = loopFrequency(midi(config.root + 12 + motif), duration);
    const bassFrequency = loopFrequency(midi(chordRoot - 12), duration);
    const padFrequency = loopFrequency(midi(chordRoot), duration);
    const melodyEnvelope = Math.exp(-3.8 * beatPhase) * Math.min(1, beatPhase * 35);
    const bassEnvelope = 0.42 + 0.58 * Math.exp(-2.5 * (beat % 2));
    const pad = sine(padFrequency, time) * 0.16
      + sine(padFrequency * 1.5, time, 0.4) * 0.07
      + triangle(padFrequency * 2, time) * 0.035;
    const bass = (sine(bassFrequency, time) * 0.2 + triangle(bassFrequency, time) * 0.045) * bassEnvelope;
    const melody = (Math.sin(Math.PI * 2 * melodyFrequency * time + 0.06 * Math.sin(Math.PI * 2 * vibratoFrequency * time)) * 0.16
      + triangle(melodyFrequency * 2, time) * 0.035) * melodyEnvelope;
    const dulcimer = wholeBeat % 2 === 0
      ? sine(loopFrequency(midi(config.root + scale[(wholeBeat + trackIndex) % scale.length] + 12), duration), time) * Math.exp(-8 * beatPhase) * 0.08
      : 0;
    const drumPhase = beat % 4;
    const drumEnvelope = Math.exp(-18 * drumPhase);
    const drumAttack = Math.min(1, drumPhase * 40);
    const drumNoise = (sine(833 + trackIndex * 13, time, 0.7) + sine(1_387 + trackIndex * 17, time, -0.4)) * 0.5;
    const drum = config.intensity > 0.36
      ? (sine(78 - 25 * Math.min(1, drumPhase * 8), time) * 0.14 + drumNoise * 0.06) * drumEnvelope * drumAttack * config.intensity
      : 0;
    const air = (sine(997 + trackIndex * 7, time, 0.2) + sine(1_433 + trackIndex * 11, time, -0.6)) * 0.003 * (0.5 + config.intensity);
    samples[index] = Math.tanh((pad + bass + melody + dulcimer + drum + air) * (0.7 + config.intensity * 0.38));
  }
  return normalize(samples, 0.86);
}

function synthSfx(definition, index) {
  const duration = definition.durationMs / 1_000;
  const samples = new Float32Array(Math.max(1, Math.round(SAMPLE_RATE * duration)));
  const random = randomSource(stableSeed(definition.id));
  const ambienceHigh = definition.group === 'ambience'
    ? periodicNoisePartials(stableSeed(`${definition.id}-high`), duration, 20, 180, 9_500)
    : [];
  const ambienceLow = definition.group === 'ambience'
    ? periodicNoisePartials(stableSeed(`${definition.id}-low`), duration, 10, 18, 420)
    : [];
  const base = 90 + (stableSeed(definition.id) % 210);
  let smooth = 0;
  let previous = 0;

  for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
    const time = sampleIndex / SAMPLE_RATE;
    const progress = time / duration;
    const noise = random();
    smooth = smooth * 0.9 + noise * 0.1;
    const highNoise = noise - previous;
    previous = noise;
    const fast = Math.exp(-10 * progress);
    const sharp = Math.exp(-28 * progress);
    const body = Math.exp(-4.2 * progress);
    let value = 0;
    const design = definition.design;

    if (design === 'blade-light') value = highNoise * Math.sin(Math.PI * progress) * 0.34 + sine(1_100 + index * 37, time) * sharp * 0.3 + sine(230 + index * 9, time) * fast * 0.15;
    else if (design === 'blade-heavy') value = smooth * Math.sin(Math.PI * progress) * 0.25 + sine(72, time) * fast * 0.48 + triangle(480 + index * 21, time) * sharp * 0.22;
    else if (design === 'axe') value = noise * sharp * 0.34 + sine(86, time) * fast * 0.52 + sine(310 + index * 13, time) * Math.exp(-7 * progress) * 0.16;
    else if (design === 'mace') value = sine(58, time) * fast * 0.62 + smooth * sharp * 0.3 + triangle(205 + index * 11, time) * body * 0.13;
    else if (design === 'bow') value = triangle(180 - 80 * progress, time) * fast * 0.38 + sine(720, time) * sharp * 0.24 + highNoise * sharp * 0.1;
    else if (design === 'arrow-hit') value = noise * sharp * 0.38 + sine(105, time) * fast * 0.43 + sine(260 * (1 - progress * 0.35), time) * body * 0.15;
    else if (design === 'arrow-miss' || design === 'combat-miss') value = highNoise * Math.sin(Math.PI * progress) ** 1.6 * 0.5 + sine(520 - 260 * progress, time) * Math.sin(Math.PI * progress) * 0.06;
    else if (design === 'shield') value = sine(96, time) * fast * 0.54 + noise * sharp * 0.3 + sine(420 + index * 31, time) * body * 0.22;
    else if (design === 'parry') value = (sine(1_180 + index * 63, time) + sine(1_720 + index * 47, time)) * body * 0.19 + noise * sharp * 0.12;
    else if (design === 'armor') value = sine(145, time) * fast * 0.4 + (sine(560 + index * 22, time) + triangle(760, time)) * body * 0.14 + noise * sharp * 0.2;
    else if (design === 'guard') value = sine(82, time) * fast * 0.45 + noise * Math.exp(-22 * Math.abs(progress - 0.18)) * 0.22 + sine(285, time) * body * 0.12;
    else if (design.startsWith('magic-cast')) {
      const element = design.split('-').at(-1);
      const elementOffset = { fire: 40, ice: 310, lightning: 620, ward: 160, heal: 240, curse: -20 }[element] ?? 0;
      const frequency = Math.max(55, base + elementOffset + progress * (element === 'curse' ? -80 : 360));
      value = sine(frequency, time) * Math.sin(Math.PI * progress) * 0.38 + smooth * Math.sin(Math.PI * progress) * (element === 'fire' || element === 'lightning' ? 0.22 : 0.08);
    } else if (design.startsWith('magic-impact')) {
      const element = design.split('-').at(-1);
      const metal = element === 'ice' || element === 'ward';
      value = sine((metal ? 760 : 92) * (1 - progress * 0.45), time) * fast * 0.42 + noise * sharp * 0.28 + sine(base * 2.4, time) * body * 0.13;
    } else if (design.startsWith('status-')) {
      const negative = ['poison', 'bleed', 'burn', 'freeze', 'stun', 'debuff'].some((name) => design.endsWith(name));
      const steps = Math.floor(progress * 3);
      const frequency = base + (negative ? -steps * 22 : steps * 48);
      value = sine(Math.max(60, frequency), time) * Math.sin(Math.PI * progress) * 0.36 + smooth * fast * (negative ? 0.15 : 0.05);
      if (design.endsWith('burn')) value += noise * Math.sin(Math.PI * progress) * 0.2;
    } else if (design.startsWith('voice-')) {
      const death = design.endsWith('death');
      const species = design.split('-')[1];
      const speciesPitch = { goblin: 230, orc: 82, human: 145, beast: 110, undead: 72, boss: 58 }[species] ?? base;
      const contour = speciesPitch * (1 + (death ? -0.55 : 0.18) * progress);
      const voiceEnvelope = Math.sin(Math.PI * progress) ** 0.65;
      value = (saw(contour, time) * 0.2 + sine(contour * 2.1, time) * 0.16 + smooth * 0.18) * voiceEnvelope;
      if (species === 'undead') value += highNoise * voiceEnvelope * 0.12;
    } else if (design === 'boss-phase') value = sine(48 + 140 * progress, time) * Math.sin(Math.PI * progress) * 0.42 + noise * sharp * 0.25 + sine(530, time) * body * 0.15;
    else if (design.startsWith('ui-')) {
      const click = design === 'ui-tap' || design === 'ui-page' || design === 'ui-inventory' || design === 'ui-equip' || design === 'ui-unequip' || design === 'ui-consume' || design === 'ui-coins' || design === 'ui-buy' || design === 'ui-sell' || design === 'ui-loot' || design === 'ui-quest';
      const rising = !design.endsWith('back') && !design.endsWith('unequip') && !design.endsWith('sell');
      const frequency = base + (rising ? progress * 310 : (1 - progress) * 260);
      value = sine(frequency, time) * body * 0.35 + (click ? highNoise * sharp * 0.22 : 0);
      if (design === 'ui-level-up') value += sine(base * 2 ** (Math.floor(progress * 4) / 12), time) * Math.sin(Math.PI * progress) * 0.25;
    } else if (design === 'combat-critical') value = sine(62, time) * fast * 0.64 + noise * sharp * 0.34 + (sine(780, time) + sine(1_190, time)) * body * 0.17;
    else if (design.startsWith('combat-') || design.startsWith('narrative-')) {
      const falling = design.endsWith('defeat') || design.endsWith('warning') || design.endsWith('flee');
      const step = Math.floor(progress * 4);
      const frequency = base + (falling ? -step * 30 : step * 45);
      value = sine(Math.max(55, frequency), time) * Math.sin(Math.PI * progress) * 0.38 + smooth * sharp * 0.12;
      if (design === 'narrative-door') value += sine(52, time) * body * 0.36 + noise * Math.sin(Math.PI * progress) * 0.18;
      if (design === 'narrative-bell') value += (sine(118, time) + sine(237, time) * 0.5 + sine(351, time) * 0.25) * body * 0.32;
    } else if (design.startsWith('ambience-')) {
      const kind = design.slice('ambience-'.length);
      const cyclic = Math.sin(Math.PI * 2 * progress);
      const highBed = periodicNoise(ambienceHigh, time);
      const lowBed = periodicNoise(ambienceLow, time);
      value = kind === 'rain' ? highBed * 0.4 : lowBed * ({ forest: 0.14, flood: 0.24, forge: 0.18, siege: 0.12, keep: 0.08 }[kind] ?? 0.14);
      if (kind === 'forest') value += Math.sin(Math.PI * 2 * 1_100 * time + 0.8 * cyclic) * Math.max(0, cyclic) ** 12 * 0.08;
      if (kind === 'flood') value += Math.sin(Math.PI * 2 * 72 * time + 1.1 * cyclic) * 0.08;
      if (kind === 'forge') value += highBed * Math.max(0, sine(0.5, time)) * 0.1 + sine(84, time) * Math.max(0, sine(0.25, time)) * 0.08;
      if (kind === 'siege') value += sine(54, time) * Math.max(0, sine(0.375, time)) ** 16 * 0.22;
      if (kind === 'keep') value += sine(63, time) * 0.06 + sine(126, time) * 0.025;
    }

    const fade = definition.group === 'ambience'
      ? 1
      : Math.min(1, time / 0.006) * Math.min(1, (duration - time) / 0.025);
    samples[sampleIndex] = Math.tanh(value * 1.35) * fade;
  }
  return normalize(samples, definition.group === 'ambience' ? 0.66 : 0.9);
}

function wavBuffer(samples) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.allocUnsafe(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[index]) * 32_767), 44 + index * 2);
  }
  return buffer;
}

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }

function encode(wavPath, outputPath, kind) {
  const bitrate = kind === 'music' ? '48k' : '64k';
  const target = kind === 'music' ? '-18' : kind === 'ambience' ? '-22' : '-16';
  const result = spawnSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', wavPath,
    '-af', `loudnorm=I=${target}:TP=-1.5:LRA=9`, '-ac', '1', '-ar', String(SAMPLE_RATE),
    '-codec:a', 'libmp3lame', '-b:a', bitrate, outputPath,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${outputPath}: ${result.stderr.trim()}`);
}

function probeDuration(path) {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path,
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`ffprobe failed for ${path}: ${result.stderr.trim()}`);
  return Math.round(Number(result.stdout.trim()) * 1_000);
}

function probeLoudness(path) {
  const result = spawnSync('ffmpeg', [
    '-hide_banner', '-nostats', '-nostdin', '-i', path,
    '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-',
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Loudness probe failed for ${path}: ${result.stderr.trim()}`);
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const integrated = [...output.matchAll(/\bI:\s*(-?\d+(?:\.\d+)?)\s+LUFS/g)].at(-1);
  const peak = [...output.matchAll(/\bPeak:\s*(-?\d+(?:\.\d+)?)\s+dBFS/g)].at(-1);
  if (!integrated || !peak) throw new Error(`Could not parse loudness for ${path}.`);
  return { loudnessLufs: Number(integrated[1]), truePeakDbtp: Number(peak[1]) };
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

mkdirSync(WORK, { recursive: true });
mkdirSync(MUSIC_OUTPUT, { recursive: true });
mkdirSync(SFX_OUTPUT, { recursive: true });
mkdirSync(PRODUCTION, { recursive: true });

const provenance = [];
const musicAssets = [];
for (const [index, definition] of MUSIC.entries()) {
  const wavPath = resolve(WORK, `${definition.id}.wav`);
  const outputPath = resolve(MUSIC_OUTPUT, `${definition.id}.mp3`);
  const master = wavBuffer(synthMusic(definition, index));
  writeFileSync(wavPath, master);
  encode(wavPath, outputPath, 'music');
  const output = readFileSync(outputPath);
  const measured = probeLoudness(outputPath);
  const provenanceId = `provenance-${definition.id}`;
  provenance.push({
    id: provenanceId,
    assetId: definition.id,
    generator: 'morrowmere-procedural-audio-v1',
    creationDate: CREATED_AT,
    sourceMasterSha256: sha256(master),
    outputSha256: sha256(output),
    licenseBasis: LICENSE_BASIS,
    commercialDistribution: true,
    externalSource: null,
  });
  musicAssets.push({
    ...definition,
    src: `/audio/chronicle1/music/${definition.id}.mp3`,
    durationMs: probeDuration(outputPath),
    loopStartMs: 0,
    loopEndMs: 80_000,
    ...measured,
    bytes: output.byteLength,
    sha256: sha256(output),
    provenanceId,
  });
}

const sfxAssets = [];
for (const [index, definition] of SFX.entries()) {
  const wavPath = resolve(WORK, `${definition.id}.wav`);
  const outputPath = resolve(SFX_OUTPUT, `${definition.id}.mp3`);
  const master = wavBuffer(synthSfx(definition, index));
  writeFileSync(wavPath, master);
  encode(wavPath, outputPath, definition.group === 'ambience' ? 'ambience' : 'sfx');
  const output = readFileSync(outputPath);
  const measured = probeLoudness(outputPath);
  const provenanceId = `provenance-${definition.id}`;
  provenance.push({
    id: provenanceId,
    assetId: definition.id,
    generator: 'morrowmere-procedural-audio-v1',
    creationDate: CREATED_AT,
    sourceMasterSha256: sha256(master),
    outputSha256: sha256(output),
    licenseBasis: LICENSE_BASIS,
    commercialDistribution: true,
    externalSource: null,
  });
  sfxAssets.push({
    id: definition.id,
    group: definition.group,
    design: definition.design,
    brief: definition.brief,
    src: `/audio/chronicle1/sfx/${definition.id}.mp3`,
    durationMs: probeDuration(outputPath),
    loop: definition.group === 'ambience',
    ...measured,
    bytes: output.byteLength,
    sha256: sha256(output),
    provenanceId,
  });
}

const contentContract = JSON.parse(readFileSync(resolve(ROOT, 'content/manifests/chronicle1-media-contract.json'), 'utf8'));
const openingScript = OPENING_LINES.map((text, index) => ({
  id: `voice-opening-${String(index + 1).padStart(2, '0')}`,
  group: 'opening',
  speaker: 'Eldrin',
  startMs: OPENING_TIMES[index][0],
  endMs: OPENING_TIMES[index][1],
  spokenText: text,
  captionText: text,
  audioSrc: null,
  delivery: 'local-web-speech-fallback',
}));
const storyScript = contentContract.voiceCues.map((cue) => ({
  id: cue.id,
  group: cue.sceneId.includes('-companion-') ? 'companion' : 'main',
  sceneId: cue.sceneId,
  speaker: cue.speaker,
  spokenText: cue.text,
  captionText: cue.text,
  audioSrc: null,
  delivery: 'local-web-speech-fallback',
}));
const voiceProfiles = [
  ['Eldrin', 'en-GB', 0.86, 0.78], ['Mara', 'en-GB', 0.98, 0.92], ['Rukhar', 'en-GB', 0.86, 0.7],
  ['Caldus', 'en-GB', 0.9, 0.86], ['Lyra', 'en-GB', 0.96, 1.02], ['Talla', 'en-GB', 1.04, 1.08], ['Voss', 'en-GB', 0.82, 0.64],
].map(([speaker, lang, rate, pitch]) => ({
  speaker,
  local: { lang, rate, pitch },
  provider: { voiceId: null, modelId: 'eleven_v3', status: 'not-selected' },
}));

writeJson(resolve(PRODUCTION, 'music-briefs.json'), { version: 1, tracks: MUSIC });
writeJson(resolve(PRODUCTION, 'sfx-briefs.json'), { version: 1, cues: SFX });
writeJson(resolve(PRODUCTION, 'voice-script.json'), { version: 1, cues: [...openingScript, ...storyScript] });
writeJson(resolve(PRODUCTION, 'voice-profiles.json'), { version: 1, profiles: voiceProfiles });
writeJson(resolve(PRODUCTION, 'audio-provenance.json'), { version: 1, assets: provenance });
writeJson(resolve(PRODUCTION, 'audio-manifest.json'), {
  version: 1,
  codec: 'mp3',
  sampleRate: SAMPLE_RATE,
  channels: 1,
  measurement: {
    loudness: 'Post-encode EBU R128 integrated LUFS; -70 is the gate floor for very short cues.',
    peak: 'Post-encode EBU R128 true peak dBFS.',
  },
  music: musicAssets,
  sfx: sfxAssets,
});

process.stdout.write(`Generated ${musicAssets.length} music tracks and ${sfxAssets.length} SFX (${musicAssets.reduce((sum, asset) => sum + asset.bytes, 0) + sfxAssets.reduce((sum, asset) => sum + asset.bytes, 0)} bytes).\n`);
