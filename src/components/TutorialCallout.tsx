import { Lightbulb } from '@phosphor-icons/react';

export type TutorialKind = 'choice' | 'combat' | 'loot' | 'consumable' | 'equipment';
const TUTORIALS: Record<TutorialKind, { readonly title: string; readonly copy: string }> = {
  choice: { title: 'Choices have consequences', copy: 'Read both the immediate risk and the earlier decisions a choice may require. There is rarely one perfect answer.' },
  combat: { title: 'Read enemy intent', copy: 'Select a target, then choose an action. Intent and status text explain danger without relying on color.' },
  loot: { title: 'Choose one reward', copy: 'Gold and experience are already safe. If items are offered, choose one before continuing.' },
  consumable: { title: 'Consumables are practical', copy: 'Use healing items on the road or in battle. Using one during battle spends the turn.' },
  equipment: { title: 'Build a loadout', copy: 'Weapons, armor, and charms change derived stats. Equipment cannot be changed during battle.' },
};

interface TutorialCalloutProps { readonly kind: TutorialKind; readonly onDismiss: () => void; readonly onSkipAll: () => void; }
export function TutorialCallout({ kind, onDismiss, onSkipAll }: TutorialCalloutProps) {
  const tutorial = TUTORIALS[kind];
  return <aside className="tutorial-callout" aria-label={`${tutorial.title} tutorial`}><Lightbulb size={23} weight="duotone" aria-hidden="true" /><div><strong>{tutorial.title}</strong><p>{tutorial.copy}</p></div><div className="tutorial-actions"><button type="button" onClick={onDismiss}>Got it</button><button type="button" onClick={onSkipAll}>Skip tutorials</button></div></aside>;
}
