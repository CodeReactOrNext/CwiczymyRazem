import type { QuestUnit } from "feature/guilds/data/guildQuests";
import type { GuildUpgrade } from "feature/guilds/utils/guildUpgrades.utils";

/**
 * What a guild wears.
 *
 * Only ids are stored — the catalog in `data/guildCosmetics.ts` holds the
 * looks, so re-drawing an item is a constant to change rather than a migration
 * to run. Nothing about ownership is stored with it: every item in the catalog
 * is there for every guild, and the founder is the only one who may swap one.
 */
export interface GuildCosmetics {
  /** Worn, one per slot. Ids the catalog does not know fall back to the default. */
  accent: string;
  banner: string;
  /** The four icons across the banner, as one id — see `motifId`. */
  motif: string;
  frame: string;
}

/**
 * The travelling half of a guild's identity: enough to draw a member's tag
 * anywhere in the app without reading the guild document.
 *
 * Copied onto every member's own user document, because the leaderboard, the
 * chat and the profile all read users and none of them may read `guilds` (see
 * `firestore.rules`). Re-synced across the roster whenever the guild changes
 * what it wears or clears a quest — a roster is capped at a few dozen, so that
 * is one small batch on a rare action, against an extra read on every page
 * that names a player.
 */
export interface GuildBadge {
  guildId: string;
  tag: string;
  /** Equipped accent id. */
  accent: string;
  /** Equipped frame id. */
  frame: string;
  /** Quests cleared — the guild's level. Missing on badges stamped before it existed. */
  level?: number;
}

/**
 * The pot behind one thing a guild can outgrow: its roster, or its shelf.
 *
 * Both are bought the same way — anybody in the guild puts tokens in, and the
 * step happens the moment the pot covers it — because a rising price is only
 * reachable by a guild if the guild can pay it together. What one person put in
 * is never handed back: the pot buys room everybody is standing in, and a
 * refundable pledge would just be a way of holding a purchase hostage.
 */
export interface GuildFund {
  /** Tokens in towards the next step, emptied every time one is bought. */
  pot: number;
  /** What that step costs, or null once the track is as far as it goes. */
  cost: number | null;
  /** Tokens per member uid, all-time. The credit for the room. */
  pledges: Record<string, number>;
}

/**
 * The guild's own Fame: a balance it holds.
 *
 * Members top it up out of their own Fame. Nothing spends it any more — the
 * treasury is one of the things the guild's quests count, and the record of who
 * filled it is the point. See `guildTreasury.utils.ts`.
 */
export interface GuildTreasury {
  /** Fame in the guild's hands right now. */
  fame: number;
  /** Fame put in per member uid, all-time. Never reset — the credit for it. */
  deposits: Record<string, number>;
  /** Fame the guild spent back when it could, all-time. Kept for the record. */
  spent: number;
}

export interface GuildMember {
  uid: string;
  displayName: string;
  avatar: string | null;
}

/**
 * One member's honor: the guild's own currency, earned by putting Fame, tokens
 * or gear into the guild and spent taking gear off its shelf. `earned` is the
 * standing the roster shows; `balance` is what the shelf charges against.
 * See `guildHonor.utils.ts`.
 */
export interface GuildHonor {
  earned: number;
  spent: number;
  balance: number;
}

export interface Guild {
  /** Quests cleared, across every lap of the ladder. No ceiling. */
  level: number;
  /** The guild's own Fame, and who put it there. */
  treasury: GuildTreasury;
  /** Slug of the name, and the document id — see `guildSlug`. */
  id: string;
  name: string;
  /** Short badge worn next to a member's name, e.g. "RIF". */
  tag: string;
  /** Download URL of the crest the founder uploaded, if they uploaded one. */
  logo: string | null;
  description: string;
  founderUid: string;
  founderName: string;
  memberCount: number;
  /** Seats the guild has: the base, plus three for every purchase made. */
  memberLimit: number;
  /** Purchases made so far — what prices the next three seats. */
  seatUpgrades: number;
  /** Rows of sockets the shelf has: the base, plus one per purchase. */
  stashRowLimit: number;
  /** Rows bought so far — what prices the next one. */
  stashUpgrades: number;
  /** What the guild is chipping in for, per track. */
  funds: Record<GuildUpgrade, GuildFund>;
  /** What it wears. */
  cosmetics: GuildCosmetics;
  members: GuildMember[];
  /** Honor per member uid — who has put in, and what they have left to spend. */
  honor: Record<string, GuildHonor>;
  createdAt: string;
}

