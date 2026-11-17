/**
 * The moving layer over a banner: what drifts across the picture.
 *
 * Velocities are in CSS pixels a second, sizes are radii in CSS pixels (or the
 * thickness of a streak). Every particle lives in the right two-thirds of the
 * card and fades out towards the left, the same way the art does, so nothing
 * moves behind the player's name.
 */

export type BannerParticleKind =
  | "embers"
  | "green"
  | "snow"
  | "petals"
  | "marigold"
  | "stars"
  | "rain"
  | "dust";

export interface ParticleConfig {
  colors: string[];
  count: number;
  vx: [number, number];
  vy: [number, number];
  size: [number, number];
  alpha: [number, number];
  /** Half-length of a streak along its direction of travel; drops instead of dots. */
  streak?: number;
}

export const PARTICLES: Record<BannerParticleKind, ParticleConfig> = {
  embers: {
    colors: ["#ffd08a", "#ffab4a", "#ff7a2e", "#ffe7b8"],
    count: 46,
    vx: [-16, -3],
    vy: [-30, -9],
    size: [0.5, 1.7],
    alpha: [0.5, 1],
  },
  green: {
    colors: ["#d9ff8a", "#9dff5c", "#f2ff9e", "#5cff8f"],
    count: 40,
    vx: [-22, -6],
    vy: [-20, -4],
    size: [0.5, 1.6],
    alpha: [0.5, 1],
  },
  snow: {
    colors: ["#ffffff", "#dbeafe", "#eff6ff"],
    count: 60,
    vx: [-34, -12],
    vy: [7, 22],
    size: [0.5, 1.7],
    alpha: [0.35, 0.9],
  },
  petals: {
    colors: ["#fbcfe8", "#f9a8d4", "#fda4af", "#ffe4ef"],
    count: 30,
    vx: [-30, -10],
    vy: [5, 18],
    size: [1, 2.3],
    alpha: [0.5, 0.95],
  },
  marigold: {
    colors: ["#fb923c", "#f97316", "#fbbf24", "#fdba74"],
    count: 34,
    vx: [-32, -10],
    vy: [4, 16],
    size: [0.9, 2.2],
    alpha: [0.5, 0.95],
  },
  stars: {
    colors: ["#ffffff", "#fde68a", "#bae6fd"],
    count: 44,
    vx: [-1.5, -0.4],
    vy: [0, 0],
    size: [0.4, 1.2],
    alpha: [0.4, 1],
  },
  rain: {
    colors: ["#ddd6fe", "#c4b5fd"],
    count: 70,
    vx: [-60, -40],
    vy: [150, 210],
    size: [0.5, 0.9],
    alpha: [0.25, 0.6],
    streak: 7,
  },
  dust: {
    colors: ["#fff3c4", "#fde68a", "#fbbf24", "#ffd98a"],
    count: 46,
    vx: [-26, -8],
    vy: [-8, 6],
    size: [0.5, 1.6],
    alpha: [0.4, 0.95],
  },
};
