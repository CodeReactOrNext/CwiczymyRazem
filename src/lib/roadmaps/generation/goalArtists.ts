import { completeJson } from "./openaiJson";
import type { UsageLedger } from "./usage";

interface ArtistsOutput {
  artists: string[];
}

const ARTISTS_SCHEMA = {
  type: "object",
  properties: {
    artists: {
      type: "array",
      items: { type: "string" },
      description:
        "0–3 recording artists or bands the goal is about, as they are credited on their records",
    },
  },
  required: ["artists"],
  additionalProperties: false,
};

const ARTISTS_SYSTEM = `You read a guitar student's goal and name the recording artists or bands it is about, so their songs can be looked up in a song library.

Return an artist when the goal is about playing their music or playing like them — named directly ("like Mark Knopfler"), through their band ("Dire Straits songs"), or through a song of theirs ("learn Sultans of Swing"). For a guitarist known through a band, return both the guitarist and the band ("Mark Knopfler", "Dire Straits"). Use the name as credited on the records.

Return an empty list for a goal about a technique, a genre or general ability with no artist in it. Never guess an artist the goal does not point to. At most 3.`;

export const MAX_GOAL_ARTISTS = 3;

/**
 * The artists a goal is about. One small call on the workhorse model: its
 * answer only decides which library songs the draft is shown, so a miss costs
 * a less well-stocked prompt, not a wrong roadmap.
 */
export async function extractGoalArtists(
  goal: string,
  ledger?: UsageLedger,
): Promise<string[]> {
  const output = await completeJson<ArtistsOutput>({
    system: ARTISTS_SYSTEM,
    user: `Goal: "${goal}"`,
    schemaName: "goal_artists",
    schema: ARTISTS_SCHEMA,
    maxTokens: 1500,
    reasoningEffort: "minimal",
    ledger,
  });
  const seen = new Set<string>();
  return (output.artists ?? [])
    .map((artist) => (typeof artist === "string" ? artist.trim() : ""))
    .filter((artist) => {
      const key = artist.toLowerCase();
      if (!artist || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_GOAL_ARTISTS);
}
