import { Crosshair, Crown, Heart, Shield } from '@phosphor-icons/react';
import type { EnemyCombatViewModel } from '../ui/types';

interface EnemyPartyProps {
  readonly enemies: readonly EnemyCombatViewModel[];
  readonly selectedTargetId: string;
  readonly onTarget: (enemyId: string) => void;
  readonly feedbackClass?: string | null;
}

export function EnemyParty({ enemies, selectedTargetId, onTarget, feedbackClass = null }: EnemyPartyProps) {
  return (
    <section className="enemy-party" aria-label="Enemy party">
      {enemies.map((enemy) => {
        const selected = enemy.id === selectedTargetId;
        const percent = Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100));
        return (
          <article key={enemy.id} className={`enemy-card${selected ? ' is-targeted' : ''}${selected && feedbackClass ? ` ${feedbackClass}` : ''}`}>
            <header><div><span>{enemy.roleLabel}{enemy.isBoss ? ' · Boss' : ''}</span><h2>{enemy.name}</h2></div>{enemy.isBoss && <Crown size={22} weight="duotone" aria-label={`Boss phase ${enemy.phase}`} />}</header>
            <div className="enemy-card-health" aria-label={`${enemy.health} of ${enemy.maxHealth} Health`}><span style={{ inlineSize: `${percent}%` }} /></div>
            <p className="enemy-health-copy"><Heart size={15} weight="fill" aria-hidden="true" />{enemy.health} / {enemy.maxHealth} HP</p>
            <div className="enemy-intent"><strong>{enemy.intent.label}</strong><p>{enemy.intent.description}</p></div>
            {enemy.statuses.length > 0 && <ul className="status-list" aria-label={`${enemy.name} status effects`}>{enemy.statuses.map((status) => <li key={status.id}><Shield size={15} aria-hidden="true" />{status.label} · {status.duration} turn{status.duration === 1 ? '' : 's'}</li>)}</ul>}
            <button type="button" aria-pressed={selected} aria-label={`Target ${enemy.name}`} onClick={() => onTarget(enemy.id)}><Crosshair size={20} weight={selected ? 'fill' : 'regular'} aria-hidden="true" />{selected ? 'Targeted' : 'Target'}</button>
          </article>
        );
      })}
    </section>
  );
}
