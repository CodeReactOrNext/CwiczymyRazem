import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type StreakEmailVariant = "d1" | "d3";

interface StreakReminderEmailProps {
  userName: string;
  streakDays: number;
  timerUrl: string;
  logoUrl: string;
  variant: StreakEmailVariant;
}

const colors = {
  bg: "#09090b",
  card: "#18181b",
  cardElevated: "#27272a",
  text: "#f4f4f5",
  textMuted: "#a1a1aa",
  textDim: "#71717a",
  cyan: "#22d3ee",
  red: "#ef4444",
  redBg: "#2a0a0a",
  redMuted: "#fca5a5",
  gold: "#f59e0b",
  goldBg: "#2a1d08",
  goldMuted: "#fde68a",
};

const main = {
  background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34, 211, 238, 0.10) 0%, rgba(34, 211, 238, 0) 60%), ${colors.bg}`,
  backgroundColor: colors.bg,
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: 0,
  padding: 0,
  color: colors.text,
};

const container = {
  maxWidth: "580px",
  margin: "0 auto",
  padding: "48px 24px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const card = {
  backgroundColor: colors.card,
  borderRadius: "8px",
  padding: "40px 36px",
};

const eyebrow = (color: string) => ({
  fontSize: "13px",
  fontWeight: 600,
  color,
  margin: "0 0 16px",
});

const heading = {
  fontSize: "26px",
  fontWeight: 800,
  margin: "0 0 12px",
  color: colors.text,
  lineHeight: "1.25",
  letterSpacing: "-0.02em",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "26px",
  color: colors.textMuted,
  margin: "0 0 28px",
};

// Hero streak block
const streakHero = (bgColor: string) => ({
  backgroundColor: bgColor,
  borderRadius: "8px",
  padding: "28px 24px",
  textAlign: "center" as const,
  margin: "0 0 24px",
});


const streakNumber = (color: string) => ({
  fontSize: "72px",
  fontWeight: 900,
  color,
  margin: 0,
  lineHeight: 1,
  letterSpacing: "-0.04em",
});

const streakUnit = (color: string) => ({
  fontSize: "16px",
  fontWeight: 600,
  color,
  margin: "6px 0 0",
  opacity: 0.8,
});

// Tip / motivational box
const tipBox = {
  backgroundColor: colors.cardElevated,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "0 0 28px",
  borderLeft: `3px solid ${colors.cyan}`,
};

const tipLabel = {
  fontSize: "12px",
  fontWeight: 700,
  color: colors.cyan,
  margin: "0 0 4px",
};

const tipText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.textMuted,
  margin: 0,
};

const buttonWrap = {
  textAlign: "center" as const,
  margin: "4px 0 0",
};

const ctaButton = (bgColor: string) => ({
  backgroundColor: bgColor,
  color: "#09090b",
  padding: "14px 36px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "15px",
  textDecoration: "none",
  display: "inline-block",
});

const footer = {
  fontSize: "12px",
  color: colors.textDim,
  textAlign: "center" as const,
  marginTop: "28px",
  lineHeight: "18px",
};

const d1Tips = [
  "Warm up with 5 minutes of chromatic exercises — your fingers will remember.",
  "Even one slow run through a chord progression counts as a session.",
  "Put the guitar in sight, not in the case. You'll pick it up.",
];

const d3Tips = [
  "Start with something you already know. Familiarity gets you back in the groove fast.",
  "A 10-minute session today is worth more than an hour next week.",
  "The hardest part is always picking up the guitar. After that, it plays itself.",
];

function pickTip(tips: string[], streakDays: number) {
  return tips[streakDays % tips.length];
}

export default function StreakReminderEmail({
  userName,
  streakDays,
  timerUrl,
  logoUrl,
  variant,
}: StreakReminderEmailProps) {
  const displayName = userName?.trim() || "Guitarist";
  const days = streakDays ?? 0;
  const isD1 = variant === "d1";

  const accentColor = isD1 ? colors.red : colors.gold;
  const accentBg = isD1 ? colors.redBg : colors.goldBg;
  const accentMuted = isD1 ? colors.redMuted : colors.goldMuted;

  const previewText = isD1
    ? `🔥 Your ${days}-day streak ends at midnight — one session saves it`
    : `Hey ${displayName}, it's been 3 days. Time to play something.`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} alt="Riff Quest" width="160" />
          </Section>

          <Section style={card}>
            {isD1 ? (
              <>
                <Text style={eyebrow(accentColor)}>Streak at risk</Text>
                <Heading style={heading}>
                  {displayName}, your streak ends at midnight
                </Heading>
                <Text style={paragraph}>
                  You&apos;ve built something real. Don&apos;t let one missed day
                  reset it — a single session today is all it takes.
                </Text>

                <Section style={streakHero(accentBg)}>
                  <Text style={streakNumber(accentMuted)}>{days}</Text>
                  <Text style={streakUnit(accentMuted)}>
                    day{days !== 1 ? "s" : ""} strong
                  </Text>
                </Section>

                <Section style={tipBox}>
                  <Text style={tipLabel}>Quick start</Text>
                  <Text style={tipText}>{pickTip(d1Tips, days)}</Text>
                </Section>

                <Section style={buttonWrap}>
                  <Button href={timerUrl} style={ctaButton(colors.cyan)}>
                    Save my streak now
                  </Button>
                </Section>
              </>
            ) : (
              <>
                <Text style={eyebrow(accentColor)}>We miss you</Text>
                <Heading style={heading}>
                  Hey {displayName}, time to pick up the guitar again
                </Heading>
                <Text style={paragraph}>
                  It&apos;s been 3 days. Your streak is gone — but the muscle
                  memory isn&apos;t. Come back with one session and start fresh.
                  Every guitarist has off days.
                </Text>

                <Section style={streakHero(accentBg)}>
                  <Text style={streakNumber(accentMuted)}>3</Text>
                  <Text style={streakUnit(accentMuted)}>days away</Text>
                </Section>

                <Section style={tipBox}>
                  <Text style={tipLabel}>Get back in</Text>
                  <Text style={tipText}>{pickTip(d3Tips, days)}</Text>
                </Section>

                <Section style={buttonWrap}>
                  <Button href={timerUrl} style={ctaButton(accentColor)}>
                    Jump back in
                  </Button>
                </Section>
              </>
            )}
          </Section>

          <Text style={footer}>
            You received this because you have a Riff Quest account.
            <br />
            Riff Quest. Practice. Progress. Play.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
