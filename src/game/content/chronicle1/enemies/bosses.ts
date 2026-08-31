import type { EnemyRole } from '../../../combat/types';
import type { EnemyIntent, EnemySpecies, RegionId } from '../../../types';
import { deepFreeze } from '../builders';
import type {
  BossAntiCheeseRule,
  BossPhaseDefinition,
  Chronicle1BossDefinition,
  EnemyCompatibilityTag,
  EnemyStatusInteraction,
} from './types';

export const BOSS_IDS = deepFreeze([
  'boss-rattlehook-bridge-chief',
  'boss-captain-oren-dusk',
  'boss-black-banner-gatebreaker',
  'boss-osra-mire-witch',
  'boss-harrow-ferry-reaver',
  'boss-redwater-provocateur',
  'boss-kargan-war-chief',
  'boss-embervault-forgemaster',
  'boss-royal-armory-golem',
  'boss-siege-engineer-malrec',
  'boss-black-banner-commander',
  'boss-crownless-gate-warden',
  'boss-voss-champion-elian-roake',
  'boss-marshal-severin-voss',
  'boss-coronation-engine',
] as const);

const ROLE_TRAIT: Readonly<Record<EnemyRole, string>> = {
  defender: 'Shield Wall',
  assassin: 'Executioner',
  archer: 'Stone Wings',
  shaman: 'Witchfire',
  controller: 'Drowning Word',
  summoner: 'Ancestor Smoke',
  commander: 'Deathless Drill',
  specialist: 'Regeneration',
};

const ROLE_TAGS: Readonly<Record<EnemyRole, readonly EnemyCompatibilityTag[]>> = {
  defender: ['frontline'],
  assassin: ['mobile'],
  archer: ['backline', 'ranged'],
  shaman: ['arcane', 'support'],
  controller: ['arcane', 'hard-control'],
  summoner: ['arcane', 'summons'],
  commander: ['frontline', 'leader'],
  specialist: ['specialist'],
};

const ROLE_INCOMPATIBLE: Readonly<Record<EnemyRole, readonly EnemyCompatibilityTag[]>> = {
  defender: [],
  assassin: [],
  archer: [],
  shaman: [],
  controller: ['hard-control', 'summons'],
  summoner: ['hard-control', 'summons'],
  commander: ['leader'],
  specialist: [],
};

interface BossSpec {
  readonly id: typeof BOSS_IDS[number];
  readonly name: string;
  readonly level: number;
  readonly species: EnemySpecies;
  readonly region: RegionId;
  readonly eligibleRegions?: readonly RegionId[];
  readonly role: EnemyRole;
  readonly threatCost: number;
  readonly uniqueTrait: string;
  readonly intentWeights: Readonly<Partial<Record<EnemyIntent, number>>>;
  readonly rewardTags: readonly string[];
  readonly description: string;
  readonly battlefieldRule: string;
  readonly compatibilityTags?: readonly EnemyCompatibilityTag[];
  readonly statusInteractions: readonly EnemyStatusInteraction[];
  readonly phases: readonly BossPhaseDefinition[];
  readonly antiCheese: BossAntiCheeseRule;
  readonly healthBonus?: number;
  readonly armorBonus?: number;
  readonly wardBonus?: number;
}

const phase = (
  id: string,
  label: string,
  startsAtHealthPercent: number,
  telegraph: string,
  counterplay: string,
  intentWeights: Readonly<Partial<Record<EnemyIntent, number>>>,
): BossPhaseDefinition => ({ id, label, startsAtHealthPercent, telegraph, counterplay, intentWeights });

const interaction = (
  statusId: EnemyStatusInteraction['statusId'],
  relation: EnemyStatusInteraction['relation'],
  detail: string,
): EnemyStatusInteraction => ({ statusId, relation, detail });

