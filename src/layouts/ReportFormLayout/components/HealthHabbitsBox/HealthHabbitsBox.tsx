import { Card } from "assets/components/ui/card";
import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
import { HABBITS_POINTS_VALUE } from "constants/ratingValue";
import { useField } from "formik";
import { motion } from "framer-motion";
import {
  FaCheck,
  FaDumbbell,
  FaFire,
  FaLightbulb,
  FaMusic,
  FaRecordVinyl,
} from "react-icons/fa";

export interface HealthHabbitsBoxProps {
  title?: string;
  name: string;
  questionMarkProps: QuestionMarkProps;
}

// Function to get appropriate icon based on habit name
const getHabitIcon = (name: string) => {
  switch (name) {
    case "exercise_plan":
      return <FaDumbbell className='text-base' />;
    case "recording":
      return <FaRecordVinyl className='text-base' />;
    case "warmup":
      return <FaFire className='text-base' />;
    case "metronome":
      return <FaMusic className='text-base' />;
    case "new_things":
      return <FaLightbulb className='text-base' />;
    default:
      return <FaLightbulb className='text-base' />;
  }
};

const HealthHabbitsBox = ({
  title,
  questionMarkProps,
  name,
}: HealthHabbitsBoxProps) => {
  const [field, _meta, helpers] = useField("habbits");
  const isActive = field.value.includes(name);
  const HabitIcon = getHabitIcon(name);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const newValue = isActive
      ? field.value.filter((habit: string) => habit !== name)
      : [...field.value, name];
    helpers.setValue(newValue);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Card
        onClick={handleCheckboxClick}
        className={`group relative cursor-pointer overflow-hidden rounded-lg p-0 transition-colors duration-300 ${
          isActive
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/20 backdrop-blur-sm"
            : "bg-zinc-900/30 hover:bg-zinc-900/50"
        }`}>
        <div className='block w-full p-4'>
          <div className='cursor-pointer'>
            <input type='checkbox' checked={isActive} className='peer hidden' />

            <div className='flex items-center gap-3'>
              <div
                className={`
                  flex h-5 w-5 items-center justify-center rounded border
                  transition-colors duration-300
                  ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800/40 text-transparent"
                  }
                `}>
                <FaCheck
                  className={`h-2.5 w-2.5 transition-all duration-300 ${
                    isActive ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                />
              </div>

              <div className='flex flex-grow items-center gap-2'>
                <span
                  className={`transition-colors duration-300 ${
                    isActive
                      ? "text-emerald-400"
                      : "text-zinc-500 group-hover:text-zinc-400"
                  }`}>
                  {HabitIcon}
                </span>
                <p
                  className={`font-sans text-sm font-normal  md:text-sm ${
                    isActive
                      ? "text-zinc-100"
                      : "text-zinc-400 group-hover:text-zinc-300"
                  }`}>
                  {title}
                </p>
                <QuestionMark description={questionMarkProps.description} className="!text-sm opacity-50" />
              </div>

              {isActive && (
                <span
                  key={name + "-points"}
                  className='flex shrink-0 items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 duration-300 animate-in fade-in zoom-in-95 slide-in-from-right-1'>
                  +{HABBITS_POINTS_VALUE}
                  <img
                    src='/images/points.png'
                    alt='points'
                    className='h-3.5 w-3.5 object-contain'
                  />
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default HealthHabbitsBox;
