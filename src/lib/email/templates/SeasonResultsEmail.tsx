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

interface SeasonResultsEmailProps {
  userName: string;
  seasonName: string;
  userPlace: number | null;
  userPoints: number;
  fameEarned: number | null;
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

const resultHero = (bgColor: string) => ({
  backgroundColor: bgColor,
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "0 0 24px",
});

const resultPlace = (color: string) => ({
  fontSize: "64px",
  fontWeight: 900,
  color,
  margin: 0,
  lineHeight: 1,
  letterSpacing: "-0.04em",
});

const resultLabel = (color: string) => ({
  fontSize: "14px",
  fontWeight: 500,
  color,
  margin: "6px 0 0",
  opacity: 0.8,
});

const fameBox = {
  backgroundColor: colors.goldBg,
  borderRadius: "8px",
  padding: "16px 20px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const fameLabel = {
  fontSize: "12px",
  color: colors.gold,
  fontWeight: 600,
  margin: "0 0 4px",
};

const fameValue = {
  fontSize: "28px",
  fontWeight: 800,
  color: colors.goldMuted,
  margin: 0,
  lineHeight: 1,
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

const playerPlaceText = {
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

const ordinal = (n: number) => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

const placesList = ["1st", "2nd", "3rd"];

export default function SeasonResultsEmail({
  userName,
  seasonName,
  userPlace,
  userPoints,
  fameEarned,
  top3,
  leaderboardUrl,
  logoUrl,
}: SeasonResultsEmailProps) {
  const displayName = userName?.trim() || "Guitarist";
  const isTopFive = userPlace !== null && userPlace <= 5;
  const accentColor = isTopFive ? colors.gold : colors.cyan;
  const heroBg = isTopFive ? colors.goldBg : "#0c1920";
  const heroTextColor = isTopFive ? colors.goldMuted : colors.cyan;

  const previewText = isTopFive
    ? `You finished ${ordinal(userPlace!)} in ${seasonName} — well done`
    : `${seasonName} is over — see how you did`;

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
            <Text style={eyebrow(accentColor)}>Season over</Text>

            {isTopFive ? (
              <>
                <Heading style={heading}>
                  You finished in the top 5, {displayName}
                </Heading>
                <Text style={paragraph}>
                  {seasonName} is done. You placed {ordinal(userPlace!)} with{" "}
                  {userPoints.toLocaleString()} points — that puts you in the
                  top 5 and earns you fame rewards.
                </Text>

                <Section style={resultHero(heroBg)}>
                  <Text style={resultPlace(heroTextColor)}>
                    {ordinal(userPlace!)}
                  </Text>
                  <Text style={resultLabel(heroTextColor)}>
                    final placement
                  </Text>
                </Section>

                {fameEarned !== null && (
                  <Section style={fameBox}>
                    <Text style={fameLabel}>Fame earned</Text>
                    <Text style={fameValue}>+{fameEarned}</Text>
                  </Section>
                )}
              </>
            ) : (
              <>
                <Heading style={heading}>
                  {seasonName} is over, {displayName}
                </Heading>
                <Text style={paragraph}>
                  You finished with {userPoints.toLocaleString()} points
                  {userPlace !== null ? `, placing ${ordinal(userPlace)}` : ""}
                  . A new season starts tomorrow — come back and go further.
                </Text>

                <Section style={resultHero(heroBg)}>
                  <Text style={resultPlace(heroTextColor)}>
                    {userPoints.toLocaleString()}
                  </Text>
                  <Text style={resultLabel(heroTextColor)}>points this season</Text>
                </Section>
              </>
            )}

            {top3.length > 0 && (
              <Section style={standingsBox}>
                <Text style={standingsTitle}>Final top 3</Text>
                {top3.map((player, idx) => (
                  <Section key={idx} style={playerRow}>
                    <Text style={playerPlaceText}>{placesList[idx]}</Text>
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
                {isTopFive ? "See final results" : "Start next season"}
              </Button>
            </Section>
          </Section>

          <Text style={footer}>
            You received this because you participated in {seasonName}.
            <br />
            Riff Quest. Practice. Progress. Play.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
