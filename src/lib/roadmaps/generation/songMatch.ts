import type { SongRequest } from "../songLookup";
import { completeJson } from "./openaiJson";

interface SongExtractOutput {
  songTitle: string | null;
  songArtist: string | null;
}

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    songTitle: {
      type: ["string", "null"],
      description:
        "The exact original title of the ONE song the step is about, or null",
    },
    songArtist: {
      type: ["string", "null"],
      description: "The original artist of that recording, or null",
    },
  },
  required: ["songTitle", "songArtist"],
  additionalProperties: false,
};

const EXTRACT_SYSTEM = `You read one step of a guitar practice roadmap and say which real song it is about, if any.

Answer with the song only when the step is about learning or playing THAT ONE song — a repertoire step ("Little Wing: the embellishment masterclass", "Red House: the slow blues", "Play Sweet Child O' Mine at tempo"). A step that merely mentions a song as an example of a technique, or lists several songs, or is about a chord, a scale, a rig or a feel, is not about a song: return null for both fields.

Write the title and artist exactly as the original recording is credited (the artist who made it famous, not a cover). Never invent a song to fill the fields.`;

/**
 * Which song a step names — the editor's "Find song" for a step written
 * before the generator learned to say so. The answer is only a request: the
 * library decides whether the song exists.
 */
export async function extractSongFromStep(params: {
  stepTitle: string;
  description: string;
  goal: string;
}): Promise<SongRequest | null> {
  const output = await completeJson<SongExtractOutput>({
    system: EXTRACT_SYSTEM,
    user: `Roadmap goal: "${params.goal}"
Step title: "${params.stepTitle}"
${params.description ? `Step description: ${params.description.slice(0, 1200)}` : ""}`,
    schemaName: "step_song",
    schema: EXTRACT_SCHEMA,
    maxTokens: 1500,
    reasoningEffort: "minimal",
  });

  const title = output.songTitle?.trim();
  const artist = output.songArtist?.trim();
  return title && artist ? { title, artist } : null;
}
