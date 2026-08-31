# Android build artifacts

The final local build produces these version 1.2.0 handoff files in this directory:

- `MORROWMERE-v1.2.0-debug.apk`: debug-signed APK for direct device testing
- `MORROWMERE-v1.2.0-test-unsigned.aab`: unsigned QA bundle; not a Play submission artifact

These QA artifacts use Google's official sample ad identifiers. Live AdMob identifiers and upload signing are deliberately required outside Git, and the Play task fails closed when either is missing.

The Android package keeps Chronicle media local, excludes stale PWA caches, and enforces a 180 MiB bundle-size gate. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, build with `.\gradlew.bat assembleDebug bundleRelease` from `android`, and finish with `npm run check:android-size`.

Final synchronized artifact checksums:

- `MORROWMERE-v1.2.0-debug.apk` — 88,506,069 bytes — SHA-256 `83542A4698E71730ED5B5EA754D0E15E5F2A9D7C9E5F272EE9821840613CB796`
- `MORROWMERE-v1.2.0-test-unsigned.aab` — 77,140,131 bytes — SHA-256 `42D71B0073FB23E618BAE391203EC78673BBEDD0D8DFA5B9EFEB9EAF0A6A588B`
