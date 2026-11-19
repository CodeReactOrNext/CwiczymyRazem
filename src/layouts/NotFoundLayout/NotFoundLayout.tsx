import { Button } from "assets/components/ui/button";
import { RiffSays } from "components/Mascot/Riff";
import OldEffect from "components/OldEffect";
import { useTranslation } from "hooks/useTranslation";
import Link from "next/link";

/**
 * 404: Riff is the page. He stands with his cable pulled, says what happened,
 * and the way back sits right under him; the code itself is only a label.
 */
const NotFoundLayout = () => {
  const { t } = useTranslation("404");

  return (
    <>
      <OldEffect />
      <div className='relative z-40 flex min-h-[70vh] w-full flex-col items-center justify-center gap-8 px-4 py-12 text-center'>
        <div className='flex flex-col items-center gap-1'>
          <p className='font-teko text-7xl font-bold leading-none text-zinc-100 md:text-8xl'>404</p>
          <p className='text-xs font-semibold tracking-wide text-zinc-400'>{t("page_not_found")}</p>
        </div>
        <RiffSays
          mood='unplugged'
          text={t("riff_line")}
          layout='column'
          delay={0.6}
          riffClassName='h-48 md:h-60'
          bubbleClassName='text-base'
        />
        <Button asChild className='h-11 rounded-lg bg-white px-6 font-semibold text-zinc-950 hover:bg-zinc-200'>
          <Link href='/'>{t("back")}</Link>
        </Button>
      </div>
    </>
  );
};
export default NotFoundLayout;
