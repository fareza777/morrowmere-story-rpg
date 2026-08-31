# Android build artifacts

The final local build produces these version 1.2.0 handoff files in this directory:

- `MORROWMERE-v1.2.0-debug.apk`: debug-signed APK for direct device testing
- `MORROWMERE-v1.2.0-test-unsigned.aab`: unsigned QA bundle; not a Play submission artifact

These QA artifacts use Google's official sample ad identifiers. Live AdMob identifiers and upload signing are deliberately required outside Git, and the Play task fails closed when either is missing.

The Android package keeps Chronicle media local, excludes stale PWA caches, and enforces a 180 MiB bundle-size gate. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, build with `.\gradlew.bat assembleDebug bundleRelease` from `android`, and finish with `npm run check:android-size`.

Final synchronized artifact checksums:

- `MORROWMERE-v1.2.0-debug.apk` — 88,505,801 bytes — SHA-256 `96246B0F3827AE0859C66CE902AB8B23E3876710DADB1D60E7650D0783196DD8`
- `MORROWMERE-v1.2.0-test-unsigned.aab` — 77,139,915 bytes — SHA-256 `F664100E10A6A9AD00F53CF70676D40736BD040DAC8412054F7DC1EE54810EA4`
