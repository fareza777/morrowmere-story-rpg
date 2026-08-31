import { useId, useRef, type ReactNode } from 'react';
import { X } from './icons';
import { useDialogFocus } from './useDialogFocus';

interface SheetProps { readonly title: string; readonly children: ReactNode; readonly onClose: () => void; }

export function Sheet({ title, children, onClose }: SheetProps) {
  const id = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const containFocus = useDialogFocus(dialogRef, headingRef, onClose);
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="sheet" role="dialog" aria-modal="true" aria-labelledby={id} onKeyDown={containFocus}>
        <header><h1 ref={headingRef} id={id} tabIndex={-1}>{title}</h1><button className="icon-button" type="button" aria-label={`Close ${title}`} onClick={onClose}><X size={22} weight="bold" aria-hidden="true" /></button></header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}
