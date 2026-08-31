import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampScreen } from '../src/components/CampScreen';
import { RouteScreen } from '../src/components/RouteScreen';
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
});
