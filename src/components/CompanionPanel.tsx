import { Check, Heartbeat, Shield, Sword, UsersThree } from '@phosphor-icons/react';
import type { CompanionJournalViewModel } from '../ui/types';

interface CompanionPanelProps { readonly companions: readonly CompanionJournalViewModel[]; readonly canSwitch: boolean; readonly onSetActive: (companionId: string | null) => void; }
export function CompanionPanel({ companions, canSwitch, onSetActive }: CompanionPanelProps) {
  const recruitedCompanions = companions.filter((companion) => companion.status === 'recruited');
  if (recruitedCompanions.length === 0) return <p className="empty-state">You are travelling alone.</p>;
  return (
    <div className="companion-list">
      {recruitedCompanions.map((companion) => (
        <article key={companion.id} className={companion.active ? 'is-active' : ''}>
          <header><div><span>{companion.statusLabel}</span><h2>{companion.name}</h2></div><strong>{companion.loyaltyLabel}</strong></header>
          <dl className="companion-abilities">
            <div><dt><Sword size={17} aria-hidden="true" />Battle command</dt><dd>{companion.commandLabel}{companion.commandCooldown !== null ? ` · ${companion.commandCooldown}-turn cooldown` : ''}</dd></div>
            {companion.passive && <div><dt><Shield size={17} aria-hidden="true" />Passive</dt><dd>{companion.passive.label}: {companion.passive.description}</dd></div>}
            {companion.explorationCapability && <div><dt><Heartbeat size={17} aria-hidden="true" />Exploration</dt><dd>{companion.explorationCapability.label}: {companion.explorationCapability.description}</dd></div>}
          </dl>
          {companion.personalQuests.length > 0 && <div className="quest-stages"><h3>Personal quest</h3><ol>{companion.personalQuests.map((quest) => <li key={quest.id} className={quest.completed ? 'is-complete' : ''}>{quest.completed && <Check size={15} aria-label="Completed" />}<div><strong>{quest.title}</strong><small>Stage {quest.stage} · {quest.completed ? 'Complete' : 'Open'}</small></div></li>)}</ol></div>}
          {companion.status === 'recruited' && <button className="button button-secondary" type="button" disabled={!canSwitch || companion.active || companion.injured} onClick={() => onSetActive(companion.id)}><UsersThree size={19} aria-hidden="true" />{companion.active ? 'Active Companion' : companion.injured ? 'Recovering at Camp' : 'Travel Together'}</button>}
        </article>
      ))}
      {canSwitch && recruitedCompanions.some((companion) => companion.active) && <button className="button button-secondary" type="button" onClick={() => onSetActive(null)}>Travel Alone</button>}
    </div>
  );
}
