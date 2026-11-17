import { improvRoute } from "lib/improv/improvApi";
import { getImprovRoundTakes } from "lib/improv/improvServer";

/** The takes of one round, for the archive. */
export default improvRoute("round", (_userId, body) =>
  getImprovRoundTakes(String(body.roundId ?? "")),
);
