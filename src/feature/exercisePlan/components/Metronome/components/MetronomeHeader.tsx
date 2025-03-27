import { Button } from "assets/components/ui/button";
import { useTranslation } from "react-i18next";
import { FaMagic } from "react-icons/fa";

interface MetronomeHeaderProps {
  onRecommendedBpmClick: () => void;
}

export const MetronomeHeader = ({
  onRecommendedBpmClick,
}: MetronomeHeaderProps) => {
  const { t } = useTranslation("exercises");

  return (
    <div className='border-b border-border/50 bg-muted/5 p-3'>
      <div className='flex items-center justify-between'>
        <h3 className='text-sm font-medium'>
          {t("practice_session.metronome")}
        </h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={onRecommendedBpmClick}
          className='h-8 px-2'
          aria-label='Set recommended tempo'>
          <FaMagic className='mr-1 h-3 w-3' />
          <span className='text-xs'>{t("metronome.recommended_tempo")}</span>
        </Button>
      </div>
    </div>
  );
};
