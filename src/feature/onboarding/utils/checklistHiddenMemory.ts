/**
 * What this browser last saw of the Getting Started checklist for a player:
 * hidden (dismissed, or fully complete — neither undoes itself) or visible.
 *
 * Telling that from the player's data takes three reads (onboarding quest,
 * inventory, songs), and both the checklist and the dashboard hero waited on
 * the answer, so one of them always dropped in late and pushed the dashboard
 * down. With the last answer the right one gets its space from the start.
 */

export type ChecklistMemory = "hidden" | "visible" | null;

const keyFor = (uid: string) => `rq:getting-started-hidden:${uid}`;

export const readChecklistMemory = (uid: string | null | undefined): ChecklistMemory => {
  if (!uid) return null;
  try {
    const stored = window.localStorage.getItem(keyFor(uid));
    return stored === "1" ? "hidden" : stored === "0" ? "visible" : null;
  } catch {
    return null;
  }
};

export const writeChecklistMemory = (uid: string, hidden: boolean) => {
  try {
    window.localStorage.setItem(keyFor(uid), hidden ? "1" : "0");
  } catch {
    // Storage blocked: the dashboard just waits for the data as before.
  }
};
