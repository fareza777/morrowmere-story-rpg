# MORROWMERE

MORROWMERE is an English-language, portrait-first sword-and-sorcery text RPG for Android and the web. Chronicle I — The Black Banner follows an ordinary caravan guard from level 1 to 15 through a grounded border-war mystery, branching investigations, tactical battles, difficult companion routes, and four main endings.

## Chronicle I content

| System | Included |
| --- | ---: |
| Chapters | 8 |
| Authored story scenes | 332 |
| Enemies | 215 |
| Encounter formations | 48 |
| Items | 160 |
| Visual assets | 341 |
| Music tracks | 12 |
| Sound effects | 84 |
| Main endings | 4 |
| Level range | 1–15 |
| Target first-run length | 10–12 hours |

Runs vary through seeded routes, optional events, encounters, rewards, companion decisions, faction standing, and accumulated evidence. Combat includes visible enemy intent, misses, critical hits, blocks, techniques, consumables, and level-scaled opposition. The game also includes merchants, gold, inventory and equipment screens, multiple local save slots, autosave, save-and-exit support, chapter restart, and clear recovery actions after defeat.

The complete adventure, local artwork, music, and sound effects remain available without a connection. Android test builds include Google Mobile Ads and consent handling; ads require a network, ad failure never blocks play, and rewarded battle gold is optional. Game progress and settings stay on the device.

## Run locally

Requirements: Node.js 22 or newer. Android builds also require JDK 21 and Android SDK 36.

```bash
npm install
npm run dev
```

Useful release commands:

```bash
npm run build
npm run android:sync
npm run check:android-size
```

To produce Android QA artifacts after syncing:

```powershell
Set-Location android
.\gradlew.bat assembleDebug bundleRelease
```

Device-test artifacts are copied to `release/`. A Play Store upload still requires private upload signing, live AdMob identifiers, a hosted privacy policy, and the publisher's legal/contact details; see [the Play Store checklist](docs/PLAY-STORE-CHECKLIST.md).

## Architecture

- `src/game/content/chronicle1`: chapters, enemies, encounters, items, merchants, endings, and media contracts
- `src/game/director`: seeded route and eligibility logic
- `src/game/combat`: miss, hit, critical, guard, technique, consumable, victory, and defeat rules
- `src/game/audio`: local music/SFX catalog and playback
- `src/game/persistence`: versioned local saves and migration
- `src/game/state`: campaign state and transitions
- `src/native`: Android lifecycle, Back handling, haptics, consent, and ads
- `src/components`: cinematic opening, story, combat, inventory, equipment, merchant, journal, settings, and defeat screens
- `public/assets`: optimized original visual and audio assets
- `android`: Capacitor 8 Android project targeting API 36
- `store-listing`: Play Store artwork and English listing copy

## Release identity

- Product name: `MORROWMERE`
- Subtitle: `A Sword & Sorcery Chronicle`
- Android application ID: `com.morrowmere.game`
- Version: `1.2.0` (`versionCode 4`)
- Minimum Android: API 24
- Target Android: API 36

The name received an initial availability search, but the publisher must complete jurisdiction-appropriate trademark clearance before commercial release.
