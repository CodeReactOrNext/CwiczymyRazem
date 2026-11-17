import { improvRoute } from "lib/improv/improvApi";
import { toggleImprovVote } from "lib/improv/improvServer";

/** Backs a pool track, or takes the vote back. */
export default improvRoute("vote", (userId, body) =>
  toggleImprovVote(userId, body.trackId),
);
