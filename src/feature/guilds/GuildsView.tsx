import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import Chat from "feature/chat/Chat";
import { guildChatPath } from "feature/chat/services/chatService";
import { GuildBanner } from "feature/guilds/components/GuildBanner";
import { GuildBrowser } from "feature/guilds/components/GuildBrowser";
import { GuildCosmeticsTab } from "feature/guilds/components/GuildCosmeticsTab";
import { GuildCover } from "feature/guilds/components/GuildCover";
import { GuildMembersTab } from "feature/guilds/components/GuildMembersTab";
import { GuildQuestsTab } from "feature/guilds/components/GuildQuestsTab";
import { GuildStashTab } from "feature/guilds/components/GuildStashTab";
import { GuildUpgradesTab } from "feature/guilds/components/GuildUpgradesTab";
import { useGuilds } from "feature/guilds/hooks/useGuilds";
import type { Guild } from "feature/guilds/types/guild.types";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Coins,
  Lock,
  MessageSquare,
  Palette,
  Shield,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";

type GuildTab =
  | "browse"
  | "members"
  | "chat"
  | "stash"
  | "quests"
  | "upgrades"
  | "kit";

const TABS: {
  id: GuildTab;
  label: string;
  icon: LucideIcon;
  /** Means nothing from outside a guild — worn with a lock until you are in one. */
  needsGuild: boolean;
  /**
   * Nobody else has anything to do there, so it is left out of the strip
   * entirely rather than shown with a lock: a lock says "not yet", and for a
   * member who is not the founder this one never opens.
   */
  foundersOnly?: boolean;
}[] = [
  { id: "browse", label: "Guilds", icon: Shield, needsGuild: false },
  { id: "members", label: "Members", icon: Users, needsGuild: true },
  { id: "chat", label: "Chat", icon: MessageSquare, needsGuild: true },
  { id: "stash", label: "Stash", icon: Boxes, needsGuild: true },
  { id: "quests", label: "Quests", icon: Target, needsGuild: true },
  { id: "upgrades", label: "Upgrades", icon: Coins, needsGuild: true },
  {
    id: "kit",
    label: "Kit",
    icon: Palette,
    needsGuild: true,
    foundersOnly: true,
  },
];

/**
 * The module's own navigation, drawn the way the Arsenal draws its own — one
 * white pill on a dark strip. Two top-level tab bars that disagree read as two
 * different apps.
 */
const tabTriggerClass =
  "shrink-0 gap-2 rounded-lg px-3 py-2 text-sm font-bold text-zinc-400 transition-colors hover:text-zinc-200 data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-none data-[state=active]:hover:bg-zinc-200 sm:px-4";

/** Shown on the tabs that only mean anything from inside a guild. */
const NeedsAGuild = ({
  what,
  onBrowse,
}: {
  what: string;
  onBrowse: () => void;
}) => (
  <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
    <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
      <Shield size={26} />
    </span>
    <h3 className='mb-2 text-lg font-bold text-zinc-100'>Join a guild first</h3>
    <p className='max-w-sm text-sm text-zinc-400'>{what}</p>
    <button
      type='button'
      onClick={onBrowse}
      className='mt-6 rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/10 hover:text-zinc-100'>
      See the guilds
    </button>
  </div>
);

/**
 * The top of the page for a member: the guild's own card, at full size — its
 * banner across the top with the level ring in its corner, the crest hanging
 * off it, and the seats taken beside the name.
 */
const GuildHeader = ({ guild }: { guild: Guild }) => (
  <GuildCover
    guild={guild}
    size='lg'
    className='pb-6 sm:px-6'
    meta={
      <p className='text-sm text-zinc-400'>
        {guild.description || `Founded by ${guild.founderName}.`}
      </p>
    }
    actions={
      <span className='flex items-center gap-4 text-sm'>
        <span
          title={`${guild.memberCount} of ${guild.memberLimit} seats taken`}
          className='inline-flex items-center gap-1.5 tabular-nums text-zinc-400'>
          <Users size={15} className='text-zinc-500' />
          {guild.memberCount}
          <span className='text-zinc-500'>/ {guild.memberLimit}</span>
        </span>
      </span>
    }
  />
);

/**
 * The same shape for somebody not in a guild yet, so the page does not change
 * height the moment they join one: a strip in the app's own cyan, and a shield
 * where the crest will go.
 */
