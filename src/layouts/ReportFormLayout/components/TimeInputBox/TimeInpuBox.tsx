import { Card } from "assets/components/ui/card";
import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { FormikErrors } from "formik";
import { useFormikContext } from "formik";
import { motion } from "framer-motion";
import { useState } from "react";
import type { IconType } from "react-icons/lib";

import InputTime from "../InputTime/InputTime";

export interface TimeInputBoxProps {
  title?: string;
  Icon: IconType;
  questionMarkProps: QuestionMarkProps;
  hoursName: string;
  minutesName: string;
  errors: FormikErrors<ReportFormikInterface>;
}

const TimeInputBox = ({
  title,
  Icon,
  questionMarkProps,
  hoursName,
  minutesName,
  errors,
}: TimeInputBoxProps) => {
  const { values } = useFormikContext<ReportFormikInterface>();
  const [isHovered, setIsHovered] = useState(false);
  const error =
    errors.hasOwnProperty(hoursName) || errors.hasOwnProperty(minutesName);

  // Check if this time input has any value entered
  const hasValue =
    parseInt(values[hoursName as keyof ReportFormikInterface] as string, 10) >
      0 ||
    parseInt(values[minutesName as keyof ReportFormikInterface] as string, 10) >
      0;

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
    // If no value is entered, return a neutral background
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
        className={`relative bg-gradient-to-br p-5 transition-all duration-300 ${getGradientStyle()}`}
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
            <QuestionMark description={questionMarkProps.description} />
          </div>
        </div>

        <div className='mt-4 flex items-center justify-center gap-3'>
          <InputTime name={hoursName} description={"HH"} addZero />
          <p className='text-2xl font-medium'>:</p>
          <InputTime name={minutesName} description={"MM"} addZero />
        </div>
      </div>
    </Card>
  );
};

export default TimeInputBox;
