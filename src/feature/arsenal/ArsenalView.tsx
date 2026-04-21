import { Tabs, TabsContent, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import { Skeleton } from "assets/components/ui/skeleton";
import MainContainer from "components/MainContainer";
import { HeroBanner } from "components/UI/HeroBanner";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useArsenalData } from "./hooks/useArsenalData";
import { useOpenCase } from "./hooks/useOpenCase";
import { useAppSelector } from "store/hooks";
import { useState } from "react";
import { FaGem } from "react-icons/fa";
import { PackageOpen, Swords, Guitar } from "lucide-react";
import { CaseShop } from "./components/CaseShop/CaseShop";
import { GuitarInventory } from "./components/GuitarInventory/GuitarInventory";
import { EffectCollection } from "./components/GuitarInventory/EffectCollection";
import { RigView } from "./components/Rig/RigView";
import { CaseOpeningModal } from "./components/CaseOpeningModal/CaseOpeningModal";
import type { CaseType, OpenCaseResult } from "./types/arsenal.types";
import { CASE_DEFINITIONS } from "./data/caseDefinitions";

export const ArsenalView = () => {
  const { data, isLoading } = useArsenalData();
  const userStats = useAppSelector(selectCurrentUserStats);
  const fame = userStats?.fame || 0;

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
        rightContent={
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
            <FaGem className="text-amber-500" size={16} />
            <span className="text-xl font-black text-amber-400">{fame.toLocaleString()}</span>
            <span className="text-xs text-zinc-400">Fame Points</span>
          </div>
        }
      />

      <div className="p-4">
        <div className="font-openSans flex flex-col gap-6">
          <Tabs defaultValue="cases" className="w-full">
            <TabsList className="bg-zinc-900 p-1 rounded-lg w-fit border border-white/5 h-auto">
              <TabsTrigger 
                value="cases" 
                className="gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <PackageOpen size={16} />
                Cases
              </TabsTrigger>
              <TabsTrigger 
                value="collection" 
                className="gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <Swords size={16} />
                Collection
                {data && data.inventory.some((i) => i.isNew) && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="rig" 
                className="gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 hover:text-zinc-300"
              >
                <Guitar size={16} />
                Rig
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-xl bg-zinc-800/50" />
                  ))}
                </div>
              ) : data ? (
                <>
                  <GuitarInventory data={data} />
                  <EffectCollection data={data} />
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="rig" className="mt-4">
              {data ? <RigView data={data} /> : null}
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
