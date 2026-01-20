import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useState } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const Timer: NextPageWithLayout = () => {
  const router = useRouter();
  const [loadingMode, setLoadingMode] = useState<"timer" | "plan" | "auto" | "song" | "challenges" | null>(null);

  const handleModeSelect = (mode: "timer" | "plan" | "auto" | "song" | "challenges") => {
    setLoadingMode(mode);
    switch (mode) {
      case "timer":
        router.push("/timer/practice");
        break;
      case "plan":
        router.push("/timer/plans");
        break;
      case "auto":
        router.push("/timer/auto");
        break;
      case "song":
        router.push("/timer/song-select");
        break;
      case "challenges":
        router.push("/timer/challenges");
        break;
      default:
        setLoadingMode(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <PracticeModeSelector onSelectMode={handleModeSelect} loadingMode={loadingMode} />
    </div>
  );
};

Timer.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default Timer;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["timer", "toast", "exercises"],
});
