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

interface SeasonEndingSoonEmailProps {
  userName: string;
  seasonName: string;
  daysLeft: number;
  leaderboardUrl: string;
  logoUrl: string;
}

const colors = {
  bg: "#09090b",
  card: "#18181b",
  text: "#f4f4f5",
  textMuted: "#a1a1aa",
  textDim: "#71717a",
  cyan: "#22d3ee",
  red: "#ef4444",
  redBg: "#2a0a0a",
  redMuted: "#fca5a5",
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

const eyebrow = {
  fontSize: "13px",
  fontWeight: 600,
  color: colors.red,
  margin: "0 0 16px",
};

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

const daysHero = {
  backgroundColor: colors.redBg,
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "0 0 28px",
};

const daysNumberBig = {
  fontSize: "72px",
  fontWeight: 900,
  color: colors.redMuted,
  margin: 0,
  lineHeight: 1,
  letterSpacing: "-0.04em",
};

const daysNumberWord = {
  fontSize: "44px",
  fontWeight: 900,
  color: colors.redMuted,
  margin: 0,
  lineHeight: 1.05,
  letterSpacing: "-0.03em",
};

const daysLabel = {
  fontSize: "15px",
  fontWeight: 500,
  color: colors.redMuted,
  margin: "6px 0 0",
  opacity: 0.8,
};

const buttonWrap = {
  textAlign: "center" as const,
};

const ctaButton = {
  backgroundColor: colors.cyan,
  color: "#09090b",
  padding: "14px 36px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "15px",
  textDecoration: "none",
  display: "inline-block",
};

const footer = {
  fontSize: "12px",
  color: colors.textDim,
  textAlign: "center" as const,
  marginTop: "28px",
  lineHeight: "18px",
};

interface Copy {
  preview: string;
  eyebrow: string;
  heading: string;
  paragraph: string;
  heroNumber: string;
  heroLabel: string;
  heroNumberAsWord: boolean;
}

function buildCopy(daysLeft: number, displayName: string, seasonName: string): Copy {
  if (daysLeft <= 0) {
    return {
      preview: `${seasonName} ends today — last chance`,
      eyebrow: "Final hours",
      heading: `${displayName}, the season ends today`,
      paragraph: `${seasonName} closes today. Last chance to push your spot on the leaderboard — every minute counts.`,
      heroNumber: "TODAY",
      heroLabel: "season ends",
      heroNumberAsWord: true,
    };
  }
  if (daysLeft === 1) {
    return {
      preview: `${seasonName} ends tomorrow`,
      eyebrow: "1 day left",
      heading: `${displayName}, the season ends tomorrow`,
      paragraph: `${seasonName} closes tomorrow. This is the last day to climb — top 5 take home fame rewards.`,
      heroNumber: "1",
      heroLabel: "day remaining",
      heroNumberAsWord: false,
    };
  }
  return {
    preview: `${daysLeft} days left in ${seasonName}`,
    eyebrow: `${daysLeft} days left`,
    heading: `${displayName}, the season ends in ${daysLeft} days`,
    paragraph: `${seasonName} closes in ${daysLeft} days. This is your final push — every session counts toward the leaderboard. The top 5 take home fame rewards at the end.`,
    heroNumber: String(daysLeft),
    heroLabel: "days remaining",
    heroNumberAsWord: false,
  };
}

export default function SeasonEndingSoonEmail({
  userName,
  seasonName,
  daysLeft,
  leaderboardUrl,
  logoUrl,
}: SeasonEndingSoonEmailProps) {
  const displayName = userName?.trim() || "Guitarist";
  const copy = buildCopy(daysLeft, displayName, seasonName);

  return (
    <Html lang="en">
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} alt="Riff Quest" width="160" />
          </Section>

          <Section style={card}>
            <Text style={eyebrow}>{copy.eyebrow}</Text>
            <Heading style={heading}>{copy.heading}</Heading>
            <Text style={paragraph}>{copy.paragraph}</Text>

            <Section style={daysHero}>
              <Text style={copy.heroNumberAsWord ? daysNumberWord : daysNumberBig}>
                {copy.heroNumber}
              </Text>
              <Text style={daysLabel}>{copy.heroLabel}</Text>
            </Section>

            <Section style={buttonWrap}>
              <Button href={leaderboardUrl} style={ctaButton}>
                See leaderboard
              </Button>
            </Section>
          </Section>

          <Text style={footer}>
            You received this because you are participating in {seasonName}.
            <br />
            Riff Quest. Practice. Progress. Play.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
