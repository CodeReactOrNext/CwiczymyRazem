import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { SongRating } from "feature/songs/components/SongsTable/components/SongRating";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getAverageDifficulty } from "feature/songs/utils/getAvgRaiting";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { BookOpen, CheckCircle, ChevronDown, Music, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "assets/lib/utils";

interface SongCardProps {
  song: Song;
  status?: SongStatus;
  onStatusChange: (status: SongStatus) => void;
  onRatingChange: () => void;
  readonly?: boolean;
}

const STATUS_CONFIG = {
  wantToLearn: {
    icon: Music,
    label: "Want to Learn",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  learning: {
    icon: BookOpen,
    label: "Learning",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  learned: {
    icon: CheckCircle,
    label: "Learned",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

export const SongCard = ({
  song,
  status,
  onStatusChange,
  onRatingChange,
  readonly = false,
}: SongCardProps) => {
  const { t } = useTranslation("songs");
  const avgDifficulty = getAverageDifficulty(song.difficulties);
  const tier = getSongTier(avgDifficulty);

  const currentStatusConfig = status ? STATUS_CONFIG[status] : null;
  const StatusIcon = currentStatusConfig?.icon;

  return (
    <div 
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-lg border bg-zinc-900/40 p-4 backdrop-blur-md transition-colors duration-300 hover:shadow-xl hover:shadow-black/30",
        currentStatusConfig ? currentStatusConfig.border : "border-white/5 hover:border-white/10"
      )}
    >
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${tier.color}, transparent 70%)`,
        }}
      />
      
      {/* Static gradient for tier */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `linear-gradient(135deg, ${tier.color} 0%, transparent 100%)`,
        }}
      />

      {/* Header Section */}
      <div className="relative z-10 mb-4 flex gap-3">
        {/* Tier Badge / Cover Placeholder */}
        <div 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black shadow-lg"
            style={{
                borderColor: `${tier.color}30`,
                backgroundColor: `${tier.color}10`,
                color: tier.color,
                boxShadow: `0 4px 12px ${tier.color}15`
            }}
        >
            {tier.tier}
        </div>
        
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
            {song.title}
          </h3>
          <p className="truncate text-xs font-medium text-zinc-500 group-hover:text-zinc-400">
            {song.artist}
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 mb-4 space-y-3">
        {/* Difficulty Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
             <span>Difficulty</span>
             <span style={{ color: tier.color }} className="opacity-90">{avgDifficulty.toFixed(1)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-950/50">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(avgDifficulty * 10, 100)}%`,
                backgroundColor: tier.color,
                boxShadow: `0 0 8px ${tier.color}40`,
              }}
            />
          </div>
        </div>

        {/* User Rating */}
        <div className="flex items-center justify-center rounded-lg bg-black/20 px-3 py-2">
           <SongRating song={song} refreshTable={onRatingChange} />
        </div>
      </div>

      {/* Footer / Actions */}
      {!readonly && (
        <div className="relative z-10 mt-auto pt-2 border-t border-white/5">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button 
                        variant="ghost" 
                        className={cn(
                            "w-full justify-between h-9 text-xs font-bold uppercase tracking-wider hover:bg-white/5",
                            currentStatusConfig ? currentStatusConfig.color : "text-zinc-400"
                        )}
                    >
                        <span className="flex items-center gap-2">
                             {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                             {currentStatusConfig?.label || t("select_status")}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] bg-zinc-900 border-zinc-800">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                            <DropdownMenuItem
                                key={key}
                                onClick={() => onStatusChange(key as SongStatus)}
                                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide cursor-pointer focus:bg-white/5"
                            >
                                <Icon className={cn("h-4 w-4", config.color)} />
                                <span className={cn(status === key && config.color)}>
                                    {config.label}
                                </span>
                                {status === key && <CheckCircle className="ml-auto h-3.5 w-3.5 text-cyan-500" />}
                            </DropdownMenuItem>
                        )
                    })}
                     <DropdownMenuItem
                        onClick={() => onStatusChange(undefined as unknown as SongStatus)} // Handle clearing if needed, or remove this
                        className="text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                     >
                        Reset Status
                     </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
      )}
    </div>
  );
};
