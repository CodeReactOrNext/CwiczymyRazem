import type { StaticRoadmap } from "feature/aiCoach/types/roadmap.types";

import guitarImprov from "./guitar-improvisation-fundamentals.json";
import johnMayer from "./i-want-to-play-in-the-style-of-john-maye.json";
import martyFriedman from "./i-want-to-play-in-the-style-of-marty-fri.json";
import hendrix from "./play-in-the-style-of-jimi-hendrix.json";
import petrucci from "./play-in-the-style-of-john-petrucci.json";
import rhythmBasics from "./rhythm-guitar-basics.json";

const roadmaps: StaticRoadmap[] = [
  johnMayer as StaticRoadmap,
  { ...hendrix, image: "/images/roadmap/hendrix.png" } as StaticRoadmap,
  { ...petrucci, image: "/images/roadmap/petrucci.png" } as StaticRoadmap,
  { ...martyFriedman, image: "/images/roadmap/friedman.png" } as StaticRoadmap,
  { ...guitarImprov, image: "/images/roadmap/impro.png" } as StaticRoadmap,
  { ...rhythmBasics, image: "/images/roadmap/rythm.png" } as StaticRoadmap,
];

export default roadmaps;
