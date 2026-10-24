import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

const MainLoggedWrapper = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // This div, not the window, is what scrolls in the logged-in shell, and it
  // survives route changes — Next only resets window scroll, so without this
  // every page opened at the previous page's offset. Shallow updates (tabs,
  // filters in the query) and hash links keep their position.
  useEffect(() => {
    const resetScroll = (url: string, { shallow }: { shallow: boolean }) => {
      if (shallow || url.includes("#")) return;
      scrollRef.current?.scrollTo({ top: 0 });
    };

    router.events.on("routeChangeComplete", resetScroll);
    return () => router.events.off("routeChangeComplete", resetScroll);
  }, [router.events]);

  return (
    <div
      ref={scrollRef}
      className='absolute left-0 top-0 bottom-0 flex w-full flex-col items-center overflow-y-auto overflow-x-hidden lg:mt-0'>
      {children}
    </div>
  );
};

export default MainLoggedWrapper;
