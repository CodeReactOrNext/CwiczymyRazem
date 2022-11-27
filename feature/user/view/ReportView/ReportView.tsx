import Backdrop from "components/Backdrop";
import Button from "components/Button";
import RatingPopUp from "components/RatingPopUp";
import MainLayout from "layouts/MainLayout";
import ReportFormLayout from "layouts/ReportFormLayout";
import ReportCategoryLayout from "layouts/ReportFormLayout/components/ReportCategoryLayout";
import { useState } from "react";
import Exercise from "./components/Exercise";

const ReportView = () => {
  const [ratingSummaryVisible, setRatingSummaryVisible] = useState(true);

  return (
    <>
      <MainLayout subtitle='Raportuj' variant='primary'>
        <ReportFormLayout>
          <ReportCategoryLayout title='Wpisz czas spędzony na ćwiczeniach'>
            <Exercise inputId='technic' title='Technika:' />
            <Exercise inputId='theory' title='Teoria:' />
            <Exercise inputId='hearing' title='Słuch:' />
            <Exercise inputId='creative' title='Praca kreatywna:' />
          </ReportCategoryLayout>
          <ReportCategoryLayout title='Zdrowe nawyki'>
            <Exercise
              isCheckbox
              inputId='exercise_plan'
              title='Zrealizowałeś swój plan ćwiczeń?'
            />
            <Exercise
              isCheckbox
              inputId='new_things'
              title='Ćwiczyłeś nowe rzeczy?'
            />
            <Exercise
              isCheckbox
              inputId='warmup'
              title='Wykonałeś rozgrzewkę?'
            />
            <Exercise
              isCheckbox
              inputId='metronome'
              title='Używałeś metronom?'
            />
            <Exercise isCheckbox inputId='recording' title='Nagrywałeś się?' />
          </ReportCategoryLayout>
          <div className='justify-self-center md:col-span-2 lg:col-span-1 xl:col-span-2'>
            <Button>Raportuj</Button>
          </div>
        </ReportFormLayout>
      </MainLayout>
      {ratingSummaryVisible && (
        <Backdrop selector='overlays'>
          <RatingPopUp
            onClick={setRatingSummaryVisible}
            ratingData={{
              basePoints: 34,
              currentLevel: 20,
              bonusPoints: [
                {
                  streak: 4,
                  multiplier: 4,
                },
                {
                  habitsCount: 7,
                  additionalPoints: 5,
                },
                {
                  time: "4:30",
                  multiplier: 4,
                },
              ],
            }}
          />
        </Backdrop>
      )}
    </>
  );
};

export default ReportView;
