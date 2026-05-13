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
  sky:     { iconBg: "bg-sky-500/10",     iconText: "text-sky-400",     blur: "bg-sky-500/5",     ring: "group-hover:ring-sky-500/30"     },
  amber:   { iconBg: "bg-amber-500/10",   iconText: "text-amber-400",   blur: "bg-amber-500/5",   ring: "group-hover:ring-amber-500/30"   },
  rose:    { iconBg: "bg-rose-500/10",    iconText: "text-rose-400",    blur: "bg-rose-500/5",    ring: "group-hover:ring-rose-500/30"    },
  emerald: { iconBg: "bg-emerald-500/10", iconText: "text-emerald-400", blur: "bg-emerald-500/5", ring: "group-hover:ring-emerald-500/30" },
  cyan:    { iconBg: "bg-cyan-500/10",    iconText: "text-cyan-400",    blur: "bg-cyan-500/5",    ring: "group-hover:ring-cyan-500/30"    },
  violet:  { iconBg: "bg-violet-500/10",  iconText: "text-violet-400",  blur: "bg-violet-500/5",  ring: "group-hover:ring-violet-500/30"  },
  indigo:  { iconBg: "bg-indigo-500/10",  iconText: "text-indigo-400",  blur: "bg-indigo-500/5",  ring: "group-hover:ring-indigo-500/30"  },
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
        className={`group relative flex items-center gap-4 rounded-lg bg-white/[0.02] p-4 backdrop-blur-sm transition-all duration-300 ${
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
        <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg ${c.iconBg} transition-all duration-300 group-hover:scale-110`}>
          {loading
            ? <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            : <Icon className={`h-10 w-10 ${c.iconText} transition-colors duration-300`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="truncate text-[15px] font-bold text-zinc-100 group-hover:text-white transition-colors">{title}</h3>
            {locked && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 ring-1 ring-amber-500/20">
                <Lock className="h-2.5 w-2.5 text-amber-500/80" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">{lockLabel}</span>
              </div>
            )}
          </div>
          <p className="truncate text-[13px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{description}</p>
        </div>
        {!locked && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/0 transition-all duration-300">
            <ArrowRight className="h-5 w-5 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-200" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mb-8 w-full">
        <div className="font-openSans container mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("routine",  ListChecks,    "Daily Routine", "Follow your guided routine",   "/timer/plans",   "indigo")}
                {listItem("song",      PiCassetteTapeLight,    "Songs",      "Track practice time for songs", "/timer/song-select",  "rose")}
                {listItem("log",     ClipboardList, "Log Practice", "Manually log your session",  "/report",         "emerald")}
                {listItem("smart", PiMagicWandDuotone, "Auto plan", "Automatically generated session", "/timer/auto", "violet", !isMaster, "Master")}
                {listItem("timer",  LuTimer,  "Free Timer", "Practice with a timer", "/timer/practice", "sky")}
                {listItem("finder", Search, "Practice Finder", "Lessons and exercises", "/practice-finder", "amber", !isMaster, "Master")}
                {listItem("journey",  Route,      "Learning Path", "Step-by-step progress",   "/journey",       "rose")}
                {listItem("roadmap", Map, "Roadmaps", "AI-powered learning paths", "/ai-coach", "cyan", !isMaster, "Master")}
                {listItem("skills",    Brain,    "Skills", "Specific skill focus",         "/profile/skills",     "violet")}
                {listItem("exercises", Dumbbell, "Exercises",  "Full exercise library",             "/profile/skills?tab=browse",  "emerald")}
                {listItem("gp",     SiGuitarpro, "GP file", "Practice GP files", "/gp-tabs", "amber", !isPremium, "Premium")}
                {listItem("scales", PiTreeView, "Scale Map", "Coming Soon", "#", "sky", true, "Soon")}
                {hasLastSession && listItem("resume", History, "Resume Last", "Continue playing", "/timer/practice", "cyan")}
          </div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};

