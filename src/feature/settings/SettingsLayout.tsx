import { cn } from "assets/lib/utils";
import { PAGE_CONTENT, PageShell } from "components/PageShell/PageShell";

/** The settings page: the app frame, with tabs and forms in one readable column. */
const SettingsLayout = ({ children }: { children: React.ReactNode }) => (
  <PageShell className='font-sans'>
    <div className={cn("mx-auto w-full max-w-3xl", PAGE_CONTENT, "md:pt-10")}>
      {children}
    </div>
  </PageShell>
);

export default SettingsLayout;
