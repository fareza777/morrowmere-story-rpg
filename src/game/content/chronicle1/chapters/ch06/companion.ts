import { defineScene } from '../../builders';

export const CH06_COMPANION = Object.freeze([
  defineScene({
    id: 'ch06-companion-maras-evacuation-map', chapterId: 'ch06', region: 'gloamwood', slot: 9,
    type: 'companion', family: 'mara-evacuation', relationship: { kind: 'companion', companionId: 'mara' }, weight: 28, pacing: 'danger',
    illustrationId: 'scene-ch06-companion-maras-evacuation-map', title: 'Mara\'s Evacuation Map',
    narrative: ['Mara\'s scouts have marked three civilian exits from Greywatch. The east ditch is clear but narrow; the farm lane is wider and watched by Black Banner cavalry.', 'Assigning scouts to civilians protects the evacuation and leaves fewer eyes on siege movements. Keeping them on reconnaissance improves the defense while families move with town guides.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['mara-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-assign-maras-scouts-to-civilians', label: 'Assign Mara\'s scouts to civilians', detail: 'Secure the east evacuation route, but lose early warning on the siege column\'s movements.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-evacuation-route-secured' }, { type: 'companion-loyalty', companionId: 'mara', amount: 6 }, { type: 'threat', amount: 1 }], outcome: 'Mara posts one scout at every turn and begins moving ward families toward the east ditch.' },
      { id: 'ch06-choice-keep-maras-scouts-on-the-column', label: 'Keep Mara\'s scouts on the column', detail: 'Improve siege intelligence, but leave civilian exits to less experienced town runners.', effects: [{ type: 'flag', operation: 'add', flagId: 'siege-column-scouted' }, { type: 'companion-loyalty', companionId: 'mara', amount: -2 }, { type: 'threat', amount: -1 }], outcome: 'The scouts return to the ridges while ward leaders organize the east route themselves.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-caldus-confession', chapterId: 'ch06', region: 'gloamwood', slot: 14,
    type: 'companion', family: 'caldus-coerced-leak', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch06-companion-caldus-confession', title: 'Caldus Confesses',
    narrative: ['Caldus recognizes the hostage cipher because the Black Banner sent it to him before Embervault. They named abbey novices beneath the chapel and demanded one revised patrol route as proof he understood.', 'He passed the route and then joined you, hoping to find the hostages before the message was used. His confession, the original cipher strip, and the attackers\' exact movements establish coercion rather than suspicion alone.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['caldus-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-hostages-under-the-chapel'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-put-caldus-confession-on-record', label: 'Put Caldus\'s confession on record', detail: 'Give Hale a complete proof chain, but expose Caldus to anger while the siege is underway.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-leak-confessed' }, { type: 'flag', operation: 'add', flagId: 'coerced-leak-proven' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 3 }], outcome: 'Caldus signs the route, cipher, and time before leading Hale toward the chapel undercroft.' },
      { id: 'ch06-choice-seal-the-confession-until-the-hostages-are-safe', label: 'Seal the confession until rescue', detail: 'Protect Caldus during the operation, but ask Hale to act before the full account becomes public.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-confession-sealed' }, { type: 'flag', operation: 'add', flagId: 'coerced-leak-proven' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 5 }], outcome: 'Hale seals the statement and accepts the cipher strip as enough proof to move on the undercroft.' },
    ],
  }),
  defineScene({
    id: 'ch06-faction-sergeant-hale-confession', chapterId: 'ch06', region: 'gloamwood', slot: 15,
    type: 'companion', family: 'hale-coerced-leak', relationship: { kind: 'faction', factionId: 'greywatch' }, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch06-faction-sergeant-hale-confession', title: 'Sergeant Hale Finds the Source',
    narrative: ['Without Caldus present, Bren Hale compares the changed patrols and finds watch clerk Edda Marr assigned to every copied route. He does not accuse her until he finds a hostage note naming her brother beneath the chapel.', 'Edda admits passing one schedule after receiving a lock of her brother\'s hair. Her statement and the attackers\' route prove coercion and point to the undercroft.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, excludedFlags: ['caldus-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-hostages-under-the-chapel'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-place-edda-under-protective-guard', label: 'Place Edda under protective guard', detail: 'Use defenders to protect a coerced witness, but weaken the watch during the chapel operation.', effects: [{ type: 'flag', operation: 'add', flagId: 'hale-leak-source-protected' }, { type: 'flag', operation: 'add', flagId: 'coerced-leak-proven' }, { type: 'faction', factionId: 'greywatch', amount: 1 }], outcome: 'Hale posts two trusted guards and records Edda\'s statement without treating coercion as treason.' },
      { id: 'ch06-choice-move-edda-with-the-rescue-party', label: 'Move Edda with the rescue party', detail: 'Keep the witness close to identify the undercroft route, but expose her near the captors who threatened her.', effects: [{ type: 'flag', operation: 'add', flagId: 'hale-leak-source-guided-rescue' }, { type: 'flag', operation: 'add', flagId: 'coerced-leak-proven' }, { type: 'threat', amount: 1 }], outcome: 'Edda leads Hale through the charity store and points to the stair hidden beneath empty medicine crates.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-lyra-authenticates-the-siege-order', chapterId: 'ch06', region: 'gloamwood', slot: 16,
    type: 'companion', family: 'lyra-siege-proof', relationship: { kind: 'companion', companionId: 'lyra' }, weight: 26, pacing: 'quiet',
    illustrationId: 'scene-ch06-companion-lyra-authenticates-the-siege-order', title: 'Lyra Authenticates the Siege Order',
    narrative: ['Lyra matches the contingency order to the Embervault authorization by press flaw, clerk stroke, and thread number. The order specifically names the receiving register and surviving convoy witness.', 'Marking the original makes the link immediate. Making independent tracings protects against loss if the archive burns.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['lyra-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-mark-the-original-siege-order', label: 'Mark the original siege order', detail: 'Create direct authentication on the evidence, but keep the proof concentrated in one document.', effects: [{ type: 'flag', operation: 'add', flagId: 'siege-order-authenticated' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'companion-loyalty', companionId: 'lyra', amount: 4 }], outcome: 'Lyra marks the press flaw beside its Embervault match and signs the margin with Jory.' },
      { id: 'ch06-choice-make-three-siege-order-tracings', label: 'Make three siege-order tracings', detail: 'Spread recovery copies among survivors, but spend time while the chapel lead remains open.', effects: [{ type: 'flag', operation: 'add', flagId: 'siege-order-tracings-distributed' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'tension', amount: 1 }], outcome: 'Lyra gives sealed tracings to Hale, Jory, and a ward leader before the rescue begins.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-caldus-beneath-the-chapel', chapterId: 'ch06', region: 'gloamwood', slot: 18,
    type: 'companion', family: 'caldus-hostage-network', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 28, pacing: 'danger',
    illustrationId: 'scene-ch06-companion-caldus-beneath-the-chapel', title: 'Caldus Beneath the Chapel',
    narrative: ['Caldus finds abbey ration marks leading from the chapel charity store into the old undercroft. The larger hostage group includes the novices named in his cipher and relatives moved from Embervault.', 'Opening the charity stair preserves a short route and reveals abbey negligence. Using the drainage vault avoids public scandal until the hostages are safe.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['caldus-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: ['ch06-main-hostages-under-the-chapel'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-open-the-charity-stair', label: 'Open the charity stair', detail: 'Use the shortest route and expose the abbey store\'s role, risking panic among sheltering families.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-charity-stair-exposed' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 4 }], outcome: 'Caldus opens the false shelf and leads Hale down a stair hidden behind ration crates.' },
      { id: 'ch06-choice-use-the-drainage-vault', label: 'Use the drainage vault', detail: 'Keep the chapel calm until rescue is complete, but spend precious time finding the rear cells.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-drainage-route-mapped' }, { type: 'tension', amount: 1 }], outcome: 'Caldus marks the undercroft from below and keeps the charity store open above.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-caldus-opens-the-chapel-doors', chapterId: 'ch06', region: 'gloamwood', slot: 23,
    type: 'companion', family: 'caldus-abbey-reconciliation', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 25, pacing: 'recovery',
    illustrationId: 'scene-ch06-companion-caldus-opens-the-chapel-doors', title: 'Caldus Opens the Chapel Doors',
    narrative: ['After the rescue, Caldus opens the chapel to hostages, refugees, and wounded guards together. An abbey prior admits that ignored ration discrepancies allowed the captors to use the undercroft.', 'Caldus can demand a public admission during the siege or bind the prior to an immediate relief plan before judgment.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['caldus-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-demand-the-priors-public-admission', label: 'Demand the prior\'s public admission', detail: 'Give victims an honest account now, but risk weakening abbey relief work during the siege.', effects: [{ type: 'flag', operation: 'add', flagId: 'abbey-undercroft-failure-admitted' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 4 }, { type: 'faction', factionId: 'abbey', amount: -1 }], outcome: 'The prior names the ignored warnings before the assembled wards and places the chapel stores under Caldus.' },
      { id: 'ch06-choice-bind-the-prior-to-relief-work', label: 'Bind the prior to relief work', detail: 'Preserve medical capacity for the siege, but delay public accountability until people are safe.', effects: [{ type: 'flag', operation: 'add', flagId: 'abbey-relief-compact' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 2 }, { type: 'faction', factionId: 'abbey', amount: 1 }], outcome: 'The prior signs over stores, keys, and healers before returning to the crowded ward.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-tallas-cellar-road', chapterId: 'ch06', region: 'gloamwood', slot: 25,
    type: 'companion', family: 'talla-evacuation', relationship: { kind: 'companion', companionId: 'talla' }, weight: 27, pacing: 'danger',
    illustrationId: 'scene-ch06-companion-tallas-cellar-road', title: 'Talla\'s Cellar Road',
    narrative: ['Talla links cooperage cellars to an old goblin drainage road beyond the east ditch. The route can move civilians unseen, but opening it to the whole town may expose the hidden refuge farther east.', 'She offers a guarded compromise: ward families use the first half, then exit through a collapsed orchard before the refuge branch.'],
    eligibility: { routes: ['old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['talla-recruited'], excludedFlags: ['talla-betrayed'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-use-tallas-guarded-compromise', label: 'Use Talla\'s guarded compromise', detail: 'Move fewer civilians per hour while preserving the refuge branch from human patrol maps.', effects: [{ type: 'flag', operation: 'add', flagId: 'talla-evacuation-route-secured' }, { type: 'companion-loyalty', companionId: 'talla', amount: 6 }], outcome: 'Talla posts goblin guides at the orchard exit and seals the refuge branch behind them.' },
      { id: 'ch06-choice-open-the-full-drainage-road', label: 'Open the full drainage road', detail: 'Evacuate the wards faster, but reveal a protected goblin route to hundreds of desperate people.', effects: [{ type: 'flag', operation: 'add', flagId: 'full-drainage-road-exposed' }, { type: 'companion-loyalty', companionId: 'talla', amount: -6 }, { type: 'tension', amount: -1 }], outcome: 'The cellar doors open wide, and the refugee route becomes public before the first siege ram lands.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-rukhar-holds-the-west-road', chapterId: 'ch06', region: 'gloamwood', slot: 31,
    type: 'companion', family: 'rukhar-siege-support', relationship: { kind: 'companion', companionId: 'rukhar' }, weight: 28, pacing: 'danger',
    illustrationId: 'scene-ch06-companion-rukhar-holds-the-west-road', title: 'Rukhar Holds the West Road',
    narrative: ['Rukhar arrives with a small Free Host peace guard, not an army. Their presence disproves Voss\'s claim of an orc assault, but frightened defenders may fire before recognizing them.', 'Sending Rukhar to the west road blocks siege reinforcements. Keeping him inside lets him testify to the council and calm the gate.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['rukhar-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-send-rukhar-to-the-west-road', label: 'Send Rukhar to the west road', detail: 'Block Black Banner reinforcements with a small force, but leave the town without his public testimony.', effects: [{ type: 'flag', operation: 'add', flagId: 'free-host-held-west-road' }, { type: 'companion-loyalty', companionId: 'rukhar', amount: 5 }, { type: 'threat', amount: -1 }], outcome: 'Rukhar raises a white road pennant and leads the peace guard toward the siege column\'s flank.' },
      { id: 'ch06-choice-bring-rukhar-before-the-wards', label: 'Bring Rukhar before the wards', detail: 'Use his testimony to prevent panic inside Greywatch, but leave the western approach uncontested.', effects: [{ type: 'flag', operation: 'add', flagId: 'rukhar-testified-at-greywatch' }, { type: 'faction', factionId: 'free-host', amount: 2 }, { type: 'threat', amount: 1 }], outcome: 'Rukhar enters without drawn steel and names the false weapons before the gathered ward leaders.' },
    ],
  }),
  defineScene({
    id: 'ch06-companion-caldus-after-the-siege-bell', chapterId: 'ch06', region: 'gloamwood', slot: 36,
    type: 'companion', family: 'caldus-siege-duty', relationship: { kind: 'companion', companionId: 'caldus' }, weight: 24, pacing: 'recovery',
    illustrationId: 'scene-ch06-companion-caldus-after-the-siege-bell', title: 'Caldus After the Siege Bell',
    narrative: ['Caldus moves between the chapel ward and the breach with the hostage list folded beside his bandages. He can remain with the wounded or carry the confession and siege order to the survivor assembly.', 'The wounded need a trusted healer now. The evidence needs a witness who can explain how coercion opened Greywatch.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12, requiredFlags: ['caldus-recruited'] }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-keep-caldus-with-the-wounded', label: 'Keep Caldus with the wounded', detail: 'Preserve the strongest healer at the chapel, but send the coercion proof onward without its main witness.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-kept-siege-ward' }, { type: 'vitals', health: 5 }, { type: 'companion-loyalty', companionId: 'caldus', amount: 3 }], outcome: 'Caldus returns to the ward while Hale carries his sealed confession toward the assembly.' },
      { id: 'ch06-choice-send-caldus-with-the-evidence', label: 'Send Caldus with the evidence', detail: 'Protect the proof with its witness, but leave exhausted chapel healers to manage the night alone.', effects: [{ type: 'flag', operation: 'add', flagId: 'caldus-carried-coercion-proof' }, { type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'companion-loyalty', companionId: 'caldus', amount: 1 }], outcome: 'Caldus takes the confession, hostage list, and siege order through the inner barricade.' },
    ],
  }),
  defineScene({
    id: 'ch06-faction-the-ward-leaders-record', chapterId: 'ch06', region: 'gloamwood', slot: 39,
    type: 'companion', family: 'greywatch-consequence', relationship: { kind: 'faction', factionId: 'greywatch' }, weight: 24, pacing: 'quiet',
    illustrationId: 'scene-ch06-faction-the-ward-leaders-record', title: 'The Ward Leaders\' Record',
    narrative: ['Surviving ward leaders compile a record of the siege: which routes failed, who opened the chapel cells, and how the destruction order targeted evidence rather than territory.', 'A full public copy strengthens future testimony and reveals defensive losses. A sealed military copy protects survivors and depends more heavily on Hale.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 3, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-publish-the-ward-leaders-record', label: 'Publish the ward leaders\' record', detail: 'Create broad civilian testimony, but reveal damaged routes before the siege army has fully withdrawn.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-ward-record-public' }, { type: 'faction', factionId: 'border-council', amount: 2 }], outcome: 'Copies leave with refugees, scouts, and traders so no single archive can erase the account.' },
      { id: 'ch06-choice-seal-the-record-with-hale', label: 'Seal the record with Hale', detail: 'Protect tactical details and named survivors, but concentrate the testimony under one officer\'s custody.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-ward-record-sealed' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Hale seals the record beside the siege order and assigns two independent couriers.' },
    ],
  }),
]);
