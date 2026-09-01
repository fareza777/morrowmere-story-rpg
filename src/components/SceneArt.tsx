import { useEffect, useState } from 'react';

interface SceneArtProps {
  readonly illustrationId: string;
  readonly alt: string;
  readonly kind?: 'scene' | 'merchant';
}

export function illustrationSource(illustrationId: string, kind: 'scene' | 'merchant' = 'scene'): string {
  if (kind === 'merchant') return `/assets/chronicle1/merchants/${illustrationId}.webp`;
  const chapter = illustrationId.match(/scene-(ch\d{2})-/u)?.[1] ?? 'ch01';
  return `/assets/chronicle1/scenes/${chapter}/${illustrationId}.webp`;
}

interface SemanticArtwork {
  readonly source: string;
  readonly cues: readonly string[];
}

const sceneSource = (chapter: string, id: string) => `/assets/chronicle1/scenes/${chapter}/${id}.webp`;

const CHAPTER_ARTWORK: Readonly<Record<string, readonly SemanticArtwork[]>> = Object.freeze({
  ch01: [
    { source: '/assets/chronicle1/hubs/road-camp-morning.webp', cues: ['first-night-camp', 'camp', 'rest', 'morning'] },
    { source: '/assets/chronicle1/hubs/three-roads-crossroads.webp', cues: ['road', 'roads', 'route', 'crossroads', 'track', 'path', 'mile', 'uphill'] },
    { source: '/assets/chronicle1/merchants/merchant-apothecary.webp', cues: ['apothecary', 'herbalist'] },
    { source: '/assets/chronicle1/merchants/merchant-blacksmith.webp', cues: ['orrens-charcoal-wagon', 'charcoal-wagon'] },
    { source: sceneSource('ch01', 'scene-ch01-main-the-bridge-in-smoke'), cues: ['bridge', 'burning-bridge', 'smoke-on-the-bridge', 'ferryman', 'ferry', 'rope', 'reedbank'] },
    { source: sceneSource('ch01', 'scene-ch01-main-the-empty-tollhouse'), cues: ['tollhouse', 'toll-collector', 'register', 'cellar'] },
    { source: sceneSource('ch01', 'scene-ch01-main-the-first-arrow'), cues: ['arrow', 'volley', 'orchard', 'shaft-mark', 'bow'] },
    { source: sceneSource('ch01', 'scene-ch01-main-medicine-for-the-north'), cues: ['medicine', 'wounded', 'surgery', 'healer', 'patient'] },
    { source: sceneSource('ch01', 'scene-ch01-main-a-banner-placed-too-neatly'), cues: ['banner', 'officer', 'clean-boots'] },
    { source: sceneSource('ch01', 'scene-ch01-main-before-the-gates-close'), cues: ['gate', 'gates', 'greywatch-lanterns', 'closed-north'] },
    { source: sceneSource('ch01', 'scene-ch01-main-three-days-to-greywatch'), cues: ['wagon', 'caravan', 'greywatch', 'journey'] },
  ],
  ch02: [
    { source: '/assets/chronicle1/merchants/merchant-blacksmith.webp', cues: ['dorrans-wall-forge'] },
    { source: '/assets/chronicle1/merchants/merchant-quartermaster.webp', cues: ['quartermaster-coles-yard'] },
    { source: sceneSource('ch02', 'scene-ch02-main-raiders-at-the-wall'), cues: ['raider', 'raiders', 'ladder', 'ladders', 'north-wall', 'wall'] },
    { source: sceneSource('ch02', 'scene-ch02-main-hold-the-south-gate'), cues: ['south-gate', 'gate', 'sapper', 'granary', 'defend'] },
    { source: sceneSource('ch02', 'scene-ch02-main-the-hidden-depot'), cues: ['depot', 'armory', 'cistern', 'quarry', 'receiving-book', 'underwall'] },
    { source: sceneSource('ch02', 'scene-ch02-main-the-royal-fletching'), cues: ['fletching', 'arrow', 'shaft', 'bench'] },
    { source: sceneSource('ch02', 'scene-ch02-main-the-witness-speaks'), cues: ['witness', 'widow', 'missing-son', 'refugee', 'testimony'] },
    { source: sceneSource('ch02', 'scene-ch02-main-greywatch-council'), cues: ['council', 'command', 'passage', 'seal'] },
    { source: sceneSource('ch02', 'scene-ch02-main-warning-before-dawn'), cues: ['warning', 'dawn', 'signal', 'horn', 'bell', 'rooftop'] },
  ],
  ch03: [
    { source: sceneSource('ch03', 'scene-ch03-main-the-flooded-mile'), cues: ['flood', 'flooded', 'water', 'ferry', 'boat', 'reed', 'causeway', 'chapel'] },
    { source: sceneSource('ch03', 'scene-ch03-main-the-captured-courier'), cues: ['courier', 'prisoner', 'testimony'] },
    { source: sceneSource('ch03', 'scene-ch03-main-rukhar-at-the-crossing'), cues: ['rukhar', 'orc', 'crossing'] },
    { source: sceneSource('ch03', 'scene-ch03-main-evidence-on-both-sides'), cues: ['evidence', 'track', 'thread', 'letter', 'archive'] },
    { source: sceneSource('ch03', 'scene-ch03-main-the-attack-with-two-banners'), cues: ['attack', 'banner', 'rearguard', 'patrol', 'arrow'] },
    { source: sceneSource('ch03', 'scene-ch03-main-redwater-in-sight'), cues: ['redwater-in-sight', 'levee', 'storm'] },
    { source: sceneSource('ch03', 'scene-ch03-main-orders-for-redwater'), cues: ['order', 'orders', 'redwater', 'roadbook'] },
  ],
  ch04: [
    { source: sceneSource('ch04', 'scene-ch04-main-before-the-first-charge'), cues: ['charge', 'war-oxen'] },
    { source: sceneSource('ch04', 'scene-ch04-main-orders-written-to-be-found'), cues: ['order', 'orders', 'warehouse', 'arson'] },
    { source: sceneSource('ch04', 'scene-ch04-main-parley-between-lines'), cues: ['parley', 'parley-rope', 'negotiation'] },
    { source: sceneSource('ch04', 'scene-ch04-main-terms-at-redwater'), cues: ['terms', 'truce', 'peace', 'retaliation'] },
    { source: sceneSource('ch04', 'scene-ch04-main-the-murdered-scout'), cues: ['murdered', 'scout', 'dead'] },
    { source: sceneSource('ch04', 'scene-ch04-main-two-armies-one-field'), cues: ['armies', 'army', 'field', 'pikes'] },
    { source: sceneSource('ch04', 'scene-ch04-main-what-the-river-carried-away'), cues: ['river', 'millrace', 'flood'] },
  ],
  ch05: [
    { source: '/assets/chronicle1/merchants/merchant-relic-dealer.webp', cues: ['omarens-relic-bench', 'relic-bench'] },
    { source: '/assets/chronicle1/merchants/merchant-goblin-broker.webp', cues: ['vekkas-boiler-room-market', 'boiler-room-market'] },
    { source: sceneSource('ch05', 'scene-ch05-main-forge-behind-the-wall'), cues: ['forge', 'forgemaster', 'smith', 'furnace', 'catwalk', 'boiler'] },
    { source: sceneSource('ch05', 'scene-ch05-main-the-quartermasters-ledger'), cues: ['ledger', 'audit', 'accounting', 'ink', 'seal'] },
    { source: sceneSource('ch05', 'scene-ch05-main-the-missing-shift'), cues: ['missing-shift', 'missing-smith', 'jailer', 'hostage', 'shift'] },
    { source: sceneSource('ch05', 'scene-ch05-main-escape-through-the-cinder-shaft'), cues: ['escape', 'cinder-shaft', 'feeder-shaft', 'tunnel', 'gallery', 'waterwheel', 'descent'] },
    { source: sceneSource('ch05', 'scene-ch05-main-weapons-for-both-armies'), cues: ['weapon', 'weapons', 'armory', 'convoy', 'charges'] },
    { source: sceneSource('ch05', 'scene-ch05-main-the-name-severin-voss'), cues: ['severin', 'voss', 'name'] },
    { source: sceneSource('ch05', 'scene-ch05-main-the-mouth-of-embervault'), cues: ['embervault', 'mouth', 'ridge', 'entrance'] },
  ],
  ch06: [
    { source: sceneSource('ch06', 'scene-ch06-main-hostages-under-the-chapel'), cues: ['hostage', 'hostages', 'chapel', 'ossuary', 'jailer', 'cellar'] },
    { source: sceneSource('ch06', 'scene-ch06-main-the-siege-begins'), cues: ['siege', 'army', 'assault'] },
    { source: sceneSource('ch06', 'scene-ch06-main-the-last-open-breach'), cues: ['breach', 'ram', 'ditch', 'sally-port', 'culvert', 'west-wall'] },
    { source: sceneSource('ch06', 'scene-ch06-main-the-message-that-broke'), cues: ['message', 'cipher', 'signal', 'relay', 'order', 'map'] },
    { source: sceneSource('ch06', 'scene-ch06-main-the-leak-in-the-watch'), cues: ['leak', 'confession', 'ward-leaders', 'record'] },
    { source: sceneSource('ch06', 'scene-ch06-main-smoke-over-greywatch'), cues: ['smoke', 'burned', 'farm', 'fields'] },
    { source: sceneSource('ch06', 'scene-ch06-main-what-remains-of-greywatch'), cues: ['remains', 'retreat', 'wounded', 'medicine-wagon', 'rear-guard'] },
  ],
  ch07: [
    { source: sceneSource('ch07', 'scene-ch07-main-banners-on-the-kingroad'), cues: ['banner', 'banners', 'kingroad', 'march'] },
    { source: sceneSource('ch07', 'scene-ch07-main-council-before-the-march'), cues: ['council', 'planning'] },
    { source: sceneSource('ch07', 'scene-ch07-main-inside-the-keep'), cues: ['inside', 'keep', 'courtyard'] },
    { source: sceneSource('ch07', 'scene-ch07-main-the-crownless-gate'), cues: ['crownless', 'gate'] },
    { source: sceneSource('ch07', 'scene-ch07-main-voss-last-champion'), cues: ['voss', 'champion'] },
    { source: sceneSource('ch07', 'scene-ch07-main-wall-or-hidden-way'), cues: ['wall', 'hidden-way', 'tunnel', 'passage'] },
    { source: sceneSource('ch07', 'scene-ch07-main-the-outer-patrol'), cues: ['outer', 'patrol', 'approach'] },
  ],
  ch08: [
    { source: '/assets/chronicle1/merchants/merchant-blacksmith.webp', cues: ['orrens-courtyard-forge', 'courtyard-forge'] },
    { source: sceneSource('ch08', 'scene-ch08-main-evidence-before-the-realm'), cues: ['evidence', 'audit', 'inventory', 'record', 'archive', 'witness', 'case'] },
    { source: sceneSource('ch08', 'scene-ch08-main-who-keeps-the-crownless-keep'), cues: ['keep', 'lower-ward', 'ward', 'courtyard', 'keys'] },
    { source: sceneSource('ch08', 'scene-ch08-main-the-hall-of-seals'), cues: ['hall', 'seal', 'seals', 'processional', 'stair'] },
    { source: sceneSource('ch08', 'scene-ch08-main-the-letter-in-cipher'), cues: ['letter', 'cipher', 'ledger', 'lock'] },
    { source: sceneSource('ch08', 'scene-ch08-main-the-marshal-and-the-banner'), cues: ['marshal', 'banner', 'standard-bearer', 'command-platform'] },
    { source: sceneSource('ch08', 'scene-ch08-main-voss-offers-order'), cues: ['voss', 'order', 'promise'] },
    { source: sceneSource('ch08', 'scene-ch08-main-guests-for-a-false-king'), cues: ['guest', 'guests', 'delegate', 'family', 'barracks'] },
  ],
});

