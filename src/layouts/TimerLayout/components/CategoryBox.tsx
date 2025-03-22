import { Button } from "assets/components/ui/button";
import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VscDebugPause, VscDebugStart } from "react-icons/vsc";
import { convertMsToHMObject } from "utils/converter";

interface CategoryBox {
  title: string;
  chosen?: boolean;
  time: number;
  percent: number;
  timerEnabled: boolean;
  skillColor: string;
  onStart: () => void;
  onStop: () => void;
}

const CategoryBox = ({
  title,
  chosen,
  time,
  percent,
  onStart,
  onStop,
  skillColor,
  timerEnabled,
}: CategoryBox) => {
  const { t } = useTranslation("timer");
  const timeObject = convertMsToHMObject(time);
  const isActive = timerEnabled && chosen;

  const [shadowIntensity, setShadowIntensity] = useState(2);
  const [shadowOpacity, setShadowOpacity] = useState(0.15);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let increasingIntensity = true;
    const intensityInterval = setInterval(() => {
      setShadowIntensity((prev) => {
        if (increasingIntensity) {
          const newValue = prev + 0.05;
          if (newValue >= 6) increasingIntensity = false;
          return newValue;
        } else {
          const newValue = prev - 0.05;
          if (newValue <= 2) increasingIntensity = true;
          return newValue;
        }
      });
    }, 25);

    let increasingOpacity = false;
    const opacityInterval = setInterval(() => {
      setShadowOpacity((prev) => {
        if (increasingOpacity) {
          const newValue = prev + 0.003;
          if (newValue >= 0.3) increasingOpacity = false;
          return newValue;
        } else {
          const newValue = prev - 0.003;
          if (newValue <= 0.15) increasingOpacity = true;
          return newValue;
        }
      });
    }, 40);

    return () => {
      clearInterval(intensityInterval);
      clearInterval(opacityInterval);
    };
  }, [isActive, skillColor]);

  const shadowSize = shadowIntensity;
  const shadowBlur = shadowIntensity * 2;

  const renderCategoryIcon = () => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("kreatywn")) {
      return (
        <CreativityIcon
          className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
          size='large'
        />
      );
    } else if (lowerTitle.includes("słuch") || lowerTitle.includes("sluch")) {
      return (
        <HearingIcon
          className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
          size='large'
        />
      );
    } else if (lowerTitle.includes("technik")) {
      return (
        <TechniqueIcon
          className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
          size='large'
        />
      );
    } else if (lowerTitle.includes("teori")) {
      return (
        <TheoryIcon
          className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
          size='large'
        />
      );
    }
    return null;
  };

  const formatTime = () => {
    const minutes = Number(timeObject.minutes);
    return `${timeObject.hours}:${minutes < 10 ? "0" + minutes : minutes}`;
  };

  const getGradientStyle = () => {
    if (!chosen) return {};

    const gradientColor1 = `${skillColor}10`;
    const gradientColor2 = `${skillColor}05`;

    return {
      background: `linear-gradient(135deg, #171717 0%, ${gradientColor1} 45%, ${gradientColor2} 55%, #171717 100%)`,
      backgroundSize: "400% 400%",
      animation: isActive ? "subtleGradientAnimation 8s ease infinite" : "none",
    };
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-[0.5px] bg-[#171717] p-5 text-white transition-all duration-300 hover:scale-[1.01] ${
        isActive ? "z-10" : ""
      }`}
      style={{
        borderColor: chosen ? `${skillColor}4D` : "rgba(255, 255, 255, 0.05)",
        boxShadow: isActive
          ? `0 0 ${shadowBlur}px ${shadowSize}px ${skillColor}${Math.round(
              shadowOpacity * 100
            )}`
          : chosen
          ? `0 1px 3px ${skillColor}20, 0 1px 2px ${skillColor}30`
          : "",
        transform: isHovered && !isActive ? "scale(1.01)" : "",
        ...getGradientStyle(),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {isActive && (
        <span className='absolute right-3 top-3 z-10 inline-block h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-sm' />
      )}

      <div className='relative z-10 mb-4 flex items-center gap-3'>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isActive ? "opacity-100" : "opacity-80"
          } transition-all duration-300 hover:opacity-100`}
          style={{
            backgroundColor: chosen
              ? `${skillColor}${isActive ? "30" : "20"}`
              : "rgba(100, 100, 100, 0.15)",
            transition: "all 0.5s ease",
            border: chosen
              ? `1px solid ${skillColor}${isActive ? "50" : "30"}`
              : "1px solid rgba(150, 150, 150, 0.2)",
          }}>
          {renderCategoryIcon()}
        </div>
        <span
          className={`text-base font-medium ${
            isActive ? "text-white" : "text-gray-300"
          }`}>
          {title}
        </span>
      </div>

      <div className='relative z-10 mb-6 flex items-end justify-between'>
        <div className='flex items-baseline gap-1'>
          <h3
            className={` text-xl font-bold tracking-wide md:text-3xl ${
              isActive ? "text-white" : "text-gray-200"
            }`}>
            {formatTime()}
          </h3>
        </div>

        <div className='flex items-center gap-1 text-base'>
          <span
            className={`rounded-md px-2 py-0.5 text-sm font-medium ${
              chosen ? "" : "bg-gray-700/30 text-gray-400"
            }`}
            style={
              chosen
                ? {
                    background:
                      percent > 0 ? `${skillColor}20` : "rgba(75, 75, 75, 0.2)",
                    color:
                      percent > 0 ? skillColor : "rgba(180, 180, 180, 0.7)",
                  }
                : {}
            }>
            {percent ? Math.round(percent) : 0}%
          </span>
        </div>
      </div>

      <Button
        variant={isActive ? "default" : "outline"}
        size='sm'
        className={`relative z-10 h-10 w-full rounded-lg border text-sm font-medium transition-all duration-300 ${
          isActive
            ? "border-none shadow-md hover:shadow-lg"
            : "border-gray-700 bg-black/40 text-white hover:border-gray-600 hover:bg-black/60"
        }`}
        onClick={isActive ? onStop : onStart}>
        {isActive ? (
          <>
            <VscDebugPause className='mr-2 h-4 w-4' />
            {t("pause")}
          </>
        ) : (
          <>
            <VscDebugStart className='mr-2 h-4 w-4' />
            {t("start")}
          </>
        )}
      </Button>

      <style jsx>{`
        @keyframes subtleGradientAnimation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryBox;
