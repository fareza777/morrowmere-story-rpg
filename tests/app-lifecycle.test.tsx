import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import App from '../src/App';
import { CHRONICLE1_CONTENT } from '../src/game/content/chronicle1';
import type { SaveRepository } from '../src/game/persistence/repository';
import { createCampaign } from '../src/game/state/create';
import type { AppLifecycleCallbacks } from '../src/native/lifecycle';
import type { AdService, ConsentSnapshot } from '../src/native/ads/types';

const NO_ADS: ConsentSnapshot = { status: 'unavailable', canRequestAds: false, privacyOptionsRequired: false };

function noOpAdService(): AdService {
  return {
    initialize: vi.fn(async () => NO_ADS),
    resolveConsentAtSafeMoment: vi.fn(async () => NO_ADS),
    showPrivacyOptions: vi.fn(async () => undefined),
    setPlacement: vi.fn(async () => undefined),
    preloadRewarded: vi.fn(async () => undefined),
    showRewardedBattleGold: vi.fn(async () => 'unavailable' as const),
    preloadInterstitial: vi.fn(async () => undefined),
    showInterstitial: vi.fn(async () => 'unavailable' as const),
    destroy: vi.fn(async () => undefined),
  };
}

describe('App lifecycle integration', () => {
  it('flushes before audio pause and gives Back overlay/modal/save priority', async () => {
    const state = createCampaign({ heroClass: 'warrior', seed: 17, name: 'Rowan', updatedAt: '2026-09-01T00:00:00.000Z' }, CHRONICLE1_CONTENT);
    const saveSlot = vi.fn(() => ({ ok: true as const }));
    const repository: SaveRepository = {
      loadProfile: vi.fn(() => ({ ok: false as const, reason: 'empty' as const })),
      saveProfile: vi.fn(() => ({ ok: true as const })),
      loadSlot: vi.fn((slot) => slot === 1 ? {
        ok: true as const,
        state,
        source: 'active' as const,
        summary: { title: 'Chronicle I', heroName: 'Rowan', heroClass: 'Warrior', level: 1, chapter: 'Chapter 1', updatedAt: state.updatedAt },
      } : { ok: false as const, reason: 'empty' as const }),
      saveSlot,
      exportSlot: vi.fn(() => null),
      importSlot: vi.fn(() => ({ ok: false as const, reason: 'empty' as const })),
    };
    let lifecycle: AppLifecycleCallbacks | null = null;
    const suspendAudio = vi.fn();
    const resumeAudio = vi.fn();
    const minimizeApp = vi.fn(async () => undefined);
    const ads = noOpAdService();

    render(<App dependencies={{
      saveRepository: repository,
      adService: ads,
      lifecycle: async (callbacks) => { lifecycle = callbacks; return async () => undefined; },
      suspendAudio,
      resumeAudio,
      minimizeApp,
      now: () => Date.parse('2026-09-01T00:10:00.000Z'),
    }} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Continue slot 1' }));
    expect(await screen.findByRole('heading', { name: 'Road Camp' })).toBeVisible();
    await waitFor(() => expect(lifecycle).not.toBeNull());

    fireEvent.click(screen.getByRole('button', { name: /Pack & Stash/i }));
    expect(screen.getByRole('dialog', { name: 'Inventory' })).toBeVisible();
    await waitFor(() => expect(ads.setPlacement).toHaveBeenLastCalledWith('none', expect.any(Function)));
    act(() => lifecycle!.onBack());
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inventory' })).not.toBeInTheDocument());
    act(() => lifecycle!.onBack());
    const exitDialog = await screen.findByRole('dialog', { name: /Save and return to the title/i });
    expect(exitDialog).toBeVisible();

    act(() => lifecycle!.onPause());
    expect(saveSlot).toHaveBeenCalled();
    expect(saveSlot.mock.invocationCallOrder.at(-1)!).toBeLessThan(suspendAudio.mock.invocationCallOrder.at(-1)!);
    act(() => lifecycle!.onResume());
    expect(resumeAudio).toHaveBeenCalledOnce();

    fireEvent.click(within(exitDialog).getByRole('button', { name: 'Save & Exit' }));
    expect(await screen.findByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Replace slot 1' }));
    expect(screen.getByRole('dialog', { name: 'Replace save slot 1?' })).toBeVisible();
    await waitFor(() => expect(ads.setPlacement).toHaveBeenLastCalledWith('none', expect.any(Function)));
    act(() => lifecycle!.onBack());
    expect(screen.queryByRole('dialog', { name: 'Replace save slot 1?' })).not.toBeInTheDocument();
    expect(minimizeApp).not.toHaveBeenCalled();
    act(() => lifecycle!.onBack());
    expect(minimizeApp).toHaveBeenCalledOnce();
  });
});
