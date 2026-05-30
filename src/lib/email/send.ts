import { EMAIL_FROM, getResend } from "./client";
import SeasonEndingSoonEmail from "./templates/SeasonEndingSoonEmail";
import SeasonResultsEmail from "./templates/SeasonResultsEmail";
import SeasonStartEmail from "./templates/SeasonStartEmail";
import StreakReminderEmail, {
  type StreakEmailVariant,
} from "./templates/StreakReminderEmail";
import WelcomeEmail from "./templates/WelcomeEmail";

interface SendWelcomeArgs {
  to: string;
  userName?: string | null;
}

export async function sendWelcomeEmail({ to, userName }: SendWelcomeArgs) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://riffquest.com";

  const logoUrl =
    process.env.EMAIL_LOGO_URL ??
    "https://riff.quest/images/longlightlogo.png";

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Welcome to Riff Quest, your journey starts now",
    react: WelcomeEmail({
      userName: userName ?? "",
      dashboardUrl: `${baseUrl}/dashboard`,
      logoUrl,
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
  userName?: string | null;
  streakDays: number;
  variant: StreakEmailVariant;
}

export async function sendStreakReminderEmail({
  to,
  userName,
  streakDays,
  variant,
}: SendStreakReminderArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riffquest.com";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ??
    "https://riff.quest/images/longlightlogo.png";

  const subjects: Record<StreakEmailVariant, string> = {
    d1: `Your ${streakDays}-day streak ends tonight — practice now`,
    d3: "It's been 3 days. Time to pick up the guitar again",
  };

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: subjects[variant],
    react: StreakReminderEmail({
      userName: userName ?? "",
      streakDays,
      timerUrl: `${baseUrl}/dashboard`,
      logoUrl,
      variant,
    }),
  });

  if (error) {
    console.error("[email] streak reminder send failed", { to, variant, error });
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
  userName?: string | null;
  seasonName: string;
  daysInSeason: number;
}

export async function sendSeasonStartEmail({
  to,
  userName,
  seasonName,
  daysInSeason,
}: SendSeasonStartArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riffquest.com";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${seasonName} has started — compete for the top 5`,
    react: SeasonStartEmail({
      userName: userName ?? "",
      seasonName,
      daysInSeason,
      leaderboardUrl: `${baseUrl}/leadboard`,
      logoUrl,
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
  userName?: string | null;
  seasonName: string;
  daysLeft: number;
  top3: TopPlayer[];
}

function endingSoonSubject(seasonName: string, daysLeft: number): string {
  if (daysLeft <= 0) return `Final hours of ${seasonName} — last chance`;
  if (daysLeft === 1) return `${seasonName} ends tomorrow — final push`;
  return `${daysLeft} days left in ${seasonName} — make your final push`;
}

export async function sendSeasonEndingSoonEmail({
  to,
  userName,
  seasonName,
  daysLeft,
  top3,
}: SendSeasonEndingSoonArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riffquest.com";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: endingSoonSubject(seasonName, daysLeft),
    react: SeasonEndingSoonEmail({
      userName: userName ?? "",
      seasonName,
      daysLeft,
      top3,
      leaderboardUrl: `${baseUrl}/leadboard`,
      logoUrl,
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
  userName?: string | null;
  seasonName: string;
  userPlace: number | null;
  userPoints: number;
  fameEarned: number | null;
  top3: TopPlayer[];
}

export async function sendSeasonResultsEmail({
  to,
  userName,
  seasonName,
  userPlace,
  userPoints,
  fameEarned,
  top3,
}: SendSeasonResultsArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://riffquest.com";
  const logoUrl =
    process.env.EMAIL_LOGO_URL ?? "https://riff.quest/images/longlightlogo.png";

  const subject =
    userPlace !== null && userPlace <= 5
      ? `You finished top 5 in ${seasonName}`
      : `${seasonName} is over — see your results`;

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    react: SeasonResultsEmail({
      userName: userName ?? "",
      seasonName,
      userPlace,
      userPoints,
      fameEarned,
      top3,
      leaderboardUrl: `${baseUrl}/leadboard`,
      logoUrl,
    }),
  });

  if (error) {
    console.error("[email] season results send failed", { to, error });
    throw error;
  }

  return data;
}
