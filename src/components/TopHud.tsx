import type { GameState, GameCommand } from '../game/state';
import { Backpack, BookOpenText, GearSix, Heart, Lightning, MapTrifold, Skull } from './icons';

const REGION_LABELS = {
  gloamwood: 'Gloamwood Verge',
  'drowned-road': 'The Drowned Road',
  embervault: 'Embervault',
  'crownless-keep': 'Crownless Keep',
} as const;

interface TopHudProps {
  readonly state: GameState;
  readonly dispatch: (command: GameCommand) => void;
}

export function TopHud({ state, dispatch }: TopHudProps) {
  const region = state.route[state.routeIndex]?.region ?? 'gloamwood';
  return (
    <header className="top-hud">
      <div className="hud-location">
        <MapTrifold size={18} weight="duotone" aria-hidden="true" />
        <span>{REGION_LABELS[region]}</span>
        <small>{Math.min(state.routeIndex + 1, state.route.length)} / {state.route.length}</small>
      </div>
      <div className="hud-vitals" aria-label="Hero resources">
        <span aria-label={`${state.hero.health} of ${state.hero.maxHealth} Health`}><Heart size={17} weight="fill" aria-hidden="true" />{state.hero.health}</span>
        <span aria-label={`${state.hero.focus} of ${state.hero.maxFocus} Focus`}><Lightning size={17} weight="fill" aria-hidden="true" />{state.hero.focus}</span>
      </div>
      <nav className="hud-nav" aria-label="Game menus">
        <button type="button" aria-label="Open inventory" onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: 'inventory' })}><Backpack size={21} aria-hidden="true" /></button>
        <button type="button" aria-label="Open Chronicle" onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: 'chronicle' })}><BookOpenText size={21} aria-hidden="true" /></button>
        <button type="button" aria-label="Open bestiary" onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: 'bestiary' })}><Skull size={21} aria-hidden="true" /></button>
        <button type="button" aria-label="Open settings" onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: 'settings' })}><GearSix size={21} aria-hidden="true" /></button>
      </nav>
    </header>
  );
}
