import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import {
  alphaTexStaffHeader,
  tablatureToAlphaTex,
} from "feature/exercisePlan/views/PracticeSession/components/AlphaTabScoreViewer/tablatureToAlphaTex";
import {
  BACKGROUNDS,
  DEFAULT_SETTINGS,
  STRING_PALETTES,
  tablatureStylePatch,
} from "feature/exercisePlan/views/PracticeSession/components/tablatureSettings";
import {
  staffLineSpacing,
  tuningGutterStrings,
} from "feature/exercisePlan/views/PracticeSession/components/tablatureStringRows";
import type { Instrument } from "utils/audio/tunings";
import {
  BASS_STANDARD_TUNING_ID,
  BASS_TUNINGS,
  GUITAR_TUNINGS,
  STANDARD_TUNING_ID,
} from "utils/audio/tunings";
import { z } from "zod";

import {
  READ_TOOL_ANNOTATIONS,
  runTool,
  strictInput,
} from "../results";
import { checkTab, renderAsciiTab, tabSchema } from "../tablature/tabJson";
import { formatTabIssues } from "../tablature/validateTablature";
import { instrumentSchema } from "../tools/exercises";
import { CDN, TAB_PREVIEW_HTML } from "./tabPreviewHtml";

const RESOURCE_URI = "ui://riff-quest/tab-preview.html";

const BASS_STANDARD = BASS_TUNINGS.find(
  (tuning) => tuning.id === BASS_STANDARD_TUNING_ID,
)!;
const GUITAR_STANDARD = GUITAR_TUNINGS.find(
  (tuning) => tuning.id === STANDARD_TUNING_ID,
)!;

/**
 * The practice session's tab board as a player sees it before changing any
 * setting: the default palette, board and pills, standard tuning in the gutter.
 */
export function defaultBoard(
  measures: TablatureMeasure[],
  bpm: number,
  instrument: Instrument,
) {
  const palette = STRING_PALETTES[DEFAULT_SETTINGS.palette].colors;
  const tuning = instrument === "bass" ? BASS_STANDARD : GUITAR_STANDARD;
  const style = tablatureStylePatch(
    DEFAULT_SETTINGS,
    palette,
    BACKGROUNDS[DEFAULT_SETTINGS.background],
  );
  return {
    measures,
    bpm,
    palette,
    // A bass staff spreads its four lines over the six-string height, as in the session.
    style:
      tuning.stringCount === 6
        ? style
        : {
            ...style,
            stringCount: tuning.stringCount,
            stringSpacing: staffLineSpacing(DEFAULT_SETTINGS.stringSpacing, tuning.stringCount),
          },
    tuningStrings: DEFAULT_SETTINGS.showTuningGutter
      ? tuningGutterStrings(tuning.notation, tuning.stringCount, palette)
      : [],
  };
}

/**
 * `riffquest_preview_tab` — shows a tab inside the conversation (an MCP App)
 * the way the practice session draws it, with notation one tab away and
 * playback for both. Saves nothing: it is the look before
 * `riffquest_create_exercise`. Clients without MCP Apps get the same check as text.
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
    "riffquest_preview_tab",
    {
      title: "Preview a tab",
      description:
        "Shows a tab as tablature and notation with playback, with the check result. Saves nothing.",
      inputSchema: strictInput({
        tab: tabSchema,
        instrument: instrumentSchema,
        title: z.string().max(80).optional(),
        bpm: z.number().int().min(20).max(400).optional(),
      }),
      annotations: READ_TOOL_ANNOTATIONS,
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    ({ tab, instrument, title, bpm }) =>
      runTool("riffquest_preview_tab", async () => {
        const kind = instrument ?? "guitar";
        const { measures, validation: result } = checkTab(tab, kind);
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
        const summary = {
          title: title ?? "Tab preview",
          instrument: kind,
          tempo,
          measures: result.stats.measures,
          ok: result.ok,
          errors: formatTabIssues(result.errors),
          warnings: formatTabIssues(result.warnings),
          asciiTab: renderAsciiTab(measures, kind),
        };
        // The model reads the summary; what only the view draws from (the
        // board and the alphaTex) rides in structuredContent alone.
        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary) }],
          structuredContent: {
            ...summary,
            tex,
            board: measures.length > 0 ? defaultBoard(measures, tempo, kind) : null,
          },
        };
      }),
  );
}
