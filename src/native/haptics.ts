import {
  Haptics,
  ImpactStyle as CapacitorImpactStyle,
  NotificationType as CapacitorNotificationType,
} from '@capacitor/haptics';
import type { FeedbackCue } from '../ui/types';

export type HapticCue =
  | 'choice'
  | 'attack'
  | 'miss'
  | 'block'
  | 'critical'
  | 'heavy-damage'
  | 'magic'
  | 'victory'
  | 'level-up'
  | 'defeat';

export type HapticImpactStyle = 'light' | 'medium' | 'heavy';
export type HapticNotificationType = 'success' | 'error';

export interface HapticDriver {
  readonly impact: (style: HapticImpactStyle) => Promise<void>;
  readonly notification: (type: HapticNotificationType) => Promise<void>;
}

const CAPACITOR_IMPACT_STYLE: Readonly<Record<HapticImpactStyle, CapacitorImpactStyle>> = {
  light: CapacitorImpactStyle.Light,
  medium: CapacitorImpactStyle.Medium,
  heavy: CapacitorImpactStyle.Heavy,
};

const CAPACITOR_NOTIFICATION_TYPE: Readonly<Record<HapticNotificationType, CapacitorNotificationType>> = {
  success: CapacitorNotificationType.Success,
  error: CapacitorNotificationType.Error,
};

export const capacitorHapticDriver: HapticDriver = {
  impact: (style) => Haptics.impact({ style: CAPACITOR_IMPACT_STYLE[style] }),
  notification: (type) => Haptics.notification({ type: CAPACITOR_NOTIFICATION_TYPE[type] }),
};

const IMPACT_BY_CUE: Readonly<Partial<Record<HapticCue, HapticImpactStyle>>> = {
  choice: 'light',
  miss: 'light',
  attack: 'medium',
  block: 'medium',
  magic: 'medium',
  critical: 'heavy',
  'heavy-damage': 'heavy',
};

const NOTIFICATION_BY_CUE: Readonly<Partial<Record<HapticCue, HapticNotificationType>>> = {
  victory: 'success',
  'level-up': 'success',
  defeat: 'error',
};

/** Feedback is best-effort presentation only and can never affect game state. */
export async function playHaptic(
  cue: HapticCue,
  settings: { readonly enabled: boolean; readonly reduced: boolean },
  driver: HapticDriver = capacitorHapticDriver,
): Promise<void> {
  if (!settings.enabled) return;

  try {
    if (settings.reduced) {
      await driver.impact('light');
      return;
    }

    const impact = IMPACT_BY_CUE[cue];
    if (impact) {
      await driver.impact(impact);
      return;
    }

    const notification = NOTIFICATION_BY_CUE[cue];
    if (notification) await driver.notification(notification);
  } catch {
    // Browser and unsupported-device failures never interrupt gameplay.
  }
}

async function playFeedbackPattern(
  pattern: Extract<FeedbackCue, { readonly type: 'haptic' }>['pattern'],
  driver: HapticDriver,
): Promise<void> {
  try {
    if (pattern === 'level-up') {
      await driver.notification('success');
    } else if (pattern === 'double') {
      await driver.impact('medium');
      await driver.impact('medium');
    } else if (pattern === 'strong' || pattern === 'heavy') {
      await driver.impact('heavy');
    } else if (pattern === 'medium') {
      await driver.impact('medium');
    } else {
      await driver.impact('light');
    }
  } catch {
    // Native feedback is optional and never interrupts a saved transition.
  }
}

/** Consumes only typed haptic cues; audio and announcements remain with their own ports. */
export function consumeFeedbackHaptics(
  cues: readonly FeedbackCue[],
  driver: HapticDriver = capacitorHapticDriver,
): void {
  for (const cue of cues) if (cue.type === 'haptic') void playFeedbackPattern(cue.pattern, driver);
}
