import { DesktopAppPage } from "feature/landing/DesktopAppPage";
import type { DesktopAppPageProps } from "feature/landing/lib/desktopAppProps";
import { buildDesktopAppProps } from "feature/landing/lib/desktopAppProps";
import type { GetStaticProps } from "next";

const DesktopGuitarPracticeApp = (props: DesktopAppPageProps) => (
  <DesktopAppPage {...props} />
);

/** Releases are rare; six hours keeps the download links on the newest one. */
const REVALIDATE_SECONDS = 6 * 60 * 60;

export const getStaticProps: GetStaticProps<
  DesktopAppPageProps
> = async () => ({
  props: await buildDesktopAppProps(),
  revalidate: REVALIDATE_SECONDS,
});

export default DesktopGuitarPracticeApp;
