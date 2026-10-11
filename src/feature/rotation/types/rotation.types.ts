import type { SkillsType } from "types/skillsTypes";

/** What the player can keep in rotation. `custom` is anything of their own — a course, a lick, a habit. */
export type RotationItemType = "song" | "exercise" | "skill" | "custom";

export const ROTATION_ITEM_TYPES: RotationItemType[] = [
  "song",
  "exercise",
  "skill",
  "custom",
];

/**
 * One thing the player put in rotation by hand. Exercises and skills resolve
 * against the static catalogs; songs live in Firestore, so the few fields the
 * panel draws are copied in when the song is added. Custom items carry
 * everything themselves.
 */
export interface RotationItem {
  type: RotationItemType;
  id: string;
  /** Epoch ms. Stands in for "last played" until the item is first played. */
  addedAt: number;
  title?: string;
  artist?: string;
  coverUrl?: string;
  /** Custom only: a line under the title ("Practice the turnaround at 80 BPM"). */
  note?: string;
  /** Custom only: where the material lives — a course page, a video, a PDF. */
  link?: string;
  /** Custom only: the category its timed practice is logged under. */
  category?: SkillsType;
  /**
   * Custom only: played with the free timer, its time logged like any session.
   * Without it the item is simply ticked off when done.
   */
  timer?: boolean;
}

/** Epoch ms of the last session that played each song / exercise / skill / custom item. */
export type LastPracticedMap = Record<RotationItemType, Record<string, number>>;

/** `users/{uid}/settings/rotation` */
export interface RotationDoc {
  /** Written by the player. */
  items: RotationItem[];
  /**
   * Stamped by the session report on the server, for everything played — and
   * by the player for a custom item they tick off without the timer.
   */
  lastPracticed: LastPracticedMap;
}

export type FreshnessLevel = "fresh" | "cooling" | "rusty";

export interface ItemFreshness {
  /** Last session that played it, `null` when it hasn't been played since added. */
  lastPracticedAt: number | null;
  /** Whole days since it was last played, or since it was added when never played. */
  days: number;
  level: FreshnessLevel;
  /** 1 right after playing, falling to 0 once it is fully rusty. */
  freshness: number;
}

export interface RotationEntry {
  item: RotationItem;
  freshness: ItemFreshness;
}
