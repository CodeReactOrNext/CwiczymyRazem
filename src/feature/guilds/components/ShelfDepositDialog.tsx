import { StashItemDialog } from "feature/arsenal/components/Collection/StashItemDialog";
import { HonorMark } from "feature/guilds/components/HonorMark";
import type { ShelfDepositTarget } from "feature/guilds/hooks/useShelfDeposit";
import { useTranslation } from "hooks/useTranslation";

interface ShelfDepositDialogProps {
  /** Null while nothing is on its way. */
  target: ShelfDepositTarget | null;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * The moment before gear leaves the collection for the guild stash — the twin
 * of `HonorTakeCard`: what it earns, and that it is the guild's from then on.
 */
export const ShelfDepositDialog = ({
  target,
  busy,
  onConfirm,
  onCancel,
}: ShelfDepositDialogProps) => {
  const { t } = useTranslation("guilds");
  return (
    <StashItemDialog
      isOpen={target !== null}
      onClose={onCancel}
      title={target ? t("deposit.title", { name: target.name }) : ""}>
      {target && (
        <div className='flex flex-col gap-6 rounded-lg bg-zinc-900 p-6'>
          <div className='space-y-1'>
            <p className='text-[11px] font-semibold text-zinc-500'>
              {target.rarity} · {t("deposit.into_stash")}
            </p>
            <h3 className='text-xl font-black text-zinc-100'>{target.name}</h3>
          </div>

          <div>
            <p className='text-xs text-zinc-500'>{t("deposit.earns")}</p>
            <p className='mt-1 flex items-center gap-2 text-3xl font-black tabular-nums text-purple-300'>
              <HonorMark size={32} />+{target.honor}
            </p>
          </div>

          {/* Not priced here: what taking it back costs is the stash's rule to
            state, and it differs for the member who left it. */}
          <p className='text-xs leading-relaxed text-zinc-500'>
            {t("deposit.from_then_on")}
          </p>

          <button
            type='button'
            onClick={onConfirm}
            disabled={busy}
            className='rounded-lg bg-purple-500/15 px-4 py-3 text-sm font-bold text-purple-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 hover:bg-purple-500/25'>
            {busy ? t("deposit.leaving") : t("deposit.confirm")}
          </button>
        </div>
      )}
    </StashItemDialog>
  );
};
