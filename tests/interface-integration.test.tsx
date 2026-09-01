import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo, useState } from 'react';
import { GameShell } from '../src/components/GameShell';
import { OpeningCinematic } from '../src/components/cinematic/OpeningCinematic';
import { NewRunScreen } from '../src/components/NewRunScreen';
import { OnboardingScreen } from '../src/components/OnboardingScreen';
import { RewardPanel } from '../src/components/RewardPanel';
import { TitleScreen } from '../src/components/TitleScreen';
import type { ChronicleEvent, ContentIndex } from '../src/game/content/schema';
import type { ChoiceId, EventId } from '../src/game/domain/ids';
import { createSaveRepository, saveActiveKey } from '../src/game/persistence/repository';
import type { GameStateV2 } from '../src/game/state/types';
import { OPENING_SEQUENCE } from '../src/ui/openingSequence';
import type { CinematicAudioPort, UiPorts, UiSettings } from '../src/ui/types';
import { useGameSession } from '../src/ui/useGameSession';
import { UI_CONTENT } from './fixtures/ui';

const SETTINGS: UiSettings = {
  textScale: 1, highContrast: false, reducedMotion: true, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic', screenReaderAnnouncements: true,
};

const audio: CinematicAudioPort = {
  async preload() {}, async play() {}, pause() {}, seek() {}, stop() {}, setVolumes() {},
};

function authoredEvent(value: Omit<ChronicleEvent, 'id'> & { readonly id: string }): ChronicleEvent {
  return value as ChronicleEvent;
}

const ARRIVAL = authoredEvent({
  id: 'integration-arrival', chapterId: 'ch01', type: 'main', family: 'integration-arrival', anchorOrder: 1,
  illustrationId: 'scene-ch01-main-the-first-arrow', title: 'The First Road', narrative: ['A wounded scout asks for help before Greywatch closes its gates.'],
  eligibility: {}, cooldownRuns: 0, oneShot: true,
  choices: [{
    id: 'integration-help' as ChoiceId, label: 'Help the scout', detail: 'Share supplies and ask Mara to guide the road.', outcome: 'Mara agrees to travel after you secure the next camp.',
    effects: [
      { type: 'flag', operation: 'add', flagId: 'spared-mara' as never },
      { type: 'companion-quest', companionId: 'mara' as never, stage: 3 },
      { type: 'companion-loyalty', companionId: 'mara' as never, amount: 35 },
      { type: 'companion', operation: 'recruit', companionId: 'mara' as never },
      { type: 'item', operation: 'grant', itemId: 'potion-red' as never, quantity: 2 },
      { type: 'item', operation: 'grant', itemId: 'iron-sword' as never, quantity: 1 },
      { type: 'gold', scope: 'unbanked', amount: 30 },
    ],
  }],
});

const SAFE_HUB = authoredEvent({
  id: 'integration-hub', chapterId: 'ch01', slot: 2, type: 'hub', family: 'integration-hub', pacing: 'recovery', weight: 100,
  illustrationId: 'merchant-road-trader', title: 'Milestone Camp', narrative: ['A road trader shares the fire beside a guarded milestone.'],
  eligibility: { requiredFlags: ['spared-mara'] }, cooldownRuns: 0, oneShot: true, merchantId: 'road-trader' as never, merchantRestockKey: 'integration-road-trader',
  choices: [{
    id: 'integration-prepare' as ChoiceId, label: 'Prepare the second road', detail: 'Bank the evidence and mark the ambush route.', outcome: 'The route is marked for dawn.',
    effects: [{ type: 'flag', operation: 'add', flagId: 'integration-second-road' as never }],
  }],
});

const AMBUSH = authoredEvent({
  id: 'integration-ambush', chapterId: 'ch01', slot: 1, type: 'combat', family: 'integration-ambush', pacing: 'danger', weight: 100,
  illustrationId: 'scene-ch01-main-the-bridge-in-smoke', title: 'Ambush at the Cut Hedge', narrative: ['Three raiders rise from the drainage ditch and block the marked road.'],
  eligibility: { requiredFlags: ['integration-second-road'] }, cooldownRuns: 0, oneShot: false,
  choices: [{
    id: 'integration-fight' as ChoiceId, label: 'Hold the road', detail: 'Choose a target and keep the medicine cart behind you.', outcome: 'Steel answers from the ditch.',
    effects: [{ type: 'combat', encounterId: 'ui-road-ambush' as never }],
  }],
});

const CONTENT: ContentIndex = {
  ...UI_CONTENT,
  events: new Map([ARRIVAL, SAFE_HUB, AMBUSH].map((event) => [event.id as EventId, event])),
  artIds: new Set([ARRIVAL.illustrationId, SAFE_HUB.illustrationId, AMBUSH.illustrationId]),
};

function savedSlotTwo(): GameStateV2 {
  const raw = window.localStorage.getItem(saveActiveKey(2));
  expect(raw).not.toBeNull();
  return (JSON.parse(raw!) as { readonly state: GameStateV2 }).state;
}

