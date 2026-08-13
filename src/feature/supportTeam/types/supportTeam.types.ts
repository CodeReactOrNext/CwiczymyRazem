/** A user marked in the admin panel as a member of the support / staff team. */
export interface SupportTeamMember {
  uid: string;
  displayName: string;
  avatar: string | null;
  /** Custom badge label (e.g. "Moderator"). Falls back to "Support" when empty. */
  title: string | null;
}
