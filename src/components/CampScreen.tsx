import { Backpack, BookOpenText, FloppyDisk, MapTrifold, UsersThree } from '@phosphor-icons/react';
import type { CampViewModel } from '../ui/types';

interface CampScreenProps {
  readonly view: CampViewModel;
  readonly onChooseRoute: () => void;
  readonly onOpenInventory: () => void;
  readonly onOpenJournal: () => void;
  readonly onOpenCompanions: () => void;
  readonly onSaveAndExit: () => void;
}

export function CampScreen({ view, onChooseRoute, onOpenInventory, onOpenJournal, onOpenCompanions, onSaveAndExit }: CampScreenProps) {
  return (
    <main className="camp-screen screen-page">
      <header className="screen-copy">
        <p className="eyebrow">{view.hero.chapterLabel}</p>
        <h1>Road Camp</h1>
        <p>Rest, prepare your pack, and choose the road ahead. Gold secured here survives a failed expedition.</p>
      </header>
      <section className="objective-card" aria-labelledby="camp-objective-title">
        <span>Current objective</span><h2 id="camp-objective-title">{view.objective.title}</h2><p>{view.objective.summary}</p>
      </section>
      <section className="camp-status" aria-label="Camp status">
        <div><strong>{view.hero.bankedGold}</strong><span>Banked gold</span></div>
        <div><strong>{view.hero.level}</strong><span>Hero level</span></div>
        <div><strong>{view.activeCompanion?.name ?? 'None'}</strong><span>Companion</span></div>
      </section>
      <div className="camp-primary-actions">
        <button className="button button-primary" type="button" disabled={!view.canDepart} onClick={onChooseRoute}><MapTrifold size={22} weight="duotone" aria-hidden="true" /> Choose a Route</button>
        <button className="button button-secondary" type="button" onClick={onSaveAndExit}><FloppyDisk size={22} weight="duotone" aria-hidden="true" /> Save &amp; Exit</button>
      </div>
      <nav className="camp-services" aria-label="Camp services">
        <button type="button" onClick={onOpenInventory}><Backpack size={22} aria-hidden="true" /><span><strong>Pack &amp; Stash</strong><small>{view.hasStashItems ? 'Stored gear is waiting' : 'Manage equipment'}</small></span></button>
        <button type="button" onClick={onOpenCompanions}><UsersThree size={22} aria-hidden="true" /><span><strong>Companions</strong><small>Choose who travels with you</small></span></button>
        <button type="button" onClick={onOpenJournal}><BookOpenText size={22} aria-hidden="true" /><span><strong>Journal</strong><small>Review clues and decisions</small></span></button>
      </nav>
    </main>
  );
}
