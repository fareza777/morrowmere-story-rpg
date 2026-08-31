import { Coins, Storefront, Tent } from '@phosphor-icons/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { CombatAction } from '../game/combat/types';
import type { ChoiceId, CompanionId, EventId, ItemId } from '../game/domain/ids';
import type { InventoryCommand } from '../game/inventory';
import type { GameCommand } from '../game/state/types';
import { selectCampView, selectCombatView, selectCurrentScene, selectInventoryView, selectJournalView, selectMerchantView, selectRouteView } from '../ui/selectors';
import type { GameShellProps as BaseGameShellProps, ItemRowViewModel, UiSettings } from '../ui/types';
import { CampScreen } from './CampScreen';
import { CombatPanel } from './CombatPanel';
import { CompanionPanel } from './CompanionPanel';
import { DefeatPanel } from './DefeatPanel';
import { InventorySheet } from './InventorySheet';
import { JournalSheet } from './JournalSheet';
import { MerchantScreen } from './MerchantScreen';
import { PauseSheet } from './PauseSheet';
import { RewardPanel, type RewardViewModel } from './RewardPanel';
import { RouteScreen } from './RouteScreen';
import { SceneArt } from './SceneArt';
import { SettingsSheet } from './SettingsSheet';
import { Sheet } from './Sheet';
import { StoryPanel } from './StoryPanel';
import { TopHud, type HudMenu } from './TopHud';
import { TutorialCallout, type TutorialKind } from './TutorialCallout';

type Overlay = HudMenu | null;
type UiInventoryCommand = Exclude<InventoryCommand, { readonly type: 'add' }>;
type UndatedGameCommand = GameCommand extends infer Command
  ? Command extends { readonly updatedAt: string }
    ? Omit<Command, 'updatedAt'>
    : never
  : never;

interface GameShellProps extends BaseGameShellProps {
  readonly settings: UiSettings;
  readonly onSettingsChange: (settings: UiSettings) => void;
  readonly now?: () => string;
}

function rewardItem(itemId: ItemId, content: BaseGameShellProps['content']): ItemRowViewModel | null {
  const item = content.items.get(itemId);
  if (!item) return null;
  const categoryLabel = item.category.charAt(0).toUpperCase() + item.category.slice(1);
  return {
    entryId: null,
    itemId,
    name: item.name,
    category: item.category,
    categoryLabel,
    description: item.description,
    quantity: 1,
    iconId: null,
    rarityLabel: item.tags.includes('legendary') ? 'Legendary' : item.tags.includes('rare') ? 'Rare' : 'Common',
    tier: null,
    allowedClasses: [...item.allowedClasses],
    minimumLevel: null,
    minimumChapter: null,
    restrictionLabel: item.allowedClasses.map((heroClass) => heroClass.charAt(0).toUpperCase() + heroClass.slice(1)).join(', '),
    stats: Object.entries(item.stats).flatMap(([id, value]) => typeof value === 'number' ? [{ id, label: id.charAt(0).toUpperCase() + id.slice(1), value, displayValue: String(value) }] : []),
    tags: [...item.tags],
    usable: item.category === 'potion' || item.category === 'scroll',
    equippable: item.category === 'weapon' || item.category === 'armor' || item.category === 'charm',
  };
}

