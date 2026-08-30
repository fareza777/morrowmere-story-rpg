# Android build artifacts

The local build produces two handoff files in this directory:

- `MORROWMERE-debug.apk`: signed with the Android debug certificate and ready for device testing
- `MORROWMERE-release-unsigned.aab`: optimized release bundle that must be signed with the Play Console owner's upload key before submission

The binary files are intentionally excluded from Git. Rebuild them with `npm run android:sync`, then run `gradlew.bat assembleDebug bundleRelease` from the `android` directory.
