import { EMAIL_FROM, getResend } from "./client";
import { formatSeasonName } from "./seasonName";
import SeasonEndingSoonEmail, {
  seasonEndingSubject,
} from "./templates/SeasonEndingSoonEmail";
import SeasonResultsEmail, {
  seasonResultsSubject,
} from "./templates/SeasonResultsEmail";
import SeasonStartEmail, {
  seasonStartSubject,
} from "./templates/SeasonStartEmail";
import StreakReminderEmail, {
  type StreakEmailVariant,
  streakSubject,
} from "./templates/StreakReminderEmail";
import WelcomeEmail, { WELCOME_SUBJECT } from "./templates/WelcomeEmail";
import { unsubscribeHeaders } from "./unsubscribe";

// Every email links here from its footer: the Settings tab with the toggles.
const preferencesUrlFor = (baseUrl: string) =>
  `${baseUrl}/settings?tab=notifications`;

interface SendWelcomeArgs {
  to: string;
  userName?: string | null;
}

export async function sendWelcomeEmail({ to, userName }: SendWelcomeArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest";

  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: WELCOME_SUBJECT,
    react: WelcomeEmail({
      userName: userName ?? "",
      dashboardUrl: `${baseUrl}/dashboard`,
      logoUrl,
      preferencesUrl: preferencesUrlFor(baseUrl),
    }),
  });

  if (error) {
    console.error("[email] welcome send failed", { to, error });
    throw error;
  }

  return data;
}

interface SendStreakReminderArgs {
  to: string;
  /** Signs the one-click unsubscribe link; without it only the footer link is offered. */
  uid?: string;
  userName?: string | null;
  streakDays: number;
  /**
   * Hours before the streak actually dies, in the recipient's own timezone.
   * Null when their zone is unknown — the copy then falls back to "tonight"
   * rather than quoting a deadline computed from the server's clock.
   */
  hoursLeft?: number | null;
  variant: StreakEmailVariant;
}

export async function sendStreakReminderEmail({
  to,
  uid,
  userName,
  streakDays,
  hoursLeft = null,
  variant,
}: SendStreakReminderArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: streakSubject(variant, streakDays, userName),
    headers: unsubscribeHeaders(uid, "streakReminders", baseUrl),
    react: StreakReminderEmail({
      userName: userName ?? "",
      streakDays,
      hoursLeft,
      timerUrl: `${baseUrl}/dashboard`,
      logoUrl,
      preferencesUrl: preferencesUrlFor(baseUrl),
      variant,
    }),
  });

  if (error) {
    console.error("[email] streak reminder send failed", {
      to,
      variant,
      error,
    });
    throw error;
  }

  return data;
}

// --- Season emails ---

interface TopPlayer {
  displayName: string;
  points: number;
}

interface SendSeasonStartArgs {
  to: string;
  /** Signs the one-click unsubscribe link; without it only the footer link is offered. */
  uid?: string;
  userName?: string | null;
  seasonName: string;
  daysInSeason: number;
}

export async function sendSeasonStartEmail({
  to,
  uid,
  userName,
  seasonName,
  daysInSeason,
}: SendSeasonStartArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const season = formatSeasonName(seasonName);

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: seasonStartSubject(season),
    headers: unsubscribeHeaders(uid, "seasonUpdates", baseUrl),
    react: SeasonStartEmail({
      userName: userName ?? "",
      seasonName: season,
      daysInSeason,
      leaderboardUrl: `${baseUrl}/leaderboard`,
      logoUrl,
      preferencesUrl: preferencesUrlFor(baseUrl),
    }),
  });

  if (error) {
    console.error("[email] season start send failed", { to, error });
    throw error;
  }

  return data;
}

interface SendSeasonEndingSoonArgs {
  to: string;
  /** Signs the one-click unsubscribe link; without it only the footer link is offered. */
  uid?: string;
  userName?: string | null;
  seasonName: string;
  daysLeft: number;
}

export async function sendSeasonEndingSoonEmail({
  to,
  uid,
  userName,
  seasonName,
  daysLeft,
}: SendSeasonEndingSoonArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const season = formatSeasonName(seasonName);

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: seasonEndingSubject(season, daysLeft),
    headers: unsubscribeHeaders(uid, "seasonUpdates", baseUrl),
    react: SeasonEndingSoonEmail({
      userName: userName ?? "",
      seasonName: season,
      daysLeft,
      leaderboardUrl: `${baseUrl}/leaderboard`,
      logoUrl,
      preferencesUrl: preferencesUrlFor(baseUrl),
    }),
  });

  if (error) {
    console.error("[email] season ending soon send failed", { to, error });
    throw error;
  }

  return data;
}

interface SendSeasonResultsArgs {
  to: string;
  /** Signs the one-click unsubscribe link; without it only the footer link is offered. */
  uid?: string;
  userName?: string | null;
  seasonName: string;
  userPlace: number | null;
  userPoints: number;
  fameEarned: number | null;
  top3: TopPlayer[];
  /** Points of the last rewarded place, quoted to readers below it. */
  lastRewardedPoints?: number | null;
}

export async function sendSeasonResultsEmail({
  to,
  uid,
  userName,
  seasonName,
  userPlace,
  userPoints,
  fameEarned,
  top3,
  lastRewardedPoints = null,
}: SendSeasonResultsArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riff.quest";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const season = formatSeasonName(seasonName);

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: seasonResultsSubject(season, userPlace),
    headers: unsubscribeHeaders(uid, "seasonUpdates", baseUrl),
    react: SeasonResultsEmail({
      userName: userName ?? "",
      seasonName: season,
      userPlace,
      userPoints,
      fameEarned,
      top3,
      lastRewardedPoints,
      leaderboardUrl: `${baseUrl}/leaderboard`,
      practiceUrl: `${baseUrl}/dashboard`,
      logoUrl,
      preferencesUrl: preferencesUrlFor(baseUrl),
    }),
  });

  if (error) {
    console.error("[email] season results send failed", { to, error });
    throw error;
  }

  return data;
}
