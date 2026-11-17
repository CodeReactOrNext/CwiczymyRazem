import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import { DISCORD_INVITE_URL } from "constants/community";
import {
  ImprovDiscordCard,
  ImprovPlayersCard,
} from "feature/improv/components/ImprovAside";
import { improvPlayers } from "feature/improv/components/ImprovFaces";
import { ImprovHero } from "feature/improv/components/ImprovHero";
import {
  ImprovHowItWorks,
  ImprovRules,
} from "feature/improv/components/ImprovHowItWorks";
import { PastRounds } from "feature/improv/components/PastRounds";
import { ProposeTrackDialog } from "feature/improv/components/ProposeTrackDialog";
import { TakeGrid } from "feature/improv/components/TakeCard";
import { TakeSubmitForm } from "feature/improv/components/TakeSubmitForm";
import { TrackPool } from "feature/improv/components/TrackPool";
import { useImprovOverview } from "feature/improv/hooks/useImprov";
import { IMPROV_ROUND_DAYS } from "feature/improv/types/improv.types";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { History, ListChecks, Music2, Plus, Vote } from "lucide-react";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useAppSelector } from "store/hooks";

type ImprovTab = "takes" | "next" | "past" | "how";

const TABS: { id: ImprovTab; icon: typeof Music2 }[] = [
  { id: "takes", icon: Music2 },
  { id: "next", icon: Vote },
  { id: "past", icon: History },
  { id: "how", icon: ListChecks },
];

/**
 * The improv page. One backing track is live for five days: the round sits on
 * top, and under it are the four things you can do with it — watch and post
 * takes, decide the next track, look back, and read how it all works.
 */
export const ImprovView = () => {
  const { t } = useTranslation("improv");
  const router = useRouter();
  const uid = useAppSelector(selectUserAuth) ?? null;
  const { data: overview, isLoading, isError } = useImprovOverview(uid);

  // The Discord announcement's "Link your take" button lands here with ?submit=1.
  const wantsSubmit = router.query.submit === "1";
  const [tab, setTab] = useState<ImprovTab>("takes");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const round = overview?.round ?? null;
  const takes = overview?.takes ?? [];
  const players = improvPlayers(takes);
  const myTakeCount = takes.filter((take) => take.userId === uid).length;
  const discordUrl = round?.discordThreadUrl ?? DISCORD_INVITE_URL;

  const goToSubmit = () => {
    setTab("takes");
    // The field may not be mounted yet when coming from another tab.
    requestAnimationFrame(() => {
      linkInputRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      linkInputRef.current?.focus({ preventScroll: true });
    });
  };

  return (
    <div className='flex min-h-screen flex-col gap-6 px-4 pb-16 pt-6 md:px-8 lg:px-10'>
      {isLoading || !overview ? (
        isError ? (
          <p className='px-1 text-sm text-zinc-400'>{t("error")}</p>
        ) : (
          <Skeleton variant='block' className='h-80 w-full' />
        )
      ) : round ? (
        <ImprovHero
          round={round}
          takes={takes}
          now={overview.now}
          discordUrl={discordUrl}
          onLinkTake={goToSubmit}
        />
      ) : (
        <section className='force-dark relative overflow-hidden rounded-lg bg-zinc-900'>
          <img
            src='/images/improv/hero.webp'
            alt=''
            className='absolute inset-0 hidden h-full w-full object-cover object-right sm:block'
          />
          <div className='absolute inset-0 hidden bg-gradient-to-r from-zinc-950 via-zinc-950/90 via-55% to-zinc-950/30 sm:block' />
          <div className='relative flex max-w-xl flex-col items-start gap-4 p-6 sm:p-10'>
            <p className='flex items-center gap-1.5 text-xs font-bold text-amber-300'>
              <Music2 className='h-3.5 w-3.5' />
              {t("empty.eyebrow", { days: IMPROV_ROUND_DAYS })}
            </p>
            <h1 className='text-3xl font-bold leading-tight text-white'>
              {t("empty.title")}
            </h1>
            <p className='text-sm leading-relaxed text-zinc-400'>
              {t("empty.body")}
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className='mt-2 h-11 px-5'>
              <span className='flex items-center gap-2'>
                <Plus />
                {t("next.upload")}
              </span>
            </Button>
          </div>
        </section>
      )}

      {/* First-timers get the explanation before the tabs; once you have a take
          on the round you know the drill, and it stays under "How it works". */}
      {overview && myTakeCount === 0 && tab !== "how" && <ImprovHowItWorks />}

      <div className={tabNavListClass}>
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type='button'
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
            className={tabNavItemClass(tab === id)}>
            <Icon size={16} className='shrink-0' />
            {t(`tabs.${id}`)}
            {id === "takes" && takes.length > 0 && (
              <span className='rounded bg-zinc-800 px-1.5 py-0.5 text-xs tabular-nums text-zinc-300'>
                {takes.length}
              </span>
            )}
            {id === "next" && (overview?.pool.length ?? 0) > 0 && (
              <span className='rounded bg-zinc-800 px-1.5 py-0.5 text-xs tabular-nums text-zinc-300'>
                {overview?.pool.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "takes" && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8'>
          <div className='flex min-w-0 flex-col gap-6'>
            {round ? (
              <>
                <TakeSubmitForm
                  myTakeCount={myTakeCount}
                  inputRef={linkInputRef}
                  autoFocus={wantsSubmit}
                />
                {takes.length > 0 ? (
                  <TakeGrid
                    takes={takes}
                    uid={uid}
                    canModerate={overview?.isAdmin ?? false}
                  />
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 text-center'>
                    <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-500'>
                      <Music2 size={26} />
                    </div>
                    <h3 className='mb-1 text-lg font-bold text-zinc-100'>
                      {t("take.none_title")}
                    </h3>
                    <p className='max-w-sm text-sm text-zinc-400'>
                      {t("take.none_body")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              overview && (
                <p className='px-1 text-sm text-zinc-400'>
                  {t("take.no_round")}
                </p>
              )
            )}
          </div>

          <aside className='flex min-w-0 flex-col gap-6'>
            <ImprovDiscordCard
              discordUrl={discordUrl}
              hasThread={!!round?.discordThreadUrl}
            />
            <ImprovPlayersCard players={players} />
            <ImprovRules />
          </aside>
        </div>
      )}

      {tab === "next" &&
        (overview ? (
          <TrackPool
            pool={overview.pool}
            uid={uid}
            isAdmin={overview.isAdmin}
            nextRoundStartsAt={overview.nextRoundStartsAt}
            onUpload={() => setIsUploadOpen(true)}
          />
        ) : (
          <Skeleton variant='block' className='h-40 w-full' />
        ))}

      {tab === "past" && (
        <PastRounds
          rounds={overview?.past ?? []}
          uid={uid}
          isAdmin={overview?.isAdmin ?? false}
        />
      )}

      {tab === "how" && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8'>
          <ImprovHowItWorks />
          <ImprovRules />
        </div>
      )}

      <ProposeTrackDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </div>
  );
};
