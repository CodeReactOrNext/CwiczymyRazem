import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import {
  SUPPORTER_WELCOME_TOKENS,
  TOKENS_PER_DOLLAR,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { useTranslation } from "hooks/useTranslation";
import { Heart } from "lucide-react";

/**
 * What stands above the shelves for somebody window-shopping without the badge.
 *
 * The prices under it are a token icon and a number, and to a visitor that
 * reads as points earned by practising. So this says the three things a price
 * alone cannot: tokens are something you hold (the empty wallet), they come
 * with a donation and at what rate, and where to get them — the same ask as on
 * the first tab, not a "buy" button.
 */
export const ShopWindowBank = () => {
  const { t } = useTranslation("supporter");

  return (
    <div className='relative flex flex-col gap-5 overflow-hidden rounded-lg bg-zinc-800/40 p-6 md:flex-row md:items-center md:gap-8 md:px-7'>
      <div className='light-tint pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent' />

      <div className='relative flex shrink-0 items-center gap-3'>
        <SupportToken size={44} />
        <div>
          <p className='text-[28px] font-bold tabular-nums leading-none text-amber-300'>
            0
          </p>
          <p className='mt-1 text-xs text-zinc-400'>
            {t("panel.pitch.shop_wallet")}
          </p>
        </div>
      </div>

      <div className='relative min-w-0 flex-1'>
        <h2 className='text-[17px] font-bold text-zinc-100'>
          {t("panel.pitch.shop_title")}
        </h2>
        <p className='mt-1 max-w-[56ch] text-sm leading-relaxed text-zinc-300'>
          {t("panel.pitch.shop_body", {
            rate: TOKENS_PER_DOLLAR,
            welcome: SUPPORTER_WELCOME_TOKENS,
          })}
        </p>
      </div>

      <Button asChild size='lg' className='relative shrink-0'>
        <a href={BMC_URL} target='_blank' rel='noreferrer'>
          <Heart size={16} fill='currentColor' />
          {t("panel.pitch.support")}
        </a>
      </Button>
    </div>
  );
};
