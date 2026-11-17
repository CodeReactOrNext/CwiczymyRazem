import { improvRoute } from "lib/improv/improvApi";
import { proposeImprovTrack } from "lib/improv/improvServer";

/** Adds a backing track — a YouTube link — to the pool the next round is drawn from. */
export default improvRoute("propose-track", (userId, body) =>
  proposeImprovTrack(userId, body.youtubeUrl),
);
