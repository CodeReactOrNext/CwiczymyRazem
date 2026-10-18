import { useQuery } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { RoadmapBuildPreview } from "feature/supporterPanel/components/RoadmapBuildPreview";
import { useAccountEmail } from "feature/supporterPanel/hooks/useAccountEmail";
import { fetchRoadmapTeaser } from "feature/supporterPanel/services/roadmapTeaser.service";
import type { RoadmapTeaserItem } from "feature/supporterPanel/types/userRoadmaps.types";
import { levelTone } from "feature/supporterPanel/utils/roadmapGoal";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { Dumbbell, FileText, Heart, Lock, Users } from "lucide-react";
import type { ComponentType } from "react";
import { FaYoutube } from "react-icons/fa6";

/** Tiles past this many are drawn out of focus — enough to read the board, not to browse it. */
const CLEAR_TILES = 3;

type Icon = ComponentType<{ className?: string }>;

/** What every step of a roadmap comes with. Copy: `ai_coach:locked.step.<id>`. */
const STEP_PARTS: { id: string; Icon: Icon }[] = [
  { id: "exercise", Icon: Dumbbell },
  { id: "description", Icon: FileText },
  { id: "video", Icon: FaYoutube },
];

/** Why the page is locked, in order. Copy: `ai_coach:locked.why.<id>`. */
const WHY_REASONS = ["ai", "cost", "donations"];

const TeaserTile = ({
  item,
  blurred,
}: {
  item: RoadmapTeaserItem;
  blurred: boolean;
}) => {
  const { t } = useTranslation("ai_coach");
  return (
    <div
      aria-hidden={blurred || undefined}
      className={cn(
        "flex h-full flex-col gap-4 rounded-lg bg-zinc-900/40 p-5",
        blurred && "pointer-events-none select-none blur-[3px]",
      )}>
      <span className='flex items-center justify-between gap-3'>
        {item.level ? (
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px] font-bold",
              levelTone(item.level),
            )}>
            {t(`levels.${item.level}`, item.level)}
          </span>
        ) : (
          <span />
        )}
        <Lock size={14} className='shrink-0 text-zinc-600' />
      </span>
      <span className='line-clamp-3 text-base font-bold leading-snug text-zinc-100'>
        {item.goal}
      </span>
      <span className='mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500'>
        <span>
          {t("phases_steps", {
            phases: item.phaseCount,
            steps: item.stepCount,
          })}
        </span>
        {item.followerCount > 0 && (
          <span className='flex items-center gap-1.5'>
            <Users size={13} />
            {t("following", { count: item.followerCount })}
          </span>
        )}
      </span>
    </div>
  );
};

/**
 * The board seen through the window: real goals other players are working on,
 * so the ask above is about something that visibly exists. Names stay off, and
 * nothing opens.
 */
