import type { AttackOutcome } from '../game/domain/combat';
import type { AttackForecastViewModel, EnemyCombatViewModel } from '../ui/types';

interface AttackForecastProps {
  readonly target: EnemyCombatViewModel;
  readonly forecast: AttackForecastViewModel;
}

const OUTCOME_ORDER: readonly AttackOutcome[] = ['miss', 'glancing', 'hit', 'critical', 'blocked', 'parried'];
const OUTCOME_LABELS: Readonly<Record<AttackOutcome, string>> = {
  miss: 'Miss',
  glancing: 'Glancing hit',
  hit: 'Hit',
  critical: 'Critical hit',
  blocked: 'Blocked',
  parried: 'Parried',
};

function percentage(chance: number): string {
  const rounded = Number(chance.toFixed(1));
  if (chance > 0 && rounded === 0) return '<0.1%';
  return `${rounded}%`;
}

function damageLabel(range: AttackForecastViewModel['damageRange']): string {
  return range.min === range.max ? `Damage: ${range.min}` : `Damage: ${range.min}–${range.max}`;
}

export function AttackForecast({ target, forecast }: AttackForecastProps) {
  return (
    <section className="attack-forecast" aria-label="Attack forecast" aria-live="polite" aria-atomic="true">
      <header>
        <h2>Attack forecast</h2>
        <p>Against <strong>{target.name}</strong></p>
      </header>
      <ul aria-label="Attack outcomes">
        {OUTCOME_ORDER.filter((outcome) => forecast.outcomeChances[outcome] > 0).map((outcome) => (
          <li key={outcome}><span>{OUTCOME_LABELS[outcome]}</span><strong>{percentage(forecast.outcomeChances[outcome])}</strong></li>
        ))}
      </ul>
      <p className="attack-forecast-damage">{damageLabel(forecast.damageRange)}</p>
    </section>
  );
}
