import type { WidgetDefinition } from "feature/dashboard/data/widgetCatalog";
import { useTranslation } from "hooks/useTranslation";
import { useCallback } from "react";

/**
 * A widget definition with its title and description in the player's language.
 * The catalog keeps English inline; a card without a translation (a milestone
 * tier, say) keeps it.
 */
export const useLocalizeWidget = () => {
  const { t } = useTranslation("dashboard");

  return useCallback(
    <D extends Pick<WidgetDefinition, "id" | "title" | "description">>(
      definition: D,
    ): D => ({
      ...definition,
      title: t(`widgets.${definition.id}.title`, definition.title),
      description: t(
        `widgets.${definition.id}.description`,
        definition.description,
      ),
    }),
    [t],
  );
};
