import type { UiSettings } from '../ui/types';
import { Sheet } from './Sheet';

interface SettingsSheetProps { readonly settings: UiSettings; readonly onChange: (settings: UiSettings) => void; readonly onClose: () => void; }

export function SettingsSheet({ settings, onChange, onClose }: SettingsSheetProps) {
  const update = (change: Partial<UiSettings>) => onChange({ ...settings, ...change });
  const percent = (value: number) => Math.round(value * 100);
  return (
    <Sheet title="Settings" onClose={onClose}>
      <label className="setting-range"><span>Text size <strong>{percent(settings.textScale)}%</strong></span><input aria-label="Text size" type="range" min="90" max="140" step="10" value={percent(settings.textScale)} onChange={(event) => update({ textScale: Number(event.target.value) / 100 })} /></label>
      <label className="setting-toggle"><span><strong>High contrast</strong><small>Strengthen text, borders, and focus indicators.</small></span><input aria-label="High contrast" type="checkbox" checked={settings.highContrast} onChange={(event) => update({ highContrast: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Reduce motion</strong><small>Use still images and remove nonessential movement.</small></span><input aria-label="Reduce motion" type="checkbox" checked={settings.reducedMotion} onChange={(event) => update({ reducedMotion: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Haptics</strong><small>Feel battle and important event feedback.</small></span><input aria-label="Haptics" type="checkbox" checked={settings.hapticsEnabled} onChange={(event) => update({ hapticsEnabled: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Reduced haptics</strong><small>Use only minimal vibration patterns.</small></span><input aria-label="Reduced haptics" type="checkbox" disabled={!settings.hapticsEnabled} checked={settings.reducedHaptics} onChange={(event) => update({ reducedHaptics: event.target.checked })} /></label>
      <label className="setting-range"><span>Sound effects volume <strong>{percent(settings.sfxVolume)}%</strong></span><input aria-label="Sound effects volume" type="range" min="0" max="100" value={percent(settings.sfxVolume)} onChange={(event) => update({ sfxVolume: Number(event.target.value) / 100 })} /></label>
      <label className="setting-range"><span>Music volume <strong>{percent(settings.musicVolume)}%</strong></span><input aria-label="Music volume" type="range" min="0" max="100" value={percent(settings.musicVolume)} onChange={(event) => update({ musicVolume: Number(event.target.value) / 100 })} /></label>
      <label className="setting-range"><span>Voice volume <strong>{percent(settings.voiceVolume)}%</strong></span><input aria-label="Voice volume" type="range" min="0" max="100" value={percent(settings.voiceVolume)} onChange={(event) => update({ voiceVolume: Number(event.target.value) / 100 })} /></label>
      <label className="setting-select"><span><strong>Story voice replay</strong><small>Choose whether voiced main scenes replay automatically.</small></span><select aria-label="Story voice replay" value={settings.voiceReplay} onChange={(event) => update({ voiceReplay: event.target.value as UiSettings['voiceReplay'] })}><option value="automatic">Automatic</option><option value="manual">Manual</option></select></label>
      <label className="setting-toggle"><span><strong>Captions</strong><small>Show opening and voiced-story captions independently of sound.</small></span><input aria-label="Captions" type="checkbox" checked={settings.captions} onChange={(event) => update({ captions: event.target.checked })} /></label>
      <label className="setting-toggle"><span><strong>Screen-reader announcements</strong><small>Announce new scenes, intents, and battle outcomes.</small></span><input aria-label="Screen-reader announcements" type="checkbox" checked={settings.screenReaderAnnouncements} onChange={(event) => update({ screenReaderAnnouncements: event.target.checked })} /></label>
    </Sheet>
  );
}
