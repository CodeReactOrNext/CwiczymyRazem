import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { ClipboardCheck, ClipboardList, Library, Loader2, Music, Play, Sparkles } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";

interface NavigationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onClick?: () => void;
  colorAccent?: "cyan" | "purple" | "green" | "amber";
  isLoading?: boolean;
}

export const NavigationCard = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  onClick,
  colorAccent = "cyan",
  isLoading = false,
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
      className={`${colors.ring} font-openSans relative flex h-full transform cursor-pointer overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-card via-second-500/95 to-second-600 p-3 shadow-lg transition-all duration-100 hover:shadow-xl hover:ring-2 sm:p-4`}
      onClick={onClick}
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
          <Loader2 className={`h-8 w-8 ${colors.iconText} animate-spin`} />
        </div>
      )}
      
      <div
        className={`${colors.blur} absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full blur-2xl`}></div>

      <div className='flex flex-1 flex-row items-center'>
        <div className='flex-1 pr-2 sm:pr-3'>
          <h3 className='mb-1 line-clamp-1 text-sm font-bold text-white'>
            {title}
          </h3>
          <p className='line-clamp-2 text-xs text-gray-300'>{description}</p>

          {(primaryAction || secondaryAction) && (
            <div className='mt-2 flex flex-wrap gap-1 sm:gap-1.5'>
              {primaryAction && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    primaryAction.onClick();
                  }}
                  size='sm'
                  className='h-7 min-w-fit px-2 py-0 text-xs shadow-sm transition-colors'>
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    secondaryAction.onClick();
                  }}
                  className='h-7 min-w-fit border-second-400/30 px-2 py-0 text-xs transition-colors hover:bg-second-400/10'>
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className='flex-shrink-0'>
          <div
            className={`${colors.iconBg} ${colors.iconText} rounded-full p-2 shadow-sm sm:p-2.5`}>
            {icon}
          </div>
        </div>
      </div>

      <div
        className={`${colors.iconText} opacity-80 hover:${colors.iconText} absolute right-2 top-2 transition-all`}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='12'
          height='12'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'>
          <path d='M7 17l9.2-9.2M17 17V7H7' />
        </svg>
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
    <div className='grid grid-cols-1 gap-3  sm:gap-4  md:grid-cols-2 lg:grid-cols-4'>
      <NavigationCard
        title="Report practice"
        description="Save and log your manual practice session."
        icon={<ClipboardCheck className='h-6 w-6' />}
        onClick={() => handleNavigation("/report", "report")}
        colorAccent='cyan'
        isLoading={loadingCard === "report"}
      />

      <NavigationCard
        title="Practice songs"
        description="Master your favorite tracks from your collection."
        icon={<Music className='h-6 w-6' />}
        onClick={() => handleNavigation("/timer/song-select", "songs")}
        colorAccent='purple'
        isLoading={loadingCard === "songs"}
      />

      <NavigationCard
        title="Practice plan"
        description="Follow your structured daily workout routines."
        icon={<ClipboardList className='h-6 w-6' />}
        onClick={() => handleNavigation("/timer/plans", "plans")}
        colorAccent='green'
        isLoading={loadingCard === "plans"}
      />

      <NavigationCard
        title="Auto plan"
        description="Get an AI-powered session tailored to your skill level."
        icon={<Sparkles className='h-6 w-6' fill="currentColor" />}
        onClick={() => handleNavigation("/timer/auto", "exercises")}
        colorAccent='amber'
        isLoading={loadingCard === "exercises"}
      />
    </div>
  );
};
