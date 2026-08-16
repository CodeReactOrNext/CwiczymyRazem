/**
 * What the rig pays on top of the practice curve.
 *
 * Rig Level used to do nothing but order the gear leaderboard: a player could
 * sink hundreds of Fame and a stash of parts into builds and mods and the number
 * moved without ever changing what the game paid them. This turns it into a
 * rate — Fame per hour of practice — so every build, mod and better guitar has a
 * price the player can read off the card before they pay it.
 *
 * Three decisions worth spelling out, because each replaced something worse:
 *
 *  • **A power curve, not a hyperbola.** An asymptotic `max · r/(r+k)` shape put
 *    the whole live range inside its own flat tail — with the top rig in the game
 *    at ~750 and the average at 100–200, going from 500 to 750 was worth under
 *    2 Fame/h, so the last stretch of the ladder paid nothing. `r^0.75` keeps
 *    rising: the same 500 → 750 climb is worth ~8 Fame/h, and one extra level is
 *    worth 60% as much at rig 750 as it is at rig 100 (versus a tenth under the
 *    hyperbola). Diminishing, never dead.
 *
 *  • **No tiers.** Bracketed rates (every 100 levels) meant nothing happened
 *    between the brackets: three quarters of the work bought a number that did
 *    not move. Continuous means every single level ticks the rate up.
 *
 *  • **Every minute counts.** An earlier draft paid only the day's first half
 *    hour. That bounded the payout, but it made the headline rate a lie: a rig
 *    advertising "8.7 Fame/h" handed back 4 Fame for an hour practised, and that
 *    gap is the first thing anyone noticed. A rate the UI states has to be the
 *    rate the game pays, so the clamp is gone.
 *
 *    The trade is deliberate and worth knowing: unlike `cumulativeDailyFame` this
 *    does not flatten, so a four-hour day at the top rig pays four times a
 *    one-hour day rather than tapering. `RIG_FAME_COEFF` is the knob if that ever
 *    needs pulling back.
 *
 * Deliberately dependency-free: `calculateSessionFame` imports this, and pulling
 * `getRigLevel` in here would drag every guitar and effect definition into the
 * report bundle. Callers pass the level they already have.
 */

/**
 * Scales the whole table without changing its shape — the tuning knob.
 *
 * Doubled from an initial 0.21, which made the rig read as decoration: the average
 * rig paid 4 Fame for a 25-minute session against a practice curve of 15, so the
 * one number the whole Arsenal feeds was worth about a quarter of just showing up.
 */
export const RIG_FAME_COEFF = 0.42;

/** Curvature. Owns the top-end payoff; leave it alone when rebalancing. */
export const RIG_FAME_EXPONENT = 0.75;

/**
 * Backstop, not a balance lever — nothing in the game reaches it today (the top
 * rig pays ~60/h). `buildLevel` is uncapped and promotions compound, so without
 * this a rig of 4000 would quietly pay 200/h a year from now.
 */
export const RIG_FAME_HOURLY_CEILING = 90;

/**
 * Fame per hour of practice this rig is worth. Continuous in `rigLevel`, so it
 * moves on every point — which is what makes it worth previewing on a mod.
 */
export const getRigFameRate = (rigLevel: number): number => {
  if (!Number.isFinite(rigLevel) || rigLevel <= 0) return 0;

  return Math.min(
    RIG_FAME_HOURLY_CEILING,
    RIG_FAME_COEFF * rigLevel ** RIG_FAME_EXPONENT,
  );
};

/**
 * Cumulative rig Fame owed for `minutes` practised in one day.
 *
 * Monotone in `minutes`, so — exactly like `cumulativeDailyFame` — the difference
 * between two calls is never negative and splitting a day into many reports pays
 * the same as filing one.
 */
export const cumulativeRigFame = (
  minutes: number,
  rigLevel: number,
): number => {
  const rate = getRigFameRate(rigLevel);
  if (rate <= 0) return 0;

  return Math.round((rate * Math.max(0, minutes)) / 60);
};

/** The rate as the UI prints it — one decimal, so every level visibly moves it. */
export const formatRigFameRate = (rigLevel: number): string =>
  getRigFameRate(rigLevel).toFixed(1);
