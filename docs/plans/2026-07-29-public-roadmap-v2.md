# Public Roadmap — Draft v2

**Date:** 2026-07-29
**Status:** draft, no funding tiers ($) assigned yet — sequencing only.
**Scope:** new/undone items for `/roadmap` (`src/feature/roadmap/data/roadmap.data.ts`), on top of what's already shipped.

Already `done: true` and not repeated below: +10/+10/+10 Guitars & Pedals, +5/+5 Exercises,
Community Song Playlists, Standard Notation View, Improved Custom Exercises, Fully Customizable
Tablature, Desktop App.

`kind` follows the existing schema (`content` = drip content, `feature` = shipped capability),
kept so this list can be pasted straight into `roadmap.data.ts` once prices are set.

## Ordering rationale

- Content drops (exercises, gear) are split into smaller, more frequent doses than before, so
  supporters see something new more often.
- **Achievements rework** comes early — the 3 gamification systems below all lean on
  achievements/rarity meaning something, so it should land before them, not after.
- The 3 gamification systems build on each other: gear rewards (more gear in circulation) →
  Luthier (something to spend that gear's rarity on) → player progression/leveling (the umbrella
  system that gates content using both). Reordered from the brain-dump for that reason — flag if
  you want gear-reward before luthier for a different reason.
- Configurable profile sits after progression, since "unlockable profile layouts" (mentioned
  under progression) only makes sense once there's something to unlock them with.
- Boss/mini-games is kept last and marked TBD — the idea itself isn't specced yet.

## Sequence

1. **[content] +4 New Exercises** — batch 1/5 (20 total, was +5/tier — smaller, more frequent)
2. **[content] +5 New Guitars & Pedals** — batch 1/10 (50 total, was +10/tier — smaller, more frequent)
3. **[feature] Sync Backing Track to Tablature** — backing tracks for songs synced to the tab, playable along with it
4. **[content] +4 New Exercises** — batch 2/5
5. **[feature] Achievements Rework** — redo existing achievements + add more; make them mean something (rewards, not just a badge)
6. **[content] +5 New Guitars & Pedals** — batch 2/10
7. **[feature] Gamification — Path/Skill Completion Rewards** — finishing a Journey, Roadmap, Skill track, etc. drops a guitar or effect
8. **[content] +4 New Exercises** — batch 3/5
9. **[feature] Luthier — Guitar Parts & Upgrading** — gear drops parts by rarity on use/sale; spend parts of a matching rarity to level up a guitar or effect
10. **[content] +5 New Guitars & Pedals** — batch 3/10
11. **[feature] Player Progression System** — level from playing; unlocks milestones, profile layouts, and gates which gear rarity you can equip
12. **[content] +4 New Exercises** — batch 4/5
13. **[feature] Configurable Dashboard** — pick your own layout, widgets and shortcuts for the main panel
14. **[feature] Configurable Guitarist Profile** — customize what's shown and how, using layouts unlocked via progression
15. **[content] +5 New Guitars & Pedals** — batch 4/10
16. **[feature] Practice Mode** — set goals and how to hit them, with analytics on per-exercise progress
17. **[content] +4 New Exercises** — batch 5/5
18. **[feature] Challenges** — a rotating exercise (changes every few days) with its own leaderboard
19. **[content] +5 New Guitars & Pedals** — batch 5/10
20. **[feature] New Journey / Learning Path #2**
21. **[content] +5 New Guitars & Pedals** — batch 6/10
22. **[feature] Learning Path #3**
23. **[content] +5 New Guitars & Pedals** — batch 7/10
24. **[feature] Roadmap #1** *(needs clarification — new AI Coach roadmap template, or something else?)*
25. **[content] +5 New Guitars & Pedals** — batch 8/10
26. **[feature] Roadmap #2** *(same clarification as above)*
27. **[content] +5 New Guitars & Pedals** — batch 9/10
28. **[feature] Video Demonstrations for Challenging Exercises** — carried over from old roadmap, still undone
29. **[content] +5 New Guitars & Pedals** — batch 10/10
30. **[feature] Boss / Mini-games — TBD** *(idea only, "games? Boss -> ???" — needs to be specced before it can be scheduled/priced)*

## Open questions before this goes into `roadmap.data.ts`

- **Roadmap #1 / #2** — what are these exactly? Two more AI Coach roadmap templates
  (`feature/aiCoach`), two more `Journey`-style structured paths, or something else?
- **Boss / mini-games** — no concept yet, needs a spec before it can be sequenced for real
  (currently placed last by default).
- Funding amounts ($) for every tier — none assigned yet per your instruction.
- Batch sizes (4 exercises / 5 gear per drop) are a guess at "smaller than before" — say if you
  want different numbers.
