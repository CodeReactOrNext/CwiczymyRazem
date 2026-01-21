import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import type { UseFormRegister } from "react-hook-form";
import { useTranslation } from "hooks/useTranslation";

import type { PlanDetailsFormData } from "../hooks/usePlanDetailsForm";

interface TitleFieldProps {
  register: UseFormRegister<PlanDetailsFormData>;
}

export const TitleField = ({ register }: TitleFieldProps) => {
  const { t } = useTranslation("exercises");

  return (
    <div className='space-y-2'>
      <Label htmlFor='title'>{t("plan.title")}</Label>
      <Input
        id='title'
        placeholder={t("plan.title_placeholder")}
        {...register("title", { required: true })}
      />
    </div>
  );
};
