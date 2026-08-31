import { BookOpenText, Eye, FilmStrip, GraduationCap, Scroll, UsersThree } from '@phosphor-icons/react';
import { useState } from 'react';
import type { JournalViewModel } from '../ui/types';
import { CompanionPanel } from './CompanionPanel';
import { Sheet } from './Sheet';

type JournalTab = 'story' | 'evidence' | 'companions' | 'tutorials' | 'codex';
interface JournalSheetProps { readonly view: JournalViewModel; readonly canSwitchCompanion?: boolean; readonly onSetActiveCompanion: (companionId: string | null) => void; readonly onReplayOpening: () => void; readonly onReplayTutorials: () => void; readonly onClose: () => void; }
const TABS: readonly { readonly id: JournalTab; readonly label: string }[] = [{ id: 'story', label: 'Story' }, { id: 'evidence', label: 'Evidence' }, { id: 'companions', label: 'Companions' }, { id: 'tutorials', label: 'Tutorials' }, { id: 'codex', label: 'Codex' }];

export function JournalSheet({ view, canSwitchCompanion = true, onSetActiveCompanion, onReplayOpening, onReplayTutorials, onClose }: JournalSheetProps) {
  const [tab, setTab] = useState<JournalTab>('story');
  return (
    <Sheet title="Journal" onClose={onClose}>
      <div className="journal-tabs" role="tablist" aria-label="Journal pages">{TABS.map((entry) => <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} onClick={() => setTab(entry.id)}>{entry.label}</button>)}</div>
      {tab === 'story' && <div className="journal-page"><section className="objective-card"><span>Current objective</span><h2>{view.objective.title}</h2><p>{view.objective.summary}</p></section><h2>Decisions and consequences</h2>{view.consequences.length === 0 ? <p className="empty-state">Your choices have not yet left a lasting mark.</p> : <div className="journal-list">{view.consequences.map((entry) => <article key={entry.id}><BookOpenText size={18} aria-hidden="true" /><div><strong>{entry.label}</strong><small>{entry.sceneTitle}</small><p>{entry.summary}</p></div></article>)}</div>}</div>}
      {tab === 'evidence' && <div className="journal-page"><h2>Collected evidence</h2>{view.evidence.length === 0 ? <p className="empty-state">No evidence has been secured.</p> : <div className="journal-list">{view.evidence.map((entry) => <article key={entry.id}><Eye size={19} aria-hidden="true" /><div><strong>{entry.label}</strong><p>{entry.summary}</p></div></article>)}</div>}</div>}
      {tab === 'companions' && <CompanionPanel companions={view.companions} canSwitch={canSwitchCompanion} onSetActive={onSetActiveCompanion} />}
      {tab === 'tutorials' && <div className="journal-page"><h2>Replay guidance</h2><p>Replaying tutorials resets only their presentation. It does not change your story, inventory, or random seed.</p><button className="button button-secondary" type="button" onClick={onReplayTutorials}><GraduationCap size={20} aria-hidden="true" />Replay Contextual Tutorials</button><button className="button button-secondary" type="button" onClick={onReplayOpening}><FilmStrip size={20} aria-hidden="true" />Replay Opening Story</button></div>}
      {tab === 'codex' && <div className="journal-page"><h2>Discovered people, places, and foes</h2>{view.codex.length === 0 ? <p className="empty-state">Codex entries appear as you discover them.</p> : <div className="journal-list">{view.codex.map((entry) => <article key={entry.id}><Scroll size={18} aria-hidden="true" /><div><strong>{entry.title}</strong><small>{entry.category}</small><p>{entry.description}</p></div></article>)}</div>}</div>}
      <p className="journal-note"><UsersThree size={16} aria-hidden="true" />Companions can be switched only while safely at camp.</p>
    </Sheet>
  );
}
