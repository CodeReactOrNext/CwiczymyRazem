import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { McpContext } from "./auth";
import { registerPrompts } from "./prompts";
import { registerCatalogTools } from "./tools/catalog";
import { registerExerciseTools } from "./tools/exercises";
import { registerPlanTools } from "./tools/plans";
import { registerProgressTools } from "./tools/progress";

// A description of the server, not directions for the model: the directory
// review rejects instructions that steer Claude's behaviour.
const INSTRUCTIONS = `riff.quest is a guitar practice app: players log sessions, play exercises the mic scores against a tab, set tempo goals and learn songs.
- Every tool acts for the one signed-in player; there is no access to other players' data.
- The player's profile and history come from the get_* tools; how the app's mechanics work (points, Fame, streaks, goals) is documented in the wiki that search_wiki searches.
- Library content (exercise and song texts, wiki) is in English.
- Tabs use the JSON format get_tab_format describes; validate_tablature checks one without saving it.
- The write tools (plans, song list, goals, exercises) change the player's account and are limited to 20 changes a day, at most 10 of them new exercises.
- Saved items come back with a link that opens them in the app.`;

/**
 * One server per request: the transport runs stateless (no session ids), so
 * nothing about a player outlives the request that carried their token.
 */
export function createRiffQuestMcpServer(context: McpContext) {
  const server = new McpServer(
    { name: "riff-quest", title: "riff.quest", version: "1.0.0" },
    {
      instructions: INSTRUCTIONS,
      capabilities: { tools: {}, prompts: {}, resources: {} },
    },
  );
  registerProgressTools(server, context);
  registerCatalogTools(server, context);
  registerPlanTools(server, context);
  registerExerciseTools(server, context);
  registerPrompts(server);
  return server;
}
