import { useQueryClient } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";
import { pageTitleClass } from "components/PageTitle/PageTitle";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { MAX_DAYS_BACK } from "constants/gameSettings";
import { isAutoPlanId, isRecognizedPracticePlanId } from "feature/exercisePlan/utils/isRecognizedPracticePlan";
import { guitarSkills } from "feature/skills/data/guitarSkills";
import { ArrangementPicker } from "feature/songs/components/Arrangements/ArrangementPicker";
import { ensureSongIsLearning } from "feature/songs/services/udateSongStatus";
import { recordPracticeSession } from "feature/songs/services/userSongProgress.service";
import type { SongArrangement } from "feature/songs/types/songs.type";
import { ARRANGEMENT_META, parseArrangement } from "feature/songs/utils/arrangements.utils";
import {
  selectCurrentUserStats,
  selectIsFetching,
  selectPreviousUserStats,
  selectRaitingData,
  selectTimerData,
  selectUserAuth,
  selectUserAvatar,
} from "feature/user/store/userSlice";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import { Formik } from "formik";
import { useMediaQuery } from "hooks/useMediaQuery";
import { useTranslation } from "hooks/useTranslation";
import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import {
  AcceptExceedingPopUp,
  ErrorBox,
  HealthHabbitsBox,
  LongPracticeConfirmPopUp,
} from "layouts/ReportFormLayout/components";
import type { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";
import { useIntlLocale } from "lib/i18n/dateLocale";
import {
  CalendarDays,
  ListChecks,
  Music,
  Plus,
  Tags,
  Target,
  Timer,
} from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  convertMsToHMObject,
  getDateFromPast,
  inputTimeConverter,
} from "utils/converter";
import {
  getClientReportContext,
  getDailyStreakMultiplier,
  hasRestDays,
} from "utils/gameLogic";
import { resolveInternalPath } from "utils/resolveInternalPath";
import { i18n } from "utils/translation";

import { categoryTone, TONE_CLASSES } from "./helpers/categoryTone";
import {
  getLastReportInstant,
  isLastReportTimeExceeded,
} from "./helpers/isLastReportTimeExceeded";
import { RaportSchema } from "./helpers/RaportShcema";
import {
  MAX_SKILL_MINUTES,
  type SkillMinutes,
  sumSkillMinutesByCategory,
  toSkillTimeGained,
} from "./helpers/sessionSkills";
import {
  buildSongsSessionTitle,
  createPickedSong,
  formatPracticed,
  MAX_SESSION_SONGS,
  MAX_SONG_CATEGORY_MINUTES,
  MINUTE_MS,
  type PickedSong,
  pickPrimarySong,
  type SessionSong,
  songTotalMinutes,
  sumSongMinutes,
  toReportSongEntries,
} from "./helpers/sessionSongs";
import {
  CATEGORY_KEYS,
  type CategoryKey,
  getCategoryMinutes,
  MAX_CATEGORY_MINUTES,
  withSongHearingMinutes,
  withSongTotalMinutes,
} from "./helpers/timeSteps";
import { CategoryBadge, ChoiceTile, DetailRow, FormSection, StepHeader } from "./ReportFlowParts";
import type { ReportFormikInterface } from "./ReportView.types";
import SessionSkillPicker from "./SessionSkillPicker";
import SessionSongPicker, { SongCover } from "./SessionSongPicker";
import SessionSummary, { type SessionSummaryLine } from "./SessionSummary";
import SessionTagPicker, { tagKey } from "./SessionTagPicker";
import { MinutesStepper, TimeBlock } from "./TimeBlock";

type SessionMode = "free" | "songs";

/** How a free session's time is entered: per category, or per guitar skill. */
type FreeInput = "categories" | "skills";

type FlowStep = "what" | "pick" | "time";

type DetailKey = "song" | "tags" | "habits" | "day";

