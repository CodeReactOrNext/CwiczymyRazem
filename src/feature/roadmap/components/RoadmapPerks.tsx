import { PRESSABLE } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { HeroPattern } from "components/UI/HeroBanner";
import { DISCORD_INVITE_URL } from "constants/community";
import { PerkArt, type PerkArtKind } from "feature/roadmap/components/PerkArt";
import { TokenExchange } from "feature/supporterPanel/components/TokenExchange";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SpendPerk {
  id: PerkArtKind;
}

/**
 * What the person paying gets back. Every entry is a tab of the supporter
 * panel, so this is a preview of /supporter rather than a second place where
 * perks are invented.
 *
 * Told as the two things a donation brings: the badge, with what it includes,
 * and the one exchange rate — a dollar into tokens — followed by what the panel
 * lets you do. No prices: they live on the panel's own buttons, and a page
 * that quotes them is a page that goes out of date.
 *
 * Nobody read the first version: six rows of small grey type, each behind its
 * own icon. So there are no row icons here at all, nothing is set smaller than
 * `text-sm`, and each thing on offer is a picture first — a scene with Kostek
 * in it (PerkArt), drawn in the mascot's own flat style.
 */
const SPEND_PERKS: SpendPerk[] = [
  { id: "roadmap" },
  { id: "coach" },
  { id: "shop" },
  { id: "guild" },
];

const BADGE_PERKS = ["badge", "discord", "ai"];

const DiscordLink = () => (
  <a
    href={DISCORD_INVITE_URL}
    target='_blank'
    rel='noopener noreferrer'
    className='text-amber-300 underline decoration-amber-500/40 underline-offset-2 transition-colors hover:text-amber-200 hover:decoration-amber-400'>
    Discord
  </a>
);

const GroupHeading = ({ title, note }: { title: string; note?: string }) => (
  <>
    <h3 className='text-lg font-semibold text-zinc-100'>{title}</h3>
    {note && (
      <p className='mt-1.5 text-base leading-relaxed text-zinc-400'>{note}</p>
    )}
  </>
);

const BadgePerk = ({ id }: { id: string }) => {
  const { t } = useTranslation("supporter");
  return (
    <li className='min-w-0'>
      <p className='text-base font-semibold text-zinc-100'>
        {t(`perks.items.${id}.title`)}
      </p>
      <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
        {id === "discord" ? (
          <Interpolate
            text={t("perks.discord_body")}
            values={{ discord: <DiscordLink /> }}
          />
        ) : (
          t(`perks.items.${id}.body`)
        )}
      </p>
    </li>
  );
};

const SpendCard = ({ perk }: { perk: SpendPerk }) => {
  const { t } = useTranslation("supporter");
  const { id } = perk;
  return (
    <li className='flex min-w-0 items-start gap-5 sm:flex-col sm:gap-0'>
      <PerkArt kind={id} className='aspect-[4/3] w-24 shrink-0 sm:w-full sm:max-w-[240px]' />
      <div className='min-w-0 sm:mt-4'>
        <p className='text-base font-semibold text-zinc-100'>
          {t(`perks.items.${id}.title`)}
        </p>
        <p className='mt-1.5 text-sm leading-relaxed text-zinc-400'>
          {t(`perks.items.${id}.body`)}
        </p>
      </div>
    </li>
  );
};

interface RoadmapPerksProps {
  /** Off on /supporter itself, where a link to the panel would point at the page it is on. */
  showPanelLink?: boolean;
}

export const RoadmapPerks = ({ showPanelLink = true }: RoadmapPerksProps) => {
  const { t } = useTranslation("supporter");
  return (
    <section className='relative overflow-hidden rounded-lg bg-zinc-900/40 p-5 sm:p-8'>
      {/* Amber, the colour the app already spends on supporters (the badge, the
          avatar ring): this section lists what the badge buys, so the surface
          it sits on should read as the same thing. Pattern and glow both fade
          out to the right, leaving the copy on clean background. */}
      <HeroPattern
        variant='shuffle'
        className='opacity-[0.09]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
        gradient={["#fbbf24", "#f97316"]}
      />
      <div className='light-tint pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent' />

      <div className='relative flex flex-wrap items-start justify-between gap-x-12 gap-y-5'>
        <div className='min-w-0 max-w-2xl'>
          <h2 className='text-xl font-semibold text-zinc-100 sm:text-2xl'>
            {t("perks.title")}
          </h2>
          <p className='mt-2 text-base leading-relaxed text-zinc-400'>
            {t("perks.intro")}
          </p>
        </div>

        {showPanelLink && (
          <Link
            href='/supporter'
            className={cn(
              PRESSABLE,
              "group flex shrink-0 items-center gap-1.5 rounded-lg border-b-black/30 bg-amber-500/15 px-4 py-2.5 text-sm text-amber-300 transition-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 hover:bg-amber-500/25",
            )}>
            {t("perks.open_panel")}
            <ArrowRight
              size={16}
              className='transition-transform duration-base group-hover:translate-x-0.5'
            />
          </Link>
        )}
      </div>

      {/* No tiles: a tinted box inside this one would be a card in a card on a
          phone. The two halves are told apart by their headings and the gap
          between them. */}
      <div className='relative mt-12 flex flex-col gap-x-10 gap-y-6 sm:flex-row sm:items-start'>
        <PerkArt kind='badge' className='aspect-[4/3] w-28 shrink-0 sm:w-40' />
        <div className='min-w-0 flex-1'>
          <GroupHeading
            title={t("perks.badge_title")}
            note={t("perks.badge_note")}
          />
          <ul className='mt-7 grid gap-x-10 gap-y-7 md:grid-cols-3'>
            {BADGE_PERKS.map((id) => (
              <BadgePerk key={id} id={id} />
            ))}
          </ul>
        </div>
      </div>

      <div className='relative mt-16'>
        <TokenExchange />

        <p className='mt-12 text-base font-semibold text-zinc-100'>
          {t("perks.spend_title")}
        </p>
        <ul className='mt-6 grid gap-x-10 gap-y-9 sm:grid-cols-2 xl:grid-cols-4'>
          {SPEND_PERKS.map((perk) => (
            <SpendCard key={perk.id} perk={perk} />
          ))}
        </ul>
      </div>
    </section>
  );
};
