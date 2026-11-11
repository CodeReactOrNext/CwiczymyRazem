export const GUILD_TABS = [
  "browse",
  "members",
  "chat",
  "stash",
  "quests",
  "studio",
  "recording",
  "upgrades",
  "kit",
] as const;

export type GuildTab = (typeof GUILD_TABS)[number];

/** The tab a `?tab=` value names, or the guild list for anything else. */
export const parseGuildTab = (param: string | string[] | undefined): GuildTab =>
  typeof param === "string" && (GUILD_TABS as readonly string[]).includes(param)
    ? (param as GuildTab)
    : "browse";
