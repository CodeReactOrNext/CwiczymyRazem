import { Column, Row, Section, Text } from "@react-email/components";

import EmailLayout, {
  EmailButton,
  EmailCard,
  emailColors,
  EmailIntro,
  EmailNote,
  monoFont,
  withName,
} from "./EmailLayout";

export type StreakEmailVariant = "d1" | "d3";

interface StreakReminderEmailProps {
  userName: string;
  streakDays: number;
  timerUrl: string;
  logoUrl: string;
  /** The email tab of Settings, linked from the footer. */
  preferencesUrl: string;
  variant: StreakEmailVariant;
  /** Hours before the streak dies, in the reader's own timezone. */
  hoursLeft?: number | null;
}

/**
 * The deadline as the reader experiences it. "at midnight" is only technically
 * true and reads as "hours away" to someone opening the mail in their evening,
 * so a concrete hour count goes in whenever the timezone is known.
 */
export function formatHoursLeft(hoursLeft?: number | null): string {
  if (
    typeof hoursLeft !== "number" ||
    !Number.isFinite(hoursLeft) ||
    hoursLeft <= 0
  ) {
    return "tonight";
  }
  return hoursLeft === 1 ? "in 1 hour" : `in ${hoursLeft} hours`;
}

const streakLine = (days: number) =>
  days === 1 ? "You played yesterday" : `${days} days in a row`;

export function streakSubject(
  variant: StreakEmailVariant,
  streakDays: number,
  userName?: string | null,
): string {
  if (variant === "d3") {
    const name = userName?.trim();
    return name
      ? `Three days without the guitar, ${name}`
      : "Three days without the guitar";
  }
  return `${streakLine(streakDays)}. Today isn't logged yet.`;
}

const d1Tips = [
  "Short on time? One slow run through a chord progression counts as a session.",
  "Short on time? Five minutes of chromatic warm-up still counts, and your fingers will remember.",
  "Put the guitar where you can see it, not in the case. You'll pick it up.",
];

const d3Tips = [
  "Start with something you already know. Familiar material gets your hands back in the groove fast, and ten minutes still counts.",
  "A ten-minute session today is worth more than an hour next week.",
  "The hardest part is picking up the guitar. After that, it mostly plays itself.",
];

const pickTip = (tips: string[], streakDays: number) =>
  tips[Math.abs(streakDays) % tips.length];

/** Cells in the "last 14 days" strip, today included. */
const STRIP_DAYS = 14;

/**
 * The last two weeks as the streak implies them: the days the streak covers
 * are filled, older ones are empty, and today is an outline still waiting.
 * We only know the streak length here, not the full history, so a day before
 * the streak is shown empty even if the reader played it.
 */
function StreakStrip({ streakDays }: { streakDays: number }) {
  const cells = Array.from({ length: STRIP_DAYS }, (_, i) => {
    const daysAgo = STRIP_DAYS - 1 - i;
    if (daysAgo === 0) return "today" as const;
    return daysAgo <= streakDays ? ("played" as const) : ("empty" as const);
  });

  return (
    <Row>
      {cells.map((cell, i) => (
        <Column
          key={i}
          style={{
            paddingLeft: i === 0 ? 0 : "3px",
            paddingRight: i === STRIP_DAYS - 1 ? 0 : "3px",
          }}>
          <div
            style={{
              height: "32px",
              borderRadius: "4px",
              boxSizing: "border-box",
              backgroundColor:
                cell === "played"
                  ? emailColors.amber
                  : cell === "empty"
                    ? emailColors.cardRaised
                    : "transparent",
              border:
                cell === "today"
                  ? `2px dashed ${emailColors.amber}`
                  : undefined,
            }}
          />
        </Column>
      ))}
    </Row>
  );
}

const stripLabel = {
  margin: "12px 0 0",
  fontFamily: monoFont,
  fontSize: "12px",
  lineHeight: "18px",
  color: emailColors.textDim,
};

export default function StreakReminderEmail({
  userName,
  streakDays,
  timerUrl,
  logoUrl,
  preferencesUrl,
  variant,
  hoursLeft = null,
}: StreakReminderEmailProps) {
  const days = streakDays ?? 0;
  const deadline = formatHoursLeft(hoursLeft);
  const reason = "You got this because streak reminders are on.";

  if (variant === "d3") {
    return (
      <EmailLayout
        preview="The streak is gone. The muscle memory isn't."
        logoUrl={logoUrl}
        art='streak-d3'
        preferencesUrl={preferencesUrl}
        reason={reason}>
        <EmailIntro title='Your guitar has been in its case for three days.'>
          The streak is gone, but the muscle memory isn&apos;t. One session
          today starts a new one. Every guitarist has weeks like this.
        </EmailIntro>

        <EmailCard>
          <Text
            style={{
              margin: "0 0 8px",
              fontSize: "13px",
              lineHeight: "20px",
              fontWeight: 600,
              color: emailColors.amber,
            }}>
            The easy way back
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: "16px",
              lineHeight: "26px",
              color: emailColors.text,
            }}>
            {pickTip(d3Tips, days)}
          </Text>
        </EmailCard>

        <EmailButton href={timerUrl}>Jump back in</EmailButton>
      </EmailLayout>
    );
  }

  return (
    <EmailLayout
      preview={`Your day ends ${deadline}. One session keeps it going.`}
      logoUrl={logoUrl}
      art='streak-d1'
      preferencesUrl={preferencesUrl}
      reason={reason}>
      <EmailIntro
        title={`${withName(streakLine(days), userName)} Today is still empty.`}>
        Your day ends {deadline}. One session before then keeps the streak
        going.
      </EmailIntro>

      <EmailCard>
        <Section style={{ marginBottom: "20px" }}>
          <Text style={{ margin: 0 }}>
            <span
              style={{
                fontSize: "64px",
                lineHeight: "64px",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: emailColors.amber,
              }}>
              {days}
            </span>
            <span
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                fontWeight: 600,
                color: emailColors.text,
                paddingLeft: "12px",
              }}>
              day streak
            </span>
          </Text>
        </Section>
        <StreakStrip streakDays={days} />
        <Row>
          <Column>
            <Text style={stripLabel}>last {STRIP_DAYS} days</Text>
          </Column>
          <Column align='right'>
            <Text style={{ ...stripLabel, color: emailColors.amber }}>
              today
            </Text>
          </Column>
        </Row>
      </EmailCard>

      <EmailButton href={timerUrl}>Practice now</EmailButton>

      <EmailNote>{pickTip(d1Tips, days)}</EmailNote>
    </EmailLayout>
  );
}
