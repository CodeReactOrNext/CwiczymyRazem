import { Button } from "assets/components/ui/button";
import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import { useTranslation } from "hooks/useTranslation";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

interface CategoryBox {
  title: string;
  chosen?: boolean;
  time: number;
  percent: number;
  timerEnabled: boolean;
  skillColor: string;
  skillId: string;
  onStart: () => void;
  onStop: () => void;
  /** False = a time summary only: no start button, card not clickable. */
  showControls?: boolean;
}

/** One clock format for the whole card: mm:ss, h:mm:ss past the hour. */
const formatCategoryTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
};

const CategoryBox = ({
  title,
  chosen,
  time,
  percent,
  onStart,
  onStop,
  skillColor,
  skillId,
  timerEnabled,
  showControls = true,
}: CategoryBox) => {
  const { t } = useTranslation("timer");
  const isActive = timerEnabled && chosen;

  const [shadowIntensity, setShadowIntensity] = useState(2);
  const [shadowOpacity, setShadowOpacity] = useState(0.15);

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
    switch (skillId) {
      case "creativity":
        return (
          <CreativityIcon
            className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
            size='large'
          />
        );
      case "hearing":
        return (
          <HearingIcon
            className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
            size='large'
          />
        );
      case "technique":
        return (
          <TechniqueIcon
            className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
            size='large'
          />
        );
      case "theory":
        return (
          <TheoryIcon
            className={`h-5 w-5 ${!chosen ? "text-gray-400" : ""}`}
            size='large'
          />
        );
      default:
        return null;
    }
  };

  const getGradientStyle = () => {
    if (!chosen) return {};

    const gradientColor1 = `${skillColor}10`;
    const gradientColor2 = `${skillColor}05`;

    return {
      // The card's own surface from the palette (a white card in the light
      // theme), the skill colour washed through it.
      background: `linear-gradient(135deg, rgb(var(--c-zinc-900)) 0%, ${gradientColor1} 45%, ${gradientColor2} 55%, rgb(var(--c-zinc-900)) 100%)`,
      backgroundSize: "400% 400%",
      animation: isActive ? "subtleGradientAnimation 8s ease infinite" : "none",
    };
  };

  // Handler for the whole card click
  const handleCardClick = () => {
    if (!showControls) return;
    if (isActive) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-zinc-900 p-5 text-white transition-colors duration-base ${
        isActive ? "z-10" : ""
      } ${showControls ? "cursor-pointer" : ""}`}
      style={{
        boxShadow: isActive
          ? `0 0 ${shadowBlur}px ${shadowSize}px ${skillColor}${Math.round(
              shadowOpacity * 100,
            )}`
          : chosen
            ? `0 1px 3px ${skillColor}20, 0 1px 2px ${skillColor}30`
            : "",
        ...getGradientStyle(),
      }}
      onClick={handleCardClick}
>
      {isActive && (
        <span className='absolute right-3 top-3 z-10 inline-block h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-sm' />
      )}

      <div className='relative z-10 mb-4 flex items-center gap-3'>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isActive ? "opacity-100" : "opacity-80"
          } transition-all duration-base hover:opacity-100`}
          style={{
            backgroundColor: chosen
              ? `${skillColor}${isActive ? "30" : "20"}`
              : "rgba(100, 100, 100, 0.15)",
            transition: "all 0.5s ease",
          }}>
          {renderCategoryIcon()}
        </div>
        <span
          translate='no'
          className={`text-base font-semibold ${
            isActive ? "text-white" : "text-gray-300"
          }`}>
          {title}
        </span>
      </div>

      <div
        className={`relative z-10 flex flex-wrap items-end justify-between gap-2 ${
          showControls ? "mb-6" : ""
        }`}>
        <h3
          translate='no'
          className={`text-2xl font-bold leading-none tabular-nums md:text-3xl ${
            isActive ? "text-white" : "text-gray-200"
          }`}>
          {formatCategoryTime(time)}
        </h3>

        <div className='flex items-center gap-1 text-base'>
          <span
            translate='no'
            className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${
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
            {percent ? Math.round(percent) : 0}% of session
          </span>
        </div>
      </div>

      {showControls && (
        <Button
          variant={isActive ? "default" : "subtle"}
          className='relative z-10 h-10 w-full'
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}>
          {isActive ? (
            <span translate='no' className='flex items-center'>
              <Pause size='1em' className='mr-2 h-4 w-4' />
              {t("pause")}
            </span>
          ) : (
            <span translate='no' className='flex items-center'>
              <Play size='1em' className='mr-2 h-4 w-4' />
              {t("start")}
            </span>
          )}
        </Button>
      )}

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
