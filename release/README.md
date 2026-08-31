# Android build artifacts

The local build produces these version 1.1.0 handoff files in this directory:

- `MORROWMERE-v1.1.0-debug.apk`: signed with the Android debug certificate and ready for device testing
- `MORROWMERE-v1.1.0-release-unsigned.aab`: optimized release bundle that must be signed with the Play Console owner's upload key before submission

The version 1.1.0 artifacts include a bright parchment interface, 48 clean event illustrations, readable labeled menus, a refreshed splash/onboarding flow, randomized combat outcomes, offline sound effects, and equipment loadouts.

The binary files are intentionally excluded from Git. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, then run `.\gradlew.bat assembleDebug bundleRelease` from the `android` directory.
