import { buttonVariants, PRESSABLE_KEY } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { PageTitle } from "components/PageTitle/PageTitle";
import { Ripple } from "components/Ripple/Ripple";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import {
  Brain,
  CalendarDays,
  CassetteTape,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Heart,
  ListChecks,
  ListTree,
  Loader2,
  Music2,
  NotebookPen,
  Plus,
  Repeat,
  Route,
  Search,
  Signpost,
  Skull,
  Swords,
  Target,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { SiGuitarpro } from "react-icons/si";

interface ModeRowProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  loading: boolean;
  onActivate: () => void;
}

/**
 * One way to practise as one row of the list: what it is called and, in a few
 * words, what it is. Nothing else rides on the row — tags, progress and plan
 * badges were tried on its right edge and only made eleven rows harder to
 * read; where the player stands in a mode is that mode's own screen's job.
 */
const ModeRow = ({ Icon, title, description, loading, onActivate }: ModeRowProps) => {
  const { createRipple, ripple } = useRipple("bg-white/15");

  return (
    <button
      type='button'
      onClick={(e) => {
        createRipple(e);
        if (!loading) onActivate();
      }}
      // A native list row: icon on a filled tile, a chevron that says "goes
      // somewhere", and a pressed state you see under the finger (active:).
      className='relative flex min-h-[60px] w-full items-center gap-3.5 overflow-hidden rounded-lg px-3 py-2 text-left transition-background hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:bg-zinc-800/80 active:click-behavior'>
      {ripple}
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-zinc-300'>
        {loading ? (
          <Loader2 className='h-5 w-5 animate-spin' />
        ) : (
          <Icon className='h-5 w-5' />
        )}
      </span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='text-[15px] font-semibold text-zinc-100'>{title}</span>
        <span className='text-[13px] text-zinc-400'>{description}</span>
      </span>
      <ChevronRight aria-hidden className='h-4 w-4 shrink-0 text-zinc-500' />
    </button>
  );
};

const createLinkClass = cn(
  buttonVariants({ variant: "secondary", size: "sm" }),
  "shadow-none"
);

interface Mode {
  id: string;
  Icon: React.ElementType;
  href: string;
}

/**
 * Every way to practise, a card per group so the list is not read as one run
 * of eleven.
 *
 * The group names carry what the mode names alone did not. "Today's session"
 * against "Longer courses" is the difference between a plan and a path or a
 * roadmap: one is played through in a sitting, the others run for weeks. And
 * no group is named after a mode inside it — "Songs" over Songs, "Exercises"
 * over Exercise Catalog read as the same thing said twice. The last one is
 * "Versus", not "Challenges": that is the sidebar's name for the monthly song
 * board, a different thing from a duel or a boss.
 *
 * Inside a group the order is how often players open each mode from this page.
 */
const MODE_GROUPS: { id: string; modes: Mode[] }[] = [
  {
    id: "today",
    modes: [
      { id: "routine", Icon: ListChecks, href: "/timer/plans" },
      { id: "auto", Icon: WandSparkles, href: "/timer/auto" },
    ],
  },
  {
    id: "courses",
    modes: [
      { id: "learning_path", Icon: Route, href: "/journey" },
      { id: "roadmaps", Icon: ClipboardList, href: "/ai-coach" },
    ],
  },
  {
    id: "music",
    modes: [
      { id: "songs", Icon: CassetteTape, href: "/songs?view=board" },
      { id: "gp", Icon: SiGuitarpro, href: "/gp-tabs" },
    ],
  },
  {
    id: "technique",
    modes: [
      { id: "exercises", Icon: Search, href: "/profile/skills?tab=browse" },
      { id: "skills", Icon: Brain, href: "/profile/skills" },
      { id: "scales", Icon: ListTree, href: "/scale-tree" },
    ],
  },
  {
    id: "versus",
    modes: [
      { id: "duels", Icon: Swords, href: "/duels" },
      { id: "bosses", Icon: Skull, href: "/bosses" },
    ],
  },
];

