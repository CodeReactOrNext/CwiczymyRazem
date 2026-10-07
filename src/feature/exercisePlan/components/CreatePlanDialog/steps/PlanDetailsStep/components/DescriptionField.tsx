import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { useTranslation } from "hooks/useTranslation";
import type { UseFormRegister } from "react-hook-form";

import type { PlanDetailsFormData } from "../hooks/usePlanDetailsForm";

interface DescriptionFieldProps {
  register: UseFormRegister<PlanDetailsFormData>;
}

export const DescriptionField = ({ register }: DescriptionFieldProps) => {
  const { t } = useTranslation(["exercises", "plans"]);

  return (
    <div className='space-y-2'>
      <Label htmlFor='description'>
        {t("plan.description")}{" "}
        <span className='font-normal text-zinc-500'>{t("plans:optional")}</span>
      </Label>
      <Textarea
        id='description'
        placeholder={t("plan.description_placeholder")}
        rows={4}
        {...register("description")}
      />
      <p className='text-xs text-muted-foreground'>
        {t("plan.tips.good_description")}
      </p>
    </div>
  );
};
