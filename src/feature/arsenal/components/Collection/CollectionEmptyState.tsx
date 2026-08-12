import { PackageOpen } from "lucide-react";

/** Nothing owned at all — the only path out is the case shop. */
export const CollectionEmptyState = () => (
  <div className='flex flex-col items-center justify-center gap-4 rounded-lg bg-zinc-900/40 py-20 text-zinc-400'>
    <PackageOpen size={48} className='text-zinc-600' />
    <p className='text-sm font-medium'>
      Your collection is empty. Open a case to start!
    </p>
  </div>
);
