import { useLayoutEffect, useMemo, useState } from 'react';
import { OpeningCinematic } from './components/cinematic/OpeningCinematic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LaunchSplash } from './components/LaunchSplash';
import { NewRunScreen } from './components/NewRunScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { TitleScreen } from './components/TitleScreen';
import { playSfx } from './game/audio';
import { CHRONICLE1_CONTENT } from './game/content/chronicle1';
import type { ContentIndex } from './game/content/schema';
import { createSaveRepository } from './game/persistence/repository';
import { OPENING_SEQUENCE } from './ui/openingSequence';
import type { UiPorts, UiSettings } from './ui/types';
import { useGameSession } from './ui/useGameSession';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';
import './styles/cinematic.css';

const DEFAULT_UI_SETTINGS: UiSettings = Object.freeze({
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  hapticsEnabled: true,
  reducedHaptics: false,
  sfxVolume: 0.8,
  musicVolume: 0.7,
  voiceVolume: 0.9,
  captions: true,
  voiceReplay: 'automatic',
  screenReaderAnnouncements: true,
});

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
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_UI_SETTINGS);
  const [replayingOpening, setReplayingOpening] = useState(false);
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
      <ErrorBoundary onReset={() => { setReplayingOpening(false); session.returnToTitle(); }}>
        {replayingOpening ? (
          <OpeningCinematic
            sequence={OPENING_SEQUENCE}
            settings={settings}
            audio={PORTS.cinematicAudio}
            completionLabel="Return to Chronicle"
            onComplete={() => setReplayingOpening(false)}
          />
        ) : (
          <>
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
                initialSettings={settings}
                onBack={session.returnToTitle}
                onComplete={(nextSettings) => {
                  setSettings(nextSettings);
                  session.showOpening();
                }}
              />
            )}
            {session.view === 'opening' && (
              <OpeningCinematic
                sequence={OPENING_SEQUENCE}
                settings={settings}
                audio={PORTS.cinematicAudio}
                onComplete={session.showNewRun}
              />
            )}
            {session.view === 'new-run' && (
              <NewRunScreen
                onBack={session.showOpening}
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
                    <button className="button button-secondary" type="button" onClick={() => setReplayingOpening(true)}>
                      Replay Opening Story
                    </button>
                    <button className="button button-secondary" type="button" onClick={session.saveAndExit}>
                      Save &amp; Exit
                    </button>
                  </div>
                </section>
              </main>
            )}
          </>
        )}
      </ErrorBoundary>
    </>
  );
}
