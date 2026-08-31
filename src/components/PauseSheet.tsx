import { ArrowCounterClockwise, FloppyDisk, Play } from '@phosphor-icons/react';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Sheet } from './Sheet';

interface PauseSheetProps { readonly onResume: () => void; readonly onSaveAndExit: () => void; readonly onRestartChapter: () => void; }
export function PauseSheet({ onResume, onSaveAndExit, onRestartChapter }: PauseSheetProps) {
  const [confirmRestart, setConfirmRestart] = useState(false);
  return (
    <>
      <Sheet title="Paused" onClose={onResume}>
        <div className="pause-actions"><button className="button button-primary" type="button" onClick={onResume}><Play size={20} aria-hidden="true" />Resume</button><button className="button button-secondary" type="button" onClick={onSaveAndExit}><FloppyDisk size={20} aria-hidden="true" />Save &amp; Exit</button><button className="button button-secondary" type="button" onClick={() => setConfirmRestart(true)}><ArrowCounterClockwise size={20} aria-hidden="true" />Restart Chapter</button></div>
        <p className="pause-note">Restarting restores the chapter opening checkpoint and begins a new deterministic attempt.</p>
      </Sheet>
      {confirmRestart && <ConfirmDialog title="Restart this chapter?" description="Progress made since the chapter began will be replaced by the chapter checkpoint." confirmLabel="Restart Chapter from Beginning" cancelLabel="Keep Playing" onCancel={() => setConfirmRestart(false)} onConfirm={() => { setConfirmRestart(false); onRestartChapter(); }} />}
    </>
  );
}
