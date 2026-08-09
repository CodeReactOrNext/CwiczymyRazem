import { cn } from "assets/lib/utils";

/**
 * The Custom Shop finish.
 *
 * Every other rarity is one colour, because every other rarity comes out of a
 * case. Custom Shop cannot be dropped — it only exists at the end of three
 * promotions — so it gets the one treatment no roll can hand you: a prismatic
 * foil that drifts across the card.
 *
 * The hues are borrowed from the tiers below it (Rare blue → Epic purple →
 * Legendary rose → Mythic amber), so it reads as *all of them at once* rather
 * than as a seventh colour nobody has seen before.
 */

const FOIL =
  "linear-gradient(115deg," +
  "transparent 18%," +
  "rgba(56,189,248,0.16) 30%," +
  "rgba(168,85,247,0.18) 42%," +
  "rgba(244,114,182,0.16) 52%," +
  "rgba(251,191,36,0.15) 63%," +
  "rgba(255,255,255,0.10) 71%," +
  "transparent 82%)";

/** Full-bleed sheen. Sits under the card's content, above its background. */
export const HoloFoil = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn(
      "pointer-events-none absolute inset-0 z-0 animate-gradient",
      className,
    )}
    style={{
      backgroundImage: FOIL,
      backgroundSize: "220% 220%",
      mixBlendMode: "screen",
    }}
  />
);

/** The card's top rule, in the same foil. Replaces the flat rarity stripe. */
export const HoloStripe = () => (
  <div
    aria-hidden
    className='h-[2px] w-full flex-shrink-0 animate-gradient'
    style={{
      backgroundImage:
        "linear-gradient(90deg, transparent, #38bdf8, #a855f7, #f472b6, #fbbf24, #ffffff, transparent)",
      backgroundSize: "220% 100%",
    }}
  />
);
