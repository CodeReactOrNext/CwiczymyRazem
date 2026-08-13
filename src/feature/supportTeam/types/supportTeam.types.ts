/** A user marked in the admin panel as someone supporting the project with a donation. */
export interface SupportTeamMember {
  uid: string;
  displayName: string;
  avatar: string | null;
  /** Custom badge label (e.g. "Patron"). Falls back to "Supporter" when empty. */
  title: string | null;
}
