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
  it('maps camp chapters to bright contextual and regional hero artwork', () => {
    const baseView = selectCampView(makeUiGame({ screen: 'camp' }), UI_CONTENT);
    const { rerender } = render(
      <CampScreen
        view={baseView}
        onChooseRoute={vi.fn()}
        onOpenInventory={vi.fn()}
        onOpenJournal={vi.fn()}
        onOpenCompanions={vi.fn()}
      />,
    );
    const cases = [
      ['Chapter 1', '/assets/chronicle1/hubs/road-camp-morning.webp'],
      ['Chapter 3', '/assets/backgrounds/drowned-road.webp'],
      ['Chapter 5', '/assets/backgrounds/embervault.webp'],
      ['Chapter 7', '/assets/backgrounds/crownless-keep.webp'],
    ] as const;

    for (const [chapterLabel, source] of cases) {
      rerender(
        <CampScreen
          view={{ ...baseView, hero: { ...baseView.hero, chapterLabel } }}
          onChooseRoute={vi.fn()}
          onOpenInventory={vi.fn()}
          onOpenJournal={vi.fn()}
          onOpenCompanions={vi.fn()}
        />,
      );
      expect(screen.getByRole('img')).toHaveAttribute('src', source);
    }
  });

  it('offers camp services without duplicating the Pause menu exit action', async () => {
    const user = userEvent.setup();
    const onChooseRoute = vi.fn();
    render(
      <CampScreen
        view={selectCampView(makeUiGame({ screen: 'camp' }), UI_CONTENT)}
        onChooseRoute={onChooseRoute}
        onOpenInventory={vi.fn()}
        onOpenJournal={vi.fn()}
        onOpenCompanions={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Road Camp' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Choose a Route' }));
    expect(onChooseRoute).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Save & Exit' })).not.toBeInTheDocument();
  });

  it('presents three atmospheric roads without forecasting outcomes', async () => {
    const user = userEvent.setup();
    const onChooseRoute = vi.fn();
    const { container } = render(
      <RouteScreen
        view={selectRouteView(makeUiGame({ screen: 'camp' }), UI_CONTENT)}
        onChooseRoute={onChooseRoute}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: /lone traveller/i })).toHaveAttribute('src', '/assets/chronicle1/hubs/three-roads-crossroads.webp');
    expect(screen.getByText('Three old roads lead onward, each remembered differently in the villages of Morrowmere.')).toBeVisible();
    const routeButtons = screen.getAllByRole('button').filter((button) => button.classList.contains('route-card'));
    expect(routeButtons).toHaveLength(3);
    expect(routeButtons[0]).toHaveTextContent('Built for royal couriers');
    expect(routeButtons[1]).toHaveTextContent('moss-dark paths');
    expect(routeButtons[2]).toHaveTextContent('shattered watchtowers');
    expect(container).not.toHaveTextContent(/\b(?:risk|danger|ambush|encounter|merchant|trade|recovery|companion|relic|suppl(?:y|ies)|people)\b/i);
    for (const button of routeButtons) {
      expect(button).not.toHaveAccessibleName(/\b(?:risk|danger|ambush|encounter|merchant|trade|recovery|companion|relic|suppl(?:y|ies)|people)\b/i);
    }
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

    expect(illustrationFallbackSource(illustrationId)).toBe('/assets/chronicle1/hubs/three-roads-crossroads.webp');
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
