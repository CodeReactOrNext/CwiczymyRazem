---
name: wiki-audit
description: Audit the player-facing wiki in src/content/wiki against docs/WIKI.md, the STYLEGUIDE and — most importantly — the actual constants in the code. Use when asked to review, audit, or check the wiki, when wiki numbers may have drifted from the app, or before shipping a batch of wiki edits.
---

# Wiki audit

The wiki (`src/content/wiki/*.md`, rendered by `src/pages/wiki/[slug].tsx`) is a
manual **for the player**. Its failure mode is not broken markdown — `npm test`
already catches that — it is **quietly lying**: a number that was true when the
article was written and has since changed in the code.

Audit in this order. Do not skip step 2; it is the only part the test suite
cannot do.

## 1. Structural checks (cheap, run first)

```bash
npx vitest run src/lib/wiki.test.tsx
```

That covers: every article compiles, frontmatter is present, `/wiki/…` links
resolve, `/images/…` files exist. If it passes, structure is fine — move on.

Then check what the test does *not*:

- Every article ends with `<FaqList />` and `<ReadNext />` (docs/WIKI.md rule).
- `order` values inside a `section` are contiguous and unique — a gap usually
  means a deleted article nobody renumbered.
- Every component registered in the `components` map of `src/pages/wiki/[slug].tsx`
  is actually used by at least one article, and every component used is
  registered *and* documented in the table in `docs/WIKI.md`. Drift goes both
  ways: an orphan component, or an undocumented one.
- `docs/WIKI.md` and the Wiki section of `AGENTS.md` don't name components or
  articles that no longer exist.

## 2. Fact-check every number against the code

This is the point of the audit. Pull each claim out of the articles and find the
constant it came from. Report a **verdict per claim**: confirmed / wrong / not
found. Known sources of truth:

| Claim in the wiki | Where it really lives |
|---|---|
| points per minute, habit points | `src/constants/ratingValue.ts` |
| streak multipliers | `src/utils/gameLogic/getDailyStreakMultiplier.ts` |
| daily quest pool + how the draw dedupes | `src/feature/user/store/userSlice.ts` (`taskTemplates`, `group`) |
| daily quest Fame reward | `src/feature/user/store/userSlice.questActions.ts` |
| case names and prices | `src/feature/arsenal/data/caseDefinitions.ts` |
| Trader stock, part and mod prices | `src/feature/arsenal/data/traderShop.ts` |
| weekly Milestone costs and rewards | `src/feature/aiSummary/utils/milestoneLogic.ts` |
| Scale Map families, patterns, tempos, reward | `src/feature/scaleTree/data/scaleTreeNodes.ts` |
| Learning Path modules and steps | `src/feature/journey/data/*.ts` |
| tracked skills and their categories | `src/feature/skills/data/guitarSkills.ts` |
| exercise / routine counts | `src/feature/exercisePlan/data/exercisesAgregat.ts`, `plansAgregat.ts` |
| what is premium vs free | `FREE_PLAN_IDS` in `plansAgregat.ts`, `premiumUntil` usage |

Two traps worth naming, because both have already bitten this wiki:

- **A grouping invented for the article.** If the article groups things for
  readability and then makes a *mechanical* claim about those groups ("it takes
  at most one from each"), check the grouping in the code matches. Presentational
  groups and code `group` keys are not the same thing.
- **Counts with a "counted at the time of writing" caption.** Treat these as
  already stale. The repo's own pattern for this is
  `src/feature/landing/data/heroStats.ts` — a generated file with a script and a
  refresh date. Recommend the same rather than a hand-typed number.

## 3. Voice and audience

From docs/WIKI.md — the wiki is written for a player, not a developer:

- No URL paths, database field names, cache behaviour or formulas. Where to
  click is `<ClickPath />`, not `/timer/auto`.
- Names must match what the UI is actually labelled. Check ClickPath steps
  against the real nav and screen labels, not against memory.
- Screenshots must show realistic data, and only where "what the screen looks
  like" is the point; mechanics stay as component mock-ups so they age with the
  design.

Also look for **gaps**: features that exist in the app and are nowhere in the
wiki. Diffing the main nav and the feature folders against the article list
finds these faster than reading.

## 4. Presentation

`src/feature/wiki/*` and `src/components/Wiki/*` follow docs/STYLEGUIDE.md like
the rest of the app — no borders, no `uppercase`, hierarchy from background and
spacing. Check the sidebar's mobile behaviour too: it is the whole navigation,
so if it stacks above the article on a phone, every reader scrolls the entire
table of contents before reaching a word of content.

## Output

Group findings by severity, and for each one give: the file and line, what the
wiki claims, what the code says, and the one-line fix. Say plainly which claims
you verified as **correct** — a fact-check that only lists problems is not a
fact-check. Do not edit anything unless asked; the audit is the deliverable.
