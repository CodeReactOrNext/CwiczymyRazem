import { Skeleton } from "assets/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import {
  tabNavListClass,
  tabNavTriggerClass,
} from "components/PageTabs/tabNav";
import { CableStrand, Plug } from "feature/arsenal/components/Rig/SignalCable";
import type {
  BoardSkin,
  BoardSkinState,
  CableSkin,
} from "feature/arsenal/data/boardSkins";
import {
  BOARD_SKINS,
  CABLE_SKINS,
  EMPTY_BOARD_SKINS,
  PLUG_METAL_STOPS,
  PLUG_METALS,
} from "feature/arsenal/data/boardSkins";
import { boardLookArt } from "feature/arsenal/utils/boardSkinArt";
import { CosmeticsShop } from "feature/cosmetics/components/CosmeticsShop";
import { ShopItemCard } from "feature/cosmetics/components/ShopItemCard";
import { RackShelf } from "feature/supporterPanel/components/RackShelf";
import { useBoardSkinShop } from "feature/supporterPanel/hooks/useBoardSkinShop";
import { useTranslation } from "hooks/useTranslation";
import {
  Cable,
  CircleUser,
  Guitar,
  Image as ImageIcon,
  LayoutPanelTop,
} from "lucide-react";
import { useId, useMemo, useState } from "react";

/** The shop's shelves, in tab order. Labels are keys in `supporter:shop.tabs`. */
const SHELVES = [
  { id: "banners", icon: ImageIcon },
  { id: "avatars", icon: CircleUser },
  { id: "racks", icon: Guitar },
  { id: "boards", icon: LayoutPanelTop },
  { id: "cables", icon: Cable },
] as const;

/** The bay every board is previewed at: the bottom-rung case, rail and deck. */
const PREVIEW_BAY = { w: 160, h: 79.4, step: 44.4 };

/** A length of the cable hanging between two plugs, on a bare deck. */
const CablePreview = ({ skin }: { skin: CableSkin }) => {
  const metal = `${useId()}-metal`;
  const run = "M 6 8 L 10.5 8 Q 24 15 37.5 8 L 42 8";

  return (
    <svg
      viewBox='0 0 48 20'
      className='force-dark block w-full rounded-lg bg-[#141414]'
      aria-hidden>
      <defs>
        <linearGradient id={metal} x1='0' y1='0' x2='0' y2='1'>
          {PLUG_METALS[skin.metal].map((color, index) => (
            <stop
              key={index}
              offset={`${PLUG_METAL_STOPS[index]}%`}
              stopColor={color}
            />
          ))}
        </linearGradient>
      </defs>
      <g fill='none' strokeLinecap='round' strokeLinejoin='round'>
        <path
          d={run}
          stroke='#000000'
          strokeWidth={2.8}
          opacity={0.5}
          transform='translate(0 0.75)'
        />
        <CableStrand d={run} paint={skin.paint} />
      </g>
      <Plug
        at={{ x: 6, y: 8 }}
        spin={180}
        metal={`url(#${metal})`}
        boot={skin.boot}
        lightBoot={skin.lightBoot}
      />
      <Plug
        at={{ x: 42, y: 8 }}
        spin={0}
        metal={`url(#${metal})`}
        boot={skin.boot}
        lightBoot={skin.lightBoot}
      />
    </svg>
  );
};

/** The board on its own, with nothing standing on it. */
const BoardPreview = ({ skin }: { skin: BoardSkin }) => {
  const uid = useId();
  const art = useMemo(
    () =>
      boardLookArt(
        skin.look,
        uid,
        PREVIEW_BAY.w,
        PREVIEW_BAY.h,
        PREVIEW_BAY.step,
      ),
    [skin.look, uid],
  );

  return (
    <svg
      viewBox={`-4 -3 ${art.width + 8} ${art.height + 10}`}
      className='block w-full'
      aria-hidden
      dangerouslySetInnerHTML={{ __html: art.markup }}
    />
  );
};

/**
 * The skin shop: display cases for the guitar wall, cables and boards for the
 * pedalboard, bought with tokens.
 *
 * Buying takes two presses, because tokens are bought with real money and a
 * card grid is an easy place to press the wrong one. The second press is the
 * same button, now carrying the price.
 *
 * Without the badge (`enabled` off) it is a shop window: the same shelves and
 * prices, nothing fetched and no buttons.
 */
