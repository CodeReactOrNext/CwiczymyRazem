import { EMAIL_FROM, getResend } from "./client";
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

  const discordUrl =
    process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/6yJmsZW2Ne";

  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Welcome to Riff Quest, your journey starts now",
    react: WelcomeEmail({
      userName: userName ?? "",
      dashboardUrl: `${baseUrl}/dashboard`,
      logoUrl,
      discordUrl,
    }),
  });

  if (error) {
    console.error("[email] welcome send failed", { to, error });
    throw error;
  }

  return data;
}
