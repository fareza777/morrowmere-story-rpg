import { defineScene } from '../../builders';

export const CH06_COMBAT = Object.freeze([
  defineScene({
    id: 'ch06-combat-riders-on-the-evidence-road', chapterId: 'ch06', region: 'gloamwood', slot: 6,
    type: 'combat', family: 'evidence-interception', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch06-evidence-road-riders', illustrationId: 'scene-ch06-combat-riders-on-the-evidence-road', title: 'Riders on the Evidence Road',
    narrative: ['Black Banner cavalry catches the party below Greywatch with orders to seize Jory and the Embervault case alive. Two lancers drive witnesses toward a net team beside the road.', 'The net team threatens the evidence carriers. The lancers can scatter the witness group before defenders form a line.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-break-the-net-team', label: 'Break the net team', detail: 'Protect Jory and the evidence case, but let mounted lancers press the witness group.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-net-team-rushed' }], outcome: 'You close on the weighted nets as the lancers turn toward the unarmed smiths.' },
      { id: 'ch06-choice-form-around-the-witnesses', label: 'Form around the witnesses', detail: 'Keep the group from scattering, but give the net team a clear approach to the ledger.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-witness-line-formed' }], outcome: 'The party forms a moving shield line while Jory ties the case beneath his coat.' },
    ],
  }),
  defineScene({
    id: 'ch06-combat-the-outer-ditch-screen', chapterId: 'ch06', region: 'gloamwood', slot: 12,
    type: 'combat', family: 'siege-screen', weight: 18, pacing: 'danger', threatChange: 2,
    encounterId: 'enc-ch06-outer-ditch-screen', illustrationId: 'scene-ch06-combat-the-outer-ditch-screen', title: 'The Outer-Ditch Screen',
    narrative: ['Archers in mixed human and orc equipment hold Greywatch\'s north ditch while a commander burns captured patrol schedules behind them. The disguises are meant to confuse witnesses, not survive close inspection.', 'Reaching the papers preserves proof of the leak. Driving off the archers opens the gate approach for refugees and forge witnesses.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: false, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-rush-the-burning-schedules', label: 'Rush the burning schedules', detail: 'Preserve evidence of stolen patrol routes, but cross the ditch under the full archer line.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-schedules-rushed' }], outcome: 'You enter the ditch as the commander feeds another marked route into the fire.' },
      { id: 'ch06-choice-clear-the-refugee-approach', label: 'Clear the refugee approach', detail: 'Open the north gate route for civilians, but let the commander destroy more schedules.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-ditch-route-cleared' }], outcome: 'The archer line turns toward you while ward runners move witnesses behind the stone bank.' },
    ],
  }),
  defineScene({
    id: 'ch06-combat-jailers-under-the-chapel', chapterId: 'ch06', region: 'gloamwood', slot: 19,
    type: 'combat', family: 'hostage-jailers', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch06-chapel-hostage-jailers', illustrationId: 'scene-ch06-combat-jailers-under-the-chapel', title: 'Jailers Under the Chapel',
    narrative: ['The undercroft jailers defend the cell keys behind an iron screen. A controller holds a lever that can close smoke shutters around the hostages while two veterans block the stair.', 'The lever threatens the cells. The veterans can trap the rescue party below if they retake the upper landing.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-hostages-under-the-chapel'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-seize-the-smoke-shutter-lever', label: 'Seize the smoke-shutter lever', detail: 'Protect the hostages from smoke, but fight past the controller while veterans hold the stair.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-chapel-lever-seized' }], outcome: 'You move toward the lever as the first smoke shutter begins sliding across the cells.' },
      { id: 'ch06-choice-hold-the-upper-landing', label: 'Hold the upper landing', detail: 'Keep the rescue route open, but leave Hale and Caldus to stop the smoke shutters.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-chapel-landing-held' }], outcome: 'You turn on the veterans at the stair while the controller reaches for the final lever notch.' },
    ],
  }),
  defineScene({
    id: 'ch06-combat-the-covered-ram', chapterId: 'ch06', region: 'gloamwood', slot: 26,
    type: 'combat', family: 'siege-engine', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch06-covered-siege-ram', illustrationId: 'scene-ch06-combat-the-covered-ram', title: 'The Covered Ram',
    narrative: ['A roofed ram advances toward Greywatch\'s west gate behind shield crews and an engineer carrying fireproof wedges. A battle mage keeps water crews away with controlled bursts of heat.', 'Breaking the front axle stops the machine. Removing the mage lets defenders reach it with hooks and water.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-the-siege-begins'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-strike-the-rams-front-axle', label: 'Strike the ram\'s front axle', detail: 'Stop the engine directly, but fight beneath its shield roof beside the engineer.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-ram-axle-targeted' }], outcome: 'You duck beneath the roof as the engineer drives another wedge into the axle brace.' },
      { id: 'ch06-choice-drive-off-the-battle-mage', label: 'Drive off the battle mage', detail: 'Open the approach for Greywatch crews, but allow the ram another strike against the gate.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-ram-mage-rushed' }], outcome: 'The mage turns from the water crews as the ram gathers for another impact.' },
    ],
  }),
  defineScene({
    id: 'ch06-combat-the-west-wall-breach', chapterId: 'ch06', region: 'gloamwood', slot: 33,
    type: 'combat', family: 'breach-assault', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch06-west-wall-breach', illustrationId: 'scene-ch06-combat-the-west-wall-breach', title: 'The West-Wall Breach',
    narrative: ['Black Banner shock troops enter the broken west wall behind a plated champion and two sappers widening the gap. Civilians are still crossing the inner lane toward the east ward.', 'Holding the champion anchors the defense. Stopping the sappers keeps the breach narrow enough for Hale\'s reserve to seal.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-the-last-open-breach'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-meet-the-plated-champion', label: 'Meet the plated champion', detail: 'Keep the shock troops focused on you, but let the sappers widen the wall opening.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-breach-champion-held' }], outcome: 'The champion lowers a hooked shield while the shock line closes behind him.' },
      { id: 'ch06-choice-stop-the-breach-sappers', label: 'Stop the breach sappers', detail: 'Preserve a defensible gap, but leave the plated champion pressing Hale\'s reserve.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-breach-sappers-rushed' }], outcome: 'You move across fallen stone as the sappers raise their wedges against the remaining wall.' },
    ],
  }),
  defineScene({
    id: 'ch06-combat-the-last-rear-guard', chapterId: 'ch06', region: 'gloamwood', slot: 42,
    type: 'combat', family: 'siege-rear-guard', weight: 100, pacing: 'danger', threatChange: 3,
    encounterId: 'enc-ch06-last-rear-guard', illustrationId: 'scene-ch06-combat-the-last-rear-guard', title: 'The Last Rear Guard',
    narrative: ['Commander Ysra Venn leads the final Black Banner push toward Greywatch\'s evidence cases or survivor column, depending on the breach decision. Her troops carry orders to leave no receiving record intact.', 'Venn directs a shield wall while an assassin circles toward Jory. Breaking command may collapse the push; protecting Jory preserves the evidence chain through a longer fight.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-what-remains-of-greywatch'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-break-venns-command-line', label: 'Break Venn\'s command line', detail: 'End the organized push quickly, but leave the assassin a clearer route toward Jory.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-venn-command-rushed' }], outcome: 'You drive into the shield wall while Venn signals the assassin past its far edge.' },
      { id: 'ch06-choice-form-around-jory', label: 'Form around Jory', detail: 'Protect the witness and evidence, but let Venn keep the shield wall organized longer.', effects: [{ type: 'flag', operation: 'add', flagId: 'combat-ch06-jory-protected' }], outcome: 'The defenders close around Jory as Venn orders a measured advance through the smoke.' },
    ],
  }),
]);
