import { Column, Row, Section, Text } from "@react-email/components";
import { placeSuffix, SEASON_REWARD_PLACES } from "constants/seasonRewards";
import type { CSSProperties } from "react";

import EmailLayout, {
  EmailButton,
  EmailCard,
  emailColors,
  EmailIntro,
  EmailNote,
  formatNumber,
  monoFont,
  withName,
} from "./EmailLayout";

interface TopPlayer {
  displayName: string;
  points: number;
}

interface SeasonResultsEmailProps {
  userName: string;
  /** Already formatted for readers, e.g. "November season". */
  seasonName: string;
  userPlace: number | null;
  userPoints: number;
  fameEarned: number | null;
  top3: TopPlayer[];
  /** Points the last rewarded place finished with; shown to everyone below it. */
  lastRewardedPoints?: number | null;
  leaderboardUrl: string;
  /** Where "Start the next season" goes for readers outside the rewards. */
  practiceUrl: string;
  logoUrl: string;
  /** The email tab of Settings, linked from the footer. */
  preferencesUrl: string;
}

const ordinal = (n: number) => `${n}${placeSuffix(n)}`;

const isRankedPlace = (place: number | null): place is number =>
  place !== null && place <= SEASON_REWARD_PLACES;

export function seasonResultsSubject(
  seasonName: string,
  userPlace: number | null,
): string {
  return isRankedPlace(userPlace)
    ? `You finished ${ordinal(userPlace)} in the ${seasonName}`
    : `The ${seasonName} is over. See how you did`;
}

const cell = (bold: boolean): CSSProperties => ({
  margin: 0,
  fontSize: "15px",
  lineHeight: "24px",
  fontWeight: bold ? 700 : 400,
});

function StandingRow({
  place,
  name,
  points,
  isYou,
}: {
  place: string;
  name: string;
  points: number;
  isYou: boolean;
}) {
  return (
    <Row
      style={{
        backgroundColor: isYou ? emailColors.cardRaised : undefined,
        borderRadius: "8px",
      }}>
      <Column style={{ width: "44px", padding: "12px 0 12px 16px" }}>
        <Text
          style={{
            ...cell(isYou),
            fontFamily: monoFont,
            color: isYou ? emailColors.amber : emailColors.textDim,
          }}>
          {place}
        </Text>
      </Column>
      <Column style={{ padding: "12px 0" }}>
        <Text style={{ ...cell(isYou), color: emailColors.text }}>{name}</Text>
      </Column>
      <Column align='right' style={{ padding: "12px 16px 12px 0" }}>
        <Text
          style={{
            ...cell(isYou),
            fontFamily: monoFont,
            color: isYou ? emailColors.text : emailColors.textMuted,
          }}>
          {formatNumber(points)}
        </Text>
      </Column>
    </Row>
  );
}

export default function SeasonResultsEmail({
  userName,
  seasonName,
  userPlace,
  userPoints,
  fameEarned,
  top3,
  lastRewardedPoints = null,
  leaderboardUrl,
  practiceUrl,
  logoUrl,
  preferencesUrl,
}: SeasonResultsEmailProps) {
  const isRanked = isRankedPlace(userPlace);
  const points = formatNumber(userPoints);
  const youInTop3 = userPlace !== null && userPlace <= top3.length;

  const preview = isRanked
    ? fameEarned !== null
      ? `${points} points, and ${formatNumber(fameEarned)} Fame is already on your account.`
      : `You closed the season with ${points} points.`
    : userPlace !== null
      ? `You finished ${ordinal(userPlace)} with ${points} points.`
      : `You finished with ${points} points.`;

  const title =
    userPlace !== null
      ? withName(`${ordinal(userPlace)} place`, userName)
      : withName("The season is over", userName);

  return (
    <EmailLayout
      preview={preview}
      logoUrl={logoUrl}
      art={isRanked ? "results-ranked" : "results-unranked"}
      preferencesUrl={preferencesUrl}
      reason={`You got this because you played in the ${seasonName}.`}>
      <EmailIntro eyebrow={`${seasonName} · final standings`} title={title} big>
        {isRanked ? (
          <>
            You closed the season with {points} points. That&apos;s inside the
            reward places
            {fameEarned !== null ? (
              <>
                , so{" "}
                <span style={{ color: emailColors.amber, fontWeight: 600 }}>
                  +{formatNumber(fameEarned)} Fame
                </span>{" "}
                is already on your account.
              </>
            ) : (
              "."
            )}
          </>
        ) : (
          <>
            You closed the season with {points} points. The next one starts
            today, and everyone starts from zero again.
          </>
        )}
      </EmailIntro>

      {top3.length > 0 && (
        <EmailCard padding='8px'>
          {top3.map((player, i) => (
            <StandingRow
              key={i}
              place={String(i + 1)}
              name={userPlace === i + 1 ? "You" : player.displayName}
              points={player.points}
              isYou={userPlace === i + 1}
            />
          ))}
          {!youInTop3 && (
            <>
              {userPlace !== null && userPlace > top3.length + 1 && (
                <Section style={{ padding: "0 16px" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: monoFont,
                      fontSize: "15px",
                      lineHeight: "20px",
                      color: emailColors.textFaint,
                    }}>
                    ···
                  </Text>
                </Section>
              )}
              <StandingRow
                place={userPlace !== null ? String(userPlace) : "–"}
                name='You'
                points={userPoints}
                isYou
              />
            </>
          )}
        </EmailCard>
      )}

      {isRanked ? (
        <>
          <EmailButton href={leaderboardUrl}>See final standings</EmailButton>
          <EmailNote>
            The next season starts today, and everyone starts from zero.
          </EmailNote>
        </>
      ) : (
        <>
          <EmailButton href={practiceUrl}>Start the next season</EmailButton>
          <EmailNote>
            The top {SEASON_REWARD_PLACES} take home Fame.
            {lastRewardedPoints !== null &&
              ` ${ordinal(SEASON_REWARD_PLACES)} place this season needed ${formatNumber(lastRewardedPoints)} points.`}
          </EmailNote>
        </>
      )}
    </EmailLayout>
  );
}
