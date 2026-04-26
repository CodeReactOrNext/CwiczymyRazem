import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

// React Flow uses browser APIs — must disable SSR
const ScaleTreeView = dynamic(
  () => import("feature/scaleTree/components/ScaleTreeView").then((m) => m.ScaleTreeView),
  { ssr: false }
);

const ScaleTreePage: NextPageWithLayout = () => {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:h-[calc(100vh-4rem)]">
      <div className="flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Drzewko Skali</h1>
        <p className="text-sm text-zinc-400">
          Poznaj gamy w tonacji C krok po kroku — od pentatoniki do trybów modalnych.
        </p>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-xl border border-white/10">
        <ScaleTreeView />
      </div>
    </div>
  );
};

ScaleTreePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="scale-tree" subtitle="Drzewko Skali" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default ScaleTreePage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "profile", "footer", "toast"],
});
