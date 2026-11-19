import { AnimeChip, AnimeMoment } from "components/AnimeMoment/AnimeMoment";
import { DesktopUpdateRequired } from "components/DesktopUpdateRequired/DesktopUpdateRequired";
import ErrorBoundary from "components/ErrorBoundary/ErrorBoundary";
import { GlobalSearch } from "components/GlobalSearch/GlobalSearch";
import { Kostek } from "components/Mascot/Kostek";
import { CollectionEmptyState } from "feature/arsenal/components/Collection/CollectionEmptyState";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { BossesView } from "feature/bosses/BossesView";
import { BossResultOverlay } from "feature/bosses/components/BossResultOverlay";
import { FRETWEAVER } from "feature/bosses/data/fretweaver";
import { useBossFightStore } from "feature/bosses/store/bossFightStore";
import { fightWith } from "feature/bosses/utils/fightFixtures";
import { generatePhase } from "feature/bosses/utils/phaseGenerator";
import Chat from "feature/chat/Chat";
import { userCommunityExercisesQuery } from "feature/communityExercises/hooks/communityExerciseQueries";
import { StreakWidget } from "feature/dashboard/components/widgets/StreakWidget";
import { DashboardDataProvider } from "feature/dashboard/context/DashboardContext";
import { DuelEmptyState } from "feature/duels/components/DuelEmptyState";
import { GoalsPanel } from "feature/exerciseGoals/components/GoalsPanel";
import { ExerciseCompleteDialog } from "feature/exercisePlan/components/ExerciseCompleteDialog";
import { MicErrorScreen } from "feature/exercisePlan/views/PracticeSession/components/CalibrationWizard/components/MicErrorScreen";
import { SetupStep } from "feature/exercisePlan/views/PracticeSession/components/CalibrationWizard/components/SetupStep";
import { ExerciseSuccessView } from "feature/exercisePlan/views/PracticeSession/components/ExerciseSuccessView";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { BossFightControlsProvider } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { getTrophyGuitar } from "feature/journey/data/journeyRewards";
import { FeatureLockedView } from "feature/levelGate/components/FeatureLockedView";
import { FEATURE_UNLOCK_LIST } from "feature/levelGate/data/featureUnlocks";
import { NotificationsBell } from "feature/notifications/components/NotificationsBell";
import OnboardingView from "feature/onboarding/view/OnboardingView";
import { CalendarView } from "feature/practiceCalendar/components/CalendarView";
import { calendarQueryKey } from "feature/practiceCalendar/hooks/useCalendar";
import { PracticeLogView } from "feature/practiceLog/view/PracticeLogView";
import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { StreakSettings } from "feature/settings/components/StreakSettings";
import { DesktopLoginView } from "feature/user/view/DesktopLoginView/DesktopLoginView";
import LoginView from "feature/user/view/LoginView/LoginView";
import SingupView from "feature/user/view/SingupView/SingupView";
import type { AudioRefs } from "hooks/useAudioAnalyzer";
import { StreakBox } from "layouts/MainLoggedLayout/components/UserHeader/components/WelcomeMessage/components/StreakBox";
import NotFoundLayout from "layouts/NotFoundLayout/NotFoundLayout";
import { SessionCelebration } from "layouts/RatingPopUpLayout/components/SessionCelebration";
import RatingPopUpLayout from "layouts/RatingPopUpLayout/RatingPopUpLayout";
import { type ReactNode, useEffect, useState } from "react";

import FavoritesPage from "../../pages/favorites";
import MyExercisesPage from "../../pages/my-exercises";
import { SIM_UID, simBrokenStreak, simReport, simStats, simUserState } from "./simFixtures";
import type { SimSetup } from "./SimProviders";

const noop = () => undefined;
const asyncNoop = async () => undefined;

const Boom = () => {
  throw new Error("Simulator: a crash for the error screen");
};

/** Plays a one-off moment again when it ends. */
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

/** Every audio ref empty: the setup step reads "no signal" from them. */
const silentAudioRefs = new Proxy({} as Record<string, { current: null }>, {
  get: (refs, key: string) => (refs[key] ??= { current: null }),
}) as unknown as AudioRefs;

/** The calibration's input step; the toggle switches between waiting and listening. */
const SetupScene = () => {
  const [listening, setListening] = useState(false);
  return (
    <div className='mx-auto flex min-h-[80vh] max-w-2xl flex-col rounded-lg bg-zinc-900'>
      <button
        type='button'
        onClick={() => setListening((l) => !l)}
        className='m-4 self-start rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700'>
        Symulacja: {listening ? "słucha" : "nie słucha"} (kliknij)
      </button>
      <SetupStep
        isListening={listening}
        isLoading={false}
        inputSource='microphone'
        audioRefs={silentAudioRefs}
        inputGain={1}
        isNative={false}
        onInputError={noop}
        onGrant={noop}
        onNext={noop}
        onBack={noop}
        onCancel={noop}
      />
    </div>
  );
};

