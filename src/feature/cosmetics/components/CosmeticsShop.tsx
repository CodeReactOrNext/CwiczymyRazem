import { cn } from "assets/lib/utils";
import Avatar from "components/UI/Avatar";
import { AvatarDecoration } from "feature/cosmetics/components/AvatarDecoration";
import {
  bannerNeedsDarkCard,
  CosmeticBanner,
} from "feature/cosmetics/components/CosmeticBanner";
import { ShopItemCard } from "feature/cosmetics/components/ShopItemCard";
import {
  AVATAR_EFFECTS,
  BANNERS,
} from "feature/cosmetics/data/cosmeticsCatalog";
import {
  useBuyCosmetic,
  useCosmeticsState,
  useEquipCosmetic,
} from "feature/cosmetics/hooks/useCosmetics";
import type {
  Cosmetic,
  CosmeticKind,
} from "feature/cosmetics/types/cosmetics.types";
import { selectUserAvatar, selectUserName } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

interface CosmeticsShopProps {
  /** Which half of the counter: banners, or avatar effects. */
  slot: CosmeticKind;
  enabled: boolean;
  /** Tokens left in the wallet — the skin shop already holds it. */
  tokensLeft: number;
  /** Window shopping for somebody without the badge: prices, no buttons. */
  preview?: boolean;
}

/** Translation keys cannot carry the id's colon. */
const nameKey = (id: string) => `shop.cosmetics.names.${id.replace(":", "_")}`;

/**
 * The activity-feed half of the supporter shop: banners behind your posts and
 * decorations round your avatar.
 *
 * Every card previews the piece on the player's own name and avatar, because
 * "how will it look on me" is the only question a cosmetic has to answer. Cut
 * to the skin cards' cloth — price under the name, two presses to buy, since
 * tokens are bought with real money.
 */
export const CosmeticsShop = ({
  slot,
  enabled,
  tokensLeft,
  preview = false,
}: CosmeticsShopProps) => {
  const { t } = useTranslation("supporter");
  const { data: wardrobe } = useCosmeticsState(enabled);
  const { mutate: buy, isPending: isBuying } = useBuyCosmetic();
  const { mutate: equip, isPending: isEquipping } = useEquipCosmetic();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const userName =
    useAppSelector(selectUserName) || t("shop.cosmetics.preview_name");
  const avatarUrl = useAppSelector(selectUserAvatar) ?? undefined;
  const busy = isBuying || isEquipping || !wardrobe;

  const labels = {
    buy: t("shop.buy"),
    confirm: t("shop.cosmetics.confirm"),
    owned: t("shop.cosmetics.owned"),
    worn: t("shop.cosmetics.wearing"),
    wear: t("shop.cosmetics.wear"),
    takeOff: t("shop.cosmetics.take_off"),
    notEnough: t("shop.cosmetics.not_enough"),
  };

  const card = (item: Cosmetic, art: ReactNode) => {
    const name = t(nameKey(item.id));
    const worn = wardrobe?.equipped[item.kind] === item.id;

    return (
      <ShopItemCard
        key={item.id}
        art={art}
        name={name}
        price={item.price}
        owned={!!wardrobe?.owned.includes(item.id)}
        worn={worn}
        canAfford={tokensLeft >= item.price}
        confirming={confirmingId === item.id}
        busy={busy}
        preview={preview}
        labels={labels}
        onAskBuy={() => setConfirmingId(item.id)}
        onBuy={() =>
          buy(
            { itemId: item.id, name },
            { onSettled: () => setConfirmingId(null) },
          )
        }
        onToggleWear={() =>
          equip({ slot: item.kind, itemId: worn ? null : item.id })
        }
      />
    );
  };

  const section = (
    title: string,
    body: string,
    columns: string,
    cards: ReactNode,
  ) => (
    <section className='flex flex-col gap-5'>
      <div>
        <h3 className='text-base font-bold text-zinc-100'>{title}</h3>
        <p className='mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {body}
        </p>
      </div>
      <div className={`grid gap-4 ${columns}`}>{cards}</div>
    </section>
  );

  if (slot === "banner")
    return section(
      t("shop.cosmetics.banners"),
      `${t("shop.cosmetics.banners_hint")} ${t("shop.cosmetics.intro")}`,
      "md:grid-cols-2 xl:grid-cols-3",
      BANNERS.map((item) =>
        card(
          item,
          // The same card the feed draws, at the feed's own proportions.
          <div
            className={cn(
              "relative overflow-hidden rounded-xl px-4 py-4",
              bannerNeedsDarkCard(item)
                ? "force-dark bg-zinc-900"
                : "bg-zinc-900/60",
            )}>
            <CosmeticBanner item={item} />
            <div className='relative z-10 flex flex-col gap-3'>
              <div className='flex min-w-0 items-center gap-2.5'>
                <Avatar size='sm' name={userName} avatarURL={avatarUrl} />
                <span className='truncate text-[15px] font-semibold text-zinc-100'>
                  {userName}
                </span>
                <span className='shrink-0 text-xs text-zinc-400'>
                  {t("shop.cosmetics.preview_time")}
                </span>
              </div>
              <span className='text-sm text-zinc-200'>
                {t("shop.cosmetics.preview_line")}
              </span>
            </div>
          </div>,
        ),
      ),
    );

  return section(
    t("shop.cosmetics.avatars"),
    t("shop.cosmetics.avatars_hint"),
    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    AVATAR_EFFECTS.map((item) =>
      card(
        item,
        <div className='flex h-36 items-center justify-center rounded-lg bg-zinc-800/40'>
          <AvatarDecoration item={item}>
            <Avatar size='xl' name={userName} avatarURL={avatarUrl} />
          </AvatarDecoration>
        </div>,
      ),
    ),
  );
};
