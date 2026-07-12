import { Ripple } from "components/Ripple/Ripple";
import { HeroPattern } from "components/UI/HeroBanner";
import type { LastSessionInfo } from "feature/practice/utils/lastSession";
import { loadLastSession } from "feature/practice/utils/lastSession";
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
  Map,
  Route,
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
  },
  rose: {
    iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",
    iconBorder:
      "border border-white/5 border-t-rose-500/40 border-l-rose-500/20",
    iconText: "text-rose-400",
  },
  emerald: {
    iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5",
    iconBorder:
      "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20",
    iconText: "text-emerald-400",
  },
  indigo: {
    iconBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",
    iconBorder:
      "border border-white/5 border-t-indigo-500/40 border-l-indigo-500/20",
    iconText: "text-indigo-400",
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
      className={`group relative flex gap-3 overflow-hidden rounded-lg transition-background duration-300 ${
        hero || isGroup ? "items-start" : "items-center"
      } ${
        hero
          ? "bg-zinc-800/60 p-[18px] backdrop-blur-md"
          : "bg-zinc-800/60 p-3.5 backdrop-blur-sm"
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
              hero ? "h-7 w-7" : "h-6 w-6"
            } animate-spin rounded-full border-[3px] border-white border-t-transparent`}
          />
        ) : (
          <Icon
            className={`${hero ? "h-7 w-7" : "h-6 w-6"} ${
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
                ? "truncate text-[16px] font-black tracking-wide text-white"
                : "truncate text-[14px] font-bold text-zinc-100 transition-colors group-hover:text-white"
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
              ? "text-[13px] font-medium leading-relaxed text-zinc-400"
              : "truncate text-[12px] text-zinc-500 transition-colors group-hover:text-zinc-400"
          }>
          {description}
        </p>
        {links && links.length > 0 && (
          <div className='relative z-10 mt-3 flex flex-col gap-1.5'>
            {links.map((link) => (
              <button
                key={link.label}
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  link.onClick();
                }}
                className='group/link relative flex min-h-[40px] items-center justify-between overflow-hidden rounded-lg bg-white/[0.02] px-3 py-2.5 text-left text-[13px] font-semibold text-zinc-200 transition-background duration-200 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:scale-[0.98]'>
                <Ripple className='bg-white/20' />
                <span>{link.label}</span>
                <ArrowRight className='h-4 w-4 shrink-0 text-zinc-300 transition-all group-hover/link:translate-x-0.5 group-hover/link:text-white' />
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
  const [lastSession, setLastSession] = useState<LastSessionInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLastSession(loadLastSession());
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
      <div className='relative mb-8 w-full'>
        <HeroPattern
          className='opacity-[0.04]'
          maskImage='linear-gradient(to bottom, black 0%, black 20%, transparent 80%)'
        />
        <div className='container relative z-10 mx-auto max-w-6xl px-4 py-8 font-sans sm:px-6'>
          <div className='flex flex-col gap-12'>
            {lastSession && (
              <button
                type='button'
                onClick={() => nav(lastSession.href, "resume")}
                className='group relative flex w-full items-center gap-4 overflow-hidden rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-5 py-4 text-left transition-background duration-200 hover:bg-indigo-500/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                <Ripple className='bg-white/15' />
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/5 border-l-indigo-500/20 border-t-indigo-500/40 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5'>
                  {loadingMode === "resume" ? (
                    <div className='h-6 w-6 animate-spin rounded-full border-[3px] border-white border-t-transparent' />
                  ) : (
                    <History className='h-6 w-6 text-indigo-400' />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-[11px] font-semibold tracking-wide text-indigo-300/80'>
                    Last Session
                  </p>
                  <p className='truncate text-[15px] font-black text-white'>
                    {lastSession.title}
                  </p>
                </div>
                <ArrowRight className='h-4 w-4 shrink-0 text-indigo-300/70 transition-transform duration-300 group-hover:translate-x-1' />
              </button>
            )}

            <div>
              <h2 className='mb-4 text-lg font-bold text-white'>Practice</h2>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6'>
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
                      {
                        label: "Playalongs",
                        href: "/timer/plans?tab=playalongs",
                      },
                      { label: "My Plans", href: "/timer/plans?tab=my_plans" },
                      { label: "Community", href: "/timer/plans?tab=community" },
                    ],
                  }
                )}
                {modeItem(
                  "song",
                  PiCassetteTapeLight,
                  "Songs",
                  "Track practice time for your repertoire",
                  "/timer/song-select",
                  "indigo",
                  {
                    hero: true,
                    links: [
                      { label: "Song Practice", href: "/timer/song-select" },
                      { label: "Board", href: "/songs?view=board" },
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
              <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-6 lg:grid-cols-3 lg:gap-6'>
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

            <div>
              <h2 className='mb-4 text-lg font-bold text-white'>Learn</h2>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6'>
                {modeItem(
                  "journey",
                  Route,
                  "Learning Path",
                  "Step-by-step progress",
                  "/journey",
                  "rose"
                )}
                {modeItem(
                  "roadmap",
                  Map,
                  "Mastery Roadmaps",
                  "Goal-based practice roadmaps",
                  "/ai-coach",
                  "rose",
                  { locked: !isMaster, lockLabel: "Master" }
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

            <div>
              <h2 className='mb-4 text-lg font-bold text-white'>Discover</h2>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6'>
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
