export interface AchievementsRarityType {
  rarity: "common" | "rare" | "veryRare" | "epic";
}

export const achievementsRarity = {
  common: {
    name: "common",
    color: "#fff",
  },
  rare: { name: "rare", color: "#b1f9ff" },
  veryRare: { name: "veryRare", color: "#ffe54c" },
  epic: { name: "epic", color: "#9932CC" },

};
