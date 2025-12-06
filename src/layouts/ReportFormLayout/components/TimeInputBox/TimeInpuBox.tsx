import { Card } from "assets/components/ui/card";
import {
  WheelPicker,
  WheelPickerWrapper,
} from "assets/components/wheel-picker";
import type { WheelPickerOption } from "assets/components/wheel-picker";
import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { FormikErrors } from "formik";
import { useFormikContext } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons/lib";

export interface TimeInputBoxProps {
  title?: string;
  Icon: IconType;
  questionMarkProps: QuestionMarkProps;
  hoursName: string;
  minutesName: string;
  errors: FormikErrors<ReportFormikInterface>;
}

const createArray = (length: number, add = 0): WheelPickerOption[] =>
  Array.from({ length }, (_, i) => {
    const value = i + add;
    return {
      label: value.toString().padStart(2, "0"),
      value: value.toString(),
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
  errors,
}: TimeInputBoxProps) => {
  const { values, setFieldValue } = useFormikContext<ReportFormikInterface>();
  const [isHovered, setIsHovered] = useState(false);
  
  const hasError =
    errors.hasOwnProperty(hoursName) || errors.hasOwnProperty(minutesName);

  // Initialize with 0 if undefined/null
  useEffect(() => {
    if (values[hoursName as keyof ReportFormikInterface] === undefined || values[hoursName as keyof ReportFormikInterface] === null) {
       setFieldValue(hoursName, 0);
    }
    if (values[minutesName as keyof ReportFormikInterface] === undefined || values[minutesName as keyof ReportFormikInterface] === null) {
       setFieldValue(minutesName, 0);
    }
  }, [hoursName, minutesName, setFieldValue, values]);

  // Get current values from formik
  const currentHours = (values[hoursName as keyof ReportFormikInterface] || "0").toString();
  const currentMinutes = (values[minutesName as keyof ReportFormikInterface] || "0").toString();

  // Check if this time input has any value entered (for styling)
  const hasValue = parseInt(currentHours, 10) > 0 || parseInt(currentMinutes, 10) > 0;

  // Determine the skill color based on title
  const getSkillColor = () => {
    const lowerTitle = title?.toLowerCase() || "";
    if (lowerTitle.includes("kreatywn")) return "#37b874"; // Green
    if (lowerTitle.includes("słuch") || lowerTitle.includes("sluch"))
      return "#4a7edd"; // Blue
    if (lowerTitle.includes("technik")) return "#e04c3b"; // Red
    if (lowerTitle.includes("teori")) return "#a44aed"; // Purple
    return "#888888";
  };

  const skillColor = getSkillColor();

  // Get gradient style for the card based on whether there's a value
  const getGradientStyle = () => {
    if (!hasValue) {
      return "from-gray-900/20 to-transparent";
    }

    const lowerTitle = title?.toLowerCase() || "";
    if (lowerTitle.includes("kreatywn")) {
      return "from-[#37b87410] via-[#37b87420] to-transparent";
    }
    if (lowerTitle.includes("słuch") || lowerTitle.includes("sluch")) {
      return "from-[#4a7edd10] via-[#4a7edd20] to-transparent";
    }
    if (lowerTitle.includes("technik")) {
      return "from-[#e04c3b10] via-[#e04c3b20] to-transparent";
    }
    if (lowerTitle.includes("teori")) {
      return "from-[#a44aed10] via-[#a44aed20] to-transparent";
    }
    return "from-gray-800 via-gray-900 to-transparent";
  };

  // Delayed render to fix animation issues
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Card
      className={`p-0 transition-all duration-300 hover:shadow-lg ${
        hasError
          ? "ring-error-300 ring-1"
          : hasValue
          ? "ring-1 ring-gray-700/30"
          : "hover:ring-1 hover:ring-gray-700/40"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative bg-gradient-to-br p-5 transition-all duration-300 ${getGradientStyle()}`}
        style={{
          boxShadow: hasError ? "0 0 5px 0 var(--error-200)" : "none",
        }}
      >
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
            }}
          >
            <Icon
              className='text-2xl'
              style={{ color: hasValue ? skillColor : "#666666" }}
            />
          </motion.div>
          <div className='flex items-center gap-1.5'>
            <span
              className={`md:text-md font-openSans text-sm ${
                hasValue ? "text-white" : "text-gray-400"
              }`}
            >
              {title}
            </span>
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <QuestionMark description={questionMarkProps.description} />
            </div>
          </div>
        </div>

        <div className='mt-0 flex w-full flex-col items-center justify-center gap-1'>
          <div className="flex w-full justify-around text-xs font-medium text-gray-500/80 uppercase tracking-widest px-8">
             <span>Godz</span>
             <span>Min</span>
          </div>
          <WheelPickerWrapper className="w-full justify-center gap-2 rounded-lg border-2 border-gray-700/20 bg-transparent">
            <WheelPicker
              key={isReady ? "h-ready" : "h-init"}
              visibleCount={12}
              options={hourOptions}
              value={currentHours}
              onValueChange={(val) => setFieldValue(hoursName, val)}
              infinite
              classNames={{ highlightWrapper: "bg-white/10" }}
            />
            <WheelPicker
              key={isReady ? "m-ready" : "m-init"}
              visibleCount={12}
              options={minuteOptions}
              value={currentMinutes}
              onValueChange={(val) => setFieldValue(minutesName, val)}
              infinite
              classNames={{ highlightWrapper: "bg-white/10" }}
            />
          </WheelPickerWrapper>
        </div>
      </div>
    </Card>
  );
};

export default TimeInputBox;
