# Android build artifacts

The final local build produces these version 1.2.1 handoff files in this directory:

- `MORROWMERE-v1.2.1-debug.apk`: debug-signed APK for direct device testing
- `MORROWMERE-v1.2.1-test-unsigned.aab`: unsigned QA bundle; not a Play submission artifact

These QA artifacts use Google's official sample ad identifiers. Live AdMob identifiers and upload signing are deliberately required outside Git, and the Play task fails closed when either is missing.

The Android package keeps Chronicle media local, excludes stale PWA caches, and enforces a 180 MiB bundle-size gate. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, build with `.\gradlew.bat assembleDebug bundleRelease` from `android`, and finish with `npm run check:android-size`.

Final synchronized artifact checksums:

- `MORROWMERE-v1.2.1-debug.apk` — 91,447,153 bytes — SHA-256 `E0E9D254109D4617F0214B69355494B3C347778A3AE35BEFBBB6B55DEBADCB4C`
- `MORROWMERE-v1.2.1-test-unsigned.aab` — 80,448,642 bytes — SHA-256 `AE54E1A0AAE68746E51F3291380DC110E569395B3B6BC821E41D59961CD043E4`
