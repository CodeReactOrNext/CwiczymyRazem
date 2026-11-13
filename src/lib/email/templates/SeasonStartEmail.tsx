import { Column, Row, Text } from "@react-email/components";
import {
  placeSuffix,
  SEASON_FAME_REWARDS,
  SEASON_REWARD_PLACES,
} from "constants/seasonRewards";

import EmailLayout, {
  EmailButton,
  EmailCard,
  emailColors,
  EmailIntro,
  formatNumber,
  monoFont,
  withName,
} from "./EmailLayout";

interface SeasonStartEmailProps {
  userName: string;
  /** Already formatted for readers, e.g. "November season". */
  seasonName: string;
  daysInSeason: number;
  leaderboardUrl: string;
  logoUrl: string;
  /** The email tab of Settings, linked from the footer. */
  preferencesUrl: string;
}

export const seasonStartSubject = (seasonName: string) =>
  `The ${seasonName} starts today`;

/** Read off the live ladder rather than retyped, so the email can never quote
 *  a payout the season no longer makes. Places past the fifth collapse into one
 *  row — the tail is flat, and ten rows would swamp the card. */
const DETAILED_PLACES = 5;

const rewards = [
  ...SEASON_FAME_REWARDS.slice(0, DETAILED_PLACES).map((fame, i) => ({
    place: `${i + 1}${placeSuffix(i + 1)} place`,
    fame: `${formatNumber(fame)} Fame`,
    tail: false,
  })),
  ...(SEASON_FAME_REWARDS.length > DETAILED_PLACES
    ? [
        {
          place: `${DETAILED_PLACES + 1}${placeSuffix(DETAILED_PLACES + 1)}–${
            SEASON_FAME_REWARDS.length
          }${placeSuffix(SEASON_FAME_REWARDS.length)} place`,
          fame: `${formatNumber(SEASON_FAME_REWARDS[DETAILED_PLACES])}–${formatNumber(
            SEASON_FAME_REWARDS[SEASON_FAME_REWARDS.length - 1],
          )} Fame`,
          tail: true,
        },
      ]
    : []),
];

export default function SeasonStartEmail({
  userName,
  seasonName,
  daysInSeason,
  leaderboardUrl,
  logoUrl,
  preferencesUrl,
}: SeasonStartEmailProps) {
  return (
    <EmailLayout
      preview={`${daysInSeason} days, everyone from zero. The top ${SEASON_REWARD_PLACES} take home Fame.`}
      logoUrl={logoUrl}
      art='season-start'
      preferencesUrl={preferencesUrl}
      reason='You got this because you played in the previous season.'>
      <EmailIntro
        eyebrow={`${seasonName} · ${daysInSeason} days`}
        title={withName("A new season starts today", userName)}>
        Everyone starts from zero. Every minute you practice this month earns
        points, and the top {SEASON_REWARD_PLACES} at the end take home Fame.
      </EmailIntro>

      <EmailCard padding='20px 28px'>
        <Text
          style={{
            margin: "0 0 8px",
            paddingTop: "4px",
            fontSize: "13px",
            lineHeight: "20px",
            fontWeight: 600,
            color: emailColors.textMuted,
          }}>
          What the top places pay
        </Text>
        {rewards.map((r) => (
          <Row key={r.place}>
            <Column>
              <Text
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: "32px",
                  color: r.tail ? emailColors.textMuted : emailColors.text,
                }}>
                {r.place}
              </Text>
            </Column>
            <Column align='right'>
              <Text
                style={{
                  margin: 0,
                  fontFamily: monoFont,
                  fontSize: "15px",
                  lineHeight: "32px",
                  fontWeight: 700,
                  color: r.tail ? emailColors.textMuted : emailColors.amber,
                }}>
                {r.fame}
              </Text>
            </Column>
          </Row>
        ))}
      </EmailCard>

      <EmailButton href={leaderboardUrl}>Go to the leaderboard</EmailButton>
    </EmailLayout>
  );
}
