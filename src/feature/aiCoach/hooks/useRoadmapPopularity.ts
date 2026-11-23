import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { RoadmapPopularity } from "lib/roadmaps/roadmapPopularity";
import { auth } from "utils/firebase/client/firebase.utils";

const fetchRoadmapPopularity = async (): Promise<RoadmapPopularity> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();
  const { data } = await axios.post<RoadmapPopularity>(
    "/api/roadmaps/popularity",
    { idToken },
  );
  return data;
};

/**
 * How many players are on each curated roadmap. The numbers are counted once
 * a day on the server, so they are kept for the whole visit; a card simply
 * shows no number until they land, or if they never do.
 */
export const useRoadmapPopularity = (enabled: boolean) =>
  useQuery({
    queryKey: ["roadmap-popularity"],
    queryFn: fetchRoadmapPopularity,
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
