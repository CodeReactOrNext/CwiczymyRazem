import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";

/** One clock format for a category's time: mm:ss, h:mm:ss past the hour. */
export const formatSkillTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
};

export const SkillIcon = ({ skillId, className }: { skillId: string; className?: string }) => {
  switch (skillId) {
    case "creativity":
      return <CreativityIcon className={className} size='large' />;
    case "hearing":
      return <HearingIcon className={className} size='large' />;
    case "technique":
      return <TechniqueIcon className={className} size='large' />;
    case "theory":
      return <TheoryIcon className={className} size='large' />;
    default:
      return null;
  }
};
