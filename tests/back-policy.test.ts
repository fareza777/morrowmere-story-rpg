import { describe, expect, it } from 'vitest';
import { resolveBackAction } from '../src/native/back-policy';

describe('resolveBackAction', () => {
  it.each([
    [{ overlayOpen: true, modalOpen: false, view: 'game' }, 'close-overlay'],
    [{ overlayOpen: false, modalOpen: true, view: 'game' }, 'close-modal'],
    [{ overlayOpen: false, modalOpen: false, view: 'game' }, 'open-exit-confirmation'],
    [{ overlayOpen: false, modalOpen: false, view: 'title' }, 'minimize-app'],
  ] as const)('resolves Android back priority for %o', (context, expected) => {
    expect(resolveBackAction(context)).toBe(expected);
  });

  it('closes the top modal before its parent overlay', () => {
    expect(resolveBackAction({ overlayOpen: true, modalOpen: true, view: 'game' })).toBe('close-modal');
  });
});
