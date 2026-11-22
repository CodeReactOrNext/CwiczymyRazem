import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";
import { ToneStudioView } from "feature/toneStudio/components/ToneStudioView";
import { useAmpSim } from "hooks/useAmpSim";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout/AppLayout";
import { Download } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

// Electron-only: window.nativeAmp only exists in the desktop build. Gated here
// (not inside ToneStudioView, which the dev preview harness renders without this
// bridge on purpose — see src/pages/dev/tone-studio-preview.tsx).
const ToneStudioPage: NextPageWithLayout = () => {
  const amp = useAmpSim();
  const { t } = useTranslation("tone_studio");

  if (!amp.available) {
    return (
      <PageShell>
        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-6 text-center",
            PAGE_CONTENT
          )}>
          <EmptyState
            mood='nudge'
            title={t("common.web_only_title")}
            description={t("common.web_only_body")}
            action={
              <Button asChild size='lg'>
                <Link href='/features/desktop-guitar-practice-app'>
                  <Download />
                  {t("common.web_only_cta")}
                </Link>
              </Button>
            }
            className='w-full max-w-xl'
          />
        </div>
      </PageShell>
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

ToneStudioPage.getInitialProps = withAuthInitialProps();
