# Google Play release checklist

The project can produce an Android QA build. Publishing requires owner-controlled identity, legal declarations, live advertising configuration, and upload signing; these values are intentionally not stored in the repository.

## Prepared in the project

- Application ID `com.morrowmere.game`
- Version `1.2.2`, version code `6`
- Minimum API 24 and target API 36
- Portrait orientation, adaptive launcher icon, and branded splash resources
- Local Chronicle I story, artwork, music, SFX, and saves
- Google Mobile Ads integration for banner, rewarded, and interstitial formats
- UMP consent refresh on launch and a privacy-options entry when required
- Test builds restricted to Google's sample ad identifiers
- Live build guard requiring external AdMob identifiers and upload signing
- No account system, social login, remote game-content download, or developer-operated analytics

## Configure a live release

1. Create the Android app `MORROWMERE` with package `com.morrowmere.game` in the publisher's AdMob account.
2. Create a banner placement for safe hubs, a rewarded placement for optional post-battle gold, and an interstitial placement for restrained expedition breaks.
3. Publish the required GDPR privacy message in AdMob Privacy & messaging.
4. Supply the live application and ad-unit identifiers through the documented build environment. Never commit them.
5. Create and securely back up an upload key. Never commit the key or passwords.
6. Run the guarded Play bundle task and upload the signed AAB to Internal testing first.

Example signing environment:

```powershell
$env:MORROWMERE_KEYSTORE_FILE = 'C:\secure\morrowmere-upload.jks'
$env:MORROWMERE_KEYSTORE_PASSWORD = '<store password>'
$env:MORROWMERE_KEY_ALIAS = 'morrowmere-upload'
$env:MORROWMERE_KEY_PASSWORD = '<key password>'
npm run android:bundle:play
```

## Play Console declarations

1. Mark the app as **Contains ads**.
2. Host `docs/PRIVACY_POLICY.md` at a stable public HTTPS address and enter the final URL.
3. Complete Data safety for the exact SDK/version shipped. Google Mobile Ads may automatically process IP address/general-location estimates, product interactions, diagnostics, and device or account identifiers for advertising, analytics, and fraud prevention. Local game saves are not uploaded by the game.
4. State that the app is not designed for children and select the audience that matches the final content rating.
5. Complete the IARC questionnaire for fantasy violence, combat, frightening imagery, and mature war themes; the game contains no graphic gore.
6. Add the publisher's legal name, support email, privacy-policy URL, developer contact details, countries, price, and distribution declarations.
7. Add the English listing copy and graphics from `store-listing/`.
8. Review the merged manifest, including Internet access and any advertising-ID declaration contributed by the advertising SDK.

## Final owner-controlled gates

- Live AdMob app/ad-unit identifiers are present and consent messaging is published.
- Publisher legal name, support email, and hosted privacy-policy URL replace every placeholder.
- The AAB is signed with the intended upload key and the certificate is verified.
- `versionCode` is increased for every later upload.
- The Contains ads and Data safety declarations match the exact final binary.
- The Internal-testing build is installed on at least one small API 24 phone and one current Android phone.
- Airplane-mode launch, save/resume, defeat recovery, consumables, text scaling, privacy options, rewarded idempotency, and one ending are checked on the release candidate.
- Current Google Play and AdMob policies are rechecked immediately before submission.
