import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isAndroidMode } from '../vite.config';

describe('Android release configuration', () => {
  it('uses version 1.2.0, package code 4, and native-only build modes', () => {
    const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string; scripts: Record<string, string> };
    const gradle = readFileSync(resolve('android/app/build.gradle'), 'utf8');

    expect(packageJson.version).toBe('1.2.0');
    expect(packageJson.scripts['build:android']).toContain('--mode android-test');
    expect(packageJson.scripts['build:android:live']).toContain('verify-live-admob.mjs');
    expect(packageJson.scripts['android:sync:live']).toContain('build:android:live');
    expect(gradle).toContain('applicationId "com.morrowmere.game"');
    expect(gradle).toContain('versionCode 4');
    expect(gradle).toContain('versionName "1.2.0"');
    expect(isAndroidMode('android')).toBe(true);
    expect(isAndroidMode('android-test')).toBe(true);
    expect(isAndroidMode('android-live')).toBe(true);
    expect(isAndroidMode('production')).toBe(false);
  });

  it('declares AdMob metadata and network access without Firebase config', () => {
    const manifest = readFileSync(resolve('android/app/src/main/AndroidManifest.xml'), 'utf8');
    expect(manifest).toContain('android.permission.INTERNET');
    expect(manifest).toContain('android.permission.ACCESS_NETWORK_STATE');
    expect(manifest).toContain('com.google.android.gms.ads.APPLICATION_ID');
    expect(manifest).toContain('@string/admob_app_id');
    expect(existsSync(resolve('android/app/google-services.json'))).toBe(false);
  });

  it('uses sample IDs for QA and fails Play release closed without live configuration', () => {
    const gradle = readFileSync(resolve('android/app/build.gradle'), 'utf8');
    const capacitor = readFileSync(resolve('capacitor.config.ts'), 'utf8');
    const ignore = readFileSync(resolve('.gitignore'), 'utf8');

    expect(gradle).toContain('ca-app-pub-3940256099942544~3347511713');
    expect(gradle).toContain("equalsIgnoreCase('bundlePlayRelease')");
    expect(gradle).toContain('guardedPlayReleaseRequested && liveAdMobAppId');
    expect(gradle).toContain("tasks.register('verifyPlayReleaseConfiguration')");
    expect(gradle).toContain("tasks.register('bundlePlayRelease')");
    expect(gradle).toContain("VITE_ADMOB_LIVE");
    expect(gradle).toContain('liveUnitValues.toSet().size()');
    expect(gradle).toContain('MORROWMERE_KEYSTORE_FILE');
    expect(capacitor).toContain('disableBackButtonHandler: true');
    expect(ignore).toContain('*.jks');
    expect(ignore).toContain('*.keystore');
    expect(ignore).toContain('.env*.local');
  });

  it('validates live IDs by name without echoing supplied values', () => {
    const marker = 'not-a-secret-marker';
    const result = spawnSync(process.execPath, ['scripts/verify-live-admob.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        VITE_ADMOB_LIVE: '1',
        MORROWMERE_ADMOB_APP_ID: marker,
        VITE_ADMOB_BANNER_ID: marker,
        VITE_ADMOB_REWARDED_ID: marker,
        VITE_ADMOB_INTERSTITIAL_ID: marker,
      },
    });
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).not.toBe(0);
    expect(output).toContain('MORROWMERE_ADMOB_APP_ID');
    expect(output).toContain('VITE_ADMOB_REWARDED_ID');
    expect(output).not.toContain(marker);
  });
});
