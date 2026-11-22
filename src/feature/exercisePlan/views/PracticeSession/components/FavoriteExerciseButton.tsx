import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteExercise } from "feature/user/store/userSlice.favoriteActions";
import { useTranslation } from "hooks/useTranslation";
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
  const { t } = useTranslation("plans");
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
      aria-label={isFavorite ? t("remove_favorite") : t("add_favorite")}
      aria-pressed={isFavorite}
      title={isFavorite ? t("remove_favorite") : t("add_favorite")}
      className={cn(
        buttonVariants({ variant: "subtle", size: compact ? "icon-sm" : "icon" }),
        "shrink-0",
        isFavorite
          ? "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300"
          : "text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300",
        className
      )}
    >
      <Heart className={cn(isFavorite && "fill-current")} />
    </button>
  );
};
