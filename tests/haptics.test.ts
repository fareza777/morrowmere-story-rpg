import { describe, expect, it, vi } from 'vitest';
import { playHaptic, type HapticCue, type HapticDriver } from '../src/native/haptics';

function fakeHapticDriver() {
  const impact = vi.fn(async (_style: 'light' | 'medium' | 'heavy') => undefined);
  const notification = vi.fn(async (_type: 'success' | 'error') => undefined);
  return { driver: { impact, notification } satisfies HapticDriver, impact, notification };
}

describe('playHaptic', () => {
  it.each([
    ['choice', 'light'],
    ['miss', 'light'],
    ['attack', 'medium'],
    ['block', 'medium'],
    ['magic', 'medium'],
    ['critical', 'heavy'],
    ['heavy-damage', 'heavy'],
  ] as const)('maps %s to a %s impact without changing gameplay state', async (cue, expected) => {
    const { driver, impact, notification } = fakeHapticDriver();
    await playHaptic(cue, { enabled: true, reduced: false }, driver);
    expect(impact).toHaveBeenCalledExactlyOnceWith(expected);
    expect(notification).not.toHaveBeenCalled();
  });

  it.each([
    ['victory', 'success'],
    ['level-up', 'success'],
    ['defeat', 'error'],
  ] as const)('maps %s to a %s notification', async (cue, expected) => {
    const { driver, impact, notification } = fakeHapticDriver();
    await playHaptic(cue, { enabled: true, reduced: false }, driver);
    expect(notification).toHaveBeenCalledExactlyOnceWith(expected);
    expect(impact).not.toHaveBeenCalled();
  });

  it('reduces critical feedback and suppresses disabled feedback', async () => {
    const { driver, impact } = fakeHapticDriver();
    await playHaptic('critical', { enabled: true, reduced: true }, driver);
    expect(impact).toHaveBeenCalledWith('light');
    await playHaptic('critical', { enabled: false, reduced: false }, driver);
    expect(impact).toHaveBeenCalledOnce();
  });

  it('resolves unsupported native feedback without rejecting gameplay', async () => {
    const driver: HapticDriver = {
      impact: vi.fn(async () => { throw new Error('unsupported'); }),
      notification: vi.fn(async () => { throw new Error('unsupported'); }),
    };
    const cues: readonly HapticCue[] = ['attack', 'victory'];
    for (const cue of cues) {
      await expect(playHaptic(cue, { enabled: true, reduced: false }, driver)).resolves.toBeUndefined();
    }
  });
});
