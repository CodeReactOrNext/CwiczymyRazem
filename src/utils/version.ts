/** Compares plain "major.minor.patch" version strings (no pre-release tags —
 *  matches this project's actual tag scheme, e.g. "0.1.4"). Missing segments
 *  count as 0, so "0.2" < "0.2.1". */
export const isVersionBelow = (current: string, min: string): boolean => {
  const currentParts = current.split(".").map(Number);
  const minParts = min.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
    const currentPart = currentParts[i] ?? 0;
    const minPart = minParts[i] ?? 0;
    if (currentPart !== minPart) return currentPart < minPart;
  }
  return false;
};
