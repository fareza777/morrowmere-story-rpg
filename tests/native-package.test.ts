import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('native Android package', () => {
  it('does not register a PWA service worker that can serve stale artwork', () => {
    const nativeRoot = resolve(process.cwd(), 'android/app/src/main/assets/public');
    const index = readFileSync(resolve(nativeRoot, 'index.html'), 'utf8');

    expect(index).not.toContain('registerSW.js');
    expect(existsSync(resolve(nativeRoot, 'registerSW.js'))).toBe(false);
    expect(existsSync(resolve(nativeRoot, 'sw.js'))).toBe(false);
  });
});
