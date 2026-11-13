import { Column, Row, Text } from "@react-email/components";

import EmailLayout, {
  EmailButton,
  EmailCard,
  emailColors,
  EmailIntro,
  monoFont,
  withName,
} from "./EmailLayout";

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
  logoUrl: string;
  /** The email tab of Settings, linked from the footer. */
  preferencesUrl: string;
}

export const WELCOME_SUBJECT = "Your Riff Quest account is ready";

const steps = [
  {
    title: "Play something",
    text: "Pick an exercise or a song and start the timer. Ten minutes is enough.",
  },
  {
    title: "Save the session",
    text: "It goes into your log, with points for the time you put in.",
  },
  {
    title: "Come back tomorrow",
    text: "Days in a row build a streak. Fifteen minutes daily beats one long Sunday.",
  },
];

export default function WelcomeEmail({
  userName,
  dashboardUrl,
  logoUrl,
  preferencesUrl,
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview='Three things to do with your first ten minutes.'
      logoUrl={logoUrl}
      art='welcome'
      preferencesUrl={preferencesUrl}
      reason='You got this because you created a Riff Quest account.'>
      <EmailIntro title={withName("You're in", userName)}>
        Riff Quest keeps a record of what you practice, so you can see whether
        you&apos;re actually getting better. It&apos;s free, and it stays free.
      </EmailIntro>

      <EmailCard>
        {steps.map((step, i) => (
          <Row
            key={step.title}
            style={{ marginBottom: i < steps.length - 1 ? "24px" : 0 }}>
            <Column style={{ width: "40px", verticalAlign: "top" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: monoFont,
                  fontSize: "16px",
                  lineHeight: "24px",
                  fontWeight: 700,
                  color: emailColors.amber,
                }}>
                {i + 1}
              </Text>
            </Column>
            <Column style={{ verticalAlign: "top" }}>
              <Text
                style={{
                  margin: "0 0 4px",
                  fontSize: "16px",
                  lineHeight: "24px",
                  fontWeight: 600,
                  color: emailColors.text,
                }}>
                {step.title}
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: "24px",
                  color: emailColors.textMuted,
                }}>
                {step.text}
              </Text>
            </Column>
          </Row>
        ))}
      </EmailCard>

      <EmailButton href={dashboardUrl}>Start a session</EmailButton>
    </EmailLayout>
  );
}
