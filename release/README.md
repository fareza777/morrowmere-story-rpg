# Android build artifacts

The final local build produces these version 1.3.0 handoff files in this directory:

- `MORROWMERE-v1.3.0-debug.apk`: debug-signed APK for direct device testing
- `MORROWMERE-v1.3.0-test-unsigned.aab`: unsigned QA bundle; not a Play submission artifact

These QA artifacts use Google's official sample ad identifiers. Live AdMob identifiers and upload signing are deliberately required outside Git, and the Play task fails closed when either is missing.

The Android package keeps Chronicle media local, excludes stale PWA caches, and enforces a 180 MiB bundle-size gate. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, build with `.\gradlew.bat assembleDebug bundleRelease` from `android`, and finish with `npm run check:android-size`.

Final synchronized artifact checksums:

- `MORROWMERE-v1.3.0-debug.apk` — 165,198,121 bytes — SHA-256 `5B17AC8CF58C4E1099F6989FB328BBBD726ED7EB713D4FA69D32ECFC7FF3BBDE`
- `MORROWMERE-v1.3.0-test-unsigned.aab` — 154,229,290 bytes — SHA-256 `D3575074ABEE0DCD73FBD26BFECDFA7C37E93A9E4F12F5421835123440EA70E7`
