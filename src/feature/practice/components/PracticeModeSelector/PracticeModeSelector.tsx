import { Ripple } from "components/Ripple/Ripple";
import { HeroPattern } from "components/UI/HeroBanner";
import type { LastSessionInfo } from "feature/practice/utils/lastSession";
import { loadLastSessions } from "feature/practice/utils/lastSession";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useRipple } from "hooks/useRipple";
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Dumbbell,
  History,
  ListChecks,
  Lock,
  Users,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  PiCassetteTapeLight,
  PiMagicWandDuotone,
  PiTreeView,
} from "react-icons/pi";
import { SiGuitarpro } from "react-icons/si";
import { useAppSelector } from "store/hooks";

const colorMap = {
  amber: {
    iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",
    iconBorder:
      "border border-white/5 border-t-amber-500/40 border-l-amber-500/20",
    iconText: "text-amber-400",
    cardBg: "bg-zinc-800/60",
  },
  rose: {
    iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",
    iconBorder:
      "border border-white/5 border-t-rose-500/40 border-l-rose-500/20",
    iconText: "text-rose-400",
    cardBg: "bg-zinc-800/60",
  },
  emerald: {
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    iconBorder:
      "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20",
    iconText: "text-emerald-400",
    cardBg: "bg-zinc-800/60",
  },
  indigo: {
    iconBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",
    iconBorder:
      "border border-white/5 border-t-indigo-500/40 border-l-indigo-500/20",
    iconText: "text-indigo-400",
    cardBg: "bg-zinc-800/60",
  },
} as const;

type ColorKey = keyof typeof colorMap;

interface ModeLink {
  label: string;
  onClick: () => void;
}

interface ModeCardProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  ck: ColorKey;
  loading: boolean;
  locked?: boolean;
  lockLabel?: string;
  hero?: boolean;
  links?: ModeLink[];
  onActivate: () => void;
}

