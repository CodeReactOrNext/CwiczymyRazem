import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useState, useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { ExerciseCard } from "./ExerciseCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "assets/lib/utils";

interface ExerciseGridProps {
  exercises: Exercise[];
  selectedExercises: Exercise[];
  onToggleExercise: (exercise: Exercise) => void;
  onPreviewExercise?: (exercise: Exercise) => void;
}

export const ExerciseGrid = ({
  exercises,
  selectedExercises,
  onToggleExercise,
  onPreviewExercise,
}: ExerciseGridProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Reset to first page when filtering/searching changes exercises list
  useEffect(() => {
    setCurrentPage(1);
  }, [exercises]);

  const totalPages = Math.ceil(exercises.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExercises = exercises.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    let pages: (number | string)[] = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if (currentPage <= 4) {
        pages = [1, 2, 3, 4, 5, '...', totalPages];
      } else if (currentPage >= totalPages - 3) {
        pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }
    return pages;
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {paginatedExercises.map((exercise) => {
          const isSelected = selectedExercises.some((e) => e.id === exercise.id);
          const locked = !!exercise.premium && !isPremium;

          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isSelected={isSelected}
              onToggle={onToggleExercise}
              onPreview={onPreviewExercise}
              isLocked={locked}
              onUpgrade={locked ? () => setShowUpgradeModal(true) : undefined}
            />
          );
        })}
        {paginatedExercises.length === 0 && (
          <div className="py-12 text-center text-zinc-500 text-[13px]">
            No exercises match your criteria.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8 mb-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[8px] border border-white/5 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 backdrop-blur-md active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="flex items-center justify-center w-[34px] h-[34px] text-zinc-500 font-bold text-[12px]">
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(page as number)}
                  className={cn(
                    "flex items-center justify-center w-[34px] h-[34px] rounded-[8px] text-[12px] font-bold transition-all duration-300 backdrop-blur-md active:scale-95",
                    currentPage === page
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_-2px_rgba(6,182,212,0.2)]"
                      : "border border-white/5 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center justify-center w-[34px] h-[34px] rounded-[8px] border border-white/5 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 backdrop-blur-md active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};
