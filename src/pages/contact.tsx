import { Footer } from "feature/landing/components/Footer";
import AppLayout from "layouts/AppLayout";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { Mail, MessageCircle, Send } from "lucide-react";

const ContactPage: NextPageWithLayout = () => {
  const { status } = useSession();
  const isLogged = status === "authenticated";

  return (
    <>
      <Head>
        <title>Contact - Riff Quest</title>
        <meta name="description" content="Get in touch with the Riff Quest team. Have a question, bug report, or feature request? Reach out via Discord or email." />
        <link rel="canonical" href="https://riff.quest/contact" />
        <meta property="og:title" content="Contact - Riff Quest" />
        <meta property="og:description" content="Get in touch with the Riff Quest team. Have a question, bug report, or feature request?" />
        <meta property="og:url" content="https://riff.quest/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://riff.quest/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact - Riff Quest" />
        <meta name="twitter:description" content="Get in touch with the Riff Quest team." />
        <meta name="twitter:image" content="https://riff.quest/images/og-image.png" />
      </Head>

      <div className={!isLogged ? "min-h-screen bg-zinc-950 text-zinc-100" : ""}>
        {!isLogged && (
          <nav className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/images/longlightlogo.svg"
                  alt="Riff Quest"
                  width={120}
                  height={32}
                  className="h-6 w-auto"
                  priority
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

        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="text-4xl font-black text-white mb-4">Contact Us</h1>
          <p className="text-lg text-zinc-400 mb-16">
            We&apos;d love to hear from you. Whether it&apos;s a bug, an idea, or just a hello — reach out anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="https://discord.gg/6yJmsZW2Ne"
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-white/5 bg-zinc-900/50 p-8 hover:border-[#5865F2]/30 hover:bg-zinc-900 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5865F2]/10">
                  <MessageCircle className="h-6 w-6 text-[#5865F2]" />
                </div>
                <h2 className="text-xl font-bold text-white">Discord</h2>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                The fastest way to reach us. Join our community, report bugs, suggest features, or just hang out with fellow guitarists.
              </p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[#5865F2] group-hover:underline">
                Join the server →
              </p>
            </Link>

            <Link
              href="mailto:mjablonskidev@gmail.com"
              className="group rounded-2xl border border-white/5 bg-zinc-900/50 p-8 hover:border-cyan-500/30 hover:bg-zinc-900 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Mail className="h-6 w-6 text-cyan-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Email</h2>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Prefer email? Send us a message and we&apos;ll get back to you as soon as we can.
              </p>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-cyan-500 group-hover:underline">
                mjablonskidev@gmail.com →
              </p>
            </Link>
          </div>

          <div className="mt-16 rounded-2xl border border-white/5 bg-zinc-900/30 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Send className="h-5 w-5 text-zinc-500" />
              <h2 className="text-lg font-bold text-white">Feature Requests & Bug Reports</h2>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Have an idea that would make Riff Quest better? Found something that&apos;s not working right?{" "}
              <Link href="https://discord.gg/6yJmsZW2Ne" target="_blank" className="text-cyan-400 hover:underline">
                Post it in our Discord
              </Link>{" "}
              — we read every message and ship improvements based on real feedback.
            </p>
          </div>
        </div>

        {!isLogged && <Footer />}
      </div>
    </>
  );
};

ContactPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="contact" isPublic={true}>
      {page}
    </AppLayout>
  );
};

export default ContactPage;
