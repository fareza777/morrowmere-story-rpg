# MORROWMERE Chronicle I Interface and Opening Cinematic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertical-slice interface with a bright, readable Chronicle I product UI covering three save slots, the opening-story-only premium cinematic, camp and route play, group combat with companions, inventory/equipment/merchant flows, journal/settings, reliable defeat recovery, and typed audio/haptic feedback.

**Architecture:** React components render narrow typed view models produced by selectors over the stable core facade. `useGameSession` owns the active slot and dispatch/save lifecycle, while screens remain presentational and emit typed commands. The cinematic is an isolated deterministic timeline with injected media/feedback ports, allowing pause, skip, replay, reduced-motion behavior, and a static readable fallback without coupling ordinary events to cinematic machinery.

**Tech Stack:** React 19, TypeScript 7, CSS, Vitest 4, Testing Library, user-event, axe-core, Playwright, core `GameStateV2`/`GameCommand`/`DomainEvent` facades, file-backed audio and native haptic ports supplied by the media/native plans.

**Spec:** `docs/superpowers/specs/2026-08-31-morrowmere-chronicle-i-black-banner-design.md`

## Global Constraints

- Public title is `MORROWMERE`; campaign title is `Chronicle I — The Black Banner`.
- All player-facing copy is English.
- The interface targets 360×800 CSS pixels and remains functional at 320×568 with safe-area and font-scaling support.
- Default story prose is 17–18 CSS pixels or larger, has generous line height, and sits on a solid or controlled-gradient panel.
- Interactive targets are at least 48 CSS pixels high; long titles, choices, items, and system messages wrap instead of clipping.
- Preserve the approved bright painterly MORROWMERE palette; do not add grain, speckles, scanlines, scratches, random particles, heavy vignette, or muddy black overlays.
- The premium 90–120 second cinematic applies only to the opening story. Ordinary events use a still illustration with restrained pan, zoom, focus, or crossfade.
- Opening narration always has readable captions and supports pause, skip, replay, voice-disabled playback, reduced motion, and an asset-failure fallback.
- No ad request or placement appears during splash, onboarding, opening cinematic, story choice, battle, defeat, or an emotional reveal.
- Companion UI adds one support command with cooldown; it must not imply a second full-damage hero.
- Defeat always exposes `Return to Last Camp`, `Restart Chapter`, and `Main Menu` with visible icons and deterministic behavior.
- Interface code consumes typed domain events for sound, haptics, motion, and announcements; it never parses combat-log prose.
- The interface plan starts after the stable exports from `2026-08-31-morrowmere-core-systems.md` exist. It does not edit Chronicle I narrative catalogs or generate media.

---

## File map

- `src/ui/types.ts`: interface-only view models, settings projection, slot summaries, and injected UI ports.
- `src/ui/selectors.ts`: pure selectors from `GameStateV2` plus `ContentIndex` to screen view models.
- `src/ui/useGameSession.ts`: active save slot, reducer dispatch, immediate save, Save & Exit, background-safe latest-state ref, and transition-event delivery.
- `src/ui/feedback.ts`: deterministic `DomainEvent` to SFX/haptic/announcement cue mapping.
- `src/ui/openingSequence.ts`: the approved 14-shot opening storyboard, captions, timings, motion instructions, and media IDs.
- `src/components/LaunchSplash.tsx`: short responsive brand splash only.
- `src/components/TitleScreen.tsx`: title, campaign subtitle, three save slots, migration/recovery notices, and new/continue actions.
- `src/components/SaveSlotCard.tsx`: one accessible empty, occupied, recoverable, or legacy slot card.
- `src/components/ConfirmDialog.tsx`: focus-contained confirmation for replacing a slot or restarting a chapter.
- `src/components/cinematic/useCinematicPlayer.ts`: deterministic opening timeline and media-preload state.
- `src/components/cinematic/OpeningCinematic.tsx`: opening-story player, captions, controls, fallback, and title reveal.
- `src/components/OnboardingScreen.tsx`: first-launch audio/haptic/caption preferences before the cinematic.
- `src/components/NewRunScreen.tsx`: class/name selection after the cinematic.
- `src/components/GameShell.tsx`: screen router and persistent HUD/overlay composition only.
- `src/components/TopHud.tsx`: responsive chapter/location, vitals, class resource, currency, companion, and menu access.
- `src/components/CampScreen.tsx`: objective, recovery, stash, companion conversation, merchant access, depart, and Save & Exit.
- `src/components/RouteScreen.tsx`: King's Road, Old Forest, and Ruined Pass choices with explicit risk/reward labels.
- `src/components/StoryPanel.tsx`: authored narrative blocks, scene art, outcomes, and fixed story choices.
- `src/components/TutorialCallout.tsx`: skippable/replayable contextual tutorial steps.
- `src/components/CombatPanel.tsx`: combat orchestration and party/action layout.
- `src/components/EnemyParty.tsx`: selectable enemies, HP, statuses, roles, and visible intents.
- `src/components/CombatActionBar.tsx`: Attack, Guard, Technique, Consumable, Companion, and Flee actions.
- `src/components/InventorySheet.tsx`: field pack, consumable use, item detail, and move-to-stash actions.
- `src/components/EquipmentSheet.tsx`: one weapon, one armor, two charms, alternatives, restrictions, and stat deltas.
- `src/components/MerchantScreen.tsx`: buy/sell tabs, persistent stock, gold, comparison, equip/use actions, and merchant art.
- `src/components/JournalSheet.tsx`: objectives, consequences, evidence, companions, tutorials, codex, and cinematic replay.
- `src/components/CompanionPanel.tsx`: loyalty wording, personal-quest progress, injury/status, and active-companion selection.
- `src/components/SettingsSheet.tsx`: text/contrast/motion/haptic toggles and separate SFX/music/voice controls.
- `src/components/PauseSheet.tsx`: Save & Exit and confirmed Restart Chapter.
- `src/components/RewardPanel.tsx`: immediate base rewards and non-blocking optional doubled battle-gold offer state.
- `src/components/DefeatPanel.tsx`: camp retry, chapter restart, and Main Menu actions.
- `src/components/Sheet.tsx`: focus return, Escape/Android-back-safe close, and scroll containment.
- `src/styles/tokens.css`: bright palette, type scale, focus, touch, and safe-area tokens.
- `src/styles/base.css`: document, typography, accessibility, and global reduced-motion defaults.
- `src/styles/screens.css`: title, onboarding, camp, route, story, reward, defeat, and ending layouts.
- `src/styles/cinematic.css`: opening player, captions, shot transitions, controls, fallback, and reduced motion.
- `src/styles/combat.css`: enemy party, intent cards, actions, log, statuses, and transient hit feedback.
- `src/styles/sheets.css`: inventory, equipment, journal, companion, settings, pause, and dialog layouts.
- `src/styles/game.css`: imports the focused styles and retains only shared shell/HUD rules.
- `tests/fixtures/ui.ts`: deterministic slot, state, cinematic, selector, and feedback fixtures.
- `tests/ui-selectors.test.ts`, `tests/title-slots.test.tsx`, `tests/cinematic.test.tsx`, `tests/game-screens.test.tsx`, `tests/combat-interface.test.tsx`, `tests/inventory-merchant-interface.test.tsx`, `tests/journal-settings-interface.test.tsx`, `tests/feedback.test.ts`, `tests/accessibility.test.tsx`: focused unit/component coverage.
- `tests/e2e/pages/MorrowmerePage.ts`: stable locators/actions for the Chronicle I flow.
- `tests/e2e/visual-smoke-mobile.spec.ts`: one 360×800 screenshot pass across required screens.
- `tests/e2e/readable-layout.spec.ts`: 320×568 overflow, title, long-copy, and action checks.
- `src/App.tsx`: constructs repository/feedback ports and renders the session view; this shared file is changed by the integration owner.

