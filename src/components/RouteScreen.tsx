import { ArrowLeft, ArrowRight, Campfire, Coins, Heartbeat, ShieldWarning, UsersThree } from '@phosphor-icons/react';
import type { RouteProfileId } from '../game/director/types';
import type { RouteViewModel } from '../ui/types';

interface RouteScreenProps { readonly view: RouteViewModel; readonly onChooseRoute: (routeId: RouteProfileId) => void; readonly onBack: () => void; }

export function RouteScreen({ view, onChooseRoute, onBack }: RouteScreenProps) {
  return (
    <main className="route-screen screen-page">
      <header className="route-header"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={20} aria-hidden="true" /> Camp</button><div><p className="eyebrow">Plan the expedition</p><h1>Choose Your Road</h1></div></header>
      <p className="route-intro">Every route reaches the chapter objective, but changes the dangers, supplies, and people you are likely to meet.</p>
      <div className="route-list">
        {view.routes.map((route) => (
          <button key={route.id} className="route-card" type="button" aria-label={`${route.label}: ${route.riskLabel}`} onClick={() => onChooseRoute(route.id)}>
            <span className="route-card-heading"><strong>{route.label}</strong><ArrowRight size={21} weight="bold" aria-hidden="true" /></span>
            <span className="route-description">{route.description}</span>
            <span className="route-facts"><span><ShieldWarning size={17} aria-hidden="true" />{route.riskLabel}</span><span><Heartbeat size={17} aria-hidden="true" />{route.recoveryLabel}</span><span><Coins size={17} aria-hidden="true" />{route.tradeLabel}</span><span><UsersThree size={17} aria-hidden="true" />{route.companionLabel}</span><span><Campfire size={17} aria-hidden="true" />{route.relicLabel}</span></span>
          </button>
        ))}
      </div>
    </main>
  );
}
