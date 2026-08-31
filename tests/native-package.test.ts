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

  it('uses the MORROWMERE package in source and instrumentation tests', () => {
    const activity = readFileSync(resolve('android/app/src/main/java/com/morrowmere/game/MainActivity.java'), 'utf8');
    const instrumentationPath = resolve('android/app/src/androidTest/java/com/morrowmere/game/ExampleInstrumentedTest.java');
    const instrumentation = readFileSync(instrumentationPath, 'utf8');

    expect(activity).toContain('package com.morrowmere.game;');
    expect(instrumentation).toContain('package com.morrowmere.game;');
    expect(instrumentation).toContain('assertEquals("com.morrowmere.game", appContext.getPackageName())');
    expect(existsSync(resolve('android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java'))).toBe(false);
  });

  it('syncs the installed AdMob plugin into the Android project', () => {
    const settings = readFileSync(resolve('android/capacitor.settings.gradle'), 'utf8');
    expect(settings).toContain('@capacitor-community/admob');
  });
});
