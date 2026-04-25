import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { ArrowRight, Dumbbell, Library, Loader2, Map, NotebookPen } from "lucide-react";

import type { OnboardingPath } from "../types";

interface Props {
  onChoose: (id: OnboardingPath, path: string) => void;
  loadingId: OnboardingPath | null;
}

const EXERCISES_COUNT = exercisesAgregat.length;

type PathColor = "cyan" | "amber" | "green" | "purple";

const COLORS: Record<PathColor, {
  iconBg: string;
  iconText: string;
  ring: string;
}> = {
  cyan: {
    iconBg: "bg-cyan-500/20",
    iconText: "text-cyan-400",
    ring: "hover:ring-cyan-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/20",
    iconText: "text-amber-400",
    ring: "hover:ring-amber-500/40",
  },
  green: {
    iconBg: "bg-emerald-500/20",
    iconText: "text-emerald-400",
    ring: "hover:ring-emerald-500/40",
  },
  purple: {
    iconBg: "bg-purple-500/20",
    iconText: "text-purple-400",
    ring: "hover:ring-purple-500/40",
  },
};

type PathCard = {
  id: OnboardingPath;
  path: string;
  icon: typeof Map;
  title: string;
  subtitle: string;
  color: PathColor;
};

const PATHS: PathCard[] = [
  {
    id: "journey",
    path: "/journey",
    icon: Map,
    title: "Guided Journey",
    subtitle: "Step by step, we pick what's next",
    color: "cyan",
  },
  {
    id: "exercises",
    path: "/profile/skills",
    icon: Dumbbell,
    title: "Explore Exercises",
    subtitle: `${EXERCISES_COUNT}+ exercises ready to play`,
    color: "amber",
  },
  {
    id: "report",
    path: "/report",
    icon: NotebookPen,
    title: "Practice Journal",
    subtitle: "Log your own routine & track time",
    color: "green",
  },
  {
    id: "songs",
    path: "/songs?view=management",
    icon: Library,
    title: "Song Library",
    subtitle: "Learn songs & organize your setlist",
    color: "purple",
  },
];

export const StepPath = ({ onChoose, loadingId }: Props) => {
  return (
    <div className='flex flex-col items-center max-w-sm mx-auto space-y-8'>
      {/* Intro */}
      <div className='text-center space-y-3'>
        <p className='text-xs font-bold tracking-[0.2em] uppercase text-orange-400'>
          Your Path
        </p>
        <h2 className='text-3xl font-black text-white leading-tight'>
          Where to start?
        </h2>
        <p className='text-sm text-zinc-400 leading-relaxed font-medium px-4'>
          Pick one to begin. You can always try the others later.
        </p>
      </div>

      {/* Vertical list of options */}
      <div className='flex flex-col w-full gap-3'>
        {PATHS.map((p) => {
          const Icon = p.icon;
          const c = COLORS[p.color];
          const isLoading = loadingId === p.id;
          const isDisabled = !!loadingId;

          return (
            <button
              key={p.id}
              onClick={() => !isDisabled && onChoose(p.id, p.path)}
              disabled={isDisabled}
              className={cn(
                "group relative flex items-center gap-4 w-full text-left rounded-2xl p-4 bg-zinc-900/50 border border-white/5 transition-all duration-300 hover:bg-zinc-800 hover:scale-[1.02]",
                c.ring,
                isDisabled && !isLoading && "opacity-40"
              )}>
              
              {isLoading && (
                <div className='absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl'>
                  <Loader2 className={cn("h-6 w-6 animate-spin", c.iconText)} />
                </div>
              )}

              <div className={cn("p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110", c.iconBg, c.iconText)}>
                <Icon className='h-6 w-6' />
              </div>

              <div className='flex-1 min-w-0'>
                <h3 className='text-base font-bold text-white mb-0.5 truncate'>
                  {p.title}
                </h3>
                <p className='text-[11px] text-zinc-400 truncate'>
                  {p.subtitle}
                </p>
              </div>

              <div className={cn("flex flex-shrink-0 items-center justify-center w-8 h-8 rounded-full bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white transition-colors")}>
                <ArrowRight className='h-4 w-4' />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
