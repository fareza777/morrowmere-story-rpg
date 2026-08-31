import { useState } from 'react';
import type { UiSettings } from '../ui/types';
import { ArrowLeft, ArrowRight } from './icons';

interface OnboardingScreenProps {
  readonly initialSettings: UiSettings;
  readonly onBack: () => void;
  readonly onComplete: (settings: UiSettings) => void;
}

type VolumeKey = 'musicVolume' | 'sfxVolume' | 'voiceVolume';

function percent(value: number): number {
  return Math.round(value * 100);
}

export function OnboardingScreen({ initialSettings, onBack, onComplete }: OnboardingScreenProps) {
  const [settings, setSettings] = useState(initialSettings);

  const changeVolume = (key: VolumeKey, value: string) => {
    setSettings((current) => ({ ...current, [key]: Number(value) / 100 }));
  };

  return (
    <main className="onboarding-screen">
      <div
        className="onboarding-art"
        style={{ backgroundImage: "url('/assets/onboarding/chronicle.webp')" }}
        aria-hidden="true"
      />
      <section className="onboarding-copy">
        <p className="eyebrow">Before the road begins</p>
        <h1>Set your opening preferences</h1>
        <p>
          Set sound and feedback now. You can change every option later from Settings.
        </p>

        <div className="onboarding-preferences" aria-label="Opening preferences">
          <label className="setting-range">
            <span><strong>Music</strong><output>{percent(settings.musicVolume)}%</output></span>
            <input
              aria-label="Music volume"
              type="range"
              min="0"
              max="100"
              step="10"
              value={percent(settings.musicVolume)}
              onChange={(event) => changeVolume('musicVolume', event.target.value)}
            />
          </label>

          <label className="setting-range">
            <span><strong>Sound effects</strong><output>{percent(settings.sfxVolume)}%</output></span>
            <input
              aria-label="Sound effects volume"
              type="range"
              min="0"
              max="100"
              step="10"
              value={percent(settings.sfxVolume)}
              onChange={(event) => changeVolume('sfxVolume', event.target.value)}
            />
          </label>

          <label className="setting-range">
            <span><strong>Voice</strong><output>{percent(settings.voiceVolume)}%</output></span>
            <input
              aria-label="Voice volume"
              type="range"
              min="0"
              max="100"
              step="10"
              value={percent(settings.voiceVolume)}
              onChange={(event) => changeVolume('voiceVolume', event.target.value)}
            />
          </label>

          <label className="setting-toggle">
            <span>
              <strong>Show captions</strong>
              <small>Recommended even when voice is off.</small>
            </span>
            <input
              aria-label="Show captions"
              type="checkbox"
              checked={settings.captions}
              onChange={(event) => setSettings((current) => ({ ...current, captions: event.target.checked }))}
            />
          </label>

          <label className="setting-toggle">
            <span>
              <strong>Use haptics</strong>
              <small>Restrained feedback for major impacts.</small>
            </span>
            <input
              aria-label="Use haptics"
              type="checkbox"
              checked={settings.hapticsEnabled}
              onChange={(event) => setSettings((current) => ({ ...current, hapticsEnabled: event.target.checked }))}
            />
          </label>
        </div>

        <div className="onboarding-actions">
          <button className="button button-secondary" type="button" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />Back
          </button>
          <button className="button button-primary" type="button" onClick={() => onComplete(settings)}>
            Watch opening story<ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
