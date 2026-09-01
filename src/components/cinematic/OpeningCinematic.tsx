import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CinematicAudioPort, CinematicSequence, UiSettings } from '../../ui/types';
import { OPENING_NARRATION } from '../../ui/openingSequence';
import { useCinematicPlayer } from './useCinematicPlayer';

const FINAL_TITLE_HOLD_MS = 1_250;

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
  completionLabel = 'Finish opening',
}: OpeningCinematicProps) {
  const player = useCinematicPlayer(sequence, settings, audio);
  const [captionsVisible, setCaptionsVisible] = useState(settings.captions);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const shot = sequence.shots[player.shotIndex] ?? sequence.shots[0];

  useEffect(() => {
    setCaptionsVisible(settings.captions);
  }, [settings.captions]);

  const completeOnce = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    if (player.status !== 'complete' || completedRef.current) return undefined;
    const timer = window.setTimeout(completeOnce, FINAL_TITLE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [completeOnce, player.status]);

  if (player.status === 'fallback' || !shot) {
    return <StaticOpening onComplete={completeOnce} completionLabel={completionLabel} />;
  }

  const paused = player.status === 'paused';
  const complete = player.status === 'complete';
  const preloading = player.status === 'preloading';
  const durationSeconds = Math.max(1, (shot.endMs - shot.startMs) / 1000);

  const skip = () => {
    player.stop();
    completeOnce();
  };

  return (
    <main
      className="opening-cinematic"
      role="region"
      aria-label="Opening story"
      aria-busy={preloading || undefined}
    >
      <section
        className={`opening-visual motion-${shot.motion}${settings.reducedMotion ? ' is-reduced-motion' : ''}${player.status === 'playing' ? '' : ' is-timeline-paused'}`}
        data-testid="opening-visual"
        style={{ '--shot-duration': `${durationSeconds}s` } as CSSProperties}
      >
        <img key={`${player.runId}:${shot.id}`} src={shot.imageId} alt={shot.alt} onError={player.fail} />
        {player.shotIndex === sequence.shots.length - 1 && (
          <div className="opening-title-card">
            <strong>MORROWMERE</strong>
            <span>Chronicle I — The Black Banner</span>
          </div>
        )}
        <div className="opening-narration">
          <p
            className={captionsVisible ? 'opening-caption' : 'opening-caption sr-only'}
            aria-live="polite"
          >
            {shot.caption}
          </p>

          {player.audioUnavailable && (
            <div className="opening-audio-failure">
              <p className="opening-audio-notice" role="status">
                Audio is unavailable. Captions will continue.
              </p>
              <button
                className="opening-audio-retry"
                type="button"
                disabled={paused}
                onClick={player.retryAudio}
              >
                Retry audio
              </button>
            </div>
          )}
        </div>
      </section>

      {!complete && (
        <div className="opening-cinematic-controls">
          <button
            className="opening-control"
            type="button"
            disabled={preloading}
            onClick={paused ? player.resume : player.pause}
          >
            {paused ? 'Resume opening' : 'Pause opening'}
          </button>
          <button
            className="opening-control"
            type="button"
            aria-pressed={captionsVisible}
            onClick={() => setCaptionsVisible((visible) => !visible)}
          >
            {captionsVisible ? 'Hide captions' : 'Show captions'}
          </button>
          <button className="opening-skip" type="button" onClick={skip}>
            Skip opening
          </button>
        </div>
      )}
    </main>
  );
}
