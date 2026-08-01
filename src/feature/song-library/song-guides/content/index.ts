import type { SongGuide } from "../types";
import { hotelCalifornia } from "./hotel-california";
import { masterOfPuppets } from "./master-of-puppets";
import { nothingElseMatters } from "./nothing-else-matters";
import { sevenNationArmy } from "./seven-nation-army";
import { stairwayToHeaven } from "./stairway-to-heaven";
import { sweetChildOMine } from "./sweet-child-o-mine";
import { thunderstruck } from "./thunderstruck";

export const songGuides: SongGuide[] = [
  nothingElseMatters,
  masterOfPuppets,
  stairwayToHeaven,
  hotelCalifornia,
  sweetChildOMine,
  sevenNationArmy,
  thunderstruck,
];

export const getSongGuideBySlug = (slug: string): SongGuide | undefined =>
  songGuides.find((guide) => guide.slug === slug);
