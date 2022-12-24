import Backdrop from "components/Backdrop";
import Button from "components/Button";
import RatingPopUp from "components/RatingPopUp";
import MainLayout from "layouts/MainLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ReportCategoryLayout from "layouts/ReportFormLayout/components/ReportCategoryWrapper";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBrain, FaMusic, FaTimesCircle } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { IoMdHand } from "react-icons/io";
import { Checkbox, TimeInputBox } from "layouts/ReportFormLayout/components";
import { Formik } from "formik";
import { makeRatingData } from "../../../../pages/api/report/utils/makeRatingData";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  selectIsFetching,
  selectUserAuth,
  selectCurrentUserStats,
  updateUserStats,
  selectPreviousUserStats,
} from "feature/user/store/userSlice";
import { convertInputTime } from "../../../../pages/api/report/utils/convertInputTime";
import { toast } from "react-toastify";
import { RaportSchema } from "./helpers/RaportShcema";
import ErrorBox from "layouts/ReportFormLayout/components/ErrorBox";
import { ReportDataInterface, ReportFormikInterface } from "./ReportView.types";
import { CircleSpinner } from "react-spinners-kit";

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(false);
  const [ratingSummaryData, setRatingSummaryData] =
    useState<ReportDataInterface | null>(null);

  const { t } = useTranslation("report");
  const dispatch = useAppDispatch();
  const currentUserStats = useAppSelector(selectCurrentUserStats);
  const previousUserStats = useAppSelector(selectPreviousUserStats);
  const userAuth = useAppSelector(selectUserAuth);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const formikInitialValues: ReportFormikInterface = {
    techniqueHours: "",
    techniqueMinutes: "",
    theoryHours: "",
    theoryMinutes: "",
    hearingHours: "",
    hearingMinutes: "",
    creativeHours: "",
    creativeMinutes: "",
    habbits: [],
  };

  const reportOnSubmit = (inputData: ReportFormikInterface) => {
    const { sumTime } = convertInputTime(inputData);

    if (sumTime >= 86400000) {
      toast.error("Nie da się ćwiczyć więcej niż 24 godziny dziennie");
      return;
    }
    if (sumTime === 0) {
      toast.error("Wpisz czas");
      return;
    }
    if (!userAuth) {
      toast.error("Nie jesteś zalogowany");
      return;
    }
    const raiting = makeRatingData(inputData, sumTime);

    dispatch(updateUserStats({ userAuth, inputData })).then(() => {
      setRatingSummaryData(raiting);
      setRatingSummaryVisible(true);
      toast.success("Poprawnie zraportowano");
    });
  };

  return (
    <>
      <MainLayout subtitle={t("subtitlebar_text")} variant='primary'>
        <Formik
          initialValues={formikInitialValues}
          validationSchema={RaportSchema}
          validateOnBlur={false}
          onSubmit={reportOnSubmit}>
          {({ errors }) => (
            <>
              <ReportFormLayout>
                <ReportCategoryLayout title={t("exercise_type_title")}>
                  <div className='m-5 flex flex-row flex-wrap justify-center gap-14  2xl:gap-20'>
                    <TimeInputBox
                      errors={errors}
                      title={t("technique")}
                      questionMarkProps={{
                        description: "Technika",
                      }}
                      Icon={IoMdHand}
                      hoursName={"techniqueHours"}
                      minutesName={"techniqueMinutes"}
                    />
                    <TimeInputBox
                      errors={errors}
                      title={t("theory")}
                      questionMarkProps={{
                        description: "Teoria",
                      }}
                      Icon={MdSchool}
                      hoursName={"theoryHours"}
                      minutesName={"theoryMinutes"}
                    />
                    <TimeInputBox
                      errors={errors}
                      title={t("hearing")}
                      questionMarkProps={{ description: "Słuch" }}
                      Icon={FaMusic}
                      hoursName={"hearingHours"}
                      minutesName={"hearingMinutes"}
                    />
                    <TimeInputBox
                      errors={errors}
                      title={t("creative")}
                      questionMarkProps={{ description: "Kreatywność" }}
                      Icon={FaBrain}
                      hoursName={"creativeHours"}
                      minutesName={"creativeMinutes"}
                    />
                  </div>
                </ReportCategoryLayout>
                <ReportCategoryLayout title={t("healthy_habits_title")}>
                  <Checkbox
                    name='exercise_plan'
                    questionMarkProps={{
                      description: "...",
                    }}
                    title={t("exercise_plan")}
                  />
                  <Checkbox
                    name='new_things'
                    questionMarkProps={{
                      description: "...",
                    }}
                    title={t("new_things")}
                  />
                  <Checkbox
                    name='warmup'
                    questionMarkProps={{
                      description: "...",
                    }}
                    title={t("warmup")}
                  />
                  <Checkbox
                    name='metronome'
                    questionMarkProps={{
                      description: "...",
                    }}
                    title={t("metronome")}
                  />
                  <Checkbox
                    name='recording'
                    questionMarkProps={{
                      description: "...",
                    }}
                    title={t("recording")}
                  />
                </ReportCategoryLayout>
                <div className='flex flex-col items-center justify-self-center md:col-span-2 lg:col-span-1 xl:col-span-2'>
                  <div className='m-2 h-6'>
                    {Object.keys(errors).length !== 0 && <ErrorBox />}
                  </div>
                  <Button type='submit'>
                    {isFetching ? (
                      <div className='px-3'>
                        <CircleSpinner size={24} />
                      </div>
                    ) : (
                      t("report_button")
                    )}
                  </Button>
                </div>
              </ReportFormLayout>
            </>
          )}
        </Formik>
      </MainLayout>
      {ratingSummaryVisible && (
        <Backdrop selector='overlays'>
          <RatingPopUp
            onClick={setRatingSummaryVisible}
            ratingData={ratingSummaryData!}
            currentUserStats={currentUserStats!}
            previousUserStats={previousUserStats!}
          />
        </Backdrop>
      )}
    </>
  );
};

export default ReportView;