const SAFE_CHAPTER_ARTWORK: Readonly<Record<string, string>> = Object.freeze({
  ch01: '/assets/chronicle1/hubs/three-roads-crossroads.webp',
  ch02: sceneSource('ch02', 'scene-ch02-main-warning-before-dawn'),
  ch03: sceneSource('ch03', 'scene-ch03-main-orders-for-redwater'),
  ch04: sceneSource('ch04', 'scene-ch04-main-parley-between-lines'),
  ch05: sceneSource('ch05', 'scene-ch05-main-the-mouth-of-embervault'),
  ch06: sceneSource('ch06', 'scene-ch06-main-smoke-over-greywatch'),
  ch07: sceneSource('ch07', 'scene-ch07-main-the-outer-patrol'),
  ch08: sceneSource('ch08', 'scene-ch08-main-the-hall-of-seals'),
});

const SECONDARY_CHAPTER_ARTWORK: Readonly<Record<string, string>> = Object.freeze({
  ch01: '/assets/chronicle1/hubs/road-camp-morning.webp',
  ch02: sceneSource('ch02', 'scene-ch02-main-raiders-at-the-wall'),
  ch03: sceneSource('ch03', 'scene-ch03-main-the-flooded-mile'),
  ch04: sceneSource('ch04', 'scene-ch04-main-terms-at-redwater'),
  ch05: sceneSource('ch05', 'scene-ch05-main-forge-behind-the-wall'),
  ch06: sceneSource('ch06', 'scene-ch06-main-the-siege-begins'),
  ch07: sceneSource('ch07', 'scene-ch07-main-the-crownless-gate'),
  ch08: sceneSource('ch08', 'scene-ch08-main-who-keeps-the-crownless-keep'),
});
const MERCHANT_FALLBACKS = ['merchant-apothecary', 'merchant-blacksmith', 'merchant-goblin-broker', 'merchant-quartermaster', 'merchant-relic-dealer', 'merchant-road-trader'] as const;

