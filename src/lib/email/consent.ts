import type {
  EmailConsent,
  EmailNotificationPreferences,
} from "types/api.types";

/** The optional emails — everything that needs the player's consent. */
export type EmailCategory = keyof EmailNotificationPreferences;

export const EMAIL_CATEGORIES: EmailCategory[] = [
  "streakReminders",
  "seasonUpdates",
  "productUpdates",
];

/** The two fields of a user document (or the client's copy of it) this reads. */
export interface EmailConsentFields {
  emailConsent?: Pick<EmailConsent, "granted"> | null;
  emailNotifications?: Partial<EmailNotificationPreferences> | null;
}

/**
 * Whether this player may be sent this kind of optional email: they said yes
 * (on sign-up, in the prompt or in Settings) and have not turned this one off.
 * Someone who was never asked gets none — the cron, the admin sender and the
 * Settings toggles all go through here, so they cannot disagree.
 */
export const canSendEmail = (
  user: EmailConsentFields | null | undefined,
  category: EmailCategory,
): boolean =>
  user?.emailConsent?.granted === true &&
  user.emailNotifications?.[category] !== false;

/** The toggles as they actually behave: all off until the player agrees. */
export const effectiveEmailPreferences = (
  user: EmailConsentFields | null | undefined,
): EmailNotificationPreferences => ({
  streakReminders: canSendEmail(user, "streakReminders"),
  seasonUpdates: canSendEmail(user, "seasonUpdates"),
  productUpdates: canSendEmail(user, "productUpdates"),
});

/** Saving the toggles answers the question too: any one left on is a yes. */
export const isAnyEmailEnabled = (
  preferences: EmailNotificationPreferences,
): boolean => EMAIL_CATEGORIES.some((category) => preferences[category]);
