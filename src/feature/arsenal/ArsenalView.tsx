import { Skeleton } from "assets/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import MainContainer from "components/MainContainer";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import type { LucideIcon } from "lucide-react";
import { BookMarked, Guitar, Hammer, PackageOpen, Store, Swords, Users } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

// Ordered like the loop the module is built around: get gear, look at what you
// own, put it on the rig, improve it, then trade what is left over. Dex is the
// completionist view and sits at the end rather than between Workshop and Rig.
//
// The two markets are separate tabs rather than halves of one. They are shopped
// for different reasons — the counter is where you go to *fix* a shortage, with
// a stock that turns over daily, the listings are a browse — and burying either
// one behind a second row of tabs cost it a click and its own deep link.
const ARSENAL_TABS = [
  "cases",
  "collection",
  "rig",
  "workshop",
  "trader",
  "market",
  "dex",
] as const;
type ArsenalTab = (typeof ARSENAL_TABS)[number];

/** Flip to false to pull the Workshop tab (and its deep link) back out of the UI. */
const WORKSHOP_ENABLED: boolean = true;

/** Hidden tabs are also unreachable by URL, so `?tab=workshop` falls back to Cases. */
const isTabVisible = (tab: ArsenalTab): boolean => tab !== "workshop" || WORKSHOP_ENABLED;

const TAB_META: Record<ArsenalTab, { label: string; icon: LucideIcon }> = {
  cases: { label: "Cases", icon: PackageOpen },
  collection: { label: "Collection", icon: Swords },
  rig: { label: "Rig", icon: Guitar },
  workshop: { label: "Workshop", icon: Hammer },
  trader: { label: "Trader", icon: Store },
  market: { label: "Market", icon: Users },
  dex: { label: "Dex", icon: BookMarked },
};

import { CaseOpeningModal } from "./components/CaseOpeningModal/CaseOpeningModal";
import { CaseShop } from "./components/CaseShop/CaseShop";
import { CollectionTab } from "./components/Collection/CollectionTab";
import { DexView } from "./components/Dex/DexView";
import { MarketplaceView } from "./components/Marketplace/MarketplaceView";
import { RigView } from "./components/Rig/RigView";
import { arsenalTabTriggerClass } from "./components/tabTrigger";
import { TraderView } from "./components/Trader/TraderView";
import { WorkshopSkeleton } from "./components/Workshop/WorkshopSkeleton";
import { WorkshopTab } from "./components/Workshop/WorkshopTab";
import { CASE_DEFINITIONS } from "./data/caseDefinitions";
import { useArsenalData } from "./hooks/useArsenalData";
import { useOpenCase } from "./hooks/useOpenCase";
import type { CaseType, OpenCaseResult } from "./types/arsenal.types";

export const ArsenalView = () => {
  const { data, isLoading } = useArsenalData();
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;

  // Tab is URL-driven (?tab=market) so notifications/links can deep-link to it.
  const router = useRouter();
  const tabParam = router.query.tab;
  const activeTab: ArsenalTab =
    typeof tabParam === "string" &&
    ARSENAL_TABS.includes(tabParam as ArsenalTab) &&
    isTabVisible(tabParam as ArsenalTab)
      ? (tabParam as ArsenalTab)
      : "cases";

  const handleTabChange = (tab: string) => {
    router.replace({ query: { ...router.query, tab } }, undefined, { shallow: true });
  };

  const [openResult, setOpenResult] = useState<OpenCaseResult | null>(null);
  const [openedCaseType, setOpenedCaseType] = useState<CaseType | null>(null);
  const { mutate: openCase, isPending: isOpening } = useOpenCase();

  const handleOpenCase = (caseType: CaseType) => {
    setOpenedCaseType(caseType);
    openCase(caseType, {
      onSuccess: (result) => {
        setOpenResult(result);
      },
    });
  };

  return (
    <MainContainer noBorder>
      {/* The banner sits above every tab, so its subtitle describes the whole
          module — it used to describe only the case shop. */}
      <HeroBanner
        title="Guitar Arsenal"
        subtitle="Open cases, build your rig, keep your gear in shape"
        eyebrow="Collect & equip"
        className="w-full !rounded-none !shadow-none min-h-[200px] md:min-h-[180px] lg:min-h-[220px]"
        backgroundContent={<HeroPattern />}
        rightContent={
          // Fame is the only number that belongs to the whole module — it is
          // what every tab spends. Rig Level and the trait rate moved into the
          // Rig tab itself (`RigStatsPanel`): they are changed by moving gear,
          // so they read as stats of that screen rather than of the banner.
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
            <img src="/images/coin.png" alt="coin" className="h-6 w-6 object-contain" />
            <span className="text-xl font-black text-amber-400">{fame.toLocaleString()}</span>
            <span className="text-xs text-zinc-400">Fame Points</span>
          </div>
        }
      />

      <div className="p-4">
        <div className="flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-zinc-900 p-1 rounded-lg h-auto max-w-full justify-start overflow-x-auto no-scrollbar">
              {ARSENAL_TABS.filter(isTabVisible).map((tab) => {
                const { label, icon: Icon } = TAB_META[tab];
                const hasNewDrop =
                  tab === "collection" &&
                  !!data &&
                  (data.inventory.some((i) => i.isNew) ||
                    (data.effectInventory ?? []).some((i) => i.isNew));

                return (
                  <TabsTrigger key={tab} value={tab} className={arsenalTabTriggerClass}>
                    <Icon size={16} />
                    {/* On mobile only the active tab shows its label, so all tabs
                        stay visible at once; from sm up every label is shown. */}
                    <span className={activeTab === tab ? "inline" : "hidden sm:inline"}>
                      {label}
                    </span>
                    {hasNewDrop && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="cases" className="mt-6">
              <CaseShop
                currentFame={fame}
                onOpenCase={handleOpenCase}
                isOpening={isOpening}
                lastResult={openResult}
              />
            </TabsContent>

            <TabsContent value="collection" className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-lg bg-zinc-800/50" />
                  ))}
                </div>
              ) : data ? (
                <CollectionTab data={data} />
              ) : null}
            </TabsContent>

            {WORKSHOP_ENABLED && (
              <TabsContent value="workshop" className="mt-4">
                {/* Without the guard `getWorkshopEntries(undefined)` is empty and a
                    player with a full rack is told to "open a case first". */}
                {isLoading ? <WorkshopSkeleton /> : <WorkshopTab data={data} fame={fame} />}
              </TabsContent>
            )}

            <TabsContent value="dex" className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-lg bg-zinc-800/50" />
                  ))}
                </div>
              ) : data ? (
                <DexView data={data} />
              ) : null}
            </TabsContent>

            <TabsContent value="rig" className="mt-4">
              {data ? <RigView data={data} fame={fame} /> : null}
            </TabsContent>

            <TabsContent value="trader" className="mt-4">
              <TraderView />
            </TabsContent>

            <TabsContent value="market" className="mt-4">
              <MarketplaceView />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CaseOpeningModal
        result={openResult}
        caseDef={openedCaseType ? CASE_DEFINITIONS[openedCaseType] : undefined}
        onClose={() => { setOpenResult(null); setOpenedCaseType(null); }}
      />
    </MainContainer>
  );
};
