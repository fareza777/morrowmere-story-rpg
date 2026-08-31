# Android build artifacts

The local build produces these version 1.1.1 handoff files in this directory:

- `MORROWMERE-v1.1.1-debug.apk`: signed with the Android debug certificate and ready for device testing
- `MORROWMERE-v1.1.1-release-unsigned.aab`: optimized release bundle that must be signed with the Play Console owner's upload key before submission

The version 1.1.1 artifacts disable stale PWA caching inside Android, force a light WebView palette, brighten scene presentation, and add visible Try Again/Main Menu controls after defeat.

The binary files are intentionally excluded from Git. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, then run `.\gradlew.bat assembleDebug bundleRelease` from the `android` directory.
