import type { TablatureMeasure } from "../types/exercise.types";

const DRAFT_KEY = "tab-editor-draft";

type StoredDraft = {
  /** Community exercise the draft belongs to, or null for a brand new one. */
  exerciseId: string | null;
  measures: TablatureMeasure[];
};

/**
 * The Tab Editor keeps its work in localStorage so a round-trip to the publish
 * page (or a refresh) doesn't wipe it. The draft is stamped with the exercise
 * it belongs to because that key is shared by every editor session: without the
 * stamp, a draft left over from editing one exercise silently becomes the tab
 * of the next exercise the editor opens.
 */
export const saveTabEditorDraft = (
  exerciseId: string | null,
  measures: TablatureMeasure[],
) => {
  try {
    const draft: StoredDraft = { exerciseId, measures };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
};

/**
 * The stored measures, but only when the draft belongs to `exerciseId` — null
 * when there is nothing saved or the draft is another exercise's. Callers then
 * fall back to the exercise's saved tablature (edit mode) or an empty grid.
 */
export const readTabEditorDraft = (
  exerciseId: string | null,
): TablatureMeasure[] | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Drafts written before the stamp existed were always untagged arrays, so
    // they can only be read back as a new exercise's.
    if (Array.isArray(parsed))
      return exerciseId === null ? (parsed as TablatureMeasure[]) : null;

    const draft = parsed as StoredDraft | null;
    if (!draft || !Array.isArray(draft.measures)) return null;
    if ((draft.exerciseId ?? null) !== exerciseId) return null;
    return draft.measures;
  } catch {
    return null;
  }
};

export const clearTabEditorDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
};
