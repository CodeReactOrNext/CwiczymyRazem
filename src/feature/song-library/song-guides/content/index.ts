import type { SongGuide } from "../types";
import { backInBlack } from "./back-in-black";
import { comeAsYouAre } from "./come-as-you-are";
import { crazyTrain } from "./crazy-train";
import { creep } from "./creep";
import { doIWannaKnow } from "./do-i-wanna-know";
import { enterSandman } from "./enter-sandman";
import { eruption } from "./eruption";
import { everlong } from "./everlong";
import { hotelCalifornia } from "./hotel-california";
import { houseOfTheRisingSun } from "./house-of-the-rising-sun";
import { masterOfPuppets } from "./master-of-puppets";
import { nothingElseMatters } from "./nothing-else-matters";
import { paranoid } from "./paranoid";
import { seekAndDestroy } from "./seek-and-destroy";
import { sevenNationArmy } from "./seven-nation-army";
import { smellsLikeTeenSpirit } from "./smells-like-teen-spirit";
import { smokeOnTheWater } from "./smoke-on-the-water";
import { snowHeyOh } from "./snow-hey-oh";
import { stairwayToHeaven } from "./stairway-to-heaven";
import { sweetChildOMine } from "./sweet-child-o-mine";
import { theTrooper } from "./the-trooper";
import { thunderstruck } from "./thunderstruck";
import { tornadoOfSouls } from "./tornado-of-souls";
import { underTheBridge } from "./under-the-bridge";
import { wishYouWereHere } from "./wish-you-were-here";

export const songGuides: SongGuide[] = [
  nothingElseMatters,
  masterOfPuppets,
  stairwayToHeaven,
  hotelCalifornia,
  sweetChildOMine,
  wishYouWereHere,
  sevenNationArmy,
  thunderstruck,
  crazyTrain,
  theTrooper,
  snowHeyOh,
  tornadoOfSouls,
  eruption,
  smokeOnTheWater,
  houseOfTheRisingSun,
  doIWannaKnow,
  comeAsYouAre,
  backInBlack,
  paranoid,
  enterSandman,
  smellsLikeTeenSpirit,
  seekAndDestroy,
  creep,
  underTheBridge,
  everlong,
];

export const getSongGuideBySlug = (slug: string): SongGuide | undefined =>
  songGuides.find((guide) => guide.slug === slug);
