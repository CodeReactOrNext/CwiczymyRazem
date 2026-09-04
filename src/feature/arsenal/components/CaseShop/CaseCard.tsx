import { cn } from "assets/lib/utils";

import type { CaseDefinition } from "../../types/arsenal.types";
import { DropRates } from "./DropRates";
import { FreeCaseButton } from "./FreeCaseButton";
import { OpenCaseButton } from "./OpenCaseButton";

/** Per-tier identity is carried by one tinted glow behind the art and by the
    tier word in the name — structure, typography and the button stay identical
    across the shelf. Tier is derived from the id prefix ("elite-effect" -> "elite"). */
const CASE_ACCENT: Record<string, { color: string; image: string }> = {
  standard: { color: "#a1a1aa", image: "/images/case-2.webp" },
  premium: { color: "#818cf8", image: "/images/case-3.webp" },
  elite: { color: "#fbbf24", image: "/images/case-1.webp" },
  // Aged brass rather than Elite's bright amber: supporters read amber right
  // across the app, and one step deeper keeps the two apart on the same shelf.
  supporter: { color: "#f59e0b", image: "/images/case-supporter.webp" },
};

/** Effect-pool cases get dedicated pedal-case art instead of the shared guitar case. */
const EFFECT_CASE_IMAGE: Record<string, string> = {
  premium: "/images/case-effects-premium.png",
  elite: "/images/case-effects-elite.png",
};

interface CaseCardProps {
  caseDef: CaseDefinition;
  currentFame: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  isOpening: boolean;
  /** Free cases the player is holding. Zero hides the second button entirely. */
  freeTokens?: number;
  /**
   * Both layouts read art-left / copy-right. `wide` additionally pulls the
   * actions out into a third column — used for Standard alone, so the everyday
   * case reads as its own thing instead of a fifth clone of the grid.
   */
  layout?: "tile" | "wide";
  className?: string;
}

export const CaseCard = ({
  caseDef,
  currentFame,
  onOpen,
  isOpening,
  freeTokens = 0,
  layout = "tile",
  className,
}: CaseCardProps) => {
  const tier = caseDef.id.split("-")[0];
  const accent = CASE_ACCENT[tier] || CASE_ACCENT.standard;
  const image =
    caseDef.dropKind === "effect"
      ? EFFECT_CASE_IMAGE[tier] || accent.image
      : accent.image;
  const canAfford = currentFame >= caseDef.fameCost;
  const isWide = layout === "wide";

  // "Premium Guitar Case" -> the tier word takes the accent, the rest stays neutral.
  const [tierWord, ...restOfName] = caseDef.name.split(" ");

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-5 overflow-hidden rounded-lg bg-zinc-900/60 p-5 transition-colors hover:bg-zinc-800/50",
        isWide && "sm:flex-row sm:items-center sm:gap-8 sm:p-6",
        className,
      )}>
      {/* Tier tint — a wash off the top edge instead of a tier-colored frame. */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background: `radial-gradient(120% 70% at 50% 0%, ${accent.color}14 0%, transparent 70%)`,
        }}
      />

      {/* Art and copy sit side by side at every size: a case is a thing on a
          shelf, and a thing on a shelf has its label beside it, not under it. */}
      <div
        className={cn(
          "relative flex items-center gap-4",
          isWide && "sm:flex-1 sm:gap-8",
        )}>
        <div
          className={cn(
            "relative flex flex-shrink-0 items-center justify-center",
            isWide ? "h-24 w-28 sm:h-28 sm:w-44" : "h-20 w-24",
          )}>
          <div
            className={cn(
              "pointer-events-none absolute rounded-full",
              isWide ? "h-20 w-40 blur-[42px]" : "h-14 w-24 blur-[32px]",
            )}
            style={{
              background: `radial-gradient(ellipse at center, ${accent.color}40 0%, ${accent.color}10 55%, transparent 80%)`,
            }}
          />
          <img
            src={image}
            alt={caseDef.name}
            className='relative z-10 max-h-full w-full object-contain'
            draggable={false}
          />
        </div>

        <div className='min-w-0 flex-1'>
          <h3
            className={cn(
              "font-display font-bold text-zinc-100",
              isWide ? "text-xl" : "text-base",
            )}>
            <span style={{ color: accent.color }}>{tierWord}</span>{" "}
            {restOfName.join(" ")}
          </h3>
          <p className='mt-1 text-xs leading-relaxed text-zinc-500'>
            {caseDef.description}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative flex flex-col gap-3",
          isWide ? "w-full sm:w-56" : "mt-auto",
        )}>
        <DropRates probabilities={caseDef.probabilities} />
        <OpenCaseButton
          canAfford={canAfford}
          isOpening={isOpening}
          onClick={() => onOpen(caseDef.id)}
          fameCost={caseDef.fameCost}
          variant='soft'
          className='w-full'
        />
        {freeTokens > 0 && (
          <FreeCaseButton
            isOpening={isOpening}
            tokens={freeTokens}
            onClick={() => onOpen(caseDef.id, true)}
            className='w-full'
          />
        )}
      </div>
    </article>
  );
};
