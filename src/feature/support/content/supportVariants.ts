import type { Translate } from "lib/i18n/translate";
import { translateOr } from "lib/i18n/translate";

/** Every message the Activity feed can show. Source of truth for the union below. */
export const SUPPORT_VARIANT_IDS = [
  "server_cost",
  "one_person",
  "one_off_ok",
  "roadmap_tier",
  "roadmap_momentum",
  "value_received",
  "social_proof",
] as const;

export type SupportVariantId = (typeof SUPPORT_VARIANT_IDS)[number];

/**
 * Asked while the month's hosting bill is still short — the ask leads with running costs.
 */
const COST_VARIANTS: SupportVariantId[] = [
  "server_cost",
  "roadmap_tier",
  "value_received",
  "one_person",
  "one_off_ok",
];

/**
 * Asked once hosting is already covered. The project still needs funding — the roadmap is
 * unlocked tier by tier — so the ask keeps running, it just stops pretending the servers are
 * at risk. Repeating "server cost needs your help" next to a covered progress bar would read
 * as dishonest, so the cost-first variants are deliberately absent from this pool.
 */
const ROADMAP_VARIANTS: SupportVariantId[] = [
  "roadmap_tier",
  "value_received",
  "roadmap_momentum",
  "social_proof",
  "one_off_ok",
];

/**
 * Cycles through the variants by shown-count, so repeat asks never repeat the same message.
 * `isCovered` swaps the whole pool: costs-first while the month is short, roadmap-first once
 * it's funded. Both pools are the same length, so a daily cron works through a full rotation
 * before any message comes back around.
 */
export function pickSupportVariant(
  shownCount: number,
  isCovered = false,
): SupportVariantId {
  const pool = isCovered ? ROADMAP_VARIANTS : COST_VARIANTS;
  const index = ((shownCount % pool.length) + pool.length) % pool.length;
  return pool[index];
}

/** How many asks run before a message repeats — the rotation length of the smaller pool. */
export const SUPPORT_VARIANT_CYCLE = Math.min(
  COST_VARIANTS.length,
  ROADMAP_VARIANTS.length,
);

export interface SupportVariantContext {
  raisedThisMonth: number;
  monthlyGoal: number;
  totalRaised: number;
  supporters: number;
  /** Next unfunded roadmap tier, if any — omitted once every tier is funded. */
  nextTierLabel?: string | null;
  nextTierAmountToGo?: number | null;
  /** How far the tier ladder has been climbed, for the momentum framing. */
  tiersFunded?: number | null;
  tiersTotal?: number | null;
}

export interface SupportVariantCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

