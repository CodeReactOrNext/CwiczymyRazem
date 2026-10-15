# Arsenal expansion: 30 items

Approved scope: 20 pedals and 10 guitars, each with original transparent artwork and three WebP sizes. Existing item IDs and assets remain stable.

Audit: 78 guitars and 34 pedals. Overdrive has ten entries; Wah has none; Compressor, Distortion, Flanger, Phaser, Boost, EQ and Tuner each have one. Guitar additions prioritize P90, semi-hollow, headless, T-type, resonator and offset builds.

Implementation: generate each asset separately using the built-in image generator; inspect artwork; preserve alpha and create responsive variants; append catalogue entries and explicit guitar salvage BOMs; validate asset availability, unique IDs, drop eligibility, hardware compatibility, lint and tests.

No Firestore model or rules changes are needed. Definitions automatically feed Dex and existing drop pools. The writing-plans skill referenced by brainstorming is not installed; this document records the implementation plan directly.

## Delivered

- Guitar IDs 80–89, artwork slots special/81–90; effect IDs 35–54, artwork slots 36–55.
- 30 original built-in ImageGen assets, 90 transparent WebP files, 4.71 MiB total. Individual prompts and the three targeted artwork corrections are recorded in `2026-10-15-arsenal-assets.json`.
- Explicit salvage layouts for all ten new guitars and the five earlier guitars (75–79) that were missing them. Pedal salvage uses existing type layouts.
- Exact pedal image aspect ratios authored for initial board placement; new Wah models make the existing filter stage playable.
- Silver Delta is Rare because an Epic resonator could unlock more mod slots than its compatible pool provides. Iron Bite is Uncommon to preserve the existing scrap/trader price balance.
- Dex pagination and complete-chain test fixtures updated for the expanded catalogue and the newly available Wah stage.

## Validation

- `npm test -- --run`: 458 files passed, 19 skipped; 5060 tests passed, 20 skipped.
- Changed TypeScript files pass ESLint; formatting and `git diff --check` pass.
- Repository-wide `npm run lint` reports 489 errors and 409 warnings across existing code outside this change. No PR has been opened.
- Asset integration tests verify all 90 paths, transparent channels, landscape guitar orientation, drop eligibility, unique pedal IDs/art slots and exact pedalboard aspect ratios.
