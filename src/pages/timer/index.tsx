import { PracticeModeSelector } from "feature/practice/components/PracticeModeSelector/PracticeModeSelector";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";

const Timer: NextPage = () => {
  const router = useRouter();

  const handleModeSelect = (mode: "timer" | "plan" | "auto" | "song") => {
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
    }
  };

  return (
    <AppLayout pageId={"exercise"} subtitle='Timer' variant='secondary'>
      <PracticeModeSelector onSelectMode={handleModeSelect} />
    </AppLayout>
  );
};

export default Timer;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["timer", "toast", "exercises"],
});
