/**
 * Counts authored dialogue sentences without treating common abbreviations as
 * sentence endings. An unspaced boundary counts only when the next sentence
 * begins with an uppercase letter, which keeps the authoring limit strict
 * without misreading ordinary lowercase punctuation.
 */
export function countDialogueSentences(text: string): number {
  const protectedText = text.normalize('NFKC').replace(/\s+/gu, ' ').trim()
    .replace(/\b(?:[A-Za-z]\.){2,}/gu, (abbreviation) => abbreviation.replace(/\./gu, '\uE000'))
    .replace(/\b(?:Mr|Mrs|Ms|Dr|St)\./giu, (abbreviation) => abbreviation.replace(/\./gu, '\uE000'));
  if (!protectedText) return 0;
  let count = 0;
  for (const match of protectedText.matchAll(/[.!?]+(?:["'”’\])}]+)?/gu)) {
    const next = protectedText.slice((match.index ?? 0) + match[0].length);
    if (!next || /^\s/u.test(next) || /^[A-Z]/u.test(next)) count += 1;
  }
  return count || 1;
}
