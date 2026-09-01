import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewRunScreen } from '../src/components/NewRunScreen';
import { SceneArt } from '../src/components/SceneArt';

describe('event and class-selection artwork', () => {
  it('declares the authored 3:2 dimensions for scene artwork', () => {
    render(<SceneArt illustrationId="scene-ch01-main-the-first-arrow" alt="An arrow crosses the Greywatch road." />);

    expect(screen.getByRole('img', { name: 'An arrow crosses the Greywatch road.' })).toHaveAttribute('width', '1536');
    expect(screen.getByRole('img', { name: 'An arrow crosses the Greywatch road.' })).toHaveAttribute('height', '1024');
  });

  it('shows the canonical road artwork before class choices', () => {
    const { container } = render(<NewRunScreen onBack={vi.fn()} onBegin={vi.fn()} />);
    const artwork = screen.getByRole('img', { name: 'A sunlit road leading into Morrowmere.' });
    const hero = container.querySelector('.new-run-hero');

    expect(artwork).toHaveAttribute('src', '/assets/chronicle1/onboarding/class-selection-road.webp');
    expect(artwork).toHaveAttribute('width', '1024');
    expect(artwork).toHaveAttribute('height', '1536');
    expect(hero).not.toBeNull();
    expect(hero!.compareDocumentPosition(screen.getByRole('button', { name: /Warrior/i })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps class selection usable when the road artwork fails', async () => {
    const user = userEvent.setup();
    const onBegin = vi.fn();
    render(<NewRunScreen onBack={vi.fn()} onBegin={onBegin} />);

    fireEvent.error(screen.getByRole('img', { name: 'A sunlit road leading into Morrowmere.' }));
    expect(screen.getByRole('img', { name: 'A sunlit road leading into Morrowmere.' })).toHaveClass('new-run-hero-fallback');

    await user.click(screen.getByRole('button', { name: /Warden/i }));
    await user.click(screen.getByRole('button', { name: 'Begin Chronicle' }));
    expect(onBegin).toHaveBeenCalledWith('warden', 'The Oathless');
  });
});
