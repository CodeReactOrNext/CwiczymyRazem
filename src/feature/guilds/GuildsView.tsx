import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import Chat from "feature/chat/Chat";
import { guildChatPath } from "feature/chat/services/chatService";
import { GuildBrowser } from "feature/guilds/components/GuildBrowser";
import { GuildChallengeTab } from "feature/guilds/components/GuildChallengeTab";
import { GuildCosmeticsTab } from "feature/guilds/components/GuildCosmeticsTab";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { GuildMembersTab } from "feature/guilds/components/GuildMembersTab";
import { GuildStashTab } from "feature/guilds/components/GuildStashTab";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { useGuilds } from "feature/guilds/hooks/useGuilds";
import type { Guild } from "feature/guilds/types/guild.types";
import { accentHex } from "feature/guilds/utils/guildCosmetics.utils";
import type { LucideIcon } from "lucide-react";
import {
  Boxes,
  Flame,
  Lock,
  MessageSquare,
  Palette,
  Shield,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";

type GuildTab = "browse" | "members" | "chat" | "stash" | "challenge" | "kit";

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
  { id: "challenge", label: "Challenge", icon: Target, needsGuild: true },
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
 * The one line that says which guild this is: crest, name, tag, and the two
 * numbers a member checks on the way in — seats taken and the weekly streak.
 */
const GuildHeader = ({ guild }: { guild: Guild }) => (
  <>
    <GuildCrest
      logo={guild.logo}
      tag={guild.tag}
      accentHex={accentHex(guild.cosmetics)}
      isMine
      className='h-12 w-12 text-sm'
    />

    <div className='min-w-0 flex-1'>
      <h1 className='flex flex-wrap items-center gap-2 text-2xl font-bold text-zinc-100'>
        {guild.name}
        <GuildTagBadge
          badge={{
            guildId: guild.id,
            tag: guild.tag,
            accent: guild.cosmetics.accent,
            frame: guild.cosmetics.frame,
          }}
          size='md'
          linked={false}
        />
      </h1>
      <p className='mt-1 text-sm text-zinc-400'>
        {guild.description || `Founded by ${guild.founderName}.`}
      </p>
    </div>

    <div className='flex items-center gap-4 text-sm'>
      <span
        title={`${guild.memberCount} of ${guild.memberLimit} seats taken`}
        className='inline-flex items-center gap-1.5 tabular-nums text-zinc-400'>
        <Users size={15} className='text-zinc-500' />
        {guild.memberCount}
        <span className='text-zinc-500'>/ {guild.memberLimit}</span>
      </span>
      {guild.challengeStreak > 0 && (
        <span
          title={`${guild.challengeStreak} weeks cleared in a row`}
          className='inline-flex items-center gap-1.5 font-bold tabular-nums text-orange-400'>
          <Flame size={15} />
          {guild.challengeStreak}
        </span>
      )}
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
      <header className='flex flex-wrap items-center gap-x-5 gap-y-4 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        {myGuild ? (
          <GuildHeader guild={myGuild} />
        ) : (
          <>
            <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400'>
              <Shield size={22} />
            </span>
            <div className='min-w-0 flex-1'>
              <h1 className='text-2xl font-bold text-zinc-100'>Guilds</h1>
              {isLoading ? (
                <span className='mt-2 block h-4 w-64 max-w-full animate-pulse rounded bg-zinc-800/60' />
              ) : (
                <p className='mt-1 text-sm text-zinc-400'>
                  Find people to practise alongside. Joining is free.
                </p>
              )}
            </div>
          </>
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
            <GuildMembersTab
              guild={myGuild}
              challenge={data?.challenge ?? null}
            />
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
            <GuildStashTab
              enabled
              guild={myGuild}
              tokensLeft={data.tokensLeft}
            />
          ) : (
            <NeedsAGuild
              what='The shelf belongs to a guild, and you are not in one.'
              onBrowse={() => setTab("browse")}
            />
          )}
        </TabsContent>

        <TabsContent value='challenge' className='mt-0'>
          {myGuild && data?.challenge ? (
            <GuildChallengeTab
              guild={myGuild}
              challenge={data.challenge}
              fame={data.fame}
              isFounder={data.isFounder}
            />
          ) : (
            <NeedsAGuild
              what='A challenge needs a guild to run it with.'
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