## Public interface contracts

```ts
export interface SaveSlotSummary {
  readonly slot: 1 | 2 | 3;
  readonly status: 'empty' | 'ready' | 'recoverable' | 'legacy';
  readonly heroName?: string;
  readonly heroClass?: 'warrior' | 'mage' | 'warden';
  readonly chapterLabel?: string;
  readonly level?: number;
  readonly savedAt?: string;
  readonly notice?: string;
}

export interface UiSettings {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly hapticsEnabled: boolean;
  readonly reducedHaptics: boolean;
  readonly sfxVolume: number;
  readonly musicVolume: number;
  readonly voiceVolume: number;
  readonly captions: boolean;
  readonly voiceReplay: 'automatic' | 'manual';
  readonly screenReaderAnnouncements: boolean;
}

export interface UiPorts {
  readonly feedback: { consume(cues: readonly FeedbackCue[]): void };
  readonly cinematicAudio: CinematicAudioPort;
  readonly now: () => number;
}
```

```ts
export type FeedbackCue =
  | { readonly type: 'sfx'; readonly cueId: string; readonly volume: number }
  | { readonly type: 'haptic'; readonly pattern: 'light' | 'medium' | 'minimal' | 'double' | 'strong' | 'heavy' | 'level-up' }
  | { readonly type: 'announce'; readonly message: string };

export function feedbackForTransition(
  events: readonly DomainEvent[],
  settings: UiSettings,
): readonly FeedbackCue[];
```

```ts
export interface CinematicShot {
  readonly id: string;
  readonly imageId: string;
  readonly alt: string;
  readonly caption: string;
  readonly startMs: number;
  readonly endMs: number;
  readonly motion: 'pan-left' | 'pan-right' | 'push-in' | 'pull-back' | 'focus-shift' | 'still';
  readonly sfxCueIds: readonly string[];
  readonly haptic?: 'minimal' | 'medium' | 'strong';
}

export interface CinematicSequence {
  readonly id: 'chronicle-1-opening';
  readonly durationMs: number;
  readonly musicId: string;
  readonly voiceId: string;
  readonly shots: readonly CinematicShot[];
}

export interface CinematicAudioPort {
  preload(sequence: CinematicSequence): Promise<void>;
  play(sequence: CinematicSequence, fromMs: number): Promise<void>;
  pause(): void;
  seek(positionMs: number): void;
  stop(): void;
  setVolumes(levels: { readonly music: number; readonly voice: number; readonly sfx: number }): void;
}
```

```ts
export interface GameShellProps {
  readonly state: GameStateV2;
  readonly content: ContentIndex;
  readonly transitionEvents: readonly DomainEvent[];
  readonly dispatch: (command: GameCommand) => void;
  readonly onSaveAndExit: () => void;
  readonly onMainMenu: () => void;
  readonly onReplayOpening: () => void;
}

export function selectCurrentScene(state: GameStateV2, content: ContentIndex): StoryViewModel | null;
export function selectCombatView(state: GameStateV2, content: ContentIndex): CombatViewModel | null;
export function selectInventoryView(state: GameStateV2, content: ContentIndex): InventoryViewModel;
export function selectMerchantView(state: GameStateV2, content: ContentIndex): MerchantViewModel | null;
export function selectJournalView(state: GameStateV2, content: ContentIndex): JournalViewModel;
```

---

### Task 1: Typed UI view models and selectors

**Files:**
- Create: `src/ui/types.ts`
- Create: `src/ui/selectors.ts`
- Create: `tests/fixtures/ui.ts`
- Create: `tests/ui-selectors.test.ts`

**Interfaces:**
- Consumes: `GameStateV2`, `GameCommand`, `DomainEvent`, and `ContentIndex` from the core facades.
- Produces: `SaveSlotSummary`, `UiSettings`, screen view models, and the five selectors declared above.

- [ ] **Step 1: Write failing selector tests for authored scene text, group intent, inventory capacity, merchant stock, and qualitative companion loyalty.**

