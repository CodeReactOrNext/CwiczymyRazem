import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import type { UseFormRegister } from "react-hook-form";
import { useTranslation } from "hooks/useTranslation";

import type { PlanDetailsFormData } from "../hooks/usePlanDetailsForm";

interface DescriptionFieldProps {
  register: UseFormRegister<PlanDetailsFormData>;
}

export const DescriptionField = ({ register }: DescriptionFieldProps) => {
  const { t } = useTranslation("exercises");

  return (
    <div className='space-y-2'>
      <Label htmlFor='description'>{t("plan.description")}</Label>
      <Textarea
        id='description'
        placeholder={t("plan.description_placeholder")}
        rows={4}
        {...register("description", { required: true })}
      />
      <p className='text-xs text-muted-foreground'>
        {t("plan.tips.good_description")}
      </p>
    </div>
  );
};
