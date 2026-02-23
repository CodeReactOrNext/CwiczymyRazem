import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import Backdrop from "components/UI/Backdrop";
import {
  selectCurrentUserStats,
  selectIsFetching,
  selectPreviousUserStats,
  selectRaitingData,
  selectTimerData,
  selectUserAuth,
  selectUserAvatar,
} from "feature/user/store/userSlice";
import { updateQuestProgress, updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { Formik } from "formik";
import { useTranslation } from "hooks/useTranslation";
import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import {
  AcceptExceedingPopUp,
  ErrorBox,
  HealthHabbitsBox,
  TimeInputBox,
} from "layouts/ReportFormLayout/components";
import type { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";
import type { TimeInputBoxProps } from "layouts/ReportFormLayout/components/TimeInputBox/TimeInpuBox";
import { ArrowDown, Check } from "lucide-react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { useState } from "react";
import { FaBrain, FaMusic } from "react-icons/fa";
import { IoMdHand } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  convertMsToHM,
  convertMsToHMObject,
  getDateFromPast,
  inputTimeConverter,
} from "utils/converter";
import { i18n } from "utils/translation";

import { isLastReportTimeExceeded } from "./helpers/isLastReportTimeExceeded";
import { RaportSchema } from "./helpers/RaportShcema";
import type { ReportFormikInterface } from "./ReportView.types";
import SavedTimeBanner from "./SavedTimeBanner";

type TimeInputProps = Omit<TimeInputBoxProps, "errors">;

const ReportView = () => {
  const router = useRouter();
  const { songId, songTitle, songArtist, planId, planTitle, applyTimer } = router.query;
  const [view, setView] = useState<'form' | 'success'>('form');
  const [acceptPopUpVisible, setAcceptPopUpVisible] = useState(false);
  const [exceedingTime, setExceedingTime] = useState<number | null>(null);
  const [acceptExceedingTime, setAcceptExceedingTime] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<ReportFormikInterface | null>(null);
  const [savedTimeApplied, setSavedTimeApplied] = useState(false);
  const autoApplyTimer = applyTimer === "true";
  const { t } = useTranslation("report");

  const dispatch = useAppDispatch();
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const raitingData = useAppSelector(selectRaitingData);
  const avatar = useAppSelector(selectUserAvatar);
  const userAuth = useAppSelector(selectUserAuth);
  const timerData = useAppSelector(selectTimerData);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const { reportList } = useActivityLog(userAuth as string);
  const savedTimerSum =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const hasSavedTime = savedTimerSum > 0 && !savedTimeApplied && !autoApplyTimer;

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

  const timeInputList: TimeInputProps[] = [
    {
      title: i18n?.t("report:technique"),
      questionMarkProps: {
        description: i18n?.t("report:description.technique"),
      },
      Icon: IoMdHand,
      hoursName: "techniqueHours",
      minutesName: "techniqueMinutes",
      skillId: "technique",
    },
    {
      title: i18n?.t("report:theory"),
      questionMarkProps: {
        description: i18n?.t("report:description.theory"),
      },
      Icon: MdSchool,
      hoursName: "theoryHours",
      minutesName: "theoryMinutes",
      skillId: "theory",
    },
    {
      title: i18n?.t("report:hearing"),
      questionMarkProps: {
        description: i18n?.t("report:description.hearing"),
      },
      Icon: FaMusic,
      hoursName: "hearingHours",
      minutesName: "hearingMinutes",
      skillId: "hearing",
    },
    {
      title: i18n?.t("report:creativity"),
      questionMarkProps: {
        description: i18n?.t("report:description.creative"),
      },
      Icon: FaBrain,
      hoursName: "creativityHours",
      minutesName: "creativityMinutes",
      skillId: "creativity",
    },
  ];

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

  const reportOnSubmit = async (inputData: ReportFormikInterface) => {
    const sumTime = getSumTime(inputData);
    const lastReportTimeExceded = isLastReportTimeExceeded(
      currentUserStats!.lastReportDate,
      sumTime
    );

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

    if (lastReportTimeExceded && !acceptExceedingTime) {
      setAcceptPopUpVisible(true);
      setExceedingTime(lastReportTimeExceded);
      return;
    }

    if (isFetching) return;

    await dispatch(updateUserStats({ inputData }));
    
    // Quest Trigger
    if (inputData.habbits && inputData.habbits.length >= 2) {
        dispatch(updateQuestProgress({ type: 'healthy_habits', amount: 2 }));
    }

    if (inputData.planId) {
        dispatch(updateQuestProgress({ type: 'practice_plan' }));
        if (inputData.planId.startsWith('auto')) {
            dispatch(updateQuestProgress({ type: 'auto_plan' }));
        }

        // Handle specific exercise quests
        // Case 1: Started from Library (prefix 'exercise-')
        if (inputData.planId.startsWith('exercise-')) {
            const exerciseId = inputData.planId.replace('exercise-', '');
            dispatch(updateQuestProgress({ type: 'practice_specific_exercise', exerciseId, amount: 1 }));
        } 
        // Case 2: Started from Skill Dashboard / Daily Quest (no prefix, planId is exerciseId)
        else {
            dispatch(updateQuestProgress({ type: 'practice_specific_exercise', exerciseId: inputData.planId, amount: 1 }));
        }
    }

    const totalMinutes = Math.floor(sumTime / 60000);
    if (totalMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_total_time', amount: totalMinutes }));
    }

    const techMinutes = Number(inputData.techniqueHours || 0) * 60 + Number(inputData.techniqueMinutes || 0);
    if (techMinutes > 0) {
        dispatch(updateQuestProgress({ type: 'practice_technique_time', amount: techMinutes }));
    }

    const totalMinutesForCapture =
      Number(inputData.techniqueHours || 0) * 60 + Number(inputData.techniqueMinutes || 0) +
      Number(inputData.theoryHours || 0) * 60 + Number(inputData.theoryMinutes || 0) +
      Number(inputData.hearingHours || 0) * 60 + Number(inputData.hearingMinutes || 0) +
      Number(inputData.creativityHours || 0) * 60 + Number(inputData.creativityMinutes || 0);
    posthog.capture("practice_session_completed", {
      total_minutes: totalMinutesForCapture,
      has_song: !!inputData.songTitle,
      has_plan: !!inputData.planId,
      habit_count: inputData.habbits?.length ?? 0,
    });

    setSubmittedValues(inputData);
    setAcceptPopUpVisible(false);
    setView('success');
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
          onClick={() => setView('form')}
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
            const isStep1Done = getSumTime(values) > 0;
            const isStep2Completed = values.reportTitle.trim().length > 0 || (values.habbits && values.habbits.length > 0);

            return (
              <>
                <ReportFormLayout>
                  {/* STEP 1: TIME TRACKING */}
                  <div className='mb-12'>
                    <div className='mb-8 flex flex-col gap-2'>
                        <div className='flex items-center gap-3'>
                          <div className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm border transition-all duration-500',
                            isStep1Done ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/20"
                          )}>
                            {isStep1Done ? <Check className="h-5 w-5 stroke-[3]" /> : "1"}
                          </div>
                          <div className="flex-1">
                            <h3 className='font-openSans text-xl font-bold text-white'>
                              {t("exercise_type_title")}
                            </h3>
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm font-medium transition-colors duration-500 ml-12",
                          isStep1Done ? "text-emerald-400/80" : "text-zinc-500"
                        )}>
                          {isStep1Done 
                            ? "Great! Practice time added. You can save now or fill optional details below." 
                            : "What did you practice today? Add time below."}
                        </p>
                    </div>
                    
                    {hasSavedTime && (
                      <SavedTimeBanner
                        timerData={timerData}
                        onApply={() => applySavedTime(setFieldValue)}
                        onDismiss={() => setSavedTimeApplied(true)}
                      />
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                      {timeInputList.map(
                        (
                          { title, questionMarkProps, Icon, hoursName, minutesName, skillId },
                          index
                        ) => (
                          <div key={index}>
                            <TimeInputBox
                              errors={errors}
                              title={title}
                              questionMarkProps={questionMarkProps}
                              Icon={Icon}
                              hoursName={hoursName}
                              minutesName={minutesName}
                              skillId={skillId}
                            />
                          </div>
                        )
                      )}
                    </div>
                    <div className='mt-8 pt-8 border-t border-white/5'>
                      <div className="flex flex-col items-center md:items-end gap-4">
                        <div className='flex items-center rounded-2xl border border-white/10 bg-zinc-900/60 p-1 px-4 py-2 shadow-2xl backdrop-blur-md'>
                          <div className="flex flex-col items-start mr-6">
                            <span className='text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-0.5'>
                              {t("total_time")}
                            </span>
                            <span className='font-mono text-2xl font-black text-white leading-none'>
                               {convertMsToHM(getSumTime(values))}
                            </span>
                          </div>

                          {isStep1Done && (
                            <Button
                              type='submit'
                              loading={isFetching}
                              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all animate-in zoom-in-95 duration-300"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Save Now
                            </Button>
                          )}
                        </div>

                        {isStep1Done ? (
                          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-700 pr-4 mt-2">
                             <p className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.15em]">
                                Or add more details below
                             </p>
                             <ArrowDown className="h-5 w-5 text-emerald-500 animate-bounce" />
                          </div>
                        ) : (
                          <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest italic pr-4 mt-2">Complete Step 1 to continue</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: FOCUS & DETAILS (OPTIONAL) */}
                  <div className={cn('mb-12 transition-all duration-500', !isStep1Done ? "opacity-30 grayscale pointer-events-none" : "opacity-100")}>
                    <div className='mb-6 flex items-center gap-3 border-t border-white/5 pt-12'>
                      <div className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm border transition-all duration-500',
                        isStep2Completed
                          ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                          : isStep1Done
                            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/20"
                            : "bg-zinc-800 text-zinc-500 border-white/5"
                      )}>
                         {isStep2Completed ? <Check className="h-5 w-5 stroke-[3]" /> : "2"}
                      </div>
                      <div className="flex items-baseline gap-3">
                        <h3 className='font-openSans text-xl font-bold text-white tracking-tight'>
                           Session focus & habits
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">Optional</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                        <div className='space-y-4'>
                          <div className="flex items-center justify-between">
                            <label className='font-openSans text-sm font-bold text-zinc-400'>
                              Session title
                            </label>
                          </div>
                          <div className='relative'>
                            <Input
                              name='reportTitle'
                              placeholder='e.g. Practicing major scales'
                              className={`h-11 border-white/10 bg-zinc-900/40 text-sm shadow-sm focus:border-cyan-500/30 ${errors.reportTitle ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}
                              value={values.reportTitle}
                              onChange={(e) => setFieldValue("reportTitle", e.target.value)}
                            />
                            {errors.reportTitle && (
                              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                                {errors.reportTitle}
                              </p>
                            )}
                          </div>
                          
                          <div className='space-y-3 pt-2'>
                            <div className='flex flex-wrap gap-2'>
                                {[
                                  { label: "Warmup", icon: "🎸", cat: "basic" },
                                  { label: "Technique", icon: "⚡", cat: "basic" },
                                  { label: "New Song", icon: "🎵", cat: "creative" },
                                  { label: "Theory", icon: "📚", cat: "theory" },
                                  { label: "Improvisation", icon: "✨", cat: "creative" },
                                  { label: "Ear Training", icon: "👂", cat: "theory" },
                                  { label: "Song Writing", icon: "✍️", cat: "creative" },
                                  { label: "Speed Building", icon: "🏎️", cat: "basic" },
                                  { label: "Jamming", icon: "🔊", cat: "creative" },
                                  { label: "Night practice", icon: "🌙", cat: "basic" }
                                ].map((tag) => (
                                  <button
                                    key={tag.label}
                                    type="button"
                                    onClick={() => setFieldValue("reportTitle", tag.label)}
                                    className="group flex items-center gap-1.5 rounded-lg border border-white/5 bg-zinc-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400"
                                  >
                                    <span className="opacity-70 group-hover:opacity-100">{tag.icon}</span>
                                    {tag.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                       </div>

                       <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                          <div className="flex flex-col px-1">
                            <p className="text-lg font-bold text-zinc-300">Habits checklist</p>
                          </div>
                          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1'>
                            {healthHabbitsList.map(
                              ({ name, questionMarkProps, title }, index) => (
                                <HealthHabbitsBox
                                  key={name + index}
                                  name={name}
                                  title={title}
                                  questionMarkProps={questionMarkProps}
                                />
                              )
                            )}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* STEP 3: LOGGING (OPTIONAL DETAILS) */}
                  <div className={cn('scroll-mt-24 transition-all duration-500', !isStep1Done ? "opacity-30 grayscale pointer-events-none" : "opacity-100")}>
                    <div className="mb-8 border-t border-white/5 pt-12">
                      <div className='mb-6 flex items-center gap-3'>
                        <div className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full font-bold text-sm border transition-all duration-500',
                          isStep1Done 
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" 
                            : "bg-zinc-800 text-zinc-500 border-white/5"
                        )}>3</div>
                        <div className="flex items-baseline gap-3">
                          <h3 className='font-openSans text-lg font-bold text-white'>
                             Finalize Log
                          </h3>
                          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">Optional Details</span>
                        </div>
                      </div>

                      <div className='flex flex-col items-center gap-8 py-4'>
                          <div className='flex flex-col items-center gap-4'>
                            <p className='text-xs font-bold uppercase tracking-widest text-zinc-500'>When did this happen?</p>
                            <div className='flex flex-wrap items-center justify-center gap-3'>
                              {[0, 1, 2, 3, 4].map((days) => {
                                const isSelected = values.countBackDays === days;
                                let label = (days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`);

                                return (
                                  <Button
                                    key={days}
                                    type='button'
                                    variant={isSelected ? "default" : "outline"}
                                    onClick={() => setFieldValue("countBackDays", days)}
                                    className={cn(
                                      "relative rounded-full border px-6 transition-all",
                                      isSelected
                                        ? "border-transparent bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] font-black"
                                        : "border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white"
                                    )}>
                                    {label}
                                  </Button>
                                );
                              })}
                            </div>
                            <p className='text-xs font-medium text-zinc-600'>
                              Selected: <span className="text-zinc-300">{getDateFromPast(values.countBackDays).toLocaleDateString()}</span>
                            </p>
                          </div>

                          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

                          <div className='flex flex-col items-center gap-4'>
                            {Object.keys(errors).length !== 0 && <ErrorBox errors={errors} />}
                            <Button
                              size='lg'
                              type='submit'
                              loading={isFetching}
                              disabled={Object.keys(errors).length !== 0 || !isStep1Done}
                              className='h-14 min-w-[280px] rounded-2xl bg-white text-black font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50'>
                              <div className="flex items-center gap-2">
                                <Check className='h-6 w-6 text-emerald-600' />
                                <span>{isFetching ? "Saving..." : "Finish & Save Practice"}</span>
                              </div>
                            </Button>
                          </div>
                      </div>
                    </div>
                  </div>
                </ReportFormLayout>

                {acceptPopUpVisible && exceedingTime && (
                  <Backdrop selector='overlays'>
                    <div>
                      <AcceptExceedingPopUp
                        exceedingTime={exceedingTime}
                        onAccept={() => reportOnSubmit(values)}
                        isFetching={isFetching}
                        setAcceptExceedingTime={setAcceptExceedingTime}
                        setAcceptPopUpVisible={setAcceptPopUpVisible}
                      />
                    </div>
                  </Backdrop>
                )}
              </>
            );
          }}
        </Formik>
      )}
    </>
  );
};

export default ReportView;