/**
 * A request to join, waiting on the guild's founder.
 *
 * Stored under the applicant's own uid, so one person has at most one
 * application per guild and re-applying overwrites rather than piling up.
 */
export interface GuildApplication {
  uid: string;
  displayName: string;
  avatar: string | null;
  /** Optional note from the applicant. */
  message: string;
  status: "pending" | "rejected";
  at: string;
}

/**
 * One quest of the chapter the guild is on, measured.
 *
 * `progress` and `target` are in `unit`. On a quest that asks something of
 * every member they count members, and `each` says what each one is asked for
 * and where the caller stands against it; on a quest that counts the guild,
 * `mine` is the caller's own share of the total.
 */
export interface GuildQuestProgress {
  /** The ledger key: the catalog id, with `@lap` after the first lap. */
  id: string;
  /** The catalog quest behind it. */
  questId: string;
  lap: number;
  chapter: number;
  /** The lap's name for it, e.g. "First Hundred II". */
  name: string;
  blurb: string;
  unit: QuestUnit;
  target: number;
  progress: number;
  isComplete: boolean;
  /** Fame each eligible member claims once it is cleared. */
  reward: number;
  /** The caller's own contribution to a guild total, or null when it is not one. */
  mine: number | null;
  /** The per-member ask, in words, and the caller's own number against it. */
  each: { ask: string; mine: number; target: number; done: boolean } | null;
  /** When the guild cleared it, or null while it is still open. */
  doneAt: string | null;
}

/** A quest the guild has behind it, as the ledger has it. */
export interface GuildQuestDone {
  /** The ledger key. */
  id: string;
  questId: string;
  lap: number;
  chapter: number;
  name: string;
  /** What it paid, on its lap. */
  reward: number;
  doneAt: string;
  /** Whether the caller was on the roster when it was cleared. */
  eligible: boolean;
  claimed: boolean;
}

/** What one member has put in since the guild was founded, for the roster. */
export interface GuildMemberEffort {
  sessions: number;
  hours: number;
}

/**
 * The guild's quest board: its level, the lap and chapter it is on, and what
 * the caller has waiting to take.
 */
export interface GuildQuestBoard {
  /** Quests cleared, across every lap. */
  level: number;
  /** The lap of the ladder the guild is on, counting from one. */
  lap: number;
  /** Quests in one lap. */
  lapSize: number;
  /** Quests cleared on the current lap. */
  lapCleared: number;
  /** The chapter being worked on, with the lap's reward. There is always one. */
  chapter: { index: number; name: string; blurb: string; reward: number };
  chaptersTotal: number;
  /** The open chapter's quests, cleared ones included. */
  active: GuildQuestProgress[];
  /** Everything cleared so far, oldest first. */
  done: GuildQuestDone[];
  /** Fame the caller can take right now, and over how many quests. */
  claimable: { fame: number; quests: number };
  /** Sessions and hours per member uid, since the guild was founded. */
  perMember: Record<string, GuildMemberEffort>;
  /** When counting started — the day the guild was founded. */
  since: string;
}

export interface GuildsState {
  guilds: Guild[];
  /** The guild this player belongs to, if any — one at a time. */
  myGuildId: string | null;
  /** Tokens it costs to found one. */
  foundingCost: number;
  /** What the caller has left to spend, so the panel can price the button. */
  tokensLeft: number;
  /** Only for the guild the caller is in — nobody else's board is their business. */
  quests: GuildQuestBoard | null;
  /** Where the caller's own request stands, if they have one out. */
  myApplication: { guildId: string; status: "pending" | "rejected" } | null;
  /** Everyone knocking — only ever filled for a founder, on their own guild. */
  applications: GuildApplication[];
  /** The caller's own Fame, so the panels that spend it can price their buttons. */
  fame: number;
  /**
   * Whether the caller founded the guild they are in. Sent as an answer rather
   * than as the ingredients — the caller's own uid never travels to the client,
   * so there is nothing here to compare a founder's uid against.
   */
  isFounder: boolean;
  isSupporter: boolean;
}