const MY_STUFF = [
  { id: "favorites", Icon: Heart, href: "/favorites" },
  { id: "rotation", Icon: Repeat, href: "/rotation" },
  { id: "goals", Icon: Target, href: "/goals" },
  { id: "calendar", Icon: CalendarDays, href: "/calendar" },
  { id: "my_plans", Icon: ClipboardCheck, href: "/plans" },
  { id: "my_exercises", Icon: Music2, href: "/my-exercises" },
  { id: "player_roadmaps", Icon: Signpost, href: "/my-roadmaps" },
];

export const PracticeModeSelector = () => {
  const { t } = useTranslation("practice_hub");

  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const router = useRouter();

  const nav = (href: string, id: string) => {
    setLoadingMode(id);
    router.push(href);
  };

  const logButton = (id: string, Icon: React.ElementType, href: string) => (
    <button
      type='button'
      onClick={() => nav(href, id)}
      className={cn(PRESSABLE_KEY, "relative flex min-h-[52px] w-full items-center gap-3 overflow-hidden rounded-lg bg-zinc-800/50 px-3.5 text-left transition-background hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring")}>
      <Ripple className='bg-white/15' />
      {loadingMode === id ? (
        <Loader2 className='h-4 w-4 shrink-0 animate-spin text-zinc-400' />
      ) : (
        <Icon className='h-4 w-4 shrink-0 text-zinc-400' />
      )}
      <span className='min-w-0 truncate text-sm font-semibold text-zinc-100'>
        {t(`modes.${id}.title`)}
      </span>
    </button>
  );

  return (
    <div className='flex flex-col'>
      <div className={cn("mx-auto w-full max-w-6xl space-y-8 font-sans", PAGE_CONTENT, "md:pt-10")}>
        <PageTitle title={t("title")} />

        <div className='flex flex-col items-start gap-8 lg:flex-row'>
          <section className='w-full min-w-0 flex-1 space-y-3'>
            <h2 className='text-base font-semibold text-zinc-200'>
              {t("sections.all")}
            </h2>
            <div className='flex flex-col gap-3'>
              {MODE_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className='space-y-0.5 rounded-lg bg-zinc-900 p-2 pt-4'>
                  <h3 className='px-3 pb-1 text-xs font-semibold text-zinc-400'>
                    {t(`groups.${group.id}`)}
                  </h3>
                  {group.modes.map(({ id, Icon, href }) => (
                    <ModeRow
                      key={id}
                      Icon={Icon}
                      title={t(`modes.${id}.title`)}
                      description={t(`modes.${id}.description`)}
                      loading={loadingMode === id}
                      onActivate={() => nav(href, id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>

          <aside className='w-full shrink-0 space-y-8 lg:w-80'>
            <section className='space-y-3'>
              <h2 className='text-base font-semibold text-zinc-200'>
                {t("sections.log_time")}
              </h2>
              <div className='space-y-2 rounded-lg bg-zinc-900 p-3'>
                {logButton("free_timer", Clock, "/timer/practice")}
                {logButton("manual_log", NotebookPen, "/report")}
              </div>
            </section>

            <section className='space-y-3'>
              <h2 className='text-base font-semibold text-zinc-200'>
                {t("sections.my_stuff")}
              </h2>
              <div className='rounded-lg bg-zinc-900 p-2'>
                <nav aria-label={t("sections.my_stuff")} className='space-y-0.5'>
                  {MY_STUFF.map(({ id, Icon, href }) => (
                    <Link
                      key={id}
                      href={href}
                      className='flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-zinc-200 transition-background hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                      <Icon className='h-4 w-4 shrink-0 text-zinc-400' />
                      {t(`modes.${id}.title`)}
                    </Link>
                  ))}
                </nav>
                <div className='flex flex-wrap gap-2 px-0.5 pb-0.5 pt-3'>
                  <Link href='/plans/create' className={createLinkClass}>
                    <Plus />
                    {t("sections.create_plan")}
                  </Link>
                  <Link href='/tab-editor' className={createLinkClass}>
                    <Plus />
                    {t("sections.create_exercise")}
                  </Link>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};
