import type { GameCommand, GameSettings } from '../game/state';
import { Sheet } from './Sheet';

interface SettingsSheetProps {
  readonly settings: GameSettings;
  readonly dispatch: (command: GameCommand) => void;
  readonly onClose: () => void;
}

export function SettingsSheet({ settings, dispatch, onClose }: SettingsSheetProps) {
  const update = (change: Partial<GameSettings>) => dispatch({ type: 'UPDATE_SETTINGS', settings: change });
  return (
    <Sheet title="Settings" onClose={onClose}>
      <label className="setting-range"><span>Text size <strong>{Math.round(settings.textScale * 100)}%</strong></span><input aria-label="Text size" type="range" min="90" max="130" step="10" value={Math.round(settings.textScale * 100)} onChange={(event) => update({ textScale: Number(event.target.value) / 100 })} /></label>
      <label className="setting-toggle"><span><strong>High contrast</strong><small>Strengthen edges and secondary text.</small></span><input type="checkbox" checked={settings.highContrast} onChange={(event) => update({ highContrast: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Reduce motion</strong><small>Remove scene and interface transitions.</small></span><input aria-label="Reduce motion" type="checkbox" checked={settings.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Sound</strong><small>Combat and interface feedback.</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => update({ sound: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Music</strong><small>Low ambient score during the Chronicle.</small></span><input type="checkbox" checked={settings.music} onChange={(event) => update({ music: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Screen reader narration</strong><small>Announce story transitions and combat outcomes.</small></span><input type="checkbox" checked={settings.narration} onChange={(event) => update({ narration: event.target.checked })} /></label>
    </Sheet>
  );
}
