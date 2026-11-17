import { improvRoute } from "lib/improv/improvApi";
import { removeImprovTake } from "lib/improv/improvServer";

/** Takes a take down, along with the bot's message about it. */
export default improvRoute("remove-take", (userId, body) =>
  removeImprovTake(userId, body.takeId),
);
