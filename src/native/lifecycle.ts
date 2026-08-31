import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface BrowserEventSource {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/** Browser-only seam. Native/Capacitor lifecycle composition intentionally lives in the Android layer. */
export interface BrowserLifecycleDriver {
  readonly document: BrowserEventSource;
  readonly window: BrowserEventSource;
  readonly isHidden: () => boolean;
}

export interface AppLifecycleCallbacks {
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onBack: () => void;
}

export interface LifecycleListenerHandle {
  remove(): Promise<void>;
}

export interface LifecycleDriver {
  readonly isNative: () => boolean;
  readonly getBrowserDriver: () => BrowserLifecycleDriver | null;
  readonly addAppStateListener: (
    listener: (isActive: boolean) => void,
  ) => Promise<LifecycleListenerHandle>;
  readonly addBackButtonListener: (
    listener: () => void,
  ) => Promise<LifecycleListenerHandle>;
}

function defaultBrowserDriver(): BrowserLifecycleDriver | null {
  if (typeof document === 'undefined' || typeof window === 'undefined') return null;
  return {
    document: {
      addEventListener: (type, listener) => document.addEventListener(type, listener),
      removeEventListener: (type, listener) => document.removeEventListener(type, listener),
    },
    window: {
      addEventListener: (type, listener) => window.addEventListener(type, listener),
      removeEventListener: (type, listener) => window.removeEventListener(type, listener),
    },
    isHidden: () => document.visibilityState === 'hidden',
  };
}

export const capacitorLifecycleDriver: LifecycleDriver = {
  isNative: () => Capacitor.isNativePlatform(),
  getBrowserDriver: defaultBrowserDriver,
  addAppStateListener: (listener) => App.addListener(
    'appStateChange',
    ({ isActive }) => listener(isActive),
  ),
  addBackButtonListener: (listener) => App.addListener('backButton', listener),
};

async function removeLifecycleListeners(handles: readonly LifecycleListenerHandle[]): Promise<void> {
  await Promise.allSettled(handles.map((handle) => handle.remove()));
}

function subscribeToBrowserLifecycle(
  callbacks: AppLifecycleCallbacks,
  browser: BrowserLifecycleDriver,
): () => Promise<void> {
  let backgrounded = false;
  let cleaned = false;
  const pause = () => {
    if (backgrounded) return;
    backgrounded = true;
    callbacks.onPause();
  };
  const resume = () => {
    if (!backgrounded) return;
    backgrounded = false;
    callbacks.onResume();
  };
  const visibility = () => {
    if (browser.isHidden()) pause();
    else resume();
  };

  browser.document.addEventListener('visibilitychange', visibility);
  browser.window.addEventListener('pagehide', pause);

  return async () => {
    if (cleaned) return;
    cleaned = true;
    browser.document.removeEventListener('visibilitychange', visibility);
    browser.window.removeEventListener('pagehide', pause);
  };
}

/**
 * Subscribes to the native App bridge or its browser equivalent. Repeated
 * pause/resume signals are coalesced so save and audio callbacks run once per
 * actual transition. Cleanup is safe to call more than once.
 */
export async function subscribeToAppLifecycle(
  callbacks: AppLifecycleCallbacks,
  driver: LifecycleDriver = capacitorLifecycleDriver,
): Promise<() => Promise<void>> {
  if (!driver.isNative()) {
    const browser = driver.getBrowserDriver();
    return browser ? subscribeToBrowserLifecycle(callbacks, browser) : async () => undefined;
  }

  const handles: LifecycleListenerHandle[] = [];
  let backgrounded = false;
  let cleaned = false;
  try {
    handles.push(await driver.addAppStateListener((isActive) => {
      if (!isActive && !backgrounded) {
        backgrounded = true;
        callbacks.onPause();
      } else if (isActive && backgrounded) {
        backgrounded = false;
        callbacks.onResume();
      }
    }));
    handles.push(await driver.addBackButtonListener(callbacks.onBack));
  } catch (error) {
    await removeLifecycleListeners(handles);
    throw error;
  }

  return async () => {
    if (cleaned) return;
    cleaned = true;
    await removeLifecycleListeners(handles);
  };
}

/**
 * `latest` may flush directly or return the latest flush callback (the latter keeps React refs fresh).
 * It intentionally has no global document/window defaults so it is safe in browser, test, and native hosts.
 */
export function subscribeToAppBackground(latest: () => void | (() => void), driver: BrowserLifecycleDriver): () => void {
  let backgrounded = false;
  let cleaned = false;
  const flush = () => {
    if (backgrounded) return;
    backgrounded = true;
    const callback = latest();
    if (typeof callback === 'function') callback();
  };
  const visibility = () => { if (driver.isHidden()) flush(); else backgrounded = false; };
  const pageHide = () => flush();
  const pageShow = () => { backgrounded = false; };
  driver.document.addEventListener('visibilitychange', visibility);
  driver.window.addEventListener('pagehide', pageHide);
  driver.window.addEventListener('pageshow', pageShow);
  return () => {
    if (cleaned) return;
    cleaned = true;
    driver.document.removeEventListener('visibilitychange', visibility);
    driver.window.removeEventListener('pagehide', pageHide);
    driver.window.removeEventListener('pageshow', pageShow);
  };
}
