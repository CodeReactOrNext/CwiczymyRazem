import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

import type { ExercisePlan as ExercisePlanType } from "../types/exercise.types";
import { PracticeSession } from "../views/PracticeSession/PracticeSession";
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

  const handleClose = () => {
    setSelectedPlan(null);
    setActiveTab("my_plans");
  };

  return (
    <div className='container mx-auto md:py-8 font-openSans'>


      <div className='mt-4 sm:mt-6'>
        {activeTab === "practice" && selectedPlan ? (
          <PracticeSession
            plan={selectedPlan}
            onFinish={handleFinish}
            onClose={handleClose}
          />
        ) : (
          <MyPlans onPlanSelect={handlePlanSelect} />
        )}
      </div>
    </div>
  );
};
