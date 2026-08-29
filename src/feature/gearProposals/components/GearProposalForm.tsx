import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { TierPlate } from "feature/arsenal/components/TierPlate";
import {
  getPartLabel,
  PART_TIER_COLORS,
} from "feature/arsenal/data/partDefinitions";
import type {
  EffectType,
  GuitarRarity,
  PartId,
  PartTier,
} from "feature/arsenal/types/arsenal.types";
import {
  renderEffectIcon,
  renderKindIcon,
} from "feature/gearProposals/constants/gearIcons";
import { EFFECT_TYPES } from "feature/gearProposals/constants/gearProposal.constants";
import type {
  GearDraft,
  GearKind,
  ProposedScrapSlot,
} from "feature/gearProposals/types/gearProposal.types";
import { PROPOSABLE_RARITIES } from "feature/gearProposals/types/gearProposal.types";
import {
  DEFAULT_SCRAP_TIER,
  GEAR_DESCRIPTION_MAX,
  GEAR_INSCRIPTION_MAX,
  GEAR_NAME_MAX,
  MAX_SCRAP_QTY,
  MAX_SCRAP_SLOTS,
  partsForKind,
  safeImageUrl,
  tiersForPart,
} from "feature/gearProposals/utils/gearProposal.utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One question per card, with room around it.
 *
 * The dialog this replaced had to stack every question into a single scrolling
 * column; a page can let each one stand on its own ground, which is what makes
 * the teardown read as a separate decision from the name.
 */
const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) => (
  <section className='space-y-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
    <div className='space-y-1.5'>
      <h2 className='text-base font-bold text-zinc-100'>{title}</h2>
      {hint && <p className='text-sm text-zinc-400'>{hint}</p>}
    </div>
    {children}
  </section>
);

/**
 * Rarity as the colour it actually is in the game, not as a word in a dropdown.
 * Picking "Legendary" should feel like picking Legendary.
 */
const RarityPicker = ({
  value,
  onChange,
}: {
  value: GuitarRarity;
  onChange: (rarity: GuitarRarity) => void;
}) => (
  <div className='flex flex-wrap gap-2'>
    {PROPOSABLE_RARITIES.map((rarity) => {
      const styles = RARITY_STYLES[rarity];
      const isActive = rarity === value;

      return (
        <button
          key={rarity}
          type='button'
          onClick={() => onChange(rarity)}
          className={cn(
            "rounded px-3 py-1.5 text-[11px] font-black tracking-widest transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isActive ? styles.text : "text-zinc-500 hover:text-zinc-300",
          )}
          style={{
            backgroundColor: isActive
              ? `${styles.baseColor}1f`
              : "rgba(255,255,255,0.04)",
          }}>
          {rarity}
        </button>
      );
    })}
  </div>
);

const EffectPicker = ({
  value,
  onChange,
}: {
  value: EffectType;
  onChange: (effectType: EffectType) => void;
}) => (
  <div className='flex flex-wrap gap-2'>
    {EFFECT_TYPES.map((effectType) => {
      const isActive = effectType === value;

      return (
        <button
          key={effectType}
          type='button'
          onClick={() => onChange(effectType)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isActive
              ? "bg-cyan-500/10 text-cyan-400"
              : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
          )}>
          {renderEffectIcon(effectType, 12)}
          {effectType}
        </button>
      );
    })}
  </div>
);

/**
 * The parts this kind of gear could yield, drawn as the plates they are in the
 * stash.
 *
 * This is the palette and nothing more: one click puts a part in the plan,
 * another takes it out. How many, and at what grade, is the plan's business —
 * saying it here too would repeat the row below in the one place with no room
 * for it, which is what made the two read as one broken list.
 */
