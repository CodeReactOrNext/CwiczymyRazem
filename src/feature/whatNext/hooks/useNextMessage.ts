import type { NextMessage } from "feature/whatNext/types/whatNext.types";
import { useTranslation } from "hooks/useTranslation";
import { useCallback } from "react";

/**
 * Turns a provider's message into text. Keys are in `what_next` unless they
 * name another namespace (`dashboard:daily_quests.tasks.auto_plan`).
 */
export const useNextMessage = () => {
  const { t } = useTranslation(["what_next", "dashboard"]);

  const text = useCallback(
    (message: NextMessage | undefined) =>
      message ? t(message.key, message.params) : "",
    [t],
  );

  return { t, text };
};
