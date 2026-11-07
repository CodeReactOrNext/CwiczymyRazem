import type { RoadStop } from "feature/whatNext/utils/buildRoad";
import { useState } from "react";

/**
 * Which stop has its bubble open. The first stop until the player taps
 * another; if the open one leaves the road (done, or "not today"), the first
 * stop opens again.
 */
export const useRoadSelection = (road: RoadStop[]) => {
  const [picked, setPicked] = useState<string | null>(null);
  const selected = road.some((stop) => stop.id === picked)
    ? picked
    : (road[0]?.id ?? null);
  return [selected, setPicked] as const;
};
