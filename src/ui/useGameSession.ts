import { useCallback, useEffect, useRef, useState } from 'react';
import type { ContentIndex } from '../game/content/schema';
import type { DomainEvent } from '../game/domain/result';
import type { SaveRepository, SlotLoadResult, SlotSummary } from '../game/persistence/repository';
import type { SaveSlot } from '../game/persistence/schema';
import { createCampaign } from '../game/state/create';
import { reduceGame } from '../game/state/reducer';
import type { GameCommand, GameStateV2 } from '../game/state/types';
import type { HeroClass } from '../game/types';
import type { SaveSlotSummary, UiPorts } from './types';

export type GameSessionView = 'title' | 'preferences' | 'opening' | 'new-run' | 'game';

export interface GameSessionController {
  readonly view: GameSessionView;
  readonly activeSlot: SaveSlot | null;
  readonly slots: readonly SaveSlotSummary[];
  readonly game: GameStateV2 | null;
  readonly transitionEvents: readonly DomainEvent[];
  readonly notice: string | null;
  continueSlot(slot: SaveSlot): void;
  beginSlot(slot: SaveSlot): void;
  showOpening(): void;
  showNewRun(): void;
  startCampaign(heroClass: HeroClass, name: string): void;
  dispatch(command: GameCommand): void;
  saveAndExit(): void;
  returnToTitle(): void;
}

const SLOTS: readonly SaveSlot[] = [1, 2, 3];
const EMPTY_SLOTS: readonly SaveSlotSummary[] = SLOTS.map((slot) => ({ slot, status: 'empty' }));
const BACKUP_NOTICE = 'Recovered from the latest backup. Your campaign is ready to continue.';
const CORRUPT_NOTICE = 'This slot could not be opened safely.';
const ARCHIVED_CORRUPT_NOTICE = 'This slot could not be opened. A protected recovery copy was kept.';
const MIGRATION_NOTICE = 'Your prior save was archived. Chronicle I begins at Chapter 1.';
const SAVE_FAILURE_NOTICE = 'Your latest action could not be saved. Please try again.';

function heroClass(value: string): HeroClass | undefined {
  const normalized = value.toLowerCase();
  return normalized === 'warrior' || normalized === 'mage' || normalized === 'warden'
    ? normalized
    : undefined;
}

function summaryFromRepository(
  slot: SaveSlot,
  summary: SlotSummary,
  status: SaveSlotSummary['status'],
  notice?: string,
): SaveSlotSummary {
  return {
    slot,
    status,
    heroName: summary.heroName,
    heroClass: heroClass(summary.heroClass),
    chapterLabel: summary.chapter,
    level: summary.level,
    savedAt: summary.updatedAt,
    ...(notice ? { notice } : {}),
  };
}

function projectLoad(slot: SaveSlot, loaded: SlotLoadResult): SaveSlotSummary {
  if (!loaded.ok) {
    if (loaded.reason === 'empty') return { slot, status: 'empty' };
    return {
      slot,
      status: 'recoverable',
      notice: loaded.recoveryKeys && loaded.recoveryKeys.length > 0
        ? ARCHIVED_CORRUPT_NOTICE
        : CORRUPT_NOTICE,
    };
  }
  if (loaded.source === 'backup') {
    return summaryFromRepository(slot, loaded.summary, 'recoverable', loaded.notice ?? BACKUP_NOTICE);
  }
  if (loaded.source === 'migrated') {
    return summaryFromRepository(slot, loaded.summary, 'legacy', loaded.notice ?? MIGRATION_NOTICE);
  }
  return summaryFromRepository(slot, loaded.summary, 'ready', loaded.notice);
}

function loadSummaries(repository: SaveRepository): readonly SaveSlotSummary[] {
  return SLOTS.map((slot) => projectLoad(slot, repository.loadSlot(slot)));
}

function summaryFromState(slot: SaveSlot, state: GameStateV2): SaveSlotSummary {
  return {
    slot,
    status: 'ready',
    heroName: state.campaign.heroName,
    heroClass: state.campaign.hero.heroClass,
    chapterLabel: `Chapter ${Number(state.campaign.chapterId.slice(2))}`,
    level: state.campaign.hero.level,
    savedAt: state.updatedAt,
  };
}

function replaceSummary(
  summaries: readonly SaveSlotSummary[],
  replacement: SaveSlotSummary,
): readonly SaveSlotSummary[] {
  return summaries.map((summary) => summary.slot === replacement.slot ? replacement : summary);
}

function isoTime(now: number): string {
  return new Date(now).toISOString();
}

function campaignSeed(now: number, slot: SaveSlot): number {
  return (Math.imul(Math.trunc(now) >>> 0, 0x45d9f3b) ^ Math.imul(slot, 0x9e3779b1)) >>> 0 || 1943;
}

