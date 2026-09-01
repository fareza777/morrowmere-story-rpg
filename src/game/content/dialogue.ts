const SENTENCE_STARTERS = new Set([
  'a', 'an', 'he', 'here', 'i', 'it', 'she', 'that', 'the', 'then', 'there', 'they', 'this', 'we', 'you',
]);

function abbreviationEndsSentence(source: string, offset: number, abbreviation: string): boolean {
  const next = source.slice(offset + abbreviation.length).replace(/^[\s"'”’\])}]+/u, '');
  if (!next) return true;
  const word = next.match(/^\p{L}+/u)?.[0]?.toLocaleLowerCase();
  if ((abbreviation.toLocaleLowerCase() === 'e.g.' || abbreviation.toLocaleLowerCase() === 'i.e.') && (word === 'a' || word === 'an')) return false;
  return word !== undefined && SENTENCE_STARTERS.has(word);
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
