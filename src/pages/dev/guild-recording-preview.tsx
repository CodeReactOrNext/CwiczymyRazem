import "lib/i18n/fullCatalog";

import { Button } from "assets/components/ui/button";
import type { ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { GuildRecordingTab } from "feature/guilds/components/GuildRecordingTab";
import {
  getRecordingContract,
  RECORDING_TIERS,
  sessionBpm,
  sessionParts,
} from "feature/guilds/data/guildRecording";
import {
  STUDIO_ITEMS,
  STUDIO_MAX_ITEM_LEVEL,
  STUDIO_MAX_ROOM_LEVEL,
} from "feature/guilds/data/guildStudio";
import { useRecordingTakeStore } from "feature/guilds/services/guildRecording.service";
import type {
  RecordingSession,
  RecordingShelf,
  RecordingView,
  SessionResult,
  TakeResult,
  TakeSubmission,
} from "feature/guilds/utils/guildRecording.utils";
import {
  checkBooking,
  isSessionOver,
  judgeTake,
  layTake,
  openSession,
  recordingPerks,
  sessionStanding,
  sessionView,
  settleSession,
  shelve,
  takesLeft,
  tierViews,
} from "feature/guilds/utils/guildRecording.utils";
import type { GuildStudio } from "feature/guilds/utils/guildStudio.utils";
import { EMPTY_STUDIO } from "feature/guilds/utils/guildStudio.utils";
import { buildRecordingExercise } from "feature/guilds/utils/recordingRiff";
import { useTranslation } from "hooks/useTranslation";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";

/**
 * Dev-only harness for the guild's recording sessions: the real tab, the real
 * rules and the real take/rehearsal sessions, run on local state — no guild,
 * no Firebase writes for the session itself. Not linked from any nav; renders
 * nothing outside development.
 *
 *   ?state=fresh   an empty garage (default)
 *   ?state=mid     a half-built studio
 *   ?state=full    everything maxed
 *
 * "Record a take" opens the part as a real one-minute take with the mic; its
 * score lands on the local tape instead of the server's. The bar on top fakes
 * the rest: bandmates' takes, the days going by, the treasury.
 */

const ME = "you";
const BANDMATES = [
  { uid: "kasia", displayName: "Kasia Nowak" },
  { uid: "tom", displayName: "Tom Riff" },
  { uid: "ola", displayName: "Ola" },
];
const NAMES: Record<string, string> = Object.fromEntries([
  [ME, "You"],
  ...BANDMATES.map((mate) => [mate.uid, mate.displayName]),
]);
const DAY_MS = 86_400_000;

const STUDIOS: Record<string, GuildStudio> = {
  fresh: EMPTY_STUDIO,
  mid: {
    roomLevel: 2,
    items: { amp: 2, drums: 2, sofa: 1, desk: 2, mic: 1, walls: 2, tape: 1 },
  },
  full: {
    roomLevel: STUDIO_MAX_ROOM_LEVEL,
    items: Object.fromEntries(
      STUDIO_ITEMS.map((item) => [item.id, STUDIO_MAX_ITEM_LEVEL]),
    ),
  },
};

/** Every tier with a record out on it: what "all tiers open" pretends. */
const OPEN_SHELF: RecordingShelf = Object.fromEntries(
  RECORDING_TIERS.map(({ tier }) => [
    tier,
    { best: "record" as const, count: 0, at: 0 },
  ]),
);

/** Everything the server would keep on the guild document, and the clock. */
interface World {
  studio: GuildStudio;
  bank: number;
  now: number;
  session: RecordingSession | null;
  shelf: RecordingShelf;
  last: SessionResult | null;
  pay: Record<string, number>;
  /** Every tier bookable, whatever the shelf says. */
  unlockAll: boolean;
}

const freshWorld = (studio: GuildStudio): World => ({
  studio,
  bank: 60_000,
  now: Date.now(),
  session: null,
  shelf: {},
  last: null,
  pay: {},
  unlockAll: false,
});

const useWorld = create<World>(() => freshWorld(EMPTY_STUDIO));

/** The shelf the booking rules see: the guild's own, or one with every tier open. */
const shelfOf = (world: World): RecordingShelf =>
  world.unlockAll ? { ...OPEN_SHELF, ...world.shelf } : world.shelf;

/** Ends the open session the way the server does once it is over. */
const settle = (world: World): World => {
  if (!world.session) return world;
  const result = settleSession(
    world.session,
    recordingPerks(world.studio),
    new Date(world.now),
  );
  const pay = { ...world.pay };
  for (const [uid, fame] of Object.entries(result.pay))
    pay[uid] = (pay[uid] ?? 0) + fame;
  return {
    ...world,
    session: null,
    bank: world.bank + result.bank,
    shelf: { ...world.shelf, [result.tier]: shelve(world.shelf, result) },
    last: result,
    pay,
  };
};

const settleIfOver = (world: World): World =>
  world.session && isSessionOver(world.session, new Date(world.now))
    ? settle(world)
    : world;

/** Lays a take for `uid`, by the server's rules, and says what came of it. */
const submit = (uid: string, take: TakeSubmission): TakeResult => {
  const world = useWorld.getState();
  const contract = getRecordingContract(world.session?.contractId);
  if (!world.session || !contract)
    return { kept: false, points: 0, reason: "over", takesLeft: 0 };

  const perks = recordingPerks(world.studio);
  const now = new Date(world.now);
  const left = takesLeft(world.session, uid, perks, now);
  const verdict = judgeTake(
    take,
    sessionBpm(contract, world.session.tier),
    perks,
  );
  if (!verdict.kept || left <= 0)
    return {
      kept: false,
      points: 0,
      reason: verdict.kept ? "no-takes" : "scrapped",
      takesLeft: left,
    };

  const session = layTake(
    world.session,
    uid,
    take.partId,
    verdict.points,
    now,
    take.accuracy,
  );
  useWorld.setState(settleIfOver({ ...world, session }));
  return { kept: true, points: verdict.points, takesLeft: left - 1 };
};

/** The same view the endpoint answers with, from the local world. */
const viewOf = (world: World): RecordingView => {
  const perks = recordingPerks(world.studio);
  return {
    bank: world.bank,
    perks,
    tiers: tierViews(shelfOf(world), perks),
    session:
      world.session &&
      sessionView(world.session, perks, ME, ME, new Date(world.now), (uid) => ({
        displayName: NAMES[uid] ?? uid,
        avatar: null,
      })),
    last: world.last && {
      tier: world.last.tier,
      contractId: world.last.contractId,
      rating: world.last.rating,
      at: world.last.at,
      bank: world.last.bank,
      pay: world.last.pay[ME] ?? 0,
    },
    pay: world.pay[ME] ?? 0,
  };
};

/** What the server draws when a session is booked. */
const newSeed = () => Math.floor(Math.random() * 0xffffffff);

const book = (tier: number) => {
  const world = useWorld.getState();
  const perks = recordingPerks(world.studio);
  const shelf = shelfOf(world);
  const check = checkBooking(tier, shelf, perks, world.bank, !!world.session);
  if (!check.ok) return;
  useRecordingTakeStore.getState().setLast(null);
  useWorld.setState({
    bank: world.bank - check.fee,
    session: openSession(
      tier,
      shelf,
      perks,
      ME,
      new Date(world.now),
      newSeed(),
      world.last?.contractId,
    ),
  });
};

/** A bandmate lays a decent take on the emptiest tape. */
const bandmateTake = () => {
  const world = useWorld.getState();
  const contract = getRecordingContract(world.session?.contractId);
  if (!world.session || !contract) return;
  const perks = recordingPerks(world.studio);
  const now = new Date(world.now);
  const mate = BANDMATES.find(
    ({ uid }) => takesLeft(world.session!, uid, perks, now) > 0,
  );
  if (!mate) return;
  const emptiest = [...sessionStanding(world.session).parts].sort(
    (a, b) => a.fill - b.fill,
  )[0];
  submit(mate.uid, {
    partId: emptiest.id,
    accuracy: 70 + Math.round(Math.random() * 28),
    bpm: sessionBpm(contract, world.session.tier),
    notes: 80,
  });
};

const skipDays = (days: number) =>
  useWorld.setState((world) =>
    settleIfOver({ ...world, now: world.now + days * DAY_MS }),
  );

/** The part as a session: a take that feeds the local tape, or a rehearsal. */
const PartSession = ({
  partId,
  rehearsal,
  onLeave,
}: {
  partId: string;
  rehearsal: boolean;
  onLeave: () => void;
}) => {
  const { t } = useTranslation("guilds");
  const session = useWorld((world) => world.session);
  // Held from entry: the take that ends the session must not unmount itself.
  const [open] = useState(session);

  const plan = useMemo<ExercisePlan | null>(() => {
    const contract = getRecordingContract(open?.contractId);
    const part =
      contract &&
      open &&
      sessionParts(contract, open.tier).find((entry) => entry.id === partId);
    if (!open || !contract || !part) return null;
    const name = t(`recording.parts.${part.role}`, part.name);
    const exercise = buildRecordingExercise(contract, part, open.seed, {
      title: `${contract.track} — ${name}`,
      rehearsal,
      tier: open.tier,
    });
    return {
      id: `recording-${contract.id}-${part.id}`,
      title: rehearsal ? "Rehearsal" : "Recording session",
      description: exercise.description,
      category: exercise.category,
      difficulty: exercise.difficulty,
      exercises: [exercise],
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "dev-preview",
      image: null,
      recording: { partId: part.id, rehearsal },
    };
  }, [open, partId, rehearsal, t]);

  if (!plan) return null;
  return (
    <PracticeSession
      plan={plan}
      freeMode={rehearsal}
      onClose={onLeave}
      onFinish={onLeave}
      isFinishing={false}
    />
  );
};

const Toolbar = () => {
  const world = useWorld();
  const hasSession = !!world.session;
  const tool = (label: string, onClick: () => void, disabled = false) => (
    <Button variant='subtle' size='sm' disabled={disabled} onClick={onClick}>
      {label}
    </Button>
  );
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {tool("+10 000 Fame", () =>
        useWorld.setState({ bank: world.bank + 10_000 }),
      )}
      {tool(`All tiers open: ${world.unlockAll ? "on" : "off"}`, () =>
        useWorld.setState({ unlockAll: !world.unlockAll }),
      )}
      {tool("Bandmate plays a take", bandmateTake, !hasSession)}
      {tool(
        "Bandmates play 6 takes",
        () => {
          for (let i = 0; i < 6; i++) bandmateTake();
        },
        !hasSession,
      )}
      {tool(
        "New seed (another client)",
        () => {
          if (!world.session) return;
          // The same booking drawn again: a new client, new parts, a new band.
          useWorld.setState({
            session: openSession(
              world.session.tier,
              world.shelf,
              recordingPerks(world.studio),
              ME,
              new Date(world.now),
              newSeed(),
              world.session.contractId,
            ),
          });
        },
        !hasSession,
      )}
      {tool("+1 day", () => skipDays(1))}
      {tool("End the week", () => skipDays(7), !hasSession)}
      {tool("Reset", () => {
        useRecordingTakeStore.getState().setLast(null);
        useWorld.setState(freshWorld(world.studio));
      })}
    </div>
  );
};

