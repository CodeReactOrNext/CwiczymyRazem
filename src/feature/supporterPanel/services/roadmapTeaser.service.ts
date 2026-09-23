import axios from "axios";
import type { RoadmapTeaser } from "feature/supporterPanel/types/userRoadmaps.types";
import { auth } from "utils/firebase/client/firebase.utils";

export const fetchRoadmapTeaser = async (): Promise<RoadmapTeaser> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();
  const { data } = await axios.post<RoadmapTeaser>("/api/roadmaps/teaser", {
    idToken,
  });
  return data;
};
