import { Card } from "assets/components/ui/card";
import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Card
        onClick={handleCheckboxClick}
        className={`group relative cursor-pointer overflow-hidden rounded-xl p-0 transition-all duration-300 hover:shadow-sm ${
          isActive
            ? "bg-emerald-500/5 ring-1 ring-emerald-500/20 backdrop-blur-sm border-white/10"
            : "bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50"
        }`}>
        <div className='block w-full p-4'>
          <div className='cursor-pointer'>
            <input type='checkbox' checked={isActive} className='peer hidden' />

            <div className='flex items-center gap-3'>
              <div
                className={`
                  flex h-5 w-5 items-center justify-center rounded-md border
                  transition-all duration-300
                  ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                      : "border-gray-700/30 bg-black/20 text-transparent"
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
                      : "text-gray-600 group-hover:text-gray-400"
                  }`}>
                  {HabitIcon}
                </span>
                <p
                  className={`font-openSans text-sm font-normal  md:text-sm ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-300"
                  }`}>
                  {title}
                </p>
                <QuestionMark description={questionMarkProps.description} className="!text-sm opacity-50" />
              </div>
            </div>
          </div>

          {isActive && (
            <div className='absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#4a7edd]/30 to-transparent' />
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default HealthHabbitsBox;