function boss(spec: BossSpec): Chronicle1BossDefinition {
  const arcane = spec.role === 'controller' || spec.role === 'shaman' || spec.role === 'summoner';
  const defender = spec.role === 'defender';
  return {
    id: spec.id,
    archetypeId: spec.id,
    name: spec.name,
    rank: 11,
    level: spec.level,
    species: spec.species,
    region: spec.region,
    eligibleRegions: spec.eligibleRegions ?? [spec.region],
    maxHealth: 55 + spec.level * 7 + (spec.healthBonus ?? 0),
    attack: 6 + Math.floor(spec.level * 0.7),
    armor: 2 + Math.floor(spec.level / 4) + (defender ? 3 : 0) + (spec.armorBonus ?? 0),
    ward: 1 + Math.floor(spec.level / 5) + (arcane ? 4 : 0) + (spec.wardBonus ?? 0),
    intentWeights: spec.intentWeights,
    traits: [ROLE_TRAIT[spec.role], spec.uniqueTrait, 'Unique Boss'],
    rewardTags: spec.rewardTags,
    description: spec.description,
    artFamily: 'chronicle1-boss',
    portraitId: `enemy-portrait-${spec.id}`,
    role: spec.role,
    compatibilityTags: [...ROLE_TAGS[spec.role], 'elite', 'unique', ...(spec.compatibilityTags ?? [])],
    incompatibleTags: ROLE_INCOMPATIBLE[spec.role],
    statusInteractions: spec.statusInteractions,
    battlefieldRule: spec.battlefieldRule,
    threatCost: spec.threatCost,
    isBoss: true,
    phases: spec.phases,
    antiCheese: spec.antiCheese,
  };
}

