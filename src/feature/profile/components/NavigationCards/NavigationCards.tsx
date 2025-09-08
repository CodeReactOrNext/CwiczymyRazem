import { Button } from "assets/components/ui/button";
import { Brain, Dumbbell, Library, Music } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

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
}

export const NavigationCard = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  onClick,
  colorAccent = "cyan",
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
      className='group relative flex h-full cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-zinc-900/70 p-4 shadow-lg backdrop-blur-xl transition-all duration-200 hover:bg-zinc-900/80'
      onClick={onClick}
      tabIndex={0}
      aria-label={title}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      {/* Subtle background */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-800/20 via-transparent to-zinc-800/20'></div>

      <div className='relative flex flex-1 flex-col justify-between'>
        <div className='mb-3'>
          <h3 className='mb-1 line-clamp-1 text-sm font-semibold text-white'>
            {title}
          </h3>
          <p className='line-clamp-2 text-xs text-white/70'>{description}</p>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/10'>
            <div className='text-white'>{icon}</div>
          </div>

          <div className='flex items-center gap-1 text-xs text-white/60'>
            <span>View</span>
            <svg
              width='12'
              height='12'
              viewBox='0 0 16 16'
              fill='none'
              className='transition-transform duration-200 group-hover:translate-x-1'>
              <path
                d='M6 12L10 8L6 4'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className='mt-3 flex flex-wrap gap-2'>
            {primaryAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  primaryAction.onClick();
                }}
                className='rounded-lg bg-white/10 px-2 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/20'>
                {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  secondaryAction.onClick();
                }}
                className='rounded-lg bg-white/5 px-2 py-1 text-xs font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white'>
                {secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const NavigationCards = () => {
  const { t } = useTranslation("profile");
  const router = useRouter();

  return (
    <div className='border-b border-white/10 p-4'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <NavigationCard
          title='Ćwicz'
          description='Rozpocznij sesję ćwiczeń'
          icon={<Dumbbell size={16} />}
          onClick={() => router.push("/timer")}
          colorAccent='cyan'
        />

        <NavigationCard
          title='Utwory'
          description='Zarządzaj swoimi utworami'
          icon={<Music size={16} />}
          onClick={() => router.push("/songs")}
          colorAccent='purple'
        />

        <NavigationCard
          title='Umiejętności'
          description='Przeglądaj swoje umiejętności'
          icon={<Brain size={16} />}
          onClick={() => router.push("/profile/skills")}
          colorAccent='green'
        />

        <NavigationCard
          title='Ćwiczenia'
          description='Plan ćwiczeń'
          icon={<Library size={16} />}
          onClick={() => router.push("/profile/exercises")}
          colorAccent='amber'
        />
      </div>
    </div>
  );
};
