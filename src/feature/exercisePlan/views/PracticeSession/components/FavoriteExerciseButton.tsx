import { cn } from "assets/lib/utils";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteExercise } from "feature/user/store/userSlice.favoriteActions";
import { Heart } from "lucide-react";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface FavoriteExerciseButtonProps {
  /** Catalog/plan exercise id used to key the favorite (not a generated variant id). */
  exerciseId: string;
  /** Compact rendering for tight spots (landscape drawer title). */
  compact?: boolean;
  className?: string;
}

/**
 * Heart toggle for favoriting the exercise you're currently practicing.
 * Reads auth + favorites straight from the store and reuses the shared
 * optimistic {@link toggleFavoriteExercise} thunk, so it can be dropped next to
 * any exercise title. Renders nothing for logged-out users, matching how the
 * plan builder hides favoriting behind auth.
 */
export const FavoriteExerciseButton = ({
  exerciseId,
  compact = false,
  className,
}: FavoriteExerciseButtonProps) => {
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

  if (!userAuth) return null;

  const isFavorite = (userInfo?.favoriteExerciseIds ?? []).includes(exerciseId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavoriteExercise({ exerciseId, isFavorite: !isFavorite }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isFavorite}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg ring-1 transition-colors duration-300",
        compact ? "h-6 w-6" : "h-9 w-9",
        isFavorite
          ? "bg-rose-500/15 text-rose-400 ring-rose-500/30 hover:bg-rose-500/25 hover:text-rose-300"
          : "bg-white/5 text-zinc-400 ring-white/10 hover:bg-rose-500/10 hover:text-rose-300",
        className
      )}
    >
      <Heart className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", isFavorite && "fill-current")} />
    </button>
  );
};
