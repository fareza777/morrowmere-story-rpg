# MORROWMERE

MORROWMERE is a complete English-language, portrait-first sword and sorcery text adventure for Android and the web. It combines authored narrative with deterministic procedural routing, visible-intent turn-based combat, class-aware loot, faction consequences, multiple endings, and local offline saves.

## Shipped content

| System | Included |
| --- | ---: |
| Playable classes | 3 |
| Bestiary entries | 200 |
| Base items | 60 |
| Authored event templates | 48 |
| Procedural text scene keys | 384 |
| Nodes per chronicle | 12 |
| Regions | 4 |
| Endings | 6 |
| Generated source art plates | 70 |
| Unique event backgrounds | 48 |
| Enumerated environment combinations | 300 |
| Offline SFX cues | 10 |

Every run works without a network connection. The Android build requests no sensitive, runtime, or network permissions, includes no advertising or analytics SDK, and stores progress only on the device. AndroidX adds one signature-level internal receiver permission during packaging; it is not exposed to the player.

## Run locally

Requirements: Node.js 22 or newer. Android builds also require JDK 21 and Android SDK 36.

```bash
npm install
npm run dev
```

Quality commands:

```bash
npm run test:run
npm run test:e2e
npm run build
npm run android:sync
```

To produce Android artifacts after syncing:

```powershell
Set-Location android
.\gradlew.bat assembleDebug bundleRelease
```

The device-test APK and unsigned release bundle are copied to `release/` in the completed workspace. Play Store submission requires the publisher's private upload key; see [the Play Store checklist](docs/PLAY-STORE-CHECKLIST.md).

## Architecture

- `src/game/content`: enemies, items, events, story, and endings
- `src/game/director.ts`: seeded twelve-node chronicle routing
- `src/game/combat.ts`: seeded miss, hit, critical, guard, magic, healing, and visible-intent combat
- `src/game/audio.ts`: offline synthesized combat and interface sound effects
- `src/game/state.ts`: pure game-state transitions
- `src/game/persistence.ts`: schema-validated local save slots and import/export helpers
- `src/game/visuals.ts`: deterministic scene and enemy treatment compositor
- `src/components`: splash, three-step onboarding, portrait game screens, HUD, equipment, combat, and accessibility controls
- `public/assets`: optimized original generated art
- `android`: Capacitor 8 Android project targeting API 36
- `store-listing`: upload-ready icon, feature graphic, screenshots, and English listing copy

The design specification and implementation plan are preserved under `docs/superpowers/`.

## Release identity

- Product name: `MORROWMERE`
- Subtitle: `A Sword & Sorcery Chronicle`
- Android application ID: `com.morrowmere.game`
- Version: `1.0.0` (`versionCode 1`)
- Minimum Android: API 24
- Target Android: API 36

The name received an initial availability search, but the publisher must complete jurisdiction-appropriate trademark clearance before commercial release.
