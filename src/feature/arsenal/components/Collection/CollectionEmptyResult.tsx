import { SearchX } from "lucide-react";

interface CollectionEmptyResultProps {
  /** The query that came up empty — echoed back so the user sees what was searched. */
  query: string;
}

/** Shown when a section owns items but the current filter hides all of them. */
export const CollectionEmptyResult = ({
  query,
}: CollectionEmptyResultProps) => (
  <div className='flex items-center gap-3 rounded-lg bg-zinc-900/40 px-6 py-10 text-zinc-400'>
    <SearchX size={18} className='shrink-0 text-zinc-500' />
    <p className='text-sm'>
      {query.trim()
        ? `Nothing here matches “${query.trim()}”.`
        : "Nothing here yet."}
    </p>
  </div>
);
