import { useTranslation } from "hooks/useTranslation";
import { Button } from "assets/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "assets/components/ui/sheet";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { ArrowUpDown, Check, Music, X } from "lucide-react";
import React from "react";

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
  const { t } = useTranslation("songs");
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
      <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-950 p-0 shadow-2xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6">
            <SheetTitle className="pr-10 text-2xl font-semibold text-white">
              {t("filter_sheet.title")}
            </SheetTitle>
            <div className="mt-1 flex items-center justify-between gap-3">
              <SheetDescription className="text-zinc-500">
                {t("filter_sheet.subtitle")}
              </SheetDescription>
              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onClearFilters();
                    onClose();
                  }}
                  className="h-9 shrink-0 rounded-md border border-red-400/30 px-3 text-sm font-bold text-red-400 hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300"
                >
                  {t("filter_sheet.reset")}
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-9 no-scrollbar">
            {/* Tier Section (Multi-select) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-zinc-300">{t("filter_sheet.tiers")}</h4>
                <span className="text-[10px] text-zinc-600 font-bold">{t("filter_sheet.selected", { count: localTiers.length })}</span>
              </div>
              <div className="grid grid-cols-8 gap-2">
                {tiers.map((t) => {
                  const isActive = localTiers.includes(t.tier);
                  return (
                    <button
                      key={t.tier}
                      onClick={() => toggleTier(t.tier)}
                      className={cn(
                        "relative flex aspect-square items-center justify-center rounded-lg text-sm font-black transition-all active:scale-95",
                        isActive ? "scale-105 shadow-lg brightness-110" : "opacity-30 grayscale-[0.8] hover:opacity-70 hover:grayscale-0"
                      )}
                      style={{
                        backgroundColor: isActive ? `${t.color}20` : "rgba(255,255,255,0.02)",
                        color: t.color,
                      }}
                    >
                      <Ripple />
                      {t.tier}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Genre Section (Multi-select) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-300">{t("filter_sheet.genres")}</h4>
                  {localGenres.length > 0 && (
                    <button
                        onClick={() => setLocalGenres([])}
                        className="rounded-md px-2 py-1 text-xs font-bold text-cyan-500 hover:bg-cyan-500/10 hover:text-cyan-400"
                    >
                        {t("filter_sheet.clear")}
                    </button>
                  )}
                </div>
                
                {/* Selected Genres Badges */}
                {localGenres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {localGenres.map(g => (
                      <span 
                        key={g} 
                        className="flex items-center gap-1.5 rounded-[4px] bg-cyan-500/10 px-3 py-1 text-[10px] font-bold text-cyan-400 animate-in zoom-in-95 duration-200"
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

                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1 no-scrollbar pt-4">
                  {availableGenres.map((g) => {
                    const isActive = localGenres.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={cn(
                          "relative flex h-10 items-center gap-2 rounded-lg px-3 text-xs font-bold transition-all text-left",
                          isActive
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-white/[0.02] text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-300"
                        )}
                      >
                        <Ripple />
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
              <h4 className="text-sm font-semibold text-zinc-300">{t("filter_sheet.order")}</h4>
              <Select 
                value={localSortBy} 
                onValueChange={(val) => {
                  setLocalSortBy(val);
                  setLocalSortDirection(val === 'popularity' || val === 'createdAt' ? 'desc' : 'asc');
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-lg bg-white/[0.02] text-zinc-300 focus:ring-0 border-none">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 opacity-50 text-cyan-500" />
                    <SelectValue placeholder={t("filter_sheet.sort_by")} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 shadow-2xl border-none">
                  <SelectItem value="title">{t("filter_sheet.sort_title")}</SelectItem>
                  <SelectItem value="popularity">{t("filter_sheet.sort_popularity")}</SelectItem>
                  <SelectItem value="createdAt">{t("filter_sheet.sort_date")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="px-6 pt-6 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] bg-zinc-950/50 backdrop-blur-sm">
            <Button
                onClick={handleApply}
                className="h-14 w-full rounded-lg bg-white font-semibold text-black shadow-xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              {t("filter_sheet.apply")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
