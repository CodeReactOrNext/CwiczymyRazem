import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserInfo } from "feature/user/store/userSlice";
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Compass,
  Dumbbell,
  History,
  Layers,
  ListChecks,
  Lock,
  Map,
  Music,
  Route,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaClock, FaGuitar } from "react-icons/fa";
import { SiGuitarpro } from "react-icons/si";
import { GiAudioCassette } from "react-icons/gi";
import { PiCassetteTapeLight, PiTreeView, PiMagicWandDuotone } from "react-icons/pi";
import { LuTimer } from "react-icons/lu";
import { useAppSelector } from "store/hooks";

const colorMap = {
  sky:     { iconBg: "bg-gradient-to-br from-sky-500/20 to-sky-500/5",     iconBorder: "border border-white/5 border-t-sky-500/40 border-l-sky-500/20", iconText: "text-sky-400",     blur: "bg-sky-500/5",     ring: "group-hover:ring-sky-500/30"     },
  amber:   { iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",   iconBorder: "border border-white/5 border-t-amber-500/40 border-l-amber-500/20", iconText: "text-amber-400",   blur: "bg-amber-500/5",   ring: "group-hover:ring-amber-500/30"   },
  rose:    { iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",    iconBorder: "border border-white/5 border-t-rose-500/40 border-l-rose-500/20", iconText: "text-rose-400",    blur: "bg-rose-500/5",    ring: "group-hover:ring-rose-500/30"    },
  emerald: { iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5", iconBorder: "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20", iconText: "text-emerald-400", blur: "bg-emerald-500/5", ring: "group-hover:ring-emerald-500/30" },
  cyan:    { iconBg: "bg-gradient-to-br from-cyan-500/20 to-cyan-500/5",    iconBorder: "border border-white/5 border-t-cyan-500/40 border-l-cyan-500/20", iconText: "text-cyan-400",    blur: "bg-cyan-500/5",    ring: "group-hover:ring-cyan-500/30"    },
  violet:  { iconBg: "bg-gradient-to-br from-violet-500/20 to-violet-500/5",  iconBorder: "border border-white/5 border-t-violet-500/40 border-l-violet-500/20", iconText: "text-violet-400",  blur: "bg-violet-500/5",  ring: "group-hover:ring-violet-500/30"  },
  indigo:  { iconBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",  iconBorder: "border border-white/5 border-t-indigo-500/40 border-l-indigo-500/20", iconText: "text-indigo-400",  blur: "bg-indigo-500/5",  ring: "group-hover:ring-indigo-500/30"  },
} as const;

type ColorKey = keyof typeof colorMap;

export const PracticeModeSelector = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const isMaster  = userInfo?.role === "master" || userInfo?.role === "admin";

  const [loadingMode, setLoadingMode]       = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasLastSession, setHasLastSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasLastSession(!!localStorage.getItem("cw.lastSession"));
  }, []);

  const nav = (href: string, id: string, locked?: boolean) => {
    if (locked) { setShowUpgradeModal(true); return; }
    setLoadingMode(id);
    router.push(href);
  };

  const listItem = (
    id: string,
    Icon: React.ElementType,
    title: string,
    description: string,
    href: string,
    ck: ColorKey,
    locked?: boolean,
    lockLabel?: string,
  ) => {
    const c = colorMap[ck];
    const loading = loadingMode === id;
    return (
      <div
        className={`group relative flex items-center gap-3 rounded-lg bg-white/[0.02] p-3.5 backdrop-blur-sm transition-all duration-300 ${
          lockLabel === "Soon" 
            ? "cursor-default grayscale opacity-50" 
            : locked 
              ? "opacity-60 cursor-default" 
              : "cursor-pointer hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-black/20"
        }`}
        onClick={() => {
          if (lockLabel === "Soon") return;
          if (!loading) nav(href, id, locked);
        }}
        tabIndex={0}
        role="button"
      >
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${c.iconBg} ${c.iconBorder} transition-all duration-300 group-hover:scale-105 shadow-lg`}>
          {loading
            ? <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            : <Icon className={`h-6 w-6 ${c.iconText} transition-colors duration-300`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="truncate text-[14px] font-bold text-zinc-100 group-hover:text-white transition-colors">{title}</h3>
            {locked && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 ring-1 ring-amber-500/20">
                <Lock className="h-2.5 w-2.5 text-amber-500/80" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">{lockLabel}</span>
              </div>
            )}
          </div>
          <p className="truncate text-[12px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{description}</p>
        </div>
        {!locked && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/0 transition-all duration-300">
            <ArrowRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-200" />
          </div>
        )}
      </div>
    );
  };

  const heroListItem = (
    id: string,
    Icon: React.ElementType,
    title: string,
    description: string,
    href: string,
    ck: ColorKey,
    locked?: boolean,
    lockLabel?: string,
  ) => {
    const c = colorMap[ck];
    const loading = loadingMode === id;
    return (
      <div
        className={`group relative flex items-center gap-3 rounded-lg bg-white/[0.03] p-[18px] backdrop-blur-md transition-all duration-300 border border-white/[0.02] ${
          lockLabel === "Soon" 
            ? "cursor-default grayscale opacity-50" 
            : locked 
              ? "opacity-60 cursor-default" 
              : "cursor-pointer hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-black/20"
        }`}
        onClick={() => {
          if (lockLabel === "Soon") return;
          if (!loading) nav(href, id, locked);
        }}
        tabIndex={0}
        role="button"
      >
        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg ${c.iconBg} ${c.iconBorder} transition-all duration-500 group-hover:scale-105 shadow-lg`}>
          {loading
            ? <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            : <Icon className={`h-7 w-7 ${c.iconText} transition-colors duration-300 drop-shadow-md`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="truncate text-[16px] font-black text-white tracking-wide">{title}</h3>
            {locked && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 ring-1 ring-amber-500/20">
                <Lock className="h-2.5 w-2.5 text-amber-500/80" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">{lockLabel}</span>
              </div>
            )}
          </div>
          <p className="text-[13px] text-zinc-400 font-medium leading-relaxed">{description}</p>
        </div>
        {!locked && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/0 transition-all duration-300 ml-2">
            <ArrowRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-200" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mb-8 w-full">
        <div className="font-openSans container mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-12">
            <div>
              <h2 className="text-lg font-bold text-indigo-400 mb-4">Practice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {hasLastSession && heroListItem("resume", History, "Resume Last", "Continue playing where you left off", "/timer/practice", "indigo")}
                {heroListItem("routine",  ListChecks,    "Daily Routine", "Follow your personalized daily guided routine",   "/timer/plans",   "indigo")}
                {heroListItem("song",      PiCassetteTapeLight,    "Songs",      "Track practice time for your repertoire", "/timer/song-select",  "indigo")}
                {heroListItem("log",     ClipboardList, "Log Practice", "Manually log a custom practice session",  "/report",         "indigo")}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-rose-400 mb-4">Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("journey",  Route,      "Learning Path", "Step-by-step progress",   "/journey",       "rose")}
                {listItem("roadmap", Map, "Roadmaps", "AI-powered learning paths", "/ai-coach", "rose", !isMaster, "Master")}
                {listItem("scales", PiTreeView, "Scale Map", "Coming Soon", "#", "rose", true, "Soon")}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-emerald-400 mb-4">Discover</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("skills",    Brain,    "Skills", "Specific skill focus",         "/profile/skills",     "emerald")}
                {listItem("exercises", Dumbbell, "Exercises",  "Full exercise library",             "/profile/skills?tab=browse",  "emerald")}
                {listItem("finder", Search, "Practice Finder", "Lessons and exercises", "/practice-finder", "emerald", !isMaster, "Master")}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-amber-400 mb-4">Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("smart", PiMagicWandDuotone, "Auto plan", "Automatically generated session", "/timer/auto", "amber", !isMaster, "Master")}
                {listItem("timer",  LuTimer,  "Free Timer", "Practice with a timer", "/timer/practice", "amber")}
                {listItem("gp",     SiGuitarpro, "GP file", "Practice GP files", "/gp-tabs", "amber", !isPremium, "Premium")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};

