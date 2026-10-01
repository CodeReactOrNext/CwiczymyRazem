import { useMutation } from "@tanstack/react-query";
import { firebaseSaveProfileLayout } from "feature/profile/services/profileLayout.service";
import type { ProfileLayoutConfig } from "feature/profile/types/profileLayout.types";
import { normalizeProfileLayout } from "feature/profile/utils/profileLayout";
import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * The layout of the profile being viewed, seeded from the user document the
 * page already loaded. Only the owner can change it: every change is shown at
 * once and written behind it; a failed write puts back what was there.
 *
 * The page remounts the profile per user id, so the seed never goes stale
 * when navigating from one profile to another.
 */
export const useProfileLayout = (
  userAuth: string,
  stored: unknown,
  canEdit: boolean,
) => {
  const [layout, setLayout] = useState<ProfileLayoutConfig>(() =>
    normalizeProfileLayout(stored),
  );

  const { mutate } = useMutation({
    mutationFn: ({ next }: { next: ProfileLayoutConfig; previous: ProfileLayoutConfig }) =>
      firebaseSaveProfileLayout(userAuth, next),
    onError: (error, { previous }) => {
      setLayout(previous);
      console.error("[profile layout]", error);
      toast.error("Couldn't save your profile layout");
    },
  });

  const updateLayout = useCallback(
    (next: ProfileLayoutConfig) => {
      if (!canEdit) return;
      setLayout(next);
      mutate({ next, previous: layout });
    },
    [canEdit, mutate, layout],
  );

  return { layout, updateLayout };
};
