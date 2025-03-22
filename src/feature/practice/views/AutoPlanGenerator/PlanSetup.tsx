import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Slider } from "assets/components/ui/slider";
import { useTranslation } from "react-i18next";

interface PlanSetupProps {
  time: number;
  setTime: (time: number) => void;
  onBack: () => void;
  onGenerate: () => void;
}

export const PlanSetup = ({
  time,
  setTime,
  onBack,
  onGenerate,
}: PlanSetupProps) => {
  const { t } = useTranslation(["exercises", "common"]);

  return (
    <div className='mx-auto max-w-2xl space-y-8 py-12 font-openSans'>
      <div className='text-center'>
        <h1 className='text-3xl font-bold'>{t("exercises:auto_plan.title")}</h1>
        <p className='mt-2 text-muted-foreground'>
          {t("exercises:auto_plan.description")}
        </p>
      </div>

      <Card className='p-6'>
        <div className='mb-6 space-y-4'>
          <h2 className='text-xl font-semibold'>
            {t("exercises:auto_plan.duration")}
          </h2>

          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='flex w-full flex-1 items-center gap-2'>
              <Button
                variant='outline'
                size='icon'
                className='h-9 w-9 flex-shrink-0'
                onClick={() => setTime(Math.max(15, time - 15))}
                disabled={time <= 15}>
                <span className='text-lg'>-</span>
              </Button>

              <div className='relative flex-1 py-4'>
                <Slider
                  value={[time]}
                  min={15}
                  max={120}
                  step={15}
                  onValueChange={(value) => setTime(value[0])}
                  className='h-2'
                />
              </div>

              <Button
                variant='outline'
                size='icon'
                className='h-9 w-9 flex-shrink-0'
                onClick={() => setTime(Math.min(120, time + 15))}
                disabled={time >= 120}>
                <span className='text-lg'>+</span>
              </Button>

              <div className='w-20 text-center font-medium'>
                {time} {t("common:min")}
              </div>
            </div>
          </div>
        </div>

        <div className='flex justify-end'>
          <div className='space-x-2'>
            <Button variant='outline' onClick={onBack}>
              {t("common:back")}
            </Button>
            <Button onClick={onGenerate}>
              {t("exercises:auto_plan.generate")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
