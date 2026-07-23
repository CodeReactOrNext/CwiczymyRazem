import { Skeleton } from "assets/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import MainContainer from "components/MainContainer";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { BookMarked,Guitar,PackageOpen, Store,Swords } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

const ARSENAL_TABS = ["cases", "collection", "dex", "rig", "market"] as const;
type ArsenalTab = (typeof ARSENAL_TABS)[number];

import { CaseOpeningModal } from "./components/CaseOpeningModal/CaseOpeningModal";
import { CaseShop } from "./components/CaseShop/CaseShop";
import { DexView } from "./components/Dex/DexView";
import { EffectCollection } from "./components/GuitarInventory/EffectCollection";
import { GuitarInventory } from "./components/GuitarInventory/GuitarInventory";
import { MarketplaceView } from "./components/Marketplace/MarketplaceView";
import { RigView } from "./components/Rig/RigView";
import { CASE_DEFINITIONS } from "./data/caseDefinitions";
import { getRigLevel } from "./data/rigLevel";
import { useArsenalData } from "./hooks/useArsenalData";
import { useOpenCase } from "./hooks/useOpenCase";
import type { CaseType, OpenCaseResult } from "./types/arsenal.types";

export const ArsenalView = () => {
  const { data, isLoading } = useArsenalData();
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;
  const rigLevel = getRigLevel(data);

  // Tab is URL-driven (?tab=market) so notifications/links can deep-link to it.
  const router = useRouter();
  const tabParam = router.query.tab;
  const activeTab: ArsenalTab =
    typeof tabParam === "string" && ARSENAL_TABS.includes(tabParam as ArsenalTab)
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
      <HeroBanner
        title="Guitar Arsenal"
        subtitle="Spend your Fame Points to unlock rare guitars"
        eyebrow="Collect & equip"
        className="w-full !rounded-none !shadow-none min-h-[200px] md:min-h-[180px] lg:min-h-[220px]"
        backgroundContent={<HeroPattern />}
        rightContent={
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
              <img src="/images/coin.png" alt="coin" className="h-6 w-6 object-contain" />
              <span className="text-xl font-black text-amber-400">{fame.toLocaleString()}</span>
              <span className="text-xs text-zinc-400">Fame Points</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-4 py-2">
              <Swords size={16} className="text-cyan-400" />
              <span className="text-lg font-black text-cyan-300 tabular-nums">{rigLevel}</span>
              <span className="text-xs text-zinc-400">Rig Level</span>
            </div>
          </div>
        }
      />

      <div className="p-4">
        <div className="flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="bg-zinc-900 p-1 rounded-lg h-auto max-w-full justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger
                value="cases"
                className="shrink-0 gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <PackageOpen size={16} />
                {/* On mobile only the active tab shows its label, so all tabs
                    stay visible at once; from sm up every label is shown. */}
                <span className={activeTab === "cases" ? "inline" : "hidden sm:inline"}>Cases</span>
              </TabsTrigger>
              <TabsTrigger
                value="collection"
                className="shrink-0 gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <Swords size={16} />
                <span className={activeTab === "collection" ? "inline" : "hidden sm:inline"}>Collection</span>
                {data && data.inventory.some((i) => i.isNew) && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="dex"
                className="shrink-0 gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <BookMarked size={16} />
                <span className={activeTab === "dex" ? "inline" : "hidden sm:inline"}>Dex</span>
              </TabsTrigger>
              <TabsTrigger
                value="rig"
                className="shrink-0 gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <Guitar size={16} />
                <span className={activeTab === "rig" ? "inline" : "hidden sm:inline"}>Rig</span>
              </TabsTrigger>
              <TabsTrigger
                value="market"
                className="shrink-0 gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <Store size={16} />
                <span className={activeTab === "market" ? "inline" : "hidden sm:inline"}>Market</span>
              </TabsTrigger>
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
                <>
                  <GuitarInventory data={data} />
                  <EffectCollection data={data} />
                </>
              ) : null}
            </TabsContent>

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
              {data ? <RigView data={data} /> : null}
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
