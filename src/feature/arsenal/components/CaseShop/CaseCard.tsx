import { cn } from "assets/lib/utils";

import type { CaseDefinition } from "../../types/arsenal.types";
import { DropRates } from "./DropRates";
import { FreeCaseButton } from "./FreeCaseButton";
import { OpenCaseButton } from "./OpenCaseButton";

/** Per-tier identity: the tier word in the name, one tinted wash behind the
    art and the tier's own case render. Structure, typography and the button stay
    identical across the shelf. Tier is derived from the id prefix
    ("elite-effect" -> "elite"). */
const CASE_TIER: Record<
  string,
  { color: string; image: string; wash: string }
> = {
  standard: {
    color: "#a1a1aa",
    image: "/images/case-guitar-standard.webp",
    wash: "rgba(161,161,170,0.06)",
  },
  premium: {
    color: "#818cf8",
    image: "/images/case-guitar-premium.webp",
    wash: "rgba(129,140,248,0.08)",
  },
  elite: {
    color: "#fbbf24",
    image: "/images/case-guitar-elite.webp",
    wash: "rgba(251,191,36,0.10)",
  },
  // Aged brass rather than Elite's bright amber: supporters read amber right
  // across the app, and one step deeper keeps the two apart on the same shelf.
  supporter: {
    color: "#f59e0b",
    image: "/images/case-supporter.webp",
    wash: "rgba(245,158,11,0.07)",
  },
};

/** Effect-pool cases get dedicated pedal-case art instead of the shared guitar case. */
const EFFECT_CASE_IMAGE: Record<string, string> = {
  premium: "/images/case-effects-premium.webp",
  elite: "/images/case-effects-elite.webp",
};

interface CaseCardProps {
  caseDef: CaseDefinition;
  currentFame: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  isOpening: boolean;
  /** Free cases the player is holding. Zero hides the second button entirely. */
  freeTokens?: number;
  className?: string;
}

export const CaseCard = ({
  caseDef,
  currentFame,
  onOpen,
  isOpening,
  freeTokens = 0,
  className,
}: CaseCardProps) => {
  const tier = caseDef.id.split("-")[0];
  const meta = CASE_TIER[tier] || CASE_TIER.standard;
  const isEffectCase = caseDef.dropKind === "effect";
  const image = isEffectCase
    ? EFFECT_CASE_IMAGE[tier] || meta.image
    : meta.image;
  const canAfford = currentFame >= caseDef.fameCost;

  // "Premium Guitar Case" -> the tier word takes the accent, the rest stays neutral.
  const [tierWord, ...restOfName] = caseDef.name.split(" ");

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 overflow-hidden rounded-lg bg-arsenal-section p-5 transition-colors hover:bg-arsenal-card",
        className,
      )}>
      {/* Tier tint — a wash off the top edge instead of a tier-colored frame. */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${meta.wash} 0%, transparent 70%)`,
        }}
      />

      <div className='relative flex items-center justify-end'>
        <DropRates probabilities={caseDef.probabilities} />
      </div>

      {/* The case itself is the card. Every render is a three-quarter view
          from above, lit from the upper left, lying with its long axis from
          lower-left to upper-right — so the contact shadow is a long ellipse
          turned along that same axis and pushed a little to the lower right,
          away from the light. The art is bottomed out in the box so its base
          actually meets the shadow instead of hovering above it. */}
      <div className='relative flex h-40 items-end justify-center pb-2 sm:h-44'>
        <div
          className='pointer-events-none absolute left-1/2 top-1/2 h-24 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[48px]'
          style={{
            background: `radial-gradient(ellipse at center, ${meta.color}33 0%, ${meta.color}0d 55%, transparent 80%)`,
          }}
        />
        <div
          className={cn(
            "pointer-events-none absolute bottom-1 left-1/2 rounded-[100%] blur-[6px]",
            isEffectCase
              ? "h-[22%] w-[58%] translate-x-[-44%] -rotate-[8deg]"
              : "h-[16%] w-[74%] translate-x-[-46%] -rotate-[14deg]",
          )}
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 40%, transparent 70%)",
          }}
        />
        <img
          src={image}
          alt={caseDef.name}
          className='relative z-10 max-h-[92%] w-[90%] object-contain object-bottom transition-transform duration-300 group-hover:-translate-y-1'
          draggable={false}
          loading='lazy'
        />
      </div>

      <div className='relative min-w-0'>
        <h3 className='font-display text-lg font-bold text-zinc-100'>
          <span style={{ color: meta.color }}>{tierWord}</span>{" "}
          {restOfName.join(" ")}
        </h3>
        <p className='mt-1 text-xs leading-relaxed text-zinc-500'>
          {caseDef.description}
        </p>
      </div>

      <div className='relative mt-auto flex flex-col gap-2 pt-1'>
        <div className='flex items-center justify-between gap-4'>
          <span className='flex items-center gap-2 text-sm font-bold tabular-nums'>
            <img
              src='/images/coin.png'
              alt=''
              className={cn(
                "h-5 w-5 object-contain",
                !canAfford && "opacity-50 grayscale",
              )}
            />
            <span className={canAfford ? "text-amber-400" : "text-red-400"}>
              {caseDef.fameCost}
            </span>
            <span className='text-xs font-medium text-zinc-500'>Fame</span>
          </span>
          <OpenCaseButton
            canAfford={canAfford}
            isOpening={isOpening}
            onClick={() => onOpen(caseDef.id)}
            variant='soft'
            className='px-5'
          />
        </div>
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
