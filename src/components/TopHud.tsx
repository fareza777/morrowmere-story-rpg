import { Backpack, BookOpenText, Coins, GearSix, Heart, Lightning, MapTrifold, Pause, UsersThree } from '@phosphor-icons/react';
import type { CompanionSummaryViewModel, HeroHudViewModel } from '../ui/types';

export type HudMenu = 'inventory' | 'journal' | 'companions' | 'settings' | 'pause';

interface TopHudProps {
  readonly hero: HeroHudViewModel;
  readonly companion: CompanionSummaryViewModel | null;
  readonly onOpenMenu: (menu: HudMenu) => void;
}

export function TopHud({ hero, companion, onOpenMenu }: TopHudProps) {
  return (
    <header className="top-hud">
      <div className="hud-location">
        <MapTrifold size={18} weight="duotone" aria-hidden="true" />
        <span>
          <strong>{hero.locationLabel}</strong>
          <small>{hero.chapterLabel} · Level {hero.level}</small>
        </span>
      </div>
      <div className="hud-vitals" aria-label="Hero resources">
        <span aria-label={`${hero.health} of ${hero.maxHealth} Health`}><Heart size={17} weight="fill" aria-hidden="true" />{hero.health}/{hero.maxHealth}</span>
        <span aria-label={`${hero.resource} of ${hero.maxResource} ${hero.resourceLabel}`}><Lightning size={17} weight="fill" aria-hidden="true" />{hero.resource}/{hero.maxResource}<small>{hero.resourceLabel}</small></span>
      </div>
      <div className="hud-meta"><span title="Banked gold"><Coins size={16} aria-hidden="true" />{hero.bankedGold} banked</span><span title="Carried gold">{hero.carriedGold} carried</span>{companion && <span><UsersThree size={16} aria-hidden="true" />{companion.name}</span>}</div>
      <nav className="hud-nav" aria-label="Game menus">
        <button type="button" aria-label="Pack" onClick={() => onOpenMenu('inventory')}><Backpack size={19} aria-hidden="true" /><span>Pack</span></button>
        <button type="button" aria-label="Journal" onClick={() => onOpenMenu('journal')}><BookOpenText size={19} aria-hidden="true" /><span>Journal</span></button>
        <button type="button" aria-label="Companions" onClick={() => onOpenMenu('companions')}><UsersThree size={19} aria-hidden="true" /><span>Allies</span></button>
        <button type="button" aria-label="Settings" onClick={() => onOpenMenu('settings')}><GearSix size={19} aria-hidden="true" /><span>Settings</span></button>
        <button type="button" aria-label="Pause" onClick={() => onOpenMenu('pause')}><Pause size={19} aria-hidden="true" /><span>Pause</span></button>
      </nav>
    </header>
  );
}
