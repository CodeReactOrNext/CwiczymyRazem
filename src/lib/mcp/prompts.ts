import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Prompt templates the client offers as ready-made requests. They only tell
 * the client's own model which tools to call and what to do with the data —
 * riff.quest runs no model for them.
 */
export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "weekly_review",
    {
      title: "Weekly practice review",
      description:
        "Sums up the player's last 7 days of practice and proposes a plan for the next week.",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Review my guitar practice from the last 7 days on riff.quest.",
              "1. Call riffquest_get_profile_summary, riffquest_get_practice_history (last 7 days), riffquest_get_goals and riffquest_get_weak_spots.",
              "2. Tell me in a few short paragraphs: how much I played and on which days, what I focused on, how my tempo goals are going, and what I have been neglecting.",
              "3. Propose next week: 3–5 sessions with exercises found through riffquest_list_exercises. Ask me before saving anything; if I agree, save it with riffquest_create_practice_plan and give me the link.",
              "Be specific and honest, skip praise that isn't backed by the numbers.",
              "Talk to me as a guitarist, not a programmer: no JSON, tool names, field names or ids — just the music and the numbers.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "plan_next_session",
    {
      title: "Plan my next session",
      description:
        "Builds one practice session for the time the player has, aimed at what they've neglected.",
      argsSchema: {
        minutes: z
          .string()
          .describe("How many minutes the session should take, e.g. 30"),
        focus: z
          .string()
          .optional()
          .describe("Optional: what to focus on, e.g. legato, rhythm, a song"),
      },
    },
    ({ minutes, focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Plan my next riff.quest practice session, ${minutes} minutes in total${focus ? `, focused on ${focus}` : ""}.`,
              "1. Call riffquest_get_weak_spots and riffquest_get_goals to see what I've neglected and which goals are open.",
              "2. Pick 3–5 items with riffquest_list_exercises (and riffquest_list_songs if a song fits). Start with a short warm-up. Item minutes must add up to the total.",
              "3. Show me the plan with a one-line reason per item, then save it with riffquest_create_practice_plan and give me the link.",
              "Talk to me as a guitarist, not a programmer: no JSON, tool names, field names or ids — just the music and the numbers.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "write_exercise",
    {
      title: "Write an exercise with a tab",
      description:
        "Turns a description (or a pasted tab) into a riff.quest exercise the mic can score.",
      argsSchema: {
        idea: z
          .string()
          .describe(
            "What the exercise should train, or a tab to turn into an exercise",
          ),
      },
    },
    ({ idea }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Create a riff.quest exercise for this: ${idea}`,
              "1. Call riffquest_get_tab_format and follow it exactly (string 1 = high e, every measure adds up to its time signature).",
              "2. Write a short loop (1–4 measures), call riffquest_validate_tablature and fix every error until it passes.",
              "3. Show me the tab as riffquest_preview_tab, or as the asciiTab the tools return (never the JSON), plus the title, tempo range and instructions, and ask if I want changes.",
              "4. When I say it's good, save it with riffquest_create_exercise and give me the link.",
              "Talk to me as a guitarist, not a programmer: no JSON, tool names, field names or ids — just the music and the numbers.",
            ].join("\n"),
          },
        },
      ],
    }),
  );
}
