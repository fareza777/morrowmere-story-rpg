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

const CHAPTER_FALLBACKS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ch01: ['scene-ch01-main-a-banner-placed-too-neatly', 'scene-ch01-main-before-the-gates-close', 'scene-ch01-main-medicine-for-the-north', 'scene-ch01-main-the-bridge-in-smoke', 'scene-ch01-main-the-empty-tollhouse', 'scene-ch01-main-the-first-arrow', 'scene-ch01-main-three-days-to-greywatch'],
  ch02: ['scene-ch02-main-greywatch-council', 'scene-ch02-main-hold-the-south-gate', 'scene-ch02-main-raiders-at-the-wall', 'scene-ch02-main-the-hidden-depot', 'scene-ch02-main-the-royal-fletching', 'scene-ch02-main-the-witness-speaks', 'scene-ch02-main-warning-before-dawn'],
  ch03: ['scene-ch03-main-evidence-on-both-sides', 'scene-ch03-main-orders-for-redwater', 'scene-ch03-main-redwater-in-sight', 'scene-ch03-main-rukhar-at-the-crossing', 'scene-ch03-main-the-attack-with-two-banners', 'scene-ch03-main-the-captured-courier', 'scene-ch03-main-the-flooded-mile'],
  ch04: ['scene-ch04-main-before-the-first-charge', 'scene-ch04-main-orders-written-to-be-found', 'scene-ch04-main-parley-between-lines', 'scene-ch04-main-terms-at-redwater', 'scene-ch04-main-the-murdered-scout', 'scene-ch04-main-two-armies-one-field', 'scene-ch04-main-what-the-river-carried-away'],
  ch05: ['scene-ch05-main-escape-through-the-cinder-shaft', 'scene-ch05-main-forge-behind-the-wall', 'scene-ch05-main-the-missing-shift', 'scene-ch05-main-the-mouth-of-embervault', 'scene-ch05-main-the-name-severin-voss', 'scene-ch05-main-the-quartermasters-ledger', 'scene-ch05-main-weapons-for-both-armies'],
  ch06: ['scene-ch06-main-hostages-under-the-chapel', 'scene-ch06-main-smoke-over-greywatch', 'scene-ch06-main-the-last-open-breach', 'scene-ch06-main-the-leak-in-the-watch', 'scene-ch06-main-the-message-that-broke', 'scene-ch06-main-the-siege-begins', 'scene-ch06-main-what-remains-of-greywatch'],
  ch07: ['scene-ch07-main-banners-on-the-kingroad', 'scene-ch07-main-council-before-the-march', 'scene-ch07-main-inside-the-keep', 'scene-ch07-main-the-crownless-gate', 'scene-ch07-main-the-outer-patrol', 'scene-ch07-main-voss-last-champion', 'scene-ch07-main-wall-or-hidden-way'],
  ch08: ['scene-ch08-main-evidence-before-the-realm', 'scene-ch08-main-guests-for-a-false-king', 'scene-ch08-main-the-hall-of-seals', 'scene-ch08-main-the-letter-in-cipher', 'scene-ch08-main-the-marshal-and-the-banner', 'scene-ch08-main-voss-offers-order', 'scene-ch08-main-who-keeps-the-crownless-keep'],
});
const MERCHANT_FALLBACKS = ['merchant-apothecary', 'merchant-blacksmith', 'merchant-goblin-broker', 'merchant-quartermaster', 'merchant-relic-dealer', 'merchant-road-trader'] as const;

function stableIndex(value: string, length: number): number {
  return [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0) % length;
}

export function illustrationFallbackSource(illustrationId: string, kind: 'scene' | 'merchant' = 'scene'): string {
  if (kind === 'merchant') {
    let fallback = MERCHANT_FALLBACKS[stableIndex(illustrationId, MERCHANT_FALLBACKS.length)]!;
    if (fallback === illustrationId) fallback = MERCHANT_FALLBACKS[(MERCHANT_FALLBACKS.indexOf(fallback) + 1) % MERCHANT_FALLBACKS.length]!;
    return `/assets/chronicle1/merchants/${fallback}.webp`;
  }
  const chapter = illustrationId.match(/(?:scene-)?(ch\d{2})-/u)?.[1] ?? 'ch01';
  const available = CHAPTER_FALLBACKS[chapter] ?? CHAPTER_FALLBACKS.ch01!;
  let fallback = available[stableIndex(illustrationId, available.length)]!;
  if (fallback === illustrationId) fallback = available[(available.indexOf(fallback) + 1) % available.length]!;
  return `/assets/chronicle1/scenes/${chapter in CHAPTER_FALLBACKS ? chapter : 'ch01'}/${fallback}.webp`;
}

export function SceneArt({ illustrationId, alt, kind = 'scene' }: SceneArtProps) {
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setAttempt(0), [illustrationId, kind]);
  const sources = [illustrationSource(illustrationId, kind), illustrationFallbackSource(illustrationId, kind)];
  return (
    <figure className="scene-art" data-illustration-id={illustrationId}>
      {attempt < sources.length
        ? <img src={sources[attempt]} alt={alt} onError={() => setAttempt((current) => current + 1)} />
        : <div className="scene-art-fallback" role="img" aria-label={alt}><span aria-hidden="true">M</span></div>}
    </figure>
  );
}
