import { Tabs, TabsContent, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import { Store, Users } from "lucide-react";

import { TraderView } from "../Trader/TraderView";
import { MarketplaceView } from "./MarketplaceView";

const TRIGGER_CLASS =
  "shrink-0 gap-2 px-4 py-2 rounded-lg text-sm font-bold text-zinc-400 transition-all hover:text-zinc-300 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:hover:bg-zinc-200";

/**
 * Both markets under one tab: the system's counter, which sells parts and one
 * rolled instrument a day, and the player-to-player listings. They are siblings —
 * the trader sets the ceiling price, players undercut it — so they belong side by
 * side rather than on separate tabs.
 */
export const MarketTab = () => (
  <Tabs defaultValue='trader' className='w-full'>
    <TabsList className='h-auto max-w-full justify-start rounded-lg bg-zinc-900 p-1'>
      <TabsTrigger value='trader' className={TRIGGER_CLASS}>
        <Store size={16} />
        Trader
      </TabsTrigger>
      <TabsTrigger value='players' className={TRIGGER_CLASS}>
        <Users size={16} />
        Player listings
      </TabsTrigger>
    </TabsList>

    <TabsContent value='trader' className='mt-6'>
      <TraderView />
    </TabsContent>

    <TabsContent value='players' className='mt-6'>
      <MarketplaceView />
    </TabsContent>
  </Tabs>
);