const GuildRecordingPreview = ({ studio }: { studio: GuildStudio }) => {
  // Before the first render reads it: the world starts over from this studio.
  useState(() => useWorld.setState(freshWorld(studio), true));
  const world = useWorld();
  const lastTake = useRecordingTakeStore((state) => state.last);
  const [playing, setPlaying] = useState<{
    partId: string;
    rehearsal: boolean;
  } | null>(null);

  // Takes from the session land on the local tape instead of the server's.
  useEffect(() => {
    const { setSink, setLast } = useRecordingTakeStore.getState();
    setSink((take) => submit(ME, take));
    return () => {
      setSink(null);
      setLast(null);
    };
  }, []);

  if (playing)
    return (
      <PartSession
        key={`${playing.partId}:${playing.rehearsal}`}
        partId={playing.partId}
        rehearsal={playing.rehearsal}
        onLeave={() => setPlaying(null)}
      />
    );

  return (
    <div className='min-h-screen bg-zinc-950 px-4 py-6 md:px-8'>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <h1 className='font-display text-xl font-bold text-zinc-100'>
            Guild recording · dev preview
          </h1>
          <Toolbar />
        </div>
        <p className='text-sm text-zinc-400'>
          Day {new Date(world.now).toISOString().slice(0, 10)} · local state
          only. Studio fixture: ?state=fresh | mid | full.
          {world.session && ` Session seed: ${world.session.seed}.`}
        </p>

        <GuildRecordingTab
          view={viewOf(world)}
          lastTake={lastTake}
          onBook={book}
          onRecord={(partId) => setPlaying({ partId, rehearsal: false })}
          onRehearse={(partId) => setPlaying({ partId, rehearsal: true })}
          onDeliver={() => useWorld.setState(settle(useWorld.getState()))}
          onClaim={() => useWorld.setState({ pay: { ...world.pay, [ME]: 0 } })}
          onOpenStudio={() => window.open("/dev/guild-studio-preview")}
        />
      </div>
    </div>
  );
};

const GuildRecordingPreviewPage = () => {
  const router = useRouter();
  if (process.env.NODE_ENV === "production" || !router.isReady) return null;
  const state = String(router.query.state ?? "fresh");
  // Remount per fixture so ?state= starts the world over from that studio.
  return (
    <GuildRecordingPreview
      key={state}
      studio={STUDIOS[state] ?? STUDIOS.fresh}
    />
  );
};

export default dynamic(() => Promise.resolve(GuildRecordingPreviewPage), {
  ssr: false,
});
