import { selectTimerData } from "feature/user/store/userSlice";

import TimerLayout from "layouts/TimerLayout";
import { useAppSelector } from "store/hooks";

const TimerView = () => {
  const timerData = useAppSelector(selectTimerData);
  return <TimerLayout timerData={timerData} />;
};

export default TimerView;
