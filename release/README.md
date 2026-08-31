# Android build artifacts

The local build produces these version 1.2.0 handoff files in this directory:

- `MORROWMERE-v1.2.0-debug.apk`: signed with the Android debug certificate and ready for device testing
- `MORROWMERE-v1.2.0-release-unsigned.aab`: QA bundle with Google sample ads; it is not a Play submission artifact

The version 1.2.0 artifacts disable stale PWA caching inside Android, keep Chronicle media local, and use Google sample ads for device testing. `bundlePlayRelease` fails closed until live AdMob variables and upload signing are supplied outside Git.

The binary files are intentionally excluded from Git. Regenerate native artwork with `npx capacitor-assets generate --android --assetPath assets`, run `npm run android:sync`, then run `.\gradlew.bat assembleDebug bundleRelease` from the `android` directory. Run `npm run check:android-size` afterward; Play submission is blocked above 180 MiB.

The exact AAB byte count is recorded after the final synchronized QA build.
