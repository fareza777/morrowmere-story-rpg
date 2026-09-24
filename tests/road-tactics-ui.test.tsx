import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameShell } from '../src/components/GameShell';
import { TravelPanel } from '../src/components/TravelPanel';
import { selectTravelView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';
import type { RouteJunctionDefinition, DungeonDefinition } from '../src/game/dungeon/types';

const junction: RouteJunctionDefinition = {
  id: 'orchard-fork', chapterId: 'ch01', position: { chapterId: 'ch01', slot: 2 },
  afterEventId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'],
  options: [
    { id: 'hedge', label: 'Follow the hedge', detail: 'Keep the wagon in sight.', consequence: 'Spend daylight; avoid a fight.', kind: 'story', destination: { kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'] } },
    { id: 'culvert', label: 'Take the culvert', detail: 'Crawl beneath the road.', consequence: 'Risk an ambush; gain a shortcut.', kind: 'combat', destination: { kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'] } },
    { id: 'hidden-path', label: 'Use the hidden path', detail: 'Follow Mara’s marked stones.', consequence: 'Save time; spend the marked route.', kind: 'shortcut', requiredFlags: ['mara-marked-path'], destination: { kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'] } },
  ],
};

const dungeon: DungeonDefinition = {
  id: 'orchard-cellar', chapterId: 'ch01', startNodeId: 'cellar-entry', exitNodeIds: ['safe-exit', 'rough-exit'],
  nodes: [
    { id: 'cellar-entry', kind: 'scene', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'], exits: [
      { id: 'safe-passage', targetNodeId: 'safe-exit', label: 'Follow the lanterns', detail: 'A slower path with room to breathe.' },
      { id: 'rough-passage', targetNodeId: 'rough-exit', label: 'Cross the flooded stones', detail: 'A quick crossing under enemy fire.' },
    ] },
    { id: 'safe-exit', kind: 'exit', exitKind: 'complete', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'], exits: [] },
    { id: 'rough-exit', kind: 'exit', exitKind: 'retreat', sceneId: 'ui-story-event' as RouteJunctionDefinition['afterEventId'], exits: [] },
  ],
};

const SETTINGS = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic' as const, screenReaderAnnouncements: true,
};

function routeState(options: { readonly resource?: number } = {}) {
  const state = makeUiGame({ screen: 'travel' });
  return {
    ...state,
    expedition: {
      ...state.expedition!,
      currentSceneId: null,
      sceneResolution: null,
      heroVitals: {
        ...state.expedition!.heroVitals,
        resource: options.resource ?? state.expedition!.heroVitals.resource,
      },
    },
    flow: { ...state.flow, screen: 'travel' as const, merchant: null },
  };
}

describe('Road Tactics UI', () => {
  it('shows exactly two authored junction choices and dispatches select-route', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();
    const state = routeState();
    const content = { ...UI_CONTENT, routeJunctions: new Map([[junction.id, junction]]) };
    const atFork = { ...state, expedition: { ...state.expedition!, pendingRouteJunctionId: junction.id, lastTravelAction: 'scout' as const } };
    render(<GameShell state={atFork} content={content} transitionEvents={[]} dispatch={dispatch} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} settings={SETTINGS} onSettingsChange={vi.fn()} now={() => '2026-09-01T00:00:00.000Z'} />);

    expect(screen.getByRole('button', { name: 'Follow the hedge' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Take the culvert' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Scout' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use the hidden path' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Take the culvert' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'select-route', junctionId: junction.id, optionId: 'culvert', updatedAt: '2026-09-01T00:00:00.000Z' });
  });

  it('shows a third junction choice only when its exact flag is present', () => {
    const state = routeState();
    const content = { ...UI_CONTENT, routeJunctions: new Map([[junction.id, junction]]) };
    const atFork = { ...state, campaign: { ...state.campaign, flags: [...state.campaign.flags, 'mara-marked-path'] }, expedition: { ...state.expedition!, pendingRouteJunctionId: junction.id } };
    render(<TravelPanel view={selectTravelView(atFork, content)} onAction={vi.fn()} onRoute={vi.fn()} />);
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Use the hidden path' })).toBeVisible();
  });

  it('shows the active dungeon exits rather than road preparation cards', () => {
    const state = routeState();
    const content = { ...UI_CONTENT, dungeons: new Map([[dungeon.id, dungeon]]) };
    const inCellar = { ...state, expedition: { ...state.expedition!, dungeonRun: { dungeonId: dungeon.id, seed: 7, currentNodeId: 'cellar-entry', depth: 1, visitedNodeIds: ['cellar-entry'], resolvedNodeIds: ['cellar-entry'] } } };
    render(<TravelPanel view={selectTravelView(inCellar, content)} onAction={vi.fn()} onRoute={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Follow the lanterns' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cross the flooded stones' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Press On' })).not.toBeInTheDocument();
  });

  it('automatically takes an unambiguous single dungeon exit', () => {
    const dispatch = vi.fn();
    const state = routeState();
    const singleExit = { ...dungeon, nodes: [
      { ...dungeon.nodes[0]!, exits: [dungeon.nodes[0]!.exits[0]!] },
      ...dungeon.nodes.slice(1),
    ] };
    const content = { ...UI_CONTENT, dungeons: new Map([[dungeon.id, singleExit]]) };
    const inCellar = { ...state, expedition: { ...state.expedition!, dungeonRun: { dungeonId: dungeon.id, seed: 7, currentNodeId: 'cellar-entry', depth: 1, visitedNodeIds: ['cellar-entry'], resolvedNodeIds: ['cellar-entry'] } } };
    render(<GameShell state={inCellar} content={content} transitionEvents={[]} dispatch={dispatch} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} settings={SETTINGS} onSettingsChange={vi.fn()} now={() => '2026-09-01T00:00:00.000Z'} />);
    expect(screen.queryByRole('region', { name: 'Choose a Passage' })).not.toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith({ type: 'select-route', junctionId: 'cellar-entry', optionId: 'safe-passage', updatedAt: '2026-09-01T00:00:00.000Z' });
  });

  it('continues a later road leg with zero route options without showing an empty panel', () => {
    const dispatch = vi.fn();
    const state = routeState();
    const laterLeg = { ...state, expedition: { ...state.expedition!, lastTravelAction: 'scout' as const, sceneVisitCounts: { 'ui-story-event': 1 } } };
    render(<GameShell state={laterLeg} content={UI_CONTENT} transitionEvents={[]} dispatch={dispatch} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} settings={SETTINGS} onSettingsChange={vi.fn()} now={() => '2026-09-01T00:00:00.000Z'} />);
    expect(screen.queryByRole('region', { name: 'Road Tactics' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scout' })).not.toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith({ type: 'continue-journey', updatedAt: '2026-09-01T00:00:00.000Z' });
  });
  it('renders four road actions with art, costs, and effect previews', () => {
    render(<TravelPanel view={selectTravelView(routeState(), UI_CONTENT)} onAction={vi.fn()} onRoute={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Scout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Press On/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Make Camp/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /scout/i })).toBeInTheDocument();
    expect(screen.getByText(/Threat -2/i)).toBeInTheDocument();
  });

  it('explains why scout is disabled at zero resource', () => {
    render(<TravelPanel view={selectTravelView(routeState({ resource: 0 }), UI_CONTENT)} onAction={vi.fn()} onRoute={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Scout/i })).toBeDisabled();
    expect(screen.getByText(/Need 1 .* resource/i)).toBeInTheDocument();
  });

  it('shows the active companion’s exact road effect rather than flavor alone', () => {
    const state = makeUiGame({ companionId: 'mara' });
    const travelState = {
      ...state,
      expedition: { ...state.expedition!, currentSceneId: null, sceneResolution: null, sceneVisitCounts: {} },
      flow: { ...state.flow, screen: 'travel' as const, merchant: null },
    };
    render(<TravelPanel view={selectTravelView(travelState, UI_CONTENT)} onAction={vi.fn()} onRoute={vi.fn()} />);

    expect(screen.getByText(/Threat -2.*Scouted/i)).toBeInTheDocument();
  });

  it('uses the persisted latest action for the receipt instead of stale road boons', () => {
    const state = routeState();
    const withReceipt = {
      ...state,
      expedition: {
        ...state.expedition!,
        lastTravelAction: 'scout' as const,
        temporaryBoons: ['road:pressed'],
      },
    };

    expect(selectTravelView(withReceipt, UI_CONTENT).mode).toBe('continuation');
    expect(selectTravelView(withReceipt, UI_CONTENT).actions).toHaveLength(0);
  });

  it('sends one typed travel action for an available card', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<TravelPanel view={selectTravelView(routeState(), UI_CONTENT)} onAction={onAction} onRoute={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Press On/i }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith('press-on');
  });

  it('wires a travel card through the game shell without auto-selecting a scene', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();
    render(<GameShell state={routeState()} content={UI_CONTENT} transitionEvents={[]} dispatch={dispatch} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} settings={SETTINGS} onSettingsChange={vi.fn()} now={() => '2026-09-01T00:00:00.000Z'} />);

    expect(screen.getByRole('heading', { name: 'Road Tactics' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /^Press On$/i }));
    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch).toHaveBeenCalledWith({ type: 'travel-action', action: 'press-on', updatedAt: '2026-09-01T00:00:00.000Z' });
  });
});
