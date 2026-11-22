import { EmptyState } from "components/EmptyState/EmptyState";
import { useTranslation } from "hooks/useTranslation";
import { SearchX } from "lucide-react";

interface CollectionEmptyResultProps {
  /** The query that came up empty — echoed back so the user sees what was searched. */
  query: string;
}

/** Shown when a section owns items but the current filter hides all of them. */
export const CollectionEmptyResult = ({
  query,
}: CollectionEmptyResultProps) => {
  const { t } = useTranslation("arsenal");

  // A plain icon, not Kostek: several sections can come up empty at once.
  return (
    <EmptyState
      size='compact'
      icon={<SearchX />}
      title={
        query.trim()
          ? t("collection.no_match", { query: query.trim() })
          : t("collection.nothing_yet")
      }
    />
  );
};