export function GameShell({ state, content, transitionEvents, dispatch, onSaveAndExit, onMainMenu, onReplayOpening, settings, onSettingsChange, now = () => new Date().toISOString() }: GameShellProps) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [choosingRoute, setChoosingRoute] = useState(false);
  const [tutorialsSkipped, setTutorialsSkipped] = useState(false);
  const [tutorialsSeen, setTutorialsSeen] = useState<ReadonlySet<TutorialKind>>(() => new Set());
  const commandSequence = useRef(0);
  const camp = useMemo(() => selectCampView(state, content), [content, state]);
  const scene = useMemo(() => selectCurrentScene(state, content), [content, state]);
  const combat = useMemo(() => selectCombatView(state, content), [content, state]);
  const inventory = useMemo(() => selectInventoryView(state, content), [content, state]);
  const journal = useMemo(() => selectJournalView(state, content), [content, state]);
  const rawScene = state.expedition?.currentSceneId ? content.events.get(state.expedition.currentSceneId) : undefined;
  const coreSceneResolved = Boolean(
    rawScene
    && state.expedition?.sceneResolution?.eventId === rawScene.id
    && (state.expedition.sceneResolution.choiceId !== null || rawScene.choices.length === 0),
  );
  const displayedScene = scene && coreSceneResolved && !scene.resolved ? { ...scene, resolved: true } : scene;
  const issue = (command: UndatedGameCommand) => dispatch({ ...command, updatedAt: now() } as GameCommand);

  useEffect(() => {
    if (state.flow.screen === 'story' && state.expedition && !state.expedition.currentSceneId) issue({ type: 'select-next-scene' });
  }, [state.flow.screen, state.expedition?.currentSceneId]);

  useLayoutEffect(() => { window.scrollTo(0, 0); }, [state.flow.screen, scene?.id, choosingRoute]);

  const currentTutorial: TutorialKind | null = tutorialsSkipped ? null
    : state.flow.screen === 'story' && displayedScene && !displayedScene.resolved && displayedScene.choices.length > 0 && !tutorialsSeen.has('choice') ? 'choice'
      : state.flow.screen === 'combat' && !tutorialsSeen.has('combat') ? 'combat'
        : state.flow.screen === 'reward' && !tutorialsSeen.has('loot') ? 'loot'
          : null;
  const dismissTutorial = (kind: TutorialKind) => setTutorialsSeen((seen) => new Set([...seen, kind]));
  const resetTutorials = () => { setTutorialsSkipped(false); setTutorialsSeen(new Set()); };
  const inventoryTutorial: Extract<TutorialKind, 'consumable' | 'equipment'> | null = tutorialsSkipped ? null
    : inventory.pack.some((item) => item.usable) && !tutorialsSeen.has('consumable') ? 'consumable'
      : !tutorialsSeen.has('equipment') ? 'equipment' : null;

  const combatAction = (action: CombatAction) => {
    commandSequence.current += 1;
    issue({ type: 'combat-turn', commandId: `ui-combat-${commandSequence.current}`, action });
  };
  const inventoryCommand = (command: UiInventoryCommand) => issue({ type: 'inventory', command });
  const context = state.flow.screen === 'camp' ? 'camp' : state.flow.screen === 'combat' ? 'combat' : 'field';
  const narrationText = scene ? `${scene.title}. ${scene.paragraphs.join(' ')}` : combat ? `Battle. ${combat.enemies.map((enemy) => `${enemy.name}: ${enemy.intent.description}`).join(' ')}` : '';
  const style = { '--text-scale': settings.textScale } as CSSProperties;

  const rewardReceipt = state.expedition?.pendingReward;
  const rewardView: RewardViewModel | null = rewardReceipt ? {
    rewardId: rewardReceipt.rewardId,
    gold: rewardReceipt.baseGold,
    xp: rewardReceipt.grantedXp,
    items: rewardReceipt.itemChoices.map((itemId) => rewardItem(itemId, content)).filter((item): item is ItemRowViewModel => item !== null),
    bonusStatus: rewardReceipt.adEligible ? 'unavailable' : 'dismissed',
  } : null;

  const hubActions = rawScene?.type === 'hub' && coreSceneResolved ? (
    <div className="hub-actions">
      {rawScene.merchantId && <button className="button button-secondary" type="button" onClick={() => issue({ type: 'open-merchant' })}><Storefront size={20} aria-hidden="true" />Visit Merchant</button>}
      <button className="button button-secondary" type="button" onClick={() => issue({ type: 'bank-camp' })}><Tent size={20} aria-hidden="true" />Return to Camp &amp; Bank {state.expedition?.unbankedGold ?? 0} Gold</button>
    </div>
  ) : null;

  let body;
  if (state.flow.screen === 'camp' && choosingRoute) {
    body = <RouteScreen view={selectRouteView(state, content)} onBack={() => setChoosingRoute(false)} onChooseRoute={(routeProfile) => { setChoosingRoute(false); issue({ type: 'start-expedition', routeProfile }); }} />;
  } else if (state.flow.screen === 'camp') {
    body = <CampScreen view={camp} onChooseRoute={() => setChoosingRoute(true)} onOpenInventory={() => setOverlay('inventory')} onOpenJournal={() => setOverlay('journal')} onOpenCompanions={() => setOverlay('companions')} onSaveAndExit={onSaveAndExit} />;
  } else if (state.flow.screen === 'story' && displayedScene) {
    body = <><SceneArt illustrationId={displayedScene.illustrationId} alt={displayedScene.illustrationAlt} />{currentTutorial === 'choice' && <TutorialCallout kind="choice" onDismiss={() => dismissTutorial('choice')} onSkipAll={() => setTutorialsSkipped(true)} />}<main className="game-main"><StoryPanel view={displayedScene} onChoose={(choiceId) => issue({ type: 'resolve-choice', eventId: displayedScene.id as EventId, choiceId: choiceId as ChoiceId })} onContinue={() => issue({ type: 'select-next-scene' })} extraActions={hubActions} /></main></>;
  } else if (state.flow.screen === 'story') {
    body = <main className="loading-screen" aria-live="polite"><p>Preparing the next road…</p></main>;
  } else if (state.flow.screen === 'combat' && combat) {
    body = <>{scene && <SceneArt illustrationId={scene.illustrationId} alt={scene.illustrationAlt} />}{currentTutorial === 'combat' && <TutorialCallout kind="combat" onDismiss={() => dismissTutorial('combat')} onSkipAll={() => setTutorialsSkipped(true)} />}<main className="game-main"><CombatPanel view={combat} inventory={inventory} transitionEvents={transitionEvents} onAction={combatAction} /></main></>;
  } else if (state.flow.screen === 'reward' && rewardView) {
    body = <>{currentTutorial === 'loot' && <TutorialCallout kind="loot" onDismiss={() => dismissTutorial('loot')} onSkipAll={() => setTutorialsSkipped(true)} />}<main className="game-main"><RewardPanel view={rewardView} onClaim={(itemId) => issue({ type: 'claim-rewards', rewardId: rewardView.rewardId, itemId: itemId as ItemId | null })} /></main></>;
  } else if (state.flow.screen === 'merchant') {
    const merchant = selectMerchantView(state, content);
    body = merchant ? <MerchantScreen view={merchant} onBuy={(stockEntryId) => issue({ type: 'trade', intent: { type: 'buy', stockEntryId } })} onSell={(entryId, quantity) => issue({ type: 'trade', intent: { type: 'sell', entryId, quantity } })} onClose={() => issue({ type: 'close-merchant' })} /> : <main className="loading-screen"><p>The merchant has packed away this stall.</p><button className="button button-secondary" type="button" onClick={() => issue({ type: 'close-merchant' })}>Leave</button></main>;
  } else if (state.flow.screen === 'defeat') {
    body = <main className="game-main"><DefeatPanel onReturnToCamp={() => issue({ type: 'return-to-camp-after-defeat' })} onRestartChapter={() => issue({ type: 'restart-chapter' })} onMainMenu={onMainMenu} /></main>;
  } else {
    body = <main className="game-main"><section className="end-panel"><p className="eyebrow">Chronicle I complete</p><h1>The Black Banner road has ended.</h1><p>Your choices remain in the Chronicle. Future expansions will continue from the consequences you carried home.</p><button className="button button-secondary" type="button" onClick={onSaveAndExit}>Save &amp; Exit</button></section></main>;
  }

  return (
    <div className={`game-shell${settings.highContrast ? ' is-high-contrast' : ''}${settings.reducedMotion ? ' is-reduced-motion' : ''}`} style={style}>
      {settings.screenReaderAnnouncements && narrationText && <div className="sr-only" aria-live="polite" aria-atomic="true">{narrationText}</div>}
      {state.flow.screen !== 'defeat' && state.flow.screen !== 'ending' && <TopHud hero={camp.hero} companion={camp.activeCompanion} onOpenMenu={setOverlay} />}
      {body}
      {overlay === 'inventory' && <InventorySheet view={inventory} context={context} heroClass={state.campaign.hero.heroClass} heroLevel={state.campaign.hero.level} chapter={Number(state.campaign.chapterId.slice(2))} onUse={(entryId) => issue({ type: 'use-item', entryId })} onInventoryCommand={inventoryCommand} onClose={() => setOverlay(null)} tutorialKind={inventoryTutorial} onTutorialDismiss={() => inventoryTutorial && dismissTutorial(inventoryTutorial)} onSkipTutorials={() => setTutorialsSkipped(true)} />}
      {overlay === 'journal' && <JournalSheet view={journal} canSwitchCompanion={state.flow.screen === 'camp'} onSetActiveCompanion={(companionId) => issue({ type: 'set-active-companion', companionId: companionId as CompanionId | null })} onReplayOpening={onReplayOpening} onReplayTutorials={resetTutorials} onClose={() => setOverlay(null)} />}
      {overlay === 'companions' && <Sheet title="Companions" onClose={() => setOverlay(null)}><CompanionPanel companions={journal.companions} canSwitch={state.flow.screen === 'camp'} onSetActive={(companionId) => issue({ type: 'set-active-companion', companionId: companionId as CompanionId | null })} /></Sheet>}
      {overlay === 'settings' && <SettingsSheet settings={settings} onChange={onSettingsChange} onClose={() => setOverlay(null)} />}
      {overlay === 'pause' && <PauseSheet onResume={() => setOverlay(null)} onSaveAndExit={onSaveAndExit} onRestartChapter={() => { setOverlay(null); issue({ type: 'restart-chapter' }); }} />}
      {state.expedition && state.expedition.unbankedGold > 0 && state.flow.screen !== 'merchant' && <p className="carried-gold-note"><Coins size={16} aria-hidden="true" />{state.expedition.unbankedGold} carried gold is at risk until camp.</p>}
    </div>
  );
}
