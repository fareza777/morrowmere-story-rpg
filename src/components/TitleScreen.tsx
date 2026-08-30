interface TitleScreenProps {
  readonly canContinue: boolean;
  readonly onNew: () => void;
  readonly onContinue: () => void;
}

export function TitleScreen({ canContinue, onNew, onContinue }: TitleScreenProps) {
  return (
    <main className="title-screen">
      <div className="title-art" aria-hidden="true" />
      <section className="title-copy" aria-labelledby="game-title">
        <p className="eyebrow">A sword &amp; sorcery chronicle</p>
        <h1 id="game-title">MORROWMERE</h1>
        <p className="title-intro">Carry the last tooth of a broken crown through a kingdom drowning in black rain.</p>
        <div className="title-actions">
          <button className="button button-primary" type="button" onClick={onNew}>
            New Chronicle
          </button>
          <button className="button button-secondary" type="button" onClick={onContinue} disabled={!canContinue}>
            Continue
          </button>
        </div>
      </section>
    </main>
  );
}
