# Google Play release checklist

This project is technically packaged for Google Play, but final publication requires the Play Console owner's identity, legal declarations, upload key, and approval. Those owner-only steps are intentionally not automated.

## Already prepared

- Application ID `com.morrowmere.game`
- Version `1.1.1`, version code `3`
- Android App Bundle release build
- Target API 36, meeting the requirement that applies to new mobile submissions from 31 August 2026
- Minimum API 24
- Portrait orientation
- Adaptive launcher icon and branded splash resources
- No sensitive, runtime, or Internet permission; packaging adds only AndroidX's signature-level internal receiver permission
- No ads, analytics, accounts, purchases, or third-party network services
- English offline PWA and native Android assets
- 512 px store icon, 1024 x 500 feature graphic, and three actual 1080 x 1920 gameplay screenshots

Google's current target API policy is documented in [Play Console Help](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en). Current graphic requirements are in [Add preview assets](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

## Sign the release bundle

Create and securely back up an upload key. Never commit it to this repository.

```powershell
keytool -genkeypair -v -keystore morrowmere-upload.jks -alias morrowmere-upload -keyalg RSA -keysize 4096 -validity 10000
$env:MORROWMERE_KEYSTORE_FILE = 'C:\secure\morrowmere-upload.jks'
$env:MORROWMERE_KEYSTORE_PASSWORD = '<store password>'
$env:MORROWMERE_KEY_ALIAS = 'morrowmere-upload'
$env:MORROWMERE_KEY_PASSWORD = '<key password>'
Set-Location android
.\gradlew.bat bundleRelease
```

Upload `android/app/build/outputs/bundle/release/app-release.aab`. Enroll in [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en) and protect the developer account with two-step verification.

## Play Console owner steps

1. Create the game record and reserve the final listing name.
2. Complete trademark and business-name clearance for MORROWMERE.
3. Upload the signed AAB to Internal testing first.
4. Add the copy and graphics from `store-listing/`.
5. Host `docs/PRIVACY_POLICY.md` at a stable public HTTPS URL and add that URL in Play Console.
6. Complete Data safety. For this build, declare that no user data is collected or shared; saves remain local.
7. Declare no ads, no in-app purchases, and unrestricted app access.
8. Complete the IARC content-rating questionnaire accurately for fantasy violence, combat, frightening imagery, and dark themes. Do not declare graphic gore because the game contains none.
9. Choose the target audience based on the final rating. This release is not designed for children.
10. Add support email, developer contact details, countries, price, and distribution consent.
11. Run a closed test on multiple physical phone sizes, including one low-memory API 24 device and one API 36 device.
12. Review the automated pre-launch report, fix any blocking issue, then promote to Production.

Google requires every published app, including apps that collect no data, to complete Data safety and provide a privacy-policy link. See [Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-EN). Content ratings are generated from the required [IARC questionnaire](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en).

## Final release gates

- Increase `versionCode` for every subsequent upload.
- Confirm the signed AAB certificate is the intended upload certificate.
- Verify no permissions were introduced by dependency changes.
- Run `npm run test:run`, `npm run test:e2e`, `npm run build`, and `gradlew.bat bundleRelease` on the exact release commit.
- Install the generated APK or an Internal App Sharing build on a physical device.
- Test airplane-mode launch, save/resume, text at 130%, screen reader narration, combat, rewards, and one full ending.
- Recheck current Google Play policies immediately before submission.
