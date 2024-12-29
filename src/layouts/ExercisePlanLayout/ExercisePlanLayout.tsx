import { useState, useEffect } from "react";
import { FaBrain, FaClock, FaHandPaper, FaMusic, FaFire, FaEllipsisH, FaPlay, FaPause } from "react-icons/fa";
import { SkillsType } from "types/skillsTypes";
import { convertMsToHM } from "utils/converter";
import { motion } from "framer-motion";
import { useDispatch } from 'react-redux';
import { updateTimerTime } from 'feature/user/store/userSlice';
import { useAppDispatch } from "store/hooks";

interface ExercisePlanLayoutProps {
  index: number;
  title: string;
  time: number; // time in minutes
  type: SkillsType;
}

const ExercisePlanLayout = ({
  index,
  title,
  time,
  type,
}: ExercisePlanLayoutProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(time * 60 * 1000);
  const [done, setDone] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1000);
      
      // Update Redux store with current time
      dispatch(updateTimerTime({
        type: type as SkillsType,
        time: (time * 60 * 1000 - timeLeft) / (60 * 1000)
      }));
    }, 1000);

    if (timeLeft <= 0) {
      setIsRunning(false);
      setDone(true);
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, dispatch, time, type]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(!isRunning);
  };

  const getExerciseIcon = () => {
    switch (type) {
      case "technique":
        return <FaHandPaper className="text-blue-400" />;
      case "creativity":
        return <FaBrain className="text-purple-400" />;
      case "hearing":
        return <FaMusic className="text-green-400" />;
      case "theory":
        return <FaBrain className="text-yellow-400" />;
      default:
        return <FaEllipsisH className="text-gray-400" />;
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = ((time * 60 * 1000 - timeLeft) / (time * 60 * 1000)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`m-2 rounded-lg border-2 ${
        done ? "border-green-500/30 bg-green-900/10" : "border-main-opposed-200/70 bg-main-opposed-600"
      } p-4 font-openSans text-sm shadow-lg transition-all hover:shadow-xl`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={done}
            onChange={() => setDone((state) => !state)}
          />
          <span className="text-lg font-medium">
            {index + 1}. {title}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FaClock className={`${isRunning ? "text-red-400" : "text-blue-400"}`} />
            <span className="font-mono">{formatTime(timeLeft)}</span>
            <button
              onClick={handleStart}
              className={`ml-2 rounded-full p-2 ${
                isRunning ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
              } hover:bg-opacity-30`}
            >
              {isRunning ? <FaPause /> : <FaPlay />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {getExerciseIcon()}
            <span className="font-medium">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {isRunning && (
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-gray-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-blue-500"
            />
          </div>
        </div>
      )}

      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-sm text-green-400"
        >
          Ukończone! 🎉
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExercisePlanLayout;
