import type { ArsenalUserData } from "feature/arsenal/types/arsenal.types";
import { DEFAULT_RIG } from "feature/arsenal/types/arsenal.types";
import { GuitarBuilderTab } from "feature/guitarBuilder/components/GuitarBuilderTab";
import { GuitarBuilderView } from "feature/guitarBuilder/components/GuitarBuilderView";
import { createDemoStash } from "feature/guitarBuilder/utils/components";
import { useRouter } from "next/router";
import { useState } from "react";

/** The Arsenal tab on a fake stash — layout only, Build hits the real API. */
const TabPreview = () => {
  const [data] = useState<ArsenalUserData>(() => ({
    inventory: [],
    equippedGuitarId: null,
    equippedItemId: null,
    rig: DEFAULT_RIG,
    effectInventory: [],
    parts: [],
    components: createDemoStash(3, 10).slice(0, 60),
  }));
  return (
    <div className='mx-auto max-w-6xl px-4 py-8'>
      <GuitarBuilderTab data={data} fame={1200} />
    </div>
  );
};

/**
 * Dev-only: the Guitar Builder on a seeded demo stash (default), or the
 * Arsenal Builder tab on fake data (`?mode=tab`). Not linked from any nav;
 * renders nothing outside development. Mirrors tone-studio-preview.tsx.
 */
export default function GuitarBuilderPage() {
  const router = useRouter();
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className='min-h-screen bg-zinc-950'>
      {router.query.mode === "tab" ? <TabPreview /> : <GuitarBuilderView />}
    </div>
  );
}
