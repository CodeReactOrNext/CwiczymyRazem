export const STRINGS = [
  { id: 6, name: "E2", hz: 82.41  },
  { id: 5, name: "A2", hz: 110.0  },
  { id: 4, name: "D3", hz: 146.83 },
  { id: 3, name: "G3", hz: 196.0  },
  { id: 2, name: "B3", hz: 246.94 },
  { id: 1, name: "E4", hz: 329.63 },
] as const;

export type GuitarString = typeof STRINGS[number];

export const MIN_SAMPLES   = 8;
export const ACCEPT_CENTS  = 250;
export const STALE_MS      = 2000;

// Arc SVG geometry: center (CX, CY), radius R — arc spans (CX−R, CY) to (CX+R, CY) upward
export const CX = 140, CY = 155, R = 110;
export const NEEDLE_LEN    = 100;
export const MAX_ANGLE_DEG = 80; // ±80° = ±50¢

export function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Returns [x, y] for a point on the arc at angleDeg from vertical (0=top, +right) */
export function arcPt(angleDeg: number, radius = R): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
}
