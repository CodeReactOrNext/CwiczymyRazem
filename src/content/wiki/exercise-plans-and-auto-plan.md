---
title: "Exercise Plans & Auto Plan"
description: "How practice routines are structured, how the Auto Plan generator builds a session for you, and the difference between My Exercises and Community exercises."
slug: "exercise-plans-and-auto-plan"
section: "Practice"
order: 2
---

An **exercise plan** (a "practice routine") is just an ordered list of exercises with a title, description, difficulty (beginner/easy/medium/hard) and category (technique/theory/creativity/hearing/mixed). You can build one by hand at `/plans/create`, or let riff.quest build one for you.

## Auto Plan generator

<BlogAlert type="info">
Auto Plan (`/timer/auto`) is a Master-tier feature.
</BlogAlert>

You pick a target duration (15–120 minutes, in 15-minute steps), optionally narrow it down by category and difficulty, and the generator does the rest:

<StepList steps="Filter::Narrows the full exercise library down to your chosen categories and difficulty|Shuffle::Randomizes the filtered list so you don't get the same plan twice|Fill::Greedily adds exercises until the plan reaches at least 90% of your target time, then stops|Fallback::If nothing fits your filters within the time budget, you get a single exercise instead" />

The generated plan's own difficulty label isn't fixed — it's computed from what actually got picked (average of beginner=0 … hard=3 across the chosen exercises, rounded to easy/medium/hard). Before starting, you can reorder, remove, or "replace" (re-roll) any individual exercise in the generated plan.

## What's in an exercise

Each exercise carries a difficulty, category, an estimated time in minutes, step-by-step instructions, tips, optional recommended metronome speed range, related skills, and optionally tablature or a backing track.

## My Exercises vs Community

Every exercise you create lives in the same pool — the only difference is a public/private toggle:

- **My Exercises** (`/my-exercises`) — everything you've authored, public or private.
- **Community** (`/profile/skills`, Community tab) — only exercises marked public, sorted by average rating.

Community exercises can be rated 1–5 stars, and there's a small Fame reward loop for sharing: a "thanks" from another user pays the author **+5 Fame**, and the first time someone other than the author completes your exercise pays **+1 Fame**. Playing your own exercise doesn't count toward its play count.

Creating or editing an exercise routes you into the tab/tablature editor at `/tab-editor`; publishing has its own public/private toggle (defaults to public) so you decide whether it lands in Community.
