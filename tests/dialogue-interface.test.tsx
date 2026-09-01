import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DialoguePanel } from '../src/components/DialoguePanel';
import type { DialogueBeatViewModel } from '../src/ui/types';

const firstBeat: DialogueBeatViewModel = {
  index: 0, total: 2, speakerName: 'Mara', text: 'The ford is too quiet. Keep your hand near the blade.', expression: 'wary',
  character: { illustrationId: 'character-mara-wary', position: 'left' }, environmentIllustrationId: 'scene-ch01-dialogue-ford', voiceCueId: null, isFinal: false,
};

describe('cinematic dialogue interface', () => {
  it('renders ordered dialogue as a decorative NPC layer and withholds responses before the final beat', () => {
    const advance = vi.fn();
    render(<DialoguePanel beat={firstBeat} reducedMotion={false} onAdvance={advance} onRevealVoiced={vi.fn()} voiceRevealPending={false} responses={<button type="button">Cross the ford</button>} />);

    expect(screen.getByRole('heading', { name: 'Mara' })).toBeInTheDocument();
    expect(screen.getByText(firstBeat.text, { selector: '.dialogue-copy' })).toBeInTheDocument();
    expect(screen.getByText(`Mara: ${firstBeat.text}`)).toHaveClass('sr-only');
    expect(screen.getByTestId('dialogue-character-layer')).toHaveAttribute('src', '/assets/chronicle1/characters/character-mara-wary.webp');
    expect(screen.getByTestId('dialogue-character-layer')).toHaveAttribute('data-dialogue-position', 'left');
    expect(screen.getByText(`Mara: ${firstBeat.text}`)).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('heading', { name: 'Mara' })).not.toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Cross the ford' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(advance).toHaveBeenCalledOnce();
  });

  it('uses a tap-to-reveal hook only for a voiced final milestone and hides a missing character layer cleanly', () => {
    const reveal = vi.fn();
    const { rerender } = render(<DialoguePanel beat={{ ...firstBeat, index: 1, isFinal: true, voiceCueId: 'voice-dialogue-ford' }} reducedMotion onAdvance={vi.fn()} onRevealVoiced={reveal} voiceRevealPending responses={<button type="button">Cross the ford</button>} />);

    expect(screen.getByRole('button', { name: 'Tap to reveal responses' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cross the ford' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tap to reveal responses' }));
    expect(reveal).toHaveBeenCalledOnce();
    expect(screen.getByTestId('dialogue-character-layer')).not.toHaveClass('dialogue-character-enter');

    rerender(<DialoguePanel beat={{ ...firstBeat, index: 1, isFinal: true, character: null }} reducedMotion={false} onAdvance={vi.fn()} onRevealVoiced={vi.fn()} voiceRevealPending={false} responses={<button type="button">Cross the ford</button>} />);
    expect(screen.queryByTestId('dialogue-character-layer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cross the ford' })).toBeInTheDocument();
  });
});
