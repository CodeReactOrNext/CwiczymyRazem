export type SupportVariantId =
  | "server_cost"
  | "roadmap_tier"
  | "value_received"
  | "social_proof";

const SUPPORT_VARIANTS: SupportVariantId[] = [
  "server_cost",
  "roadmap_tier",
  "value_received",
  "social_proof",
];

/** Cycles through the 4 variants by shown-count, so repeat asks never repeat the same message. */
export function pickSupportVariant(shownCount: number): SupportVariantId {
  const index = ((shownCount % SUPPORT_VARIANTS.length) + SUPPORT_VARIANTS.length) % SUPPORT_VARIANTS.length;
  return SUPPORT_VARIANTS[index];
}

export interface SupportVariantContext {
  raisedThisMonth: number;
  monthlyGoal: number;
  totalRaised: number;
  supporters: number;
  /** Next unfunded roadmap tier, if any — omitted once every tier is funded. */
  nextTierLabel?: string | null;
  nextTierAmountToGo?: number | null;
}

export interface SupportVariantCopy {
  eyebrow: string;
  headline: string;
  body: string;
}

export function getSupportVariantCopy(
  variant: SupportVariantId,
  ctx: SupportVariantContext
): SupportVariantCopy {
  switch (variant) {
    case "server_cost": {
      const isCovered = ctx.raisedThisMonth >= ctx.monthlyGoal;
      return {
        eyebrow: "Help build Riff Quest",
        headline: isCovered
          ? "Server cost this month is covered"
          : "Server cost needs your help",
        body: isCovered
          ? "This month's hosting is already funded. Anything extra goes straight to the roadmap below."
          : `Riff Quest is a one person project, free and built in the open. $${ctx.raisedThisMonth} of $${ctx.monthlyGoal} raised so far this month.`,
      };
    }

    case "roadmap_tier": {
      if (!ctx.nextTierLabel || ctx.nextTierAmountToGo == null) {
        return {
          eyebrow: "Roadmap",
          headline: "Every roadmap goal is funded, thank you",
          body: "The community has funded everything on the roadmap so far. Whatever comes in next kicks off the next tier.",
        };
      }
      return {
        eyebrow: "Roadmap",
        headline: `$${ctx.nextTierAmountToGo} to go for "${ctx.nextTierLabel}"`,
        body: "Lifetime support unlocks the roadmap tier by tier. This is the next one in line.",
      };
    }

    case "value_received": {
      return {
        eyebrow: "Stays free",
        headline: "Riff Quest stays free for every session you practice",
        body: "No paywalls on exercises, plans, or tracking. If it's helped your playing, a coffee keeps it that way.",
      };
    }

    case "social_proof": {
      return {
        eyebrow: "Community support",
        headline:
          ctx.supporters > 0
            ? `${ctx.supporters} supporters have chipped in $${ctx.raisedThisMonth} this month`
            : "Riff Quest is funded by the community",
        body: "It keeps Riff Quest free and funds the roadmap. Tap to see where it goes.",
      };
    }

    default: {
      const exhaustiveCheck: never = variant;
      return exhaustiveCheck;
    }
  }
}
