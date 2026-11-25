import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { hasPity } from "feature/arsenal/utils/pity";
import { readableText } from "lib/colorTheme/colorTheme";
import { Interpolate } from "lib/i18n/Interpolate";
import type { ReactNode } from "react";

import type {
  CaseDefinition,
  CasePityCounters,
} from "../../types/arsenal.types";
import { CaseBuyControl } from "./CaseBuyControl";
import { DropRates } from "./DropRates";
import { PityMeter } from "./PityMeter";

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
  // The top of the ladder takes the one colour the shelf has not used: violet is
  // the app's "rare / special", and nothing above Elite should look like Elite.
  // Elite's render with its gold turned to the same violet, so the case on the
  // card is the colour of its name instead of a second Elite.
  vault: {
    color: "#c084fc",
    image: "/images/case-guitar-vault.webp",
    wash: "rgba(192,132,252,0.10)",
  },
  // Parts are a currency, not a chase, so the crate stays neutral.
  parts: {
    color: "#d4d4d8",
    image: "/images/case-parts.webp",
    wash: "rgba(212,212,216,0.05)",
  },
};

/** Effect-pool cases get dedicated pedal-case art instead of the shared guitar case. */
const EFFECT_CASE_IMAGE: Record<string, string> = {
  premium: "/images/case-effects-premium.webp",
  elite: "/images/case-effects-elite.webp",
  vault: "/images/case-effects-vault.webp",
};

/**
 * A case's render and its tier colour, for anything besides the shelf that has
 * to show the case — the pack screen puts it on the back of every card.
 */
export const getCaseArt = (
  caseDef: Pick<CaseDefinition, "id" | "dropKind">,
): { image: string; color: string } => {
  const tier = caseDef.id.split("-")[0];
  const meta = CASE_TIER[tier] || CASE_TIER.standard;
  const image =
    caseDef.dropKind === "effect"
      ? EFFECT_CASE_IMAGE[tier] || meta.image
      : meta.image;
  return { image, color: meta.color };
};

interface CaseCardProps {
  caseDef: CaseDefinition;
  currentFame: number;
  onOpen: (caseType: string, useToken?: boolean) => void;
  isOpening: boolean;
  /** Free cases the player is holding. Zero hides the second button entirely. */
  freeTokens?: number;
  /** Opens a pack of this many. Omitted, the card has no pack buttons. */
  onOpenPack?: (caseType: string, count: number) => void;
  /** This case's pity counters. Absent reads as a fresh counter. */
  pity?: CasePityCounters;
  /** Whether a never-held model is still within reach — see `canDiscoverNew`. */
  canDiscoverNew?: boolean;
  /** The guitar/pedal switch of a case that comes in both, shown in the card's corner. */
  toggle?: ReactNode;
  /**
   * The row of its own under the ladder: art, name and controls side by side
   * across the whole shelf instead of one card alone in a row of four.
   */
  wide?: boolean;
}

