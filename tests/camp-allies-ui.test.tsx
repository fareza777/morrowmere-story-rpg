import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CampScreen } from '../src/components/CampScreen';
import { CompanionPanel } from '../src/components/CompanionPanel';
import { PauseSheet } from '../src/components/PauseSheet';
import type { CompanionJournalViewModel } from '../src/ui/types';
import { selectCampView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

function companion(
  id: string,
  name: string,
  status: CompanionJournalViewModel['status'],
): CompanionJournalViewModel {
  return {
    id,
    name,
    status,
    statusLabel: status === 'recruited' ? 'Recruited · Ready' : 'Not recruited',
    loyaltyLabel: 'Wary',
    injured: false,
    active: false,
    commandId: `${id}-command`,
    commandLabel: 'Road command',
    commandCooldown: 2,
    loyaltyDescription: `${name} is still deciding whether this road is worth the risk.`,
    explorationCapability: null,
    passive: null,
    recruitmentCostLabel: status === 'unknown' ? 'Choose a hidden chain of costly decisions.' : null,
    personalQuests: [],
  };
}

describe('camp and allies spoiler boundaries', () => {
  it('keeps Save & Exit out of Camp and available only through Pause', async () => {
    const user = userEvent.setup();
    const onSaveAndExit = vi.fn();
    const camp = render(
      <CampScreen
        view={selectCampView(makeUiGame({ screen: 'camp' }), UI_CONTENT)}
        onChooseRoute={vi.fn()}
        onOpenInventory={vi.fn()}
        onOpenJournal={vi.fn()}
        onOpenCompanions={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Save & Exit' })).not.toBeInTheDocument();
    camp.unmount();

    render(<PauseSheet onResume={vi.fn()} onSaveAndExit={onSaveAndExit} onRestartChapter={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Save & Exit' }));
    expect(onSaveAndExit).toHaveBeenCalledOnce();
  });

  it('shows only recruited allies and never reveals recruitment instructions', () => {
    const mara = {
      ...companion('mara', 'Mara Vey', 'recruited'),
      loyaltyDescription: 'A spoiler-rich biography that belongs in the Codex.',
      personalQuests: [{
        id: 'mara-secret',
        title: 'A Scout’s Debt',
        summary: 'A long hidden backstory that should not crowd the Allies roster.',
        stage: 1 as const,
        completed: false,
      }],
    };
    render(
      <CompanionPanel
        companions={[
          mara,
          companion('rukhar', 'Rukhar Stonehand', 'unknown'),
        ]}
        canSwitch
        onSetActive={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Mara Vey' })).toBeVisible();
    expect(screen.queryByText('Rukhar Stonehand')).not.toBeInTheDocument();
    expect(screen.queryByText(/Recruitment clue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hidden chain of costly decisions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/spoiler-rich biography/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/long hidden backstory/i)).not.toBeInTheDocument();
    expect(screen.getByText('A Scout’s Debt')).toBeVisible();
  });
});