```ts
import { selectCombatView, selectInventoryView, selectJournalView } from '../src/ui/selectors';
import { makeUiGame, UI_CONTENT } from './fixtures/ui';

it('projects all living enemies and their announced intents', () => {
  const view = selectCombatView(makeUiGame({ screen: 'combat', enemyCount: 3 }), UI_CONTENT);
  expect(view?.enemies).toHaveLength(3);
  expect(view?.enemies.every((enemy) => enemy.intent.label.length > 0)).toBe(true);
});

it('counts stacks but excludes equipment and quest items from 24 field slots', () => {
  const view = selectInventoryView(makeUiGame({ stackedPotions: 4, equippedWeapon: true, questItem: true }), UI_CONTENT);
  expect(view.usedSlots).toBe(1);
  expect(view.capacity).toBe(24);
});

it('does not expose numeric loyalty in the journal', () => {
  const journal = selectJournalView(makeUiGame({ companionId: 'mara', loyalty: 17 }), UI_CONTENT);
  expect(journal.companions[0]?.loyaltyLabel).toMatch(/Wary|Respectful|Loyal/);
  expect(JSON.stringify(journal.companions[0])).not.toContain('17');
});
```

- [ ] **Step 2: Run `npm test -- ui-selectors.test.ts` and verify the missing modules fail.**
- [ ] **Step 3: Implement serializable view-model interfaces and pure selectors. Resolve every display name, description, icon ID, art ID, restriction, stat delta, objective, and intent through `ContentIndex`; never copy mutable catalog objects into component state.**

```ts
export interface CombatViewModel {
  readonly hero: HeroHudViewModel;
  readonly companion: CompanionCombatViewModel | null;
  readonly enemies: readonly EnemyCombatViewModel[];
  readonly selectedTargetId: string;
  readonly actions: readonly CombatActionViewModel[];
  readonly log: readonly string[];
}

export interface InventoryViewModel {
  readonly usedSlots: number;
  readonly capacity: 24;
  readonly pack: readonly ItemRowViewModel[];
  readonly stash: readonly ItemRowViewModel[];
  readonly equipment: EquipmentViewModel;
}
```

- [ ] **Step 4: Run `npm test -- ui-selectors.test.ts` and `npm run build`; both pass.**
- [ ] **Step 5: Commit `feat: add Chronicle I UI selectors`.**

### Task 2: Three-slot title and session controller

**Files:**
- Create: `src/ui/useGameSession.ts`
- Create: `src/components/SaveSlotCard.tsx`
- Create: `src/components/ConfirmDialog.tsx`
- Modify: `src/components/LaunchSplash.tsx`
- Modify: `src/components/TitleScreen.tsx`
- Modify: `src/App.tsx`
- Create: `tests/title-slots.test.tsx`
- Modify: `tests/smoke.test.tsx`

**Interfaces:**
- Consumes: `SaveRepository`, `reduceGame`, `ContentIndex`, `UiPorts`, and `SaveSlotSummary`.
- Produces: `useGameSession(repository, content, ports): GameSessionController` and an accessible three-slot title flow.

- [ ] **Step 1: Write failing title/session tests for three slots, continue, empty-slot creation, recoverable notice, and explicit occupied-slot replacement.**

```tsx
it('shows all three save slots without clipping the title', () => {
  render(<TitleScreen slots={SLOT_SUMMARIES} onContinue={vi.fn()} onNew={vi.fn()} onRecover={vi.fn()} />);
  expect(screen.getAllByRole('article', { name: /Save slot/i })).toHaveLength(3);
  expect(screen.getByRole('heading', { name: 'MORROWMERE' })).toBeVisible();
  expect(screen.getByText('Chronicle I — The Black Banner')).toBeVisible();
});

it('requires confirmation before replacing an occupied slot', async () => {
  const user = userEvent.setup();
  const onNew = vi.fn();
  render(<TitleScreen slots={SLOT_SUMMARIES} onContinue={vi.fn()} onNew={onNew} onRecover={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Replace slot 1' }));
  expect(screen.getByRole('dialog', { name: 'Replace save slot 1?' })).toBeVisible();
  expect(onNew).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Replace and begin' }));
  expect(onNew).toHaveBeenCalledWith(1);
});
```

- [ ] **Step 2: Run `npm test -- title-slots.test.tsx smoke.test.tsx` and confirm failures.**
- [ ] **Step 3: Implement `SaveSlotCard` states and a focus-contained `ConfirmDialog`. Keep the splash below 1.2 seconds, render the complete `MORROWMERE` wordmark as real text, and show occupied-slot hero/class/level/chapter/save time without exposing raw storage errors.**

```ts
export interface GameSessionController {
  readonly view: 'title' | 'preferences' | 'opening' | 'new-run' | 'game';
  readonly activeSlot: 1 | 2 | 3 | null;
  readonly slots: readonly SaveSlotSummary[];
  readonly game: GameStateV2 | null;
  readonly transitionEvents: readonly DomainEvent[];
  continueSlot(slot: 1 | 2 | 3): void;
  beginSlot(slot: 1 | 2 | 3): void;
  dispatch(command: GameCommand): void;
  saveAndExit(): void;
  returnToTitle(): void;
}
```

- [ ] **Step 4: Make `useGameSession` save the returned transition synchronously before publishing it to React, retain the latest state in a ref, surface backup recovery as a non-blocking notice, and route legacy slots to a clear one-time Chronicle I reset message. Run focused tests and build.**
- [ ] **Step 5: Commit `feat: add three Chronicle save slots`.**

### Task 3: First-launch preferences and opening-story cinematic

**Files:**
- Create: `src/ui/openingSequence.ts`
- Create: `src/components/cinematic/useCinematicPlayer.ts`
- Create: `src/components/cinematic/OpeningCinematic.tsx`
- Create: `src/styles/cinematic.css`
- Modify: `src/components/OnboardingScreen.tsx`
- Modify: `src/components/NewRunScreen.tsx`
- Modify: `src/App.tsx`
- Create: `tests/cinematic.test.tsx`

