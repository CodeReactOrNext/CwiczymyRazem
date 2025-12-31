import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

const Timer: NextPage = () => {
  const router = useRouter();
  const [loadingMode, setLoadingMode] = useState<"timer" | "plan" | "auto" | "song" | null>(null);

  const handleModeSelect = (mode: "timer" | "plan" | "auto" | "song") => {
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
      default:
        setLoadingMode(null);
    }
  };

  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      <PracticeModeSelector onSelectMode={handleModeSelect} loadingMode={loadingMode} />
    </AppLayout>
  );
};

export default Timer;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["timer", "toast", "exercises"],
});
