import type { ConditionGrade } from "feature/arsenal/data/itemStats";
import { getPartLabel } from "feature/arsenal/data/partDefinitions";
import type { ChainTier, SignalStage } from "feature/arsenal/data/signalChain";
import { CHAIN_TIERS } from "feature/arsenal/data/signalChain";
import type { ResolvedTrait } from "feature/arsenal/data/traits";
import type {
  CaseDefinition,
  PartId,
} from "feature/arsenal/types/arsenal.types";
import { SLOT_LABELS } from "feature/guitarBuilder/data/components";
import type { ComponentSlot } from "feature/guitarBuilder/types/guitarBuilder.types";
import { useTranslation } from "hooks/useTranslation";
import { translateOr } from "lib/i18n/translate";
import { useMemo } from "react";

/**
 * The Arsenal's catalogue words — rarities, pedal types, parts and their
 * grades — in the player's language.
 *
 * The data keeps them in English (they are ids as much as words: stored on
 * items, compared in code), so they are translated where they are drawn, and
 * anything a build does not know yet falls back to the English it was given.
 */
const BUILDER_ERROR_KEYS: Record<string, string> = {
  "A part can only go on once": "part_once",
  "Too many stickers": "too_many_stickers",
  "You don't own that part": "not_owned",
  "A part is in the wrong slot": "wrong_slot",
  "Unknown sticker": "unknown_sticker",
  "Body, neck, headstock, pickups and finish are all needed": "missing_core",
  "Doesn't fit this body's routing": "wrong_routing",
  "This body has no pickguard to swap": "no_pickguard",
  "Not enough Fame": "not_enough_fame",
};

export const useArsenalLabels = () => {
  const { t } = useTranslation("arsenal");

  return useMemo(
    () => ({
      t,
      rarity: (rarity: string) => t(`labels.rarity.${rarity}`, rarity),
      effectType: (effectType: string) =>
        t(`labels.effect_type.${effectType}`, effectType),
      part: (partId: PartId) =>
        t(`labels.part.${partId}`, getPartLabel(partId)),
      partTier: (tier: string) => t(`labels.part_tier.${tier}`, tier),
      /** "Legendary Neck" — the order is the language's, not English's. */
      partName: (tier: string, partId: PartId) =>
        t("labels.part_name", {
          tier: t(`labels.part_tier.${tier}`, tier),
          part: t(`labels.part.${partId}`, getPartLabel(partId)),
        }),
      kind: (kind: "guitar" | "effect") => t(`labels.kind.${kind}`),
      /** A workshop mod by id; `english` is the label its definition carries. */
      mod: (featureId: string, english: string) =>
        t(`labels.mod.${featureId}`, english),
      /** "Mint", "Museum Grade"… keyed by the grade, not its English label. */
      condition: (grade: Pick<ConditionGrade, "key" | "label">) =>
        t(`labels.condition.${grade.key}`, grade.label),
      /** A trait's card title, with any rolled `{brand}` filled back in. */
      traitLabel: (trait: ResolvedTrait) =>
        translateOr(t, `traits.${trait.def.id}.label`, trait.label, trait.params),
      traitDescription: (trait: ResolvedTrait) =>
        translateOr(
          t,
          `traits.${trait.def.id}.description`,
          trait.description,
          trait.params,
        ),
      /** A pedalboard stage ("Tuner", "Modulation") and why it sits where it does. */
      stageLabel: (stage: Pick<SignalStage, "id" | "label">) =>
        t(`signal.stages.${stage.id}.label`, stage.label),
      stageWhy: (stage: Pick<SignalStage, "id" | "why">) =>
        t(`signal.stages.${stage.id}.why`, stage.why),
      chainTierLabel: (tier: ChainTier) =>
        t(`signal.tiers.${tier}.label`, CHAIN_TIERS[tier].label),
      chainTierNote: (tier: ChainTier) =>
        t(`signal.tiers.${tier}.note`, CHAIN_TIERS[tier].note),
      /** A Guitar Builder slot ("Body", "Headstock"). */
      slot: (slot: string) =>
        t(`builder.slots.${slot}`, SLOT_LABELS[slot as ComponentSlot] ?? slot),
      /**
       * The builder's validation messages are English sentences shared with the
       * API; known ones are swapped for their translation on the way to screen.
       */
      builderError: (error: string) => {
        const key = BUILDER_ERROR_KEYS[error];
        return key ? t(`builder.errors.${key}`, error) : error;
      },
      caseName: (def: Pick<CaseDefinition, "id" | "name">) =>
        t(`cases.defs.${def.id}.name`, def.name),
      caseDescription: (def: Pick<CaseDefinition, "id" | "description">) =>
        t(`cases.defs.${def.id}.description`, def.description),
    }),
    [t],
  );
};