export const SkinShopTab = ({ enabled }: { enabled: boolean }) => {
  const { t } = useTranslation("supporter");
  const { shop, buy, wear } = useBoardSkinShop(enabled);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const preview = !enabled;

  if (!preview && shop.isLoading) {
    return <Skeleton variant='block' className='h-72' aria-busy />;
  }
  if (!preview && !shop.data) {
    return (
      <p className='rounded-lg bg-zinc-800/40 p-6 text-sm text-zinc-400'>
        {t("shop.load_failed")}
      </p>
    );
  }

  const state: BoardSkinState = shop.data?.boardSkins ?? EMPTY_BOARD_SKINS;
  const tokensLeft = shop.data?.wallet.left ?? 0;
  const busy = buy.isPending || wear.isPending;
  const labels = {
    buy: t("shop.buy"),
    confirm: t("shop.confirm"),
    owned: t("shop.owned"),
    worn: t("shop.in_use"),
    wear: t("shop.put_on"),
    takeOff: t("shop.take_off"),
    notEnough: t("shop.not_enough"),
  };

  const section = (
    title: string,
    body: string,
    skins: (CableSkin | BoardSkin)[],
    columns: string,
  ) => (
    <section className='flex flex-col gap-5'>
      <div>
        <h3 className='text-base font-bold text-zinc-100'>{title}</h3>
        <p className='mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400'>
          {body}
        </p>
      </div>
      <div className={`grid gap-4 ${columns}`}>
        {skins.map((skin) => (
          <ShopItemCard
            key={skin.id}
            art={
              skin.kind === "cable" ? (
                <CablePreview skin={skin} />
              ) : (
                <BoardPreview skin={skin} />
              )
            }
            name={skin.name}
            price={skin.price}
            owned={state.owned.includes(skin.id)}
            worn={state[skin.kind] === skin.id}
            canAfford={tokensLeft >= skin.price}
            confirming={confirmingId === skin.id}
            busy={busy}
            preview={preview}
            labels={labels}
            onAskBuy={() => setConfirmingId(skin.id)}
            onBuy={() =>
              buy.mutate(
                { skin },
                { onSettled: () => setConfirmingId(null) },
              )
            }
            onToggleWear={() =>
              wear.mutate({
                kind: skin.kind,
                skinId: state[skin.kind] === skin.id ? null : skin.id,
              })
            }
          />
        ))}
      </div>
    </section>
  );

  // One shelf at a time. Activity-feed looks first: everyone sees them, the
  // board only its owner.
  return (
    <Tabs defaultValue='banners' className='flex flex-col gap-8'>
      <TabsList className={tabNavListClass}>
        {SHELVES.map(({ id, icon: Icon }) => (
          <TabsTrigger key={id} value={id} className={tabNavTriggerClass}>
            <Icon size={16} className='shrink-0' />
            {t(`shop.tabs.${id}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value='banners' className='mt-0'>
        <CosmeticsShop
          slot='banner'
          enabled={enabled}
          tokensLeft={tokensLeft}
          preview={preview}
        />
      </TabsContent>
      <TabsContent value='avatars' className='mt-0'>
        <CosmeticsShop
          slot='avatar'
          enabled={enabled}
          tokensLeft={tokensLeft}
          preview={preview}
        />
      </TabsContent>
      <TabsContent value='racks' className='mt-0'>
        <RackShelf
          state={state}
          tokensLeft={tokensLeft}
          preview={preview}
          labels={labels}
          buy={buy}
          wear={wear}
        />
      </TabsContent>
      <TabsContent value='boards' className='mt-0'>
        {section(
          t("shop.boards_title"),
          t("shop.boards_body"),
          BOARD_SKINS,
          "sm:grid-cols-2 xl:grid-cols-3",
        )}
      </TabsContent>
      <TabsContent value='cables' className='mt-0'>
        {section(
          t("shop.cables_title"),
          t("shop.cables_body"),
          CABLE_SKINS,
          "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
        )}
      </TabsContent>
    </Tabs>
  );
};
