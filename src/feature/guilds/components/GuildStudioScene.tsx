import { cn } from "assets/lib/utils";
import type {
  StudioArtBox,
  StudioBoardStat,
  StudioItem,
} from "feature/guilds/data/guildStudio";
import {
  STUDIO_BOARD_ID,
  STUDIO_ITEMS,
  STUDIO_SCENE,
  studioArtBox,
  studioArtPlacement,
  studioArtSrc,
  studioMarkerSpot,
} from "feature/guilds/data/guildStudio";
import { useStudioText } from "feature/guilds/hooks/useStudioText";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  BoardNote,
  GuildStudio,
  WeeklyMemberStats,
} from "feature/guilds/utils/guildStudio.utils";
import {
  BOARD_NOTE_RATIO,
  boardNotes,
  itemLevel,
} from "feature/guilds/utils/guildStudio.utils";
import { Plus } from "lucide-react";

/**
 * The studio drawn as a room in a game, seen from the front: the room's art as
 * the stage, and every piece of gear the guild owns standing on its own spot
 * as a cut-out sprite. Sprites are placed by their bottom-centre in the room
 * art's own pixels, so the whole scene scales as one picture; a lower spot is
 * nearer the viewer and draws on top.
 *
 * A spot with nothing on it — not built yet, or built but its sprite not drawn
 * yet — gets a round marker instead, so every piece is reachable from the
 * scene from day one.
 */

const { width: W, height: H } = STUDIO_SCENE;

const pct = (value: number, of: number): string => `${(value / of) * 100}%`;

/** Back wall and floor of the room's frame, for before the room art exists. */
const RoomOutline = () => (
  <svg
    viewBox={`0 0 ${W} ${H}`}
    className='absolute inset-0 h-full w-full'
    aria-hidden>
    <polygon
      points='405,70 1125,70 1125,445 405,445'
      className='fill-zinc-800/50'
    />
    <polygon
      points='130,320 405,70 405,445 145,800'
      className='fill-zinc-800/30'
    />
    <polygon
      points='1125,70 1405,320 1395,800 1125,445'
      className='fill-zinc-800/30'
    />
    <polygon
      points='405,445 1125,445 1505,965 30,965'
      className='fill-zinc-900/70'
    />
  </svg>
);

/** One paper colour per category, so a note reads before its title does. */
const NOTE_PAPER: Record<StudioBoardStat, string> = {
  hours: "bg-amber-200",
  sessions: "bg-emerald-200",
  streak: "bg-orange-200",
  points: "bg-purple-200",
};

/**
 * One category's sticky note on the board: its title and the week's leader,
 * big enough to read from across the room — the full podium is in the panel.
 * Placed in the board sprite's own frame so it scales with it; type is sized
 * off the note's drawn width, so one big note on a first board and four
 * small ones on the last both stay in proportion.
 */
const RankingNote = ({
  note,
  box,
  scale,
}: {
  note: BoardNote<GuildMember>;
  box: StudioArtBox;
  /** How much the board sprite is shrunk or grown in the scene. */
  scale: number;
}) => {
  const text = useStudioText();
  // A share of the note's drawn width, in scene-width units.
  const em = (share: number) =>
    `${((note.width * scale * share) / W) * 100}cqw`;
  const leader = note.podium[0];
  return (
    <span
      className={cn(
        "pointer-events-none absolute flex flex-col items-center justify-center gap-[4%] px-[8%] text-center leading-tight text-zinc-800",
        NOTE_PAPER[note.award.stat],
      )}
      style={{
        left: pct(note.x - box.left, box.width),
        top: pct(note.y - box.top, box.height),
        width: pct(note.width, box.width),
        aspectRatio: `1 / ${BOARD_NOTE_RATIO}`,
        transform: `translate(-50%, -50%) rotate(${note.rotate}deg)`,
        filter: "drop-shadow(0 0.15cqw 0.2cqw rgb(0 0 0 / 0.45))",
      }}>
      <span
        className='max-w-full truncate font-semibold text-zinc-600'
        style={{ fontSize: em(0.085) }}>
        {text.awardTitle(note.award.stat)}
      </span>
      {leader ? (
        <>
          {/* First name only: it has to read at a glance. */}
          <span
            className='max-w-full truncate font-bold'
            style={{ fontSize: em(0.15) }}>
            {leader.member.displayName.split(/\s+/)[0]}
          </span>
          <span
            className='font-bold tabular-nums'
            style={{ fontSize: em(0.12) }}>
            {text.awardValue(note.award.stat, leader.value)}
          </span>
        </>
      ) : (
        <span
          className='font-semibold text-zinc-600'
          style={{ fontSize: em(0.1) }}>
          {text.t("studio.nobody_yet")}
        </span>
      )}
      <span
        className='absolute left-1/2 top-0 aspect-square w-[9%] -translate-x-1/2 -translate-y-1/3 rounded-full bg-orange-500'
        aria-hidden
      />
    </span>
  );
};

