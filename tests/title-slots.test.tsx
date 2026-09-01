import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { TitleScreen } from '../src/components/TitleScreen';
import type {
  ProfileLoadResult,
  SaveRepository,
  SaveResult,
  SlotLoadResult,
} from '../src/game/persistence/repository';
import type { SaveSlot } from '../src/game/persistence/schema';
import type { GameStateV2, ProfileState } from '../src/game/state/types';
import type { SaveSlotSummary, UiPorts, UiSettings } from '../src/ui/types';
import { useGameSession } from '../src/ui/useGameSession';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const SLOT_SUMMARIES: readonly SaveSlotSummary[] = [
  {
    slot: 1,
    status: 'ready',
    heroName: 'Rowan Vale',
    heroClass: 'warden',
    level: 4,
    chapterLabel: 'Chapter 2',
    savedAt: '2026-08-31T12:30:00.000Z',
  },
  { slot: 2, status: 'empty' },
  {
    slot: 3,
    status: 'recoverable',
    heroName: 'Aster Grey',
    heroClass: 'mage',
    level: 2,
    chapterLabel: 'Chapter 1',
    savedAt: '2026-08-31T09:10:00.000Z',
    notice: 'Recovered from the latest backup. Your campaign is ready to continue.',
  },
];

const UI_PORTS: UiPorts = {
  feedback: { consume(_cues): void {} },
  cinematicAudio: {
    async preload(): Promise<void> {},
    async play(): Promise<void> {},
    pause(): void {},
    seek(): void {},
    stop(): void {},
    setVolumes(): void {},
  },
  now: () => Date.parse('2026-08-31T14:00:00.000Z'),
};

const UI_SETTINGS: UiSettings = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic', screenReaderAnnouncements: true,
};

function successfulLoad(
  state: GameStateV2,
  source: 'active' | 'backup' | 'migrated' = 'active',
  notice?: string,
): SlotLoadResult {
  return {
    ok: true,
    state,
    source,
    summary: {
      title: 'Chronicle I — The Black Banner',
      heroName: state.campaign.heroName,
      heroClass: state.campaign.hero.heroClass === 'mage'
        ? 'Mage'
        : state.campaign.hero.heroClass === 'warden'
          ? 'Warden'
          : 'Warrior',
      level: state.campaign.hero.level,
      chapter: `Chapter ${Number(state.campaign.chapterId.slice(2))}`,
      updatedAt: state.updatedAt,
    },
    ...(notice ? { notice } : {}),
  };
}

class SessionRepository implements SaveRepository {
  readonly saves: Array<{ readonly slot: SaveSlot; readonly state: GameStateV2 }> = [];
  readonly loadCounts = new Map<SaveSlot, number>();
  saveResult: SaveResult = { ok: true };

  constructor(private readonly loads: ReadonlyMap<SaveSlot, SlotLoadResult>) {}

  loadProfile(): ProfileLoadResult { return { ok: false, reason: 'empty' }; }
  saveProfile(_profile: ProfileState): SaveResult { return { ok: true }; }
  loadSlot(slot: SaveSlot): SlotLoadResult {
    this.loadCounts.set(slot, (this.loadCounts.get(slot) ?? 0) + 1);
    return this.loads.get(slot) ?? { ok: false, reason: 'empty' };
  }
  saveSlot(slot: SaveSlot, state: GameStateV2): SaveResult {
    this.saves.push({ slot, state });
    return this.saveResult;
  }
  exportSlot(_slot: SaveSlot): string | null { return null; }
  importSlot(_slot: SaveSlot, _raw: string): SlotLoadResult { return { ok: false, reason: 'corrupt' }; }
}

