import { Crosshair, Crown, Heart, Shield } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import type { EnemyCombatViewModel } from '../ui/types';

interface EnemyPartyProps {
  readonly enemies: readonly EnemyCombatViewModel[];
  readonly selectedTargetId: string;
  readonly onTarget: (enemyId: string) => void;
  readonly feedbackClass?: string | null;
}

function speciesFallbackSource(enemy: EnemyCombatViewModel): string {
  const identity = `${enemy.illustrationId} ${enemy.artFamily} ${enemy.name} ${enemy.description}`.toLowerCase();
  const family = ['goblin', 'orc', 'undead', 'beast', 'troll', 'demon', 'construct', 'cultist', 'mage']
    .find((candidate) => identity.includes(candidate)) ?? 'warrior';
  return `/assets/enemies/${family}.webp`;
}

function enemyPortraitSources(enemy: EnemyCombatViewModel): readonly string[] {
  const chronicleFolder = enemy.illustrationId.startsWith('enemy-portrait-boss-') ? 'bosses' : 'enemies';
  const sources = enemy.illustrationKind === 'chronicle-portrait'
    ? [
        `/assets/chronicle1/${chronicleFolder}/${enemy.illustrationId}.webp`,
        `/assets/enemies/${enemy.artFamily}.webp`,
        speciesFallbackSource(enemy),
      ]
    : [
        `/assets/enemies/${enemy.illustrationId}.webp`,
        speciesFallbackSource(enemy),
      ];
  return [...new Set(sources)];
}

function EnemyPortrait({ enemy }: { readonly enemy: EnemyCombatViewModel }) {
  const [attempt, setAttempt] = useState(0);
  const sources = enemyPortraitSources(enemy);
  const hidden = attempt >= sources.length;
  useEffect(() => setAttempt(0), [enemy.artFamily, enemy.illustrationId, enemy.illustrationKind]);
  return (
    <div className="enemy-portrait" aria-hidden={hidden || undefined}>
      <img
        src={sources[Math.min(attempt, sources.length - 1)]}
        alt={`${enemy.name}, ${enemy.roleLabel}`}
        hidden={hidden}
        onError={() => setAttempt((current) => current + 1)}
      />
    </div>
  );
}

export function EnemyParty({ enemies, selectedTargetId, onTarget, feedbackClass = null }: EnemyPartyProps) {
  return (
    <section className="enemy-party" aria-label="Enemy party">
      {enemies.map((enemy) => {
        const selected = enemy.id === selectedTargetId;
        const percent = Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100));
        return (
          <article key={enemy.id} className={`enemy-card${selected ? ' is-targeted' : ''}${selected && feedbackClass ? ` ${feedbackClass}` : ''}`}>
            <div className="enemy-card-top"><EnemyPortrait enemy={enemy} /><header><div><span>{enemy.roleLabel}{enemy.isBoss ? ' · Boss' : ''}</span><h2>{enemy.name}</h2></div>{enemy.isBoss && <Crown size={22} weight="duotone" aria-label={`Boss phase ${enemy.phase}`} />}</header></div>
            <div className="enemy-card-health" role="progressbar" aria-label={`${enemy.name} health`} aria-valuemin={0} aria-valuemax={enemy.maxHealth} aria-valuenow={enemy.health}><span style={{ inlineSize: `${percent}%` }} /></div>
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
