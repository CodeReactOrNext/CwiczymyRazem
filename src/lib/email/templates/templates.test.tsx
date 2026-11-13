import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";

import { emailArtUrl } from "./EmailLayout";
import SeasonEndingSoonEmail, {
  seasonEndingSubject,
} from "./SeasonEndingSoonEmail";
import SeasonResultsEmail, { seasonResultsSubject } from "./SeasonResultsEmail";
import SeasonStartEmail, { seasonStartSubject } from "./SeasonStartEmail";
import StreakReminderEmail, { streakSubject } from "./StreakReminderEmail";
import WelcomeEmail from "./WelcomeEmail";

const common = {
  logoUrl: "https://riff.quest/images/longlightlogo.png",
  preferencesUrl: "https://riff.quest/settings?tab=notifications",
};

const top3 = [
  { displayName: "Ala", points: 4912 },
  { displayName: "Olek", points: 4405 },
  { displayName: "Zosia", points: 3650 },
];

/** Visible text only, with whitespace collapsed, so assertions read like the email. */
async function text(element: React.ReactElement) {
  const html = await render(element);
  return html
    .replace(/<head>[\s\S]*?<\/head>/, " ")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/ ([.,])/g, "$1");
}

describe("email templates", () => {
  it("greets by name, and drops the comma when there is none", async () => {
    const named = await text(
      <WelcomeEmail userName='Kuba' dashboardUrl='/d' {...common} />,
    );
    expect(named).toContain("You're in, Kuba.");
    const anonymous = await text(
      <WelcomeEmail userName='  ' dashboardUrl='/d' {...common} />,
    );
    expect(anonymous).toContain("You're in.");
  });

  it("shows each email's own illustration", async () => {
    const html = await render(
      <StreakReminderEmail
        userName='Kuba'
        streakDays={12}
        timerUrl='/d'
        variant='d3'
        {...common}
      />,
    );
    expect(html).toContain(emailArtUrl("streak-d3"));
    expect(html).toContain(common.logoUrl);
  });

  it("states the streak and the deadline", async () => {
    const out = await text(
      <StreakReminderEmail
        userName='Kuba'
        streakDays={12}
        hoursLeft={4}
        timerUrl='/d'
        variant='d1'
        {...common}
      />,
    );
    expect(out).toContain("12 days in a row, Kuba. Today is still empty.");
    expect(out).toContain("Your day ends in 4 hours.");
    expect(streakSubject("d1", 1)).toBe(
      "You played yesterday. Today isn't logged yet.",
    );
    expect(streakSubject("d3", 0, "Kuba")).toBe(
      "Three days without the guitar, Kuba",
    );
  });

  it("lists the reward ladder at season start", async () => {
    const out = await text(
      <SeasonStartEmail
        userName='Kuba'
        seasonName='November season'
        daysInSeason={30}
        leaderboardUrl='/l'
        {...common}
      />,
    );
    expect(out).toContain("November season · 30 days");
    expect(out).toContain("2,000 Fame");
    expect(out).toContain("6th–10th place");
    expect(seasonStartSubject("November season")).toBe(
      "The November season starts today",
    );
  });

  it.each([
    [7, "Seven days left, Kuba.", "7 days left in the November season"],
    [1, "The season ends tomorrow, Kuba.", "The November season ends tomorrow"],
    [0, "Last day of the season, Kuba.", "Last day of the November season"],
  ])("counts down with %i days left", async (daysLeft, title, subject) => {
    const out = await text(
      <SeasonEndingSoonEmail
        userName='Kuba'
        seasonName='November season'
        daysLeft={daysLeft}
        leaderboardUrl='/l'
        {...common}
      />,
    );
    expect(out).toContain(title);
    expect(seasonEndingSubject("November season", daysLeft)).toBe(subject);
  });

  it("congratulates a rewarded place with its Fame", async () => {
    const out = await text(
      <SeasonResultsEmail
        userName='Kuba'
        seasonName='November season'
        userPlace={4}
        userPoints={3180}
        fameEarned={500}
        top3={top3}
        leaderboardUrl='/l'
        practiceUrl='/d'
        {...common}
      />,
    );
    expect(out).toContain("4th place, Kuba.");
    expect(out).toContain("+500 Fame");
    expect(out).toContain("See final standings");
    expect(seasonResultsSubject("November season", 4)).toBe(
      "You finished 4th in the November season",
    );
  });

  it("shows readers outside the rewards where the cutoff was", async () => {
    const out = await text(
      <SeasonResultsEmail
        userName='Kuba'
        seasonName='November season'
        userPlace={23}
        userPoints={1240}
        fameEarned={null}
        top3={top3}
        lastRewardedPoints={2010}
        leaderboardUrl='/l'
        practiceUrl='/d'
        {...common}
      />,
    );
    expect(out).toContain("23rd place, Kuba.");
    expect(out).toContain("10th place this season needed 2,010 points.");
    expect(out).not.toContain("Fame is already");
  });

  it("marks the reader inside the top 3 instead of adding a row", async () => {
    const out = await text(
      <SeasonResultsEmail
        userName='Kuba'
        seasonName='November season'
        userPlace={2}
        userPoints={4405}
        fameEarned={1200}
        top3={top3}
        leaderboardUrl='/l'
        practiceUrl='/d'
        {...common}
      />,
    );
    expect(out).not.toContain("Olek");
    expect(out.match(/You\b/g)?.length).toBeGreaterThan(0);
  });
});
