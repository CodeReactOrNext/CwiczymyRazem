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
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { Formik } from "formik";
import { AnimatePresence, motion } from "framer-motion";
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

import { isLastReportTimeExceeded } from "./helpers/isLastReportTimeExceeded";
import { RaportSchema } from "./helpers/RaportShcema";
import type { ReportFormikInterface } from "./ReportView.types";

type TimeInputProps = Omit<TimeInputBoxProps, "errors">;

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(false);
  const [acceptPopUpVisible, setAcceptPopUpVisible] = useState(false);
  const [exceedingTime, setExceedingTime] = useState<number | null>(null);
  const [acceptExceedingTime, setAcceptExceedingTime] = useState(false);
  const { t } = useTranslation("report");

  const dispatch = useAppDispatch();
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const raitingData = useAppSelector(selectRaitingData);
  const avatar = useAppSelector(selectUserAvatar);
  const userAuth = useAppSelector(selectUserAuth);
  const timerData = useAppSelector(selectTimerData);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
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
    reportTitle: "",
    avatarUrl: avatar ?? null,
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
    setAcceptPopUpVisible(false);
    setRatingSummaryVisible(true);
  };

  useEffect(() => {
    if (sumTime) {
      toast.info(t("toast.stoper_entered"), {
        duration: 3000,
      });
    }
  }, [sumTime, t]);

  return (
    <Formik
      initialValues={formikInitialValues}
      validationSchema={RaportSchema}
      validateOnBlur={false}
      enableReinitialize={true}
      onSubmit={reportOnSubmit}>
      {({ errors, handleSubmit, values, setFieldValue }) => (
        <>
          <ReportFormLayout>

            <div className='mb-8'>
              <h3 className='font-openSans mb-4  text-sm font-medium text-white'>
                {t("exercise_type_title")}
              </h3>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {timeInputList.map(
                  (
                    { title, questionMarkProps, Icon, hoursName, minutesName, skillId },
                    index
                  ) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                      }}>
                      <TimeInputBox
                        errors={errors}
                        title={title}
                        questionMarkProps={questionMarkProps}
                        Icon={Icon}
                        hoursName={hoursName}
                        minutesName={minutesName}
                        skillId={skillId}
                      />
                    </motion.div>
                  )
                )}
              </div>
              <div className='mt-4 flex justify-end'>
                <div className='flex items-center radius-default glass-card px-4 py-2'>
                  <span className='mr-2 text-sm text-zinc-400'>
                    {t("total_time")}:
                  </span>
                  <span className='font-mono text-lg font-bold text-cyan-400'>
                    {convertMsToHM(getSumTime(values))}
                  </span>
                </div>
              </div>
            </div>

            {/* Healthy Habits Section */}
            <div className='mb-8'>
              <h3 className='font-openSans mb-4 text-lg  font-medium text-white'>
                {t("healthy_habits_title")}
              </h3>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {healthHabbitsList.map(
                  ({ name, questionMarkProps, title }, index) => (
                    <motion.div
                      key={name + index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                      }}>
                      <HealthHabbitsBox
                        name={name}
                        title={title}
                        questionMarkProps={questionMarkProps}
                      />
                    </motion.div>
                  )
                )}
              </div>
            </div>

            {/* Session Title Section */}
            <div className='mb-8'>
              <h3 className='font-openSans mb-4  text-lg font-medium text-white'>
                {t("sesion_title")}
              </h3>
              <div className='space-y-3'>
                <div className='relative max-w-[600px]'>
                  <Input
                    name='reportTitle'
                    startIcon={
                      <MdTitle className='text-lg text-[#4a7edd]/50' />
                    }
                    placeholder='Title your session'
                    className='border-gray-700/50 bg-[#0a0a0c]/60 py-2.5 text-base text-white placeholder:text-gray-500 focus:border-[#4a7edd]/40 hover:border-gray-600'
                    value={values.reportTitle}
                    onChange={(e) =>
                      setFieldValue("reportTitle", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Date Selection Section */}
            <div className='mb-8'>
              <h3 className='font-openSans mb-4  text-lg font-medium text-white'>
                When did you practice?
              </h3>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-wrap items-start justify-start gap-3'>
                  {[0, 1, 2, 3, 4].map((days) => {
                    const isSelected = values.countBackDays === days;
                    let label =
                      days === 0
                        ? "Today"
                        : days === 1
                        ? "Yesterday"
                        : `${days} days ago`;

                    return (
                      <motion.div
                        key={days}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}>
                        <Button
                          type='button'
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => {
                            setFieldValue("countBackDays", days);
                          }}
                          className={`relative rounded-full border px-5 py-2 transition-background ${
                            isSelected
                              ? "border-transparent bg-gradient-to-r from-cyan-600/90 to-cyan-500/90 text-white shadow-sm backdrop-blur-sm"
                              : "border-white/5 bg-zinc-900/40 text-gray-300 hover:glass-card-hover hover:text-white"
                          }`}>
                          {isSelected && (
                            <motion.span
                              className='absolute inset-0 rounded-full bg-[#4a7edd]/20 blur-sm'
                              layoutId='dateSelection'
                            />
                          )}
                          <span className='relative z-10'>{label}</span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>

                <div className='flex items-start justify-start'>
                  <Card className='border-0 bg-gradient-to-r from-cyan-500/5 to-transparent px-4 py-2 text-left shadow-sm glass-card radius-default transition-all duration-300'>
                    <p className='font-openSans text-sm text-gray-400'>
                      Selected date:{" "}
                      <span className='text-base font-medium text-white'>
                        {getDateFromPast(
                          values.countBackDays
                        ).toLocaleDateString()}
                      </span>
                    </p>
                  </Card>
                </div>
              </div>
              {errors.countBackDays && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='mt-2 text-center text-sm text-red-400'>
                  <FaTimesCircle className='mr-1 inline' />
                  {t("max_days", { days: MAX_DAYS_BACK })}
                </motion.p>
              )}
            </div>

            {/* Submit Button Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className='mt-6 flex flex-col items-center'>
              <AnimatePresence>
                {Object.keys(errors).length !== 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className='mb-4'>
                    <ErrorBox />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className='flex flex-col items-center gap-4'>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className='relative'>
                  <Button
                    size='lg'
                    type='submit'
                    disabled={Object.keys(errors).length !== 0}
                    className='relative'>
                    {isFetching ? (
                      <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    ) : (
                      <GrDocumentUpload className='mr-2 h-5 w-5' />
                    )}

                    {t("report_button")}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </ReportFormLayout>

          <AnimatePresence>
            {acceptPopUpVisible && exceedingTime && (
              <Backdrop selector='overlays'>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}>
                  <AcceptExceedingPopUp
                    exceedingTime={exceedingTime}
                    onAccept={() => reportOnSubmit(values)}
                    isFetching={isFetching}
                    setAcceptExceedingTime={setAcceptExceedingTime}
                    setAcceptPopUpVisible={setAcceptPopUpVisible}
                  />
                </motion.div>
              </Backdrop>
            )}

            {ratingSummaryVisible &&
              raitingData &&
              currentUserStats &&
              previousUserStats && (
                <Backdrop selector='overlays'>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}>
                    <RatingPopUpLayout
                      onClick={setRatingSummaryVisible}
                      ratingData={raitingData}
                      currentUserStats={currentUserStats}
                      previousUserStats={previousUserStats}
                      skillPointsGained={raitingData.skillPointsGained}
                    />
                  </motion.div>
                </Backdrop>
              )}
          </AnimatePresence>
        </>
      )}
    </Formik>
  );
};

export default ReportView;
