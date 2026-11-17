import { improvRoute } from "lib/improv/improvApi";
import { submitImprovTake } from "lib/improv/improvServer";

/** Links a take to the live round; the bot posts it to the round's Discord thread. */
export default improvRoute("submit-take", (userId, body) =>
  submitImprovTake(userId, body.url, body.note),
);
