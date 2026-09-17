# Android build artifacts

The current source release is version 1.4.1, version code 9. This directory contains the existing device-test artifact:

- `MORROWMERE-v1.4.1-debug.apk`: debug-signed APK for direct device testing

This existing APK predates the Road Tactics repairs. Rebuild and recheck the candidate before handoff. A version 1.4.1 AAB has not been copied here; older APKs and AABs are retained as historical artifacts, not current release candidates.

These QA artifacts use Google's official sample ad identifiers. Live AdMob identifiers and upload signing are deliberately required outside Git, and the Play task fails closed when either is missing.

The Android package keeps Chronicle media local, excludes stale PWA caches, and enforces a 180 MiB bundle-size gate. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, build with `.\gradlew.bat assembleDebug bundleRelease` from `android`, and finish with `npm run check:android-size`.

Existing version 1.4.1 artifact checksum (not a verification of the current source):

- `MORROWMERE-v1.4.1-debug.apk` — 192,496,183 bytes — SHA-256 `400A4FABA0983A9214636B9DE6D6613D249C217D4D6A76D86241DC46E04C79E2`

Historical version 1.3.0 checksums:

- `MORROWMERE-v1.3.0-debug.apk` — 165,198,121 bytes — SHA-256 `5B17AC8CF58C4E1099F6989FB328BBBD726ED7EB713D4FA69D32ECFC7FF3BBDE`
- `MORROWMERE-v1.3.0-test-unsigned.aab` — 154,229,290 bytes — SHA-256 `D3575074ABEE0DCD73FBD26BFECDFA7C37E93A9E4F12F5421835123440EA70E7`
