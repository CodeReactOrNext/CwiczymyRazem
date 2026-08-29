/** A user marked in the admin panel as someone supporting the project with a donation. */
export interface SupportTeamMember {
  uid: string;
  displayName: string;
  avatar: string | null;
  /** Custom badge label (e.g. "Patron"). Falls back to "Supporter" when empty. */
  title: string | null;
}

/**
 * A Buy Me a Coffee donation whose email has no account behind it yet. It sits
 * in Firestore until that person logs in, and is listed in the admin panel so
 * a donation never quietly disappears.
 */
export interface PendingSupporter {
  email: string;
  supporterName: string | null;
  amount: number | null;
  /** ISO timestamp of the donation, or null on documents written before it was stored. */
  createdAt: string | null;
}
