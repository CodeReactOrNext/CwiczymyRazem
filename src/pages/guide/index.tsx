import GuideView from "feature/guide/view/GuideView";
import { Footer } from "feature/landing/components/Footer";
import { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nextConfig from "../../../next-i18next.config";

const GuidePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Riff Quest - App Guide</title>
        <meta name="description" content="Master Riff Quest: Learn how to track progress, manage songs, and create custom practice plans." />
      </Head>
      
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        {/* Simple Public Header */}
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

        <GuideView />
        <Footer />
      </main>
    </>
  );
};

export default GuidePage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "pl",
        ["common"],
        nextI18nextConfig
      )),
    },
  };
}
