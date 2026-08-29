/**
 * Buy Me a Coffee hands us the donor's email, accounts keep theirs on the user
 * document, and the two are typed by hand in different places — so every
 * comparison between them goes through here first. Pure on purpose: the
 * matching rules are the part worth testing, the Firestore calls around them
 * live in `supporterGrant`.
 */

/** Lowercased + trimmed, or null when the value can't be an address at all. */
export const normalizeEmail = (email?: string | null): string | null => {
  const trimmed = typeof email === "string" ? email.trim().toLowerCase() : "";
  return trimmed.includes("@") ? trimmed : null;
};

/** Donations that land before the donor has an account wait here, keyed by email. */
export const PENDING_SUPPORTER_COLLECTION = "bmcPendingSupporters";

/**
 * Firestore document ids may not contain a slash, which a technically legal
 * local part can. Percent-encoding keeps the id readable and the write from
 * throwing; an address always carries "@", so the encoded form can never come
 * out as the reserved "." or "..".
 */
export const pendingSupporterDocId = (normalizedEmail: string): string =>
  encodeURIComponent(normalizedEmail);

/** Reverses `pendingSupporterDocId` for the admin listing. */
export const emailFromPendingDocId = (docId: string): string => {
  try {
    return decodeURIComponent(docId);
  } catch {
    return docId;
  }
};

/**
 * Values to try in an equality query against `users.email`. Older documents
 * were written straight from the auth provider, so they can still carry the
 * capitalisation the person typed at sign-up — the normalised form alone would
 * walk straight past them.
 */
export const emailQueryVariants = (email?: string | null): string[] => {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  const raw = typeof email === "string" ? email.trim() : "";
  return raw && raw !== normalized ? [normalized, raw] : [normalized];
};
