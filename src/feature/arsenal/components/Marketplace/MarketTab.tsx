import { Tabs, TabsContent, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import { Store, Users } from "lucide-react";

import { arsenalSubTabTriggerClass } from "../tabTrigger";
import { TraderView } from "../Trader/TraderView";
import { MarketplaceView } from "./MarketplaceView";

/**
 * Both markets under one tab: the system's counter, which sells parts and one
 * rolled instrument a day, and the player-to-player listings. They are siblings —
 * the trader sets the ceiling price, players undercut it — so they belong side by
 * side rather than on separate tabs.
 */
export const MarketTab = () => (
  <Tabs defaultValue='trader' className='w-full'>
    {/* Quieter than the module's own tabs — two identical-looking tab rows made
        it impossible to tell which level you were switching. */}
    <TabsList className='h-auto max-w-full justify-start rounded-lg bg-zinc-900/40 p-1'>
      <TabsTrigger value='trader' className={arsenalSubTabTriggerClass}>
        <Store size={16} />
        Trader
      </TabsTrigger>
      <TabsTrigger value='players' className={arsenalSubTabTriggerClass}>
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
