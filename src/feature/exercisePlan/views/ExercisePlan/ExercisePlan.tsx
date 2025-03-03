import { Card } from "assets/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { ExercisePlan as ExercisePlanType } from "../../types/exercise.types";
import { ExerciseLibrary } from "../ExerciseLibrary/ExerciseLibrary";
import { MyPlans } from "../MyPlans/MyPlans";
import { PracticeSession } from "../PracticeSession/PracticeSession";

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
    <div className='container mx-auto py-6 font-openSans'>
      <Card className='p-6'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='my_plans'>{t("tabs.my_plans")}</TabsTrigger>
            <TabsTrigger value='library'>{t("tabs.library")}</TabsTrigger>
          </TabsList>

          <div className='mt-6'>
            <TabsContent value='library'>
              <ExerciseLibrary onPlanSelect={handlePlanSelect} />
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
      </Card>
    </div>
  );
};