/** The session summary: the celebration plays first, then Kostek flies into the card. */
const SummaryScene = ({ points }: { points: number }) => {
  const stats = simStats();
  const before = simStats({ points: stats.points - points });
  return (
    <RatingPopUpLayout
      ratingData={simReport(points)}
      currentUserStats={stats}
      previousUserStats={before}
      onClick={noop}
      onRestart={noop}
    />
  );
};

/** Goals with nothing set yet; "add" opens the real dialog. */
const GoalsScene = () => (
  <div className='mx-auto max-w-4xl'>
    <GoalsPanel
      uid={SIM_UID}
      goals={[]}
      isLoading={false}
      isCreating={false}
      onCreate={async () => true}
      isUpdating={false}
      onUpdate={async () => true}
      onDelete={asyncNoop}
      completedId={null}
      onCompletedSeen={noop}
    />
  </div>
);

const StreakWidgetScene = ({ broken }: { broken: boolean }) => (
  <DashboardDataProvider
    value={{
      userAuth: SIM_UID,
      userStats: broken ? simBrokenStreak() : simStats(),
      activity: { year: new Date().getFullYear(), setYear: noop, datasWithReports: [], isLoading: false, reportList: [] },
      totalTimeValue: "14h",
      timeTrendData: [],
    }}>
    <div className='mx-auto max-w-sm'>
      <StreakWidget />
    </div>
  </DashboardDataProvider>
);

export interface Scene {
  group: string;
  label: string;
  /** What to try once it is up. */
  hint?: string;
  sim?: SimSetup;
  node: () => ReactNode;
}

const loggedIn = (extra: Omit<SimSetup, "user"> = {}, stats = simStats()): SimSetup => ({
  user: simUserState(stats),
  ...extra,
});

