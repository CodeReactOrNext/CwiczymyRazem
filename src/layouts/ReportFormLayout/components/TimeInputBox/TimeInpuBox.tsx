import { Card } from "assets/components/ui/card";
import type {
  WheelPickerOption} from "assets/components/wheel-picker";
import {
  WheelPicker
} from "assets/components/wheel-picker";
import { cn } from "assets/lib/utils";
import type { QuestionMarkProps } from "components/UI/QuestionMark";
import QuestionMark from "components/UI/QuestionMark";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import type { FormikErrors } from "formik";
import { useFormikContext } from "formik";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [editHoursValue, setEditHoursValue] = useState("");
  const [editMinutesValue, setEditMinutesValue] = useState("");
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const timePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = timePickerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };
    el.addEventListener("wheel", handler, { passive: false, capture: true });
    return () => el.removeEventListener("wheel", handler, { capture: true });
  }, []);
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

  const startEditHours = () => {
    setEditHoursValue(String(hoursValue).padStart(2, "0"));
    setEditingHours(true);
    setTimeout(() => hoursInputRef.current?.select(), 0);
  };

  const commitHours = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) setFieldValue(hoursName, Math.min(23, Math.max(0, n)).toString());
    setEditingHours(false);
  };

  const startEditMinutes = () => {
    setEditMinutesValue(String(minutesValue).padStart(2, "0"));
    setEditingMinutes(true);
    setTimeout(() => minutesInputRef.current?.select(), 0);
  };

  const commitMinutes = (raw: string) => {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) setFieldValue(minutesName, Math.min(59, Math.max(0, n)).toString());
    setEditingMinutes(false);
  };

  const getGradientStyle = () => {
    if (!hasValue) {
      return "from-zinc-800/40 to-transparent";
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
        return "from-zinc-800 via-zinc-900 to-transparent";
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden p-0 transition-colors duration-300",
        error && "ring-1 ring-red-500/40"
      )}>
      <div
        className={`relative flex h-full flex-col bg-gradient-to-br p-5 transition-colors duration-300 ${getGradientStyle()}`}>
        {/* Apple-style glass gradient bar at top - only show when has value */}
        {hasValue && (
          <div
            className='absolute left-0 right-0 top-0 h-1.5 opacity-30'
            style={{
              background: `linear-gradient(90deg, transparent, ${skillColor}, transparent)`,
            }}
          />
        )}

        <div
          className={`relative flex items-center justify-between gap-4 cursor-pointer sm:cursor-default ${isOpen ? 'mb-5' : 'mb-0 sm:mb-5'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className='flex items-center gap-4'>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                hasValue ? "opacity-90" : "opacity-90"
              }`}
              style={{
                background: hasValue
                  ? `linear-gradient(135deg, ${skillColor}20, ${skillColor}10)`
                  : "linear-gradient(135deg, #52525b40, #3f3f4630)",
              }}>
              <Icon
                className='text-2xl'
                style={{ color: hasValue ? skillColor : "#a1a1aa" }}
              />
            </div>
            <div className='flex items-center gap-1.5'>
              <span
                className={`md:text-md font-sans text-sm ${
                  hasValue ? "text-zinc-100" : "text-zinc-300"
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

          {/* Mobile: time preview + expand chevron */}
          <div className='flex items-center gap-2 sm:hidden'>
            {hasValue && (
              <span
                className='font-mono text-sm font-bold'
                style={{ color: skillColor }}>
                {String(hoursValue).padStart(2, '0')}:{String(minutesValue).padStart(2, '0')}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        <div className={`${isOpen ? 'flex' : 'hidden sm:flex'} mt-auto w-full items-center justify-center gap-3`}>
          <div ref={timePickerRef} className='mx-auto flex w-full max-w-[300px] items-center justify-center gap-4'>
            {/* Hours */}
            <div className='flex flex-1 flex-col items-center gap-2'>
              <div
                className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-800/60 backdrop-blur-sm"
                onDoubleClick={startEditHours}
                title="Double-click to type">
                {editingHours ? (
                  <input
                    ref={hoursInputRef}
                    type="number"
                    min={0}
                    max={23}
                    value={editHoursValue}
                    onChange={(e) => setEditHoursValue(e.target.value)}
                    onBlur={(e) => commitHours(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitHours(editHoursValue);
                      if (e.key === "Escape") setEditingHours(false);
                    }}
                    className="w-full bg-transparent text-center text-2xl font-bold text-zinc-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    autoFocus
                  />
                ) : (
                  <WheelPicker
                    options={hourOptions}
                    value={parseInt(hoursValue.toString(), 10).toString()}
                    onValueChange={(value) => setFieldValue(hoursName, value)}
                    infinite
                    classNames={{
                      optionItem: "text-zinc-400 text-lg font-medium cursor-pointer transition-colors",
                      highlightWrapper: "bg-white/10 text-zinc-100 text-xl font-bold backdrop-blur-md"
                    }}
                  />
                )}
              </div>
              <span className='text-[10px] font-bold tracking-wider text-zinc-500'>
                Hours
              </span>
            </div>

            <span className='mb-6 text-2xl font-medium text-zinc-500/50'>
              :
            </span>

            {/* Minutes */}
            <div className='flex flex-1 flex-col items-center gap-2'>
              <div
                className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-800/60 backdrop-blur-sm"
                onDoubleClick={startEditMinutes}
                title="Double-click to type">
                {editingMinutes ? (
                  <input
                    ref={minutesInputRef}
                    type="number"
                    min={0}
                    max={59}
                    value={editMinutesValue}
                    onChange={(e) => setEditMinutesValue(e.target.value)}
                    onBlur={(e) => commitMinutes(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitMinutes(editMinutesValue);
                      if (e.key === "Escape") setEditingMinutes(false);
                    }}
                    className="w-full bg-transparent text-center text-2xl font-bold text-zinc-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    autoFocus
                  />
                ) : (
                  <WheelPicker
                    options={minuteOptions}
                    value={parseInt(minutesValue.toString(), 10).toString()}
                    onValueChange={(value) => setFieldValue(minutesName, value)}
                    infinite
                    classNames={{
                      optionItem: "text-zinc-400 text-lg font-medium cursor-pointer transition-colors",
                      highlightWrapper: "bg-white/10 text-zinc-100 text-xl font-bold backdrop-blur-md"
                    }}
                  />
                )}
              </div>
              <span className='text-[10px] font-bold tracking-wider text-zinc-500'>
                Minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TimeInputBox;
