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

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
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
  cyanDark: "#0891b2",
  gold: "#f59e0b",
  goldBg: "#2a1d08",
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

const logo = {
  width: "200px",
  height: "auto",
  display: "inline-block",
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
  margin: "0 0 12px",
};

const heading = {
  fontSize: "30px",
  fontWeight: 800,
  margin: "0 0 16px",
  color: colors.text,
  lineHeight: "1.15",
  letterSpacing: "-0.02em",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "26px",
  color: colors.textMuted,
  margin: "0 0 16px",
};

const featureCard = {
  backgroundColor: colors.cardElevated,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "0 0 10px",
};

const featureTitle = {
  fontSize: "14px",
  fontWeight: 600,
  color: colors.text,
  margin: "0 0 4px",
};

const featureText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.textMuted,
  margin: 0,
};

const buttonWrap = {
  textAlign: "center" as const,
  margin: "32px 0 8px",
};

const ctaButton = {
  backgroundColor: colors.cyan,
  color: "#09090b",
  padding: "14px 32px",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "15px",
  textDecoration: "none",
  display: "inline-block",
};

const tipBox = {
  backgroundColor: colors.goldBg,
  borderRadius: "8px",
  padding: "16px 18px",
  margin: "24px 0 0",
};

const tipLabel = {
  fontSize: "13px",
  fontWeight: 700,
  color: colors.gold,
  margin: "0 0 4px",
};

const tipText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: colors.text,
  margin: 0,
};

const footer = {
  fontSize: "12px",
  color: colors.textDim,
  textAlign: "center" as const,
  marginTop: "28px",
  lineHeight: "18px",
};

const features = [
  {
    title: "Daily Quests",
    text: "Log your practice sessions and earn fame points for every minute you put in.",
  },
  {
    title: "Activity Tracker",
    text: "Watch your streak grow and visualise your consistency on the activity grid.",
  },
  {
    title: "Leaderboard And Seasons",
    text: "Compete with other guitarists and climb the ranks each season.",
  },
  {
    title: "Practice Plans And Skills",
    text: "Build structured routines and unlock skills as you master new techniques.",
  },
];

export default function WelcomeEmail({
  userName,
  dashboardUrl,
  logoUrl,
}: WelcomeEmailProps) {
  const displayName = userName?.trim() || "Guitarist";

  return (
    <Html lang="en">
      <Head />
      <Preview>
        Welcome to Riff Quest, your guitar journey starts now
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={logoUrl}
              alt="Riff Quest"
              width="200"
              style={logo}
            />
          </Section>

          <Section style={card}>
            <Text style={eyebrow}>Welcome Aboard</Text>
            <Heading style={heading}>
              Hey {displayName}, ready to level up?
            </Heading>

            <Text style={paragraph}>
              You just joined a community of guitarists who turn practice into
              progress. Track your sessions, earn fame, and watch your skills
              grow, one riff at a time.
            </Text>

            <Section style={{ margin: "28px 0 0" }}>
              {features.map((f) => (
                <Section key={f.title} style={featureCard}>
                  <Text style={featureTitle}>{f.title}</Text>
                  <Text style={featureText}>{f.text}</Text>
                </Section>
              ))}
            </Section>

            <Section style={buttonWrap}>
              <Button href={dashboardUrl} style={ctaButton}>
                Start your first quest
              </Button>
            </Section>

            <Section style={tipBox}>
              <Text style={tipLabel}>Pro Tip</Text>
              <Text style={tipText}>
                Short, consistent practice beats marathon sessions. Aim for 15
                minutes a day to start, your streak will thank you.
              </Text>
            </Section>
          </Section>

          <Text style={footer}>
            You received this email because you created a Riff Quest account.
            <br />
            Riff Quest. Practice. Progress. Play.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
