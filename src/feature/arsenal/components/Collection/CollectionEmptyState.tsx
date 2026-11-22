import { EmptyState } from "components/EmptyState/EmptyState";
import { useTranslation } from "hooks/useTranslation";

/** Nothing owned at all — the only path out is the case shop. */
export const CollectionEmptyState = () => {
  const { t } = useTranslation("arsenal");

  // Nothing in the collection yet: Kostek shakes an empty case.
  return <EmptyState mood='emptyCase' title={t("collection.empty")} />;
};
