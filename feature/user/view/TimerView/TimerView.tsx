import { selectTimerData } from "feature/user/store/userSlice";
import MainLayout from "layouts/MainLayout";
import TimerLayout from "layouts/TimerLayout";
import { useAppSelector } from "store/hooks";

const TimerView = () => {
  const timerData = useAppSelector(selectTimerData);
  return (
    <MainLayout subtitle='Timer' variant='secondary'>
      <TimerLayout timerData={timerData} />
    </MainLayout>
  );
};

export default TimerView;