export function getSupportVariantCopy(
  variant: SupportVariantId,
  ctx: SupportVariantContext,
  t?: Translate,
): SupportVariantCopy {
  const isCovered = ctx.raisedThisMonth >= ctx.monthlyGoal;
  const tr = (key: string, english: string, vars?: Record<string, unknown>) =>
    translateOr(t, `feed:support_ask.${key}`, english, vars);

  switch (variant) {
    case "server_cost": {
      return {
        eyebrow: tr("server_cost.eyebrow", "Help build Riff Quest"),
        headline: isCovered
          ? tr("server_cost.headline_covered", "Server cost this month is covered")
          : tr("server_cost.headline", "Server cost needs your help"),
        body: isCovered
          ? tr(
              "server_cost.body_covered",
              "This month's hosting is already funded. Anything extra goes straight to the roadmap below.",
            )
          : tr(
              "server_cost.body",
              "Riff Quest is a one person project, free and built in the open. ${{raised}} of ${{goal}} raised so far this month.",
              { raised: ctx.raisedThisMonth, goal: ctx.monthlyGoal },
            ),
      };
    }

    case "one_person": {
      return {
        eyebrow: tr("one_person.eyebrow", "One person project"),
        headline: tr(
          "one_person.headline",
          "Riff Quest is built by one person, in the open",
        ),
        body: tr(
          "one_person.body",
          "No team, no investors, no growth targets. Support is what decides how much time goes into it and what gets built next.",
        ),
      };
    }

    case "one_off_ok": {
      return {
        eyebrow: tr("one_off_ok.eyebrow", "No subscription needed"),
        headline: tr(
          "one_off_ok.headline",
          "A one-off coffee counts as much as a monthly one",
        ),
        body: tr(
          "one_off_ok.body",
          "There is nothing to sign up for and nothing to cancel later. One coffee, once, is a completely normal way to support this.",
        ),
      };
    }

    case "roadmap_tier": {
      if (!ctx.nextTierLabel || ctx.nextTierAmountToGo == null) {
        return {
          eyebrow: tr("roadmap.eyebrow", "Roadmap"),
          headline: tr(
            "roadmap_tier.headline_done",
            "Every roadmap goal is funded, thank you",
          ),
          body: tr(
            "roadmap_tier.body_done",
            "The community has funded everything on the roadmap so far. Whatever comes in next kicks off the next tier.",
          ),
        };
      }
      return {
        eyebrow: tr("roadmap.eyebrow", "Roadmap"),
        headline: tr(
          "roadmap_tier.headline",
          '${{amount}} to go for "{{tier}}"',
          { amount: ctx.nextTierAmountToGo, tier: ctx.nextTierLabel },
        ),
        body: isCovered
          ? tr(
              "roadmap_tier.body_covered",
              "This month's hosting is already paid for, so everything from here goes straight into building the next unlock.",
            )
          : tr(
              "roadmap_tier.body",
              "Lifetime support unlocks the roadmap tier by tier. This is the next one in line.",
            ),
      };
    }

    case "roadmap_momentum": {
      // Without the tier counts there's nothing to be proud of yet — fall back to the
      // plain "next unlock" framing rather than rendering "0 of 0 goals funded".
      if (!ctx.tiersFunded || !ctx.tiersTotal) {
        return getSupportVariantCopy("roadmap_tier", ctx, t);
      }
      return {
        eyebrow: tr("roadmap.eyebrow", "Roadmap"),
        headline: tr(
          "roadmap_momentum.headline",
          "{{funded}} of {{total}} roadmap goals funded so far",
          { funded: ctx.tiersFunded, total: ctx.tiersTotal },
        ),
        body: ctx.nextTierLabel
          ? tr(
              "roadmap_momentum.body_next",
              'Servers are paid for — support now goes into building. "{{tier}}" is next in line.',
              { tier: ctx.nextTierLabel },
            )
          : tr(
              "roadmap_momentum.body",
              "Servers are paid for, so support now goes straight into building the roadmap.",
            ),
      };
    }

    case "value_received": {
      return {
        eyebrow: tr("value_received.eyebrow", "Stays free"),
        headline: tr(
          "value_received.headline",
          "Riff Quest stays free for every session you practice",
        ),
        body: isCovered
          ? tr(
              "value_received.body_covered",
              "No paywalls on exercises, plans, or tracking. Hosting is covered this month, so a coffee now funds the next thing on the roadmap.",
            )
          : tr(
              "value_received.body",
              "No paywalls on exercises, plans, or tracking. If it's helped your playing, a coffee keeps it that way.",
            ),
      };
    }

    case "social_proof": {
      return {
        eyebrow: tr("social_proof.eyebrow", "Community support"),
        headline:
          ctx.supporters > 0
            ? tr(
                "social_proof.headline",
                "{{supporters}} supporters have chipped in ${{raised}} this month",
                { supporters: ctx.supporters, raised: ctx.raisedThisMonth },
              )
            : tr(
                "social_proof.headline_none",
                "Riff Quest is funded by the community",
              ),
        body: tr(
          "social_proof.body",
          "It keeps Riff Quest free and funds the roadmap. Tap to see where it goes.",
        ),
      };
    }

    default: {
      const exhaustiveCheck: never = variant;
      return exhaustiveCheck;
    }
  }
}