**Interfaces:**
- Consumes: `CinematicAudioPort`, `UiSettings`, the later media manifest IDs, and the opening completion/replay callbacks.
- Produces: `OPENING_SEQUENCE`, `useCinematicPlayer`, and `OpeningCinematic` with deterministic controls and fallback.

- [ ] **Step 1: Write failing fake-timer tests for 14 shots, 90–120 second duration, pause, resume, skip, replay, captions, reduced motion, and rejected preload.**

```tsx
it('plays only the approved opening story and can be skipped', async () => {
  vi.useFakeTimers();
  const onComplete = vi.fn();
  render(<OpeningCinematic sequence={OPENING_SEQUENCE} settings={UI_SETTINGS} audio={FAKE_AUDIO} onComplete={onComplete} />);
  expect(OPENING_SEQUENCE.shots).toHaveLength(14);
  expect(OPENING_SEQUENCE.durationMs).toBeGreaterThanOrEqual(90_000);
  expect(OPENING_SEQUENCE.durationMs).toBeLessThanOrEqual(120_000);
  expect(screen.getByText(/The job should have taken three days/)).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Skip opening' }));
  expect(onComplete).toHaveBeenCalledOnce();
  expect(FAKE_AUDIO.stop).toHaveBeenCalledOnce();
});

it('falls back to a readable static prologue when preload fails', async () => {
  render(<OpeningCinematic sequence={OPENING_SEQUENCE} settings={UI_SETTINGS} audio={rejectingAudio()} onComplete={vi.fn()} />);
  expect(await screen.findByRole('region', { name: 'Opening story' })).toContainText('Someone is preparing a war.');
  expect(screen.getByRole('button', { name: 'Continue to class selection' })).toBeVisible();
});
```

- [ ] **Step 2: Run `npm test -- cinematic.test.tsx` and confirm failures.**
- [ ] **Step 3: Define exactly 14 shots with IDs `opening-01-kingdom`, `opening-02-caravan`, `opening-03-hero`, `opening-04-greywatch`, `opening-05-checkpoint`, `opening-06-first-arrow`, `opening-07-goblin-attack`, `opening-08-hero-response`, `opening-09-royal-mark`, `opening-10-false-banner`, `opening-11-witness-order`, `opening-12-searching-riders`, `opening-13-approach`, and `opening-14-title`. Use contiguous timings ending at 105,000 ms and distribute the approved narration verbatim across their captions.**

```ts
export const OPENING_SEQUENCE: CinematicSequence = {
  id: 'chronicle-1-opening',
  durationMs: 105_000,
  musicId: 'music-opening-black-banner',
  voiceId: 'voice-opening-eldrin-en',
  shots: [
    { id: 'opening-01-kingdom', imageId: 'cinematic-opening-01', alt: 'Dawn over the divided kingdom of Morrowmere.', caption: 'The job should have taken three days.', startMs: 0, endMs: 7_000, motion: 'pull-back', sfxCueIds: ['wind-dawn'] },
    { id: 'opening-02-caravan', imageId: 'cinematic-opening-02', alt: 'Two medicine wagons travel north on a bright rural road.', caption: 'Escort two wagons of medicine north to Greywatch, collect your pay, and leave before the border frost.', startMs: 7_000, endMs: 15_000, motion: 'pan-right', sfxCueIds: ['wagon-road'] },
    { id: 'opening-03-hero', imageId: 'cinematic-opening-03', alt: 'The caravan guard watches the road from horseback.', caption: 'In Morrowmere, that counts as honest work.', startMs: 15_000, endMs: 21_000, motion: 'push-in', sfxCueIds: [] },
    { id: 'opening-04-greywatch', imageId: 'cinematic-opening-04', alt: 'Greywatch stands beyond fields and low northern hills.', caption: 'The kingdom has lived eighteen years without a king. Its roads belong to toll collectors, deserters, and anything strong enough to hold a blade.', startMs: 21_000, endMs: 28_000, motion: 'pan-left', sfxCueIds: ['greywatch-bell'] },
    { id: 'opening-05-checkpoint', imageId: 'cinematic-opening-05', alt: 'The caravan passes an abandoned border checkpoint.', caption: 'Goblin raids are common. Orc patrols stay west of Redwater. Everyone knows where the danger lies.', startMs: 28_000, endMs: 36_000, motion: 'focus-shift', sfxCueIds: ['wood-creak'] },
    { id: 'opening-06-first-arrow', imageId: 'cinematic-opening-06', alt: 'An arrow strikes the medicine wagon driver.', caption: 'Until this morning.', startMs: 36_000, endMs: 42_000, motion: 'push-in', sfxCueIds: ['arrow-flight', 'arrow-impact'], haptic: 'strong' },
    { id: 'opening-07-goblin-attack', imageId: 'cinematic-opening-07', alt: 'Goblin raiders attack the caravan near a stone bridge.', caption: 'The first arrow kills the driver.', startMs: 42_000, endMs: 50_000, motion: 'pan-left', sfxCueIds: ['goblin-charge', 'battle-rise'], haptic: 'medium' },
    { id: 'opening-08-hero-response', imageId: 'cinematic-opening-08', alt: 'The caravan guard draws steel and protects a wounded survivor.', caption: 'The second carries the mark of the royal armory.', startMs: 50_000, endMs: 57_000, motion: 'push-in', sfxCueIds: ['sword-draw'] },
    { id: 'opening-09-royal-mark', imageId: 'cinematic-opening-09', alt: 'A close view reveals the royal armory mark on an arrowhead.', caption: 'When the attackers retreat, they leave an orc banner beside a dead officer—as if they want the truth found too quickly.', startMs: 57_000, endMs: 64_000, motion: 'focus-shift', sfxCueIds: ['evidence-sting'] },
    { id: 'opening-10-false-banner', imageId: 'cinematic-opening-10', alt: 'An orc banner lies too neatly beside a dead officer.', caption: 'Someone is preparing a war.', startMs: 64_000, endMs: 71_000, motion: 'pull-back', sfxCueIds: ['cloth-fall'] },
    { id: 'opening-11-witness-order', imageId: 'cinematic-opening-11', alt: 'The hero protects a wounded witness holding a sealed order.', caption: 'You have no title, no army, and no lord to protect you.', startMs: 71_000, endMs: 79_000, motion: 'push-in', sfxCueIds: ['seal-reveal'], haptic: 'minimal' },
    { id: 'opening-12-searching-riders', imageId: 'cinematic-opening-12', alt: 'Armed riders search the road as evening approaches.', caption: 'You have one wounded witness, one sealed order, and a road that now leads straight to Greywatch.', startMs: 79_000, endMs: 86_000, motion: 'pan-right', sfxCueIds: ['distant-riders'] },
    { id: 'opening-13-approach', imageId: 'cinematic-opening-13', alt: 'The hero carries the witness toward Greywatch at sunset.', caption: 'By nightfall, half the border will want what you carry.', startMs: 86_000, endMs: 96_000, motion: 'pull-back', sfxCueIds: ['music-resolve'] },
    { id: 'opening-14-title', imageId: 'cinematic-opening-14', alt: 'The road reaches Greywatch beneath the Black Banner title.', caption: 'This is where your chronicle begins.', startMs: 96_000, endMs: 105_000, motion: 'still', sfxCueIds: ['title-reveal'], haptic: 'strong' },
  ],
};
```

