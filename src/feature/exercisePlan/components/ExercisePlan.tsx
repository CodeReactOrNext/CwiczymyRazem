import { Button } from "assets/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "hooks/useTranslation";

import type { ExercisePlan as ExercisePlanType } from "../types/exercise.types";
import { PracticeSession } from "../views/PracticeSession/PracticeSession";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { MyPlans } from "./MyPlans";

export const ExercisePlan = () => {
  const { t } = useTranslation("exercises");
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlanType | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("my_plans");

  const handlePlanSelect = (plan: ExercisePlanType) => {
    setSelectedPlan(plan);
    setActiveTab("practice");
  };

  const handleFinish = () => {
    router.push("/report");
  };

  return (
    <div className='container mx-auto px-4 py-8 font-openSans'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <TabsList className='grid w-full grid-cols-2 md:w-[400px]'>
            <TabsTrigger value='my_plans' className='text-xs sm:text-sm'>
              {t("tabs.my_plans")}
            </TabsTrigger>
            <TabsTrigger value='library' className='text-xs sm:text-sm'>
              {t("tabs.library")}
            </TabsTrigger>
          </TabsList>

          {activeTab !== "practice" && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 gap-1.5 px-3 bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-cyan-400 transition-all rounded-md self-start md:self-auto"
            >
              <Link href="/guide?tab=plans">
                <HelpCircle size={14} strokeWidth={2.5} />
                <span className="text-[11px] font-black uppercase tracking-wider">How to manage plans?</span>
              </Link>
            </Button>
          )}
        </div>

        <div className='mt-4 sm:mt-6'>
          <TabsContent value='library'>
            <ExerciseLibrary />
          </TabsContent>

          <TabsContent value='my_plans'>
            <MyPlans onPlanSelect={handlePlanSelect} />
          </TabsContent>

          <TabsContent value='practice'>
            {selectedPlan && (
              <PracticeSession
                plan={selectedPlan}
                onFinish={handleFinish}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