interface SceneItemProps {
  item: StudioItem;
  level: number;
  /** The week to pin up, for the board; null for every other piece. */
  week: readonly WeeklyMemberStats<GuildMember>[] | null;
  selected: boolean;
  onSelect: () => void;
}

const SceneItem = ({
  item,
  level,
  week,
  selected,
  onSelect,
}: SceneItemProps) => {
  const text = useStudioText();
  const spot = studioMarkerSpot(item);
  const art = level > 0 ? studioArtBox(item.id, level) : null;
  const box = level > 0 ? studioArtPlacement(item, level) : null;
  const src = box ? studioArtSrc(item.id, level) : null;
  const label =
    level > 0
      ? text.levelName(item.id, level)
      : text.t("studio.empty_spot", { name: text.itemName(item.id) });

  if (!src || !box || !art)
    return (
      <button
        type='button'
        onClick={onSelect}
        aria-label={label}
        aria-pressed={selected}
        title={label}
        style={{ left: pct(spot.x, W), top: pct(spot.y, H), zIndex: 2000 }}
        className={cn(
          "absolute flex h-7 w-7 -translate-x-1/2 -translate-y-[150%] items-center justify-center rounded-full transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:h-9 sm:w-9",
          selected
            ? "bg-cyan-500/25 text-cyan-200 ring-1 ring-cyan-400/60"
            : "bg-zinc-950/75 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100",
        )}>
        {level === 0 ? (
          <Plus size={16} aria-hidden />
        ) : (
          <item.icon size={15} aria-hidden />
        )}
      </button>
    );

  const notes = week ? boardNotes(week, level) : [];
  // Nearer the viewer (a lower bottom edge) draws on top.
  const z = box.top + box.height;
  const spriteClass = cn(
    "select-none transition-[filter] duration-fast group-hover:brightness-110",
    selected && "brightness-125 group-hover:brightness-125",
  );

  return (
    <>
      <button
        type='button'
        onClick={onSelect}
        aria-label={label}
        aria-pressed={selected}
        title={label}
        style={{
          left: pct(box.left, W),
          top: pct(box.top, H),
          width: pct(box.width, W),
          zIndex: z,
        }}
        className='group absolute rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=''
          draggable={false}
          className={cn("block w-full", spriteClass)}
        />
        {notes.map((note) => (
          <RankingNote
            key={note.award.stat}
            note={note}
            box={art}
            scale={box.width / art.width}
          />
        ))}
        {selected && (
          <span className='absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-950/85 px-2 py-1 text-xs font-semibold text-zinc-100'>
            {text.levelName(item.id, level)}
          </span>
        )}
      </button>
    </>
  );
};

interface GuildStudioSceneProps {
  studio: GuildStudio;
  /** Each member's week so far, ranked on the weekly board. */
  week: readonly WeeklyMemberStats<GuildMember>[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export const GuildStudioScene = ({
  studio,
  week,
  selectedId,
  onSelect,
  className,
}: GuildStudioSceneProps) => {
  const text = useStudioText();
  const roomSrc = studioArtSrc("room", studio.roomLevel);

  return (
    <div
      className={cn("relative w-full select-none", className)}
      style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}>
      {roomSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={roomSrc}
          alt={text.roomName(studio.roomLevel)}
          draggable={false}
          className='absolute inset-0 h-full w-full object-contain'
        />
      ) : (
        <RoomOutline />
      )}
      {STUDIO_ITEMS.map((item) => (
        <SceneItem
          key={item.id}
          item={item}
          level={itemLevel(studio, item.id)}
          week={item.id === STUDIO_BOARD_ID ? week : null}
          selected={item.id === selectedId}
          onSelect={() => onSelect(item.id)}
        />
      ))}
    </div>
  );
};