const ModeCard = ({
  Icon,
  title,
  description,
  ck,
  loading,
  locked,
  lockLabel,
  hero,
  links,
  onActivate,
}: ModeCardProps) => {
  const c = colorMap[ck];
  const { createRipple, ripple } = useRipple("bg-white/15");
  // A card with links is a group: the header is a label and only the list rows
  // navigate — every destination gets exactly one click target.
  const isGroup = !!links && links.length > 0;

  return (
    <div
      className={`group relative flex gap-3 overflow-hidden rounded-xl transition-background duration-300 ${
        hero || isGroup ? "items-start" : "items-center"
      } ${
        hero
          ? `${c.cardBg} bg-gradient-to-br from-white/[0.03] to-transparent p-[18px] backdrop-blur-md`
          : `${c.cardBg} bg-gradient-to-br from-white/[0.02] to-transparent p-3.5 backdrop-blur-sm`
      } ${
        isGroup
          ? ""
          : locked
          ? "cursor-default opacity-60"
          : `cursor-pointer ${
              hero ? "hover:bg-white/[0.08]" : "hover:bg-white/[0.06]"
            }`
      }`}
      onClick={
        isGroup
          ? undefined
          : (e) => {
              createRipple(e);
              if (!loading) onActivate();
            }
      }
      tabIndex={isGroup ? undefined : 0}
      role={isGroup ? undefined : "button"}>
      {ripple}
      <div
        className={`flex flex-shrink-0 items-center justify-center rounded-lg ${
          c.iconBg
        } ${c.iconBorder} ${hero ? "h-14 w-14" : "h-12 w-12"}`}>
        {loading ? (
          <div
            className={`${
              hero ? "h-8 w-8" : "h-7 w-7"
            } animate-spin rounded-full border-[3px] border-white border-t-transparent`}
          />
        ) : (
          <Icon
            className={`${hero ? "h-8 w-8" : "h-7 w-7"} ${
              c.iconText
            } transition-colors duration-300`}
          />
        )}
      </div>
      <div className='min-w-0 flex-1'>
        <div className='mb-0.5 flex items-center gap-2'>
          <h3
            className={
              hero
                ? "truncate text-[17px] font-black tracking-wide text-white"
                : "truncate text-[14px] font-bold text-white transition-colors group-hover:text-white"
            }>
            {title}
          </h3>
          {locked && (
            <div
              className={`flex items-center gap-1 rounded-full bg-amber-500/10 ${
                hero ? "px-2.5" : "px-2"
              } py-0.5`}>
              <Lock className='h-2.5 w-2.5 text-amber-500/80' />
              <span className='text-[9px] font-black tracking-widest text-amber-500/80'>
                {lockLabel}
              </span>
            </div>
          )}
        </div>
        <p
          className={
            hero
              ? "text-[13px] font-medium leading-relaxed text-zinc-500"
              : "truncate text-[12px] text-zinc-500 transition-colors group-hover:text-zinc-400"
          }>
          {description}
        </p>
        {links && links.length > 0 && (
          <div className='relative z-10 mt-4 flex flex-col gap-1.5'>
            {links.map((link) => (
              <button
                key={link.label}
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  link.onClick();
                }}
                className='group/link relative flex min-h-[42px] items-center justify-between overflow-hidden rounded-lg bg-white/[0.05] px-3 py-2 text-left text-[13px] font-semibold text-zinc-100 transition-background duration-200 hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-[0.98]'>
                <Ripple className='bg-white/20' />
                <span>{link.label}</span>
                <ArrowRight className='h-4 w-4 shrink-0 text-zinc-400 transition-all group-hover/link:translate-x-0.5 group-hover/link:text-white' />
              </button>
            ))}
          </div>
        )}
      </div>
      {!locked && !isGroup && (
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${
            hero ? "ml-2" : ""
          }`}>
          <ArrowRight className='h-4 w-4 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-white' />
        </div>
      )}
    </div>
  );
};

export const PracticeModeSelector = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium =
    userInfo?.role === "pro" ||
    userInfo?.role === "master" ||
    userInfo?.role === "admin";
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";

  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lastSessions, setLastSessions] = useState<LastSessionInfo[]>([]);
  const router = useRouter();

  useEffect(() => {
    setLastSessions(loadLastSessions());
  }, []);

  const nav = (href: string, id: string, locked?: boolean) => {
    if (locked) {
      setShowUpgradeModal(true);
      return;
    }
    setLoadingMode(id);
    router.push(href);
  };

  const modeItem = (
    id: string,
    Icon: React.ElementType,
    title: string,
    description: string,
    href: string,
    ck: ColorKey,
    options?: {
      hero?: boolean;
      locked?: boolean;
      lockLabel?: string;
      links?: { label: string; href: string }[];
    }
  ) => (
    <ModeCard
      Icon={Icon}
      title={title}
      description={description}
      ck={ck}
      loading={loadingMode === id}
      hero={options?.hero}
      locked={options?.locked}
      lockLabel={options?.lockLabel}
      links={options?.links?.map((link) => ({
        label: link.label,
        onClick: () => nav(link.href, `${id}:${link.label}`, options?.locked),
      }))}
      onActivate={() => nav(href, id, options?.locked)}
    />
  );

  return (
    <>
      <div className='relative w-full'>
        <HeroPattern
          className='opacity-[0.04]'
          maskImage='linear-gradient(to bottom, black 0%, black 20%, transparent 80%)'
        />
        <div className='container relative z-10 mx-auto max-w-6xl px-4 py-12 font-sans sm:px-6'>
          <div className='flex flex-col gap-12'>
            {lastSessions.length > 0 && (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6'>
                {lastSessions.map((session) => (
                  <button
                    key={session.at}
                    type='button'
                    onClick={() => nav(session.href, `resume-${session.at}`)}
                    className='group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl bg-zinc-800/60 bg-gradient-to-br from-white/[0.02] to-transparent px-4 py-4 text-left transition-background duration-200 hover:bg-white/[0.06] backdrop-blur-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                    <Ripple className='bg-white/15' />
                    <div className='flex items-center gap-3 min-w-0 flex-1'>
                      <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/5'>
                        {loadingMode === `resume-${session.at}` ? (
                          <div className='h-7 w-7 animate-spin rounded-full border-[2px] border-white border-t-transparent' />
                        ) : (
                          <History className='h-7 w-7 text-indigo-400' />
                        )}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='text-[10px] font-semibold tracking-wide text-zinc-500 mb-1'>
                          Last Session
                        </p>
                        <p className='truncate text-sm font-bold text-white'>
                          {session.title}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className='h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-white' />
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6'>
                {modeItem(
                  "routine",
                  ListChecks,
                  "Practice Routines",
                  "Follow daily guided routine",
                  "/timer/plans",
                  "indigo",
                  {
                    hero: true,
                    links: [
                      { label: "All Routines", href: "/timer/plans" },
                      { label: "Playalongs", href: "/timer/plans?tab=playalongs" },
                      { label: "My Plans", href: "/timer/plans?tab=my_plans" },
                      { label: "Community", href: "/timer/plans?tab=community" },
                    ],
                  }
                )}
                {modeItem(
                  "log",
                  ClipboardList,
                  "Log",
                  "Track a session by hand or with a stopwatch",
                  "/report",
                  "indigo",
                  {
                    hero: true,
                    links: [
                      { label: "Manual Log", href: "/report" },
                      { label: "Free Timer", href: "/timer/practice" },
                    ],
                  }
                )}
              </div>
            </div>

            <div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6'>
                {modeItem(
                  "song",
                  PiCassetteTapeLight,
                  "Songs",
                  "Track practice time for your repertoire",
                  "/songs?view=board",
                  "amber"
                )}
                {modeItem(
                  "smart",
                  PiMagicWandDuotone,
                  "Auto Plan",
                  "Automatically generated session",
                  "/timer/auto",
                  "amber",
                  { locked: !isMaster, lockLabel: "Master" }
                )}
                {modeItem(
                  "gp",
                  SiGuitarpro,
                  "Guitar Pro Files",
                  "Practice your imported Guitar Pro tabs",
                  "/gp-tabs",
                  "amber",
                  { locked: !isPremium, lockLabel: "Premium" }
                )}
              </div>
            </div>

            <div className='h-px bg-white/5' />

            <div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6'>
                {modeItem(
                  "learning-path",
                  Brain,
                  "Learning Path",
                  "Step-by-step progress",
                  "/journey",
                  "rose"
                )}
                {modeItem(
                  "roadmaps",
                  ClipboardList,
                  "Mastery Roadmaps",
                  "Goal-based practice roadmaps",
                  "/ai-coach",
                  "rose"
                )}
                {modeItem(
                  "scales",
                  PiTreeView,
                  "Scale Map",
                  "Interactive scale fretboard tree",
                  "/scale-tree",
                  "rose"
                )}
              </div>
            </div>

            <div className='h-px bg-white/5' />

            <div>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6'>
                {modeItem(
                  "skills",
                  Brain,
                  "Skills",
                  "Specific skill focus",
                  "/profile/skills",
                  "emerald"
                )}
                {modeItem(
                  "exercises",
                  Dumbbell,
                  "Exercises",
                  "Full exercise library",
                  "/profile/skills?tab=browse",
                  "emerald"
                )}
                {modeItem(
                  "community-exercises",
                  Users,
                  "Community Exercises",
                  "Exercises shared by the community",
                  "/profile/skills?tab=community",
                  "emerald"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};
