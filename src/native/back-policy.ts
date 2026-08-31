export type BackAction =
  | 'close-overlay'
  | 'close-modal'
  | 'open-exit-confirmation'
  | 'minimize-app';

export interface BackContext {
  readonly overlayOpen: boolean;
  readonly modalOpen: boolean;
  readonly view: 'game' | 'title';
}

/** Pure UI priority policy; it never mutates campaign or combat state. */
export function resolveBackAction(context: BackContext): BackAction {
  if (context.overlayOpen) return 'close-overlay';
  if (context.modalOpen) return 'close-modal';
  if (context.view === 'game') return 'open-exit-confirmation';
  return 'minimize-app';
}
