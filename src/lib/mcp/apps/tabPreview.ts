import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import {
  alphaTexStaffHeader,
  tablatureToAlphaTex,
} from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/tablatureToAlphaTex";
import { BASS_TUNINGS, BASS_STANDARD_TUNING_ID } from "utils/audio/tunings";
import { z } from "zod";

import { jsonResult, runTool } from "../results";
import {
  formatTabIssues,
  validateTablature,
} from "../tablature/validateTablature";
import { instrumentSchema, tablatureSchema } from "../tools/exercises";
import { CDN, TAB_PREVIEW_HTML } from "./tabPreviewHtml";

const RESOURCE_URI = "ui://riff-quest/tab-preview.html";

const BASS_STANDARD = BASS_TUNINGS.find(
  (tuning) => tuning.id === BASS_STANDARD_TUNING_ID,
)!;

/**
 * `preview_tab` — shows a tab as tab + notation with playback, inside the
 * conversation (an MCP App). Saves nothing: it is the look before
 * `create_exercise`. Clients without MCP Apps get the same check as text.
 */
export function registerTabPreviewApp(server: McpServer) {
  registerAppResource(
    server,
    "Tab preview",
    RESOURCE_URI,
    { description: "Tab and notation view with playback for a riff.quest tab" },
    async () => ({
      contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: TAB_PREVIEW_HTML,
          _meta: {
            ui: {
              // AlphaTab, its font and soundfont, and the app SDK — all from jsDelivr.
              csp: { resourceDomains: [CDN], connectDomains: [CDN] },
              prefersBorder: false,
            },
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "preview_tab",
    {
      title: "Preview a tab",
      description:
        "Shows a tab as tablature and standard notation with playback, in the format get_tab_format describes, together with the validation result. Saves nothing.",
      inputSchema: {
        tablature: tablatureSchema,
        instrument: instrumentSchema,
        title: z.string().max(80).optional(),
        bpm: z.number().int().min(20).max(400).optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    ({ tablature, instrument, title, bpm }) =>
      runTool("preview_tab", async () => {
        const measures = tablature as TablatureMeasure[];
        const kind = instrument ?? "guitar";
        const result = validateTablature(measures, kind);
        const tempo = bpm ?? 90;
        let tex: string | null = null;
        try {
          tex = tablatureToAlphaTex(
            measures,
            tempo,
            kind === "bass" ? alphaTexStaffHeader(BASS_STANDARD) : "",
          );
        } catch {
          tex = null;
        }
        const data = {
          title: title ?? "Tab preview",
          instrument: kind,
          tempo,
          measures: result.stats.measures,
          ok: result.ok,
          errors: formatTabIssues(result.errors),
          warnings: formatTabIssues(result.warnings),
          tex,
        };
        return { ...jsonResult(data), structuredContent: data };
      }),
  );
}
