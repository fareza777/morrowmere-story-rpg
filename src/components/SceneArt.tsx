import { useEffect, useState } from 'react';

interface SceneArtProps {
  readonly illustrationId: string;
  readonly alt: string;
  readonly kind?: 'scene' | 'merchant';
}

export function illustrationSource(illustrationId: string, kind: 'scene' | 'merchant' = 'scene'): string {
  if (kind === 'merchant' && illustrationId.startsWith('merchant-')) return `/assets/chronicle1/merchants/${illustrationId}.webp`;
  const chapter = illustrationId.match(/scene-(ch\d{2})-/u)?.[1] ?? 'ch01';
  return `/assets/chronicle1/scenes/${chapter}/${illustrationId}.webp`;
}

export function SceneArt({ illustrationId, alt, kind = 'scene' }: SceneArtProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [illustrationId]);
  return (
    <figure className="scene-art" data-illustration-id={illustrationId}>
      <img src={illustrationSource(illustrationId, kind)} alt={alt} hidden={failed} onError={() => setFailed(true)} />
      {failed && <div className="scene-art-fallback" role="img" aria-label={alt}><span>Illustration unavailable</span><small>The story remains fully playable.</small></div>}
    </figure>
  );
}
