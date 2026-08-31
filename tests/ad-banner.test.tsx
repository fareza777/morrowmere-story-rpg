import {
  BannerAdPosition,
  BannerAdSize,
  type AdMobBannerSize,
  type AdMobError,
} from '@capacitor-community/admob';
import type { PluginListenerHandle } from '@capacitor/core';
import { describe, expect, it, vi } from 'vitest';

import {
  createBannerController,
  placementForView,
  type BannerControllerPlugin,
} from '../src/native/ads/banner-controller';
import type { AdConfig } from '../src/native/ads/types';

const TEST_CONFIG: AdConfig = {
  enabled: true,
  testing: true,
  bannerId: 'ca-app-pub-3940256099942544/9214589741',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
};

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve = (): void => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function flushMicrotasks(): Promise<void> {
  for (let index = 0; index < 10; index += 1) {
    await Promise.resolve();
  }
}

function createPlugin(
  showBanner: BannerControllerPlugin['showBanner'] = vi.fn(async () => undefined),
): {
  plugin: BannerControllerPlugin;
  handles: readonly PluginListenerHandle[];
  emitSize: (height: number) => void;
  emitFailure: () => void;
  emitClosed: () => void;
} {
  let sizeListener: ((size: AdMobBannerSize) => void) | null = null;
  let failureListener: ((error: AdMobError) => void) | null = null;
  let closedListener: (() => void) | null = null;
  const handles = [0, 1, 2].map((): PluginListenerHandle => ({
    remove: vi.fn(async () => undefined),
  }));

  const plugin: BannerControllerPlugin = {
    showBanner,
    hideBanner: vi.fn(async () => undefined),
    resumeBanner: vi.fn(async () => undefined),
    removeBanner: vi.fn(async () => undefined),
    addBannerSizeChangedListener: vi.fn(async (listener) => {
      sizeListener = listener;
      return handles[0];
    }),
    addBannerFailedToLoadListener: vi.fn(async (listener) => {
      failureListener = listener;
      return handles[1];
    }),
    addBannerClosedListener: vi.fn(async (listener) => {
      closedListener = listener;
      return handles[2];
    }),
  };

  return {
    plugin,
    handles,
    emitSize: (height) => sizeListener?.({ width: 320, height }),
    emitFailure: () => failureListener?.({ code: 1, message: 'load failed' }),
    emitClosed: () => closedListener?.(),
  };
}

describe('placementForView', () => {
  it.each([
    ['title', 'title'],
    ['camp', 'camp'],
    ['merchant', 'merchant'],
    ['journal', 'none'],
    ['opening', 'none'],
    ['onboarding', 'none'],
    ['new-run', 'none'],
    ['story', 'none'],
    ['combat', 'none'],
    ['boss', 'none'],
    ['reward', 'none'],
    ['defeat', 'none'],
    ['ending', 'none'],
  ] as const)('maps %s to %s', (surface, expected) => {
    expect(placementForView(surface)).toBe(expected);
  });
});

