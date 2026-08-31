import { defineScene } from '../../builders';

export const CH01_COMBAT = Object.freeze([
  defineScene({
    id: 'ch01-combat-ditch-road-cutters', chapterId: 'ch01', region: 'gloamwood', slot: 10,
    type: 'combat', family: 'roadside-ambush', weight: 14, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch01-ditch-road-cutters', illustrationId: 'scene-ch01-combat-ditch-road-cutters', title: 'Blades in the Drainage Ditch',
    narrative: [
      'Three road cutters rise from the drainage ditch with hooked blades meant for wagon reins. A fourth waits behind the caravan with a short bow.',
      'The attackers want the horses alive and the guards separated. The stone culvert offers cover, but it leaves the rear wagon exposed.',
    ],
    eligibility: { routes: ['kings-road'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 2, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-hold-between-the-wagons', label: 'Hold between the wagons', detail: 'Protect both teams from the hooked blades, but begin the fight in full view of the archer.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-ditch-formation' }], outcome: 'You plant your feet between the wagon poles as the first cutter reaches for the reins.' },
      { id: 'ch01-choice-rush-the-culvert-archer', label: 'Rush the culvert archer', detail: 'Remove the ranged threat early, but leave the drivers to resist the cutters for one exchange.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-ditch-rush' }], outcome: 'You vault the ditch toward the bow while the drivers pull their horses tight against the wagons.' },
    ],
  }),
  defineScene({
    id: 'ch01-combat-tollhouse-lookouts', chapterId: 'ch01', region: 'gloamwood', slot: 16,
    type: 'combat', family: 'checkpoint-occupation', weight: 13, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch01-tollhouse-lookouts', illustrationId: 'scene-ch01-combat-tollhouse-lookouts', title: 'Lookouts Behind the Tollhouse',
    narrative: [
      'Two disguised soldiers step from the orchard as the convoy clears the tollhouse. Their cloaks lack badges, but both move with practiced shield spacing.',
      'A goblin skirmisher watches from the roof, trapped between the soldiers and your line of retreat. The empty yard gives no safe middle ground.',
    ],
    eligibility: { routes: ['kings-road', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-break-the-soldiers-shield-line', label: 'Break the soldiers\' shield line', detail: 'Attack the trained pair before they settle, while accepting fire from the rooftop skirmisher.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-tollhouse-break-line' }], outcome: 'You drive toward the shields before the soldiers can close the gap between them.' },
      { id: 'ch01-choice-call-the-goblin-down', label: 'Call the goblin down', detail: 'Offer the rooftop skirmisher a way out, but give the soldiers time to take firm positions.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-tollhouse-parley' }, { type: 'threat', amount: 1 }], outcome: 'The goblin hesitates at the roof edge while the two soldiers lock shields below.' },
    ],
  }),
  defineScene({
    id: 'ch01-combat-the-orchard-volley', chapterId: 'ch01', region: 'gloamwood', slot: 18,
    type: 'combat', family: 'archer-crossfire', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch01-orchard-volley', illustrationId: 'scene-ch01-combat-the-orchard-volley', title: 'The Orchard Volley',
    narrative: [
      'Archers move between low apple trees while two goblin knife fighters crawl beneath the wagon line. The royal-fletched arrows come from a disciplined shooter farther uphill.',
      'The wagon boards can shield the wounded, or the convoy can push into the orchard before the next coordinated volley.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-form-behind-the-wagon-boards', label: 'Form behind the wagon boards', detail: 'Gain cover from arrows, but let the knife fighters close beneath the wagons.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-orchard-cover' }], outcome: 'The guards turn the rear wagon into a shield wall as knives scrape along the axle.' },
      { id: 'ch01-choice-charge-the-uphill-shooter', label: 'Charge the uphill shooter', detail: 'Disrupt the disciplined archer quickly, but cross open ground under the supporting volley.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-orchard-charge' }], outcome: 'You run between the trees as the marked archer reaches for another black-and-white shaft.' },
    ],
  }),
  defineScene({
    id: 'ch01-combat-smoke-on-the-bridge', chapterId: 'ch01', region: 'gloamwood', slot: 25,
    type: 'combat', family: 'bridge-defense', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch01-smoke-on-the-bridge', illustrationId: 'scene-ch01-combat-smoke-on-the-bridge', title: 'Steel in the Bridge Smoke',
    narrative: [
      'Raiders advance through the bridge smoke behind wet hide shields. One carries a clay firepot toward the medicine wagon while another cuts at the villagers\' escape rope.',
      'The narrow span prevents a wide defense. Stopping either threat first gives the other several clear steps.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-stop-the-firepot-carrier', label: 'Stop the firepot carrier', detail: 'Protect the medicine from immediate fire, but leave the civilians\' escape rope under attack.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-bridge-medicine-covered' }], outcome: 'You meet the shield carrier beside the wagon as the clay pot rises over his shoulder.' },
      { id: 'ch01-choice-defend-the-escape-rope', label: 'Defend the escape rope', detail: 'Keep the trapped families connected to safety, while the firepot carrier approaches the wagon.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-bridge-rope-covered' }, { type: 'companion-loyalty', companionId: 'mara', amount: 2 }], outcome: 'You drive the rope cutter back, and Mara pulls another family through the smoke.' },
    ],
  }),
  defineScene({
    id: 'ch01-combat-reedbank-pursuers', chapterId: 'ch01', region: 'gloamwood', slot: 29,
    type: 'combat', family: 'mounted-pursuit', weight: 13, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch01-reedbank-pursuers', illustrationId: 'scene-ch01-combat-reedbank-pursuers', title: 'Pursuers at the Reedbank',
    narrative: [
      'Mounted pursuers catch the convoy where the river road narrows between reeds and a stone wall. Their leader orders the dispatch surrendered and does not mention the medicine.',
      'A broken field gate offers a route for the wagons. Holding the road keeps the enemy together but blocks your own escape.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest'], minLevel: 1, maxLevel: 2 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-open-the-field-gate', label: 'Open the field gate', detail: 'Give the wagons an escape route, but fight while the convoy turns across soft ground.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-reedbank-field-route' }], outcome: 'The gate breaks inward and the first wagon turns as the mounted leader lowers his spear.' },
      { id: 'ch01-choice-block-the-river-road', label: 'Block the river road', detail: 'Force the riders into a narrow fight, but leave the medicine wagons trapped behind you.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-reedbank-road-block' }], outcome: 'You stand beside the wall while the riders bunch together and lose room to circle.' },
    ],
  }),
  defineScene({
    id: 'ch01-combat-recover-the-false-banner', chapterId: 'ch01', region: 'gloamwood', slot: 36,
    type: 'combat', family: 'evidence-recovery', weight: 18, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch01-recover-the-false-banner', illustrationId: 'scene-ch01-combat-recover-the-false-banner', title: 'Hands on the False Banner',
    narrative: [
      'A raider team returns for the dry orc banner after seeing Mara examine the ditch. One veteran carries a hooked pole to seize the cloth without entering sword reach.',
      'The banner is evidence, but the wrapped royal arrow beneath Jory\'s bench matters more. The attackers split when they see both targets.',
    ],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 1, maxLevel: 2, requiredFlags: ['orc-banner-recovered'] }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch01-choice-guard-the-banner', label: 'Guard the banner', detail: 'Preserve the staged cloth as evidence, but let one attacker move toward Jory\'s wagon.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-banner-guarded' }], outcome: 'You pin the rolled banner beneath one boot as the hooked pole snaps against your guard.' },
      { id: 'ch01-choice-fall-back-to-jory', label: 'Fall back to Jory', detail: 'Protect the witness and royal arrow, but risk losing the banner during the fight.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch01-jory-guarded' }], outcome: 'You retreat to the wagon bench while Mara turns to intercept the veteran with the pole.' },
    ],
  }),
]);
