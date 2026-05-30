export const EMAIL_COOLDOWN_DAYS = 7;
export const EMAIL_COOLDOWNS_COLLECTION = "emailCooldowns";

export type EmailCooldownType =
  | "welcome"
  | "streak_d1"
  | "streak_d3"
  | "season_start"
  | "season_ending_soon"
  | "season_results";

export type EmailCooldownData = Partial<Record<EmailCooldownType, string>>;

export function isOnEmailCooldown(
  cooldown: EmailCooldownData | null | undefined,
  type: EmailCooldownType,
  now: Date = new Date(),
  daysWindow: number = EMAIL_COOLDOWN_DAYS
): boolean {
  const lastStr = cooldown?.[type];
  if (typeof lastStr !== "string" || !lastStr) return false;
  const last = new Date(lastStr);
  if (isNaN(last.getTime())) return false;
  const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < daysWindow;
}

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
