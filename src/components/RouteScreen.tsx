import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import type { RouteProfileId } from '../game/director/types';
import type { RouteViewModel } from '../ui/types';
import { ChapterHeroArt } from './ChapterHeroArt';

interface RouteScreenProps { readonly view: RouteViewModel; readonly onChooseRoute: (routeId: RouteProfileId) => void; readonly onBack: () => void; }

export function RouteScreen({ view, onChooseRoute, onBack }: RouteScreenProps) {
  return (
    <main className="route-screen screen-page">
      <header className="route-header"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={20} aria-hidden="true" /> Camp</button><div><p className="eyebrow">Plan the expedition</p><h1>Choose Your Road</h1></div></header>
      <ChapterHeroArt chapterLabel={view.hero.chapterLabel} context="route" />
      <p className="route-intro">Three old roads lead onward, each remembered differently in the villages of Morrowmere.</p>
      <div className="route-list">
        {view.routes.map((route) => (
          <button key={route.id} className="route-card" type="button" onClick={() => onChooseRoute(route.id)}>
            <span className="route-card-heading"><strong>{route.label}</strong><ArrowRight size={21} weight="bold" aria-hidden="true" /></span>
            <span className="route-description">{route.description}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
