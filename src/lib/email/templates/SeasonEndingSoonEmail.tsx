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

interface TopPlayer {
  displayName: string;
  points: number;
}

interface SeasonEndingSoonEmailProps {
  userName: string;
  seasonName: string;
  top3: TopPlayer[];
  leaderboardUrl: string;
  logoUrl: string;
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
  margin: "0 0 24px",
};

const daysNumber = {
  fontSize: "72px",
  fontWeight: 900,
  color: colors.redMuted,
  margin: 0,
  lineHeight: 1,
  letterSpacing: "-0.04em",
};

const daysLabel = {
  fontSize: "15px",
  fontWeight: 500,
  color: colors.redMuted,
  margin: "6px 0 0",
  opacity: 0.8,
};

const standingsBox = {
  backgroundColor: colors.cardElevated,
  borderRadius: "8px",
  padding: "20px",
  margin: "0 0 28px",
};

const standingsTitle = {
  fontSize: "13px",
  fontWeight: 600,
  color: colors.textMuted,
  margin: "0 0 14px",
};

const playerRow = {
  margin: "0 0 10px",
};

const playerPlace = {
  fontSize: "12px",
  fontWeight: 700,
  color: colors.textDim,
  margin: "0 0 2px",
};

const playerName = {
  fontSize: "14px",
  fontWeight: 600,
  color: colors.text,
  margin: 0,
};

const playerPoints = {
  fontSize: "12px",
  color: colors.textMuted,
  margin: "2px 0 0",
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

const places = ["1st", "2nd", "3rd"];

export default function SeasonEndingSoonEmail({
  userName,
  seasonName,
  top3,
  leaderboardUrl,
  logoUrl,
}: SeasonEndingSoonEmailProps) {
  const displayName = userName?.trim() || "Guitarist";

  return (
    <Html lang="en">
      <Head />
      <Preview>
        7 days left in {seasonName} — make your final push
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} alt="Riff Quest" width="160" />
          </Section>

          <Section style={card}>
            <Text style={eyebrow}>7 days left</Text>
            <Heading style={heading}>
              {displayName}, the season ends in a week
            </Heading>
            <Text style={paragraph}>
              {seasonName} closes in 7 days. This is your final push — every
              session counts toward the leaderboard. The top 5 take home fame
              rewards at the end.
            </Text>

            <Section style={daysHero}>
              <Text style={daysNumber}>7</Text>
              <Text style={daysLabel}>days remaining</Text>
            </Section>

            {top3.length > 0 && (
              <Section style={standingsBox}>
                <Text style={standingsTitle}>Current standings</Text>
                {top3.map((player, idx) => (
                  <Section key={idx} style={playerRow}>
                    <Text style={playerPlace}>{places[idx]}</Text>
                    <Text style={playerName}>{player.displayName}</Text>
                    <Text style={playerPoints}>
                      {player.points.toLocaleString()} pts
                    </Text>
                  </Section>
                ))}
              </Section>
            )}

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
