import { defineScene } from '../../builders';

export const CH07_MAIN = Object.freeze([
  defineScene({
    id: 'ch07-main-council-before-the-march', chapterId: 'ch07', region: 'crownless-keep', slot: 1,
    type: 'main', family: 'march-council', anchorOrder: 1, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch07-main-council-before-the-march', title: 'Council Before the March',
    narrative: [
      'Whether Greywatch meets in a damaged council chamber or a survivor tent outside its walls, Bren Hale and Jory Fen reach the same conclusion: Crownless Keep is Voss\'s command center.',
      'The siege orders show that he intends to invoke the old Emergency Compact there. Your immediate goal is to reach the keep with witnesses and evidence before compelled governors ratify him as Protector.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-banners-on-the-kingroad'], callbackPromises: [], choices: [
      { id: 'ch07-choice-carry-the-witnessed-archive', label: 'Carry the witnessed archive', detail: 'Move the original siege orders and Embervault records together, gaining authority but creating one obvious target.', effects: [{ type: 'flag', operation: 'add', flagId: 'full-archive-on-the-march' }, { type: 'evidence', operation: 'add', evidenceId: 'coalition-affidavits' }, { type: 'threat', amount: 2 }], outcome: 'Hale seals the archive wagon while Jory assigns a named witness to every locked case.' },
      { id: 'ch07-choice-divide-the-evidence-copies', label: 'Divide the evidence copies', detail: 'Send witnessed copies with separate riders, reducing one loss while weakening any single presentation.', effects: [{ type: 'flag', operation: 'add', flagId: 'march-evidence-divided' }, { type: 'flag', operation: 'add', flagId: 'coalition-call-issued' }, { type: 'threat', amount: 1 }], outcome: 'Three riders leave by different roads carrying matching inventories and instructions to meet below the keep.' },
    ],
  }),
  defineScene({
    id: 'ch07-main-banners-on-the-kingroad', chapterId: 'ch07', region: 'crownless-keep', slot: 7,
    type: 'main', family: 'earned-muster', anchorOrder: 2, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch07-main-banners-on-the-kingroad', title: 'Banners on the Kingroad',
    narrative: [
      'Only people helped during the campaign answer the march call. Town wardens, surviving Greywatch files, Free Host observers, and scattered delegates arrive according to the promises you actually earned.',
      'A written coalition can share command and evidence custody. Without enough trust, the march must continue as independent bands or a lean survivor column with fewer political claims.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-the-outer-patrol'], callbackPromises: [], choices: [
      { id: 'ch07-choice-sign-the-road-coalition', label: 'Sign the road coalition', detail: 'Bind earned allies to shared command and civilian evidence custody, surrendering each faction\'s freedom to act alone.', requirements: [{ type: 'flag', flagId: 'border-peace', present: true }, { type: 'flag', flagId: 'voss-exposed', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'coalition-formed' }, { type: 'flag', operation: 'add', flagId: 'shared-march-command' }, { type: 'tension', amount: -2 }], outcome: 'Every attending commander signs the same march rules, including limits on reprisals and control of captured records.' },
      { id: 'ch07-choice-lead-the-survivor-column', label: 'Lead the survivor column', detail: 'March quickly with organized Greywatch survivors while accepting a narrow claim to represent the wider border.', requirements: [{ type: 'flag', flagId: 'greywatch-survivors-organized', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'survivor-column-march' }, { type: 'faction', factionId: 'greywatch', amount: 3 }, { type: 'threat', amount: 1 }], outcome: 'Hale forms the survivor column around the evidence carts and leaves space for allies who may join later.' },
      { id: 'ch07-choice-keep-the-commands-independent', label: 'Keep the commands independent', detail: 'Let each available force retain its own officers, avoiding a disputed compact but weakening coordination.', effects: [{ type: 'flag', operation: 'add', flagId: 'fragile-march' }, { type: 'tension', amount: 2 }], outcome: 'The banners move on the same road with separate watches, separate rations, and no agreed commander.' },
    ],
  }),
  defineScene({
    id: 'ch07-main-the-outer-patrol', chapterId: 'ch07', region: 'crownless-keep', slot: 13,
    type: 'main', family: 'keep-outer-patrol', anchorOrder: 3, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch07-main-the-outer-patrol', title: 'The Outer Patrol',
    narrative: [
      'Below Crownless Keep, a disciplined patrol escorts sealed invitations and a list of governors expected in the coronation hall. Several names are marked compelled, while others depend on Voss\'s grain contracts.',
      'The patrol signal clerk can identify the gate challenge. Shadowing the escort may reveal the guest entrance but risks losing the invitations before the march catches up.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-wall-or-hidden-way'], callbackPromises: [], choices: [
      { id: 'ch07-choice-capture-the-signal-clerk', label: 'Capture the signal clerk', detail: 'Secure the gate challenge and guest list while alerting the keep that its outer patrol is missing.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'coronation-guest-list' }, { type: 'flag', operation: 'add', flagId: 'keep-challenge-learned' }, { type: 'threat', amount: 2 }], outcome: 'The clerk surrenders the bronze challenge plate and identifies which governors arrived under guard.' },
      { id: 'ch07-choice-shadow-the-patrol-home', label: 'Shadow the patrol home', detail: 'Learn the guarded route into the keep while leaving the guest list and clerk in enemy hands.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-guest-route-shadowed' }, { type: 'threat', amount: -1 }], outcome: 'Two forward scouts follow the patrol to a service gate hidden behind the old royal granary.' },
    ],
  }),
  defineScene({
    id: 'ch07-main-wall-or-hidden-way', chapterId: 'ch07', region: 'crownless-keep', slot: 20,
    type: 'main', family: 'keep-approach-choice', anchorOrder: 4, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch07-main-wall-or-hidden-way', title: 'Wall or Hidden Way',
    narrative: [
      'Crownless Keep occupies a high administrative ridge with one fortified gate, an old tax stair, a sealed drainage postern, and a dry aqueduct beneath the eastern wall.',
      'Your earned allies and discoveries determine which routes are credible. Every path reaches the keep, but each places different people and evidence at risk.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-the-crownless-gate'], callbackPromises: [], choices: [
      { id: 'ch07-choice-march-on-the-western-gate', label: 'March on the western gate', detail: 'Use a signed coalition to demand lawful entry in public, accepting the strongest prepared defenses.', requirements: [{ type: 'flag', flagId: 'coalition-formed', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'keep-coalition-assault' }, { type: 'threat', amount: 2 }], outcome: 'The coalition forms beneath every visible banner and advances with the evidence wagon at its center.' },
      { id: 'ch07-choice-use-tallas-drainage-postern', label: 'Use Talla\'s drainage postern', detail: 'Take a small party through a mapped service opening while leaving the main force outside without you.', requirements: [{ type: 'flag', flagId: 'keep-postern-mapped', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'keep-postern-infiltration' }, { type: 'threat', amount: 1 }], outcome: 'Talla leads the evidence copies into a stone drain that rises behind the keep kitchens.' },
      { id: 'ch07-choice-enter-by-the-dry-aqueduct', label: 'Enter by the dry aqueduct', detail: 'Use Free Host knowledge of the eastern foundations while risking a narrow fight underground.', requirements: [{ type: 'flag', flagId: 'free-host-recognized-at-keep', present: true }], effects: [{ type: 'flag', operation: 'add', flagId: 'keep-aqueduct-approach' }, { type: 'faction', factionId: 'free-host', amount: 2 }], outcome: 'Rukhar\'s scouts open the old inspection grate and mark every turn toward the eastern ward.' },
      { id: 'ch07-choice-climb-the-abandoned-tax-stair', label: 'Climb the abandoned tax stair', detail: 'Take the unguarded public-record route with any force, but expose the party on a long broken ascent.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-tax-stair-approach' }, { type: 'vitals', health: -3 }, { type: 'threat', amount: 2 }], outcome: 'The party climbs past weathered tariff stones while defenders begin moving along the wall above.' },
    ],
  }),
  defineScene({
    id: 'ch07-main-the-crownless-gate', chapterId: 'ch07', region: 'crownless-keep', slot: 27,
    type: 'main', family: 'crownless-gate-entry', anchorOrder: 5, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch07-main-the-crownless-gate', title: 'The Crownless Gate',
    narrative: [
      'Every approach converges at the inner Crownless Gate, where Voss\'s veterans hold a counterweighted portcullis above the old customs court. The guest procession is already entering the upper keep.',
      'Holding the gate open allows witnesses and allies to follow but invites a counterattack. Dropping it behind the vanguard protects a small force and leaves the wider march outside.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-voss-last-champion'], callbackPromises: [], choices: [
      { id: 'ch07-choice-hold-the-gate-for-witnesses', label: 'Hold the gate for witnesses', detail: 'Defend the customs court until evidence bearers and available delegates cross the portcullis.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-witnesses-entered' }, { type: 'flag', operation: 'add', flagId: 'keep-gate-held-open' }, { type: 'threat', amount: 2 }], outcome: 'Jory and the attending delegates cross under guard while defenders gather in the lower ward.' },
      { id: 'ch07-choice-drop-the-gate-behind-vanguard', label: 'Drop the gate behind the vanguard', detail: 'Protect the first party from pursuit while separating it from most allies and heavy evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-vanguard-isolated' }, { type: 'threat', amount: -1 }, { type: 'tension', amount: 2 }], outcome: 'The portcullis crashes down between your party and the march, leaving only copied records inside.' },
    ],
  }),
  defineScene({
    id: 'ch07-main-voss-last-champion', chapterId: 'ch07', region: 'crownless-keep', slot: 34,
    type: 'main', family: 'last-champion', anchorOrder: 6, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch07-main-voss-last-champion', title: 'Voss\'s Last Champion',
    narrative: [
      'Captain Elian Roake blocks the upper stair with the keep guard. The Redwater truce prevented one battle, but Greywatch\'s siege convinced him that negotiated restraint cannot hold the realm together without one military command.',
      'Roake has not seen the Greywatch destruction order bearing Voss\'s authorization. Showing it may divide his guard and force him to face who caused the siege; challenging him directly keeps the evidence out of sword reach.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch07-main-inside-the-keep'], callbackPromises: [], choices: [
      { id: 'ch07-choice-show-roake-the-destruction-order', label: 'Show Roake the destruction order', detail: 'Risk the original document within reach of hostile guards to give the captain one chance to stand down.', effects: [{ type: 'flag', operation: 'add', flagId: 'roake-shown-voss-order' }, { type: 'flag', operation: 'add', flagId: 'last-champion-surrendered' }, { type: 'tension', amount: -1 }], outcome: 'Roake recognizes Voss\'s authorization, orders half his guard aside, and submits to the attending delegates.' },
      { id: 'ch07-choice-break-the-upper-stair-line', label: 'Break the upper-stair line', detail: 'Keep the evidence protected and defeat Roake before the coronation guests are sealed in the hall.', effects: [{ type: 'flag', operation: 'add', flagId: 'last-champion-defeated' }, { type: 'combat', encounterId: 'enc-ch07-voss-last-champion' }, { type: 'threat', amount: 1 }], outcome: 'Roake lowers his visor and anchors the stair while the hall bells begin calling governors to session.' },
    ],
  }),
  defineScene({
    id: 'ch07-main-inside-the-keep', chapterId: 'ch07', region: 'crownless-keep', slot: 40,
    type: 'main', family: 'keep-interior', anchorOrder: 7, weight: 100, pacing: 'quiet',
    illustrationId: 'scene-ch07-main-inside-the-keep', title: 'Inside the Keep',
    narrative: [
      'Beyond the upper stair, Crownless Keep is an administrative fortress rather than a royal palace. Compelled governors wait in record rooms while lawful seals are checked against Voss\'s prepared Emergency Compact.',
      'The coronation hall contains a command platform linked to the seal press, alarm bell, and portcullis counterweights. You must preserve witnesses and reach the public hearing before Voss closes the doors.',
    ],
    eligibility: { minLevel: 12, maxLevel: 14 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch08-main-guests-for-a-false-king'], callbackPromises: [], choices: [
      { id: 'ch07-choice-secure-the-witness-gallery', label: 'Secure the witness gallery', detail: 'Protect compelled delegates and testimony while Voss\'s clerks continue preparing seals below.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-witness-gallery-secured' }, { type: 'faction', factionId: 'border-council', amount: 3 }], outcome: 'Town wardens and available allies open the gallery doors and place every delegate under named protection.' },
      { id: 'ch07-choice-seize-the-archive-stair', label: 'Seize the archive stair', detail: 'Protect compact records and seal registers while leaving the guest rooms under keep guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'keep-archive-stair-seized' }, { type: 'evidence', operation: 'add', evidenceId: 'emergency-compact-register' }, { type: 'threat', amount: 1 }], outcome: 'The archive clerks surrender their keys before they can replace the lawful register with Voss\'s copy.' },
    ],
  }),
]);