export const CaseCard = ({
  caseDef,
  currentFame,
  onOpen,
  isOpening,
  freeTokens = 0,
  onOpenPack,
  pity,
  canDiscoverNew = true,
  toggle,
  wide = false,
}: CaseCardProps) => {
  const tier = caseDef.id.split("-")[0];
  const meta = CASE_TIER[tier] || CASE_TIER.standard;
  const isEffectCase = caseDef.dropKind === "effect";
  const { image } = getCaseArt(caseDef);
  const labels = useArsenalLabels();
  const { t } = labels;

  // "Premium Guitar Case" -> the tier word takes the accent, the rest stays
  // neutral. Translations move the slot, so the title is a template around it.
  const [tierWord, ...restOfName] = caseDef.name.split(" ");
  const title = t(
    `cases.defs.${caseDef.id}.title`,
    `{{tier}} ${restOfName.join(" ")}`,
  );

  return (
    <article
      className={cn(
        // On a phone the card is a shop row: art on the left, the name and its
        // guarantee beside it, the controls across the bottom.
        "group relative isolate grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 overflow-hidden rounded-lg bg-arsenal-section p-4 transition-colors hover:bg-arsenal-card sm:flex sm:p-5",
        wide ? "sm:gap-6" : "sm:flex-col sm:items-stretch sm:gap-4",
      )}>
      {/* Tier tint — a wash off the top edge instead of a tier-colored frame. */}
      <div
        className='light-hide pointer-events-none absolute inset-0 -z-10'
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, ${meta.wash} 0%, transparent 70%)`,
        }}
      />

      {/* A case that comes one way keeps the row empty on the wide shelf, so
          the art lines up across the ladder. */}
      {!wide && (
        <div
          className={cn(
            "relative col-span-2 sm:min-h-[44px]",
            !toggle && "hidden sm:block",
          )}>
          {toggle}
        </div>
      )}

      {/* The case itself is the card. Every render is a three-quarter view
          from above, lit from the upper left, lying with its long axis from
          lower-left to upper-right — so the contact shadow is a long ellipse
          turned along that same axis and pushed a little to the lower right,
          away from the light. The art is bottomed out in the box so its base
          actually meets the shadow instead of hovering above it. */}
      <div
        className={cn(
          "relative flex h-20 items-end justify-center pb-2",
          wide ? "sm:h-28 sm:w-44 sm:shrink-0" : "sm:h-44",
        )}>
        <div
          className='light-hide pointer-events-none absolute left-1/2 top-1/2 h-24 w-full max-w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[48px]'
          style={{
            background: `radial-gradient(ellipse at center, ${meta.color}33 0%, ${meta.color}0d 55%, transparent 80%)`,
          }}
        />
        <div
          className={cn(
            "light-hide pointer-events-none absolute bottom-1 left-1/2 rounded-[100%] blur-[6px]",
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
          alt={labels.caseName(caseDef)}
          className='relative z-10 max-h-[92%] w-full object-contain object-bottom transition-transform duration-base group-hover:-translate-y-1 sm:w-[90%]'
          draggable={false}
          loading='lazy'
        />
      </div>

      <div className={cn("flex min-w-0 flex-col gap-2.5", wide && "sm:flex-1")}>
        <div className='flex items-center gap-2'>
          <h3 className='min-w-0 flex-1 font-display text-base font-bold leading-tight text-zinc-100 sm:flex-initial sm:text-lg'>
            <Interpolate
              text={title}
              values={{
                tier: (
                  <span style={{ color: readableText(meta.color) }}>
                    {t(`cases.tier_word.${tier}`, tierWord)}
                  </span>
                ),
              }}
            />
          </h3>
          {/* Beside the name on a row; in a ladder card's corner it leaves the
              whole line to the name, which then fits without wrapping. */}
          <DropRates
            probabilities={caseDef.probabilities}
            className={cn(
              "-my-2 -mr-2",
              !wide && "sm:absolute sm:right-4 sm:top-[26px] sm:m-0",
            )}
          />
        </div>

        {hasPity(caseDef) ? (
          <PityMeter
            caseDef={caseDef}
            counters={pity ?? { sinceNew: 0, sinceTop: 0 }}
            showNew={canDiscoverNew}
          />
        ) : (
          // Only where there is no guarantee to say what the case is for.
          <p className='text-xs leading-relaxed text-zinc-400'>
            {labels.caseDescription(caseDef)}
          </p>
        )}
      </div>

      <CaseBuyControl
        caseDef={caseDef}
        currentFame={currentFame}
        isOpening={isOpening}
        freeTokens={freeTokens}
        onOpen={onOpen}
        onOpenPack={onOpenPack}
        variant='soft'
        className={cn(
          "relative col-span-2 flex-col",
          wide ? "sm:w-72 sm:shrink-0" : "sm:mt-auto",
        )}
      />
    </article>
  );
};
