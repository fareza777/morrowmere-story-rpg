import { defineScene } from '../../builders';

export const CH05_COMBAT = Object.freeze([
  defineScene({
    id: 'ch05-combat-the-chained-gate', chapterId: 'ch05', region: 'embervault', slot: 6,
    type: 'combat', family: 'mine-gate-guard', weight: 16, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch05-chained-gate-veterans', illustrationId: 'scene-ch05-combat-the-chained-gate', title: 'Veterans at the Chained Gate',
    narrative: ['Black Banner veterans close the inner mine gate after the E-17 code is questioned. Shield carriers hold the rail bed while a crossbow officer reaches for the alarm chain.', 'Stopping the alarm protects surprise; breaking the shield line keeps the party from being trapped against the outer gate.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-rush-the-alarm-chain', label: 'Rush the alarm chain', detail: 'Prevent a mine-wide warning, but cross open rail under the officer\'s crossbow.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-gate-alarm-rushed' }], outcome: 'You run along the rail as the officer turns from the chain and raises his bow.' },
      { id: 'ch05-choice-break-the-shield-line', label: 'Break the shield line', detail: 'Open room for the party to fight, but let the alarm officer gain another clear step.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-gate-line-broken' }], outcome: 'The first shield meets your charge while the gate chain begins moving behind it.' },
    ],
  }),
  defineScene({
    id: 'ch05-combat-jailers-of-the-missing-shift', chapterId: 'ch05', region: 'embervault', slot: 12,
    type: 'combat', family: 'worker-jailers', weight: 18, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch05-missing-shift-jailers', illustrationId: 'scene-ch05-combat-jailers-of-the-missing-shift', title: 'Jailers of the Missing Shift',
    narrative: ['Mine jailers herd the unlisted shift behind the false wall with hooked staves and one trained ash hound. Their commander keeps a worker between himself and the gallery.', 'Drawing the hound away protects the workers from its charge. Closing on the commander may end the formation before more guards arrive.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-draw-the-ash-hound-away', label: 'Draw the ash hound away', detail: 'Protect the worker line, but begin separated from the jailer commander and his guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-hound-drawn-away' }], outcome: 'The hound follows your movement into the ore bay while Dessa pulls workers behind a cart.' },
      { id: 'ch05-choice-close-on-the-jailer-commander', label: 'Close on the jailer commander', detail: 'Break command quickly, but risk the ash hound charging through the workers.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-jailer-command-rushed' }], outcome: 'You drive toward the hooked staff as the hound strains against its handler.' },
    ],
  }),
  defineScene({
    id: 'ch05-combat-the-black-banner-forgemaster', chapterId: 'ch05', region: 'embervault', slot: 19,
    type: 'combat', family: 'forge-command', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch05-black-banner-forgemaster', illustrationId: 'scene-ch05-combat-the-black-banner-forgemaster', title: 'The Black Banner Forgemaster',
    narrative: ['Forgemaster Hadrik Vale seals the accounting wing in heavy plate and orders smiths back to their anvils. Two hammer guards vent sparks from the quenching channel to divide the floor.', 'Hadrik controls the door lever. The hammer guards control the hot center lane, and the ledger room remains behind all three.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-force-the-door-lever', label: 'Force the door lever', detail: 'Keep the accounting route open, but fight Hadrik in reach of both hammer guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-forge-door-contested' }], outcome: 'You cross the hot lane toward Hadrik as the guards raise their forging hammers.' },
      { id: 'ch05-choice-disable-the-quenching-channel', label: 'Disable the quenching channel', detail: 'Clear the center floor of steam and sparks, but let Hadrik begin sealing the ledger door.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-quenching-disabled' }], outcome: 'The channel gate jams under your strike while Hadrik reaches the accounting lever.' },
    ],
  }),
  defineScene({
    id: 'ch05-combat-cutters-in-the-ledger-vault', chapterId: 'ch05', region: 'embervault', slot: 26,
    type: 'combat', family: 'evidence-destruction', weight: 18, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch05-ledger-vault-cutters', illustrationId: 'scene-ch05-combat-cutters-in-the-ledger-vault', title: 'Cutters in the Ledger Vault',
    narrative: ['A demolition cutter reaches the ledger vault with acid jars and an armored escort. The cutter targets numbered authorization pages while a controller locks the exit grates one by one.', 'Breaking the acid jars protects paper at close range. Stopping the grate mechanism preserves an escape route but leaves the ledger under immediate attack.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 4, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-break-the-acid-jars', label: 'Break the acid jars', detail: 'Protect the ledger from destruction, but let the controller close another route from the vault.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-ledger-acid-stopped' }], outcome: 'You strike the first jar aside as the iron grate drops behind the escort.' },
      { id: 'ch05-choice-seize-the-grate-mechanism', label: 'Seize the grate mechanism', detail: 'Keep the escape route open, but give the cutter a clear approach to the authorization pages.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-ledger-exit-held' }], outcome: 'You brace the grate wheel while the cutter uncaps an acid jar beside the ledger stand.' },
    ],
  }),
  defineScene({
    id: 'ch05-combat-the-twin-armory-convoy', chapterId: 'ch05', region: 'embervault', slot: 33,
    type: 'combat', family: 'weapon-convoy', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch05-twin-armory-convoy', illustrationId: 'scene-ch05-combat-the-twin-armory-convoy', title: 'The Twin-Armory Convoy',
    narrative: ['Armored loaders push two weapon carts toward separate collapse doors, one marked for human troops and one disguised as orc supply. A banner captain guards the shared brake chain.', 'Stopping either cart preserves half the proof. Taking the brake chain may hold both, but it places the party between coordinated guards.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-seize-the-shared-brake-chain', label: 'Seize the shared brake chain', detail: 'Try to hold both weapon carts, but enter the center lane under attacks from both guard teams.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-both-carts-contested' }], outcome: 'You reach the brake chain as loaders on both rails turn their weapons inward.' },
      { id: 'ch05-choice-stop-the-faster-orc-marked-cart', label: 'Stop the orc-marked cart', detail: 'Preserve the disguised shipment first, but let the human-marked cart approach its collapse door.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-orc-cart-stopped-first' }], outcome: 'You block the faster rail while the second cart rattles toward the opposite door.' },
    ],
  }),
  defineScene({
    id: 'ch05-combat-the-demolition-crew', chapterId: 'ch05', region: 'embervault', slot: 42,
    type: 'combat', family: 'mine-demolition', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch05-cinder-shaft-demolition', illustrationId: 'scene-ch05-combat-the-demolition-crew', title: 'The Cinder-Shaft Demolition Crew',
    narrative: ['A Black Banner demolition crew reaches the cinder shaft with burning cord, blast shields, and an ash mage heating the support bolts. Witnesses are already climbing above them.', 'The fuse master can bring down the shaft quickly. The ash mage can weaken the ladder and strand everyone still below.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 8, maxLevel: 10 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch05-main-escape-through-the-cinder-shaft'], callbackPromises: [],
    choices: [
      { id: 'ch05-choice-rush-the-fuse-master', label: 'Rush the fuse master', detail: 'Protect the whole shaft from collapse, but let the ash mage continue heating the ladder bolts.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-fuse-master-rushed' }], outcome: 'You cross the cinder floor toward the firing cord as the blast shields close around it.' },
      { id: 'ch05-choice-break-the-ash-mages-focus', label: 'Break the ash mage\'s focus', detail: 'Keep the ladder intact for witnesses, but allow the fuse master another step toward the charge box.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch05-ash-mage-rushed' }], outcome: 'The glowing support bolts begin cooling as you force the ash mage away from the shaft wall.' },
    ],
  }),
]);
