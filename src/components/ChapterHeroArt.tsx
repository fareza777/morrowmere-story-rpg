import { useState } from 'react';

interface ChapterHeroArtProps {
  readonly chapterLabel: string;
  readonly context: 'camp' | 'route';
}

interface RegionalHero {
  readonly source: string;
  readonly alt: string;
}

const GLOAMWOOD_HERO: RegionalHero = {
  source: '/assets/backgrounds/gloamwood.webp',
  alt: 'Morrowmere landscape: a sunlit forest road beneath a ruined arch.',
};

const CHAPTER_ONE_HEROES: Readonly<Record<ChapterHeroArtProps['context'], RegionalHero>> = Object.freeze({
  camp: {
    source: '/assets/chronicle1/hubs/road-camp-morning.webp',
    alt: 'A lone traveller prepares two medicine wagons at a bright road camp overlooking Greywatch.',
  },
  route: {
    source: '/assets/chronicle1/hubs/three-roads-crossroads.webp',
    alt: 'A lone traveller studies three sunlit roads dividing at a country crossroads.',
  },
});

const REGIONAL_HEROES: Readonly<Record<number, RegionalHero>> = Object.freeze({
  1: GLOAMWOOD_HERO,
  2: GLOAMWOOD_HERO,
  3: { source: '/assets/backgrounds/drowned-road.webp', alt: 'Morrowmere landscape: a pale causeway crossing the Drowned Road.' },
  4: { source: '/assets/backgrounds/drowned-road.webp', alt: 'Morrowmere landscape: a pale causeway crossing the Drowned Road.' },
  5: { source: '/assets/backgrounds/embervault.webp', alt: 'Morrowmere landscape: a bright forge hall inside Embervault.' },
  6: GLOAMWOOD_HERO,
  7: { source: '/assets/backgrounds/crownless-keep.webp', alt: 'Morrowmere landscape: the sunlit hall of the Crownless Keep.' },
  8: { source: '/assets/backgrounds/crownless-keep.webp', alt: 'Morrowmere landscape: the sunlit hall of the Crownless Keep.' },
});

function regionalHero(chapterLabel: string, context: ChapterHeroArtProps['context']): RegionalHero {
  const chapter = Number(chapterLabel.match(/\d+/u)?.[0] ?? 1);
  if (chapter === 1) return CHAPTER_ONE_HEROES[context];
  return REGIONAL_HEROES[chapter] ?? GLOAMWOOD_HERO;
}

export function ChapterHeroArt({ chapterLabel, context }: ChapterHeroArtProps) {
  const hero = regionalHero(chapterLabel, context);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const failed = failedSource === hero.source;

  return (
    <figure className={`screen-hero screen-hero--${context}`}>
      {failed
        ? <div className="screen-hero-fallback" role="img" aria-label={hero.alt}><span aria-hidden="true">M</span></div>
        : <img src={hero.source} alt={hero.alt} width={1536} height={1024} onError={() => setFailedSource(hero.source)} />}
    </figure>
  );
}