- [ ] **Step 4: Implement `useCinematicPlayer` with one `requestAnimationFrame` timeline, preload before play, synchronized audio seek on resume, shot-index derivation from `positionMs`, pause/skip cleanup, caption visibility independent of voice, and static fallback containing the complete approved narration. Reduced motion uses still/crossfade only. Run cinematic tests and build.**
- [ ] **Step 5: Replace the generic three-slide onboarding with concise first-launch Music, SFX, Voice, Captions, and Haptics preferences. Route `New Chronicle → Preferences → Opening Story → Class Selection`; replay from Journal routes directly to the opening then back to Journal. Run tests.**
- [ ] **Step 6: Commit `feat: add opening story cinematic`.**

### Task 4: Camp, route, story, HUD, and contextual onboarding

**Files:**
- Create: `src/components/CampScreen.tsx`
- Create: `src/components/RouteScreen.tsx`
- Create: `src/components/TutorialCallout.tsx`
- Modify: `src/components/GameShell.tsx`
- Modify: `src/components/TopHud.tsx`
- Modify: `src/components/StoryPanel.tsx`
- Modify: `src/components/ChoiceList.tsx`
- Modify: `src/components/SceneArt.tsx`
- Create: `src/styles/screens.css`
- Create: `tests/game-screens.test.tsx`

**Interfaces:**
- Consumes: `CampViewModel`, `RouteViewModel`, `StoryViewModel`, tutorial state, stable content art IDs, and typed `GameCommand` values.
- Produces: camp, route, and story screens; `GameShell` becomes a screen router rather than a rules owner.

- [ ] **Step 1: Write failing component tests for camp actions, three route risk profiles, multi-paragraph story blocks, visible skill-check risk, long choice wrapping, and first-event tutorial dismissal.**

```tsx
it('shows understandable risk before choosing a route', async () => {
  const dispatch = vi.fn();
  render(<RouteScreen view={ROUTE_VIEW} dispatch={dispatch} />);
  expect(screen.getByRole('button', { name: /King's Road/i })).toHaveTextContent('Lower danger');
  expect(screen.getByRole('button', { name: /Old Forest/i })).toHaveTextContent('Ambush risk');
  expect(screen.getByRole('button', { name: /Ruined Pass/i })).toHaveTextContent('High danger');
  await userEvent.click(screen.getByRole('button', { name: /Ruined Pass/i }));
  expect(dispatch).toHaveBeenCalledWith({ type: 'CHOOSE_ROUTE', routeId: 'ruined-pass' });
});

it('offers Save & Exit from camp without creating a manual rewind save', async () => {
  const onSaveAndExit = vi.fn();
  render(<CampScreen view={CAMP_VIEW} dispatch={vi.fn()} onSaveAndExit={onSaveAndExit} />);
  await userEvent.click(screen.getByRole('button', { name: 'Save & Exit' }));
  expect(onSaveAndExit).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run `npm test -- game-screens.test.tsx` and confirm failures.**
- [ ] **Step 3: Implement `GameShell` dispatch by `state.flow.screen` for `camp`, `route`, `story`, `combat`, `reward`, `merchant`, `defeat`, and `ending`. Keep overlays independent so opening Pack/Journal/Settings does not alter the current scene or RNG.**

```tsx
switch (state.flow.screen) {
  case 'camp': return <CampScreen view={selectCampView(state, content)} dispatch={dispatch} onSaveAndExit={onSaveAndExit} />;
  case 'route': return <RouteScreen view={selectRouteView(state, content)} dispatch={dispatch} />;
  case 'story': return <StoryPanel view={selectCurrentScene(state, content)!} dispatch={dispatch} />;
  case 'combat': return <CombatPanel view={selectCombatView(state, content)!} dispatch={dispatch} />;
  case 'merchant': return <MerchantScreen view={selectMerchantView(state, content)!} dispatch={dispatch} />;
  case 'defeat': return <DefeatPanel dispatch={dispatch} onMainMenu={onMainMenu} />;
}
```

- [ ] **Step 4: Implement a compact two-row HUD with chapter/location, HP, class resource label (`Stamina`, `Mana`, or `Focus`), banked/carried gold distinction, active companion, and labeled menus. Render each event's exact illustration directly by art ID with descriptive alt text; do not apply generated hue/noise filters.**
- [ ] **Step 5: Add contextual tutorial callouts only for first choice, first combat, first loot, first consumable, and first equipment action. Each has `Got it` and `Skip tutorials`; Journal replay resets only tutorial presentation flags. Run tests and build.**
- [ ] **Step 6: Commit `feat: add camp route and story screens`.**

### Task 5: Group combat and companion command interface

**Files:**
- Create: `src/components/EnemyParty.tsx`
- Create: `src/components/CombatActionBar.tsx`
- Modify: `src/components/CombatPanel.tsx`
- Create: `src/styles/combat.css`
- Create: `tests/combat-interface.test.tsx`

**Interfaces:**
- Consumes: `CombatViewModel` and emits only valid core `COMBAT` commands.
- Produces: keyboard/touch target selection, group intents, status descriptions, consumable selection, companion cooldown, and transient typed-event feedback classes.

- [ ] **Step 1: Write failing tests for three enemies, selected target, all six actions, disabled companion cooldown, item turn warning, boss flee restriction, and non-color intent/status labels.**

```tsx
it('targets one enemy and issues a companion support command', async () => {
  const dispatch = vi.fn();
  render(<CombatPanel view={GROUP_COMBAT_VIEW} dispatch={dispatch} transitionEvents={[]} />);
  await userEvent.click(screen.getByRole('button', { name: /Target Goblin Hexer/i }));
  await userEvent.click(screen.getByRole('button', { name: /Mara: Covering Shot/i }));
  expect(dispatch).toHaveBeenCalledWith({
    type: 'COMBAT',
    action: { type: 'companion', targetId: 'enemy-hexer' },
  });
});