function stableIndex(value: string, length: number): number {
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % length;
}

function semanticScore(illustrationId: string, cues: readonly string[]): number {
  const normalizedId = `-${illustrationId.toLowerCase().replace(/[^a-z0-9]+/gu, '-')}-`;
  return cues.reduce((score, cue) => {
    const normalizedCue = cue.toLowerCase().replace(/[^a-z0-9]+/gu, '-');
    return normalizedId.includes(`-${normalizedCue}-`)
      ? score + normalizedCue.split('-').length
      : score;
  }, 0);
}

function semanticSceneFallback(illustrationId: string, chapter: string): string {
  const candidates = CHAPTER_ARTWORK[chapter] ?? [];
  const authoredSource = illustrationSource(illustrationId);
  let bestSource: string | undefined;
  let bestScore = 0;

  for (const candidate of candidates) {
    if (candidate.source === authoredSource) continue;
    const score = semanticScore(illustrationId, candidate.cues);
    if (score > bestScore) {
      bestScore = score;
      bestSource = candidate.source;
    }
  }

  if (bestSource) return bestSource;
  const safeSource = SAFE_CHAPTER_ARTWORK[chapter] ?? SAFE_CHAPTER_ARTWORK.ch01!;
  return safeSource === authoredSource
    ? (SECONDARY_CHAPTER_ARTWORK[chapter] ?? SECONDARY_CHAPTER_ARTWORK.ch01!)
    : safeSource;
}

