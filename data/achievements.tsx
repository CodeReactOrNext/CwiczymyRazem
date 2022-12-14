import {
  FaBolt,
  FaHotjar,
  FaThumbsUp,
  FaClock,
  FaHourglass,
  FaBalanceScale,
  FaHeart,
} from "react-icons/fa";
import { IconType } from "react-icons/lib";
import { AchievementsRarityType } from "./achievementsRarity";

export interface AchievementsInterface extends AchievementsRarityType{
  id: string;
  name: string;
  Icon: IconType;
  description: string;
}

export const achievements: AchievementsInterface[] = [
  {
    id: "time_1",
    name: "Dobra Robota!",
    Icon: FaThumbsUp,
    rarity: "common",
    description: "Przekrocz próg 10 godzin ćwiczeń.",
  },
  {
    id: "time_2",
    name: "Dobra Robota!",
    Icon: FaClock,
    rarity: "rare",
    description: "Przekrocz próg 30 godzin ćwiczeń.",
  },
  {
    id: "time_3",
    name: "1% - 10000h rule",
    Icon: FaHourglass,
    rarity: "veryRare",
    description: "Przekrocz próg 100 godzin ćwiczeń.",
  },
  {
    id: "balance",
    name: "Równowaga",
    Icon: FaBalanceScale,
    rarity: "rare",
    description:
      "Raportuj za jednym razem przynajmniej 1 godzinę z każdego filaru umiejętności",
  },
  {
    id: "fire",
    name: "Ogień!",
    Icon: FaHotjar,
    rarity: "veryRare",
    description: "Zdobądź 30 punktów za jeden raport",
  },
  {
    id: "health_habits",
    name: "Zdrowy jak ryba",
    Icon: FaHeart,
    rarity: "common",
    description: "Zrealizuj wszystkie zdrowe nawyki w jednym raporcie",
  },
];
