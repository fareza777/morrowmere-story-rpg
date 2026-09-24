import { useEffect, useState } from 'react';
import { SceneArt } from './SceneArt';

interface BattlefieldArtProps {
  readonly illustrationId: string;
  readonly alt: string;
  readonly fallbackIllustrationId?: string;
  readonly fallbackAlt?: string;
}

export function BattlefieldArt({ illustrationId, alt, fallbackIllustrationId, fallbackAlt }: BattlefieldArtProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [illustrationId]);

  if (failed && fallbackIllustrationId && fallbackAlt) {
    return <SceneArt illustrationId={fallbackIllustrationId} alt={fallbackAlt} />;
  }

  if (failed) {
    return <figure className="battlefield-art battlefield-art-unavailable" aria-label="Battlefield illustration unavailable">
      <p role="status">Battlefield illustration unavailable.</p>
    </figure>;
  }

  return <figure className="battlefield-art">
    <img
      src={`/assets/chronicle1/battles/${illustrationId}.webp`}
      alt={alt}
      width={1536}
      height={1024}
      onError={() => setFailed(true)}
    />
  </figure>;
}
