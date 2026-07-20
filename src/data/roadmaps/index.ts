import type { StaticRoadmap } from "feature/aiCoach/types/roadmap.types";

import guitarImprov from "./guitar-improvisation-fundamentals.json";
import johnMayer from "./i-want-to-play-in-the-style-of-john-maye.json";
import martyFriedman from "./i-want-to-play-in-the-style-of-marty-fri.json";
import adamJones from "./i-want-to-play-like-adam-jones.json";
import hendrix from "./play-in-the-style-of-jimi-hendrix.json";
import petrucci from "./play-in-the-style-of-john-petrucci.json";
import rhythmBasics from "./rhythm-guitar-basics.json";

const roadmaps: StaticRoadmap[] = [
  johnMayer as StaticRoadmap,
  { ...adamJones, image: "/images/roadmap/adam.webp" } as StaticRoadmap,
  { ...hendrix, image: "/images/roadmap/hendrix.webp" } as StaticRoadmap,
  { ...petrucci, image: "/images/roadmap/petrucci.webp" } as StaticRoadmap,
  { ...martyFriedman, image: "/images/roadmap/friedman.webp" } as StaticRoadmap,
  { ...guitarImprov, image: "/images/roadmap/impro.webp" } as StaticRoadmap,
  { ...rhythmBasics, image: "/images/roadmap/rythm.webp" } as StaticRoadmap,
];

export default roadmaps;
