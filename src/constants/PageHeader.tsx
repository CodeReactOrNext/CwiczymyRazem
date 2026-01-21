import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { FaArrowLeft } from "react-icons/fa";

interface PageHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
  backText?: string;
}

export const PageHeader = ({
  title,
  description,
  onBack,
  backText,
}: PageHeaderProps) => {
  const { t } = useTranslation("common");

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-white'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {title}
        </h1>
        {description && (
          <p className='mt-2 text-muted-foreground'>{description}</p>
        )}
      </div>
      {onBack && (
        <Button variant='outline' onClick={onBack} className='w-fit'>
          <FaArrowLeft className='mr-2 h-4 w-4' />
          {backText || t("back")}
        </Button>
      )}
    </div>
  );
};
