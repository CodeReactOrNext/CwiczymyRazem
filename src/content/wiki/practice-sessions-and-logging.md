---
title: "Practice Sessions & Logging"
description: "The two ways to log a practice session, what fields it captures, the guardrails on absurd entries, and how the Practice Log history works."
slug: "practice-sessions-and-logging"
section: "Practice"
order: 1
---

Every session you log feeds your points, your streak, your skills, and the Practice Log history. There are two ways to log one, and they both end up on the same form.

## Two ways to log a session

<StepList steps="Free Timer::Run a stopwatch per skill at /timer/practice while you play, then it hands you off to the log form pre-filled with the time you tracked|Manual Log::Skip the timer and fill in the log form yourself at /report — useful for a session you already finished" />

The log form splits your time across **4 skill categories** — technique, theory, hearing, creativity — each in hours and minutes. You also give the session a title (there's an optional tag picker for Goal/Playing Style/Techniques/Theory/Creative/Performance that just appends labels into the title), and pick when it happened: today, yesterday, or up to 7 days back.

## Healthy habits

Check off up to 5 habits per session — each is worth its own point (see [How Scoring Works](/wiki/how-scoring-works)):

<Checklist items="Warm-up::Did a proper warm-up before playing|Metronome::Practiced with a metronome|Learned something new::Picked up a new technique, song section, or concept|Exercise plan::Followed a structured exercise plan|Recording::Recorded yourself playing" />

## Guardrails on the log form

<BlogAlert type="warning">
The form actively pushes back on unrealistic entries — it's there to keep your stats meaningful, not to block you.
</BlogAlert>

- **Zero time logged** — rejected outright.
- **24 hours or more** in one session — rejected, no confirmation possible.
- **Over 6 hours** in one session — allowed, but you get a "Long practice?" confirmation popup first.
- **Logging a day that would exceed its own running total** (e.g. you already logged 3h today and try to add another 4h) — triggers an "Accept Exceeding Time" popup before it's saved.

## Practice Log history

`/practice-log` shows every session you've ever logged, grouped by day. Sessions are automatically classified as **Manual**, **Plan** (started from an [exercise plan](/wiki/exercise-plans-and-auto-plan)), or **Song** (practiced against a specific song), and you can filter by date range (7/30/90 days or all-time), a specific date, session type, or length — short (under 15 min), medium (15–45 min), long (45 min+).

The summary widget on top totals your time, session count, points, active days, average session length, and time per skill category. Any logged session can be edited or deleted after the fact.
