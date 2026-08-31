import type { SaveSlot } from '../game/persistence/schema';
import type { SaveSlotSummary } from '../ui/types';

export interface SaveSlotCardProps {
  readonly summary: SaveSlotSummary;
  readonly onContinue: (slot: SaveSlot) => void;
  readonly onNew: (slot: SaveSlot) => void;
  readonly onRecover: (slot: SaveSlot) => void;
  readonly onReplace: (slot: SaveSlot) => void;
}

function savedAtLabel(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function classLabel(value: SaveSlotSummary['heroClass']): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Unknown class';
}

export function SaveSlotCard({ summary, onContinue, onNew, onRecover, onReplace }: SaveSlotCardProps) {
  const savedAt = savedAtLabel(summary.savedAt);
  const hasCampaign = Boolean(summary.heroName);
  const statusLabel = summary.status === 'empty'
    ? 'Empty'
    : summary.status === 'ready'
      ? 'Ready'
      : summary.status === 'legacy'
        ? 'Chronicle I reset ready'
        : hasCampaign
          ? 'Recovered'
          : 'Recovery needed';

  return (
    <article className="title-slot-card" aria-label={`Save slot ${summary.slot}`}>
      <div>
        <span className="eyebrow">Save slot {summary.slot}</span>
        <strong>{statusLabel}</strong>
      </div>

      {summary.status === 'empty' ? (
        <>
          <p>No campaign is stored here.</p>
          <button className="button button-primary" type="button" onClick={() => onNew(summary.slot)}>
            Begin slot {summary.slot}
          </button>
        </>
      ) : hasCampaign ? (
        <>
          <h2>{summary.heroName}</h2>
          <p>{classLabel(summary.heroClass)} · Level {summary.level ?? 1} · {summary.chapterLabel ?? 'Chapter 1'}</p>
          {savedAt && <p><small>Saved <time dateTime={summary.savedAt}>{savedAt}</time></small></p>}
          {summary.notice && <p role="status">{summary.notice}</p>}
          <div className="title-actions">
            {summary.status === 'ready' ? (
              <button className="button button-primary" type="button" onClick={() => onContinue(summary.slot)}>
                Continue slot {summary.slot}
              </button>
            ) : (
              <button className="button button-primary" type="button" onClick={() => onRecover(summary.slot)}>
                {summary.status === 'legacy' ? `Continue reset slot ${summary.slot}` : `Continue recovered slot ${summary.slot}`}
              </button>
            )}
            <button className="button button-secondary" type="button" onClick={() => onReplace(summary.slot)}>
              Replace slot {summary.slot}
            </button>
          </div>
        </>
      ) : (
        <>
          <p role="status">{summary.notice ?? 'This campaign cannot be opened safely.'}</p>
          <button className="button button-secondary" type="button" onClick={() => onReplace(summary.slot)}>
            Replace slot {summary.slot}
          </button>
        </>
      )}
    </article>
  );
}
