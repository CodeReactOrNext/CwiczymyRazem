import type { GuildMetric } from "feature/guilds/data/guildMetrics";
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
  frame: string;
}

/**
 * The travelling half of a guild's identity: enough to draw a member's tag
 * anywhere in the app without reading the guild document.
 *
 * Copied onto every member's own user document, because the leaderboard, the
 * chat and the profile all read users and none of them may read `guilds` (see
 * `firestore.rules`). Re-synced across the roster whenever the guild changes
 * what it wears — a roster is capped at a few dozen, so that is one small batch
 * on a rare action, against an extra read on every page that names a player.
 */
export interface GuildBadge {
  guildId: string;
  tag: string;
  /** Equipped accent id. */
  accent: string;
  /** Equipped frame id. */
  frame: string;
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
 * The guild's own Fame: a balance it holds, rather than a pot earmarked for one
 * purchase.
 *
 * Members top it up out of their own Fame and the guild spends it as a
 * deliberate act — today on the challenge ladder, and on whatever else a guild
 * comes to buy. See `guildTreasury.utils.ts` for why a balance is the right
 * shape here where a self-buying pot was the right shape for seats.
 */
export interface GuildTreasury {
  /** Fame in the guild's hands right now. */
  fame: number;
  /** Fame put in per member uid, all-time. Never reset — the credit for it. */
  deposits: Record<string, number>;
  /** Fame the guild has spent, all-time. */
  spent: number;
}

export interface GuildMember {
  uid: string;
  displayName: string;
  avatar: string | null;
}

export interface Guild {
  /** Consecutive weeks this guild has cleared its challenge. */
  challengeStreak: number;
  /**
   * Steps up the challenge ladder the guild has bought — the index into
   * `GUILD_CHALLENGE_TIERS`. Zero is the week every guild starts on.
   */
  challengeTier: number;
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
 * One goal inside the week: what each member is asked for, what that adds up to
 * across the roster, and how both the guild and the caller stand against it.
 */
export interface GuildObjectiveProgress {
  metric: GuildMetric;
  /** Asked of every member: sessions for `sessions`, hours for the rest. */
  perMember: number;
  /** Asked of the whole guild — the share above, times the roster. */
  target: number;
  /** What the guild has put in this week. */
  progress: number;
  isComplete: boolean;
  /**
   * The caller's own tally against `perMember`. Answered rather than left to be
   * worked out: the client is never told which uid is its own (see
   * `isFounder`), so it cannot find itself in `perMember`.
   */
  mine: number;
  mineComplete: boolean;
}

/** What one member put into the week, as the roster reads it. */
export interface GuildMemberTally {
  /** Sessions logged this week. */
  sessions: number;
  /** Hours per practice category, to the tenth — only what the rank asks for. */
  hours: Partial<Record<GuildMetric, number>>;
  /** Goals this member cleared on their own, of the `total` asked of them. */
  done: number;
  total: number;
}

/** The guild's week: clear every goal together, or the streak resets. */
export interface GuildChallenge {
  weekId: string;
  /** Everything the week asks for. All of it has to be cleared. */
  objectives: GuildObjectiveProgress[];
  /** Goals the guild has cleared together, of how many it was asked for. */
  cleared: number;
  isComplete: boolean;
  /**
   * What each member put in, per uid. The bars above are these added up, so the
   * roster is shown out of counting that had to happen anyway rather than out
   * of a second pass over the same reports.
   */
  perMember: Record<string, GuildMemberTally>;
  /** Consecutive weeks cleared, and the thing every rank pays. */
  streak: number;
  endsAt: string;
  /** Which rank of the ladder the guild has funded its way onto. */
  tier: number;
  tierName: string;
  /** Fame a member claims for a cleared week on this rank. Zero on the first. */
  reward: number;
  /** Whether the caller has personally done their share of every goal. */
  myShareDone: boolean;
  /** Whether the caller has already taken this week's Fame. */
  claimed: boolean;
  /** Cleared week, own share done, nothing taken yet. */
  canClaim: boolean;
}

export interface GuildsState {
  guilds: Guild[];
  /** The guild this player belongs to, if any — one at a time. */
  myGuildId: string | null;
  /** Tokens it costs to found one. */
  foundingCost: number;
  /** What the caller has left to spend, so the panel can price the button. */
  tokensLeft: number;
  /** Only for the guild the caller is in — nobody else's week is their business. */
  challenge: GuildChallenge | null;
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
