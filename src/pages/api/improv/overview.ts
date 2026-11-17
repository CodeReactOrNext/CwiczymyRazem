import { improvRoute } from "lib/improv/improvApi";
import { getImprovOverview } from "lib/improv/improvServer";

/** The whole page in one call: the live round, its takes, the pool and the archive. */
export default improvRoute("overview", (userId) => getImprovOverview(userId));
