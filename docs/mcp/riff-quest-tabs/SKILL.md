---
name: riff-quest-tabs
description: Write guitar and bass exercises with tablature for riff.quest through its MCP server — turn an idea ("a legato drill on the G string", "alternate picking in triplets") or a pasted tab into an exercise the riff.quest mic can score, then save it to the player's account. Use whenever the riff-quest MCP tools are connected and the player wants an exercise, a drill, a lick or a riff made, fixed or practised.
---

# riff.quest exercises with tabs

The riff-quest MCP server (tools `riffquest_get_tab_format`, `riffquest_validate_tablature`,
`riffquest_preview_tab`, `riffquest_create_exercise`, …) saves exercises the app plays, renders as
tab + notation and scores through the microphone. A tab that doesn't follow the
format is refused, so work in this order.

## Steps

1. **Read the format** — call `riffquest_get_tab_format` once per conversation. It is the
   source of truth; the short version:
   - `string` 1 = high e, 6 = low E (the top line of a tab is string 1).
     Bass (`instrument: "bass"`): 1 = G … 4 = low E.
   - `duration` is the written note value — `"quarter"`, `"eighth"`, `"sixteenth"`…
     — with `dots: 1` for dotted and `tuplet: 3` for triplets.
   - Each measure adds up exactly to its time signature (`"4/4"` → four quarters).
   - A beat has `notes`, or `"rest": true`. `hammer-on` / `pull-off` go on the note
     you arrive at.
2. **Pick skills** — `riffquest_list_exercise_taxonomy` gives the exact category, difficulty
   and skill ids. Use 1–3 skills.
3. **Write a short loop** — 1–4 measures the player repeats. One idea per exercise.
4. **Check it** — `riffquest_validate_tablature`, then fix every error it lists (each names
   its measure and beat). Repeat until `ok: true`. Read the warnings too.
5. **Show the player** — `riffquest_preview_tab` where the client shows it (tab, notation,
   playback); otherwise the `asciiTab` the tools return, in a code block, exactly
   as returned. Add the title, tempo range, 2–5 instructions and 1–3 tips.
   Ask before saving.
6. **Save** — `riffquest_create_exercise`. It is private to the player. Give them the
   `playUrl`.
7. **Follow up** — after they play it, adjust with `riffquest_update_exercise`; add it to a
   routine with `riffquest_create_practice_plan` (`{ "type": "exercise", "id": "<id>" }`) or
   set a tempo goal with `riffquest_set_exercise_goal`.

## Talking to the player

The player is a guitarist, not a programmer. The JSON is between you and the
tools — never show it, and don't offer to "make a JSON".

- Say "I'll write you an exercise" and "here's the tab", not "I'll create a JSON"
  or "I'll call riffquest_create_exercise".
- Show tabs as a text tab (`asciiTab`) or the preview — never as JSON.
- Speak in musical terms: "eighth notes", "a hammer-on from the 5th to the 7th fret",
  "60 to 90 BPM" — not `duration`, `techniques`, `bpm.min`, ids or tool names.
- When a check fails, fix it yourself and say what changed in musical terms
  ("the second bar was a beat short, I added a rest") — not the error text.
- If a tool isn't available, say what you can't do in plain words ("I can't save
  it to your account from here") and give the tab so they can enter it in the app.

## Converting a pasted tab

A text tab has no rhythm. Ask for the time signature and note values if they
aren't obvious; otherwise assume straight eighths in 4/4 and say so. Map the
lines top to bottom to strings 1–6.

## Don't

- Don't save without the player's go-ahead — every save counts toward a daily limit.
- Don't write long pieces: at most 64 measures, and a loop practises better.
- Don't invent skill ids or exercise ids — take them from the tools.
