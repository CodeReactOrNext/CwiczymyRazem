import { cn } from "assets/lib/utils";
import { ArrowRight, Bot, ClipboardCheck, ClipboardList, Loader2, Music, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

interface NavigationCardProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  colorAccent?: "cyan" | "purple" | "green" | "amber";
  isLoading?: boolean;
  actionLabel?: string;
}

export const NavigationCard = ({
  title,
  icon,
  onClick,
  colorAccent = "cyan",
  isLoading = false,
  actionLabel = "Go to action",
}: NavigationCardProps) => {
  const colorClasses = {
    cyan: {
      iconBg: "bg-cyan-500/20",
      iconText: "text-cyan-400",
      blur: "bg-cyan-500/25",
      ring: "hover:ring-cyan-500/40",
    },
    purple: {
      iconBg: "bg-purple-500/20",
      iconText: "text-purple-400",
      blur: "bg-purple-500/25",
      ring: "hover:ring-purple-500/40",
    },
    green: {
      iconBg: "bg-emerald-500/20",
      iconText: "text-emerald-400",
      blur: "bg-emerald-500/25",
      ring: "hover:ring-emerald-500/40",
    },
    amber: {
      iconBg: "bg-amber-500/20",
      iconText: "text-amber-400",
      blur: "bg-amber-500/25",
      ring: "hover:ring-amber-500/40",
    },
  };

  const colors = colorClasses[colorAccent];

  return (
    <div
      className={cn(
        "font-openSans group relative flex h-full transform cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-card via-second-500/95 to-second-600 p-3 shadow-lg transition-all duration-300 hover:shadow-xl hover:ring-2 sm:p-4",
        colors.ring
      )}
      onClick={onClick}
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
          <Loader2 className={`h-8 w-8 ${colors.iconText} animate-spin`} />
        </div>
      )}
      
      <div
        className={cn(colors.blur, "absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl")}></div>

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-black font-normal  text-white">
            {title}
          </h3>
        </div>
        <div className={cn(
          "rounded-xl p-2 shadow-2xl transition-all duration-500 group-hover:scale-110",
          colors.iconBg,
          colors.iconText
        )}>
          {icon}
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-center gap-2 text-xs font-bold text-zinc-300 transition-all duration-300 group-hover:text-white group-hover:gap-3">
        <span>{actionLabel}</span>
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </div>
    </div>
  );
};

export const NavigationCards = () => {
  const router = useRouter();
  const [loadingCard, setLoadingCard] = useState<string | null>(null);

  const handleNavigation = async (path: string, cardId: string) => {
    setLoadingCard(cardId);
    await router.push(path);
  };

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      <NavigationCard
        title="Report Practice"
        icon={<ClipboardCheck className='h-5 w-5' />}
        onClick={() => handleNavigation("/report", "report")}
        colorAccent='cyan'
        isLoading={loadingCard === "report"}
        actionLabel="Log Now"
      />

  

      <NavigationCard
        title="Play Songs"
        icon={<Music className='h-5 w-5' />}
        onClick={() => handleNavigation("/timer/song-select", "songs")}
        colorAccent='purple'
        isLoading={loadingCard === "songs"}
        actionLabel="Choose Song"
      />

      <NavigationCard
        title="Guided Routine"
        icon={<ClipboardList className='h-5 w-5' />}
        onClick={() => handleNavigation("/timer/plans", "plans")}
        colorAccent='green'
        isLoading={loadingCard === "plans"}
        actionLabel="Start Plan"
      />

      <NavigationCard
        title="Generate Session"
        icon={<Sparkles className='h-5 w-5' fill="currentColor" />}
        onClick={() => handleNavigation("/timer/auto", "exercises")}
        colorAccent='amber'
        isLoading={loadingCard === "exercises"}
        actionLabel="Start Auto"
      />
    </div>
  );
};
