import { AnimeChip, AnimeMoment } from "components/AnimeMoment/AnimeMoment";
import { DesktopUpdateRequired } from "components/DesktopUpdateRequired/DesktopUpdateRequired";
import ErrorBoundary from "components/ErrorBoundary/ErrorBoundary";
import { Kostek } from "components/Mascot/Kostek";
import { CollectionEmptyState } from "feature/arsenal/components/Collection/CollectionEmptyState";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { BossResultOverlay } from "feature/bosses/components/BossResultOverlay";
import { FRETWEAVER } from "feature/bosses/data/fretweaver";
import { useBossFightStore } from "feature/bosses/store/bossFightStore";
import { fightWith } from "feature/bosses/utils/fightFixtures";
import { generatePhase } from "feature/bosses/utils/phaseGenerator";
import { DuelEmptyState } from "feature/duels/components/DuelEmptyState";
import { ExerciseCompleteDialog } from "feature/exercisePlan/components/ExerciseCompleteDialog";
import { MicErrorScreen } from "feature/exercisePlan/views/PracticeSession/components/CalibrationWizard/components/MicErrorScreen";
import { ExerciseSuccessView } from "feature/exercisePlan/views/PracticeSession/components/ExerciseSuccessView";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { BossFightControlsProvider } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { getTrophyGuitar } from "feature/journey/data/journeyRewards";
import { FeatureLockedView } from "feature/levelGate/components/FeatureLockedView";
import { FEATURE_UNLOCK_LIST } from "feature/levelGate/data/featureUnlocks";
import NotFoundLayout from "layouts/NotFoundLayout/NotFoundLayout";
import { SessionCelebration } from "layouts/RatingPopUpLayout/components/SessionCelebration";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { type ReactNode, useEffect, useState } from "react";

/**
 * Dev-only: every place Kostek (or the anime moment) appears that can be shown
 * without an account, rendered from the real components on sample data.
 * Pick a scene with ?scene=<id>. Renders nothing in production.
 */

const noop = () => undefined;

const Boom = () => {
  throw new Error("Showcase: a crash for the error screen");
};

const Replay = ({ children }: { children: (replay: () => void) => ReactNode }) => {
  const [run, setRun] = useState(0);
  return <div key={run}>{children(() => setRun((r) => r + 1))}</div>;
};

const BossScene = ({ record }: { record: boolean }) => {
  useEffect(() => {
    useBossFightStore.setState((state) => ({
      newRecord: record,
      fight: {
        ...fightWith(),
        plan: generatePhase(state.fight.runSeed, 6),
        outcome: "lost",
        playerHp: 0,
        totalDamage: 4321,
        maxCombo: 57,
        hits: 30,
        misses: 10,
      },
    }));
  }, [record]);
  return (
    <BossFightControlsProvider value={{ restart: noop, resume: noop, finish: noop, isFinishing: false }}>
      <BossResultOverlay boss={FRETWEAVER} />
    </BossFightControlsProvider>
  );
};

