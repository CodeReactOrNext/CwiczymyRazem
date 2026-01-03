import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import Backdrop from "components/UI/Backdrop";
import { MAX_DAYS_BACK } from "constants/gameSettings";
import {
  selectCurrentUserStats,
  selectIsFetching,
  selectPreviousUserStats,
  selectRaitingData,
  selectTimerData,
  selectUserAuth,
  selectUserAvatar,
} from "feature/user/store/userSlice";
import { updateUserStats, updateQuestProgress, checkAndSaveChallengeProgress } from "feature/user/store/userSlice.asyncThunk";
import { Formik } from "formik";
import { motion } from "framer-motion";
import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import {
  AcceptExceedingPopUp,
  ErrorBox,
  HealthHabbitsBox,
  ReportCategoryWrapper,
  TimeInputBox,
} from "layouts/ReportFormLayout/components";
import type { HealthHabbitsBoxProps } from "layouts/ReportFormLayout/components/HealthHabbitsBox/HealthHabbitsBox";
import type { TimeInputBoxProps } from "layouts/ReportFormLayout/components/TimeInputBox/TimeInpuBox";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { i18n } from "next-i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBrain, FaMusic, FaTimesCircle } from "react-icons/fa";
import { GrDocumentUpload } from "react-icons/gr";
import { IoMdHand } from "react-icons/io";
import { MdSchool, MdTitle } from "react-icons/md";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  convertMsToHM,
  convertMsToHMObject,
  getDateFromPast,
  inputTimeConverter,
} from "utils/converter";

import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { isLastReportTimeExceeded } from "./helpers/isLastReportTimeExceeded";
import { RaportSchema } from "./helpers/RaportShcema";
import type { ReportFormikInterface } from "./ReportView.types";

type TimeInputProps = Omit<TimeInputBoxProps, "errors">;

