import { improvRoute } from "lib/improv/improvApi";
import { removeImprovTrack } from "lib/improv/improvServer";

/** Pulls a backing track out of the pool. */
export default improvRoute("remove-track", (userId, body) =>
  removeImprovTrack(userId, body.trackId),
);
