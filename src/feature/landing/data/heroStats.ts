/**
 * Numbers behind the landing hero. `npm run update-hero-stats` recomputes them
 * from Firestore (see scripts/updateHeroStats.test.ts); that pass reads every
 * user and log document, so it is run deliberately rather than on a schedule.
 *
 * Last refreshed: 2026-09-05, by hand.
 * - users=3100 — registration count reported by the owner.
 * - hours=8400, sessions=8800 — NOT measured. Scaled from the 2026-08-24 figures
 *   (2800 / 7600 / 8000) by the growth in registrations, then rounded down to
 *   the hundred so the "+" the hero renders stays a floor rather than a claim
 *   above the estimate. The per-session average is unchanged at ~57 min.
 *
 * Rerun the script when the estimate has had time to drift — it replaces all
 * three with measured values and this note with a generated one.
 */
export const HERO_STATS = [
  { value: 3100, label: "guitarists on board" },
  { value: 8400, label: "hours practiced" },
  { value: 8800, label: "sessions logged" },
] as const;
