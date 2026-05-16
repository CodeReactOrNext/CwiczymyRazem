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
    <div className="absolute inset-0 z-0 h-[calc(100vh-4rem)]">
      <div className="h-full w-full bg-[#141414]">
        <ScaleTreeView />
      </div>
    </div>
  );
};

ScaleTreePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="scale-tree" subtitle="Scale Tree" variant="fullscreen">
      {page}
    </AppLayout>
  );
};

export default ScaleTreePage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "profile", "footer", "toast"],
});
