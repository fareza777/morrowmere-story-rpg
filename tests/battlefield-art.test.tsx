import { fireEvent, render, screen } from '@testing-library/react';
import { GameShell } from '../src/components/GameShell';
import { BattlefieldArt } from '../src/components/BattlefieldArt';
import { CHRONICLE1_CONTENT } from '../src/game/content/chronicle1';
import type { ContentIndex } from '../src/game/content/schema';
import { createCampaign } from '../src/game/state/create';
import { reduceGame } from '../src/game/state/reducer';
import type { GameStateV2 } from '../src/game/state/types';
import type { UiSettings } from '../src/ui/types';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const SETTINGS: UiSettings = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic', screenReaderAnnouncements: true,
};

function directUnderworksCombat(): GameStateV2 {
  const updatedAt = '2026-09-24T00:00:00.000Z';
  const created = createCampaign({ heroClass: 'warden', seed: 29, chapterId: 'ch05', updatedAt }, CHRONICLE1_CONTENT);
  const started = reduceGame(created, { type: 'start-expedition', routeProfile: 'kings-road', updatedAt }, CHRONICLE1_CONTENT).state;
  const eventId = 'ch05-main-the-missing-shift';
  const atJunction: GameStateV2 = {
    ...started,
    expedition: {
      ...started.expedition!,
      position: { chapterId: 'ch05', slot: 8 },
      currentSceneId: eventId,
      authoredSceneQueue: [],
      sceneResolution: {
        eventId, choiceId: null, resultKind: 'direct', chance: null, roll: null,
        outcome: 'The workers are clear of the cage line.', effectSummary: [], nextSceneId: null, continueLabel: null,
      },
      director: { ...started.expedition!.director, seenEventIds: [...started.expedition!.director.seenEventIds, eventId] },
    },
    flow: { ...started.flow, screen: 'story' },
  };
  const activated = reduceGame(atJunction, { type: 'select-next-scene', updatedAt }, CHRONICLE1_CONTENT);
  const entered = reduceGame(activated.state, {
    type: 'select-route', junctionId: 'ch05-embervault-descent', optionId: 'ch05-descend-into-the-underworks', updatedAt,
  }, CHRONICLE1_CONTENT);
  return entered.state;
}

function renderShell(state: GameStateV2, content: ContentIndex = CHRONICLE1_CONTENT) {
  return render(<GameShell
    state={state}
    content={content}
    transitionEvents={[]}
    dispatch={() => undefined}
    onSaveAndExit={() => undefined}
    onMainMenu={() => undefined}
    onReplayOpening={() => undefined}
    settings={SETTINGS}
    onSettingsChange={() => undefined}
    now={() => '2026-09-24T00:00:00.000Z'}
  />);
}

describe('battlefield art', () => {
  beforeEach(() => {
    window.localStorage.setItem('morrowmere.tutorials.v1', JSON.stringify({ skipped: true, seen: [] }));
  });

  it('renders the mapped battlefield asset with its descriptive alt text', () => {
    render(<BattlefieldArt illustrationId="enc-ch01-tollhouse-lookouts" alt="Lookouts in the tollhouse culvert." />);

    expect(screen.getByRole('img', { name: 'Lookouts in the tollhouse culvert.' }))
      .toHaveAttribute('src', '/assets/chronicle1/battles/enc-ch01-tollhouse-lookouts.webp');
  });

  it('shows the supplied chapter scene art once when the battlefield asset fails', () => {
    const { container } = render(<BattlefieldArt
      illustrationId="enc-ch01-tollhouse-lookouts"
      alt="Lookouts in the tollhouse culvert."
      fallbackIllustrationId="scene-ch01-main-the-empty-tollhouse"
      fallbackAlt="An abandoned tollhouse stands over the road."
    />);

    fireEvent.error(screen.getByRole('img', { name: 'Lookouts in the tollhouse culvert.' }));

    expect(container.querySelectorAll('.scene-art')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'An abandoned tollhouse stands over the road.' }))
      .toHaveAttribute('src', '/assets/chronicle1/scenes/ch01/scene-ch01-main-the-empty-tollhouse.webp');
    expect(container.querySelectorAll('.battlefield-art')).toHaveLength(0);
  });

  it('does not invent another image source when direct combat has no story-art fallback', () => {
    const { container } = render(<BattlefieldArt illustrationId="enc-ch01-tollhouse-lookouts" alt="Lookouts in the tollhouse culvert." />);

    fireEvent.error(screen.getByRole('img', { name: 'Lookouts in the tollhouse culvert.' }));

    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelectorAll('.scene-art')).toHaveLength(0);
  });

  it('resets the missing-art state when a new encounter starts', () => {
    const { rerender } = render(<BattlefieldArt illustrationId="enc-ch01-tollhouse-lookouts" alt="Lookouts in the tollhouse culvert." />);
    fireEvent.error(screen.getByRole('img', { name: 'Lookouts in the tollhouse culvert.' }));

    rerender(<BattlefieldArt illustrationId="enc-ch01-orchard-raiders" alt="Raiders close in through the orchard." />);

    expect(screen.getByRole('img', { name: 'Raiders close in through the orchard.' }))
      .toHaveAttribute('src', '/assets/chronicle1/battles/enc-ch01-orchard-raiders.webp');
  });

  it('shows the active dungeon battlefield above combat while preserving enemy targets', () => {
    const state = directUnderworksCombat();
    const activeEncounter = CHRONICLE1_CONTENT.encounters.get(state.expedition!.currentCombat!.encounterId)!;
    expect(state.flow.screen).toBe('combat');
    expect(state.expedition?.currentSceneId).toBeNull();
    expect(activeEncounter.battlefieldArtId).toBeTruthy();

    const { container } = renderShell(state);

    const battlefield = screen.getByRole('img', { name: activeEncounter.battlefieldArtAlt! });
    const combatPanel = container.querySelector('.combat-panel')!;
    expect(battlefield).toHaveAttribute('src', `/assets/chronicle1/battles/${activeEncounter.battlefieldArtId}.webp`);
    expect(battlefield.closest('.battlefield-art')!.compareDocumentPosition(combatPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Target / })).toHaveLength(activeEncounter.enemyIds.length);
  });

  it('keeps the existing story illustration when the encounter has no battlefield metadata', () => {
    const state = makeUiGame({ screen: 'combat' });
    const { container } = renderShell(state, UI_CONTENT);

    expect(container.querySelector('.scene-art img')).toHaveAttribute('src', '/assets/chronicle1/scenes/ch01/ui-story-art.webp');
    expect(container.querySelector('.battlefield-art')).toBeNull();
  });

  it('does not invent story art for a direct dungeon fight if battlefield metadata is absent', () => {
    const state = directUnderworksCombat();
    const encounter = CHRONICLE1_CONTENT.encounters.get(state.expedition!.currentCombat!.encounterId)!;
    const encounters = new Map(CHRONICLE1_CONTENT.encounters);
    encounters.set(encounter.id, { ...encounter, battlefieldArtId: undefined, battlefieldArtAlt: undefined });
    const content: ContentIndex = { ...CHRONICLE1_CONTENT, encounters };
    const { container } = renderShell(state, content);

    expect(state.expedition?.currentSceneId).toBeNull();
    expect(container.querySelector('.scene-art')).toBeNull();
    expect(container.querySelector('.battlefield-art')).toBeNull();
  });
});
