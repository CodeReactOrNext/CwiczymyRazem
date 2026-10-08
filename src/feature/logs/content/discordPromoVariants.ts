import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

export interface DiscordPromoCopy {
  headline: string;
  body: string;
}

interface VariantSource {
  headline: string;
  body: string;
}

/**
 * The jokes the feed rotates through, in English — the fallback for every
 * locale and the source the translations follow. Each one is a headline and a line
 * of what the server actually is.
 */
const VARIANTS: VariantSource[] = [
  {
    headline: "Your amp has an off switch. Our Discord doesn't.",
    body: "Players talking gear, posting riffs and losing arguments about tone at every hour. Come say hi.",
  },
  {
    headline: "Practising alone is fine. Complaining alone isn't.",
    body: "Share your wins, ask about technique, find someone at your level to keep you honest.",
  },
  {
    headline: "There's a gear channel. It never sleeps.",
    body: "Pedals, strings, the guitar you definitely can't afford. Bring opinions.",
  },
  {
    headline: "Recorded a riff? Get real ears on it.",
    body: "Drop a clip and get feedback from players who know exactly how that bend feels.",
  },
  {
    headline: "Your guitar wants friends. You might too.",
    body: "Guilds, challenges and people practising the same thing you are. Join the Riff Quest Discord.",
  },
];

export const DISCORD_PROMO_VARIANT_COUNT = VARIANTS.length;

/** Cycles through the jokes by how many cards ran before, so two in a row never match. */
export const pickDiscordPromoVariant = (shownCount: number): number =>
  ((shownCount % VARIANTS.length) + VARIANTS.length) % VARIANTS.length;

/**
 * The card's copy for a stored variant. An index from a future deploy that this
 * build doesn't know yet wraps around instead of rendering an empty card.
 */
export const getDiscordPromoCopy = (
  variant: number,
  t?: Translate,
): DiscordPromoCopy => {
  const index = pickDiscordPromoVariant(Number.isFinite(variant) ? variant : 0);
  const source = VARIANTS[index];
  const key = `feed:discord_promo.v${index + 1}`;

  return {
    headline: translateOr(t, `${key}.headline`, source.headline),
    body: translateOr(t, `${key}.body`, source.body),
  };
};
