import type { SongGuide } from "../types";
import { crazyTrain } from "./crazy-train";
import { eruption } from "./eruption";
import { hotelCalifornia } from "./hotel-california";
import { masterOfPuppets } from "./master-of-puppets";
import { nothingElseMatters } from "./nothing-else-matters";
import { sevenNationArmy } from "./seven-nation-army";
import { smokeOnTheWater } from "./smoke-on-the-water";
import { snowHeyOh } from "./snow-hey-oh";
import { stairwayToHeaven } from "./stairway-to-heaven";
import { sweetChildOMine } from "./sweet-child-o-mine";
import { theTrooper } from "./the-trooper";
import { thunderstruck } from "./thunderstruck";
import { tornadoOfSouls } from "./tornado-of-souls";

export const songGuides: SongGuide[] = [
  nothingElseMatters,
  masterOfPuppets,
  stairwayToHeaven,
  hotelCalifornia,
  sweetChildOMine,
  sevenNationArmy,
  thunderstruck,
  crazyTrain,
  theTrooper,
  snowHeyOh,
  tornadoOfSouls,
  eruption,
  smokeOnTheWater,
];

export const getSongGuideBySlug = (slug: string): SongGuide | undefined =>
  songGuides.find((guide) => guide.slug === slug);
