---
name: riff-quest-tabs
description: Write guitar exercises with tablature for riff.quest through its MCP server — turn an idea ("a legato drill on the G string", "alternate picking in triplets") or a pasted ASCII tab into an exercise the riff.quest mic can score, then save it to the player's account. Use whenever the riff-quest MCP tools are connected and the player wants an exercise, a drill, a lick or a riff made, fixed or practised.
---

# riff.quest exercises with tabs

The riff-quest MCP server (tools `get_tab_format`, `validate_tablature`,
`create_exercise`, …) saves exercises the app plays, renders as tab + notation
and scores through the microphone. A tab that doesn't follow the format is
refused, so work in this order.

## Steps

1. **Read the format first** — call `get_tab_format` once per conversation. It is
   the source of truth; the short version:
   - `string` 1 = HIGH e, 6 = LOW E (the top line of an ASCII tab is string 1).
   - `duration` in quarter notes: 1 quarter, 0.5 eighth, 0.25 sixteenth; triplet
     eighth 1/3 with `tuplet: 3`.
   - Each measure's durations add up exactly to its time signature (4/4 → 4).
   - Rest = beat with `notes: []`. Hammer-on / pull-off flag goes on the note you
     arrive at.
2. **Pick skills** — `list_exercise_taxonomy` gives the exact category, difficulty
   and skill ids. Use 1–3 skills.
3. **Write a short loop** — 1–4 measures the player repeats. One idea per exercise.
4. **Validate** — `validate_tablature`, then fix every error it lists (each names
   its measure and beat). Repeat until `ok: true`. Read the warnings too.
5. **Show the player** the tab as plain ASCII tab, with title, BPM range
   (min comfortable / recommended / max goal), 2–5 instructions and 1–3 tips.
   Ask before saving.
6. **Save** — `create_exercise`. It is private to the player. Give them the
   `playUrl` and the returned `id`.
7. **Follow up** — after they play it, adjust with `update_exercise`; add it to a
   routine with `create_practice_plan` (`{ "type": "exercise", "id": "<id>" }`) or
   set a tempo goal with `set_exercise_goal`.

## Converting a pasted ASCII tab

ASCII tab has no rhythm. Ask for the time signature and note values if they
aren't obvious; otherwise assume straight eighths in 4/4 and say so. Map the
lines top to bottom to strings 1–6.

## Don't

- Don't save without the player's go-ahead — every save counts toward a daily limit.
- Don't write long pieces: at most 64 measures, and a loop practises better.
- Don't invent skill ids or exercise ids — take them from the tools.
