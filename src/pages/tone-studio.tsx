import { ToneStudioView } from "feature/toneStudio/components/ToneStudioView";
import { useAmpSim } from "hooks/useAmpSim";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

// Electron-only: window.nativeAmp only exists in the desktop build. Gated here
// (not inside ToneStudioView, which the dev preview harness renders without this
// bridge on purpose — see src/pages/dev/tone-studio-preview.tsx).
const ToneStudioPage: NextPageWithLayout = () => {
  const amp = useAmpSim();

  if (!amp.available) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center'>
        <p className='text-sm font-medium text-zinc-300'>Tone Studio is only available in the desktop app</p>
        <p className='max-w-sm text-xs text-zinc-500'>
          Download and run the riff.quest desktop app to shape your tone and load custom IRs.
        </p>
      </div>
    );
  }

  return <ToneStudioView />;
};

ToneStudioPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='tone-studio' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ToneStudioPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common"],
});
