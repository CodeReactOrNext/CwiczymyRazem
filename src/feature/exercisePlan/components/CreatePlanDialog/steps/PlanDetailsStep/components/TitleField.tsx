import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import type { FieldError, UseFormRegister } from "react-hook-form";

import type { PlanDetailsFormData } from "../hooks/usePlanDetailsForm";

interface TitleFieldProps {
  register: UseFormRegister<PlanDetailsFormData>;
  error?: FieldError;
}

export const TitleField = ({ register, error }: TitleFieldProps) => {
  const { t } = useTranslation(["exercises", "plans"]);

  return (
    <div className='space-y-2'>
      <Label htmlFor='title' className={cn(error && "text-red-400")}>
        {t("plan.title")}
      </Label>
      <Input
        id='title'
        placeholder={t("plan.title_placeholder")}
        aria-invalid={!!error}
        aria-describedby={error ? "title-error" : undefined}
        // Keeps the field clear of the sticky header when a failed submit focuses it.
        className={cn(
          "scroll-mt-32",
          error && "border-red-500/60 focus-visible:ring-red-500/60",
        )}
        {...register("title", {
          validate: (value) =>
            value.trim().length > 0 || t("plans:details.name_required"),
        })}
      />
      {error?.message && (
        <p id='title-error' className='text-xs font-medium text-red-400'>
          {error.message}
        </p>
      )}
    </div>
  );
};
