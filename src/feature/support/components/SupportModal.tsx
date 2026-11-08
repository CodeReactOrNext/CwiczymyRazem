import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar/Avatar";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import {
  BMC_URL,
  MONTHLY_RUNNING_COST,
  ROADMAP_RAISED_OFFSET,
  ROADMAP_TIERS,
} from "feature/roadmap/data/roadmap.data";
import {
  type BuyMeACoffeeFunding,
  useBuyMeACoffeeFunding,
} from "feature/roadmap/hooks/useBuyMeACoffeeFunding";
import { tierLabel } from "feature/roadmap/utils/tierText";
import { useSupporterRoadmap } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { fade } from "lib/motion/motion";
import { ArrowRight, Check, Coffee, Heart, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "store/hooks";

export type SupportModalVariant = "ask" | "thanks";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonate: () => void;
  /**
   * "ask" goes to everyone who isn't funding the app yet; "thanks" goes to
   * people already on the supporter roster, who have nothing left to be
   * asked for.
   */
  variant?: SupportModalVariant;
}

const AskBody = ({ funding }: { funding: BuyMeACoffeeFunding }) => {
  const { t } = useTranslation("supporter");
  const { totalRaised: rawTotalRaised, raisedThisMonth } = funding;

  const totalRaised = Math.max(0, rawTotalRaised - ROADMAP_RAISED_OFFSET);
  const nextTier = ROADMAP_TIERS.find((tier) => totalRaised < tier.goal) ?? null;

  const covered = Math.min(raisedThisMonth, MONTHLY_RUNNING_COST);
  const isCovered = raisedThisMonth >= MONTHLY_RUNNING_COST;
  const costPct = Math.min(100, Math.max(0, (covered / MONTHLY_RUNNING_COST) * 100));

  return (
    <>
      <div className='flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10'>
        <Heart size={20} className='text-amber-400' fill='currentColor' />
      </div>

      <div>
        <p className='text-xs font-semibold text-amber-500/80'>{t("hero.title")}</p>
        <h2 className='mt-2 text-2xl font-semibold tracking-tight text-white'>
          {t("modal.why")}
        </h2>
        <p className='mt-3 text-sm leading-relaxed text-zinc-400'>{t("modal.body")}</p>
      </div>

      <div className='rounded-md bg-zinc-900/60 p-4'>
        <div className='flex items-center justify-between gap-4 text-xs'>
          <span className='flex min-w-0 items-center gap-1.5'>
            {isCovered ? (
              <Check size={14} className='shrink-0 text-emerald-400' />
            ) : (
              <TriangleAlert size={14} className='shrink-0 text-orange-400' />
            )}
            <span
              className={cn(
                "truncate font-medium",
                isCovered ? "text-zinc-300" : "text-orange-200"
              )}>
              {isCovered ? t("funding.covered") : t("funding.needs_help")}
            </span>
          </span>
        </div>

        <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isCovered
                ? "bg-emerald-400"
                : "bg-gradient-to-r from-orange-500 to-orange-400"
            )}
            style={{ width: `${costPct}%` }}
          />
        </div>

        {nextTier && (
          <div className='mt-3 flex items-center justify-between gap-4 text-xs text-zinc-400'>
            <span className='truncate'>
              {t("funding.next_unlock")}{" "}
              <span className='font-medium text-zinc-300'>{tierLabel(nextTier, t)}</span>
            </span>
            <span className='shrink-0 font-medium text-white'>
              {t("funding.to_go", { amount: nextTier.goal - totalRaised })}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

const ThanksBody = ({ wallet }: { wallet?: SupporterWallet }) => {
  const { t } = useTranslation("supporter");
  const userAuth = useAppSelector(selectUserAuth);
  const name = useAppSelector(selectUserName);
  const avatar = useAppSelector(selectUserAvatar);
  const { getSupportMember } = useSupportTeam();
  const member = getSupportMember(userAuth);

  return (
    <div className='flex flex-col items-center gap-5 text-center'>
      <div className='flex flex-col items-center gap-3'>
        <Avatar name={name ?? ""} avatarURL={avatar || undefined} />
        <SupportBadge member={member} />
      </div>

      <div>
        <h2 className='text-2xl font-semibold tracking-tight text-white'>
          {name
            ? t("modal.thanks.title", { name })
            : t("modal.thanks.title_no_name")}
        </h2>
        <p className='mt-3 text-sm leading-relaxed text-zinc-400'>
          {t("modal.thanks.body")}
        </p>
      </div>

      {/* Tokens are the one thing in the panel waiting on them, so they are
          the reason to open it. An empty wallet has nothing to wait for. */}
      {wallet && wallet.left > 0 && (
        <div className='flex w-full flex-col items-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-4'>
          <div className='flex items-center gap-2.5'>
            <SupportToken size={28} />
            <span className='text-2xl font-bold tabular-nums leading-none text-cyan-300'>
              {wallet.left}
            </span>
            <span className='text-xs text-zinc-400'>
              {t("panel.wallet", { count: wallet.left })}
            </span>
          </div>
          <p className='text-xs text-zinc-400'>{t("modal.thanks.tokens_hint")}</p>
        </div>
      )}
    </div>
  );
};

/**
 * The ask always shows the same precise explanation of what a donation
 * actually pays for — no rotating variants here (those are for the Activity
 * feed only). The live numbers (cost covered, next tier) are real, just the
 * copy is fixed.
 *
 * The thanks has to look nothing like it: a supporter who learnt to close the
 * ask on sight would close the thanks too. So it is about them rather than the
 * project — their avatar and badge, their name, the tokens they can spend —
 * laid out centred where the ask reads left to right.
 */
export function SupportModal({
  isOpen,
  onClose,
  onDonate,
  variant = "ask",
}: SupportModalProps) {
  const { t } = useTranslation("supporter");
  const isThanks = variant === "thanks";

  const funding = useBuyMeACoffeeFunding();
  // Only fetched once the thanks is actually up: the sidebar mounts this
  // modal on every page, and the board is a whole API round trip.
  const board = useSupporterRoadmap(isOpen && isThanks);

  // Wait for the numbers rather than pop them in after the modal appears. A
  // failed board still opens the thanks, just without the wallet.
  const isReady = isThanks
    ? board.isSuccess || board.isError
    : !funding.isLoading;

  return (
    <AnimatePresence>
      {isOpen && isReady && (
        <m.div
          key='SupportModal'
          initial='hidden'
          animate='visible'
          exit='hidden'
          variants={fade}
          className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/80 backdrop-blur-md'
            onClick={onClose}
          />
          <div className='relative w-full max-w-md overflow-hidden rounded-md bg-zinc-950 p-8'>
            {!isThanks && (
              <div className='pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px]' />
            )}

            <Button
              variant='subtle'
              size='icon'
              onClick={onClose}
              aria-label={t("ui:close")}
              className='absolute right-5 top-5 z-10'>
              <X />
            </Button>

            <div className='relative z-10 flex flex-col gap-5'>
              {isThanks ? (
                <ThanksBody wallet={board.data?.wallet} />
              ) : (
                <AskBody funding={funding} />
              )}

              {/* Same pair as EmailConsentModal: the white key is the one
                  action, the secondary key steps away. */}
              <div className='flex flex-col gap-3 sm:flex-row-reverse sm:gap-2'>
                <Button asChild size='lg' className='h-12 px-4 sm:h-10 sm:flex-1'>
                  {isThanks ? (
                    <Link href='/supporter' onClick={onDonate}>
                      {t("perks.open_panel")}
                      <ArrowRight />
                    </Link>
                  ) : (
                    <a
                      href={BMC_URL}
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={onDonate}>
                      <Coffee />
                      {t("cta.support")}
                    </a>
                  )}
                </Button>
                <Button
                  size='lg'
                  variant='secondary'
                  onClick={onClose}
                  className='h-12 px-4 sm:h-10 sm:flex-1'>
                  {isThanks ? t("modal.thanks.close") : t("modal.later")}
                </Button>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