describe('three-slot title', () => {
  it('shows all three save slots and the complete unclipped title copy', () => {
    render(
      <TitleScreen
        slots={SLOT_SUMMARIES}
        onContinue={() => undefined}
        onNew={() => undefined}
        onRecover={() => undefined}
      />,
    );

    expect(screen.getAllByRole('article', { name: /Save slot/i })).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
    expect(screen.getByText('Chronicle I — The Black Banner')).toBeVisible();
    expect(screen.getByText('Rowan Vale')).toBeVisible();
    expect(screen.getByText(/Warden · Level 4 · Chapter 2/)).toBeVisible();
  });

  it('starts an empty slot directly', async () => {
    const user = userEvent.setup();
    const begun: number[] = [];
    render(
      <TitleScreen
        slots={SLOT_SUMMARIES}
        onContinue={() => undefined}
        onNew={(slot) => begun.push(slot)}
        onRecover={() => undefined}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Begin slot 2' }));
    expect(begun).toEqual([2]);
  });

  it('shows a recovery notice without exposing a raw storage error', async () => {
    const user = userEvent.setup();
    const recovered: number[] = [];
    render(
      <TitleScreen
        slots={SLOT_SUMMARIES}
        onContinue={() => undefined}
        onNew={() => undefined}
        onRecover={(slot) => recovered.push(slot)}
      />,
    );

    expect(screen.getByText('Recovered from the latest backup. Your campaign is ready to continue.')).toBeVisible();
    expect(screen.queryByText(/checksum|storage|SQLITE/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue recovered slot 3' }));
    expect(recovered).toEqual([3]);
  });

  it('requires a focus-contained confirmation before replacing an occupied slot', async () => {
    const user = userEvent.setup();
    const begun: number[] = [];
    render(
      <TitleScreen
        slots={SLOT_SUMMARIES}
        onContinue={() => undefined}
        onNew={(slot) => begun.push(slot)}
        onRecover={() => undefined}
      />,
    );

    const replace = screen.getByRole('button', { name: 'Replace slot 1' });
    await user.click(replace);
    expect(screen.getByRole('dialog', { name: 'Replace save slot 1?' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Keep existing save' })).toHaveFocus();
    expect(begun).toEqual([]);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Replace and begin' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Keep existing save' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Replace and begin' }));
    expect(begun).toEqual([1]);
  });
});

describe('V2 session controller', () => {
  it('loads each migration-sensitive slot once under React Strict Mode', () => {
    const game = makeUiGame({ screen: 'camp' });
    const repository = new SessionRepository(new Map([[1, successfulLoad(game, 'backup')]]));
    const wrapper = ({ children }: { readonly children: ReactNode }) => <StrictMode>{children}</StrictMode>;

    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, UI_PORTS), { wrapper });

    expect(repository.loadCounts).toEqual(new Map([[1, 1], [2, 1], [3, 1]]));
    expect(result.current.slots[0]).toMatchObject({ status: 'recoverable', heroName: 'Rowan' });
  });

  it('projects backup, migration, and corrupt results into safe slot notices', () => {
    const game = makeUiGame({ screen: 'camp' });
    const repository = new SessionRepository(new Map([
      [1, successfulLoad(game, 'backup')],
      [2, successfulLoad(game, 'migrated', 'Your prior save was archived. Chronicle I begins at Chapter 1.')],
      [3, { ok: false as const, reason: 'corrupt' as const, error: 'SQLITE checksum mismatch at raw key 0x991' }],
    ]));
    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, UI_PORTS));

    expect(result.current.slots).toMatchObject([
      { slot: 1, status: 'recoverable', heroName: 'Rowan' },
      { slot: 2, status: 'legacy', notice: 'Your prior save was archived. Chronicle I begins at Chapter 1.' },
      { slot: 3, status: 'recoverable' },
    ]);
    expect(JSON.stringify(result.current.slots)).not.toContain('SQLITE');
    expect(JSON.stringify(result.current.slots)).not.toContain('0x991');
  });

  it('does not publish a reducer transition when its synchronous save fails', () => {
    const game = makeUiGame({ screen: 'camp' });
    const repository = new SessionRepository(new Map([[1, successfulLoad(game)]]));
    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, UI_PORTS));

    act(() => result.current.continueSlot(1));
    const before = result.current.game;
    repository.saveResult = { ok: false, error: 'disk full: C:\\private\\save.json' };
    act(() => result.current.dispatch({
      type: 'set-active-companion',
      companionId: null,
      updatedAt: '2026-08-31T14:01:00.000Z',
    }));

    expect(repository.saves).toHaveLength(1);
    expect(result.current.game).toBe(before);
    expect(result.current.notice).toBe('Your latest action could not be saved. Please try again.');
    expect(result.current.notice).not.toContain('private');
  });

  it('reports diagnostics and no-op commands as unaccepted without writing a save', () => {
    const game = makeUiGame({ screen: 'camp' });
    const repository = new SessionRepository(new Map([[1, successfulLoad(game)]]));
    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, UI_PORTS));

    act(() => result.current.continueSlot(1));
    let accepted = true;
    act(() => {
      accepted = result.current.dispatch({
        type: 'claim-rewards',
        rewardId: 'missing-reward',
        itemId: null,
        updatedAt: '2026-08-31T14:01:00.000Z',
      });
    });

    expect(accepted).toBe(false);
    expect(repository.saves).toEqual([]);
    expect(result.current.game).toBe(game);
    expect(result.current.notice).toBe('That battle reward is no longer available.');
  });

  it('publishes the exact saved transition and flushes the latest state on backgrounding', () => {
    const game = makeUiGame({ screen: 'camp' });
    const repository = new SessionRepository(new Map([[1, successfulLoad(game)]]));
    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, UI_PORTS));

    act(() => result.current.continueSlot(1));
    act(() => result.current.dispatch({
      type: 'set-active-companion',
      companionId: null,
      updatedAt: '2026-08-31T14:02:00.000Z',
    }));
    const published = result.current.game;
    expect(repository.saves.at(-1)?.state).toBe(published);
    expect(published?.campaign.transitionCounter).toBe(1);

    repository.saves.length = 0;
    act(() => { result.current.flushLatest(); });
    expect(repository.saves).toEqual([{ slot: 1, state: published! }]);
  });

  it('reserves an empty slot, saves the new campaign, and then publishes it', () => {
    const repository = new SessionRepository(new Map());
    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, UI_PORTS));

    act(() => result.current.beginSlot(2));
    expect(result.current).toMatchObject({ activeSlot: 2, view: 'preferences', game: null });
    act(() => result.current.startCampaign('mage', 'Eira'));

    expect(result.current).toMatchObject({ activeSlot: 2, view: 'game' });
    expect(result.current.game?.campaign).toMatchObject({ heroName: 'Eira', hero: { heroClass: 'mage' } });
    expect(repository.saves).toEqual([{ slot: 2, state: result.current.game! }]);
  });

  it('saves and publishes a transition before consuming its typed feedback once', () => {
    const game = makeUiGame({ screen: 'camp' });
    const repository = new SessionRepository(new Map([[2, successfulLoad(game)]]));
    let savesVisibleWhenConsumed = 0;
    const consumed: unknown[] = [];
    const ports: UiPorts = {
      ...UI_PORTS,
      feedback: {
        consume(cues): void {
          savesVisibleWhenConsumed = repository.saves.length;
          consumed.push(cues);
        },
      },
    };
    const { result } = renderHook(() => useGameSession(repository, UI_CONTENT, ports, UI_SETTINGS));
    act(() => result.current.continueSlot(2));
    act(() => result.current.dispatch({ type: 'set-active-companion', companionId: null, updatedAt: '2026-08-31T14:05:00.000Z' }));

    expect(savesVisibleWhenConsumed).toBe(1);
    expect(consumed).toHaveLength(1);
    expect(consumed[0]).toEqual(expect.arrayContaining([
      { type: 'sfx', cueId: 'confirm', gain: 1 },
      { type: 'haptic', pattern: 'light' },
      { type: 'announce', message: 'Companion slot cleared.' },
    ]));
  });
});
