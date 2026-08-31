import { useEffect, useState } from 'react';

interface ItemIconProps {
  readonly iconId: string | null;
  readonly name: string;
}

export function itemIconSource(iconId: string): string {
  return `/assets/chronicle1/items/${iconId}.webp`;
}

export function ItemIcon({ iconId, name }: ItemIconProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [iconId]);
  const fallback = !iconId || failed;
  return (
    <span className="item-icon" aria-hidden="true">
      {!fallback && <img data-testid="item-icon-image" src={itemIconSource(iconId)} alt="" onError={() => setFailed(true)} />}
      {fallback && <span data-testid="item-icon-fallback">{name.trim().charAt(0).toUpperCase() || 'M'}</span>}
    </span>
  );
}