describe('banner controller', () => {
  it('registers listeners once and synchronizes one measured banner across approved placements', async () => {
    const { plugin, emitSize } = createPlugin();
    const controller = createBannerController(TEST_CONFIG, plugin);
    const titleInset = vi.fn();
    const campInset = vi.fn();
    const hiddenInset = vi.fn();
    const merchantInset = vi.fn();

    await controller.setPlacement('title', true, titleInset);
    expect(plugin.showBanner).toHaveBeenCalledWith({
      adId: 'ca-app-pub-3940256099942544/9214589741',
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: true,
    });
    emitSize(54);
    expect(titleInset).toHaveBeenLastCalledWith(54);

    await controller.setPlacement('camp', true, campInset);
    expect(titleInset).toHaveBeenLastCalledWith(0);
    expect(campInset).toHaveBeenLastCalledWith(54);
    expect(plugin.showBanner).toHaveBeenCalledTimes(1);

    await controller.setPlacement('none', true, hiddenInset);
    expect(hiddenInset).toHaveBeenLastCalledWith(0);
    expect(plugin.hideBanner).toHaveBeenCalledTimes(1);

    await controller.setPlacement('merchant', true, merchantInset);
    expect(plugin.resumeBanner).toHaveBeenCalledTimes(1);
    expect(merchantInset).toHaveBeenLastCalledWith(54);
    expect(plugin.addBannerSizeChangedListener).toHaveBeenCalledTimes(1);
    expect(plugin.addBannerFailedToLoadListener).toHaveBeenCalledTimes(1);
    expect(plugin.addBannerClosedListener).toHaveBeenCalledTimes(1);
  });

  it('propagates only finite nonnegative heights to the active inset callback', async () => {
    const { plugin, emitSize } = createPlugin();
    const controller = createBannerController(TEST_CONFIG, plugin);
    const inset = vi.fn();

    await controller.setPlacement('title', true, inset);
    emitSize(Number.NaN);
    expect(inset).toHaveBeenLastCalledWith(0);
    emitSize(Number.POSITIVE_INFINITY);
    expect(inset).toHaveBeenLastCalledWith(0);
    emitSize(-4);
    expect(inset).toHaveBeenLastCalledWith(0);
    emitSize(0);
    expect(inset).toHaveBeenLastCalledWith(0);
    emitSize(54.5);
    expect(inset).toHaveBeenLastCalledWith(54.5);
  });

  it('zeros the inset after failure and close, then uses show or resume for the next request', async () => {
    const { plugin, emitSize, emitFailure, emitClosed } = createPlugin();
    const controller = createBannerController(TEST_CONFIG, plugin);
    const inset = vi.fn();

    await controller.setPlacement('title', true, inset);
    emitSize(54);
    emitFailure();
    expect(inset).toHaveBeenLastCalledWith(0);

    await controller.setPlacement('title', true, inset);
    expect(plugin.showBanner).toHaveBeenCalledTimes(2);
    emitSize(48);
    emitClosed();
    expect(inset).toHaveBeenLastCalledWith(0);

    await controller.setPlacement('title', true, inset);
    expect(plugin.resumeBanner).toHaveBeenCalledTimes(1);
  });

  it('does not register or show for a disallowed placement or before consent permits requests', async () => {
    const { plugin } = createPlugin();
    const controller = createBannerController(TEST_CONFIG, plugin);
    const inset = vi.fn();

    await controller.setPlacement('title', false, inset);
    expect(inset).toHaveBeenLastCalledWith(0);
    expect(plugin.addBannerSizeChangedListener).not.toHaveBeenCalled();
    expect(plugin.showBanner).not.toHaveBeenCalled();

    await controller.setPlacement('journal', true, inset);
    expect(plugin.addBannerSizeChangedListener).not.toHaveBeenCalled();
    expect(plugin.showBanner).not.toHaveBeenCalled();

    await controller.setPlacement('title', true, inset);
    expect(plugin.addBannerSizeChangedListener).toHaveBeenCalledTimes(1);
    expect(plugin.showBanner).toHaveBeenCalledTimes(1);
  });

  it('hides a late show result when placement changes during the native call', async () => {
    const pendingShow = deferred();
    const showBanner = vi.fn(() => pendingShow.promise);
    const { plugin } = createPlugin(showBanner);
    const controller = createBannerController(TEST_CONFIG, plugin);
    const inset = vi.fn();

    const showRequest = controller.setPlacement('title', true, inset);
    await flushMicrotasks();
    expect(showBanner).toHaveBeenCalledTimes(1);

    const hideRequest = controller.setPlacement('none', true, inset);
    pendingShow.resolve();
    await Promise.all([showRequest, hideRequest]);

    expect(plugin.hideBanner).toHaveBeenCalledTimes(1);
    expect(inset).toHaveBeenLastCalledWith(0);
  });

  it('removes each listener handle and the final banner exactly once on destroy', async () => {
    const { plugin, handles, emitSize } = createPlugin();
    const controller = createBannerController(TEST_CONFIG, plugin);
    const inset = vi.fn();

    await controller.setPlacement('title', true, inset);
    emitSize(54);
    await controller.destroy();
    await controller.destroy();

    expect(inset).toHaveBeenLastCalledWith(0);
    for (const handle of handles) {
      expect(handle.remove).toHaveBeenCalledTimes(1);
    }
    expect(plugin.removeBanner).toHaveBeenCalledTimes(1);

    const callsAfterDestroy = inset.mock.calls.length;
    emitSize(80);
    expect(inset).toHaveBeenCalledTimes(callsAfterDestroy);
  });
});
