import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ExercisePlan as ExercisePlanType } from "../types/exercise.types";
import { PracticeSession } from "../views/PracticeSession/PracticeSession";
import { ExerciseLibrary } from "./ExerciseLibrary";
import { MyPlans } from "./MyPlans";

export const ExercisePlan = () => {
  const { t } = useTranslation("exercises");
  const [selectedPlan, setSelectedPlan] = useState<ExercisePlanType | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("my_plans");

  const handlePlanSelect = (plan: ExercisePlanType) => {
    setSelectedPlan(plan);
    setActiveTab("practice");
  };

  return (
    <div className='container mx-auto px-4 py-8 font-openSans'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-2 md:grid-cols-3'>
          <TabsTrigger value='my_plans' className='text-xs sm:text-sm'>
            {t("tabs.my_plans")}
          </TabsTrigger>
          <TabsTrigger value='library' className='text-xs sm:text-sm'>
            {t("tabs.library")}
          </TabsTrigger>
        </TabsList>

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
                onFinish={() => {
                  setSelectedPlan(null);
                  setActiveTab("my_plans");
                }}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
