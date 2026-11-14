/* eslint-disable @next/next/no-img-element */
import { Button } from "assets/components/ui/button";
import {
  BMC_URL,
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
import { AnimatePresence, m } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { fade } from "lib/motion/motion";
import { ArrowRight, ArrowUpRight, Coffee, X } from "lucide-react";
import Link from "next/link";

export type SupportModalVariant = "ask" | "thanks" | "again";

/** How the modal was closed without taking its main action. */
type CloseVia = "button" | "x" | "backdrop";

interface SupportModalProps {
  isOpen: boolean;
  onClose: (via: CloseVia) => void;
  onDonate: () => void;
  /**
   * "ask" goes to everyone who isn't funding the app yet; "thanks" goes to
   * people already on the supporter roster. "again" is the supporter's every
   * fourth note: still a thank-you, but it also shows the next goal and the
   * coffee link.
   */
  variant?: SupportModalVariant;
  /** The player's display name, for the headline. */
  name?: string;
  /** Whole hours the player has logged — the ask opens with them. */
  practiceHours?: number;
}

// Below this the number is nothing to open with, and it keeps every language
// on its plural form.
const MIN_HOURS_FOR_TITLE = 2;

/** How many delivered goals the thanks names before folding the rest. */
const SHIPPED_SHOWN = 3;

const AUTHOR_NAME = "Michał";
const AUTHOR_IMAGE = "/images/authors/michael-apfel.webp";

/**
 * Both modals end the same way: the message first, then who it is from. The
 * author sits under the text rather than above it — a face on top turns a note
 * into a pitch.
 */
const Signature = ({ line }: { line: string }) => (
  <div className='flex items-center gap-3'>
    <img
      src={AUTHOR_IMAGE}
      alt=''
      width={36}
      height={36}
      className='h-9 w-9 shrink-0 rounded-full object-cover'
    />
    <div className='min-w-0 leading-snug'>
      <p className='text-sm font-semibold text-white'>{line}</p>
      <p className='text-xs text-zinc-400'>{AUTHOR_NAME}</p>
    </div>
  </div>
);

/**
 * The open roadmap goal and how far it is. A percentage, never an amount: the
 * modal shows where things stand, it does not quote a price.
 */
const NextGoal = ({ funding }: { funding: BuyMeACoffeeFunding }) => {
  const { t } = useTranslation("supporter");

  const totalRaised = Math.max(0, funding.totalRaised - ROADMAP_RAISED_OFFSET);
  const nextTier = ROADMAP_TIERS.find((tier) => totalRaised < tier.goal);
  if (!nextTier) return null;

  // How far the open goal itself is, not the whole ladder: the bar starts
  // empty at each new goal.
  const funded = nextTier.cost - (nextTier.goal - totalRaised);
  const tierPct = Math.round(
    Math.min(100, Math.max(0, (funded / nextTier.cost) * 100)),
  );

  return (
    <div className='rounded-lg bg-zinc-900/60 p-4'>
      <div className='flex items-baseline justify-between gap-4 text-xs'>
        <span className='min-w-0 truncate text-zinc-400'>
          {t("modal.ask.next")}{" "}
          <span className='font-semibold text-white'>
            {tierLabel(nextTier, t)}
          </span>
        </span>
        <span className='shrink-0 font-semibold tabular-nums text-white'>
          {tierPct}%
        </span>
      </div>
      <div className='mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-800'>
        <div
          className='h-full rounded-full bg-amber-400'
          style={{ width: `${tierPct}%` }}
        />
      </div>
    </div>
  );
};

/** What the support has already built, features first, the rest folded. */
const ShippedList = () => {
  const { t } = useTranslation("supporter");

  // Features first: "Bass Support" says more than another pack of exercises.
  const shipped = ROADMAP_TIERS.filter((tier) => tier.done).sort(
    (a, b) => Number(b.kind === "feature") - Number(a.kind === "feature"),
  );
  if (shipped.length === 0) return null;

  return (
    <ul className='flex flex-wrap gap-1.5'>
      {shipped.slice(0, SHIPPED_SHOWN).map((tier) => (
        <li
          key={tier.id}
          className='rounded bg-zinc-900/60 px-2.5 py-1.5 text-xs font-medium text-zinc-200'>
          {tierLabel(tier, t)}
        </li>
      ))}
      {shipped.length > SHIPPED_SHOWN && (
        <li className='rounded bg-zinc-900/60 px-2.5 py-1.5 text-xs font-medium tabular-nums text-zinc-400'>
          +{shipped.length - SHIPPED_SHOWN}
        </li>
      )}
    </ul>
  );
};

interface AskBodyProps {
  funding: BuyMeACoffeeFunding;
  name?: string;
  practiceHours: number;
}

const AskBody = ({ funding, name, practiceHours }: AskBodyProps) => {
  const { t } = useTranslation("supporter");

  const hasHours = practiceHours >= MIN_HOURS_FOR_TITLE;
  const title = hasHours
    ? name
      ? t("modal.ask.title", { count: practiceHours, name })
      : t("modal.ask.title_no_name", { count: practiceHours })
    : name
      ? t("modal.ask.title_plain", { name })
      : t("modal.ask.title_plain_no_name");

  return (
    <>
      <h2 className='pr-10 text-2xl font-semibold tracking-tight text-white'>
        {title}
      </h2>

      <div className='space-y-4 text-[15px] leading-relaxed text-zinc-300'>
        <p>{t("modal.ask.body")}</p>
        <p>{t("modal.ask.invite")}</p>
      </div>

      <NextGoal funding={funding} />

      <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400'>
        {t("modal.ask.perk_before")}
        <SupportBadge />
        {t("modal.ask.perk_after")}
      </p>

      <Signature line={t("modal.ask.sign")} />
    </>
  );
};

interface ThanksBodyProps {
  wallet?: SupporterWallet;
  name?: string;
  supporters: number;
}

const ThanksBody = ({ wallet, name, supporters }: ThanksBodyProps) => {
  const { t } = useTranslation("supporter");
  const others = supporters - 1;

  return (
    <>
      <h2 className='pr-10 text-2xl font-semibold tracking-tight text-white'>
        {name
          ? t("modal.thanks.title", { name })
          : t("modal.thanks.title_no_name")}
      </h2>

      <p className='text-[15px] leading-relaxed text-zinc-300'>
        {others >= 2
          ? t("modal.thanks.body", { count: others })
          : t("modal.thanks.body_solo")}
      </p>

      <ShippedList />

      {/* Tokens are the one thing in the panel waiting on them, so they are
          the reason to open it. An empty wallet has nothing to wait for. */}
      {wallet && wallet.left > 0 && (
        <p className='text-[15px] leading-relaxed text-zinc-300'>
          <span className='font-semibold text-white'>
            {t("modal.thanks.tokens", { count: wallet.left })}
          </span>{" "}
          {t("modal.thanks.tokens_hint")}
        </p>
      )}

      <Signature line={t("modal.thanks.sign")} />
    </>
  );
};

interface AgainBodyProps {
  funding: BuyMeACoffeeFunding;
  name?: string;
}

/**
 * The supporter's every fourth note. It still opens with credit rather than a
 * request — what their support is already part of — and only then shows the
 * goal that is open now.
 */
const AgainBody = ({ funding, name }: AgainBodyProps) => {
  const { t } = useTranslation("supporter");

  return (
    <>
      <h2 className='pr-10 text-2xl font-semibold tracking-tight text-white'>
        {name
          ? t("modal.again.title", { name })
          : t("modal.again.title_no_name")}
      </h2>

      <p className='text-[15px] leading-relaxed text-zinc-300'>
        {t("modal.again.body")}
      </p>

      <ShippedList />

      <p className='text-[15px] leading-relaxed text-zinc-300'>
        {t("modal.again.invite")}
      </p>

      <NextGoal funding={funding} />

      <Signature line={t("modal.thanks.sign")} />
    </>
  );
};

/**
 * A short note rather than a pitch: the player's own hours, two calm
 * sentences, how close the next roadmap goal is, and the author's signature
 * underneath. No amounts and no alarm — the app is free and says so first.
 *
 * The thanks shares the layout and the signature, but asks for nothing: it
 * names what the support has already built and points at the tokens.
 */
export function SupportModal({
  isOpen,
  onClose,
  onDonate,
  variant = "ask",
  name,
  practiceHours = 0,
}: SupportModalProps) {
  const { t } = useTranslation("supporter");
  const isThanks = variant === "thanks";

  const funding = useBuyMeACoffeeFunding();
  // Only fetched once the thanks is actually up: the sidebar mounts this
  // modal on every page, and the board is a whole API round trip.
  const board = useSupporterRoadmap(isOpen && isThanks);

  // Wait for the numbers rather than pop them in after the modal appears. A
  // failed board still opens the thanks, just without the wallet.
  const isReady =
    !funding.isLoading && (!isThanks || board.isSuccess || board.isError);

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
            onClick={() => onClose("backdrop")}
          />
          <div className='relative max-h-full w-full max-w-md overflow-y-auto rounded-lg bg-zinc-950 p-6 sm:p-8'>
            <Button
              variant='subtle'
              size='icon'
              onClick={() => onClose("x")}
              aria-label={t("ui:close")}
              className='absolute right-5 top-5 z-10'>
              <X />
            </Button>

            <div className='flex flex-col gap-6'>
              {isThanks ? (
                <ThanksBody
                  wallet={board.data?.wallet}
                  name={name}
                  supporters={funding.supporters}
                />
              ) : variant === "again" ? (
                <AgainBody funding={funding} name={name} />
              ) : (
                <AskBody
                  funding={funding}
                  name={name}
                  practiceHours={practiceHours}
                />
              )}

              {/* Same pair as EmailConsentModal: the white key is the one
                  action, the secondary key steps away. */}
              <div className='flex flex-col gap-3 sm:flex-row-reverse sm:gap-2'>
                <Button asChild size='lg' className='h-12 px-4 sm:h-10 sm:flex-1'>
                  {isThanks ? (
                    <Link href='/roadmap' onClick={onDonate}>
                      {t("modal.thanks.cta")}
                      <ArrowRight />
                    </Link>
                  ) : (
                    <a
                      href={BMC_URL}
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={onDonate}>
                      <Coffee />
                      {t("modal.ask.cta")}
                      <ArrowUpRight />
                    </a>
                  )}
                </Button>
                <Button
                  size='lg'
                  variant='secondary'
                  onClick={() => onClose("button")}
                  className='h-12 px-4 sm:h-10 sm:flex-1'>
                  {t("modal.close")}
                </Button>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
