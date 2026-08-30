import { useEffect, type ReactNode } from 'react';
import { X } from './icons';

interface SheetProps { readonly title: string; readonly children: ReactNode; readonly onClose: () => void; }

export function Sheet({ title, children, onClose }: SheetProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);
  const id = `sheet-${title.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
        <header><h1 id={id}>{title}</h1><button className="icon-button" autoFocus type="button" aria-label={`Close ${title}`} onClick={onClose}><X size={22} weight="bold" aria-hidden="true" /></button></header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>
  );
}
