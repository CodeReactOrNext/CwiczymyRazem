import GuideView from "feature/guide/view/GuideView";
import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";



const GuidePage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>Riff Quest - App Guide</title>
        <meta name="description" content="Master Riff Quest: Learn how to track progress, manage songs, and create custom practice plans." />
        <link rel='canonical' href='https://riff.quest/guide' />
      </Head>
      
      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {/* Simple Public Header - Only show when NOT logged in */}
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
               <Link href="/" className="flex items-center gap-2">
                  <Image
                    src='/images/longlightlogo.svg'
                    alt='Riff Quest'
                    width={120}
                    height={32}
                    className='h-6 w-auto'
                  />
               </Link>
               <div className="flex items-center gap-4">
                 <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                   Login
                 </Link>
                 <Link href="/signup" className="rounded-full bg-cyan-500 px-4 py-1.5 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">
                   Start Free
                 </Link>
               </div>
            </div>
          </nav>
        )}

        <GuideView />
        
        {!isLogged && <Footer />}
      </div>
    </>
  );
};

GuidePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="guide" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default GuidePage;


