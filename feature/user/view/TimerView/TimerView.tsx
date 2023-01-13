import TimerLayout from "layouts/TimerLayout";

import { useAppSelector } from "store/hooks";
import { selectTimerData } from "feature/user/store/userSlice";

const TimerView = () => {
  const timerData = useAppSelector(selectTimerData);
  return <TimerLayout timerData={timerData} />;
};

export default TimerView;
