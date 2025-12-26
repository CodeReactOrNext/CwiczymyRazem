import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "assets/components/ui/sheet";
import { Button } from "assets/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { cn } from "assets/lib/utils";
import { Filter, Check, Music, ArrowUpDown, Shield, X } from "lucide-react";

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  difficultyFilter: string;
  tierFilters: string[];
  genreFilters: string[];
  sortBy: string;
  sortDirection: "asc" | "desc";
  availableGenres: string[];
  onApply: (filters: {
    difficultyFilter: string;
    tierFilters: string[];
    genreFilters: string[];
    sortBy: string;
    sortDirection: "asc" | "desc";
  }) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

const FilterSheet = ({
  isOpen,
  onClose,
  difficultyFilter,
  tierFilters,
  genreFilters,
  sortBy,
  sortDirection,
  availableGenres,
  onApply,
  onClearFilters,
  hasFilters,
}: FilterSheetProps) => {
  const tiers = getAllTiers();

  const [localDifficulty, setLocalDifficulty] = React.useState(difficultyFilter);
  const [localTiers, setLocalTiers] = React.useState(tierFilters);
  const [localGenres, setLocalGenres] = React.useState(genreFilters);
  const [localSortBy, setLocalSortBy] = React.useState(sortBy);
  const [localSortDirection, setLocalSortDirection] = React.useState(sortDirection);

  React.useEffect(() => {
    if (isOpen) {
      setLocalDifficulty(difficultyFilter);
      setLocalTiers(tierFilters);
      setLocalGenres(genreFilters);
      setLocalSortBy(sortBy);
      setLocalSortDirection(sortDirection);
    }
  }, [isOpen, difficultyFilter, tierFilters, genreFilters, sortBy, sortDirection]);

  const toggleTier = (tier: string) => {
    setLocalTiers((prev) => 
      prev.includes(tier) 
        ? prev.filter(t => t !== tier) 
        : [...prev, tier]
    );
  };

  const toggleGenre = (genre: string) => {
    setLocalGenres((prev) => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };

  const handleApply = () => {
    onApply({
      difficultyFilter: localDifficulty,
      tierFilters: localTiers,
      genreFilters: localGenres,
      sortBy: localSortBy,
      sortDirection: localSortDirection,
    });
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-white/5 bg-zinc-950 p-0 shadow-2xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-cyan-500" />
                Filter & Sort
              </SheetTitle>
              {hasFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onClearFilters();
                    onClose();
                  }}
                  className="text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Reset
                </Button>
              )}
            </div>
            <SheetDescription className="text-zinc-500 mt-1">
              Refine your song discovery experience
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-9 no-scrollbar">
            {/* Tier Section (Multi-select) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Skill Tiers</h4>
                <span className="text-[10px] text-zinc-600 font-bold uppercase">{localTiers.length} Selected</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {tiers.map((t) => {
                  const isActive = localTiers.includes(t.tier);
                  return (
                    <button
                      key={t.tier}
                      onClick={() => toggleTier(t.tier)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-xl border text-base font-black transition-all active:scale-95",
                        isActive ? "scale-105 shadow-lg brightness-110" : "opacity-30 grayscale-[0.8] hover:opacity-70 hover:grayscale-0"
                      )}
                      style={{
                        borderColor: isActive ? t.color : "rgba(255,255,255,0.05)",
                        backgroundColor: isActive ? `${t.color}20` : "rgba(255,255,255,0.02)",
                        color: t.color,
                      }}
                    >
                      {t.tier}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genre Section (Multi-select) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Music Genres</h4>
                  {localGenres.length > 0 && (
                    <button 
                        onClick={() => setLocalGenres([])}
                        className="text-[10px] font-black uppercase text-cyan-500 hover:text-cyan-400"
                    >
                        Clear
                    </button>
                  )}
                </div>
                
                {/* Selected Genres Badges */}
                {localGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {localGenres.map(g => (
                      <span 
                        key={g} 
                        className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-[10px] font-bold text-cyan-400 animate-in zoom-in-95 duration-200"
                      >
                        {g}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-white" 
                          onClick={() => toggleGenre(g)}
                        />
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar border-t border-white/5 pt-4">
                  {availableGenres.map((g) => {
                    const isActive = localGenres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={cn(
                          "flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-all text-left",
                          isActive
                            ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                            : "border-white/5 bg-white/[0.02] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                        )}
                      >
                        <Music className={cn("h-3 w-3", isActive ? "text-cyan-400" : "opacity-30")} />
                        <span className="truncate capitalize">{g}</span>
                        {isActive && <Check className="ml-auto h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
            </div>

            {/* Sort Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Display Order</h4>
              <Select 
                value={localSortBy} 
                onValueChange={(val) => {
                  setLocalSortBy(val);
                  setLocalSortDirection(val === 'popularity' || val === 'createdAt' ? 'desc' : 'asc');
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-xl border-white/5 bg-white/[0.02] text-zinc-300 focus:ring-0">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 opacity-50 text-cyan-500" />
                    <SelectValue placeholder="Sort by..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900 shadow-2xl">
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="popularity">Popularity (High-Low)</SelectItem>
                  <SelectItem value="createdAt">Date Added (Newest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 pb-40 sm:pb-6 border-t border-white/5 bg-zinc-950/50 backdrop-blur-sm">
            <Button 
                onClick={handleApply}
                className="h-14 w-full rounded-2xl bg-cyan-600 font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-cyan-900/20 hover:bg-cyan-500 transition-all active:scale-[0.98]"
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
