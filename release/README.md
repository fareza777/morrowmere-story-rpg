# Android build artifacts

The final local build produces these version 1.2.2 handoff files in this directory:

- `MORROWMERE-v1.2.2-debug.apk`: debug-signed APK for direct device testing
- `MORROWMERE-v1.2.2-test-unsigned.aab`: unsigned QA bundle; not a Play submission artifact

These QA artifacts use Google's official sample ad identifiers. Live AdMob identifiers and upload signing are deliberately required outside Git, and the Play task fails closed when either is missing.

The Android package keeps Chronicle media local, excludes stale PWA caches, and enforces a 180 MiB bundle-size gate. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, build with `.\gradlew.bat assembleDebug bundleRelease` from `android`, and finish with `npm run check:android-size`.

Final synchronized artifact checksums:

- `MORROWMERE-v1.2.2-debug.apk` — 92,224,968 bytes — SHA-256 `CEFBDCECA7EF9DF466FB8618DC48485B1732C2BDEB90C3438198F400D9595452`
- `MORROWMERE-v1.2.2-test-unsigned.aab` — 81,226,196 bytes — SHA-256 `CA86A7EA105EB4F9AB7053A2DBDBFF7F082C519D2D7AEC79AA7682A7A840CFC2`
