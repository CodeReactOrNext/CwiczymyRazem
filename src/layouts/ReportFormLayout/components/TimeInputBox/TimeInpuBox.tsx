import { Card } from "assets/components/ui/card";
import {
  WheelPicker,
  WheelPickerOption,
} from "assets/components/wheel-picker";
import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { FormikErrors } from "formik";
import { useFormikContext } from "formik";
import { motion } from "framer-motion";
import { useState } from "react";
import type { IconType } from "react-icons/lib";

export interface TimeInputBoxProps {
  title?: string;
  Icon: IconType;
  questionMarkProps: QuestionMarkProps;
  hoursName: string;
  minutesName: string;
  skillId?: string;
  errors: FormikErrors<ReportFormikInterface>;
}

const createArray = (length: number): WheelPickerOption[] =>
  Array.from({ length }, (_, i) => {
    return {
      label: i.toString().padStart(2, "0"),
      value: i.toString(),
    };
  });

const hourOptions = createArray(24);
const minuteOptions = createArray(60);

const TimeInputBox = ({
  title,
  Icon,
  questionMarkProps,
  hoursName,
  minutesName,
  skillId,
  errors,
}: TimeInputBoxProps) => {
  const { values, setFieldValue } = useFormikContext<ReportFormikInterface>();
  const [isHovered, setIsHovered] = useState(false);
  const error =
    errors.hasOwnProperty(hoursName) || errors.hasOwnProperty(minutesName);

  const hoursValue =
    (values[hoursName as keyof ReportFormikInterface] as number) || 0;
  const minutesValue =
    (values[minutesName as keyof ReportFormikInterface] as number) || 0;

  // Check if this time input has any value entered
  const hasValue = hoursValue > 0 || minutesValue > 0;

  const getSkillColor = () => {
    switch (skillId) {
      case "creativity":
        return "#37b874";
      case "hearing":
        return "#4a7edd";
      case "technique":
        return "#e04c3b";
      case "theory":
        return "#a44aed";
      default:
        return "#888888";
    }
  };

  const skillColor = getSkillColor();

  const getGradientStyle = () => {
    if (!hasValue) {
      return "from-gray-900/20 to-transparent";
    }

    switch (skillId) {
      case "creativity":
        return "from-[#37b87410] via-[#37b87420] to-transparent";
      case "hearing":
        return "from-[#4a7edd10] via-[#4a7edd20] to-transparent";
      case "technique":
        return "from-[#e04c3b10] via-[#e04c3b20] to-transparent";
      case "theory":
        return "from-[#a44aed10] via-[#a44aed20] to-transparent";
      default:
        return "from-gray-800 via-gray-900 to-transparent";
    }
  };

  return (
    <Card
      className={`overflow-hidden p-0 transition-all duration-300 hover:shadow-lg ${
        error
          ? "ring-error-300 ring-1"
          : hasValue
          ? "ring-1 ring-gray-700/30"
          : "hover:ring-1 hover:ring-gray-700/40"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div
        className={`relative flex h-full flex-col bg-gradient-to-br p-5 transition-all duration-300 ${getGradientStyle()}`}
        style={{
          boxShadow: error ? "0 0 5px 0 var(--error-200)" : "none",
        }}>
        {/* Apple-style glass gradient bar at top - only show when has value */}
        {hasValue && (
          <div
            className='absolute left-0 right-0 top-0 h-1.5 opacity-30'
            style={{
              background: `linear-gradient(90deg, transparent, ${skillColor}, transparent)`,
            }}
          />
        )}

        <div className='relative mb-5 flex items-center gap-4'>
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.3 }}
            className={`flex h-12 w-12 items-center justify-center rounded-full opacity-90 ${
              hasValue ? "" : "opacity-60"
            }`}
            style={{
              background: hasValue
                ? `linear-gradient(135deg, ${skillColor}20, ${skillColor}10)`
                : "linear-gradient(135deg, #33333320, #22222210)",
              border: hasValue
                ? `1px solid ${skillColor}30`
                : "1px solid #33333330",
              boxShadow:
                isHovered && hasValue ? `0 0 15px ${skillColor}30` : "none",
            }}>
            <Icon
              className='text-2xl'
              style={{ color: hasValue ? skillColor : "#666666" }}
            />
          </motion.div>
          <div className='flex items-center gap-1.5'>
            <span
              className={`md:text-md font-openSans text-sm ${
                hasValue ? "text-white" : "text-gray-400"
              }`}>
              {title}
            </span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}>
              <QuestionMark description={questionMarkProps.description} />
            </div>
          </div>
        </div>

        <div className='mt-auto flex w-full items-center justify-center gap-3'>
          <div className='mx-auto flex w-full max-w-[300px] items-center justify-center gap-4'>
            {/* Hours */}
            <div className='flex flex-1 flex-col items-center gap-2'>
              <div className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-900/40 ring-1 ring-white/10 backdrop-blur-sm">
                <WheelPicker
                  options={hourOptions}
                  value={hoursValue.toString()}
                  onValueChange={(value) =>
                    setFieldValue(hoursName, parseInt(value, 10))
                  }
                  infinite
                  classNames={{
                      optionItem: "text-zinc-500 text-lg font-medium cursor-pointer transition-colors",
                      highlightWrapper: "bg-white/5 text-white text-xl font-bold backdrop-blur-md"
                  }}
                />
              </div>
              <span className='text-[10px] font-bold tracking-wider text-slate-500'>
                GODZ
              </span>
            </div>

            <span className='mb-6 text-2xl font-medium text-slate-500/50'>
              :
            </span>

            {/* Minutes */}
            <div className='flex flex-1 flex-col items-center gap-2'>
              <div className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-900/40 ring-1 ring-white/10 backdrop-blur-sm">
                <WheelPicker
                  options={minuteOptions}
                  value={minutesValue.toString()}
                  onValueChange={(value) =>
                    setFieldValue(minutesName, parseInt(value, 10))
                  }
                  infinite
                    classNames={{
                      optionItem: "text-zinc-500 text-lg font-medium cursor-pointer transition-colors",
                      highlightWrapper: "bg-white/5 text-white text-xl font-bold backdrop-blur-md"
                  }}
                />
              </div>
              <span className='text-[10px] font-bold tracking-wider text-slate-500'>
                MIN
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TimeInputBox;
