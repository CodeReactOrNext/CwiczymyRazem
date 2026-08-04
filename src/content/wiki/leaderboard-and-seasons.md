---
title: "Leaderboard & Seasons"
description: "The three leaderboards (all-time, seasonal, gear), how monthly seasons reset, top-5 season rewards, and how your rank is calculated."
slug: "leaderboard-and-seasons"
section: "Competition"
order: 1
---

There isn't just one leaderboard — there are three, each ranking a different number.

<StepList steps="All-time (/leaderboard)::Ranks every user by their total points or session count, forever|Seasonal (/seasons)::Ranks users by points earned during the current calendar month only|Gear (/leaderboard/gear)::Ranks users by Rig Level — see Arsenal & Gear" />

## Seasons reset monthly

A season is one calendar month (id format `2026-08`), created automatically the moment anyone first touches the leaderboard that month. Seasonal points live in their own bucket, completely separate from your all-time `statistics.points` — so the seasonal board is a clean slate every month, nothing carries over.

<BlogAlert type="tip">
Finish in the **top 5** of a season and you get a one-time Fame payout when the season ends: **500 / 300 / 200 / 100 / 50** Fame for 1st through 5th place.
</BlogAlert>

## Your rank

The "you're #N" widget next to each leaderboard counts how many users have a strictly higher score than you and adds 1 — it doesn't have to scan the whole leaderboard to do it, so it stays fast even with a large user base. That count is cached for 5 minutes per board (all-time, seasonal, gear each cache separately), and the leaderboard pages themselves (10 entries per page) are cached for 24 hours — so a big session might take a little while to visibly move your rank.