const NoGuildHeader = ({ isLoading }: { isLoading: boolean }) => (
  <>
    <GuildBanner
      bannerId='banner:wash'
      hex='#22d3ee'
      className='h-28 sm:h-40'
    />
    <div className='px-5 pb-6 sm:px-6'>
      <div className='-mt-12 flex items-start gap-5 sm:-mt-14'>
        <span className='flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-cyan-400 sm:h-32 sm:w-32'>
          <Shield size={40} />
        </span>
        <div className='min-w-0 flex-1 pt-14 sm:pt-16'>
          <h1 className='text-2xl font-bold text-zinc-100'>Guilds</h1>
          {isLoading ? (
            <span className='mt-2 block h-4 w-64 max-w-full animate-pulse rounded bg-zinc-800/60' />
          ) : (
            <p className='mt-1 text-sm text-zinc-400'>
              Find people to practise alongside. Joining is free.
            </p>
          )}
        </div>
      </div>
    </div>
  </>
);

export const GuildsView = () => {
  const [tab, setTab] = useState<GuildTab>("browse");
  const { data, isLoading } = useGuilds(true);

  const myGuild = data?.guilds.find((guild) => guild.id === data.myGuildId);

  // The strip a founder sees has one tab more than everybody else's. `active`
  // rather than `tab` is what the strip runs on, so a founder who leaves the
  // guild while standing on the kit lands back on the list instead of on a tab
  // that is no longer drawn.
  const isFounder = data?.isFounder ?? false;
  const tabs = TABS.filter((entry) => !entry.foundersOnly || isFounder);
  const active = tabs.some((entry) => entry.id === tab) ? tab : "browse";

  return (
    <div className='space-y-8 p-4 sm:p-6 md:p-10'>
      <header className='overflow-hidden rounded-lg bg-zinc-900/40'>
        {myGuild ? (
          <GuildHeader guild={myGuild} />
        ) : (
          <NoGuildHeader isLoading={isLoading} />
        )}
      </header>

      <Tabs
        value={active}
        onValueChange={(next) => setTab(next as GuildTab)}
        className='space-y-8'>
        <TabsList className='no-scrollbar h-auto w-full max-w-full justify-start gap-1 overflow-x-auto rounded-lg bg-zinc-900/60 p-1'>
          {tabs.map(({ id, label, icon: Icon, needsGuild }) => {
            const locked = needsGuild && !myGuild;

            return (
              <TabsTrigger
                key={id}
                value={id}
                title={locked ? `${label} — join a guild first` : label}
                className={cn(tabTriggerClass, locked && "text-zinc-500")}>
                {locked ? <Lock size={14} /> : <Icon size={16} />}
                {/* On a phone only the open tab carries its label, so all six
                    stay on one strip; from sm up every one is named. */}
                <span className={tab === id ? "inline" : "hidden sm:inline"}>
                  {label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value='browse' className='mt-0'>
          <GuildBrowser data={data} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value='members' className='mt-0'>
          {myGuild ? (
            <GuildMembersTab guild={myGuild} board={data?.quests ?? null} />
          ) : (
            <NeedsAGuild
              what='A roster is the people you are in it with, and you are not in one yet.'
              onBrowse={() => setTab("browse")}
            />
          )}
        </TabsContent>

        <TabsContent value='chat' className='mt-0'>
          {myGuild ? (
            // The room is the guild's own subcollection; membership is checked
            // in the security rules against the caller's own guildId.
            <Chat chatPath={guildChatPath(myGuild.id)} />
          ) : (
            <NeedsAGuild
              what='The chat is for the people you play with.'
              onBrowse={() => setTab("browse")}
            />
          )}
        </TabsContent>

        <TabsContent value='stash' className='mt-0'>
          {myGuild && data ? (
            <GuildStashTab enabled guild={myGuild} />
          ) : (
            <NeedsAGuild
              what='The shelf belongs to a guild, and you are not in one.'
              onBrowse={() => setTab("browse")}
            />
          )}
        </TabsContent>

        <TabsContent value='quests' className='mt-0'>
          {myGuild && data?.quests ? (
            <GuildQuestsTab board={data.quests} />
          ) : (
            <NeedsAGuild
              what='Quests are cleared by a guild, and you are not in one yet.'
              onBrowse={() => setTab("browse")}
            />
          )}
        </TabsContent>

        <TabsContent value='upgrades' className='mt-0'>
          {myGuild && data ? (
            <GuildUpgradesTab
              guild={myGuild}
              board={data.quests}
              fame={data.fame}
              tokensLeft={data.tokensLeft}
            />
          ) : (
            <NeedsAGuild
              what='Upgrades are paid for by a guild, and you are not in one yet.'
              onBrowse={() => setTab("browse")}
            />
          )}
        </TabsContent>

        {/* Only ever mounted for the founder — the tab it belongs to is not on
            anybody else's strip, and the server refuses anybody else anyway. */}
        {myGuild && isFounder && (
          <TabsContent value='kit' className='mt-0'>
            <GuildCosmeticsTab guild={myGuild} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
