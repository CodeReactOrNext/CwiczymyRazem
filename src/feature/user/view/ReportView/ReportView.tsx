import { Button } from "assets/components/ui/button";
import { BeginnerMsg } from "components/BeginnerMsg/BeginnerMsg";
import { Input } from "components/UI";
import Backdrop from "components/UI/Backdrop";
import { MAX_DAYS_BACK } from "constants/gameSettings";
import {
  selectCurrentUserStats,
  selectIsFetching,
  selectPreviousUserStats,
  selectRaitingData,
  selectTimerData,
  selectUserAuth,
} from "feature/user/store/userSlice";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { upgradeSkill } from "feature/user/store/userSlice.asyncThunk";
import { Formik } from "formik";
import { AnimatePresence, motion } from "framer-motion";
import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import {
  AcceptExceedingPopUp,
  ErrorBox,
  HealthHabbitsBox,
  InputTime,
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
import { IoMdHand } from "react-icons/io";
import { MdSchool } from "react-icons/md";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
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

  const handleSkillUpgrade = async (skillId: string) => {
    if (!userAuth) return;
    await dispatch(upgradeSkill({ skillId }));
  };

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
    },
    {
      title: i18n?.t("report:theory"),
      questionMarkProps: {
        description: i18n?.t("report:description.theory"),
      },
      Icon: MdSchool,
      hoursName: "theoryHours",
      minutesName: "theoryMinutes",
    },
    {
      title: i18n?.t("report:hearing"),
      questionMarkProps: {
        description: i18n?.t("report:description.hearing"),
      },
      Icon: FaMusic,
      hoursName: "hearingHours",
      minutesName: "hearingMinutes",
    },
    {
      title: i18n?.t("report:creativity"),
      questionMarkProps: {
        description: i18n?.t("report:description.creative"),
      },
      Icon: FaBrain,
      hoursName: "creativityHours",
      minutesName: "creativityMinutes",
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <Formik
        initialValues={formikInitialValues}
        validationSchema={RaportSchema}
        validateOnBlur={false}
        onSubmit={reportOnSubmit}>
        {({ errors, handleSubmit, values }) => (
          <>
            <ReportFormLayout>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}>
                <ReportCategoryWrapper title={t("exercise_type_title")}>
                  <div className='my-5 mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 2xl:gap-12'>
                    {timeInputList.map(
                      (
                        {
                          title,
                          questionMarkProps,
                          Icon,
                          hoursName,
                          minutesName,
                        },
                        index
                      ) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}>
                          <TimeInputBox
                            errors={errors}
                            title={title}
                            questionMarkProps={questionMarkProps}
                            Icon={Icon}
                            hoursName={hoursName}
                            minutesName={minutesName}
                          />
                        </motion.div>
                      )
                    )}
                  </div>
                </ReportCategoryWrapper>
              </motion.div>

              <div className='mt-10 flex w-full flex-col gap-8 px-8 lg:flex-row lg:justify-between'>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className='lg:w-1/2'>
                  <ReportCategoryWrapper title={t("healthy_habits_title")}>
                    <div className='mt-6 flex flex-col  gap-4'>
                      {healthHabbitsList.map(
                        ({ name, questionMarkProps, title }, index) => (
                          <motion.div
                            key={name + index}
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}>
                            <HealthHabbitsBox
                              name={name}
                              title={title}
                              questionMarkProps={questionMarkProps}
                            />
                          </motion.div>
                        )
                      )}
                    </div>
                  </ReportCategoryWrapper>
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className='font-openSans lg:w-[45%]'>
                  <div className='mb-4 rounded-lg border border-second-400/60 bg-second p-6'>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='mb-2 text-lg font-semibold'>
                          {t("sesion_title")}
                        </h3>
                        <p className='text-sm text-secondText'>
                          {t("optional")}*
                        </p>
                        <Input name='reportTitle' />
                        <p className='text-secondTitle mt-2 text-sm'>
                          {t("description.sesion_title")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg border border-second-400/60 bg-second  p-6 '>
                    <div>
                      <h3 className='m-2 text-lg font-semibold'>
                        {t("date_back")}
                      </h3>
                      <div className='flex  gap-4'>
                        <InputTime
                          name={"countBackDays"}
                          description={t("days")}
                        />
                        <div className='text-sm'>
                          <p>{t("add_report_to_day")}</p>
                          <p
                            className={`font-medium ${
                              errors.countBackDays
                                ? "text-error-200"
                                : "text-mainText"
                            }`}>
                            {getDateFromPast(
                              values.countBackDays
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {errors.countBackDays && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className='mt-2  text-sm text-red-400'>
                          <FaTimesCircle className='mr-1 inline' />
                          {t("max_days", { days: MAX_DAYS_BACK })}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className='mt-8 flex flex-col items-center'>
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
                {(!currentUserStats || currentUserStats.points > 0) && (
                  <BeginnerMsg />
                )}

                <Button size='lg' disabled={Object.keys(errors).length !== 0}>
                  {isFetching && <Loader2 className='animate-spin' />}
                  {t("report_button")}
                </Button>
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
                      handleSubmit={handleSubmit}
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
    </motion.div>
  );
};

export default ReportView;