const BoardPreview = () => {
  const { t } = useTranslation("ai_coach");
  const { data, isLoading } = useQuery({
    queryKey: ["roadmap-teaser"],
    queryFn: fetchRoadmapTeaser,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
        {Array.from({ length: CLEAR_TILES }, (_, index) => (
          <div
            key={index}
            className='h-40 animate-pulse rounded-lg bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }
  if (!data?.roadmaps.length) return null;

  return (
    <section className='space-y-4'>
      <div className='space-y-1'>
        <h2 className='text-lg font-bold text-zinc-100'>
          {t("locked.board_title")}
        </h2>
        <p className='text-sm text-zinc-500'>
          <Interpolate
            text={t("locked.board_body", { count: data.players })}
            values={{
              total: (
                <span className='font-semibold tabular-nums text-zinc-300'>
                  {data.total}
                </span>
              ),
              players: (
                <span className='font-semibold tabular-nums text-zinc-300'>
                  {data.players}
                </span>
              ),
            }}
          />
        </p>
      </div>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
        {data.roadmaps.map((item, index) => (
          <TeaserTile
            key={`${item.goal}-${index}`}
            item={item}
            blurred={index >= CLEAR_TILES}
          />
        ))}
      </div>
    </section>
  );
};

/**
 * What a player without the badge sees on Player Roadmaps.
 *
 * Two plain cards, each with one job. The first shows what a roadmap is: the
 * build animation the generator card plays, and the three things every step
 * comes with. The second says why the page is locked — three numbered
 * reasons — and, beside them, what opens it. The roadmaps are written for a
 * single goal by a model that costs money per run, so the reasons say so
 * plainly instead of pretending it is a premium perk.
 */
export const PlayerRoadmapsLocked = () => {
  const { t } = useTranslation("ai_coach");
  const email = useAccountEmail();

  return (
    <div className='space-y-12'>
      <div className='space-y-4'>
        <section className='grid gap-10 rounded-lg bg-zinc-900/40 p-6 sm:p-8 md:p-10 lg:grid-cols-2 lg:items-center lg:gap-16'>
          <div className='flex flex-col gap-8'>
            <div className='space-y-2'>
              <h2 className='text-2xl font-bold leading-tight text-zinc-100'>
                {t("locked.title")}
              </h2>
              <p className='max-w-md text-sm leading-relaxed text-zinc-400'>
                {t("locked.lead")}
              </p>
            </div>

            <div className='space-y-4'>
              <p className='text-sm text-zinc-500'>{t("locked.steps_title")}</p>
              <ul className='space-y-4'>
                {STEP_PARTS.map(({ id, Icon }) => (
                  <li key={id} className='flex items-start gap-3.5'>
                    <Icon className='mt-0.5 h-4 w-4 shrink-0 text-zinc-400' />
                    <span className='flex flex-col gap-0.5'>
                      <span className='text-sm font-semibold text-zinc-100'>
                        {t(`locked.step.${id}.title`)}
                      </span>
                      <span className='text-sm text-zinc-500'>
                        {t(`locked.step.${id}.body`)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <RoadmapBuildPreview />
        </section>

        <section className='grid gap-8 rounded-lg bg-zinc-900/40 p-6 sm:p-8 md:p-10 lg:grid-cols-2 lg:gap-16'>
          <div className='space-y-5'>
            <h3 className='flex items-center gap-2 text-base font-bold text-zinc-100'>
              <Lock size={16} className='text-amber-400' aria-hidden />
              {t("locked.why_title")}
            </h3>
            <ol className='space-y-3'>
              {WHY_REASONS.map((id, index) => (
                <li
                  key={id}
                  className='flex items-baseline gap-4 text-sm text-zinc-300'>
                  <span className='w-5 shrink-0 text-xs font-semibold tabular-nums text-zinc-500'>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {t(`locked.why.${id}`)}
                </li>
              ))}
            </ol>
          </div>

          <div className='flex flex-col items-start gap-5 lg:justify-center'>
            <div className='space-y-1'>
              <p className='text-lg font-bold text-amber-200'>
                {t("locked.why.unlock")}
              </p>
              <p className='text-sm text-zinc-400'>
                {t("locked.why.unlock_note")}
              </p>
            </div>

            <Button asChild size='lg'>
              <a href={BMC_URL} target='_blank' rel='noreferrer'>
                <span className='flex items-center gap-2'>
                  <Heart size={16} fill='currentColor' />
                  {t("locked.support")}
                </span>
              </a>
            </Button>

            <p className='max-w-md text-xs leading-relaxed text-zinc-500'>
              {email ? (
                <Interpolate
                  text={t("locked.email_known")}
                  values={{
                    email: (
                      <span className='font-semibold text-zinc-300'>
                        {email}
                      </span>
                    ),
                  }}
                />
              ) : (
                t("locked.email")
              )}
            </p>
          </div>
        </section>
      </div>

      <BoardPreview />
    </div>
  );
};