it('labels intent without relying on color', () => {
  render(<EnemyParty enemies={GROUP_COMBAT_VIEW.enemies} selectedTargetId="enemy-guard" onTarget={vi.fn()} />);
  expect(screen.getByText('Heavy attack')).toBeVisible();
  expect(screen.getByText('Guarding ally')).toBeVisible();
});
```

- [ ] **Step 2: Run `npm test -- combat-interface.test.tsx` and confirm failures.**
- [ ] **Step 3: Implement `EnemyParty` as a labeled single-select target group. Each card shows name, role, numeric/current HP, status text with duration, primary intent, optional boss phase, and a 48-pixel target button. Dead enemies remain in the log but leave target navigation.**
- [ ] **Step 4: Implement a sticky action area with Attack, Guard, Technique, Consumable, Companion Command, and Flee. Technique/consumable subpanels remain within the document flow on 320-pixel screens; unavailable actions explain why through visible copy and `aria-describedby`.**
- [ ] **Step 5: Consume `attack_resolved` only for transient classes `is-miss`, `is-glancing`, `is-hit`, `is-critical`, `is-blocked`, and `is-parried`; never infer these states from log strings. Run tests, accessibility check, and build.**
- [ ] **Step 6: Commit `feat: build party combat interface`.**

### Task 6: Inventory, equipment, and merchant flows

**Files:**
- Modify: `src/components/InventorySheet.tsx`
- Create: `src/components/EquipmentSheet.tsx`
- Create: `src/components/MerchantScreen.tsx`
- Create: `src/styles/sheets.css`
- Create: `tests/inventory-merchant-interface.test.tsx`

**Interfaces:**
- Consumes: `InventoryViewModel`, `MerchantViewModel`, inventory/merchant commands, and item comparison selectors.
- Produces: Pack/Stash/Equipment views plus buy/sell/compare/use/equip actions with no silent loss.

- [ ] **Step 1: Write failing tests for 24-slot stacked capacity, use in field, swap equipment, full-pack rejection copy, class restrictions, persistent stock, buy/sell quote, and insufficient gold.**

```tsx
it('uses a stacked consumable outside battle without spending a combat turn', async () => {
  const dispatch = vi.fn();
  render(<InventorySheet view={INVENTORY_VIEW} context="field" dispatch={dispatch} onClose={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Use Red Mercy' }));
  expect(dispatch).toHaveBeenCalledWith({ type: 'USE_ITEM', instanceId: 'stack-red-mercy', context: 'field' });
});

it('shows the exact merchant price before purchase', async () => {
  const dispatch = vi.fn();
  render(<MerchantScreen view={MERCHANT_VIEW} dispatch={dispatch} />);
  expect(screen.getByRole('button', { name: /Buy Patched Mail for 38 gold/i })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: /Buy Patched Mail for 38 gold/i }));
  expect(dispatch).toHaveBeenCalledWith({ type: 'MERCHANT_BUY', stockEntryId: 'stock-mail-1' });
});
```

- [ ] **Step 2: Run `npm test -- inventory-merchant-interface.test.tsx` and confirm failures.**
- [ ] **Step 3: Implement Pack and Stash tabs with `used / 24 slots`, quantities, rarity in text, category, concise effect, Compare, Use, Move, Sell, and confirmed Discard. Equipped and quest items show their separate locations and do not inflate the field count.**
- [ ] **Step 4: Implement Equipment with four explicit slots, current derived stats, alternative-item deltas using `+`/`−` text and icons, class/level restrictions, atomic swap labels, and a visible destination when unequipping a full pack.**
- [ ] **Step 5: Implement Merchant buy/sell tabs, portrait/art, dialogue, banked/carried/total gold, persisted stock quantities, exact quote, reputation modifier explanation, compare/equip/use after purchase, and a clear non-blocking empty-stock state. Run tests and build.**
- [ ] **Step 6: Commit `feat: add inventory equipment and merchants`.**

### Task 7: Journal, companions, settings, pause, reward, and defeat

**Files:**
- Modify: `src/components/ChronicleSheet.tsx`
- Create: `src/components/JournalSheet.tsx`
- Create: `src/components/CompanionPanel.tsx`
- Modify: `src/components/SettingsSheet.tsx`
- Create: `src/components/PauseSheet.tsx`
- Modify: `src/components/RewardPanel.tsx`
- Create: `src/components/DefeatPanel.tsx`
- Modify: `src/components/GameShell.tsx`
- Create: `tests/journal-settings-interface.test.tsx`
- Modify: `tests/interface.test.tsx`

**Interfaces:**
- Consumes: journal/companion/settings/reward view models, `UPDATE_SETTINGS`, `SET_ACTIVE_COMPANION`, `RETURN_TO_CAMP`, `RESTART_CHAPTER`, and rewarded-offer state.
- Produces: readable progression/reference overlays, safe pause actions, optional reward presentation, and complete defeat recovery.

- [ ] **Step 1: Write failing tests for objective/evidence tabs, qualitative loyalty, personal quests, companion switching, all settings, cinematic/tutorial replay, immediate base reward, and the three defeat actions.**

```tsx
it('offers every deterministic defeat exit', async () => {
  const dispatch = vi.fn();
  const onMainMenu = vi.fn();
  render(<DefeatPanel dispatch={dispatch} onMainMenu={onMainMenu} />);
  await userEvent.click(screen.getByRole('button', { name: 'Return to Last Camp' }));
  await userEvent.click(screen.getByRole('button', { name: 'Restart Chapter' }));
  expect(dispatch).toHaveBeenCalledWith({ type: 'RETURN_TO_CAMP' });
  expect(screen.getByRole('dialog', { name: 'Restart this chapter?' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Restart Chapter from Beginning' }));
  expect(dispatch).toHaveBeenCalledWith({ type: 'RESTART_CHAPTER' });
  await userEvent.click(screen.getByRole('button', { name: 'Main Menu' }));
  expect(onMainMenu).toHaveBeenCalledOnce();
});

it('keeps base battle gold when the optional ad is unavailable', () => {
  render(<RewardPanel view={{ ...REWARD_VIEW, baseGoldGranted: true, rewardedOffer: { status: 'unavailable' } }} dispatch={vi.fn()} />);
  expect(screen.getByText('18 gold received')).toBeVisible();
  expect(screen.getByText('Bonus video unavailable. Your reward is safe.')).toBeVisible();
});
```

- [ ] **Step 2: Run `npm test -- journal-settings-interface.test.tsx interface.test.tsx` and confirm failures.**
- [ ] **Step 3: Implement Journal tabs `Story`, `Evidence`, `Companions`, `Tutorials`, and `Codex`. Show current objective first, decisions in readable authored labels rather than raw flag IDs, recruitment hints without displaying exact hidden requirements, and buttons to replay tutorials/opening.**
- [ ] **Step 4: Implement Companion cards with Wary/Respectful/Loyal copy, three personal-quest stages, exploration passive, battle command/cooldown, injury or departure state, and one active-companion selector. Never expose loyalty numbers or label one choice as the correct answer.**
- [ ] **Step 5: Implement settings for 90–140% text scale, high contrast, reduced motion, haptics on/off, reduced haptics, SFX/music/voice levels 0–100%, automatic/manual voice replay, captions, and screen-reader announcements. Every control has a visible label and immediate preview-safe update.**
- [ ] **Step 6: Implement Pause with Save & Exit and confirmed Restart Chapter. Implement Reward so base XP/gold/items appear before the optional doubled ordinary battle-gold action; render pending, unavailable, failed, claimed, and dismissed states without blocking Continue.**
- [ ] **Step 7: Replace the current `Try Again` defeat behavior with icon-labeled Return to Last Camp, confirmed Restart Chapter, and Main Menu. Run focused tests and build.**
- [ ] **Step 8: Commit `feat: complete Chronicle menus and recovery`.**

### Task 8: Typed sound, haptic, motion, and announcement consumption

**Files:**
- Create: `src/ui/feedback.ts`
- Modify: `src/ui/useGameSession.ts`
- Modify: `src/components/GameShell.tsx`
- Create: `tests/feedback.test.ts`

**Interfaces:**
- Consumes: `DomainEvent[]`, `UiSettings`, and the injected `UiPorts.feedback` implementation.
- Produces: `feedbackForTransition(events, settings): FeedbackCue[]` with no direct Web Audio or Capacitor dependency.

- [ ] **Step 1: Write failing mapping tests for normal attack, miss, block/parry double tap, critical, heavy player damage, item, level-up, major story choice, victory, defeat, disabled haptics, reduced haptics, and zero SFX volume.**

```ts
it('maps a critical attack to clear SFX and one strong haptic', () => {
  const cues = feedbackForTransition(
    [{ type: 'attack_resolved', actor: 'hero', target: 'enemy-1', outcome: 'critical', damage: 18 }],
    UI_SETTINGS,
  );
  expect(cues).toContainEqual({ type: 'sfx', cueId: 'combat-critical', volume: 0.8 });
  expect(cues).toContainEqual({ type: 'haptic', pattern: 'strong' });
});

it('does not emit haptics when disabled', () => {
  const cues = feedbackForTransition([{ type: 'combat_defeat' }], { ...UI_SETTINGS, hapticsEnabled: false });
  expect(cues.some((cue) => cue.type === 'haptic')).toBe(false);
});
```

- [ ] **Step 2: Run `npm test -- feedback.test.ts` and confirm failures.**
- [ ] **Step 3: Implement exhaustive event mapping with volume taken from settings, reduced-haptics downgrades, English screen-reader announcements, and one cue batch per reducer transition. Unknown development events emit no user cue and produce one typed diagnostic through the development logger.**
- [ ] **Step 4: Update `useGameSession.dispatch` to save the transition state first, publish it second, then call `feedback.consume(feedbackForTransition(transition.events, settings))`. Prevent duplicate consumption by storing the last transition sequence number rather than comparing display text. Run tests and build.**
- [ ] **Step 5: Commit `feat: consume typed game feedback`.**

### Task 9: Responsive styling, dialog behavior, and focused mobile verification

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/base.css`
- Modify: `src/styles/game.css`
- Modify: `src/components/Sheet.tsx`
- Modify: `tests/accessibility.test.tsx`
- Modify: `tests/e2e/pages/MorrowmerePage.ts`
- Modify: `tests/e2e/visual-smoke-mobile.spec.ts`
- Modify: `tests/e2e/readable-layout.spec.ts`

**Interfaces:**
- Consumes: every interface component from Tasks 2–8.
- Produces: one bright responsive design system, focus-correct sheets/dialogs, and compact visual evidence at 360×800 plus 320×568.

- [ ] **Step 1: Extend component accessibility tests to Title, Opening fallback, Camp, Story, Combat, Inventory, Equipment, Merchant, Journal, Settings, Reward, and Defeat. Keep the existing serious/critical axe threshold and add explicit accessible-name checks for icon-only controls.**

```tsx
it.each([
  ['camp', makeUiGame({ screen: 'camp' })],
  ['combat', makeUiGame({ screen: 'combat', enemyCount: 3 })],
  ['merchant', makeUiGame({ screen: 'merchant' })],
  ['defeat', makeUiGame({ screen: 'defeat' })],
] as const)('has no serious accessibility violation on %s', async (_name, state) => {
  render(<GameShell state={state} content={UI_CONTENT} transitionEvents={[]} dispatch={vi.fn()} onSaveAndExit={vi.fn()} onMainMenu={vi.fn()} onReplayOpening={vi.fn()} />);
  const results = await axe.run(document.body, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } });
  expect(results.violations.filter((entry) => ['serious', 'critical'].includes(entry.impact ?? ''))).toEqual([]);
});
```

- [ ] **Step 2: Run `npm test -- accessibility.test.tsx`; record and fix only reproduced interface violations.**
- [ ] **Step 3: Split the current `game.css` rules into the focused files in the file map. Use `clamp()` for headings, `overflow-wrap: anywhere` for long names, solid light panels behind prose, minimum 48-pixel controls, `100dvh`, safe-area insets, visible focus, and `min-inline-size: 0` on every flexible grid child. Do not add filters, noise, or ambient particle pseudo-elements.**

```css
.story-copy {
  padding: 1rem;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: rgb(255 250 240 / 0.97);
  font-size: clamp(1.0625rem, calc(1.0625rem * var(--text-scale)), 1.5rem);
  line-height: 1.68;
}

.title-wordmark {
  max-inline-size: 100%;
  font-size: clamp(1.9rem, 10vw, 5.25rem);
  overflow-wrap: anywhere;
  text-wrap: balance;
}
```

- [ ] **Step 4: Upgrade `Sheet` and `ConfirmDialog` to remember the opener, focus the heading or first safe action, trap Tab within the modal, close on Escape where safe, return focus on close, lock background scroll, and keep destructive confirmation separate from the default focused action. Add component assertions for focus return.**
- [ ] **Step 5: Update the 360×800 visual smoke to capture exactly Title/slots, opening caption, Camp, Route, Story, group Combat, Inventory, Equipment, Merchant, Journal, Settings, Reward, and Defeat. For each screenshot assert `documentElement.scrollWidth <= 360`, every required action has a nonzero box, and no required heading intersects the viewport edge.**
- [ ] **Step 6: Update the 320×568 smoke to check MORROWMERE title fit, slot actions, a long story choice, three enemy names/intents, a long equipment name, merchant price, and all three defeat actions. Permit vertical page scrolling; reject horizontal scrolling and clipped fixed controls.**
- [ ] **Step 7: Run `npm test -- accessibility.test.tsx interface.test.tsx`, `npm run build`, and `npm run test:e2e -- visual-smoke-mobile.spec.ts readable-layout.spec.ts`. Commit `test: verify Chronicle I mobile interface`.**

### Task 10: Interface integration gate

**Files:**
- Create: `tests/interface-integration.test.tsx`
- Modify: only interface-owned files required by reproduced failures

**Interfaces:**
- Consumes: the stable core facade, deterministic UI fixtures, and fake media/feedback ports.
- Produces: a complete interface flow ready for final media/native/ad integration.

- [ ] **Step 1: Add one integration test that selects empty slot 2, saves preferences, skips the opening, chooses Warden, enters Chapter 1, selects a route, resolves one choice, targets an enemy, guards, uses a consumable, calls a companion, opens Inventory and Equipment, visits a merchant, opens Journal, triggers defeat, returns to camp, invokes Save & Exit, and resumes slot 2.**
- [ ] **Step 2: Assert during that flow that base rewards remain visible when rewarded video is unavailable, every transition is written to slot 2 before the next action, reopening an overlay does not alter RNG, and no opening-cinematic component appears during ordinary event or chapter transitions.**
- [ ] **Step 3: Run `npm test -- interface-integration.test.tsx` followed by `npm test -- title-slots.test.tsx cinematic.test.tsx game-screens.test.tsx combat-interface.test.tsx inventory-merchant-interface.test.tsx journal-settings-interface.test.tsx feedback.test.ts`. Fix only failures within interface-owned files.**
- [ ] **Step 4: Run `npm run build` and `git diff --check`. Verify no interface file contains `grain`, `speckle`, `scanline`, `particle-layer`, or prose-based combat cue parsing.**
- [ ] **Step 5: Commit `feat: integrate Chronicle I product interface`.**

---

## Spec coverage check

| Requirement | Tasks |
| --- | --- |
| Three continuously saved campaign slots and safe Save & Exit | 2, 10 |
| Bright responsive title/splash without clipping | 2, 9 |
| Preference onboarding and class selection order | 3 |
| 90–120 second opening-story-only cinematic, 14 shots, captions, pause/skip/replay/fallback | 3 |
| Camp, routes, authored story, contextual tutorials | 4 |
| Group combat, intents, statuses, companion command/cooldown | 5 |
| 24-slot pack, stash, equipment comparison, field consumables | 6 |
| Merchant buy/sell/use/equip with persistent stock and readable gold | 6 |
| Objectives, evidence, companion loyalty/quests, tutorial and opening replay | 7 |
| Separate accessibility, audio, voice, haptic, and motion settings | 7 |
| Immediate base rewards and non-blocking optional doubled battle gold | 7 |
| Return to Last Camp, Restart Chapter, Main Menu after defeat | 7 |
| Typed SFX/haptic/announcement consumption | 8 |
| 360×800 and 320×568 visual/readability checks | 9 |
| No cinematic reuse for ordinary events | 3, 4, 10 |
