import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { OpeningCinematic } from '../src/components/cinematic/OpeningCinematic';
import { OnboardingScreen } from '../src/components/OnboardingScreen';
import { OPENING_NARRATION, OPENING_SEQUENCE } from '../src/ui/openingSequence';
import type { CinematicAudioPort, UiSettings } from '../src/ui/types';

const SETTINGS: UiSettings = {
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  hapticsEnabled: true,
  reducedHaptics: false,
  sfxVolume: 0.8,
  musicVolume: 0.7,
  voiceVolume: 0.9,
  captions: true,
  voiceReplay: 'automatic',
  screenReaderAnnouncements: true,
};

const APPROVED_NARRATION = [
  'The job should have taken three days. Escort two wagons of medicine north to Greywatch, collect your pay, and leave before the border frost. In Morrowmere, that counts as honest work.',
  'The kingdom has lived eighteen years without a king. Its roads belong to toll collectors, deserters, and anything strong enough to hold a blade. Goblin raids are common. Orc patrols stay west of Redwater. Everyone knows where the danger lies.',
  'Until this morning.',
  'The first arrow kills the driver. The second carries the mark of the royal armory. When the attackers retreat, they leave an orc banner beside a dead officer—as if they want the truth found too quickly.',
  'Someone is preparing a war.',
  'You have no title, no army, and no lord to protect you. You have one wounded witness, one sealed order, and a road that now leads straight to Greywatch.',
  'By nightfall, half the border will want what you carry.',
  'This is where your chronicle begins.',
] as const;

function makeAudio(options: { readonly rejectPreload?: boolean; readonly rejectPlay?: boolean } = {}) {
  return {
    preload: vi.fn(async () => {
      if (options.rejectPreload) throw new Error('missing opening pack');
    }),
    play: vi.fn(async () => {
      if (options.rejectPlay) throw new Error('decoder unavailable');
    }),
    pause: vi.fn(),
    seek: vi.fn(),
    stop: vi.fn(),
    setVolumes: vi.fn(),
  } satisfies CinematicAudioPort;
}

