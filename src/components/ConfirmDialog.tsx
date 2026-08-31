import { useId, useRef } from 'react';
import { useDialogFocus } from './useDialogFocus';

export interface ConfirmDialogProps {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const containFocus = useDialogFocus(dialogRef, cancelRef, onCancel);

  return (
    <div className="sheet-backdrop">
      <section
        ref={dialogRef}
        className="sheet confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={containFocus}
      >
        <header><h2 id={titleId}>{title}</h2></header>
        <div className="sheet-body">
          <p id={descriptionId}>{description}</p>
          <div className="title-actions">
            <button ref={cancelRef} className="button button-secondary" type="button" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button className="button button-primary" type="button" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