const SCENES: Record<string, { label: string; node: () => ReactNode }> = {
  celebration: {
    label: "Po sesji: ekran przejściowy",
    node: () => <Replay>{(again) => <SessionCelebration points={120} fame={35} streak={4} onDone={again} />}</Replay>,
  },
  "celebration-level": {
    label: "Po sesji: nowy poziom",
    node: () => <Replay>{(again) => <SessionCelebration points={120} fame={35} streak={4} levelUp onDone={again} />}</Replay>,
  },
  "celebration-streak": {
    label: "Po sesji: kamień milowy serii",
    node: () => <Replay>{(again) => <SessionCelebration points={120} fame={35} streak={7} streakMilestone onDone={again} />}</Replay>,
  },
  "exercise-cleared": {
    label: "Ćwiczenie zaliczone",
    node: () => (
      <ExerciseSuccessView planTitle='Pentatonika — pozycja 1' onFinish={noop} stats={{ accuracy: 91, maxStreak: 42 }} score={1840} />
    ),
  },
  "exam-mastered": {
    label: "Egzamin na 3 gwiazdki (moment anime)",
    node: () => (
      <ExerciseSuccessView
        planTitle='Pentatonika — pozycja 1'
        onFinish={noop}
        examMode
        score={2400}
        maxScore={2400}
        examAccuracy={100}
        examOnTimePct={98}
        stats={{ accuracy: 100, maxStreak: 120 }}
      />
    ),
  },
  "exam-passed": {
    label: "Egzamin na 1 gwiazdkę",
    node: () => (
      <ExerciseSuccessView
        planTitle='Pentatonika — pozycja 1'
        onFinish={noop}
        examMode
        score={2000}
        maxScore={2400}
        examAccuracy={94}
        examOnTimePct={80}
        stats={{ accuracy: 94, maxStreak: 60 }}
      />
    ),
  },
  "exercise-dialog": {
    label: "Koniec ćwiczenia (okno)",
    node: () => <ExerciseCompleteDialog isOpen onClose={noop} onRestart={noop} exerciseTitle='Legato 1-2-4' duration={300} />,
  },
  "boss-record": { label: "Boss: nowy rekord (moment anime)", node: () => <BossScene record /> },
  "boss-lost": { label: "Boss: przegrana", node: () => <BossScene record={false} /> },
  journey: {
    label: "Ścieżka: gitara odebrana (moment anime)",
    node: () => {
      const guitar = getTrophyGuitar("fundamentals");
      if (!guitar) return null;
      return (
        <Replay>
          {(again) => (
            <AnimeMoment
              title='Gitara jest Twoja!'
              subtitle={`${guitar.brand} ${guitar.name}`}
              colors={{ a: getRarityColor(guitar.rarity), b: "#f4b63e" }}
              land={0.9}
              hero={
                <div className='relative'>
                  <img src={getRankBadgeSrc(guitar.imageId, "medium")} alt='' className='h-44 w-80 object-contain md:h-52 md:w-[26rem]' />
                  <Kostek mood='celebrate' short delay={0.9} className='absolute -bottom-10 -right-4 h-24 md:h-28' />
                </div>
              }
              onDone={again}>
              <AnimeChip>
                <span className='font-bold' style={{ color: getRarityColor(guitar.rarity) }}>
                  {guitar.rarity}
                </span>
              </AnimeChip>
            </AnimeMoment>
          )}
        </Replay>
      );
    },
  },
  loading: { label: "Ładowanie sesji (drzwi)", node: () => <PracticeLoadingScreen isReady={false} /> },
  "mic-error": { label: "Brak mikrofonu", node: () => <MicErrorScreen reason='denied' onRetry={noop} onCancel={noop} /> },
  "not-found": { label: "404", node: () => <NotFoundLayout /> },
  error: {
    label: "Ekran awarii",
    node: () => (
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    ),
  },
  "desktop-update": { label: "Wymagana aktualizacja aplikacji", node: () => <DesktopUpdateRequired /> },
  "feature-locked": {
    label: "Funkcja zablokowana",
    node: () => <FeatureLockedView feature={FEATURE_UNLOCK_LIST[FEATURE_UNLOCK_LIST.length - 1]} lvl={3} points={1200} />,
  },
  "collection-empty": { label: "Pusta kolekcja", node: () => <CollectionEmptyState /> },
  "duel-empty": { label: "Pojedynki: puste krzesło", node: () => <DuelEmptyState myName='Ty' myAvatar='' isSearching={false} /> },
  "duel-searching": { label: "Pojedynki: szukanie", node: () => <DuelEmptyState myName='Ty' myAvatar='' isSearching /> },
};

function MascotShowcase() {
  const router = useRouter();
  if (process.env.NODE_ENV === "production") return null;
  const scene = typeof router.query.scene === "string" ? router.query.scene : null;
  const current = scene ? SCENES[scene] : null;

  if (current) return <div className='min-h-screen bg-zinc-950 p-6'>{current.node()}</div>;

  return (
    <div className='min-h-screen bg-zinc-950 p-8'>
      <h1 className='mb-6 text-xl font-bold text-zinc-100'>Kostek — miejsca w aplikacji</h1>
      <ul className='grid gap-2 sm:grid-cols-2'>
        {Object.entries(SCENES).map(([id, s]) => (
          <li key={id}>
            <a href={`?scene=${id}`} className='block rounded-lg bg-zinc-900 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800'>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default dynamic(() => Promise.resolve(MascotShowcase), { ssr: false });
