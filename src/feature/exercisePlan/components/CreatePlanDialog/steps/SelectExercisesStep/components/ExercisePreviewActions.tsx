import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { getUserExercisePlans } from "feature/exercisePlan/services/getUserExercisePlans";
import { updateExercisePlan } from "feature/exercisePlan/services/updateExercisePlan";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import { logger } from "feature/logger/Logger";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { toggleFavoriteExercise } from "feature/user/store/userSlice.favoriteActions";
import { useTranslation } from "hooks/useTranslation";
import { Check, Heart, ListPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface AddToPlanMenuProps {
  exercise: Exercise;
  userId: string;
}

const userPlansQueryKey = (userId: string) => [
  "user-exercise-plans",
  userId,
];

/** Appends the previewed exercise to one of the player's own plans. */
export function AddToPlanMenu({ exercise, userId }: AddToPlanMenuProps) {
  const { t } = useTranslation("plans");
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: userPlansQueryKey(userId),
    queryFn: () => getUserExercisePlans(userId),
    staleTime: 60_000,
  });

  const { mutate: addToPlan, isPending } = useMutation({
    mutationFn: (plan: ExercisePlan) =>
      updateExercisePlan(plan.id, {
        exercises: [...plan.exercises, exercise],
      }),
    onSuccess: (_, plan) => {
      toast.success(t("added_to", { title: plan.title }));
      queryClient.invalidateQueries({ queryKey: userPlansQueryKey(userId) });
    },
    onError: (error) => {
      logger.error(error, { context: "AddToPlanMenu" });
      toast.error(t("add_error"));
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          disabled={isPending}
          className='gap-1.5 text-zinc-300 hover:bg-white/5 hover:text-zinc-100'>
          {isPending ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : (
            <ListPlus className='h-3.5 w-3.5' />
          )}
          {t("add_to_plan")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='max-h-72 w-64 overflow-y-auto'>
        {isLoading && (
          <DropdownMenuItem disabled>{t("loading_plans")}</DropdownMenuItem>
        )}
        {!isLoading && (plans?.length ?? 0) === 0 && (
          <DropdownMenuItem asChild>
            <Link href='/timer/plans'>{t("no_plans_create")}</Link>
          </DropdownMenuItem>
        )}
        {plans?.map((plan) => {
          const alreadyIn = plan.exercises.some((e) => e.id === exercise.id);
          return (
            <DropdownMenuItem
              key={plan.id}
              disabled={alreadyIn}
              onSelect={() => addToPlan(plan)}
              className='flex items-center justify-between gap-3'>
              <span className='truncate'>{plan.title}</span>
              {alreadyIn && <Check className='h-3.5 w-3.5 text-emerald-400' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Heart + "Add to plan" for the preview footer. Renders nothing for guests. */
export function ExercisePreviewActions({ exercise }: { exercise: Exercise }) {
  const { t } = useTranslation("plans");
  const dispatch = useAppDispatch();
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);

  if (!userAuth) return null;

  const isFavorite =
    userInfo?.favoriteExerciseIds?.includes(exercise.id) ?? false;
  const label = isFavorite ? t("remove_favorite") : t("add_favorite");

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        onClick={() =>
          dispatch(
            toggleFavoriteExercise({
              exerciseId: exercise.id,
              isFavorite: !isFavorite,
            })
          )
        }
        title={label}
        aria-label={label}
        aria-pressed={isFavorite}
        className={cn(
          "hover:bg-white/5",
          isFavorite
            ? "text-rose-400 hover:text-rose-300"
            : "text-zinc-400 hover:text-zinc-100"
        )}>
        <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
      </Button>
      <AddToPlanMenu exercise={exercise} userId={userAuth} />
    </>
  );
}
