import { ToneStudioView } from "feature/toneStudio/components/ToneStudioView";
import { AMP_HEAD_SRC } from "feature/toneStudio/utils/gearArt";
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
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center'>
        {/* The gear you'd be getting, rather than a sentence about not having
            it — this page is the only Tone Studio a web visitor ever sees. */}
        <img
          src={AMP_HEAD_SRC}
          alt=''
          draggable={false}
          className='w-full max-w-md select-none opacity-70'
          style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.55))" }}
        />
        <div className='flex flex-col gap-2'>
          <p className='text-sm font-medium text-zinc-300'>Tone Studio is only available in the desktop app</p>
          <p className='mx-auto max-w-sm text-xs text-zinc-500'>
            Download and run the riff.quest desktop app to shape your tone and load custom IRs.
          </p>
        </div>
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