function ProductHarness() {
  const [settings, setSettings] = useState(SETTINGS);
  const repository = useMemo(() => createSaveRepository(window.localStorage, () => '2026-09-01T01:00:00.000Z', CONTENT), []);
  const ports = useMemo<UiPorts>(() => ({ feedback: { consume() {} }, cinematicAudio: audio, now: () => Date.parse('2026-09-01T01:00:00.000Z') }), []);
  const session = useGameSession(repository, CONTENT, ports, settings);
  if (session.view === 'title') return <TitleScreen slots={session.slots} onNew={session.beginSlot} onContinue={session.continueSlot} onRecover={session.continueSlot} />;
  if (session.view === 'preferences') return <OnboardingScreen initialSettings={settings} onBack={session.returnToTitle} onComplete={(next) => { setSettings(next); session.showOpening(); }} />;
  if (session.view === 'opening') return <OpeningCinematic sequence={OPENING_SEQUENCE} settings={settings} audio={audio} onComplete={session.showNewRun} />;
  if (session.view === 'new-run') return <NewRunScreen onBack={session.showOpening} onBegin={session.startCampaign} />;
  return session.game ? <GameShell state={session.game} content={CONTENT} transitionEvents={session.transitionEvents} dispatch={session.dispatch} onSaveAndExit={session.saveAndExit} onMainMenu={session.returnToTitle} onReplayOpening={session.showOpening} settings={settings} onSettingsChange={setSettings} now={() => '2026-09-01T01:00:00.000Z'} /> : null;
}

describe('Chronicle product integration gate', () => {
  it('persists slot 2 through route, story, merchant, loadout, companion, combat, defeat, camp, and resume', async () => {
    window.localStorage.clear();
    const user = userEvent.setup();

    const rewardPreview = render(<RewardPanel view={{ rewardId: 'integration-reward', gold: 18, xp: 12, items: [], bonusStatus: 'unavailable' }} onClaim={vi.fn()} />);
    expect(screen.getByText('18 gold received')).toBeVisible();
    expect(screen.getByText('Bonus video unavailable. Your reward is safe.')).toBeVisible();
    rewardPreview.unmount();

    render(<ProductHarness />);

    await user.click(await screen.findByRole('button', { name: 'Begin slot 2' }));
    await user.click(screen.getByRole('button', { name: 'Watch opening story' }));
    await user.click(await screen.findByRole('region', { name: 'Opening story' }));
    await user.click(await screen.findByRole('button', { name: 'Skip opening' }));
    await user.click(screen.getByRole('button', { name: /Warden/i }));
    await user.click(screen.getByRole('button', { name: 'Begin Chronicle' }));
    expect(savedSlotTwo().campaign.hero.heroClass).toBe('warden');

    await user.click(await screen.findByRole('button', { name: 'Choose a Route' }));
    await user.click(screen.getByRole('button', { name: /Old Forest/i }));
    expect(savedSlotTwo().expedition?.routeProfile).toBe('old-forest');
    await user.click(await screen.findByRole('button', { name: 'Help the scout' }));
    expect(savedSlotTwo().campaign.flags).toContain('spared-mara');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('button', { name: 'Prepare the second road' }));
    expect(savedSlotTwo().campaign.flags).toContain('integration-second-road');

    const beforeOverlay = JSON.parse(window.localStorage.getItem(saveActiveKey(2))!).state.expedition.director.rngState;
    await user.click(screen.getByRole('button', { name: 'Pack' }));
    await user.click(screen.getByRole('button', { name: 'Close Inventory' }));
    const afterOverlay = JSON.parse(window.localStorage.getItem(saveActiveKey(2))!).state.expedition.director.rngState;
    expect(afterOverlay).toBe(beforeOverlay);
    expect(screen.queryByRole('region', { name: 'Opening story' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Visit Merchant' }));
    expect(savedSlotTwo().flow.screen).toBe('merchant');
    expect(await screen.findByRole('heading', { name: /Harlan/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    await user.click(screen.getByRole('button', { name: /Return to Camp & Bank/i }));
    expect(savedSlotTwo()).toMatchObject({ flow: { screen: 'camp' }, expedition: null });

    await user.click(await screen.findByRole('button', { name: /Pack & Stash/i }));
    await user.click(screen.getByRole('tab', { name: 'Equipment' }));
    await user.click(screen.getByRole('button', { name: 'Equip Greywatch Iron Sword' }));
    expect(savedSlotTwo().campaign.inventory.equipment.weapon).toBe('iron-sword');
    await user.click(screen.getByRole('button', { name: 'Close Inventory' }));
    await user.click(screen.getByRole('button', { name: 'Journal' }));
    expect(screen.getByRole('heading', { name: 'Journal' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close Journal' }));
    await user.click(screen.getByRole('button', { name: 'Companions' }));
    await user.click(screen.getByRole('button', { name: 'Travel Together' }));
    expect(savedSlotTwo().campaign.companions.activeCompanionId).toBe('mara');
    await user.click(screen.getByRole('button', { name: 'Close Companions' }));

    await user.click(screen.getByRole('button', { name: 'Choose a Route' }));
    await user.click(screen.getByRole('button', { name: /Old Forest/i }));
    await user.click(await screen.findByRole('button', { name: 'Hold the road' }));
    expect(savedSlotTwo().flow.screen).toBe('combat');
    await user.click(await screen.findByRole('button', { name: /Target Ditch Raider/i }));
    await user.click(screen.getByRole('button', { name: 'Guard' }));
    await user.click(screen.getByRole('button', { name: 'Consumable' }));
    await user.click(screen.getByRole('button', { name: /Red Mercy/i }));
    await user.click(screen.getByRole('button', { name: /Mara Venn:/i }));

    for (let turn = 0; turn < 60 && !screen.queryByRole('button', { name: 'Return to Last Camp' }); turn += 1) {
      const guard = screen.queryByRole('button', { name: 'Guard' });
      if (!guard) break;
      await user.click(guard);
    }
    await user.click(await screen.findByRole('button', { name: 'Return to Last Camp' }));
    expect(savedSlotTwo()).toMatchObject({ flow: { screen: 'camp' }, expedition: null });
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await user.click(await screen.findByRole('button', { name: 'Save & Exit' }));
    await user.click(await screen.findByRole('button', { name: 'Continue slot 2' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Road Camp' })).toBeVisible());
  }, 30_000);
});