export const SCENES: Record<string, Scene> = {
  // ── Po sesji ──
  summary: {
    group: "Po sesji",
    label: "Podsumowanie sesji (celebracja → karta)",
    hint: "Moment anime, potem Kostek wlatuje do karty podsumowania.",
    sim: loggedIn(),
    node: () => <SummaryScene points={120} />,
  },
  "summary-rest": {
    group: "Po sesji",
    label: "Za krótka sesja (0 pkt)",
    sim: loggedIn(),
    node: () => <SummaryScene points={0} />,
  },
  celebration: {
    group: "Po sesji",
    label: "Celebracja: zwykła",
    node: () => <Replay>{(again) => <SessionCelebration points={120} fame={35} streak={4} onDone={again} />}</Replay>,
  },
  "celebration-level": {
    group: "Po sesji",
    label: "Celebracja: nowy poziom",
    node: () => <Replay>{(again) => <SessionCelebration points={120} fame={35} streak={4} levelUp onDone={again} />}</Replay>,
  },
  "celebration-streak": {
    group: "Po sesji",
    label: "Celebracja: kamień milowy serii",
    node: () => <Replay>{(again) => <SessionCelebration points={120} fame={35} streak={7} streakMilestone onDone={again} />}</Replay>,
  },
  "exercise-cleared": {
    group: "Po sesji",
    label: "Ćwiczenie zaliczone",
    node: () => <ExerciseSuccessView planTitle='Pentatonika — pozycja 1' onFinish={noop} stats={{ accuracy: 91, maxStreak: 42 }} score={1840} />,
  },
  "exam-mastered": {
    group: "Po sesji",
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
    group: "Po sesji",
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
    group: "Po sesji",
    label: "Koniec ćwiczenia (okno)",
    node: () => <ExerciseCompleteDialog isOpen onClose={noop} onRestart={noop} exerciseTitle='Legato 1-2-4' duration={300} />,
  },
  "boss-record": { group: "Po sesji", label: "Boss: nowy rekord (moment anime)", node: () => <BossScene record /> },
  "boss-lost": { group: "Po sesji", label: "Boss: przegrana", node: () => <BossScene record={false} /> },
  journey: {
    group: "Po sesji",
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

  // ── Wejście ──
  login: {
    group: "Wejście",
    label: "Logowanie",
    hint: "Kliknij w hasło i pisz: Kostek zasłania oczy.",
    node: () => <LoginView />,
  },
  signup: { group: "Wejście", label: "Rejestracja", hint: "Jak przy logowaniu: hasło zasłania mu oczy.", node: () => <SingupView /> },
  "desktop-login": { group: "Wejście", label: "Logowanie w aplikacji desktopowej", node: () => <DesktopLoginView /> },
  onboarding: {
    group: "Wejście",
    label: "Onboarding",
    hint: "Klikaj odpowiedzi: pytania w dymku, Kostek zostaje na ekranie.",
    node: () => <OnboardingView />,
  },

  // ── Sesja ──
  loading: { group: "Sesja", label: "Ładowanie sesji (struny)", node: () => <PracticeLoadingScreen isReady={false} /> },
  calibration: { group: "Sesja", label: "Kalibracja: wejście", hint: "Przełącznik u góry: czeka ↔ słucha.", node: () => <SetupScene /> },
  "mic-error": { group: "Sesja", label: "Brak mikrofonu", node: () => <MicErrorScreen reason='denied' onRetry={noop} onCancel={noop} /> },
  bosses: { group: "Sesja", label: "Bossowie (lobby)", sim: loggedIn(), node: () => <BossesView /> },

  // ── Puste stany ──
  "my-exercises": {
    group: "Puste stany",
    label: "Moje ćwiczenia",
    sim: loggedIn({ queries: [[userCommunityExercisesQuery(SIM_UID).queryKey, []]] }),
    node: () => <MyExercisesPage />,
  },
  favorites: { group: "Puste stany", label: "Ulubione", sim: loggedIn(), node: () => <FavoritesPage /> },
  goals: { group: "Puste stany", label: "Cele", hint: "Dodaj cel: otwiera się prawdziwe okno.", sim: loggedIn(), node: () => <GoalsScene /> },
  "practice-log": {
    group: "Puste stany",
    label: "Dziennik ćwiczeń",
    sim: loggedIn({ dev: { practiceLogSessions: [] } }),
    node: () => <PracticeLogView />,
  },
  recordings: {
    group: "Puste stany",
    label: "Nagrania",
    node: () => <RecordingsGrid recordings={[]} onViewRecording={noop} isLoading={false} page={1} totalPages={1} setPage={noop} />,
  },
  collection: { group: "Puste stany", label: "Kolekcja (arsenał)", node: () => <CollectionEmptyState /> },
  "duel-empty": { group: "Puste stany", label: "Pojedynki: puste krzesło", node: () => <DuelEmptyState myName='Ty' myAvatar='' isSearching={false} /> },
  "duel-searching": { group: "Puste stany", label: "Pojedynki: szukanie", node: () => <DuelEmptyState myName='Ty' myAvatar='' isSearching /> },
  notifications: {
    group: "Puste stany",
    label: "Powiadomienia",
    hint: "Kliknij dzwonek.",
    node: () => (
      <div className='flex justify-end'>
        <NotificationsBell />
      </div>
    ),
  },
  search: {
    group: "Puste stany",
    label: "Wyszukiwarka",
    hint: "Otwórz i wpisz coś, czego nie ma, np. „qqqq”.",
    node: () => <GlobalSearch />,
  },
  chat: {
    group: "Puste stany",
    label: "Czat: pusty pokój",
    sim: loggedIn({ dev: { chatMessages: [] } }),
    node: () => (
      <div className='mx-auto h-[80vh] max-w-xl overflow-hidden rounded-lg bg-zinc-900'>
        <Chat />
      </div>
    ),
  },

  // ── Seria ──
  "streak-widget": { group: "Seria", label: "Widget serii: trwa", sim: loggedIn(), node: () => <StreakWidgetScene broken={false} /> },
  "streak-widget-broken": {
    group: "Seria",
    label: "Widget serii: przerwana",
    sim: loggedIn({}, simBrokenStreak()),
    node: () => <StreakWidgetScene broken />,
  },
  "streak-box": { group: "Seria", label: "Seria w nagłówku", sim: loggedIn(), node: () => <StreakBox /> },
  "streak-box-broken": { group: "Seria", label: "Seria w nagłówku: przerwana", sim: loggedIn({}, simBrokenStreak()), node: () => <StreakBox /> },
  "streak-settings": {
    group: "Seria",
    label: "Ustawienia serii (dzień wolny)",
    hint: "Przełącznik zmienia minę; zapis się nie uda (jesteś wylogowany) i wróci.",
    sim: loggedIn(),
    node: () => (
      <div className='mx-auto max-w-2xl'>
        <StreakSettings />
      </div>
    ),
  },
  calendar: {
    group: "Seria",
    label: "Kalendarz: pusty tydzień",
    sim: loggedIn({ queries: [[calendarQueryKey(SIM_UID), { days: {}, prefs: null, links: {} }]] }),
    node: () => <CalendarView />,
  },

  // ── Błędy i blokady ──
  "not-found": { group: "Błędy i blokady", label: "404", node: () => <NotFoundLayout /> },
  error: {
    group: "Błędy i blokady",
    label: "Ekran awarii",
    node: () => (
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    ),
  },
  "desktop-update": { group: "Błędy i blokady", label: "Wymagana aktualizacja aplikacji", node: () => <DesktopUpdateRequired /> },
  "feature-locked": {
    group: "Błędy i blokady",
    label: "Funkcja zablokowana",
    node: () => <FeatureLockedView feature={FEATURE_UNLOCK_LIST[FEATURE_UNLOCK_LIST.length - 1]} lvl={3} points={1200} />,
  },
};
