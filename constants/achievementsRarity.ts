export interface achievementsRarityType {
  rarity: "common" | "rare" | "veryRare";
}

export const achievementsRarity = {
  common: {
    name: "common",
    color: "bg-achievements-common",
  },
  rare: { name: "rare", color: "bg-achievements-rare" },
  veryRare: { name: "veryRare", color: "bg-achievements-veryRare" },
};
