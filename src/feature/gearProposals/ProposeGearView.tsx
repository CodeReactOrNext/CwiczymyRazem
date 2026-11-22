import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { Breadcrumbs } from "components/Breadcrumbs/Breadcrumbs";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { GearProposalForm } from "feature/gearProposals/components/GearProposalForm";
import { GearProposalSummary } from "feature/gearProposals/components/GearProposalSummary";
import {
  EMPTY_GEAR_DRAFT,
  GEAR_BOARD_HREF,
} from "feature/gearProposals/constants/gearProposal.constants";
import {
  useGearBoard,
  useGearMutations,
} from "feature/gearProposals/hooks/useGearBoard";
import type { GearDraft } from "feature/gearProposals/types/gearProposal.types";
import { SupporterPitch } from "feature/supporterPanel/components/SupporterPitch";
import { TokenWalletBar } from "feature/supporterPanel/components/TokenWalletBar";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import type { GearProposalInput } from "lib/gear/gearBoard";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

/** Trimmed on the way out, so what is filed is what the summary drew. */
const toProposalInput = (draft: GearDraft): GearProposalInput => ({
  kind: draft.kind,
  name: draft.name.trim(),
  brand: draft.brand.trim(),
  rarity: draft.rarity,
  effectType: draft.kind === "effect" ? draft.effectType : undefined,
  description: draft.description.trim(),
  imageUrl: draft.imageUrl.trim(),
  inscription: draft.inscription.trim(),
  scrapBom: draft.scrapBom,
});

const FormSkeleton = () => (
  <div className='space-y-5'>
    {[220, 260, 300].map((height) => (
      <Skeleton key={height} variant='block' style={{ height }} />
    ))}
  </div>
);

/**
 * Proposing gear, as a page of its own.
 *
 * It used to be a dialog over the board, which is the wrong shape for it: a
 * proposal is a spec with a name, a rarity, a story and a teardown plan, and a
 * box that scrolls inside a page that also scrolls made every one of those
 * decisions feel like a footnote. On a page the questions get room, the draft
 * gets drawn beside them as the item it would become, and the URL is something
 * a supporter can come back to.
 */
export const ProposeGearView = () => {
  const { t } = useTranslation("supporter");
  const router = useRouter();
  const [draft, setDraft] = useState<GearDraft>(EMPTY_GEAR_DRAFT);

  const userAuth = useAppSelector(selectUserAuth);
  const { isSupport, isLoading: isRosterLoading } = useSupportTeam();
  const isSupporter = isSupport(userAuth);

  const { data: board, isLoading } = useGearBoard(isSupporter);
  const { propose } = useGearMutations();

  const patch = (change: Partial<GearDraft>) =>
    setDraft((current) => ({ ...current, ...change }));

  const submit = async () => {
    try {
      await propose.mutateAsync(toProposalInput(draft));
      await router.push(GEAR_BOARD_HREF);
    } catch {
      // The mutation already says what went wrong; staying here keeps the draft
      // rather than throwing away everything that was just written.
    }
  };

  return (
    <div className='flex w-full flex-col'>
      <HeroBanner
        title={t("panel.gear.propose_title")}
        subtitle={t("panel.gear.propose_subtitle")}
        eyebrowContent={
          <Breadcrumbs
            items={[
              { label: t("panel.title"), href: GEAR_BOARD_HREF },
              { label: t("panel.gear.propose") },
            ]}
            currentClassName='text-amber-400/80'
          />
        }
        backgroundContent={<HeroPattern variant='heart' />}
        rightContent={
          isSupporter && board ? (
            <TokenWalletBar wallet={board.wallet} />
          ) : undefined
        }
      />

      <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-8", PAGE_CONTENT)}>
        {isRosterLoading ? (
          // The roster answers "not a supporter" for everyone until it lands,
          // so waiting is what keeps a supporter off the sales pitch.
          <Skeleton variant='block' className='h-72' />
        ) : !isSupporter ? (
          <SupporterPitch />
        ) : isLoading || !board ? (
          <FormSkeleton />
        ) : (
          <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start'>
            <GearProposalForm draft={draft} onChange={patch} />
            <GearProposalSummary
              draft={draft}
              tokensLeft={board.wallet.left}
              busy={propose.isPending}
              onSubmit={submit}
            />
          </div>
        )}
      </div>
    </div>
  );
};
