import { describe, expect, it, vi } from 'vitest';
import {
  subscribeToAppLifecycle,
  type BrowserEventSource,
  type BrowserLifecycleDriver,
  type LifecycleDriver,
  type LifecycleListenerHandle,
} from '../src/native/lifecycle';

interface FakeNativeLifecycleDriver extends LifecycleDriver {
  readonly emitPause: () => void;
  readonly emitResume: () => void;
  readonly emitBack: () => void;
  readonly removeListener: ReturnType<typeof vi.fn>;
}

function fakeLifecycleDriver(): FakeNativeLifecycleDriver {
  const appStateListeners = new Set<(isActive: boolean) => void>();
  const backListeners = new Set<() => void>();
  const removeListener = vi.fn();

  const handleFor = (remove: () => void): LifecycleListenerHandle => ({
    remove: async () => {
      remove();
      removeListener();
    },
  });

  return {
    isNative: () => true,
    getBrowserDriver: () => null,
    addAppStateListener: async (listener) => {
      appStateListeners.add(listener);
      return handleFor(() => appStateListeners.delete(listener));
    },
    addBackButtonListener: async (listener) => {
      backListeners.add(listener);
      return handleFor(() => backListeners.delete(listener));
    },
    emitPause: () => appStateListeners.forEach((listener) => listener(false)),
    emitResume: () => appStateListeners.forEach((listener) => listener(true)),
    emitBack: () => backListeners.forEach((listener) => listener()),
    removeListener,
  };
}

class FakeEventSource implements BrowserEventSource {
  private readonly listeners = new Map<string, Set<() => void>>();

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: () => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener());
  }
}

describe('subscribeToAppLifecycle', () => {
  it('flushes once when Android pauses and removes every listener on cleanup', async () => {
    const driver = fakeLifecycleDriver();
    const onPause = vi.fn();
    const cleanup = await subscribeToAppLifecycle({ onPause, onResume: vi.fn(), onBack: vi.fn() }, driver);

    driver.emitPause();
    driver.emitPause();
    expect(onPause).toHaveBeenCalledOnce();

    await cleanup();
    driver.emitPause();
    driver.emitBack();
    expect(onPause).toHaveBeenCalledOnce();
    expect(driver.removeListener).toHaveBeenCalledTimes(2);
  });

  it('resumes only after a pause and forwards native hardware back', async () => {
    const driver = fakeLifecycleDriver();
    const onResume = vi.fn();
    const onBack = vi.fn();
    const cleanup = await subscribeToAppLifecycle({ onPause: vi.fn(), onResume, onBack }, driver);

    driver.emitResume();
    driver.emitPause();
    driver.emitResume();
    driver.emitResume();
    driver.emitBack();

    expect(onResume).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
    await cleanup();
  });

  it('deduplicates visibility and pagehide pauses on web and removes both listeners', async () => {
    const document = new FakeEventSource();
    const window = new FakeEventSource();
    let hidden = false;
    const browser: BrowserLifecycleDriver = { document, window, isHidden: () => hidden };
    const driver: LifecycleDriver = {
      isNative: () => false,
      getBrowserDriver: () => browser,
      addAppStateListener: async () => { throw new Error('native listener must not be registered'); },
      addBackButtonListener: async () => { throw new Error('native listener must not be registered'); },
    };
    const onPause = vi.fn();
    const onResume = vi.fn();
    const cleanup = await subscribeToAppLifecycle({ onPause, onResume, onBack: vi.fn() }, driver);

    hidden = true;
    document.emit('visibilitychange');
    window.emit('pagehide');
    expect(onPause).toHaveBeenCalledOnce();

    hidden = false;
    document.emit('visibilitychange');
    expect(onResume).toHaveBeenCalledOnce();

    await cleanup();
    hidden = true;
    document.emit('visibilitychange');
    window.emit('pagehide');
    expect(onPause).toHaveBeenCalledOnce();
  });
});
