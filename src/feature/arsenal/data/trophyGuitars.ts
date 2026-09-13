/**
 * The guitars handed out for finishing a curated roadmap, and the single list
 * every drop pool filters against.
 *
 * A roadmap is 37 to 38 steps and roughly 250 logged practice sessions — by a
 * wide margin the longest thing the app asks anyone to do. Its trophy is the
 * only guitar in the game that cannot be rolled: not from a case, not from the
 * Featured rotation, not off a Supporter slate. Finishing the roadmap is the
 * only way the model enters a collection.
 *
 * That is a deliberate reversal. These models used to sit in the case pools as
 * well, which made the trophy a *guaranteed* copy of something a long enough
 * grind would have produced anyway. Now the roadmap is the grind.
 *
 * ─── What this costs elsewhere ──────────────────────────────────────────────
 *
 * Five of the game's ten Mythics and two of its ten Legendaries are trophies,
 * so the droppable pools at those tiers are halved and thinned respectively.
 * Mythic odds on a case card are unchanged; what changes is that a Mythic roll
 * now spreads across five models instead of ten, which makes each remaining one
 * twice as likely. A player chasing a specific droppable Mythic is better off
 * than before, and the Dex can only be completed by finishing all seven
 * roadmaps.
 *
 * ─── Why this file has no imports ───────────────────────────────────────────
 *
 * `guitarDefinitions` filters its drop pools against this list, and
 * `roadmapRewards` resolves the trophy for a finished roadmap out of
 * `guitarDefinitions`. Keeping the ids here, in a module that imports nothing,
 * is what stops those two from forming a cycle.
 */

/**
 * Roadmap id → the guitar model its finish hands over.
 *
 * Pinned by id so the model printed on the reward card from a player's first
 * visit can never move under them.
 *
 * The five artist roadmaps end in a Mythic built for the job — the instrument
 * that player is identified with. The two skill roadmaps end in a Legendary:
 * they are shorter, and they teach a craft rather than a player, so the trophy
 * is a great guitar rather than *that* guitar.
 */
export const ROADMAP_TROPHY_GUITARS: Readonly<Record<string, number | string>> =
  {
    // John Mayer — the tungsten Strat.
    "58c48c07-c673-42fe-ba6b-493a9fb27274": 68, // Fairmont Stratocaster Tungsten
    // Adam Jones — the silverburst single-cut he is never seen without.
    "f078b316-705e-416d-b831-a842fdff7a24": 69, // Louis Carver Eclipse Silverburst
    // Hendrix — the white Strat.
    "0cbc5208-e56a-428f-8465-a0510e7b1f88": 67, // Fairmont Stratocaster Olympic White
    // Petrucci — the graphic superstrat.
    "2a4fbdde-83a5-4588-8bc1-6c79c626ac73": 71, // Izanor JTY Kaleido
    // Marty Friedman — the pointy one.
    "46f35fb5-be6a-494e-970c-78227135660d": 70, // Grayson Warhead Crimson
    // Improvisation — an all-rounder.
    "5431b95a-0733-4595-ae38-d600b132cbbe": 19, // Grayson Lewis Palmer Custom Shop
    // Rhythm — a workhorse.
    "d44c57a7-c2e4-4115-9abb-dde4d318e5f7": 50, // Fairmont Stratocaster Heavy Relic
  };

/** Every guitar model that is a roadmap trophy, and therefore undroppable. */
export const TROPHY_GUITAR_IDS: ReadonlySet<number | string> = new Set(
  Object.values(ROADMAP_TROPHY_GUITARS),
);

/**
 * Is this model reserved for a roadmap finish?
 *
 * The guard every drop pool applies. It says nothing about whether a player may
 * own, equip, sell or trade the guitar — only about how it can first be won.
 */
export const isTrophyGuitar = (id: number | string): boolean =>
  TROPHY_GUITAR_IDS.has(id);
