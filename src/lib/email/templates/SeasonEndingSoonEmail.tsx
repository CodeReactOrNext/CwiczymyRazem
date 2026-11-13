import { Column, Row, Text } from "@react-email/components";
import {
  SEASON_FAME_REWARDS,
  SEASON_REWARD_PLACES,
} from "constants/seasonRewards";

import EmailLayout, {
  EmailButton,
  EmailCard,
  emailColors,
  EmailIntro,
  formatNumber,
  withName,
} from "./EmailLayout";

interface SeasonEndingSoonEmailProps {
  userName: string;
  /** Already formatted for readers, e.g. "November season". */
  seasonName: string;
  daysLeft: number;
  leaderboardUrl: string;
  logoUrl: string;
  /** The email tab of Settings, linked from the footer. */
  preferencesUrl: string;
}

const NUMBER_WORDS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
];

export function seasonEndingSubject(
  seasonName: string,
  daysLeft: number,
): string {
  if (daysLeft <= 0) return `Last day of the ${seasonName}`;
  if (daysLeft === 1) return `The ${seasonName} ends tomorrow`;
  return `${daysLeft} days left in the ${seasonName}`;
}

interface Copy {
  preview: string;
  title: string;
  paragraph: string;
  big: string;
  /** "Today" is a word, so it gets a smaller size than a digit. */
  bigIsWord: boolean;
  label: string;
}

function buildCopy(daysLeft: number, userName: string): Copy {
  if (daysLeft <= 0) {
    return {
      preview: "The standings lock tonight.",
      title: withName("Last day of the season", userName),
      paragraph:
        "The standings lock tonight. One more session today could still move you up a place.",
      big: "Today",
      bigIsWord: true,
      label: "final hours",
    };
  }
  if (daysLeft === 1) {
    return {
      preview: "Today and tomorrow are your last two chances to climb.",
      title: withName("The season ends tomorrow", userName),
      paragraph:
        "Today and tomorrow are your last chances to move up the leaderboard before the standings lock.",
      big: "1",
      bigIsWord: false,
      label: "day left",
    };
  }
  const word = NUMBER_WORDS[daysLeft] ?? String(daysLeft);
  return {
    preview: "Every session from now on counts toward your final place.",
    title: withName(`${word} days left`, userName),
    paragraph:
      "The season closes at the end of the month. Every session until then counts toward your place on the leaderboard.",
    big: String(daysLeft),
    bigIsWord: false,
    label: "days left",
  };
}

export default function SeasonEndingSoonEmail({
  userName,
  seasonName,
  daysLeft,
  leaderboardUrl,
  logoUrl,
  preferencesUrl,
}: SeasonEndingSoonEmailProps) {
  const copy = buildCopy(daysLeft, userName);

  return (
    <EmailLayout
      preview={copy.preview}
      logoUrl={logoUrl}
      art='season-ending'
      preferencesUrl={preferencesUrl}
      reason={`You got this because you're playing in the ${seasonName}.`}>
      <EmailIntro eyebrow={seasonName} title={copy.title}>
        {copy.paragraph}
      </EmailIntro>

      <EmailCard>
        <Row>
          <Column style={{ width: "136px", verticalAlign: "middle" }}>
            <Text
              style={{
                margin: 0,
                fontSize: copy.bigIsWord ? "44px" : "64px",
                lineHeight: "64px",
                fontWeight: 800,
                letterSpacing: copy.bigIsWord ? "-0.03em" : "-0.04em",
                color: emailColors.amber,
              }}>
              {copy.big}
            </Text>
            <Text
              style={{
                margin: "4px 0 0",
                fontSize: "14px",
                lineHeight: "20px",
                fontWeight: 600,
                color: emailColors.text,
              }}>
              {copy.label}
            </Text>
          </Column>
          <Column style={{ verticalAlign: "middle", paddingLeft: "24px" }}>
            <Text
              style={{
                margin: 0,
                fontSize: "15px",
                lineHeight: "24px",
                color: emailColors.textMuted,
              }}>
              The top {SEASON_REWARD_PLACES} take home Fame when the season
              closes. 1st place pays {formatNumber(SEASON_FAME_REWARDS[0])}.
            </Text>
          </Column>
        </Row>
      </EmailCard>

      <EmailButton href={leaderboardUrl}>See the leaderboard</EmailButton>
    </EmailLayout>
  );
}
