export const SAVED_PRACTICE_LENGTHS = [5, 10] as const;
export type SavedPracticeLength = (typeof SAVED_PRACTICE_LENGTHS)[number];

export function selectSavedPractice<T extends { id: string }>(items: T[], length: SavedPracticeLength): T[] {
  const seen = new Set<string>();
  const limit = length === 10 ? 10 : 5;
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, limit);
}
