import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampScreen } from '../src/components/CampScreen';
import { ItemIcon } from '../src/components/ItemIcon';
import { RouteScreen } from '../src/components/RouteScreen';
import { SceneArt, illustrationFallbackSource } from '../src/components/SceneArt';
import { StoryPanel } from '../src/components/StoryPanel';
import { TutorialCallout } from '../src/components/TutorialCallout';
import { selectCampView, selectCurrentScene, selectRouteView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

describe('camp, route, and story screens', () => {
  it('offers camp services and Save & Exit', async () => {
    const user = userEvent.setup();
    const onChooseRoute = vi.fn();
    const onSaveAndExit = vi.fn();
    render(
      <CampScreen
        view={selectCampView(makeUiGame({ screen: 'camp' }), UI_CONTENT)}
        onChooseRoute={onChooseRoute}
        onOpenInventory={vi.fn()}
        onOpenJournal={vi.fn()}
        onOpenCompanions={vi.fn()}
        onSaveAndExit={onSaveAndExit}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Road Camp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Choose a Route' }));
    await user.click(screen.getByRole('button', { name: 'Save & Exit' }));
    expect(onChooseRoute).toHaveBeenCalledOnce();
    expect(onSaveAndExit).toHaveBeenCalledOnce();
  });

  it('shows understandable risk before choosing one of three routes', async () => {
    const user = userEvent.setup();
    const onChooseRoute = vi.fn();
    render(
      <RouteScreen
        view={selectRouteView(makeUiGame({ screen: 'camp' }), UI_CONTENT)}
        onChooseRoute={onChooseRoute}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /King's Road/i })).toHaveTextContent('Lower danger');
    expect(screen.getByRole('button', { name: /Old Forest/i })).toHaveTextContent('Ambush risk');
    expect(screen.getByRole('button', { name: /Ruined Pass/i })).toHaveTextContent('High danger');
    await user.click(screen.getByRole('button', { name: /Ruined Pass/i }));
    expect(onChooseRoute).toHaveBeenCalledWith('ruined-pass');
  });

  it('renders every story paragraph and wraps descriptive choices', () => {
    const view = selectCurrentScene(makeUiGame(), UI_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'The Orchard Ambush' })).toBeVisible();
    for (const paragraph of view.paragraphs) expect(screen.getByText(paragraph)).toBeVisible();
    expect(screen.getByRole('button', { name: /Follow the blood trail/i })).toHaveTextContent('Risk an ambush');
  });

  it('offers a clear replay control for an authored voice cue', async () => {
    const user = userEvent.setup();
    const onNarrate = vi.fn();
    const view = selectCurrentScene(makeUiGame(), UI_CONTENT)!;
    render(<StoryPanel view={view} onChoose={vi.fn()} onContinue={vi.fn()} onNarrate={onNarrate} />);

    await user.click(screen.getByRole('button', { name: 'Play narration' }));
    expect(onNarrate).toHaveBeenCalledOnce();
  });

  it('lets the player dismiss or skip contextual tutorials', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const onSkipAll = vi.fn();
    render(<TutorialCallout kind="choice" onDismiss={onDismiss} onSkipAll={onSkipAll} />);
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    await user.click(screen.getByRole('button', { name: 'Skip tutorials' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onSkipAll).toHaveBeenCalledOnce();
  });

  it('replaces missing authored scene art with a deterministic clean chapter image', () => {
    const illustrationId = 'scene-ch01-missing-authored';
    render(<SceneArt illustrationId={illustrationId} alt="A wagon on the Greywatch road." />);
    const image = screen.getByRole('img', { name: 'A wagon on the Greywatch road.' });
    fireEvent.error(image);

    expect(illustrationFallbackSource(illustrationId)).toBe('/assets/chronicle1/scenes/ch01/scene-ch01-main-a-banner-placed-too-neatly.webp');
    expect(image).toHaveAttribute('src', illustrationFallbackSource(illustrationId));
    expect(screen.queryByText(/illustration unavailable/i)).not.toBeInTheDocument();
  });

  it('renders item art at the canonical asset path and keeps a clean fixed-size fallback', () => {
    const { rerender } = render(<ItemIcon iconId="item-icon-weapon-greywatch-sabre" name="Greywatch Sabre" />);
    const image = screen.getByTestId('item-icon-image');
    expect(image).toHaveAttribute('src', '/assets/chronicle1/items/item-icon-weapon-greywatch-sabre.webp');
    fireEvent.error(image);
    expect(screen.getByTestId('item-icon-fallback')).toHaveTextContent('G');

    rerender(<ItemIcon iconId={null} name="Unknown Relic" />);
    expect(screen.getByTestId('item-icon-fallback')).toHaveTextContent('U');
  });
});
