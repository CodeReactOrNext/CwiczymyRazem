import { achievementsData } from "feature/achievements/data/achievementsData";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import fs from "fs";
import path from "path";

export interface ProgressPageProps {
  skills: number;
  /** Achievements per rarity, commonest first. */
  achievements: { rarity: string; label: string; count: number }[];
  achievementsTotal: number;
  /** The achievement the hero's third day in a row unlocks, as players read it. */
  achievementExample: { title: string; description: string };
}

/** The streak achievement the hero shows: three days in a row. */
export const PROGRESS_ACHIEVEMENT_ID = "day_1";

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  veryRare: "Very rare",
  epic: "Epic",
};

/** Counted at build time: the achievement and skill data carry icons and code. */
export const buildProgressProps = (): ProgressPageProps => {
  const counts = new Map<string, number>();
  for (const achievement of achievementsData) {
    counts.set(achievement.rarity, (counts.get(achievement.rarity) ?? 0) + 1);
  }
  if (!achievementsData.some((entry) => entry.id === PROGRESS_ACHIEVEMENT_ID)) {
    throw new Error(
      `Progress landing: no achievement "${PROGRESS_ACHIEVEMENT_ID}"`,
    );
  }
  const locale = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public/locales/en/achievements.json"),
      "utf8",
    ),
  ) as Record<string, { title: string; description: string }>;
  const example = locale[PROGRESS_ACHIEVEMENT_ID];

  return {
    achievementExample: {
      title: example.title,
      description: example.description,
    },
    skills: guitarSkills.length,
    achievements: Object.keys(RARITY_LABEL)
      .filter((rarity) => counts.has(rarity))
      .map((rarity) => ({
        rarity,
        label: RARITY_LABEL[rarity],
        count: counts.get(rarity) ?? 0,
      })),
    achievementsTotal: achievementsData.length,
  };
};