export function useGameSession(
  repository: SaveRepository,
  content: ContentIndex,
  ports: UiPorts,
): GameSessionController {
  const [view, setView] = useState<GameSessionView>('title');
  const [activeSlot, setActiveSlot] = useState<SaveSlot | null>(null);
  const [slots, setSlots] = useState<readonly SaveSlotSummary[]>(EMPTY_SLOTS);
  const [game, setGame] = useState<GameStateV2 | null>(null);
  const [transitionEvents, setTransitionEvents] = useState<readonly DomainEvent[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const latestStateRef = useRef<GameStateV2 | null>(null);
  const activeSlotRef = useRef<SaveSlot | null>(null);
  const loadedRepositoryRef = useRef<SaveRepository | null>(null);

  useEffect(() => {
    if (loadedRepositoryRef.current === repository) return;
    loadedRepositoryRef.current = repository;
    setSlots(loadSummaries(repository));
  }, [repository]);

  const publish = useCallback((slot: SaveSlot, state: GameStateV2, events: readonly DomainEvent[]) => {
    latestStateRef.current = state;
    activeSlotRef.current = slot;
    setActiveSlot(slot);
    setGame(state);
    setTransitionEvents(events);
    setSlots((current) => replaceSummary(current, summaryFromState(slot, state)));
    setNotice(null);
  }, []);

  const continueSlot = useCallback((slot: SaveSlot) => {
    const loaded = repository.loadSlot(slot);
    if (!loaded.ok) {
      setSlots((current) => replaceSummary(current, projectLoad(slot, loaded)));
      setNotice(
        loaded.reason === 'empty'
          ? 'That save slot is empty.'
          : loaded.recoveryKeys && loaded.recoveryKeys.length > 0
            ? ARCHIVED_CORRUPT_NOTICE
            : CORRUPT_NOTICE,
      );
      return;
    }
    latestStateRef.current = loaded.state;
    activeSlotRef.current = slot;
    setActiveSlot(slot);
    setGame(loaded.state);
    setTransitionEvents([]);
    setNotice(
      loaded.notice
      ?? (loaded.source === 'backup' ? BACKUP_NOTICE : loaded.source === 'migrated' ? MIGRATION_NOTICE : null),
    );
    setView('game');
  }, [repository]);

  const beginSlot = useCallback((slot: SaveSlot) => {
    activeSlotRef.current = slot;
    latestStateRef.current = null;
    setActiveSlot(slot);
    setGame(null);
    setTransitionEvents([]);
    setNotice(null);
    setView('preferences');
  }, []);

  const showOpening = useCallback(() => setView('opening'), []);
  const showNewRun = useCallback(() => setView('new-run'), []);

  const startCampaign = useCallback((selectedClass: HeroClass, name: string) => {
    const slot = activeSlotRef.current;
    if (!slot) return;
    const now = ports.now();
    let state: GameStateV2;
    try {
      state = createCampaign({
        heroClass: selectedClass,
        seed: campaignSeed(now, slot),
        name: name.trim() || 'The Oathless',
        updatedAt: isoTime(now),
      }, content);
    } catch {
      setNotice('Chronicle I could not be started. Please return to the title and try again.');
      return;
    }
    const saved = repository.saveSlot(slot, state);
    if (!saved.ok) {
      setNotice('The new Chronicle could not be saved. Please try again.');
      return;
    }
    publish(slot, state, []);
    setView('game');
  }, [content, ports, publish, repository]);

  const dispatch = useCallback((command: GameCommand) => {
    const current = latestStateRef.current;
    const slot = activeSlotRef.current;
    if (!current || !slot) return;
    const transition = reduceGame(current, command, content);
    const saved = repository.saveSlot(slot, transition.state);
    if (!saved.ok) {
      setNotice(SAVE_FAILURE_NOTICE);
      return;
    }
    publish(slot, transition.state, transition.events.map((event) => event.domain));
  }, [content, publish, repository]);

  const returnToTitle = useCallback(() => {
    latestStateRef.current = null;
    activeSlotRef.current = null;
    setGame(null);
    setActiveSlot(null);
    setTransitionEvents([]);
    setNotice(null);
    setSlots(loadSummaries(repository));
    setView('title');
  }, [repository]);

  const saveAndExit = useCallback(() => {
    const current = latestStateRef.current;
    const slot = activeSlotRef.current;
    if (!current || !slot) {
      returnToTitle();
      return;
    }
    const saved = repository.saveSlot(slot, current);
    if (!saved.ok) {
      setNotice(SAVE_FAILURE_NOTICE);
      return;
    }
    setSlots((summaries) => replaceSummary(summaries, summaryFromState(slot, current)));
    latestStateRef.current = null;
    activeSlotRef.current = null;
    setGame(null);
    setActiveSlot(null);
    setTransitionEvents([]);
    setNotice(null);
    setView('title');
  }, [repository, returnToTitle]);

  useEffect(() => {
    const flushLatest = () => {
      const current = latestStateRef.current;
      const slot = activeSlotRef.current;
      if (current && slot) repository.saveSlot(slot, current);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushLatest();
    };
    window.addEventListener('pagehide', flushLatest);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushLatest);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [repository]);

  return {
    view,
    activeSlot,
    slots,
    game,
    transitionEvents,
    notice,
    continueSlot,
    beginSlot,
    showOpening,
    showNewRun,
    startCampaign,
    dispatch,
    saveAndExit,
    returnToTitle,
  };
}
