import { useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Sparkle, Sword } from './icons';

interface OnboardingScreenProps { readonly onBack: () => void; readonly onComplete: () => void; }

const SLIDES = [
  { eyebrow: 'Every choice leaves a scar', title: 'Your chronicle remembers', body: 'Mercy, corruption, secrets, and faction loyalties reshape later encounters and decide which ending survives you.', image: '/assets/onboarding/chronicle.webp', icon: Sword, note: 'No two twelve-scene journeys resolve the same way.' },
  { eyebrow: 'Tactical, readable combat', title: 'Read the enemy', body: 'Enemy intent is shown before every turn. Guard a heavy blow, risk a critical strike, cast through armor, or flee when the road permits it.', image: '/assets/onboarding/combat.webp', icon: Shield, note: 'Attacks can miss, hit, or land a critical blow.' },
  { eyebrow: 'Build your oathless hero', title: 'Carry what changes you', body: 'Collect sixty named relics, equip a weapon, armor, and two charms, then build around Warrior, Mage, or Warden strengths.', image: '/assets/onboarding/loadout.webp', icon: Sparkle, note: 'Equipment bonuses apply instantly and can be changed anytime.' },
] as const;

export function OnboardingScreen({ onBack, onComplete }: OnboardingScreenProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;
  return (
    <main className="onboarding-screen">
      <div className="onboarding-art" style={{ backgroundImage: `linear-gradient(180deg, transparent 48%, var(--ink-0)), url('${slide.image}')` }} aria-hidden="true" />
      <section className="onboarding-copy" aria-live="polite">
        <div className="onboarding-progress" aria-label={`Introduction ${index + 1} of ${SLIDES.length}`}>{SLIDES.map((entry, step) => <span key={entry.title} className={step <= index ? 'is-active' : ''} />)}</div>
        <p className="eyebrow">{slide.eyebrow}</p><h1>{slide.title}</h1><p>{slide.body}</p>
        <div className="onboarding-note"><Icon size={22} weight="duotone" aria-hidden="true" /><span>{slide.note}</span></div>
        <div className="onboarding-actions">
          <button className="button button-secondary" type="button" onClick={index === 0 ? onBack : () => setIndex((value) => value - 1)}><ArrowLeft size={18} aria-hidden="true" />{index === 0 ? 'Back' : 'Previous'}</button>
          <button className="button button-primary" type="button" onClick={isLast ? onComplete : () => setIndex((value) => value + 1)}>{isLast ? 'Choose Your Path' : 'Next'}{!isLast && <ArrowRight size={18} aria-hidden="true" />}</button>
        </div>
        <button className="onboarding-skip" type="button" onClick={onComplete}>Skip introduction</button>
      </section>
    </main>
  );
}
