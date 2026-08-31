import { useCallback, useEffect, useState } from 'react';
import type { SaveSlot } from '../game/persistence/schema';
import type { SaveSlotSummary } from '../ui/types';
import { ConfirmDialog } from './ConfirmDialog';
import { SaveSlotCard } from './SaveSlotCard';

interface TitleScreenProps {
  readonly slots: readonly SaveSlotSummary[];
  readonly onNew: (slot: SaveSlot) => void;
  readonly onContinue: (slot: SaveSlot) => void;
  readonly onRecover: (slot: SaveSlot) => void;
  readonly onOverlayChange?: (open: boolean) => void;
}

export function TitleScreen({ slots, onNew, onContinue, onRecover, onOverlayChange }: TitleScreenProps) {
  const [replaceSlot, setReplaceSlot] = useState<SaveSlot | null>(null);
  const cancelReplace = useCallback(() => setReplaceSlot(null), []);
  const confirmReplace = useCallback(() => {
    if (replaceSlot === null) return;
    const slot = replaceSlot;
    setReplaceSlot(null);
    onNew(slot);
  }, [onNew, replaceSlot]);

  useEffect(() => {
    onOverlayChange?.(replaceSlot !== null);
  }, [onOverlayChange, replaceSlot]);

  useEffect(() => () => onOverlayChange?.(false), [onOverlayChange]);

  return (
    <main className="title-screen">
      <div className="title-art" aria-hidden="true" />
      <section className="title-copy" aria-labelledby="game-title">
        <p className="eyebrow">A sword &amp; sorcery adventure</p>
        <h1 id="game-title" className="title-wordmark">MORROWMERE</h1>
        <p><strong>Chronicle I — The Black Banner</strong></p>
        <p className="title-intro">Escort medicine to Greywatch, survive the border road, and uncover who is preparing a war.</p>
        <div className="inventory-list title-slot-list" aria-label="Campaign save slots">
          {slots.map((summary) => (
            <SaveSlotCard
              key={summary.slot}
              summary={summary}
              onContinue={onContinue}
              onNew={onNew}
              onRecover={onRecover}
              onReplace={setReplaceSlot}
            />
          ))}
        </div>
      </section>
      {replaceSlot !== null && (
        <ConfirmDialog
          title={`Replace save slot ${replaceSlot}?`}
          description="The existing campaign will remain safe until you finish setup and begin the replacement Chronicle."
          cancelLabel="Keep existing save"
          confirmLabel="Replace and begin"
          onCancel={cancelReplace}
          onConfirm={confirmReplace}
        />
      )}
    </main>
  );
}
