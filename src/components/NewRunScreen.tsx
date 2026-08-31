import { useState } from 'react';
import type { HeroClass } from '../game/types';
import { ArrowLeft, Shield, Sparkle, Sword } from './icons';

interface NewRunScreenProps {
  readonly onBack: () => void;
  readonly onBegin: (heroClass: HeroClass, name: string) => void;
}

const CLASSES = [
  { id: 'warrior' as const, name: 'Warrior', icon: Sword, detail: 'High armor. Cleave through hard fights and punish announced strikes.', stats: '44 Health   8 Focus' },
  { id: 'mage' as const, name: 'Mage', icon: Sparkle, detail: 'Strong ward. Spend Focus to burn through sorcery and armored foes.', stats: '30 Health   14 Focus' },
  { id: 'warden' as const, name: 'Warden', icon: Shield, detail: 'Balanced scout. Read the road, escape danger, and turn supplies into survival.', stats: '37 Health   10 Focus' },
] as const;

export function NewRunScreen({ onBack, onBegin }: NewRunScreenProps) {
  const [selected, setSelected] = useState<HeroClass>('warrior');
  const [name, setName] = useState('The Oathless');

  return (
    <main className="new-run-screen">
      <header className="screen-header">
        <button className="back-button" type="button" aria-label="Back to title" onClick={onBack}>
          <ArrowLeft size={22} weight="bold" aria-hidden="true" />
          <span>Back</span>
        </button>
        <div>
          <p className="eyebrow">New Chronicle</p>
          <h1>Choose your path</h1>
        </div>
      </header>

      <div className="class-list" aria-label="Choose a class">
        {CLASSES.map((heroClass) => {
          const Icon = heroClass.icon;
          return (
            <button
              key={heroClass.id}
              className="class-option"
              type="button"
              aria-pressed={selected === heroClass.id}
              onClick={() => setSelected(heroClass.id)}
            >
              <Icon size={28} weight="duotone" aria-hidden="true" />
              <span className="class-option-copy">
                <strong>{heroClass.name}</strong>
                <span>{heroClass.detail}</span>
                <small>{heroClass.stats}</small>
              </span>
            </button>
          );
        })}
      </div>

      <label className="field">
        <span>Name</span>
        <input value={name} maxLength={24} onChange={(event) => setName(event.target.value)} />
        <small>The story uses this name sparingly.</small>
      </label>

      <button className="button button-primary begin-button" type="button" onClick={() => onBegin(selected, name)}>
        Begin Chronicle
      </button>
    </main>
  );
}
