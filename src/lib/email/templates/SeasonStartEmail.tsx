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
import { placeSuffix, SEASON_FAME_REWARDS } from "constants/seasonRewards";

interface SeasonStartEmailProps {
  userName: string;
  seasonName: string;
  daysInSeason: number;
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
};

/** Read off the live ladder rather than retyped, so the email can never quote
 *  a payout the season no longer makes. Places past the fifth collapse into one
 *  row — the tail is flat, and ten rows would swamp the card. */
const DETAILED_PLACES = 5;

const rewards = [
  ...SEASON_FAME_REWARDS.slice(0, DETAILED_PLACES).map((fame, i) => ({
    place: `${i + 1}${placeSuffix(i + 1)} place`,
    fame: `${fame.toLocaleString()} fame`,
  })),
  ...(SEASON_FAME_REWARDS.length > DETAILED_PLACES
    ? [
        {
          place: `${DETAILED_PLACES + 1}${placeSuffix(DETAILED_PLACES + 1)}–${
            SEASON_FAME_REWARDS.length
          }${placeSuffix(SEASON_FAME_REWARDS.length)} place`,
          fame: `${SEASON_FAME_REWARDS[DETAILED_PLACES].toLocaleString()}–${SEASON_FAME_REWARDS[
            SEASON_FAME_REWARDS.length - 1
          ].toLocaleString()} fame`,
        },
      ]
    : []),
];

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
  color: colors.cyan,
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
  backgroundColor: "#0c1f22",
  borderRadius: "8px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const daysNumber = {
  fontSize: "64px",
  fontWeight: 900,
  color: colors.cyan,
  margin: 0,
  lineHeight: 1,
  letterSpacing: "-0.04em",
};

const daysLabel = {
  fontSize: "15px",
  fontWeight: 500,
  color: colors.textMuted,
  margin: "6px 0 0",
};

const rewardsBox = {
  backgroundColor: colors.goldBg,
  borderRadius: "8px",
  padding: "20px 20px 10px",
  margin: "0 0 28px",
};

const rewardsTitle = {
  fontSize: "13px",
  fontWeight: 600,
  color: colors.gold,
  margin: "0 0 12px",
};

const rewardRow = {
  display: "flex" as const,
  justifyContent: "space-between" as const,
  margin: "0 0 8px",
};

const rewardPlace = {
  fontSize: "13px",
  color: colors.textMuted,
  margin: 0,
};

const rewardFame = {
  fontSize: "13px",
  fontWeight: 700,
  color: colors.gold,
  margin: 0,
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

export default function SeasonStartEmail({
  userName,
  seasonName,
  daysInSeason,
  leaderboardUrl,
  logoUrl,
}: SeasonStartEmailProps) {
  const displayName = userName?.trim() || "Guitarist";

  return (
    <Html lang='en'>
      <Head />
      <Preview>
        {`${seasonName} has started — ${daysInSeason} days to climb the leaderboard`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} alt='Riff Quest' width='160' />
          </Section>

          <Section style={card}>
            <Text style={eyebrow}>New season</Text>
            <Heading style={heading}>
              {seasonName} is live, {displayName}
            </Heading>
            <Text style={paragraph}>
              The competition is open. You have {daysInSeason} days to practice,
              earn points, and climb the leaderboard. The top{" "}
              {SEASON_FAME_REWARDS.length} players at the end of the season take
              home fame rewards.
            </Text>

            <Section style={daysHero}>
              <Text style={daysNumber}>{daysInSeason}</Text>
              <Text style={daysLabel}>days in this season</Text>
            </Section>

            <Section style={rewardsBox}>
              <Text style={rewardsTitle}>Season rewards</Text>
              {rewards.map((r) => (
                <Section key={r.place} style={rewardRow}>
                  <Text style={rewardPlace}>{r.place}</Text>
                  <Text style={rewardFame}>{r.fame}</Text>
                </Section>
              ))}
            </Section>

            <Section style={buttonWrap}>
              <Button href={leaderboardUrl} style={ctaButton}>
                Go to leaderboard
              </Button>
            </Section>
          </Section>

          <Text style={footer}>
            You received this because you participated in the previous season.
            <br />
            Riff Quest. Practice. Progress. Play.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