function installManualAnimationFrame() {
  let now = 0;
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
  return {
    pendingCount: () => callbacks.size,
    frame(positionMs: number) {
      now = positionMs;
      const pending = [...callbacks.values()];
      callbacks.clear();
      act(() => pending.forEach((callback) => callback(positionMs)));
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('approved Chronicle I opening sequence', () => {
  it('maps all fourteen canonical production shots without changing IDs, paths, or timing', () => {
    expect(OPENING_SEQUENCE.durationMs).toBe(105_000);
    expect(OPENING_SEQUENCE.musicId).toBe('music-opening-score');
    expect(OPENING_SEQUENCE.shots).toHaveLength(14);
    expect(OPENING_SEQUENCE.shots.map((shot) => shot.id)).toEqual([
      'opening-01-fractured-kingdom',
      'opening-02-medicine-caravan',
      'opening-03-player-on-the-road',
      'opening-04-distant-greywatch',
      'opening-05-abandoned-checkpoint',
      'opening-06-the-first-arrow',
      'opening-07-goblin-attack',
      'opening-08-player-responds',
      'opening-09-royal-armory-mark',
      'opening-10-false-orc-banner',
      'opening-11-wounded-witness',
      'opening-12-enemy-riders',
      'opening-13-final-approach',
      'opening-14-title-reveal',
    ]);
    expect(OPENING_SEQUENCE.shots.map(({ startMs, endMs }) => [startMs, endMs])).toEqual([
      [0, 7_000], [7_000, 15_000], [15_000, 21_000], [21_000, 28_000],
      [28_000, 36_000], [36_000, 42_000], [42_000, 50_000], [50_000, 57_000],
      [57_000, 64_000], [64_000, 71_000], [71_000, 79_000], [79_000, 86_000],
      [86_000, 96_000], [96_000, 105_000],
    ]);
    expect(OPENING_SEQUENCE.shots[0]?.imageId).toBe(
      '/assets/chronicle1/opening/opening-01-fractured-kingdom/base.webp',
    );
    expect(OPENING_SEQUENCE.shots[13]?.imageId).toBe(
      '/assets/chronicle1/opening/opening-14-title-reveal/base.webp',
    );
    expect(OPENING_SEQUENCE.shots.every((shot) => shot.sfxCueIds.length === 0)).toBe(true);
    expect(OPENING_NARRATION).toEqual(APPROVED_NARRATION);
  });

  it('keeps narration over the film frame without story chrome when voice is disabled', async () => {
    installManualAnimationFrame();
    const audio = makeAudio();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={{ ...SETTINGS, voiceVolume: 0 }}
        audio={audio}
        onComplete={() => undefined}
      />
    );

    const opening = screen.getByRole('region', { name: 'Opening story' });
    const visual = screen.getByTestId('opening-visual');
    const narration = screen.getByText('The job should have taken three days.');
    expect(opening).toBeVisible();
    expect(visual).toContainElement(narration);
    expect(screen.queryByText(/Scene 1 of/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Opening progress/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Playing')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Replay opening/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Continue to class selection/i })).not.toBeInTheDocument();
    await waitFor(() => expect(audio.play).toHaveBeenCalledWith(OPENING_SEQUENCE, 0));
    expect(audio.setVolumes).toHaveBeenCalledWith({ music: 0.7, voice: 0, sfx: 0.8 });
  });

  it('preloads and starts the opening only once under React Strict Mode', async () => {
    installManualAnimationFrame();
    const audio = makeAudio();
    render(
      <StrictMode>
        <OpeningCinematic
          sequence={OPENING_SEQUENCE}
          settings={SETTINGS}
          audio={audio}
          onComplete={() => undefined}
        />
      </StrictMode>,
    );

    await waitFor(() => expect(audio.play).toHaveBeenCalledOnce());
    expect(audio.preload).toHaveBeenCalledOnce();
  });

  it('stops again if pending playback resolves after the cinematic unmounts', async () => {
    installManualAnimationFrame();
    let finishPlayback: (() => void) | undefined;
    const audio = makeAudio();
    audio.play.mockImplementation(() => new Promise<void>((resolve) => { finishPlayback = resolve; }));
    const { unmount } = render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        onComplete={() => undefined}
      />,
    );
    await waitFor(() => expect(audio.play).toHaveBeenCalledOnce());

    unmount();
    expect(audio.stop).toHaveBeenCalledOnce();
    await act(async () => finishPlayback?.());
    expect(audio.stop).toHaveBeenCalledTimes(2);
  });

  it('starts the visual timeline immediately without waiting for audio preload', async () => {
    const clock = installManualAnimationFrame();
    const audio = makeAudio();
    audio.preload.mockImplementation(() => new Promise<void>(() => undefined));
    render(
      <StrictMode>
        <OpeningCinematic
          sequence={OPENING_SEQUENCE}
          settings={SETTINGS}
          audio={audio}
          onComplete={() => undefined}
        />
      </StrictMode>,
    );

    await act(async () => undefined);
    expect(clock.pendingCount()).toBeGreaterThan(0);
    clock.frame(7_500);
    expect(screen.getByText(/Escort two wagons of medicine north/)).toBeVisible();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('keeps overlay controls hidden until a tap and auto-hides them after inactivity', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    installManualAnimationFrame();
    const audio = makeAudio();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        onComplete={() => undefined}
      />,
    );
    await act(async () => undefined);

    const opening = screen.getByRole('region', { name: 'Opening story' });
    expect(screen.queryByRole('button', { name: 'Pause opening' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hide captions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip opening' })).not.toBeInTheDocument();

    fireEvent.click(opening);
    expect(screen.getByRole('button', { name: 'Pause opening' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Skip opening' })).toBeVisible();
    act(() => vi.advanceTimersByTime(2_999));
    expect(screen.getByRole('button', { name: 'Skip opening' })).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('button', { name: 'Skip opening' })).not.toBeInTheDocument();

    fireEvent.click(opening);
    fireEvent.click(screen.getByRole('button', { name: 'Pause opening' }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole('button', { name: 'Resume opening' })).toBeVisible();
  });

  it('pauses at the current position and seeks before synchronized resume', async () => {
    const clock = installManualAnimationFrame();
    const user = userEvent.setup();
    const audio = makeAudio();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        onComplete={() => undefined}
      />,
    );
    await waitFor(() => expect(audio.play).toHaveBeenCalledWith(OPENING_SEQUENCE, 0));
    await user.click(screen.getByRole('region', { name: 'Opening story' }));
    const visual = screen.getByTestId('opening-visual');
    expect(visual).not.toHaveClass('is-timeline-paused');

    clock.frame(7_500);
    expect(screen.getByText(/Escort two wagons of medicine north/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Pause opening' }));
    expect(audio.pause).toHaveBeenCalledOnce();
    expect(visual).toHaveClass('is-timeline-paused');

    clock.frame(20_000);
    expect(screen.getByText(/Escort two wagons of medicine north/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Resume opening' }));
    expect(audio.seek).toHaveBeenLastCalledWith(7_500);
    expect(audio.play).toHaveBeenLastCalledWith(OPENING_SEQUENCE, 7_500);
    expect(visual).not.toHaveClass('is-timeline-paused');
  });

  it('offers audio retry only after a real playback failure while captions continue', async () => {
    const clock = installManualAnimationFrame();
    const user = userEvent.setup();
    const audio = makeAudio();
    audio.play.mockRejectedValueOnce(new Error('decoder unavailable')).mockResolvedValue(undefined);
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        onComplete={() => undefined}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Retry audio' })).not.toBeInTheDocument();
    expect(await screen.findByText('Audio is unavailable. Captions will continue.')).toBeVisible();
    const retry = screen.getByRole('button', { name: 'Retry audio' });
    await waitFor(() => expect(clock.pendingCount()).toBeGreaterThan(0));
    clock.frame(7_500);
    expect(screen.getByText(/Escort two wagons of medicine north/)).toBeVisible();
    expect(screen.queryByText(/illustrated opening could not be loaded/i)).not.toBeInTheDocument();
    await user.click(retry);
    expect(audio.seek).toHaveBeenLastCalledWith(7_500);
    expect(audio.play).toHaveBeenLastCalledWith(OPENING_SEQUENCE, 7_500);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry audio' })).not.toBeInTheDocument());
  });

  it('lets the viewer hide and restore on-screen captions', async () => {
    installManualAnimationFrame();
    const user = userEvent.setup();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={makeAudio()}
        onComplete={() => undefined}
      />,
    );
    const caption = screen.getByText('The job should have taken three days.');
    expect(caption).not.toHaveClass('sr-only');

    await user.click(screen.getByRole('region', { name: 'Opening story' }));
    await user.click(screen.getByRole('button', { name: 'Hide captions' }));
    expect(caption).toHaveClass('sr-only');
    await user.click(screen.getByRole('button', { name: 'Show captions' }));
    expect(caption).not.toHaveClass('sr-only');
  });

  it('stops media and exits exactly once when skipped', async () => {
    installManualAnimationFrame();
    const user = userEvent.setup();
    const audio = makeAudio();
    const onComplete = vi.fn();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        onComplete={onComplete}
      />,
    );

    await user.click(screen.getByRole('region', { name: 'Opening story' }));
    await user.click(screen.getByRole('button', { name: 'Skip opening' }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(audio.stop).toHaveBeenCalledOnce();
  });

  it('auto-completes even when audio playback never settles', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const clock = installManualAnimationFrame();
    const audio = makeAudio();
    audio.play.mockImplementation(() => new Promise<void>(() => undefined));
    const onComplete = vi.fn();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        onComplete={onComplete}
      />,
    );
    await act(async () => undefined);
    expect(audio.play).toHaveBeenCalledOnce();

    clock.frame(105_000);
    act(() => vi.advanceTimersByTime(1_250));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('holds the final title for 1.25 seconds, then auto-returns exactly once', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const clock = installManualAnimationFrame();
    const audio = makeAudio();
    audio.preload.mockImplementation(() => new Promise<void>(() => undefined));
    const onComplete = vi.fn();
    const renderOpening = (finish: () => void) => (
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={audio}
        completionLabel="Return to Chronicle"
        onComplete={finish}
      />
    );
    const { rerender } = render(renderOpening(() => onComplete()));
    await act(async () => undefined);

    clock.frame(105_000);
    expect(screen.getByText('MORROWMERE')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Return to Chronicle' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replay opening' })).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(600));
    rerender(renderOpening(() => onComplete()));
    act(() => vi.advanceTimersByTime(649));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onComplete).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('uses still or crossfade presentation when reduced motion is enabled', async () => {
    installManualAnimationFrame();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={{ ...SETTINGS, reducedMotion: true }}
        audio={makeAudio()}
        onComplete={() => undefined}
      />,
    );

    expect(await screen.findByTestId('opening-visual')).toHaveClass('is-reduced-motion');
    expect(screen.getByRole('img', { name: 'Dawn over the fractured kingdom of Morrowmere.' })).toBeVisible();
  });

  it('keeps the visual timeline running when audio preload fails', async () => {
    const clock = installManualAnimationFrame();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={makeAudio({ rejectPreload: true })}
        onComplete={() => undefined}
      />,
    );

    expect(await screen.findByText('Audio is unavailable. Captions will continue.')).toBeVisible();
    clock.frame(7_500);
    expect(screen.getByText(/Escort two wagons of medicine north/)).toBeVisible();
    expect(screen.queryByText(/illustrated opening could not be loaded/i)).not.toBeInTheDocument();
  });

  it('falls back to the complete readable prologue when art fails', async () => {
    installManualAnimationFrame();
    render(
      <OpeningCinematic
        sequence={OPENING_SEQUENCE}
        settings={SETTINGS}
        audio={makeAudio()}
        onComplete={() => undefined}
      />,
    );
    fireEvent.error(screen.getByRole('img'));
    await screen.findByText('The illustrated opening could not be loaded. No story information has been lost.');
    const fallback = screen.getByRole('region', { name: 'Opening story' });
    for (const paragraph of APPROVED_NARRATION) expect(fallback).toHaveTextContent(paragraph);
    expect(screen.getByRole('button', { name: 'Finish opening' })).toBeVisible();
  });
});

describe('first-launch preferences route', () => {
  it('returns all five opening preferences before continuing', async () => {
    const user = userEvent.setup();
    const completed = vi.fn();
    render(
      <OnboardingScreen
        initialSettings={SETTINGS}
        onBack={() => undefined}
        onComplete={completed}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Set your opening preferences' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Music volume' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Sound effects volume' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Voice volume' })).toBeVisible();
    await user.click(screen.getByRole('checkbox', { name: 'Show captions' }));
    await user.click(screen.getByRole('checkbox', { name: 'Use haptics' }));
    await user.click(screen.getByRole('button', { name: 'Watch opening story' }));

    expect(completed).toHaveBeenCalledWith(expect.objectContaining({ captions: false, hapticsEnabled: false }));
  });

  it('routes an empty slot through preferences, opening story, and then class selection', async () => {
    installManualAnimationFrame();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Begin slot 1' }));
    expect(screen.getByRole('heading', { name: 'Set your opening preferences' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Watch opening story' }));
    expect(await screen.findByRole('region', { name: 'Opening story' })).toBeVisible();
    await user.click(screen.getByRole('region', { name: 'Opening story' }));
    await user.click(screen.getByRole('button', { name: 'Skip opening' }));
    expect(screen.getByRole('heading', { name: 'Choose your path' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Opening story' })).not.toBeInTheDocument();
  });
});