const ScrapPicker = ({
  kind,
  bom,
  onChange,
}: {
  kind: GearKind;
  bom: ProposedScrapSlot[];
  onChange: (bom: ProposedScrapSlot[]) => void;
}) => {
  const toggle = (partId: PartId) => {
    if (bom.some((slot) => slot.partId === partId)) {
      onChange(bom.filter((slot) => slot.partId !== partId));
      return;
    }
    if (bom.length >= MAX_SCRAP_SLOTS) return;
    onChange([...bom, { partId, qty: 1, tier: DEFAULT_SCRAP_TIER }]);
  };

  return (
    <div className='grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-7'>
      {partsForKind(kind).map((part) => {
        const slot = bom.find((candidate) => candidate.partId === part.id);
        const full = !slot && bom.length >= MAX_SCRAP_SLOTS;

        return (
          <button
            key={part.id}
            type='button'
            onClick={() => toggle(part.id)}
            disabled={full}
            aria-pressed={Boolean(slot)}
            title={part.label}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg px-1 py-3 transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-30",
              slot ? "bg-cyan-500/10" : "bg-white/5 hover:bg-white/10",
            )}>
            {/* The plate carries the grade; the cell carries the picking, so a
                Standard part is still visibly in the plan despite its colour
                being the quietest one on the scale. */}
            <TierPlate
              color={slot ? PART_TIER_COLORS[slot.tier] : "#3f3f46"}
              size={44}
              muted={!slot}>
              <PartIcon partId={part.id} size={24} />
            </TierPlate>

            <span
              className={cn(
                "max-w-full truncate text-[10px] font-semibold",
                slot ? "text-cyan-400" : "text-zinc-500",
              )}>
              {part.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * The grade a slot is asked to yield.
 *
 * Offered per part rather than as one list, because the ceiling is the part's
 * own: a screw tops out at Standard however legendary the guitar around it is,
 * and `Unique` is only reachable by the parts somebody would actually look at.
 */
const TierChips = ({
  partId,
  value,
  onChange,
}: {
  partId: PartId;
  value: PartTier;
  onChange: (tier: PartTier) => void;
}) => {
  const tiers = tiersForPart(partId);

  // A part with one possible grade has nothing to ask — it says what it is.
  if (tiers.length === 1) {
    return (
      <span
        className='text-[10px] font-black tracking-widest'
        style={{ color: PART_TIER_COLORS[tiers[0]] }}>
        {tiers[0]}
      </span>
    );
  }

  return (
    <div className='flex flex-wrap gap-1'>
      {tiers.map((tier) => {
        const color = PART_TIER_COLORS[tier];
        const isActive = tier === value;

        return (
          <button
            key={tier}
            type='button'
            onClick={() => onChange(tier)}
            className={cn(
              "rounded px-2 py-1 text-[10px] font-black tracking-widest transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              !isActive && "text-zinc-500 hover:text-zinc-300",
            )}
            style={{
              backgroundColor: isActive
                ? `${color}1f`
                : "rgba(255,255,255,0.04)",
              color: isActive ? color : undefined,
            }}>
            {tier}
          </button>
        );
      })}
    </div>
  );
};

/**
 * The plan itself: what comes off, in what order, how many and at what grade.
 * Every control with a number or a choice behind it lives here, so the palette
 * above stays a palette.
 */
const ScrapOrder = ({
  bom,
  onChange,
}: {
  bom: ProposedScrapSlot[];
  onChange: (bom: ProposedScrapSlot[]) => void;
}) => {
  if (bom.length === 0) return null;

  const patch = (partId: PartId, change: Partial<ProposedScrapSlot>) =>
    onChange(
      bom.map((slot) =>
        slot.partId === partId ? { ...slot, ...change } : slot,
      ),
    );

  return (
    <div className='space-y-2'>
      {bom.map((slot, index) => {
        const label = getPartLabel(slot.partId);

        return (
          <div
            key={slot.partId}
            className='flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-white/5 p-2.5'>
            <span className='w-3 text-xs font-bold tabular-nums text-zinc-600'>
              {index + 1}
            </span>

            <TierPlate
              color={PART_TIER_COLORS[slot.tier]}
              size={34}
              count={slot.qty > 1 ? slot.qty : undefined}>
              <PartIcon partId={slot.partId} size={20} />
            </TierPlate>

            <span className='w-[5.5rem] truncate text-xs font-semibold text-zinc-200'>
              {label}
            </span>

            <TierChips
              partId={slot.partId}
              value={slot.tier}
              onChange={(tier) => patch(slot.partId, { tier })}
            />

            <div className='ml-auto flex items-center gap-1'>
              <button
                type='button'
                aria-label={`How many of this part — now ${slot.qty}`}
                onClick={() =>
                  patch(slot.partId, { qty: (slot.qty % MAX_SCRAP_QTY) + 1 })
                }
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-bold tabular-nums transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
                )}>
                ×{slot.qty}
              </button>

              <button
                type='button'
                aria-label={`Take ${label} out of the teardown`}
                onClick={() =>
                  onChange(
                    bom.filter((candidate) => candidate.partId !== slot.partId),
                  )
                }
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "text-zinc-500 hover:bg-white/10 hover:text-zinc-200",
                )}>
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface GearProposalFormProps {
  draft: GearDraft;
  onChange: (patch: Partial<GearDraft>) => void;
}

/**
 * Everything a proposal has to say, asked on a page rather than in a dialog.
 *
 * What the thing would look like once built is the summary's job, so nothing
 * here draws a preview of its own and nothing is said twice.
 */
export const GearProposalForm = ({
  draft,
  onChange,
}: GearProposalFormProps) => {
  const badLink =
    draft.imageUrl.trim().length > 0 && !safeImageUrl(draft.imageUrl);

  // A pedal cannot yield a neck: the teardown is meaningless across kinds.
  const pickKind = (kind: GearKind) => onChange({ kind, scrapBom: [] });

  return (
    <div className='space-y-5'>
      <Section
        title='What is it'
        hint='A guitar or a pedal, what it would be called in the Arsenal, and how rare it should be.'>
        <div className='flex gap-2'>
          {(["guitar", "effect"] as GearKind[]).map((option) => (
            <button
              key={option}
              type='button'
              onClick={() => pickKind(option)}
              aria-pressed={draft.kind === option}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                draft.kind === option
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              )}>
              {renderKindIcon(option, 16)}
              {option === "guitar" ? "Guitar" : "Pedal"}
            </button>
          ))}
        </div>

        <div className='space-y-3'>
          <Input
            aria-label='Name'
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            maxLength={GEAR_NAME_MAX}
            placeholder='Nightjar Custom'
            className='h-12 bg-white/5 text-base font-bold'
          />

          <div className='grid gap-3 sm:grid-cols-2'>
            <Input
              aria-label='Brand'
              value={draft.brand}
              onChange={(event) => onChange({ brand: event.target.value })}
              placeholder='Brand — optional'
              className='h-10 bg-white/5 text-sm font-medium'
            />
            <Input
              aria-label='Image link'
              value={draft.imageUrl}
              onChange={(event) => onChange({ imageUrl: event.target.value })}
              placeholder='https://… image link, optional'
              className='h-10 bg-white/5 text-sm font-medium'
            />
          </div>

          {badLink && (
            <p className='text-xs text-amber-400/80'>
              Only https links are rendered — this one will be dropped.
            </p>
          )}
        </div>

        <div className='space-y-3'>
          <Label className='ml-1 font-bold text-zinc-400'>Rarity</Label>
          <RarityPicker
            value={draft.rarity}
            onChange={(rarity) => onChange({ rarity })}
          />
        </div>

        {draft.kind === "effect" && (
          <div className='space-y-3'>
            <Label className='ml-1 font-bold text-zinc-400'>What it does</Label>
            <EffectPicker
              value={draft.effectType}
              onChange={(effectType) => onChange({ effectType })}
            />
          </div>
        )}
      </Section>

      <Section
        title='Where it came from'
        hint='What it sounds like and why it belongs in the game — plus the one line you want carried by every copy of it.'>
        <div className='space-y-2'>
          <Label htmlFor='gear-desc' className='ml-1 font-bold text-zinc-400'>
            What is it{" "}
            <span className='font-medium text-zinc-500'>optional</span>
          </Label>
          <Textarea
            id='gear-desc'
            value={draft.description}
            onChange={(event) => onChange({ description: event.target.value })}
            maxLength={GEAR_DESCRIPTION_MAX}
            rows={4}
            placeholder='Where it came from, what it sounds like, why it belongs in the game.'
            className='resize-none bg-white/5 font-medium'
          />
        </div>

        <div className='space-y-2'>
          <Label
            htmlFor='gear-inscription'
            className='ml-1 font-bold text-zinc-400'>
            Engraving{" "}
            <span className='font-medium text-zinc-500'>optional</span>
          </Label>
          <div
            className='rounded-lg bg-zinc-950/60 px-3 py-2'
            style={{
              boxShadow:
                "inset 0 1px 2px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.04)",
            }}>
            <Input
              id='gear-inscription'
              value={draft.inscription}
              onChange={(event) =>
                onChange({ inscription: event.target.value })
              }
              maxLength={GEAR_INSCRIPTION_MAX}
              placeholder='One line, yours, carried by every copy of it'
              className='h-9 border-0 bg-transparent px-1 italic text-amber-300/90 placeholder:text-zinc-700 focus-visible:ring-0'
            />
          </div>
          <p className='ml-1 text-xs text-zinc-500'>
            If this gets built, your line ships on the item —{" "}
            {GEAR_INSCRIPTION_MAX - draft.inscription.length} characters left.
          </p>
        </div>
      </Section>

      <Section
        title='Breaks down into'
        hint={`What the bench gets when somebody scraps it, in salvage order and at what grade. Up to ${MAX_SCRAP_SLOTS} parts — leave it empty and the bench decides.`}>
        <ScrapPicker
          kind={draft.kind}
          bom={draft.scrapBom}
          onChange={(scrapBom) => onChange({ scrapBom })}
        />
        <ScrapOrder
          bom={draft.scrapBom}
          onChange={(scrapBom) => onChange({ scrapBom })}
        />
      </Section>
    </div>
  );
};
