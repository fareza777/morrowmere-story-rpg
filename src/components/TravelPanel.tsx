import type { TravelAction } from '../game/state/road-tactics';
import type { TravelViewModel } from '../ui/types';

interface TravelPanelProps {
  readonly view: TravelViewModel;
  readonly onAction: (action: TravelAction) => void;
}

export function TravelPanel({ view, onAction }: TravelPanelProps) {
  return (
    <main className="game-main">
      <section className="travel-panel" aria-labelledby="travel-title">
        <header className="travel-heading">
          <p className="eyebrow">{view.chapterLabel} · {view.legLabel}</p>
          <h1 id="travel-title">Road Tactics</h1>
          <p>{view.routeLabel} lies ahead. Choose one way to take the next leg.</p>
        </header>

        <dl className="travel-meters" aria-label="Road conditions">
          <div><dt>Health</dt><dd>{view.hero.health}/{view.hero.maxHealth}</dd></div>
          <div><dt>{view.hero.resourceLabel}</dt><dd>{view.hero.resource}/{view.hero.maxResource}</dd></div>
          <div><dt>Threat</dt><dd>{view.threat}<small>Higher threat draws danger.</small></dd></div>
          <div><dt>Tension</dt><dd>{view.tension}<small>Higher tension presses the road forward.</small></dd></div>
        </dl>

        <aside className="travel-companion" aria-label="Active companion">
          <strong>{view.companion?.name ?? 'No active companion'}</strong>
          <span>{view.companion ? `${view.companion.capabilityLabel}: ${view.companion.capabilityDescription}` : 'Recruit and activate a companion at camp to unlock their road move.'}</span>
        </aside>

        {view.receipt && <aside className="travel-receipt" aria-label="Last road choice"><strong>{view.receipt.label}</strong><span>{view.receipt.summary}</span></aside>}

        <div className="travel-actions" aria-label="Road actions">
          {view.actions.map((action) => {
            const reasonId = action.unavailableReason ? `travel-action-${action.action}-reason` : undefined;
            return (
              <article className={`travel-action${action.available ? '' : ' is-unavailable'}`} key={action.action}>
                <img src={action.artSrc} alt={action.artAlt} width={768} height={512} />
                <div className="travel-action-copy">
                  <h2>{action.label}</h2>
                  <p>{action.cost}</p>
                  <p>{action.risk}</p>
                  <small>{action.effectPreview}</small>
                  {action.unavailableReason && <span id={reasonId} className="travel-disabled-reason">{action.unavailableReason}</span>}
                </div>
                <button type="button" disabled={!action.available} aria-describedby={reasonId} onClick={() => onAction(action.action)}>
                  {action.label}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