const BOSS_SPECS: readonly BossSpec[] = [
  {
    id: 'boss-rattlehook-bridge-chief', name: 'Rattlehook, Bridge Chief', level: 2, species: 'goblin',
    region: 'gloamwood', role: 'assassin', threatCost: 7, uniqueTrait: 'Rattlehook Feint',
    intentWeights: { strike: 4, heavy: 2, guard: 1 }, rewardTags: ['knife', 'gold'],
    description: 'A disciplined goblin raider who uses the burning bridge as cover, never as a supernatural weapon.',
    battlefieldRule: 'Rattlehook changes sides of the bridge after every committed hook attack.',
    statusInteractions: [interaction('marked', 'resists', 'Marking him removes the smoke feint but does not cancel a hook already in motion.')],
    phases: [
      phase('rattlehook-smoke-line', 'Across the Smoke Line', 100, 'He taps the bridge rail twice before crossing behind a wet-hide shield.', 'Break the shield guard or move off the rail before answering his telegraphed hook.', { strike: 4, guard: 2, heavy: 1 }),
      phase('rattlehook-cut-rope', 'Cut the Escape Rope', 50, 'He drops the shield and wraps his hook around the civilian escape rope.', 'Stagger him during the heavy windup; guarding protects the rope crew if the strike lands.', { heavy: 4, strike: 3 }),
    ],
    antiCheese: { trigger: 'The player guards for two turns without contesting the hook lane.', response: 'Rattlehook changes lanes and threatens the escape rope instead of gaining free damage.', counterplay: 'Attack, mark him, or move pressure onto the rope lane before the next telegraph.' },
  },
  {
    id: 'boss-captain-oren-dusk', name: 'Captain Oren Dusk', level: 4, species: 'human',
    region: 'gloamwood', role: 'commander', threatCost: 9, uniqueTrait: 'Measured Volley',
    intentWeights: { guard: 3, strike: 3, heavy: 2 }, rewardTags: ['weapon', 'armor'],
    description: 'A Black Banner captain who treats the Greywatch assault as a timed military exercise.',
    battlefieldRule: 'Oren signals one ally before committing his own blade, making the order visible first.',
    statusInteractions: [interaction('silenced', 'exploits', 'Silencing the command whistle prevents his next ally-strengthening order.')],
    phases: [
      phase('oren-timed-ladders', 'The Timed Ladders', 100, 'Oren raises a white baton and counts the climbers into a single wall assault.', 'Strike the signal hand or guard the marked wall section until the count breaks.', { guard: 3, strike: 3, heavy: 1 }),
      phase('oren-last-file', 'The Last File Forward', 50, 'He snaps the baton and joins the front rank with his reserve blade.', 'Parry the direct advance or remove his remaining support before trading heavy attacks.', { strike: 4, heavy: 3, guard: 1 }),
    ],
    antiCheese: { trigger: 'The party attacks only Oren while several commanded allies remain active.', response: 'He withdraws behind the nearest guard and repeats a visible formation order.', counterplay: 'Break the guard line, silence the whistle, or defeat the commanded ally before returning to him.' },
  },
  {
    id: 'boss-black-banner-gatebreaker', name: 'The Black Banner Gatebreaker', level: 4, species: 'human',
    region: 'gloamwood', role: 'defender', threatCost: 9, uniqueTrait: 'Powder Cart Bulwark',
    intentWeights: { guard: 4, heavy: 3, strike: 1 }, rewardTags: ['armor', 'supply'],
    description: 'A plated sapper who advances beside a powder cart and protects its burning fuse.',
    battlefieldRule: 'The Gatebreaker must lower the cart shield before making a heavy strike.',
    statusInteractions: [interaction('guard-broken', 'exploits', 'A broken cart guard exposes both the sapper and the fuse for one exchange.')],
    phases: [
      phase('gatebreaker-cart-shield', 'Behind the Powder Cart', 100, 'The cart shield locks forward while the Gatebreaker plants both feet behind it.', 'Use guard-breaking force or attack the wheel before the protected heavy swing.', { guard: 4, heavy: 2, strike: 1 }),
      phase('gatebreaker-last-fuse', 'The Last Fuse', 45, 'The cart stops and he reaches for a short reserve fuse under his breastplate.', 'A stagger interrupts the light; otherwise guard through the blast lane and answer afterward.', { heavy: 4, strike: 2 }),
    ],
    antiCheese: { trigger: 'The player repeatedly attacks the closed cart shield without changing actions.', response: 'He braces instead of escalating damage and advances the visible fuse one step.', counterplay: 'Change targets to the wheel, use a guard break, or wait behind guard for the shield to open.' },
  },
  {
    id: 'boss-osra-mire-witch', name: 'Osra, Mire Witch', level: 6, species: 'mage',
    region: 'drowned-road', role: 'controller', threatCost: 11, uniqueTrait: 'Flood-Knot',
    intentWeights: { hex: 4, guard: 2, strike: 1 }, rewardTags: ['scroll', 'potion'],
    description: 'A practical marsh witch paid to strand evidence boats and delay relief traffic.',
    battlefieldRule: 'Osra controls one wet lane at a time and visibly reties the flood-knot before moving it.',
    statusInteractions: [interaction('hindered', 'applies', 'Her flood-knot hinders once and cannot renew while the original knot remains.')],
    phases: [
      phase('osra-orchard-knot', 'Knot the Orchard Current', 100, 'Osra winds blue cord around one wrist while water gathers toward a named lane.', 'Move from the named lane or silence the hex before the current closes around it.', { hex: 4, guard: 2, strike: 1 }),
      phase('osra-borrowed-current', 'Borrow the Ferry Current', 50, 'She cuts the first cord and reaches for the ferry towline with both hands.', 'Break line of sight behind a tree or stagger her before the heavier current is released.', { hex: 4, heavy: 2 }),
    ],
    antiCheese: { trigger: 'The party remains outside melee range and waits for every knot to expire.', response: 'Osra moves the visible knot toward the evidence ferry instead of extending control duration.', counterplay: 'Close through the safe lane, silence her, or protect the ferry while the knot resolves.' },
  },
  {
    id: 'boss-harrow-ferry-reaver', name: 'Harrow, Ferry Reaver', level: 6, species: 'human',
    region: 'drowned-road', role: 'assassin', threatCost: 11, uniqueTrait: 'Boarding Hook',
    intentWeights: { strike: 4, heavy: 2, flee: 1 }, rewardTags: ['gold', 'blade'],
    description: 'A river smuggler who boards evidence ferries with a hook, weighted coat, and sober patience.',
    battlefieldRule: 'Harrow must plant his boarding hook before crossing to a new target.',
    statusInteractions: [interaction('marked', 'exploits', 'A mark reveals which gunwale Harrow has chosen and removes his first-strike advantage.')],
    phases: [
      phase('harrow-hook-line', 'Hook the Evidence Skiff', 100, 'Harrow swings the weighted hook twice toward the skiff carrying the evidence chest.', 'Cut the rope after it lands or guard the chosen gunwale before he crosses.', { strike: 4, guard: 1, heavy: 2 }),
      phase('harrow-abandon-skiff', 'Abandon the Lead Skiff', 45, 'He kicks his own tiller loose and prepares to leap across the narrowing water.', 'Mark or stagger him during the leap telegraph; a guarded target can absorb the landing.', { heavy: 3, strike: 4 }),
    ],
    antiCheese: { trigger: 'The player focuses only on defense while Harrow remains on a separate skiff.', response: 'He hooks the evidence chest rather than gaining an unavoidable attack on the hero.', counterplay: 'Cut the hook line, move the chest, or force his telegraphed boarding leap.' },
  },
  {
    id: 'boss-redwater-provocateur', name: 'The Redwater Provocateur', level: 8, species: 'human',
    region: 'drowned-road', role: 'controller', threatCost: 13, uniqueTrait: 'False Charge Signal',
    intentWeights: { hex: 3, strike: 2, guard: 2 }, rewardTags: ['scroll', 'gold'],
    description: 'A false signal officer trained to turn disciplined armies against civilians and one another.',
    battlefieldRule: 'Every control effect begins with a recognizable horn or flag signal that can be interrupted.',
    statusInteractions: [interaction('silenced', 'exploits', 'Silence disables the false horn while leaving his ordinary sword attacks intact.')],
    phases: [
      phase('provocateur-false-horn', 'The Second Charge Call', 100, 'He fills his lungs and raises a horn marked with a stolen Greywatch cord.', 'Silence, stagger, or close before the note; guarding protects against the following rush.', { hex: 3, guard: 2, strike: 2 }),
      phase('provocateur-pitch-signal', 'Pitch Arrows Aloft', 50, 'He abandons the horn and lifts a red roof flag toward the waiting archers.', 'Break the flagstaff or move under roof cover before the clearly marked volley.', { strike: 3, heavy: 3 }),
    ],
    antiCheese: { trigger: 'The party interrupts the same signal repeatedly without advancing on the tower.', response: 'He changes from horn to flag instead of making the control unavoidable.', counterplay: 'Close the distance during the changeover or use the tower walls as cover.' },
  },
  {
    id: 'boss-kargan-war-chief', name: 'Kargan, War Chief', level: 8, species: 'orc',
    region: 'drowned-road', role: 'commander', threatCost: 13, uniqueTrait: 'Hardliner Oath',
    intentWeights: { guard: 3, strike: 3, heavy: 2 }, rewardTags: ['weapon', 'armor'],
    description: 'A Free Host hardliner whose anger is political, comprehensible, and dangerous at the parley rope.',
    battlefieldRule: 'Kargan commits to the fighter who answers his challenge and leaves witnesses outside that duel.',
    statusInteractions: [interaction('guard-broken', 'resists', 'Breaking his guard stops one command but does not erase his next visible challenge.')],
    phases: [
      phase('kargan-hold-the-rope', 'Hold the Parley Rope', 100, 'Kargan plants his axe behind the boundary and orders the rear file to stay put.', 'Challenge him directly or remove the black-bracer agitator feeding his command line.', { guard: 3, strike: 3, heavy: 1 }),
      phase('kargan-oath-challenge', 'The Oath Challenge', 50, 'He names one opponent and raises the axe for a committed overhead cut.', 'Guard or parry the named strike; attacking witnesses gives no advantage and is never required.', { heavy: 4, strike: 2 }),
    ],
    antiCheese: { trigger: 'The party avoids Kargan while attacking unarmed people near the parley table.', response: 'He intercepts the attack and restores the duel instead of gaining permanent buffs.', counterplay: 'Accept the named challenge, disarm him, or expose the matching black bracers.' },
  },
  {
    id: 'boss-embervault-forgemaster', name: 'Hadrik Vale, Embervault Forgemaster', level: 10, species: 'human',
    region: 'embervault', role: 'defender', threatCost: 15, uniqueTrait: 'Quenching Lever',
    intentWeights: { guard: 3, heavy: 3, strike: 2 }, rewardTags: ['ore', 'armor'],
    description: 'The armored master of Embervault who defends the accounting wing and its weapon ledgers.',
    battlefieldRule: 'Hadrik alternates between guarding the lever and crossing the hot center lane.',
    statusInteractions: [interaction('staggered', 'exploits', 'A stagger beside the quenching channel opens his plate while the floor cools.')],
    phases: [
      phase('hadrik-ledger-door', 'Seal the Ledger Door', 100, 'Hadrik sets his shoulder behind the accounting lever and locks his hammer low.', 'Break his guard or disable the channel so the approach no longer costs position.', { guard: 3, heavy: 2, strike: 2 }),
      phase('hadrik-quenched-hammer', 'The Quenched Hammer', 50, 'He plunges the hammer head into water and raises it through a clear cloud of steam.', 'Leave the marked center lane or guard the descending blow, then punish the long recovery.', { heavy: 4, strike: 3 }),
    ],
    antiCheese: { trigger: 'The player waits outside the hot lane while repeatedly using ranged attacks.', response: 'Hadrik closes the ledger door one step instead of reflecting or nullifying damage.', counterplay: 'Disable the channel, rush the lever, or accept one guarded crossing before the door seals.' },
  },
  {
    id: 'boss-royal-armory-golem', name: 'Royal Armory Golem', level: 10, species: 'construct',
    region: 'embervault', role: 'defender', threatCost: 15, uniqueTrait: 'Custody Protocol',
    intentWeights: { guard: 4, heavy: 2, strike: 2 }, rewardTags: ['ore', 'relic'],
    description: 'A lawful inventory construct redirected by forged custody numbers rather than forbidden magic.',
    battlefieldRule: 'The golem exposes one numbered command plate whenever it changes protected carts.',
    statusInteractions: [interaction('guard-broken', 'exploits', 'Breaking the command plate cancels its current cart-guard order for one exchange.')],
    phases: [
      phase('golem-custody-count', 'Protect Both Inventories', 100, 'The golem reads both cart numbers and turns its plated chest toward the shared brake.', 'Present a conflicting number or break the visible chest plate before its heavy sweep.', { guard: 4, strike: 2, heavy: 1 }),
      phase('golem-command-plate', 'The Exposed Command Plate', 45, 'A cracked plate slides open and repeats the forged authorization in a flat voice.', 'Strike the plate with a precise attack; broad damage leaves the protocol running.', { heavy: 3, strike: 3, guard: 1 }),
    ],
    antiCheese: { trigger: 'The player stays behind one cart and attacks without contesting custody control.', response: 'The golem changes which cart it guards instead of gaining immunity or free attacks.', counterplay: 'Move to the exposed plate, present the evidence number, or break the shared brake chain.' },
    healthBonus: 12, armorBonus: 2,
  },
  {
    id: 'boss-siege-engineer-malrec', name: 'Siege Engineer Malrec', level: 12, species: 'human',
    region: 'gloamwood', role: 'commander', threatCost: 17, uniqueTrait: 'Ram Cadence',
    intentWeights: { guard: 2, strike: 2, heavy: 3 }, rewardTags: ['supply', 'weapon'],
    description: 'The engineer directing Greywatch’s covered ram with wedges, whistles, and replaceable crews.',
    battlefieldRule: 'Malrec must signal before the ram moves, exposing the cadence to disruption.',
    statusInteractions: [interaction('silenced', 'exploits', 'Silence stops one ram signal and forces Malrec into ordinary close defense.')],
    phases: [
      phase('malrec-ram-cadence', 'Three Steps and Strike', 100, 'Malrec raises three fingers while the ram crew sets its boots beneath the roof.', 'Silence the whistle, break the axle, or guard the gate lane before the third count.', { guard: 2, strike: 2, heavy: 3 }),
      phase('malrec-fireproof-wedge', 'The Fireproof Wedge', 50, 'He crawls beneath the ram with a final wedge and marks the damaged axle.', 'Reach him under the shield roof or let water crews pull the exposed rear rope.', { heavy: 3, strike: 3, guard: 1 }),
    ],
    antiCheese: { trigger: 'The party attacks the ram crew indefinitely without contesting Malrec or the axle.', response: 'He advances the ram one visible count instead of creating endless reinforcements.', counterplay: 'Interrupt the whistle, strike the axle, or force Malrec out from the shield roof.' },
  },
  {
    id: 'boss-black-banner-commander', name: 'Commander Ysra Venn', level: 12, species: 'human',
    region: 'gloamwood', role: 'commander', threatCost: 17, uniqueTrait: 'Measured Rear Guard',
    intentWeights: { guard: 3, strike: 3, heavy: 2 }, rewardTags: ['armor', 'gold'],
    description: 'The final field commander at Greywatch, tasked with destroying witnesses and receiving records.',
    battlefieldRule: 'Venn marks one objective at a time and visibly redirects her formation when it changes.',
    statusInteractions: [interaction('marked', 'resists', 'Marking Venn reveals her next route but does not remove the guards already in place.')],
    phases: [
      phase('venn-evidence-line', 'Break the Evidence Line', 100, 'Venn points her sword toward Jory and closes the shield wall by measured steps.', 'Protect the marked witness or break her command guard before the formation reaches him.', { guard: 3, strike: 3, heavy: 1 }),
      phase('venn-last-order', 'The Last Written Order', 50, 'She tears open the destruction order and signals an assassin around the far edge.', 'Intercept the visible route or stagger Venn while she holds the order overhead.', { strike: 4, heavy: 2, guard: 1 }),
    ],
    antiCheese: { trigger: 'The player withdraws repeatedly while leaving the evidence objective undefended.', response: 'Venn advances on the evidence instead of receiving an arbitrary combat buff.', counterplay: 'Re-form around Jory, break command, or force the assassin back into the shield line.' },
  },
  {
    id: 'boss-crownless-gate-warden', name: 'Crownless Gate Warden', level: 14, species: 'construct',
    region: 'crownless-keep', role: 'defender', threatCost: 19, uniqueTrait: 'Counterweight Key',
    intentWeights: { guard: 4, heavy: 2, strike: 2 }, rewardTags: ['armor', 'relic'],
    description: 'A plated gate sentinel carrying the lawful key to the counterweight brake and alarm loft.',
    battlefieldRule: 'The Warden can guard the brake or the alarm stair, never both in the same exchange.',
    statusInteractions: [interaction('guard-broken', 'exploits', 'A broken stance exposes the counterweight key at its waist for one exchange.')],
    phases: [
      phase('warden-brake-key', 'Guard the Brake Key', 100, 'The Warden squares its shield over the brake lever and turns the key inward.', 'Force it toward the alarm stair or break guard before reaching for the key.', { guard: 4, strike: 2, heavy: 1 }),
      phase('warden-drop-the-gate', 'Drop the Gate', 45, 'It abandons the alarm stair and grips the release chain with both gauntlets.', 'Stagger the chain pull or hold the brake while allies cross beneath the portcullis.', { heavy: 4, strike: 2 }),
    ],
    antiCheese: { trigger: 'The party waits on the safe side of the portcullis without contesting either control.', response: 'The Warden lowers the gate by one visible stage rather than attacking through cover.', counterplay: 'Rush the brake, silence the alarm, or bait it away from the key before the next stage.' },
    healthBonus: 10, armorBonus: 2,
  },
  {
    id: 'boss-voss-champion-elian-roake', name: 'Captain Elian Roake, Voss’s Champion', level: 14, species: 'human',
    region: 'crownless-keep', role: 'commander', threatCost: 19, uniqueTrait: 'Record-Hall Line',
    intentWeights: { guard: 3, strike: 3, heavy: 2 }, rewardTags: ['weapon', 'armor'],
    description: 'A respected Redwater officer who chooses Voss’s imposed order over the evidence against it.',
    battlefieldRule: 'Roake keeps the fight in front of the record hall and never attacks civilian witnesses.',
    statusInteractions: [interaction('guard-broken', 'resists', 'Breaking Roake’s guard stops his line command but leaves his personal blade ready.')],
    phases: [
      phase('roake-record-line', 'Shields Before the Records', 100, 'Roake lowers his visor and names the exact stair his shield line will hold.', 'Break one flank or show the saved custody register before committing to the center.', { guard: 3, strike: 3, heavy: 1 }),
      phase('roake-champion-alone', 'The Champion Alone', 50, 'He dismisses the wounded guards and takes the upper stair with a two-handed grip.', 'Parry the named descending cut or guard it, then answer before he resets the stair.', { heavy: 4, strike: 3 }),
    ],
    antiCheese: { trigger: 'The party tries to draw Roake into the occupied witness gallery.', response: 'He refuses the bait and holds the stair instead of attacking civilians or teleporting.', counterplay: 'Fight on the stair, expose Voss’s order, or force a clean flank through the record lane.' },
  },
  {
    id: 'boss-marshal-severin-voss', name: 'Marshal Severin Voss', level: 15, species: 'human',
    region: 'crownless-keep', role: 'commander', threatCost: 21, uniqueTrait: 'Emergency Compact',
    intentWeights: { guard: 3, strike: 2, heavy: 2 }, rewardTags: ['gold', 'relic'],
    description: 'The marshal who manufactured shortage and violence, then offered enforced order as the cure.',
    battlefieldRule: 'Voss uses guards and machinery as visible institutions of control, not unexplained magic.',
    statusInteractions: [interaction('silenced', 'exploits', 'Silencing the command bell prevents his next platform order but not his defense.')],
    phases: [
      phase('voss-offers-order', 'Order at Any Price', 100, 'Voss raises the Compact seal and orders the platform guards to close one named lane.', 'Present evidence to split the guard, silence the bell, or move before the lane closes.', { guard: 3, strike: 2, heavy: 1 }),
      phase('voss-command-platform', 'The Command Platform', 50, 'He abandons the legal seal and reaches for the red lever beside the signal rail.', 'Take the lever, break the signal chain, or guard through the clearly marked platform strike.', { heavy: 3, strike: 3, guard: 1 }),
    ],
    antiCheese: { trigger: 'The party repeats attacks from outside the platform while ignoring every control lever.', response: 'Voss closes one announced lane instead of gaining invulnerability or unavoidable damage.', counterplay: 'Contest a lever, use the evidence split, or cross the remaining open lane before his next order.' },
  },
  {
    id: 'boss-coronation-engine', name: 'The Coronation Engine', level: 15, species: 'construct',
    region: 'crownless-keep', role: 'specialist', threatCost: 21, uniqueTrait: 'Linked Iron Controls',
    intentWeights: { heavy: 3, guard: 2, strike: 2 }, rewardTags: ['ore', 'relic'],
    description: 'A seal press, alarm bell, shutters, and portcullis linked by ordinary but dangerous iron machinery.',
    battlefieldRule: 'Each mechanism moves after a named signal and exposes a separate brake or chain.',
    statusInteractions: [interaction('staggered', 'exploits', 'A stagger at the active control arrests one mechanism without disabling the whole hall.')],
    phases: [
      phase('engine-shutters', 'Shutters and Seal Press', 100, 'The signaler raises a square flag before shutters close around the heavy seal press.', 'Take the signal rail or jam the named shutter before the press cycle completes.', { guard: 2, strike: 3, heavy: 2 }),
      phase('engine-portcullis', 'The Falling Portcullis', 45, 'The counterweight chain tightens and the brake lever begins moving toward release.', 'Hold the brake or break the exposed chain pin; neither requires standing under the gate.', { heavy: 4, guard: 1, strike: 2 }),
    ],
    antiCheese: { trigger: 'The party remains in one protected corner while machinery cycles without opposition.', response: 'The Engine closes that announced shutter but leaves another marked route open.', counterplay: 'Change lanes, seize the brake station, or interrupt the signaler before the next cycle.' },
    healthBonus: 25, armorBonus: 3,
  },
];

export const CHRONICLE1_BOSSES = deepFreeze(BOSS_SPECS.map(boss));

export const BOSS_PORTRAIT_IDS = deepFreeze(CHRONICLE1_BOSSES.map((entry) => entry.portraitId));
