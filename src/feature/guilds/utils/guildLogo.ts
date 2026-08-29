/**
 * A guild's picture.
 *
 * The file itself goes to Firebase Storage straight from the browser — the same
 * route an avatar takes — and only the resulting download URL reaches the API.
 * That is why the URL is checked rather than trusted: a client free to name any
 * URL could point a guild card at any image on the internet, hotlinked and
 * changeable from the outside afterwards. The only ones accepted are the ones
 * that came out of our own bucket, under the folder this feature writes to.
 */

export const GUILD_LOGO_FOLDER = "guildLogos";

/** What the picker takes in. Anything bigger is a photo, not a crest. */
export const GUILD_LOGO_MAX_BYTES = 4 * 1024 * 1024;

/** What it comes back out as: a square small enough to sit in a list of cards. */
export const GUILD_LOGO_SIZE = 256;

export const GUILD_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

const STORAGE_HOST = "https://firebasestorage.googleapis.com/v0/b/";

/**
 * A download URL is `…/v0/b/<bucket>/o/<object>?alt=media&token=…`, and the
 * object name is percent-encoded into a single path segment — so the folder
 * reads as "guildLogos%2F…" rather than a path of its own.
 */
export const isGuildLogoUrl = (url: unknown): url is string => {
  if (typeof url !== "string" || !url || url.length > 700) return false;

  const bucket = process.env.NEXT_PUBLIC_FIREBASE_CONFIG_STORAGEBUCKET;
  if (!url.startsWith(bucket ? `${STORAGE_HOST}${bucket}/o/` : STORAGE_HOST)) {
    return false;
  }

  const marker = url.indexOf("/o/");
  if (marker < 0) return false;

  return url.slice(marker + 3).startsWith(`${GUILD_LOGO_FOLDER}%2F`);
};
