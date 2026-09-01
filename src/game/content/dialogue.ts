import type { ChronicleDialogueBeat } from './schema';

function dialogueFlagGateMatches(
  requirement: NonNullable<ChronicleDialogueBeat['requirements']>[number],
  present: ReadonlySet<string>,
): boolean {
  return present.has(requirement.flagId) === (requirement.present ?? true);
}

/** Returns the ordered dialogue sequence visible for the current campaign state. */
export function visibleDialogueBeats(
  dialogue: readonly ChronicleDialogueBeat[] | undefined,
  flags: readonly string[],
): readonly ChronicleDialogueBeat[] {
  if (!dialogue?.length) return [];
  const present = new Set(flags);
  return dialogue.filter((beat) =>
    (beat.requirements ?? []).every((requirement) => dialogueFlagGateMatches(requirement, present))
      && (beat.exclusions ?? []).every((requirement) => !dialogueFlagGateMatches(requirement, present)),
  );
}

const NON_NAME_OR_PLACE_TOKENS = new Set(['then', 'the', 'a', 'an', 'it', 'we', 'he', 'she', 'they', 'this', 'that', 'there', 'here', 'you', 'i']);
const STREET_DESCRIPTORS = new Set(['high', 'low', 'main', 'old', 'new']);

function abbreviationEndsSentence(source: string, offset: number, abbreviation: string): boolean {
  const next = source.slice(offset + abbreviation.length).replace(/^[\s"'”’\])}]+/u, '');
  if (!next) return true;
  const kind = abbreviation.toLocaleLowerCase();
  if (kind === 'etc.' || kind === 'e.g.' || kind === 'i.e.') return !/^\p{Ll}/u.test(next);

  const token = next.match(/^\p{Lu}[\p{L}'’-]*/u)?.[0];
  if (!token || NON_NAME_OR_PLACE_TOKENS.has(token.toLocaleLowerCase())) return true;
  const precedingWord = source.slice(0, offset).match(/\p{L}+\s*$/u)?.[0]?.trim().toLocaleLowerCase();
  return kind === 'st.' && precedingWord !== undefined && STREET_DESCRIPTORS.has(precedingWord);
}

/** Counts display sentences while preserving in-sentence English abbreviations. */
export function countDialogueSentences(text: string): number {
  const normalized = text.normalize('NFKC').replace(/\s+/gu, ' ').trim();
  const protectedText = normalized.replace(
    /\b(?:Mr|Mrs|Ms|Dr|St|etc|e\.g|i\.e)\./giu,
    (abbreviation, offset: number, source: string) => abbreviationEndsSentence(source, offset, abbreviation)
      ? abbreviation
      : abbreviation.replace(/\./gu, '\uE000'),
  );
  if (!protectedText) return 0;
  let count = 0;
  for (const match of protectedText.matchAll(/[.!?]+(?:["'”’\])}]+)?/gu)) {
    const next = protectedText.slice((match.index ?? 0) + match[0].length);
    if (!next || /^\s/u.test(next) || /^[A-Z]/u.test(next)) count += 1;
  }
  return count || 1;
}
