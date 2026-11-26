import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { useTranslation } from "hooks/useTranslation";

interface SellConfirmDialogProps {
  isOpen: boolean;
  /** What is being sold. Stash clutter — mods and loose parts — sells here too. */
  itemType: "Guitar" | "Effect" | "Mod" | "Parts" | "Part" | "Imprint" | "Extractor";
  itemName: string;
  fameReward: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SellConfirmDialog = ({
  isOpen,
  itemType,
  itemName,
  fameReward,
  onConfirm,
  onCancel,
  isLoading,
}: SellConfirmDialogProps) => {
  const { t } = useTranslation("arsenal");

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      title={t(`sell.title.${itemType}`)}
      description={itemName}
      cancelLabel={t("common.cancel")}
      confirmLabel={isLoading ? t("common.selling") : t("common.confirm")}
      onConfirm={onConfirm}
      destructive
      loading={isLoading}>
      <div className='flex flex-col items-center gap-1 text-center'>
        <p className='text-xs text-zinc-400'>{t("sell.you_receive")}</p>
        <div className='flex items-center justify-center gap-2'>
          <img
            src='/images/tokens/coin.png'
            alt='coin'
            className='h-4 w-4 object-contain'
          />
          <span className='text-2xl font-bold text-amber-400'>
            {fameReward}
          </span>
          <span className='text-xs text-zinc-400'>{t("sell.fame_points")}</span>
        </div>
      </div>
    </ConfirmDialog>
  );
};
