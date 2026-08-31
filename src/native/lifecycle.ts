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
