import { useEffect, useRef, type ReactNode } from 'react';
import type { DialogueBeatViewModel } from '../ui/types';
import { characterIllustrationSource } from './SceneArt';

interface DialoguePanelProps {
  readonly beat: DialogueBeatViewModel;
  readonly reducedMotion: boolean;
  readonly onAdvance: () => void;
  readonly onRevealVoiced: () => void;
  readonly voiceRevealPending: boolean;
  readonly responses: ReactNode;
}

export function DialoguePanel({ beat, reducedMotion, onAdvance, onRevealVoiced, voiceRevealPending, responses }: DialoguePanelProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const priorBeatIndex = useRef<number | null>(null);
  useEffect(() => {
    if (priorBeatIndex.current !== null && priorBeatIndex.current !== beat.index) heading.current?.focus();
    priorBeatIndex.current = beat.index;
  }, [beat.index]);
  const showResponses = beat.isFinal && !voiceRevealPending;

  return (
    <section className="dialogue-panel" aria-labelledby="dialogue-speaker">
      {beat.character && <img className={`dialogue-character-layer dialogue-character-${beat.character.position}${reducedMotion ? '' : ' dialogue-character-enter'}`} data-testid="dialogue-character-layer" data-dialogue-position={beat.character.position} src={characterIllustrationSource(beat.character.illustrationId)} alt="" aria-hidden="true" onError={(event) => { event.currentTarget.hidden = true; }} />}
      <div className="dialogue-speaker-plate">
        <p className="eyebrow">Beat {beat.index + 1} of {beat.total}</p>
        <h2 id="dialogue-speaker" ref={heading} tabIndex={-1}>{beat.speakerName}</h2>
      </div>
      <p className="dialogue-copy" aria-live="polite" aria-atomic="true">{beat.speakerName}: {beat.text}</p>
      {!beat.isFinal && <button className="button button-primary dialogue-continue" type="button" onClick={onAdvance}>Continue</button>}
      {beat.isFinal && voiceRevealPending && <button className="button button-primary dialogue-reveal" type="button" onClick={onRevealVoiced}>Tap to reveal responses</button>}
      {showResponses && <div className="dialogue-responses">{responses}</div>}
    </section>
  );
}