const ReportView = () => {
  const router = useRouter();
  const { songId, songTitle, songArtist, planId, planTitle, applyTimer, returnTo, rotation } = router.query;
  const [view, setView] = useState<'form' | 'success'>('form');
  const [acceptPopUpVisible, setAcceptPopUpVisible] = useState(false);
  const [exceedingTime, setExceedingTime] = useState<number | null>(null);
  const [acceptExceedingTime, setAcceptExceedingTime] = useState(false);
  const [longTimePopUpVisible, setLongTimePopUpVisible] = useState(false);
  const [acceptLongTime, setAcceptLongTime] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<ReportFormikInterface | null>(null);
  const [savedTimeApplied, setSavedTimeApplied] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // The session is either free practice — own time boxes, own title and tags —
  // or a run over songs, where each song brings its own time. Picking the mode
  // is the first thing step 1 asks, because it decides what the rest looks like.
  const [pickedSongs, setPickedSongs] = useState<PickedSong[]>(
    songId && songTitle
      ? [
          createPickedSong({
            id: songId as string,
            title: songTitle as string,
            artist: (songArtist as string) ?? "",
            arrangement: parseArrangement(router.query.arrangement),
          }),
        ]
      : []
  );
  const [sessionMode, setSessionMode] = useState<SessionMode>(
    pickedSongs.length > 0 ? "songs" : "free"
  );
  const [freeInput, setFreeInput] = useState<FreeInput>("categories");
  const [skillMinutes, setSkillMinutes] = useState<SkillMinutes>({});
  // The skill picked last: on desktop its time block opens with the cursor in
  // the minutes, so the next thing to do is right under the click.
  const [focusSkillId, setFocusSkillId] = useState<string | null>(null);
  const autoApplyTimer = applyTimer === "true";
  // Phones and tablets answer the log as three questions, one per screen.
  // Desktop keeps the whole form on one page — players with a mouse found
  // the steps and detail sheets too much clicking. The server renders the
  // questions, so a phone never flashes the desktop form.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { t } = useTranslation("report");
  const { t: tSkills } = useTranslation("skills");
  const intlLocale = useIntlLocale();

  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const raitingData = useAppSelector(selectRaitingData);
  const avatar = useAppSelector(selectUserAvatar);
  const userAuth = useAppSelector(selectUserAuth);
  const timerData = useAppSelector(selectTimerData);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  // Bumped on "Log another session" so the next summary's heatmap includes the
  // session just logged.
  const [logNonce, setLogNonce] = useState(0);
  const { reportList } = useActivityLog(userAuth as string, logNonce);
  const savedTimerSum =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const hasSavedTime = savedTimerSum > 0 && !savedTimeApplied && !autoApplyTimer;

  // The log is three questions — what, which, how long — one on screen at a
  // time. Arriving with the answers already known (a song from its page, time
  // handed over by the timer) starts on the last one.
  const [pickedCategories, setPickedCategories] = useState<CategoryKey[]>(() =>
    autoApplyTimer ? CATEGORY_KEYS.filter((key) => timerData[key] > 0) : []
  );
  const [step, setStep] = useState<FlowStep>(() =>
    pickedSongs.length > 0 || autoApplyTimer ? "time" : "what"
  );
  // Which detail the sheet shows stays put while it closes, so the content
  // does not vanish mid-animation.
  const [detail, setDetail] = useState<DetailKey>("habits");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const flowTopRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const flowTop = flowTopRef.current;
    if (flowTop && flowTop.getBoundingClientRect().top < 0) {
      flowTop.scrollIntoView({ block: "start" });
    }
  }, [step]);
  const openDetail = (key: DetailKey) => {
    setDetail(key);
    setIsDetailOpen(true);
  };

  // Streak multiplier (kicks in at a 2-day streak). It is applied to the combined
  // time + habit points in makeRatingData, so each ticked habit is worth
  // HABBITS_POINTS_VALUE × this multiplier — we surface it next to the checklist.
  const streak = currentUserStats?.actualDayWithoutBreak ?? 0;
  const streakMultiplier = 1 + getDailyStreakMultiplier(streak);
  const hasStreakBonus = streakMultiplier > 1;

  const techniqueTime = convertMsToHMObject(timerData.technique);
  const theoryTime = convertMsToHMObject(timerData.theory);
  const hearingTime = convertMsToHMObject(timerData.hearing);
  const creativityTime = convertMsToHMObject(timerData.creativity);

  const formikInitialValues: ReportFormikInterface = {
    techniqueHours: autoApplyTimer ? techniqueTime.hours : "00",
    techniqueMinutes: autoApplyTimer ? techniqueTime.minutes : "00",
    theoryHours: autoApplyTimer ? theoryTime.hours : "00",
    theoryMinutes: autoApplyTimer ? theoryTime.minutes : "00",
    hearingHours: autoApplyTimer ? hearingTime.hours : "00",
    hearingMinutes: autoApplyTimer ? hearingTime.minutes : "00",
    creativityHours: autoApplyTimer ? creativityTime.hours : "00",
    creativityMinutes: autoApplyTimer ? creativityTime.minutes : "00",
    habbits: [],
    countBackDays: 0,
    reportTitle: planTitle ? (planTitle as string) : (songTitle && songArtist ? `Practicing: ${songArtist} - ${songTitle}` : ""),
    avatarUrl: avatar ?? null,
    songId: (songId as string) || undefined,
    songTitle: (songTitle as string) || undefined,
    songArtist: (songArtist as string) || undefined,
    planId: (planId as string) || undefined,
  };

  const categories = CATEGORY_KEYS.map((key) => ({
    key,
    label: t(key),
    hint: t(`flow.category_hints.${key}`),
    Icon: SKILL_CATEGORY_ICONS[key],
  }));

  const healthHabbitsList: HealthHabbitsBoxProps[] = [
    {
      name: "exercise_plan",
      questionMarkProps: {
        description: i18n?.t("report:habits.exercise_plan.description"),
      },
      title: i18n?.t("report:habits.exercise_plan.title"),
    },
    {
      name: "new_things",
      questionMarkProps: {
        description: i18n?.t("report:habits.new_things.description"),
      },
      title: i18n?.t("report:habits.new_things.title"),
    },
    {
      name: "warmup",
      questionMarkProps: {
        description: i18n?.t("report:habits.warmup.description"),
      },
      title: i18n?.t("report:habits.warmup.title"),
    },
    {
      name: "metronome",
      questionMarkProps: {
        description: i18n?.t("report:habits.metronome.description"),
      },
      title: i18n?.t("report:habits.metronome.title"),
    },
    {
      name: "recording",
      questionMarkProps: {
        description: i18n?.t("report:habits.recording.description"),
      },
      title: i18n?.t("report:habits.recording.title"),
    },
  ];

  const getSumTime = (formikValues: ReportFormikInterface) => {
    const { sumTime } = inputTimeConverter(formikValues);
    return sumTime;
  };

  type SetFieldValue = (field: string, value: any) => void;

  const setMinutesField = (
    hoursField: string,
    minutesField: string,
    minutes: number,
    setFieldValue: SetFieldValue
  ) => {
    setFieldValue(hoursField, String(Math.floor(minutes / 60)));
    setFieldValue(minutesField, String(minutes % 60));
  };

  /**
   * In song mode the songs own the report's time: its technique and hearing
   * totals are the sum over them, and its title lists them. Writing it back
   * into the same Formik fields keeps scoring, validation and the total-time
   * readout working exactly as they do for a free session.
   */
  const applySongTimes = (songs: PickedSong[], setFieldValue: SetFieldValue) => {
    const { technique, hearing } = sumSongMinutes(songs);

    setMinutesField("techniqueHours", "techniqueMinutes", technique, setFieldValue);
    setMinutesField("hearingHours", "hearingMinutes", hearing, setFieldValue);
    setMinutesField("theoryHours", "theoryMinutes", 0, setFieldValue);
    setMinutesField("creativityHours", "creativityMinutes", 0, setFieldValue);
    setFieldValue("reportTitle", buildSongsSessionTitle(songs));
  };

  const toggleSong = (song: SessionSong, setFieldValue: SetFieldValue) => {
    const isPicked = pickedSongs.some((picked) => picked.id === song.id);
    if (!isPicked && pickedSongs.length >= MAX_SESSION_SONGS) return;

    const nextSongs = isPicked
      ? pickedSongs.filter((picked) => picked.id !== song.id)
      : [...pickedSongs, createPickedSong(song)];

    setPickedSongs(nextSongs);
    if (nextSongs.length === 0) setStep("pick");
    applySongTimes(nextSongs, setFieldValue);
  };

  const updateSong = (
    pickedId: string,
    update: (song: PickedSong) => PickedSong,
    setFieldValue: SetFieldValue
  ) => {
    const nextSongs = pickedSongs.map((song) =>
      song.id === pickedId ? update(song) : song
    );

    setPickedSongs(nextSongs);
    applySongTimes(nextSongs, setFieldValue);
  };

  const setSongArrangement = (pickedId: string, arrangement: SongArrangement | null) => {
    setPickedSongs((songs) =>
      songs.map((song) =>
        song.id === pickedId ? { ...song, arrangement: arrangement ?? undefined } : song
      )
    );
  };

  /**
   * By-skill entry owns the category boxes the same way songs do: each box is
   * the sum of its skills' minutes.
   */
  const applySkillTimes = (next: SkillMinutes, setFieldValue: SetFieldValue) => {
    const totals = sumSkillMinutesByCategory(next);
    setMinutesField("techniqueHours", "techniqueMinutes", totals.technique, setFieldValue);
    setMinutesField("theoryHours", "theoryMinutes", totals.theory, setFieldValue);
    setMinutesField("hearingHours", "hearingMinutes", totals.hearing, setFieldValue);
    setMinutesField("creativityHours", "creativityMinutes", totals.creativity, setFieldValue);
  };

  const toggleSkill = (skillId: string, setFieldValue: SetFieldValue) => {
    const next = { ...skillMinutes };
    const isPicked = skillId in next;
    if (isPicked) delete next[skillId];
    else next[skillId] = 0;
    setFocusSkillId(isPicked ? null : skillId);
    setSkillMinutes(next);
    if (Object.keys(next).length === 0) setStep("pick");
    applySkillTimes(next, setFieldValue);
  };

  const setSkillMinutesFor = (skillId: string, minutes: number, setFieldValue: SetFieldValue) => {
    const next = {
      ...skillMinutes,
      [skillId]: Math.max(0, Math.min(minutes, MAX_SKILL_MINUTES)),
    };
    setSkillMinutes(next);
    applySkillTimes(next, setFieldValue);
  };

  /** Question 2 for exercises can be answered by category or by skill. */
  const switchFreeInput = (input: FreeInput, setFieldValue: SetFieldValue) => {
    if (input === freeInput) return;
    setFreeInput(input);
    // Either side owns the time boxes; switching starts both from empty rather
    // than leaving time on the boxes the other side no longer explains.
    setSkillMinutes({});
    setPickedCategories([]);
    applySkillTimes({}, setFieldValue);
  };

  const toggleTag = (label: string, setFieldValue: SetFieldValue) => {
    const nextTags = selectedTags.includes(label)
      ? selectedTags.filter((tag) => tag !== label)
      : [...selectedTags, label];
    setSelectedTags(nextTags);
    setFieldValue(
      "reportTitle",
      nextTags.map((tag) => t(`tags.${tagKey(tag)}`, tag)).join(" + ")
    );
  };

  const toggleCategory = (
    key: CategoryKey,
    isActive: boolean,
    setFieldValue: SetFieldValue
  ) => {
    if (!isActive) {
      // Catalogue order, so the time blocks do not depend on the tap order.
      setPickedCategories(
        CATEGORY_KEYS.filter((k) => k === key || pickedCategories.includes(k))
      );
      return;
    }
    setPickedCategories(pickedCategories.filter((k) => k !== key));
    setMinutesField(`${key}Hours`, `${key}Minutes`, 0, setFieldValue);
  };

  const switchSessionMode = (mode: SessionMode, setFieldValue: SetFieldValue) => {
    setSessionMode(mode);

    if (mode === "songs") {
      setFreeInput("categories");
      setSkillMinutes({});
      // Tags and songs both write `reportTitle`; keep only one of them alive.
      setSelectedTags([]);
      applySongTimes(pickedSongs, setFieldValue);
      return;
    }

    if (pickedSongs.length > 0) {
      // The time on the boxes was the songs' — dropping them empties it too.
      setPickedSongs([]);
      applySongTimes([], setFieldValue);
    }
  };

  const reportOnSubmit = async (inputData: ReportFormikInterface) => {
    const sumTime = getSumTime(inputData);

    if (!userAuth) {
      toast.error(t("toast.not_logged"), {
        duration: 3000,
      });
      return;
    }

    if (sumTime === 0) {
      toast.error(t("toast.input_time"), {
        duration: 3000,
      });
      return;
    }

    if (sumTime >= 86400000) {
      toast.error(t("toast.24h_error"), {
        duration: 3000,
      });
      return;
    }

    const loggedSongs = sessionMode === "songs" ? toReportSongEntries(pickedSongs) : [];
    const primarySong = pickPrimarySong(loggedSongs);

    if (sumTime > 6 * 60 * 60 * 1000 && !acceptLongTime) {
      setLongTimePopUpVisible(true);
      return;
    }

    // A back-dated entry is time from an earlier day by definition, so the
    // elapsed-window check does not apply to it.
    const lastReportTimeExceded = inputData.countBackDays
      ? false
      : isLastReportTimeExceeded(getLastReportInstant(reportList), sumTime);

    if (lastReportTimeExceded && !acceptExceedingTime) {
      setAcceptPopUpVisible(true);
      setExceedingTime(lastReportTimeExceded);
      return;
    }

    if (isFetching) return;

    const enrichedInputData = {
      ...inputData,
      songs: loggedSongs,
      ...(sessionMode === "free" &&
        freeInput === "skills" && { skillTimeGained: toSkillTimeGained(skillMinutes) }),
      // Everything that still reads a single song (activity feed, practice log,
      // rating popup) gets the one this session leaned on the most.
      songId: primarySong?.songId,
      songTitle: primarySong?.songTitle,
      songArtist: primarySong?.songArtist,
      // Free Timer opened for a custom Rotation item (`?rotation=<id>`): the
      // report stamps that item as played.
      ...(typeof rotation === "string" &&
        rotation && {
          practiced: { exerciseIds: [], skillIds: [], customIds: [rotation] },
        }),
      ...getClientReportContext(
        (reportList ?? []).map((report: { date: Date | string }) => report.date),
        hasRestDays(currentUserStats)
      ),
    };

    await dispatch(updateUserStats({ inputData: enrichedInputData }));
    if (typeof rotation === "string" && rotation) {
      dispatch(updateQuestProgress({ type: "rotation_item" }));
    }

    // A manual log attributed to songs also feeds each song's own progress (its
    // share of the practice time, session count) and pulls it into "learning" —
    // the same bookkeeping the song timer does, so both routes stay consistent.
    if (loggedSongs.length > 0) {
      dispatch(
        updateQuestProgress({ type: 'practice_any_song', amount: loggedSongs.length })
      );
      try {
        await Promise.all(
          loggedSongs.map(async (song) => {
            await recordPracticeSession(
              userAuth,
              song.songId,
              song.practiceMs,
              null,
              null,
              song.arrangement
            );
            await ensureSongIsLearning(
              userAuth,
              song.songId,
              song.songTitle,
              song.songArtist ?? "",
              avatar ?? undefined
            );
          })
        );
        queryClient.invalidateQueries({ queryKey: ["user-song-progress", userAuth] });
        queryClient.invalidateQueries({ queryKey: ["user-songs", userAuth] });
      } catch (error) {
        console.error("Failed to update song progress from manual log:", error);
      }
    }

    // Quest Trigger
    if (inputData.habbits && inputData.habbits.length >= 2) {
        dispatch(updateQuestProgress({ type: 'healthy_habits', amount: 2 }));
    }

    if (inputData.planId) {
        // "Complete a Practice Plan" must only fire for an actual Practice Plan
        // (default/custom/auto), not for ad-hoc single-exercise sessions — see #731.
        if (isRecognizedPracticePlanId(inputData.planId)) {
          dispatch(updateQuestProgress({ type: 'practice_plan' }));
          dispatch(updateQuestProgress({ type: 'complete_two_plans' }));
        }
        // Structured practice (a plan or a specific exercise) awards skill points
        // server-side even though the manual form does not populate skillPointsGained.
        dispatch(updateQuestProgress({ type: 'improve_skill' }));
        if (isAutoPlanId(inputData.planId)) {
            dispatch(updateQuestProgress({ type: 'auto_plan' }));
        }

        // Handle specific exercise quests
        // Case 1: Started from Library (prefix 'exercise-')
        if (inputData.planId.startsWith('exercise-')) {
            const exerciseId = inputData.planId.replace('exercise-', '');
            dispatch(updateQuestProgress({ type: 'practice_specific_exercise', exerciseId, amount: 1 }));
            dispatch(updateQuestProgress({ type: 'practice_three_exercises', amount: 1 }));
        }
        // Case 2: Started from Skill Dashboard / Daily Quest (no prefix, planId is exerciseId)
        else {
            dispatch(updateQuestProgress({ type: 'practice_specific_exercise', exerciseId: inputData.planId, amount: 1 }));
            dispatch(updateQuestProgress({ type: 'practice_three_exercises', amount: 1 }));
        }
    }

    const totalMinutes = Math.floor(sumTime / 60000);
    if (totalMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_total_time', amount: totalMinutes }));
        dispatch(updateQuestProgress({ type: 'long_session', amount: totalMinutes }));
    }

    const techMinutes = Number(inputData.techniqueHours || 0) * 60 + Number(inputData.techniqueMinutes || 0);
    if (techMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_technique_time', amount: techMinutes }));
    }

    const theoryMinutes = Number(inputData.theoryHours || 0) * 60 + Number(inputData.theoryMinutes || 0);
    if (theoryMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_theory_time', amount: theoryMinutes }));
    }

    const hearingMinutes = Number(inputData.hearingHours || 0) * 60 + Number(inputData.hearingMinutes || 0);
    if (hearingMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_hearing_time', amount: hearingMinutes }));
    }

    const creativityMinutes = Number(inputData.creativityHours || 0) * 60 + Number(inputData.creativityMinutes || 0);
    if (creativityMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_creativity_time', amount: creativityMinutes }));
        dispatch(updateQuestProgress({ type: 'creativity_focus', amount: creativityMinutes }));
    }

    // Distinct categories across the whole day, so the quests get the minutes
    // themselves rather than a tally for this report.
    const categoryMinutes = {
        technique: techMinutes,
        theory: theoryMinutes,
        hearing: hearingMinutes,
        creativity: creativityMinutes,
    };
    if (Object.values(categoryMinutes).some((m) => m > 0)) {
        dispatch(updateQuestProgress({ type: 'well_rounded', categoryMinutes }));
        dispatch(updateQuestProgress({ type: 'two_categories_min', categoryMinutes }));
    }
    if (techMinutes > 0 && theoryMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'balanced_session', amount: 2 }));
    }
    if (inputData.skillPointsGained && Object.keys(inputData.skillPointsGained).length > 0) {
        dispatch(updateQuestProgress({ type: 'improve_skill' }));
    }

    const totalMinutesForCapture =
      Number(inputData.techniqueHours || 0) * 60 + Number(inputData.techniqueMinutes || 0) +
      Number(inputData.theoryHours || 0) * 60 + Number(inputData.theoryMinutes || 0) +
      Number(inputData.hearingHours || 0) * 60 + Number(inputData.hearingMinutes || 0) +
      Number(inputData.creativityHours || 0) * 60 + Number(inputData.creativityMinutes || 0);
    posthog.capture("manual_report_saved", {
      total_minutes: totalMinutesForCapture,
      has_song: loggedSongs.length > 0,
      song_count: loggedSongs.length,
      has_plan: !!inputData.planId,
      habit_count: inputData.habbits?.length ?? 0,
    });

    setSubmittedValues(enrichedInputData);
    setAcceptPopUpVisible(false);
    setView('success');
  };

  // Players timing blocks with an external clock log one after another, so the
  // summary can drop them straight back on a fresh form. The session mode and
  // picked songs stay (the next block is usually the same kind), only the times
  // and one-off confirmations are cleared — Formik remounts with fresh values.
  const logAnotherSession = () => {
    setPickedSongs((songs) => songs.map((song) => createPickedSong(song)));
    setSkillMinutes((skills) =>
      Object.fromEntries(Object.keys(skills).map((skillId) => [skillId, 0]))
    );
    setFocusSkillId(null);
    setAcceptExceedingTime(false);
    setAcceptLongTime(false);
    setSubmittedValues(null);
    setLogNonce((nonce) => nonce + 1);
    setIsDetailOpen(false);
    setSelectedTags([]);
    setStep(
      (sessionMode === "songs"
        ? pickedSongs.length
        : freeInput === "skills"
          ? Object.keys(skillMinutes).length
          : pickedCategories.length) > 0
        ? "time"
        : "what"
    );
    setView('form');
    window.scrollTo({ top: 0 });
  };

  const applySavedTime = (setFieldValue: (field: string, value: any) => void) => {
    setFieldValue("techniqueHours", techniqueTime.hours);
    setFieldValue("techniqueMinutes", techniqueTime.minutes);
    setFieldValue("theoryHours", theoryTime.hours);
    setFieldValue("theoryMinutes", theoryTime.minutes);
    setFieldValue("hearingHours", hearingTime.hours);
    setFieldValue("hearingMinutes", hearingTime.minutes);
    setFieldValue("creativityHours", creativityTime.hours);
    setFieldValue("creativityMinutes", creativityTime.minutes);
    setSavedTimeApplied(true);
  };

  /** Question 1. Changing the kind of session starts its answers over. */
  const chooseMode = (mode: SessionMode, setFieldValue: SetFieldValue) => {
    if (mode !== sessionMode) {
      switchSessionMode(mode, setFieldValue);
      setPickedCategories([]);
    }
    setStep("pick");
  };

  /**
   * The timer already knows what was practised and for how long, so its time
   * answers all three questions at once and lands on the last one.
   */
  const applyTimerShortcut = (setFieldValue: SetFieldValue) => {
    if (sessionMode !== "free") switchSessionMode("free", setFieldValue);
    setFreeInput("categories");
    setSkillMinutes({});
    applySavedTime(setFieldValue);
    setPickedCategories(CATEGORY_KEYS.filter((key) => timerData[key] > 0));
    setStep("time");
  };

  const getUpdatedActivityData = () => {
    if (!reportList) return [];
    if (!submittedValues) return reportList as any;

    const reportDate = getDateFromPast(Number(submittedValues.countBackDays));
    const dateString = reportDate.toISOString();
    
    // Ensure all inputs are numbers
    const entryTechnique = (Number(submittedValues.techniqueHours || 0) * 60 + Number(submittedValues.techniqueMinutes || 0)) * 60 * 1000;
    const entryTheory = (Number(submittedValues.theoryHours || 0) * 60 + Number(submittedValues.theoryMinutes || 0)) * 60 * 1000;
    const entryHearing = (Number(submittedValues.hearingHours || 0) * 60 + Number(submittedValues.hearingMinutes || 0)) * 60 * 1000;
    const entryCreativity = (Number(submittedValues.creativityHours || 0) * 60 + Number(submittedValues.creativityMinutes || 0)) * 60 * 1000;

    const newEntry = {
        date: dateString,
        techniqueTime: entryTechnique,
        theoryTime: entryTheory,
        hearingTime: entryHearing,
        creativityTime: entryCreativity,
    };
    
    // Check if an entry for this date already exists in reportList
    const exists = (reportList as any[]).some(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === reportDate.toDateString();
    });

    if (exists) {
        return (reportList as any[]).map(item => {
             const itemDate = new Date(item.date);
             if (itemDate.toDateString() === reportDate.toDateString()) {
                 return {
                     ...item,
                     techniqueTime: Number(item.techniqueTime || 0) + newEntry.techniqueTime,
                     theoryTime: Number(item.theoryTime || 0) + newEntry.theoryTime,
                     hearingTime: Number(item.hearingTime || 0) + newEntry.hearingTime,
                     creativityTime: Number(item.creativityTime || 0) + newEntry.creativityTime,
                 };
             }
             return item;
        });
    } else {
        return [...(reportList as any), newEntry];
    }
  };

  const activityDataToUse = submittedValues ? getUpdatedActivityData() : (reportList as any);

  return (
    <>
      {view === 'success' && raitingData && currentUserStats && previousUserStats ? (
        <RatingPopUpLayout
          // Continue leaves the page: back where the session came from, or the
          // dashboard when /report was opened directly. Staying to log the
          // next block is the restart button's job.
          onClick={() => router.push(resolveInternalPath(returnTo, "/dashboard"))}
          onRestart={logAnotherSession}
          restartLabel={t("form.log_another")}
          ratingData={raitingData}
          currentUserStats={currentUserStats}
          previousUserStats={previousUserStats}
          activityData={activityDataToUse}
        />
      ) : (
        <Formik
          initialValues={formikInitialValues}
          validationSchema={RaportSchema}
          validateOnBlur={false}
          enableReinitialize={true}
          onSubmit={reportOnSubmit}>
          {({ errors, values, setFieldValue }) => {
            const totalMs = getSumTime(values);
            const hasTime = totalMs > 0;
            const isSongMode = sessionMode === "songs";
            const isBySkill = !isSongMode && freeInput === "skills";
            const hasErrors = Object.keys(errors).length !== 0;
            const stepNumber = step === "what" ? 1 : step === "pick" ? 2 : 3;
            const habitCount = values.habbits?.length ?? 0;
            // Catalogue order, so a block does not jump around as minutes change.
            const pickedSkills = guitarSkills.filter((skill) => skill.id in skillMinutes);
            // A category is in the session when it was ticked or already holds
            // time. The second half matters: time can reach the form without a
            // tick (the timer's hand-over), and time that is counted in the
            // total must never sit in a block the player cannot see.
            const activeCategories =
              isSongMode || isBySkill
                ? []
                : CATEGORY_KEYS.filter(
                    (key) =>
                      pickedCategories.includes(key) || getCategoryMinutes(values, key) > 0
                  );
            const canContinue = isSongMode
              ? pickedSongs.length > 0
              : isBySkill
                ? pickedSkills.length > 0
                : activeCategories.length > 0;
            const minutesLabel = (minutes: number) => formatPracticed(minutes * MINUTE_MS);
            const dayLabel = (days: number) =>
              days === 0
                ? t("form.today")
                : days === 1
                  ? t("form.yesterday")
                  : t("form.days_ago", { count: days });
            const streakText = hasStreakBonus
              ? t("form.streak_bonus", { count: streak, multiplier: streakMultiplier.toFixed(1) })
              : t("form.no_streak_bonus", { multiplier: streakMultiplier.toFixed(1) });

            const songDetailValue = pickedSongs
              .flatMap((song) => [
                song.arrangement ? ARRANGEMENT_META[song.arrangement].label : null,
                song.hearingMinutes > 0
                  ? t("flow.by_ear_value", { time: minutesLabel(song.hearingMinutes) })
                  : null,
              ])
              .filter(Boolean)
              .join(" · ");

            // What the session holds so far, one line per song or category.
            const summaryLines: SessionSummaryLine[] = isSongMode
              ? pickedSongs.map((song) => ({
                  key: song.id,
                  label: song.title,
                  minutes: songTotalMinutes(song),
                  isName: true,
                  leading: <SongCover size='sm' coverUrl={song.coverUrl} />,
                }))
              : isBySkill
                ? pickedSkills.map((skill) => ({
                    key: skill.id,
                    label: tSkills(`skills.${skill.id}.name` as never),
                    minutes: skillMinutes[skill.id] ?? 0,
                    isName: false,
                    leading: <CategoryBadge size='sm' category={skill.category} />,
                    barClassName: TONE_CLASSES[categoryTone(skill.category)].bar,
                  }))
                : categories
                    .filter(({ key }) => activeCategories.includes(key))
                    .map(({ key, label }) => ({
                      key,
                      label,
                      minutes: getCategoryMinutes(values, key),
                      isName: false,
                      leading: <CategoryBadge size='sm' category={key} />,
                      barClassName: TONE_CLASSES[categoryTone(key)].bar,
                    }));

            const detailMeta = {
              song: { title: t("flow.detail_song"), description: t("flow.detail_song_hint") },
              tags: { title: t("flow.detail_tags"), description: t("description.sesion_title") },
              habits: { title: t("flow.detail_habits"), description: streakText },
              day: {
                title: t("form.when"),
                description: t("description.max_days", { days: MAX_DAYS_BACK }),
              },
            }[detail];

            const saveButton = (
              <Button
                type='submit'
                size='lg'
                loading={isFetching}
                disabled={!hasTime || hasErrors}
                className='w-full'>
                {isFetching ? t("form.saving") : t("flow.save")}
              </Button>
            );

            const songArrangementPicker = (song: PickedSong) => (
              <ArrangementPicker
                value={song.arrangement ?? null}
                onChange={(arrangement) => setSongArrangement(song.id, arrangement)}
                noneLabel={t("songs.any_part")}
                size='sm'
                className='bg-zinc-950/50'
              />
            );

            const songByEarStepper = (song: PickedSong) => (
              <MinutesStepper
                label={`${song.title} — ${t("hearing")}`}
                minutes={song.hearingMinutes}
                max={songTotalMinutes(song)}
                onChange={(minutes) =>
                  updateSong(
                    song.id,
                    (picked) => withSongHearingMinutes(picked, minutes),
                    setFieldValue
                  )
                }
              />
            );

            // Today and yesterday by name; older days by weekday and date,
            // short enough for all of them to sit in one row.
            const dayOptionLabel = (days: number) =>
              days <= 1
                ? dayLabel(days)
                : getDateFromPast(days).toLocaleDateString(intlLocale, {
                    weekday: "short",
                    day: "numeric",
                  });

            // Desktop: the pre-wizard structure — what and how long, then the
            // title and tags, the habits and the day — all on one page, each
            // part on its own plate, with the session summary and the save
            // beside them.
            const tagsStep = 2;
            const habitsStep = isSongMode ? 2 : 3;
            const whenStep = habitsStep + 1;
            const desktopForm = (
              <div className='grid grid-cols-[minmax(0,1fr)_20rem] gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16'>
                <div className='flex min-w-0 flex-col gap-10'>
                  <FormSection
                    step={1}
                    title={t("flow.q_what")}
                    done={hasTime}
                    action={
                      <SegmentedControl<SessionMode>
                        label={t("flow.q_what")}
                        selected={[sessionMode]}
                        onSelect={(mode) => chooseMode(mode, setFieldValue)}
                        options={[
                          {
                            value: "free",
                            label: t("flow.kind_free"),
                            icon: <Target className='h-4 w-4' />,
                          },
                          {
                            value: "songs",
                            label: t("flow.kind_songs"),
                            icon: <Music className='h-4 w-4' />,
                          },
                        ]}
                      />
                    }>
                    {hasSavedTime && (
                      <ChoiceTile
                        quiet
                        icon={<Timer size='1em' />}
                        title={t("flow.timer_title")}
                        hint={t("flow.timer_hint", { time: formatPracticed(savedTimerSum) })}
                        onClick={() => applyTimerShortcut(setFieldValue)}
                      />
                    )}

                    {!isSongMode && (
                      <SegmentedControl<FreeInput>
                        label={t("flow.q_focus")}
                        selected={[freeInput]}
                        onSelect={(input) => switchFreeInput(input, setFieldValue)}
                        options={[
                          { value: "categories", label: t("flow.by_category") },
                          { value: "skills", label: t("flow.by_skill") },
                        ]}
                      />
                    )}

                    {/* One column: in two, the steppers landed at four
                        different spots and the blocks ran together. */}
                    {!isSongMode && !isBySkill && (
                      <div className='flex flex-col gap-4'>
                        {categories.map(({ key, label, hint }) => {
                          const minutes = getCategoryMinutes(values, key);
                          return (
                            <TimeBlock
                              key={key}
                              variant='row'
                              tone={categoryTone(key)}
                              leading={<CategoryBadge category={key} active={minutes > 0} />}
                              title={label}
                              subtitle={hint}
                              minutes={minutes}
                              max={MAX_CATEGORY_MINUTES}
                              onChange={(next) =>
                                setMinutesField(
                                  `${key}Hours`,
                                  `${key}Minutes`,
                                  Math.max(0, Math.min(next, MAX_CATEGORY_MINUTES)),
                                  setFieldValue
                                )
                              }
                            />
                          );
                        })}
                      </div>
                    )}

                    {isBySkill && (
                      <SessionSkillPicker
                        value={skillMinutes}
                        onToggle={(skillId) => toggleSkill(skillId, setFieldValue)}
                        renderPicked={(skill) => (
                          <TimeBlock
                            key={skill.id}
                            variant='row'
                            sunk
                            autoFocus={skill.id === focusSkillId}
                            tone={categoryTone(skill.category)}
                            title={tSkills(`skills.${skill.id}.name` as never)}
                            minutes={skillMinutes[skill.id] ?? 0}
                            max={MAX_SKILL_MINUTES}
                            onChange={(next) =>
                              setSkillMinutesFor(skill.id, next, setFieldValue)
                            }
                            onRemove={() => toggleSkill(skill.id, setFieldValue)}
                          />
                        )}
                      />
                    )}

                    {isSongMode && (
                      <>
                        <SessionSongPicker
                          userId={userAuth as string | null}
                          selected={pickedSongs}
                          onToggle={(song) => toggleSong(song, setFieldValue)}
                        />
                        {pickedSongs.length > 0 && (
                          <div className='flex flex-col gap-5'>
                            <h3 className='text-base font-semibold text-zinc-300'>
                              {t("flow.q_time")}
                            </h3>
                            <div className='flex flex-col gap-4'>
                              {pickedSongs.map((song) => (
                                <TimeBlock
                                  key={song.id}
                                  variant='row'
                                  isName
                                  leading={<SongCover coverUrl={song.coverUrl} />}
                                  title={song.title}
                                  subtitle={song.artist}
                                  minutes={songTotalMinutes(song)}
                                  max={MAX_SONG_CATEGORY_MINUTES}
                                  onChange={(minutes) =>
                                    updateSong(
                                      song.id,
                                      (picked) => withSongTotalMinutes(picked, minutes),
                                      setFieldValue
                                    )
                                  }
                                  onRemove={() => toggleSong(song, setFieldValue)}>
                                  <div className='flex flex-wrap items-center justify-between gap-x-8 gap-y-4'>
                                    {songArrangementPicker(song)}
                                    <div className='flex items-center gap-3'>
                                      <span className='text-sm text-zinc-400'>
                                        {t("flow.by_ear")}
                                      </span>
                                      {songByEarStepper(song)}
                                    </div>
                                  </div>
                                </TimeBlock>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </FormSection>

                  {!isSongMode && (
                    <FormSection
                      step={tagsStep}
                      title={t("flow.detail_tags")}
                      description={t("description.sesion_title")}
                      optionalLabel={t("form.optional")}
                      done={values.reportTitle.trim().length > 0}>
                      <SessionTagPicker
                        title={values.reportTitle}
                        titleError={errors.reportTitle}
                        selectedTags={selectedTags}
                        onTitleChange={(title) => {
                          setSelectedTags([]);
                          setFieldValue("reportTitle", title);
                        }}
                        onToggleTag={(label) => toggleTag(label, setFieldValue)}
                      />
                    </FormSection>
                  )}

                  <FormSection
                    step={habitsStep}
                    title={t("flow.detail_habits")}
                    description={streakText}
                    optionalLabel={t("form.optional")}
                    done={habitCount > 0}
                    action={
                      <span className='pt-1.5 text-sm font-semibold tabular-nums text-zinc-400'>
                        {t("flow.habits_count", {
                          count: habitCount,
                          total: healthHabbitsList.length,
                        })}
                      </span>
                    }>
                    {/* One even column: in a grid the five long questions
                        broke into ragged rows of two and three. */}
                    <div className='flex max-w-3xl flex-col gap-3'>
                      {healthHabbitsList.map(({ name, questionMarkProps, title }) => (
                        <HealthHabbitsBox
                          key={name}
                          name={name}
                          title={title}
                          questionMarkProps={questionMarkProps}
                        />
                      ))}
                    </div>
                  </FormSection>

                  <FormSection
                    step={whenStep}
                    title={t("form.when")}
                    description={t("description.max_days", { days: MAX_DAYS_BACK })}
                    optionalLabel={t("form.optional")}
                    done={hasTime}>
                    <div className='flex flex-col gap-4'>
                      <SegmentedControl
                        label={t("form.when")}
                        selected={[String(values.countBackDays)]}
                        onSelect={(days) => setFieldValue("countBackDays", Number(days))}
                        options={Array.from({ length: MAX_DAYS_BACK + 1 }, (_, days) => ({
                          value: String(days),
                          label: dayOptionLabel(days),
                        }))}
                      />
                      <p className='text-sm text-zinc-400'>
                        {t("form.selected")}{" "}
                        <span className='text-zinc-200'>
                          {getDateFromPast(values.countBackDays).toLocaleDateString(intlLocale)}
                        </span>
                      </p>
                    </div>
                  </FormSection>

                  {hasErrors && <ErrorBox errors={errors} />}
                </div>

                <aside>
                  <SessionSummary
                    lines={summaryLines}
                    totalMs={totalMs}
                    isReady={hasTime && !hasErrors}
                    footer={
                      <>
                        {saveButton}
                        {!hasTime && (
                          <p className='text-sm text-zinc-400'>{t("flow.add_time_hint")}</p>
                        )}
                      </>
                    }
                  />
                </aside>
              </div>
            );

            return (
              <>
                <ReportFormLayout className={isDesktop ? "max-w-none" : undefined}>
                  {isDesktop ? desktopForm : (
                  <div className='grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,42rem)_20rem] lg:justify-between lg:gap-12'>
                    <div
                      ref={flowTopRef}
                      className='mx-auto flex w-full max-w-xl scroll-mt-24 flex-col gap-8 lg:mx-0 lg:max-w-none'>
                      <StepHeader
                        step={stepNumber}
                        total={3}
                        backLabel={t("flow.back")}
                        onBack={
                          step === "what"
                            ? undefined
                            : () => setStep(step === "time" ? "pick" : "what")
                        }
                      />

                      {/* QUESTION 1: WHAT */}
                      {step === "what" && (
                        <section className='flex flex-col gap-8 duration-base animate-in fade-in slide-in-from-bottom-1'>
                          <h2 className={pageTitleClass}>
                            {t("flow.q_what")}
                          </h2>
                          <div className='flex flex-col gap-4'>
                            <ChoiceTile
                              size='lg'
                              icon={<Target size='1em' />}
                              title={t("flow.kind_free")}
                              hint={t("flow.kind_free_hint")}
                              onClick={() => chooseMode("free", setFieldValue)}
                            />
                            <ChoiceTile
                              size='lg'
                              icon={<Music size='1em' />}
                              title={t("flow.kind_songs")}
                              hint={t("flow.kind_songs_hint")}
                              onClick={() => chooseMode("songs", setFieldValue)}
                            />
                          </div>

                          {hasSavedTime && (
                            <div className='flex flex-col gap-3'>
                              <p className='text-sm font-semibold text-zinc-400'>
                                {t("flow.shortcuts")}
                              </p>
                              <ChoiceTile
                                quiet
                                icon={<Timer size='1em' />}
                                title={t("flow.timer_title")}
                                hint={t("flow.timer_hint", {
                                  time: formatPracticed(savedTimerSum),
                                })}
                                onClick={() => applyTimerShortcut(setFieldValue)}
                              />
                            </div>
                          )}
                        </section>
                      )}

                      {/* QUESTION 2: WHICH */}
                      {step === "pick" && (
                        <section className='flex flex-col gap-8 duration-base animate-in fade-in slide-in-from-bottom-1'>
                          <div className='flex flex-col gap-2'>
                            <h2 className={pageTitleClass}>
                              {isSongMode ? t("flow.q_songs") : t("flow.q_focus")}
                            </h2>
                            <p className='text-base text-zinc-400'>{t("flow.pick_hint")}</p>
                          </div>

                          {isSongMode ? (
                            <SessionSongPicker
                              userId={userAuth as string | null}
                              selected={pickedSongs}
                              onToggle={(song) => toggleSong(song, setFieldValue)}
                            />
                          ) : (
                            <div className='flex flex-col gap-4'>
                              <SegmentedControl<FreeInput>
                                label={t("flow.q_focus")}
                                selected={[freeInput]}
                                onSelect={(input) => switchFreeInput(input, setFieldValue)}
                                options={[
                                  { value: "categories", label: t("flow.by_category") },
                                  { value: "skills", label: t("flow.by_skill") },
                                ]}
                              />

                              {isBySkill ? (
                                <SessionSkillPicker
                                  value={skillMinutes}
                                  onToggle={(skillId) => toggleSkill(skillId, setFieldValue)}
                                />
                              ) : (
                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                  {categories.map(({ key, label, hint }) => (
                                    <ChoiceTile
                                      key={key}
                                      leading={<CategoryBadge category={key} />}
                                      title={label}
                                      hint={hint}
                                      selected={activeCategories.includes(key)}
                                      onClick={() =>
                                        toggleCategory(
                                          key,
                                          activeCategories.includes(key),
                                          setFieldValue
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            type='button'
                            size='lg'
                            className='sm:min-w-56 sm:self-end'
                            disabled={!canContinue}
                            onClick={() => setStep("time")}>
                            {t("flow.next")}
                          </Button>
                        </section>
                      )}

                      {/* QUESTION 3: HOW LONG — and the save */}
                      {step === "time" && (
                        <section className='flex flex-col gap-8 duration-base animate-in fade-in slide-in-from-bottom-1'>
                          <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
                            <h2 className={pageTitleClass}>
                              {t("flow.q_time")}
                            </h2>
                            <Button
                              type='button'
                              variant='ghost'
                              onClick={() => setStep("pick")}>
                              <Plus />
                              {isSongMode
                                ? t("flow.change_songs")
                                : isBySkill
                                  ? t("flow.change_skills")
                                  : t("flow.change_focus")}
                            </Button>
                          </div>

                          <div className='flex flex-col gap-3'>
                            {isSongMode &&
                              pickedSongs.map((song) => (
                                <TimeBlock
                                  key={song.id}
                                  isName
                                  leading={<SongCover coverUrl={song.coverUrl} />}
                                  title={song.title}
                                  subtitle={song.artist}
                                  minutes={songTotalMinutes(song)}
                                  max={MAX_SONG_CATEGORY_MINUTES}
                                  onChange={(minutes) =>
                                    updateSong(
                                      song.id,
                                      (picked) => withSongTotalMinutes(picked, minutes),
                                      setFieldValue
                                    )
                                  }
                                  onRemove={
                                    pickedSongs.length > 1
                                      ? () => toggleSong(song, setFieldValue)
                                      : undefined
                                  }
                                />
                              ))}

                            {!isSongMode &&
                              !isBySkill &&
                              categories
                                .filter(({ key }) => activeCategories.includes(key))
                                .map(({ key, label }) => (
                                  <TimeBlock
                                    key={key}
                                    leading={<CategoryBadge category={key} />}
                                    title={label}
                                    minutes={getCategoryMinutes(values, key)}
                                    max={MAX_CATEGORY_MINUTES}
                                    onChange={(minutes) =>
                                      setMinutesField(
                                        `${key}Hours`,
                                        `${key}Minutes`,
                                        Math.max(0, Math.min(minutes, MAX_CATEGORY_MINUTES)),
                                        setFieldValue
                                      )
                                    }
                                    onRemove={
                                      activeCategories.length > 1
                                        ? () => toggleCategory(key, true, setFieldValue)
                                        : undefined
                                    }
                                  />
                                ))}

                            {isBySkill &&
                              pickedSkills.map((skill) => (
                                <TimeBlock
                                  key={skill.id}
                                  leading={<CategoryBadge category={skill.category} />}
                                  title={tSkills(`skills.${skill.id}.name` as never)}
                                  minutes={skillMinutes[skill.id] ?? 0}
                                  max={MAX_SKILL_MINUTES}
                                  onChange={(minutes) =>
                                    setSkillMinutesFor(skill.id, minutes, setFieldValue)
                                  }
                                  onRemove={
                                    pickedSkills.length > 1
                                      ? () => toggleSkill(skill.id, setFieldValue)
                                      : undefined
                                  }
                                />
                              ))}
                          </div>

                          {/* Always in view: tucked behind a toggle, the habits
                              (which earn points) went unticked. */}
                          <div className='flex flex-col gap-3'>
                            <p className='text-sm font-semibold text-zinc-300'>
                              {t("flow.details")}{" "}
                              <span className='font-normal text-zinc-400'>· {t("optional")}</span>
                            </p>
                            <div className='flex flex-col gap-2'>
                              {isSongMode ? (
                                <DetailRow
                                  icon={<Music />}
                                  label={t("flow.detail_song")}
                                  value={songDetailValue || t("flow.whole_song")}
                                  isSet={songDetailValue.length > 0}
                                  onClick={() => openDetail("song")}
                                />
                              ) : (
                                <DetailRow
                                  icon={<Tags />}
                                  label={t("flow.detail_tags")}
                                  value={values.reportTitle.trim() || t("flow.none")}
                                  isSet={values.reportTitle.trim().length > 0}
                                  onClick={() => openDetail("tags")}
                                />
                              )}
                              <DetailRow
                                icon={<ListChecks />}
                                label={t("flow.detail_habits")}
                                value={
                                  habitCount > 0
                                    ? t("flow.habits_count", {
                                        count: habitCount,
                                        total: healthHabbitsList.length,
                                      })
                                    : t("flow.none")
                                }
                                isSet={habitCount > 0}
                                onClick={() => openDetail("habits")}
                              />
                              <DetailRow
                                icon={<CalendarDays />}
                                label={t("flow.detail_when")}
                                value={dayLabel(values.countBackDays)}
                                isSet={values.countBackDays > 0}
                                onClick={() => openDetail("day")}
                              />
                            </div>
                          </div>

                          {hasErrors && <ErrorBox errors={errors} />}

                          {/* Wide screens save from the summary beside the questions. */}
                          <div className='flex flex-col gap-3 rounded-lg bg-zinc-900/40 p-4 lg:hidden'>
                            <div className='flex items-center gap-4'>
                              <div className='flex w-32 shrink-0 flex-col'>
                                <span className='text-xs font-medium text-zinc-400'>
                                  {t("total_time")}
                                </span>
                                <span className='whitespace-nowrap text-2xl font-bold leading-tight tabular-nums text-zinc-100'>
                                  {formatPracticed(totalMs)}
                                </span>
                              </div>
                              <div className='min-w-0 flex-1'>{saveButton}</div>
                            </div>
                            {!hasTime && (
                              <p className='text-sm text-zinc-400'>{t("flow.add_time_hint")}</p>
                            )}
                          </div>
                        </section>
                      )}
                    </div>

                    {/* The session so far — always in view on wide screens. */}
                    <aside className='hidden lg:block'>
                      <SessionSummary
                        lines={summaryLines}
                        totalMs={totalMs}
                        meta={
                          step === "time"
                            ? {
                                dayLabel: dayLabel(values.countBackDays),
                                habitsLabel: `${t("flow.detail_habits")} · ${t("flow.habits_count", {
                                  count: habitCount,
                                  total: healthHabbitsList.length,
                                })}`,
                                hasHabits: habitCount > 0,
                                onOpenDay: () => openDetail("day"),
                                onOpenHabits: () => openDetail("habits"),
                              }
                            : undefined
                        }
                        footer={
                          step === "time" ? (
                            <>
                              {saveButton}
                              {!hasTime && (
                                <p className='text-sm text-zinc-400'>
                                  {t("flow.add_time_hint")}
                                </p>
                              )}
                            </>
                          ) : undefined
                        }
                      />
                    </aside>
                  </div>
                  )}
                </ReportFormLayout>

                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                  <DialogContent className='dark-theme gap-6 sm:overflow-y-auto'>
                    <DialogHeader className='pr-10 text-left'>
                      <DialogTitle>{detailMeta.title}</DialogTitle>
                      <DialogDescription>{detailMeta.description}</DialogDescription>
                    </DialogHeader>

                    {detail === "song" && (
                      <div className='flex flex-col gap-3'>
                        {pickedSongs.map((song) => (
                          <div
                            key={song.id}
                            className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-4'>
                            <p
                              translate='no'
                              className='truncate text-base font-semibold text-zinc-100'>
                              {song.title}
                            </p>
                            {songArrangementPicker(song)}
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                              <span className='text-sm text-zinc-400'>{t("flow.by_ear")}</span>
                              {songByEarStepper(song)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {detail === "tags" && (
                      <SessionTagPicker
                        title={values.reportTitle}
                        titleError={errors.reportTitle}
                        selectedTags={selectedTags}
                        onTitleChange={(title) => {
                          setSelectedTags([]);
                          setFieldValue("reportTitle", title);
                        }}
                        onToggleTag={(label) => toggleTag(label, setFieldValue)}
                      />
                    )}

                    {detail === "habits" && (
                      <div className='flex flex-col gap-3'>
                        {healthHabbitsList.map(({ name, questionMarkProps, title }) => (
                          <HealthHabbitsBox
                            key={name}
                            name={name}
                            title={title}
                            questionMarkProps={questionMarkProps}
                          />
                        ))}
                      </div>
                    )}

                    {detail === "day" && (
                      <div role='radiogroup' className='flex flex-col gap-2'>
                        {Array.from({ length: MAX_DAYS_BACK + 1 }, (_, days) => days).map(
                          (days) => {
                            const isSelected = values.countBackDays === days;
                            return (
                              <button
                                key={days}
                                type='button'
                                role='radio'
                                aria-checked={isSelected}
                                onClick={() => {
                                  setFieldValue("countBackDays", days);
                                  setIsDetailOpen(false);
                                }}
                                className={cn(
                                  "flex min-h-12 w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  isSelected
                                    ? "bg-zinc-100 text-zinc-950"
                                    : "bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/60"
                                )}>
                                <span className='font-semibold'>{dayLabel(days)}</span>
                                <span
                                  className={cn(
                                    "ml-auto tabular-nums",
                                    isSelected ? "text-zinc-700" : "text-zinc-400"
                                  )}>
                                  {getDateFromPast(days).toLocaleDateString(intlLocale)}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {detail !== "day" && (
                      <DialogFooter>
                        <Button
                          type='button'
                          size='lg'
                          className='sm:min-w-28'
                          onClick={() => setIsDetailOpen(false)}>
                          {t("flow.done")}
                        </Button>
                      </DialogFooter>
                    )}
                  </DialogContent>
                </Dialog>

                <AcceptExceedingPopUp
                  open={acceptPopUpVisible && !!exceedingTime}
                  exceedingTime={exceedingTime || 0}
                  onAccept={() => reportOnSubmit(values)}
                  isFetching={isFetching}
                  setAcceptExceedingTime={setAcceptExceedingTime}
                  setAcceptPopUpVisible={setAcceptPopUpVisible}
                />

                <LongPracticeConfirmPopUp
                  open={longTimePopUpVisible}
                  totalTime={getSumTime(values)}
                  onAccept={() => {
                    setLongTimePopUpVisible(false);
                    reportOnSubmit(values);
                  }}
                  isFetching={isFetching}
                  setAcceptLongTime={setAcceptLongTime}
                  setLongTimePopUpVisible={setLongTimePopUpVisible}
                />
              </>
            );
          }}
        </Formik>
      )}
    </>
  );
};

export default ReportView;
