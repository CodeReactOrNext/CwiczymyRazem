import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

import type { RotationItem } from "../types/rotation.types";
import { useRotation } from "./useRotation";

/** The custom rotation item a `?rotation=<id>` link points at, once the rotation has loaded. */
export const useCustomRotationItem = (
  itemId: string | null,
): RotationItem | null => {
  const uid = useAppSelector(selectUserAuth);
  const { items } = useRotation(itemId ? uid : null);
  if (!itemId) return null;
  return (
    items.find((item) => item.type === "custom" && item.id === itemId) ?? null
  );
};

/** Where the Free Timer opens for a custom rotation item. */
export const rotationTimerHref = (itemId: string) =>
  `/timer/practice?rotation=${encodeURIComponent(itemId)}`;
