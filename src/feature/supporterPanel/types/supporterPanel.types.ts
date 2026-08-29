/** Where an idea stands. Only the owner moves it off "open". */
export type RoadmapIdeaStatus =
  | "open"
  | "planned"
  | "in_progress"
  | "shipped"
  | "declined";

export const ROADMAP_IDEA_STATUSES: RoadmapIdeaStatus[] = [
  "open",
  "planned",
  "in_progress",
  "shipped",
  "declined",
];

/**
 * Icon an idea is filed under. Stored as an id, never as a component, so the
 * board stays readable straight out of Firestore and the server can validate a
 * submission without pulling the icon library into the API bundle.
 */
export type RoadmapIdeaIcon =
  | "idea"
  | "guitar"
  | "song"
  | "practice"
  | "tone"
  | "recording"
  | "gear"
  | "ranking"
  | "stats"
  | "mobile"
  | "bug"
  | "polish";

export const ROADMAP_IDEA_ICONS: RoadmapIdeaIcon[] = [
  "idea",
  "guitar",
  "song",
  "practice",
  "tone",
  "recording",
  "gear",
  "ranking",
  "stats",
  "mobile",
  "bug",
  "polish",
];

export const DEFAULT_ROADMAP_IDEA_ICON: RoadmapIdeaIcon = "idea";

/**
 * Someone who has burned tokens on a board item, and how much they put in.
 *
 * Built on read from the vote ledger rather than stored on the item, so a name
 * or an avatar that changed since the vote shows as it is now, and the votes
 * cast before anyone thought to display them are still attributable.
 */
export interface Backer {
  uid: string;
  name: string;
  avatar: string | null;
  /** Weight behind the item — never more than the per-item cap. */
  weight: number;
}

/** A feature request posted by a supporter, and how the board has backed it. */
export interface RoadmapIdea {
  id: string;
  title: string;
  description: string;
  status: RoadmapIdeaStatus;
  icon: RoadmapIdeaIcon;
  authorUid: string;
  authorName: string;
  authorAvatar: string | null;
  /** Sum of every backer's weight — what the board is ranked by. */
  voteCount: number;
  /** How many different people put something behind it. */
  backerCount: number;
  /** Who those people are, heaviest backing first. */
  backers: Backer[];
  createdAt: string;
}

/** The signed-in supporter's wallet: a lifetime pile, not a monthly one. */
export interface SupporterWallet {
  /** Lifetime USD donated through Buy Me a Coffee — 0 for a hand-marked supporter. */
  supportTotal: number;
  /** What the donations alone are worth, before the badge and any grant. */
  fromDonation: number;
  /** Everything the wallet has ever held: welcome tokens, donations, grants. */
  earned: number;
  /** Extra tokens handed out by hand, kept for good like the rest. */
  granted: number;
  /** Lifetime tokens spent. */
  spent: number;
  left: number;
}

export interface RoadmapBoard {
  ideas: RoadmapIdea[];
  /** ideaId → how much weight I have already burned onto it. */
  myBacking: Record<string, number>;
  /** Whoever is reading, so the board can point out their own name. */
  myUid: string;
  wallet: SupporterWallet;
  /** The owner sees the status controls; nobody else does. */
  isOwner: boolean;
}
