import { EMAIL_FROM, getResend } from "./client";
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