export function illustrationFallbackSource(illustrationId: string, kind: 'scene' | 'merchant' = 'scene'): string {
  if (kind === 'merchant') {
    let fallback = MERCHANT_FALLBACKS[stableIndex(illustrationId, MERCHANT_FALLBACKS.length)]!;
    if (fallback === illustrationId) fallback = MERCHANT_FALLBACKS[(MERCHANT_FALLBACKS.indexOf(fallback) + 1) % MERCHANT_FALLBACKS.length]!;
    return `/assets/chronicle1/merchants/${fallback}.webp`;
  }
  const chapter = illustrationId.match(/(?:scene-)?(ch\d{2})-/u)?.[1] ?? 'ch01';
  return semanticSceneFallback(illustrationId, chapter);
}

export function SceneArt({ illustrationId, alt, kind = 'scene' }: SceneArtProps) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setAttempt(0), [illustrationId, kind]);
  const sources = [illustrationSource(illustrationId, kind), illustrationFallbackSource(illustrationId, kind)];
  return (
    <figure className="scene-art" data-illustration-id={illustrationId}>
      {attempt < sources.length
        ? <img src={sources[attempt]} alt={alt} width={1536} height={1024} onError={() => setAttempt((current) => current + 1)} />
        : <div className="scene-art-fallback" role="img" aria-label={alt}><span aria-hidden="true">M</span></div>}
    </figure>
  );
}
