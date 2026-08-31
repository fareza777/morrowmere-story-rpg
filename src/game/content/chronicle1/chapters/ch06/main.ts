import { defineScene } from '../../builders';

export const CH06_MAIN = Object.freeze([
  defineScene({
    id: 'ch06-main-smoke-over-greywatch', chapterId: 'ch06', region: 'gloamwood', slot: 1,
    type: 'main', family: 'return-to-greywatch', anchorOrder: 1, weight: 100, pacing: 'danger', threatChange: 2,
    illustrationId: 'scene-ch06-main-smoke-over-greywatch', title: 'Smoke Over Greywatch',
    narrative: ['From the northern ridge, Greywatch is visible beneath three columns of smoke. Voss\'s contingency order names Jory Fen, the receiving register, and the town\'s evidence vault as priority targets.', 'The Embervault ledger and forge witnesses must reach the town without being captured. The direct road is under cavalry watch; the broken north bridge offers a dangerous bypass.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-journey-the-broken-north-bridge'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-take-the-direct-greywatch-road', label: 'Take the direct Greywatch road', detail: 'Reach the walls quickly with the evidence, but pass through the cavalry screen in full view.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-returned-by-main-road' }, { type: 'threat', amount: 2 }], outcome: 'The party descends toward the north gate while riders turn from the fields to intercept.' },
      { id: 'ch06-choice-send-witnesses-to-the-broken-bridge', label: 'Send witnesses to the broken bridge', detail: 'Split the evidence party onto a concealed route, but reach Greywatch with fewer witnesses beside you.', effects: [{ type: 'flag', operation: 'add', flagId: 'forge-witnesses-used-north-bridge' }, { type: 'evidence', operation: 'add', evidenceId: 'forge-testimony' }, { type: 'tension', amount: 1 }], outcome: 'Dessa takes the smiths toward the broken bridge while Jory keeps the ledger on the direct road.' },
    ],
  }),
  defineScene({
    id: 'ch06-main-the-message-that-broke', chapterId: 'ch06', region: 'gloamwood', slot: 7,
    type: 'main', family: 'siege-order', anchorOrder: 2, weight: 100, pacing: 'danger',
    illustrationId: 'scene-ch06-main-the-message-that-broke', title: 'The Message That Broke',
    narrative: ['Mara\'s scout reaches the north ditch with the second half of the contingency order. It directs Black Banner officers to destroy Greywatch\'s records, kill named witnesses, and open the western road for a siege column.', 'The signature chain matches Embervault. Warning the town publicly may expose the witness list; giving the order only to Bren Hale preserves names but slows the evacuation.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-read-the-destruction-order-publicly', label: 'Read the destruction order publicly', detail: 'Prove the attack has specific targets and mobilize citizens, but expose which witnesses need protection.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'flag', operation: 'add', flagId: 'voss-greywatch-destruction-order' }, { type: 'tension', amount: 1 }], outcome: 'Ward leaders begin moving records and families as the named witnesses are escorted from the square.' },
      { id: 'ch06-choice-give-the-order-to-bren-hale', label: 'Give the order to Bren Hale', detail: 'Keep witness names inside trusted command, but risk slower cooperation from frightened wards.', effects: [{ type: 'evidence', operation: 'add', evidenceId: 'siege-orders' }, { type: 'flag', operation: 'add', flagId: 'siege-order-held-by-hale' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Hale copies the target list for three guards and burns the unneeded routing cover sheet.' },
    ],
  }),
  defineScene({
    id: 'ch06-main-the-leak-in-the-watch', chapterId: 'ch06', region: 'gloamwood', slot: 13,
    type: 'main', family: 'coerced-leak', anchorOrder: 3, weight: 100, pacing: 'quiet', tensionChange: 2,
    illustrationId: 'scene-ch06-main-the-leak-in-the-watch', title: 'The Leak in the Watch',
    narrative: ['Black Banner troops avoid three patrols that were changed after the first alarm. Someone inside Greywatch passed current routes, but the matching schedules do not identify whether the source acted willingly.', 'A coded note mentions hostages beneath a chapel. Caldus recognizes the charity cipher if he joined you; otherwise Bren Hale can trace which watch office received the threatened message.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true,
    followUps: ['ch06-companion-caldus-confession', 'ch06-faction-sergeant-hale-confession'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-secure-the-patrol-ledgers', label: 'Secure the patrol ledgers', detail: 'Protect the schedules before interviewing anyone, but give the coerced source time to hide evidence.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-patrol-ledgers-secured' }, { type: 'tension', amount: 1 }], outcome: 'Hale locks the ledgers under separate keys and orders that no suspect be named without proof.' },
      { id: 'ch06-choice-trace-the-coded-hostage-note', label: 'Trace the coded hostage note', detail: 'Follow the coercion lead immediately, but leave the remaining patrol records under ordinary guard.', effects: [{ type: 'flag', operation: 'add', flagId: 'hostage-note-traced' }, { type: 'threat', amount: 1 }], outcome: 'The cipher points toward an abandoned undercroft connected to the south chapel.' },
    ],
  }),
  defineScene({
    id: 'ch06-main-hostages-under-the-chapel', chapterId: 'ch06', region: 'gloamwood', slot: 20,
    type: 'main', family: 'greywatch-hostage-rescue', anchorOrder: 4, weight: 100, pacing: 'danger', threatChange: 2,
    illustrationId: 'scene-ch06-main-hostages-under-the-chapel', title: 'Hostages Under the Chapel',
    narrative: ['The chapel undercroft holds families of watch clerks, abbey workers, and two council messengers behind an iron screen. Their captors used names from Embervault\'s leverage list to force patrol information.', 'A drainage vault reaches the rear cells through old stone. The front stair is faster and guarded beside a bell that can summon the siege reserve.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-the-siege-begins'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-enter-through-the-drainage-vault', label: 'Enter through the drainage vault', detail: 'Approach the cells without the alarm, but lose time while the siege column reaches the outer wall.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-hostages-rescued-quietly' }, { type: 'flag', operation: 'add', flagId: 'hostage-network-proven' }, { type: 'threat', amount: -1 }], outcome: 'The party opens the rear cells before the guards understand that their hidden route has been found.' },
      { id: 'ch06-choice-assault-the-front-stair', label: 'Assault the front stair', detail: 'Reach the hostages before the siege closes in, but risk the alarm bell and fighting near the cells.', effects: [{ type: 'flag', operation: 'add', flagId: 'chapel-hostages-rescued-by-force' }, { type: 'flag', operation: 'add', flagId: 'hostage-network-proven' }, { type: 'vitals', health: -3 }, { type: 'threat', amount: 1 }], outcome: 'The front guard falls back from the stair as Hale cuts the bell rope above the cells.' },
    ],
  }),
  defineScene({
    id: 'ch06-main-the-siege-begins', chapterId: 'ch06', region: 'gloamwood', slot: 27,
    type: 'main', family: 'greywatch-siege', anchorOrder: 5, weight: 100, pacing: 'danger', threatChange: 3,
    illustrationId: 'scene-ch06-main-the-siege-begins', title: 'The Siege Begins',
    narrative: ['Voss\'s siege column reaches Greywatch with covered rams, disciplined archers, and officers carrying the destruction order. They attack the archive and infirmary routes before testing the strongest gate.', 'The receiving register is moving toward the east ward while Jory carries the Embervault ledger. Holding the wall buys time; escorting the records protects the proof if the defenses fail.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: [], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-hold-the-wall-with-hale', label: 'Hold the wall with Hale', detail: 'Slow the siege engines at the outer defense, but leave the evidence convoy under fewer guards.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-wall-reinforced' }, { type: 'faction', factionId: 'greywatch', amount: 2 }], outcome: 'Hale assigns you the central parapet while Nessa Cole starts the evidence wagons east.' },
      { id: 'ch06-choice-escort-jory-and-the-register', label: 'Escort Jory and the register', detail: 'Protect the case against Voss, but weaken the wall before the first ram reaches the gate.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-evidence-convoy-guarded' }, { type: 'evidence', operation: 'add', evidenceId: 'route-seven-dispatch' }, { type: 'tension', amount: 1 }], outcome: 'Jory and the receiving clerk move the records through back streets as the outer wall begins to shake.' },
    ],
  }),
  defineScene({
    id: 'ch06-main-the-last-open-breach', chapterId: 'ch06', region: 'gloamwood', slot: 34,
    type: 'main', family: 'siege-decision', anchorOrder: 6, weight: 100, pacing: 'danger', threatChange: 3,
    illustrationId: 'scene-ch06-main-the-last-open-breach', title: 'The Last Open Breach',
    narrative: ['The west wall breaks beside the old granary, opening a lane into Greywatch. Hale has one reserve, ward leaders have an inner barricade, and Talla\'s cellars can move civilians beyond the east ditch.', 'A counterattack may hold the town at heavy cost. An inner defense concedes two wards. A full evacuation saves the largest number of people and leaves Greywatch to the siege army.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch06-main-what-remains-of-greywatch'], callbackPromises: [],
    choices: [
      { id: 'ch06-choice-counterattack-through-the-breach', label: 'Counterattack through the breach', detail: 'Commit the reserve to hold Greywatch, risking severe casualties if allies and evacuation routes are weak.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-hold-route' }, { type: 'vitals', health: -5 }, { type: 'threat', amount: 2 }], outcome: 'Hale leads the reserve into the breach while ward defenders close behind your line.' },
      { id: 'ch06-choice-fall-back-to-the-inner-barricade', label: 'Fall back to the inner barricade', detail: 'Preserve defenders and the council, but surrender the west wards to fire and looting.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-damaged-route' }, { type: 'tension', amount: 1 }], outcome: 'The reserve withdraws in order as the inner barricade closes around the keep and archive.' },
      { id: 'ch06-choice-order-the-full-evacuation', label: 'Order the full evacuation', detail: 'Save civilians and evidence through the east routes, but abandon Greywatch to the attacking column.', effects: [{ type: 'flag', operation: 'add', flagId: 'greywatch-fall-route' }, { type: 'flag', operation: 'add', flagId: 'greywatch-evacuation-prioritized' }], outcome: 'Bells signal retreat while Talla\'s guides and town runners move families beyond the east ditch.' },
    ],
  }),
  defineScene({
    id: 'ch06-main-what-remains-of-greywatch', chapterId: 'ch06', region: 'gloamwood', slot: 43,
    type: 'main', family: 'greywatch-aftermath', anchorOrder: 7, weight: 100, pacing: 'quiet', tensionChange: -2,
    illustrationId: 'scene-ch06-main-what-remains-of-greywatch', title: 'What Remains of Greywatch',
    narrative: ['Dawn reveals the result of the breach decision, the evacuation routes, and every ally earned before the siege. The Embervault ledger, surviving witnesses, and siege order now prove why Voss needed Greywatch silenced.', 'Bren Hale and Jory assemble the surviving officers and ward leaders. Their next destination is Crownless Keep, where Voss can invoke emergency authority unless the border answers first.'],
    eligibility: { routes: ['kings-road', 'old-forest', 'ruined-pass'], minLevel: 10, maxLevel: 12 }, requirements: [], exclusions: [], cooldownRuns: 0, oneShot: true, followUps: ['ch07-main-council-before-the-march'], callbackPromises: [],
    choices: [
      {
        id: 'ch06-choice-secure-the-held-town', label: 'Secure the held town', detail: 'Use the surviving walls as a coalition base, while accepting the cost paid by the counterattack.',
        requirements: [{ type: 'flag', flagId: 'greywatch-hold-route' }],
        effects: [{ type: 'flag', operation: 'remove', flagId: 'greywatch-damaged' }, { type: 'flag', operation: 'remove', flagId: 'greywatch-fallen' }, { type: 'flag', operation: 'add', flagId: 'greywatch-held' }, { type: 'flag', operation: 'add', flagId: 'greywatch-council-survived' }, { type: 'flag', operation: 'add', flagId: 'greywatch-evidence-secured' }],
        outcome: 'Greywatch remains in allied hands, its council alive and its scarred walls open to coalition messengers.',
      },
      {
        id: 'ch06-choice-rebuild-the-damaged-wards', label: 'Rebuild the damaged wards', detail: 'Preserve a functioning council and shelter, but march with fewer supplies after two wards burn.',
        requirements: [{ type: 'flag', flagId: 'greywatch-damaged-route' }],
        effects: [{ type: 'flag', operation: 'remove', flagId: 'greywatch-held' }, { type: 'flag', operation: 'remove', flagId: 'greywatch-fallen' }, { type: 'flag', operation: 'add', flagId: 'greywatch-damaged' }, { type: 'flag', operation: 'add', flagId: 'greywatch-council-survived' }, { type: 'flag', operation: 'add', flagId: 'greywatch-evidence-secured' }],
        outcome: 'The keep and eastern wards survive while crews search the burned streets and prepare a smaller march.',
      },
      {
        id: 'ch06-choice-rally-the-survivor-column', label: 'Rally the survivor column', detail: 'Organize displaced people and preserved evidence, knowing Greywatch itself now belongs to the enemy.',
        requirements: [{ type: 'flag', flagId: 'greywatch-fall-route' }],
        effects: [{ type: 'flag', operation: 'remove', flagId: 'greywatch-held' }, { type: 'flag', operation: 'remove', flagId: 'greywatch-damaged' }, { type: 'flag', operation: 'add', flagId: 'greywatch-fallen' }, { type: 'flag', operation: 'add', flagId: 'greywatch-survivors-organized' }, { type: 'flag', operation: 'add', flagId: 'greywatch-evidence-secured' }],
        outcome: 'Greywatch is lost, but its survivors form an ordered column around Jory, Hale, and the rescued records.',
      },
    ],
  }),
]);
