export interface AchievementsRarityType {
  rarity: "common" | "rare" | "veryRare" | "epic";
}

export const achievementsRarity = {
  common: {
    name: "common",
    color: "#fff",
    tailwindClass: "text-achievements-common",
  },
  rare: {
    name: "rare",
    color: "#b1f9ff",
    tailwindClass: "text-achievements-rare",
  },
  veryRare: {
    name: "veryRare",
    color: "#ffe54c",
    tailwindClass: "text-achievements-veryRare",
  },
  epic: {
    name: "epic",
    color: "rgb(110 70 255 / 1)", // Match tailwind.config.js
    tailwindClass: "text-achievements-epic",
  },
};
