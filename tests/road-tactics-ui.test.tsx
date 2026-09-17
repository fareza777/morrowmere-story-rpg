import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameShell } from '../src/components/GameShell';
import { TravelPanel } from '../src/components/TravelPanel';
import { selectTravelView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

const SETTINGS = {
  textScale: 1, highContrast: false, reducedMotion: false, hapticsEnabled: true, reducedHaptics: false,
  sfxVolume: 0.8, musicVolume: 0.7, voiceVolume: 0.9, captions: true,
  voiceReplay: 'automatic' as const, screenReaderAnnouncements: true,
};

function routeState(options: { readonly resource?: number } = {}) {
  const state = makeUiGame();
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
  it('renders four road actions with art, costs, and effect previews', () => {
    render(<TravelPanel view={selectTravelView(routeState(), UI_CONTENT)} onAction={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Scout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Press On/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Make Camp/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /scout/i })).toBeInTheDocument();
    expect(screen.getByText(/Threat -2/i)).toBeInTheDocument();
  });

  it('explains why scout is disabled at zero resource', () => {
    render(<TravelPanel view={selectTravelView(routeState({ resource: 0 }), UI_CONTENT)} onAction={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Scout/i })).toBeDisabled();
    expect(screen.getByText(/Need 1 .* resource/i)).toBeInTheDocument();
  });

  it('shows the active companion’s exact road effect rather than flavor alone', () => {
    const state = makeUiGame({ companionId: 'mara' });
    const travelState = {
      ...state,
      expedition: { ...state.expedition!, currentSceneId: null, sceneResolution: null },
      flow: { ...state.flow, screen: 'travel' as const, merchant: null },
    };
    render(<TravelPanel view={selectTravelView(travelState, UI_CONTENT)} onAction={vi.fn()} />);

    expect(screen.getByText(/Threat -2.*Scouted/i)).toBeInTheDocument();
  });

  it('sends one typed travel action for an available card', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<TravelPanel view={selectTravelView(routeState(), UI_CONTENT)} onAction={onAction} />);

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
