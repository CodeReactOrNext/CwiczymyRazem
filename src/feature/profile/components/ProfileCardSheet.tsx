import { Checkbox } from "assets/components/ui/checkbox";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "assets/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import type { AchievementList } from "feature/achievements/types";
import { ACHIEVEMENT_TITLES } from "feature/profile/data/achievementTitles";
import { PROFILE_BANNERS } from "feature/profile/data/profileBanners";
import {
  PROFILE_ACCENT_COLORS,
  PROFILE_BADGE_LABELS,
  PROFILE_FACT_LABELS,
} from "feature/profile/data/profileSectionCatalog";
import type { ProfileLayoutConfig } from "feature/profile/types/profileLayout.types";
import {
  PROFILE_ACCENTS,
  PROFILE_BADGE_IDS,
  PROFILE_FACT_IDS,
} from "feature/profile/types/profileLayout.types";
import {
  ACCENT_UNLOCKS,
  isAccentUnlocked,
  MAX_ABOUT_LENGTH,
  MAX_FEATURED_SONGS,
  MAX_TAGLINE_LENGTH,
  MAX_TROPHIES,
  normalizeProfileLayout,
  sortByDifficulty,
  sortByRarity,
  toggleBadge,
  toggleFact,
  toggleFeaturedSong,
  toggleTrophy,
} from "feature/profile/utils/profileLayout";
import type { Song } from "feature/songs/types/songs.type";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ProfileSongRow } from "./SongSkillShowcase";
import { RARITY_LABELS } from "./TrophyCase";

interface ProfileCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: ProfileLayoutConfig;
  onChange: (layout: ProfileLayoutConfig) => void;
  /** The owner's earned achievements — the currency every unlock here is paid in. */
  earned: AchievementList[];
  learnedSongs: Song[];
}

type EditorProps = Omit<ProfileCardSheetProps, "open" | "onOpenChange">;

const SectionTitle = ({ children }: { children: string }) => (
  <h4 className='text-sm font-semibold text-zinc-100'>{children}</h4>
);

/** Texts are saved when the field loses focus, not on every keystroke. */
const TextFields = ({ layout, onChange }: EditorProps) => {
  const [tagline, setTagline] = useState(layout.tagline);
  const [about, setAbout] = useState(layout.about);

  const commit = (patch: Partial<ProfileLayoutConfig>) => {
    const next = normalizeProfileLayout({ ...layout, ...patch });
    if (next.tagline === layout.tagline && next.about === layout.about) return;
    onChange(next);
  };

  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <Label htmlFor='profile-tagline'>Tagline</Label>
        <Input
          id='profile-tagline'
          value={tagline}
          maxLength={MAX_TAGLINE_LENGTH}
          placeholder='Metal rhythm player chasing 200 bpm'
          onChange={(e) => setTagline(e.target.value)}
          onBlur={() => commit({ tagline })}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit({ tagline });
          }}
        />
        <p className='text-xs text-zinc-500'>Shown under your name.</p>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='profile-about'>About me</Label>
        <Textarea
          id='profile-about'
          value={about}
          rows={5}
          maxLength={MAX_ABOUT_LENGTH}
          placeholder='What you play, what you are working on, your gear…'
          onChange={(e) => setAbout(e.target.value)}
          onBlur={() => commit({ about })}
        />
        <p className='text-xs text-zinc-500'>
          {about.length}/{MAX_ABOUT_LENGTH} · Shown in the About me section.
        </p>
      </div>
    </div>
  );
};

