/**
 * Features that stay shut until the account reaches a level.
 *
 * Both of these read better with a little history behind them — milestones are
 * derived from how your week actually went, and a guild is other people
 * counting on you to turn up. Handing them to somebody on their first session
 * buries the two screens that matter then (practice and the dashboard) under
 * pages that are still empty.
 */
export type LockedFeatureId = "summary" | "guilds";

export interface FeatureUnlock {
  id: LockedFeatureId;
  /** Name as the sidebar shows it. */
  name: string;
  href: string;
  /** Level the account has to reach before the page opens. */
  requiredLvl: number;
  /** Why it waits — read by the player on the locked screen. */
  reason: string;
  /** What opens up, listed on the locked screen. */
  perks: string[];
}

export const FEATURE_UNLOCKS: Record<LockedFeatureId, FeatureUnlock> = {
  summary: {
    id: "summary",
    name: "Milestones",
    href: "/summary",
    requiredLvl: 3,
    reason:
      "Milestones are built out of your own practice history. A few logged sessions are what make the weekly targets fit the way you play instead of guessing at it.",
    perks: [
      "Weekly targets picked from how you actually practise",
      "Fame to claim every time you clear one",
      "A read on where the week went, category by category",
    ],
  },
  guilds: {
    id: "guilds",
    name: "Guilds",
    href: "/guilds",
    requiredLvl: 5,
    reason:
      "A guild runs on people turning up for each other. A few levels in you have a routine of your own — that is the point where joining one does something for the rest of the guild too, not just for you.",
    perks: [
      "A chat with guitarists practising the same week as you",
      "A weekly challenge the whole guild clears together",
      "A shared stash and a crest your guild wears",
    ],
  },
};

/** Every gated feature, in the order an account reaches them. */
export const FEATURE_UNLOCK_LIST: FeatureUnlock[] = Object.values(
  FEATURE_UNLOCKS,
).sort((a, b) => a.requiredLvl - b.requiredLvl);

export const isFeatureUnlocked = (id: LockedFeatureId, lvl: number) =>
  lvl >= FEATURE_UNLOCKS[id].requiredLvl;

/** The level still to reach, or `undefined` once nothing is in the way. */
export const getLockedAtLvl = (id: LockedFeatureId, lvl: number) =>
  isFeatureUnlocked(id, lvl) ? undefined : FEATURE_UNLOCKS[id].requiredLvl;
