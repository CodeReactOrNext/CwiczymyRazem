export const GUILD_NAME_MIN = 3;
export const GUILD_NAME_MAX = 28;
export const GUILD_TAG_MIN = 2;
export const GUILD_TAG_MAX = 5;
export const GUILD_DESCRIPTION_MAX = 240;

/**
 * Letters a Unicode decomposition cannot help with. NFD splits a base letter
 * from its accent, but "ł" is not an accented "l" — it is its own character
 * with a stroke through it, and the same goes for the rest of these. Without
 * the map "Głośni" slugs down to "g-osni", which is most of a Polish word list.
 */
const STROKED_LETTERS: Record<string, string> = {
  ł: "l",
  đ: "d",
  ø: "o",
  ß: "ss",
  æ: "ae",
  œ: "oe",
};

/**
 * The identity a guild is stored under.
 *
 * Deliberately the document id rather than a field: creating the document then
 * *is* the uniqueness check, decided by Firestore in one atomic write. A
 * "search first, then create" version has a window between the two where two
 * founders both see the name free and both take it.
 *
 * Accents fold, so "Głośni" and "Glosni" cannot both be taken — two names
 * nobody could tell apart in a member list.
 */
export const guildSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[łđøßæœ]/g, (letter) => STROKED_LETTERS[letter] ?? letter)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Tags are shouted in short spaces, so they are stored one way: upper case. */
export const normaliseTag = (tag: string): string =>
  tag
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

export type GuildNameProblem = "too-short" | "too-long" | "no-letters" | null;

export const checkGuildName = (name: string): GuildNameProblem => {
  const trimmed = name.trim();
  if (trimmed.length < GUILD_NAME_MIN) return "too-short";
  if (trimmed.length > GUILD_NAME_MAX) return "too-long";
  // A name made only of punctuation slugs down to nothing, which would leave
  // the guild without an id at all.
  if (!guildSlug(trimmed)) return "no-letters";
  return null;
};

export type GuildTagProblem = "too-short" | "too-long" | null;

export const checkGuildTag = (tag: string): GuildTagProblem => {
  const normalised = normaliseTag(tag);
  if (normalised.length < GUILD_TAG_MIN) return "too-short";
  if (normalised.length > GUILD_TAG_MAX) return "too-long";
  return null;
};

export const GUILD_NAME_MESSAGES: Record<
  NonNullable<GuildNameProblem>,
  string
> = {
  "too-short": `A guild name is at least ${GUILD_NAME_MIN} characters`,
  "too-long": `A guild name is at most ${GUILD_NAME_MAX} characters`,
  "no-letters": "A guild name needs letters or numbers in it",
};

export const GUILD_TAG_MESSAGES: Record<
  NonNullable<GuildTagProblem>,
  string
> = {
  "too-short": `A tag is at least ${GUILD_TAG_MIN} characters`,
  "too-long": `A tag is at most ${GUILD_TAG_MAX} characters`,
};
