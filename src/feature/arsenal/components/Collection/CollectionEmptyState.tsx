import { Kostek } from "components/Mascot/Kostek";
import { useTranslation } from "hooks/useTranslation";


/** Nothing owned at all — the only path out is the case shop. */
export const CollectionEmptyState = () => {
  const { t } = useTranslation("arsenal");

  return (
  <div className='flex flex-col items-center justify-center gap-4 rounded-lg bg-zinc-900/40 py-20 text-zinc-400'>
    {/* Nothing in the collection yet: an empty-handed shrug. */}
    <Kostek mood='shrug' lookAt='left' className='h-24 md:h-36' />
    <p className='text-sm font-medium'>
      {t("collection.empty")}
    </p>
  </div>
  );
};
