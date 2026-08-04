---
title: "Songs, Playlists & Difficulty"
description: "Song statuses and the Board, how marking a song Learned actually pays out, difficulty ratings and tiers, Skill Power, and how playlists work."
slug: "songs-playlists-and-difficulty"
section: "Songs & Library"
order: 1
---

`/songs` has three views: **Board**, **Explore**, and **Playlists**. Every song you track sits in one of three statuses — Want to Learn, Learning, Mastered — and the Board lets you drag songs between them.

## Song statuses

<StepList steps="Want to Learn::A song on your list you haven't started yet|Learning::Automatically promoted here the moment you log a practice session against it — it never happens automatically in the other direction|Learned::You mark this manually once you've got it down" />

## Marking a song Learned

Marking Learned pays **+40 points** — but only if you've logged at least **10 minutes** of practice time against that specific song first. Mark it Learned before that threshold and the status still changes, you just don't get the points. Moving a song back out of Learned takes the +40 back, and the points are mirrored into the current season's total either way.

## Difficulty ratings & tiers

Anyone can rate a song's difficulty, 1–10, and your first rating on a given song pays **+3 Fame** (there's a 15-second cooldown before you can re-rate). All ratings for a song are simply averaged into its `avgDifficulty`, which maps to a tier:

<StatRow stats="D:below 4|C:4 – 5.99|B:6 – 7.49|A:7.5 – 8.99|S:9 and up" caption="Songs with no ratings yet show as '?' instead of a tier." />

## Skill Power

Your Skill Power (shown on the Board) is a weighted average of your **10 hardest Learned songs** — the hardest counts most, weight tapering down to the 10th — plus a small volume bonus for having more songs learned overall, capped at the tier of your single hardest song (so grinding easy songs can't out-rank one genuinely hard one). You need at least **5 Learned songs** before Skill Power shows up at all.

## Playlists

<BlogAlert type="info">
There are three playlist types: a free-form **Playlist**, an ordered **Path** (a learning journey through songs in sequence), and a **Top** list (a ranked list capped at 10 songs).
</BlogAlert>

Public playlists show up in Discover, ranked by popularity (imports count 3× as much as likes). Saving someone else's public playlist pays the author **+20 Fame**; liking one pays **+5 Fame**.
