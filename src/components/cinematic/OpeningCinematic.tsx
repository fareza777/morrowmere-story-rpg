import type { CinematicAudioPort, CinematicSequence, UiSettings } from '../../ui/types';
import { OPENING_NARRATION } from '../../ui/openingSequence';
import { useCinematicPlayer } from './useCinematicPlayer';

export interface OpeningCinematicProps {
  readonly sequence: CinematicSequence;
  readonly settings: UiSettings;
  readonly audio: CinematicAudioPort;
  readonly onComplete: () => void;
  readonly completionLabel?: string;
}

interface StaticOpeningProps {
  readonly onComplete: () => void;
  readonly completionLabel: string;
}

function StaticOpening({ onComplete, completionLabel }: StaticOpeningProps) {
  return (
    <main className="opening-fallback" role="region" aria-label="Opening story">
      <section className="opening-fallback-copy">
        <p className="eyebrow">Opening story · Readable edition</p>
        <h1>The Greywatch Road</h1>
        <p className="opening-fallback-note" role="status">
          The illustrated opening could not be loaded. No story information has been lost.
        </p>
        <div className="opening-transcript">
          {OPENING_NARRATION.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <button className="button button-primary" type="button" onClick={onComplete}>
          {completionLabel}
        </button>
      </section>
    </main>
  );
}

export function OpeningCinematic({
  sequence,
  settings,
  audio,
  onComplete,
  completionLabel = 'Continue to class selection',
}: OpeningCinematicProps) {
  const player = useCinematicPlayer(sequence, settings, audio);
  const shot = sequence.shots[player.shotIndex] ?? sequence.shots[0];

  if (player.status === 'fallback' || !shot) {
    return <StaticOpening onComplete={onComplete} completionLabel={completionLabel} />;
  }

  const complete = player.status === 'complete';
  const paused = player.status === 'paused';
  const progress = Math.min(100, Math.max(0, (player.positionMs / sequence.durationMs) * 100));
  const durationSeconds = Math.max(1, (shot.endMs - shot.startMs) / 1000);

  const skip = () => {
    player.stop();
    onComplete();
  };

  return (
    <main className="opening-cinematic" role="region" aria-label="Opening story">
      <section
        className={`opening-visual motion-${shot.motion}${settings.reducedMotion ? ' is-reduced-motion' : ''}${player.status === 'playing' ? '' : ' is-timeline-paused'}`}
        data-testid="opening-visual"
        style={{ '--shot-duration': `${durationSeconds}s` } as React.CSSProperties}
      >
        <img key={`${player.runId}:${shot.id}`} src={shot.imageId} alt={shot.alt} onError={player.fail} />
        {player.shotIndex === sequence.shots.length - 1 && (
          <div className="opening-title-card" aria-hidden="true">
            <strong>MORROWMERE</strong>
            <span>Chronicle I — The Black Banner</span>
          </div>
        )}
      </section>

      <section className="opening-story-panel">
        <header className="opening-story-meta">
          <div>
            <p className="eyebrow">Opening story</p>
            <span>Scene {player.shotIndex + 1} of {sequence.shots.length}</span>
          </div>
          <span>{complete ? 'Story complete' : paused ? 'Paused' : player.status === 'preloading' ? 'Preparing audio' : 'Playing'}</span>
        </header>

        <div className="opening-progress" aria-label={`Opening progress ${Math.round(progress)} percent`}>
          <span style={{ inlineSize: `${progress}%` }} />
        </div>

        <p
          className={settings.captions ? 'opening-caption' : 'opening-caption sr-only'}
          aria-live="polite"
        >
          {shot.caption}
        </p>

        {player.audioUnavailable && (
          <p className="opening-audio-notice" role="status">
            Audio is unavailable. Captions will continue.
          </p>
        )}

        {complete ? (
          <div className="opening-controls opening-controls-complete">
            <button className="button button-secondary" type="button" onClick={player.replay}>
              Replay opening
            </button>
            <button className="button button-primary" type="button" onClick={onComplete}>
              {completionLabel}
            </button>
          </div>
        ) : (
          <div className="opening-controls">
            <button
              className="button button-secondary"
              type="button"
              disabled={player.status === 'preloading'}
              onClick={paused ? player.resume : player.pause}
            >
              {paused ? 'Resume opening' : 'Pause opening'}
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={player.status === 'preloading'}
              onClick={player.replay}
            >
              Replay opening
            </button>
            <button className="opening-skip" type="button" onClick={skip}>
              Skip opening
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
