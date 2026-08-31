import { useLayoutEffect, useMemo } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LaunchSplash } from './components/LaunchSplash';
import { NewRunScreen } from './components/NewRunScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { TitleScreen } from './components/TitleScreen';
import { playSfx } from './game/audio';
import { CHRONICLE1_CONTENT } from './game/content/chronicle1';
import type { ContentIndex } from './game/content/schema';
import { createSaveRepository } from './game/persistence/repository';
import type { UiPorts } from './ui/types';
import { useGameSession } from './ui/useGameSession';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';

const partialContent = CHRONICLE1_CONTENT as Partial<ContentIndex>;
const CONTENT: ContentIndex = Object.freeze({
  events: partialContent.events ?? new Map(),
  items: partialContent.items ?? new Map(),
  enemies: partialContent.enemies ?? new Map(),
  encounters: partialContent.encounters ?? new Map(),
  companions: partialContent.companions ?? new Map(),
  merchants: partialContent.merchants ?? new Map(),
  artIds: partialContent.artIds ?? new Set(),
  audioIds: partialContent.audioIds ?? new Set(),
});

const PORTS: UiPorts = {
  feedback: { consume(): void {} },
  cinematicAudio: {
    async preload(): Promise<void> {},
    async play(): Promise<void> {},
    pause(): void {},
    seek(): void {},
    stop(): void {},
    setVolumes(): void {},
  },
  now: () => Date.now(),
};

export default function App() {
  const repository = useMemo(
    () => createSaveRepository(window.localStorage, () => new Date().toISOString(), CONTENT),
    [],
  );
  const session = useGameSession(repository, CONTENT, PORTS);

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
  }, [session.view]);

  return (
    <>
      <LaunchSplash />
      <ErrorBoundary onReset={session.returnToTitle}>
        {session.view === 'title' && (
          <TitleScreen
            slots={session.slots}
            onContinue={(slot) => { playSfx('ui'); session.continueSlot(slot); }}
            onRecover={(slot) => { playSfx('ui'); session.continueSlot(slot); }}
            onNew={(slot) => { playSfx('ui'); session.beginSlot(slot); }}
          />
        )}
        {session.view === 'preferences' && (
          <OnboardingScreen
            onBack={session.returnToTitle}
            onComplete={session.showNewRun}
          />
        )}
        {session.view === 'new-run' && (
          <NewRunScreen
            onBack={session.returnToTitle}
            onBegin={session.startCampaign}
          />
        )}
        {session.view === 'game' && session.game && (
          <main className="new-run-screen">
            <section className="end-panel" aria-labelledby="campaign-ready-title">
              <p className="eyebrow">Chronicle I — The Black Banner</p>
              <h1 id="campaign-ready-title">{session.game.campaign.heroName}'s road begins at camp.</h1>
              <p>Your campaign is saved. Choose a route when the Chronicle camp screen opens.</p>
              {session.notice && <p role="status">{session.notice}</p>}
              <div className="end-actions">
                <button className="button button-secondary" type="button" onClick={session.saveAndExit}>
                  Save &amp; Exit
                </button>
              </div>
            </section>
          </main>
        )}
      </ErrorBoundary>
    </>
  );
}