const ReportView = () => {
  const router = useRouter();
  const { songId, songTitle, songArtist, planId, planTitle } = router.query;
  const [view, setView] = useState<'form' | 'success'>('form');
  const [acceptPopUpVisible, setAcceptPopUpVisible] = useState(false);
  const [exceedingTime, setExceedingTime] = useState<number | null>(null);
  const [acceptExceedingTime, setAcceptExceedingTime] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<ReportFormikInterface | null>(null);
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
  const sumTime =
    timerData.creativity +
    timerData.hearing +
    timerData.theory +
    timerData.technique;

  const techniqueTime = convertMsToHMObject(timerData.technique);
  const theoryTime = convertMsToHMObject(timerData.theory);
  const hearingTime = convertMsToHMObject(timerData.hearing);
  const creativityTime = convertMsToHMObject(timerData.creativity);

  const formikInitialValues: ReportFormikInterface = {
    techniqueHours: techniqueTime.hours,
    techniqueMinutes: techniqueTime.minutes,
    theoryHours: theoryTime.hours,
    theoryMinutes: theoryTime.minutes,
    hearingHours: hearingTime.hours,
    hearingMinutes: hearingTime.minutes,
    creativityHours: creativityTime.hours,
    creativityMinutes: creativityTime.minutes,
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

    await dispatch(updateUserStats({ inputData }));
    await dispatch(checkAndSaveChallengeProgress());
    
    // Quest Trigger
    if (inputData.habbits && inputData.habbits.length >= 2) {
        dispatch(updateQuestProgress({ type: 'healthy_habits', amount: 2 }));
    }

    if (inputData.planId) {
        dispatch(updateQuestProgress({ type: 'practice_plan' }));
        if (inputData.planId.startsWith('auto')) {
            dispatch(updateQuestProgress({ type: 'auto_plan' }));
        }
    }

    setSubmittedValues(inputData);
    setAcceptPopUpVisible(false);
    setView('success');
  };

  useEffect(() => {
    if (sumTime) {
      toast.info(t("toast.stoper_entered"), {
        duration: 3000,
      });
    }
  }, [sumTime, t]);

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
          skillPointsGained={raitingData.skillPointsGained}
          activityData={activityDataToUse}
        />
      ) : (
        <Formik
          initialValues={formikInitialValues}
          validationSchema={RaportSchema}
          validateOnBlur={false}
          enableReinitialize={true}
          onSubmit={reportOnSubmit}>
          {({ errors, handleSubmit, values, setFieldValue }) => (
            <>
              <ReportFormLayout>

                {/* STEP 1: TIME TRACKING */}
                <div className='mb-12'>
                  <div className='mb-6 flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-sm border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]'>1</div>
                    <h3 className='font-openSans text-lg font-bold text-white'>
                      {t("exercise_type_title")}
                    </h3>
                  </div>
                  
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
                  <div className='mt-4 flex flex-col items-end gap-2'>
                    {sumTime > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
                      >
                        <div className="relative">
                          <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          Synced from Timer
                        </span>
                      </motion.div>
                    )}
                    <div className='flex items-center radius-default glass-card px-4 py-2 ring-1 ring-white/5 bg-zinc-900/40'>
                      <span className='mr-3 text-sm font-bold uppercase tracking-wider text-zinc-500'>
                        {t("total_time")}:
                      </span>
                      <span className='font-mono text-2xl font-black text-white'>
                         {convertMsToHM(getSumTime(values))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* STEP 2: FOCUS & DETAILS */}
                <div className='mb-12'>
                  <div className='mb-6 flex items-center gap-3 border-t border-white/5 pt-12'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-sm border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'>2</div>
                    <h3 className='font-openSans text-lg font-bold text-white'>
                       Session Focus & Habits
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* Left: Goals & Title */}
                     <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                        <div className='space-y-4 rounded-2xl bg-zinc-900/30 p-6 border border-white/5'>
                          <label className='font-openSans text-sm font-bold uppercase tracking-wider text-zinc-400'>
                            Session Headline
                          </label>
                          <div className='relative'>
                            <Input
                              name='reportTitle'
                              startIcon={<MdTitle className='text-lg text-cyan-500/50' />}
                              placeholder='e.g. Practicing major scales'
                              className='h-12 border-white/10 bg-zinc-950/50 text-base shadow-sm focus:border-cyan-500/30'
                              value={values.reportTitle}
                              onChange={(e) => setFieldValue("reportTitle", e.target.value)}
                            />
                          </div>
                          
                          <div className='space-y-3 pt-2'>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Quick focus tags:</p>
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

                     {/* Right: Habits */}
                     <div className="lg:col-span-12 xl:col-span-5 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Check fulfilled habits:</p>
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

                {/* STEP 3: LOGGING */}
                <div className='mb-8 border-t border-white/5 pt-12'>
                  <div className='mb-6 flex items-center gap-3'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 font-bold text-sm border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'>3</div>
                    <h3 className='font-openSans text-lg font-bold text-white'>
                       Finalize Log
                    </h3>
                  </div>

                  <div className='flex flex-col items-center gap-8 rounded-3xl bg-zinc-900/20 p-8 border border-white/5'>
                    <div className='flex flex-col items-center gap-4'>
                      <p className='text-xs font-bold uppercase tracking-widest text-zinc-500'>When did this happen?</p>
                      <div className='flex flex-wrap items-center justify-center gap-3'>
                        {[0, 1, 2, 3, 4].map((days) => {
                          const isSelected = values.countBackDays === days;
                          let label = days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;

                          return (
                            <Button
                              key={days}
                              type='button'
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => setFieldValue("countBackDays", days)}
                              className={`relative rounded-full border px-6 transition-all ${
                                isSelected
                                  ? "border-transparent bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] font-black"
                                  : "border-white/10 bg-zinc-900/50 text-zinc-400 hover:text-white"
                              }`}>
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
                      {Object.keys(errors).length !== 0 && <ErrorBox />}
                      <Button
                        size='lg'
                        type='submit'
                        disabled={Object.keys(errors).length !== 0}
                        className='h-14 min-w-[240px] rounded-2xl bg-white text-black font-black text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl disabled:opacity-50'>
                        {isFetching ? (
                          <Loader2 className='mr-2 h-6 w-6 animate-spin' />
                        ) : (
                          <GrDocumentUpload className='mr-3 h-6 w-6' />
                        )}
                        {t("report_button")}
                      </Button>
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
          )}
        </Formik>
      )}
    </>
  );
};

export default ReportView;