const CardTab = (props: EditorProps) => {
  const { layout, onChange } = props;
  return (
    <div className='space-y-10'>
      <TextFields {...props} />

      <section className='space-y-3'>
        <SectionTitle>Facts under your name</SectionTitle>
        <div className='space-y-3'>
          {PROFILE_FACT_IDS.map((id) => (
            <div key={id} className='flex items-center gap-3'>
              <Checkbox
                id={`profile-fact-${id}`}
                checked={layout.facts.includes(id)}
                onCheckedChange={() => onChange(toggleFact(layout, id))}
              />
              <Label htmlFor={`profile-fact-${id}`} className='font-normal'>
                {PROFILE_FACT_LABELS[id]}
              </Label>
            </div>
          ))}
        </div>
        <p className='text-xs text-zinc-500'>
          Band, links and the year you started playing are set in{" "}
          <Link href='/settings' className='text-cyan-400 hover:text-cyan-300'>
            Settings
          </Link>
          .
        </p>
      </section>

      <section className='space-y-3'>
        <SectionTitle>Badges on the right</SectionTitle>
        <div className='space-y-3'>
          {PROFILE_BADGE_IDS.map((id) => (
            <div key={id} className='flex items-center gap-3'>
              <Checkbox
                id={`profile-badge-${id}`}
                checked={layout.badges.includes(id)}
                onCheckedChange={() => onChange(toggleBadge(layout, id))}
              />
              <Label htmlFor={`profile-badge-${id}`} className='font-normal'>
                {PROFILE_BADGE_LABELS[id]}
              </Label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/** One earned achievement as a pickable row: icon, name, rarity, and what it gives. */
const AchievementOption = ({
  id,
  isActive,
  disabled,
  detail,
  onClick,
}: {
  id: AchievementList;
  isActive: boolean;
  disabled?: boolean;
  detail: string;
  onClick: () => void;
}) => {
  const { t } = useTranslation("achievements");
  const data = achievementsMap.get(id);
  if (!data) return null;
  const { Icon, rarity, name } = data;
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40",
        isActive ? "bg-zinc-800/80" : "hover:bg-zinc-800/40",
      )}>
      <Icon
        size={20}
        className={cn("shrink-0", achievementsRarity[rarity].tailwindClass)}
        aria-hidden
      />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-semibold text-zinc-100'>
          {detail}
        </span>
        <span className='block truncate text-xs text-zinc-500'>
          {t(name as never)} · {RARITY_LABELS[rarity]}
        </span>
      </span>
      {isActive && <Check size={16} className='shrink-0 text-cyan-400' />}
    </button>
  );
};

const EmptyAchievements = () => (
  <p className='rounded-lg bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400'>
    You have no achievements yet. Every one you earn adds a title and a trophy
    to pick from here.
  </p>
);

const TitleTab = ({ layout, onChange, earned }: EditorProps) => {
  const sorted = useMemo(() => sortByRarity(earned), [earned]);
  if (sorted.length === 0) return <EmptyAchievements />;
  return (
    <div className='space-y-3'>
      <p className='text-xs text-zinc-500'>
        Every achievement comes with a title. Wear one above your name — rarer
        ones are listed first.
      </p>
      <div className='space-y-1'>
        <button
          type='button'
          onClick={() => onChange({ ...layout, title: null })}
          aria-pressed={layout.title === null}
          className={cn(
            "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 transition-colors",
            layout.title === null ? "bg-zinc-800/80" : "hover:bg-zinc-800/40",
          )}>
          <span className='flex-1'>No title</span>
          {layout.title === null && (
            <Check size={16} className='text-cyan-400' />
          )}
        </button>
        {sorted.map((id) => (
          <AchievementOption
            key={id}
            id={id}
            detail={ACHIEVEMENT_TITLES[id]}
            isActive={layout.title === id}
            onClick={() => onChange({ ...layout, title: id })}
          />
        ))}
      </div>
    </div>
  );
};

const TrophiesTab = ({ layout, onChange, earned }: EditorProps) => {
  const { t } = useTranslation("achievements");
  const sorted = useMemo(() => sortByRarity(earned), [earned]);
  if (sorted.length === 0) return <EmptyAchievements />;
  const isFull = layout.trophies.length >= MAX_TROPHIES;
  return (
    <div className='space-y-3'>
      <p className='text-xs text-zinc-500'>
        Pin up to {MAX_TROPHIES} ({layout.trophies.length}/{MAX_TROPHIES}), in
        the order you pick them. With nothing pinned, the case shows your rarest
        ones.
      </p>
      <div className='space-y-1'>
        {sorted.map((id) => {
          const isActive = layout.trophies.includes(id);
          const name = achievementsMap.get(id)?.name;
          return (
            <AchievementOption
              key={id}
              id={id}
              detail={name ? t(name as never) : id}
              isActive={isActive}
              disabled={!isActive && isFull}
              onClick={() => onChange(toggleTrophy(layout, id))}
            />
          );
        })}
      </div>
    </div>
  );
};

const SongsTab = ({ layout, onChange, learnedSongs }: EditorProps) => {
  const sorted = useMemo(() => sortByDifficulty(learnedSongs), [learnedSongs]);
  if (sorted.length === 0) {
    return (
      <p className='rounded-lg bg-zinc-900/40 px-4 py-6 text-sm text-zinc-400'>
        Mark songs as learned on your song board and they can be pinned here.
      </p>
    );
  }
  const isFull = layout.featuredSongs.length >= MAX_FEATURED_SONGS;
  return (
    <div className='space-y-3'>
      <p className='text-xs text-zinc-500'>
        Pin up to {MAX_FEATURED_SONGS} ({layout.featuredSongs.length}/
        {MAX_FEATURED_SONGS}) learned songs, in the order you pick them. With
        nothing pinned, the case shows your hardest ones.
      </p>
      <div className='space-y-1.5'>
        {sorted.map((song) => {
          const isActive = layout.featuredSongs.includes(song.id);
          return (
            <button
              key={song.id}
              type='button'
              disabled={!isActive && isFull}
              onClick={() => onChange(toggleFeaturedSong(layout, song.id))}
              aria-pressed={isActive}
              className={cn(
                "relative block w-full rounded-xl text-left transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40",
                isActive && "bg-zinc-700/40",
              )}>
              <ProfileSongRow song={song} />
              {isActive && (
                <Check
                  size={16}
                  className='absolute right-14 top-1/2 -translate-y-1/2 text-cyan-400'
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const StyleTab = ({ layout, onChange, earned }: EditorProps) => {
  const sortedEarned = useMemo(() => sortByRarity(earned), [earned]);
  return (
    <div className='space-y-10'>
      <section className='space-y-3'>
        <SectionTitle>Background</SectionTitle>
        <p className='text-xs text-zinc-500'>
          Scenes behind your header. Each one is earned by an achievement.
        </p>
        <div className='grid grid-cols-2 gap-2'>
          {PROFILE_BANNERS.map((banner) => {
            const isUnlocked = banner.isUnlocked(new Set(earned));
            const isActive = layout.banner === banner.id;
            return (
              <button
                key={banner.id}
                type='button'
                disabled={!isUnlocked}
                onClick={() => onChange({ ...layout, banner: banner.id })}
                aria-pressed={isActive}
                title={isUnlocked ? banner.label : banner.requirement}
                className={cn(
                  "group relative h-20 overflow-hidden rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed",
                  isActive && "ring-2 ring-zinc-100",
                )}
                style={{
                  background:
                    banner.layers ??
                    "radial-gradient(ellipse 55% 100% at 85% 100%, rgba(234,88,12,0.3), transparent 70%), #18181b",
                }}>
                <span className='absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6'>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isUnlocked ? "text-zinc-100" : "text-zinc-400",
                    )}>
                    {banner.label}
                  </span>
                  {isActive && <Check size={14} className='text-zinc-100' />}
                  {!isUnlocked && <Lock size={12} className='text-zinc-400' />}
                </span>
                {!isUnlocked && (
                  <span className='absolute inset-0 flex items-center bg-black/60 px-3 text-[11px] leading-snug text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100'>
                    {banner.requirement}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className='space-y-3'>
        <SectionTitle>Emblem</SectionTitle>
        <p className='text-xs text-zinc-500'>
          One of your achievement icons, stamped large into the header
          background in its rarity colour.
        </p>
        {sortedEarned.length === 0 ? (
          <EmptyAchievements />
        ) : (
          <div className='grid grid-cols-6 gap-2'>
            <button
              type='button'
              onClick={() => onChange({ ...layout, emblem: null })}
              aria-pressed={layout.emblem === null}
              title='No emblem'
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg bg-zinc-800/60 text-[10px] text-zinc-400 transition-colors hover:bg-zinc-700/60",
                layout.emblem === null && "ring-2 ring-zinc-100",
              )}>
              None
            </button>
            {sortedEarned.map((id) => {
              const data = achievementsMap.get(id);
              if (!data) return null;
              const { Icon, rarity } = data;
              return (
                <button
                  key={id}
                  type='button'
                  onClick={() => onChange({ ...layout, emblem: id })}
                  aria-pressed={layout.emblem === id}
                  aria-label={ACHIEVEMENT_TITLES[id]}
                  title={RARITY_LABELS[rarity]}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-lg bg-zinc-800/60 transition-colors hover:bg-zinc-700/60",
                    layout.emblem === id && "ring-2 ring-zinc-100",
                  )}>
                  <Icon
                    size={20}
                    className={achievementsRarity[rarity].tailwindClass}
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className='space-y-3'>
        <SectionTitle>Accent colour</SectionTitle>
        <p className='text-xs text-zinc-500'>
          Colours open up as you earn rarer achievements.
        </p>
        <div className='space-y-2'>
          {PROFILE_ACCENTS.map((accent) => {
            const color = PROFILE_ACCENT_COLORS[accent];
            const isActive = layout.accent === accent;
            const isUnlocked = isAccentUnlocked(accent, earned);
            return (
              <button
                key={accent}
                type='button'
                disabled={!isUnlocked}
                onClick={() => onChange({ ...layout, accent })}
                aria-pressed={isActive}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500",
                  isActive ? "bg-zinc-800/80" : "hover:bg-zinc-800/40",
                  !isUnlocked && "cursor-not-allowed",
                )}>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    !isUnlocked && "opacity-30",
                  )}
                  style={{ backgroundColor: color.base }}>
                  {isActive && <Check size={14} className='text-white' />}
                </span>
                <span className='min-w-0 flex-1'>
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      isUnlocked ? "text-zinc-100" : "text-zinc-500",
                    )}>
                    {color.label}
                  </span>
                  {!isUnlocked && (
                    <span className='block text-xs text-zinc-500'>
                      {ACCENT_UNLOCKS[accent].requirement}
                    </span>
                  )}
                </span>
                {!isUnlocked && (
                  <Lock size={14} className='shrink-0 text-zinc-600' />
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

/** Everything about how the profile presents its owner, paid for in achievements. */
export const ProfileCardSheet = ({
  open,
  onOpenChange,
  ...editor
}: ProfileCardSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side='right'
      className='w-full overflow-y-auto border-0 sm:max-w-md'>
      <SheetHeader className='text-left'>
        <SheetTitle>Profile card</SheetTitle>
        <SheetDescription>
          Decide what visitors see first. Changes save automatically.
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue='card' className='mt-6'>
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='card'>Card</TabsTrigger>
          <TabsTrigger value='style'>Style</TabsTrigger>
          <TabsTrigger value='title'>Title</TabsTrigger>
          <TabsTrigger value='trophies'>Trophies</TabsTrigger>
          <TabsTrigger value='songs'>Songs</TabsTrigger>
        </TabsList>
        <TabsContent value='card' className='mt-6'>
          <CardTab {...editor} />
        </TabsContent>
        <TabsContent value='style' className='mt-6'>
          <StyleTab {...editor} />
        </TabsContent>
        <TabsContent value='title' className='mt-6'>
          <TitleTab {...editor} />
        </TabsContent>
        <TabsContent value='trophies' className='mt-6'>
          <TrophiesTab {...editor} />
        </TabsContent>
        <TabsContent value='songs' className='mt-6'>
          <SongsTab {...editor} />
        </TabsContent>
      </Tabs>
    </SheetContent>
  </Sheet>
);
