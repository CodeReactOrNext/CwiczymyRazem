"use client";

import { Button } from "assets/components/ui/button";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  Guitar,
  Music,
  Star,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";

// Extend Window interface for UnicornStudio
declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init?: () => void;
    };
  }
}

const LandingPage: NextPage = () => {
  const { t } = useTranslation(["common", "profile"]);

  // Initialize Unicorn Studio when component mounts
  useEffect(() => {
    const initUnicornStudio = () => {
      if (typeof window !== "undefined") {
        if (!window.UnicornStudio) {
          window.UnicornStudio = { isInitialized: false };
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.30/dist/unicornStudio.umd.js";
          script.onload = () => {
            if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
              window.UnicornStudio.init?.();
              window.UnicornStudio.isInitialized = true;
            }
          };
          document.head.appendChild(script);
        } else if (
          window.UnicornStudio &&
          !window.UnicornStudio.isInitialized
        ) {
          window.UnicornStudio.init?.();
          window.UnicornStudio.isInitialized = true;
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initUnicornStudio, 100);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Timer className='h-8 w-8' />,
      title: "🎯 Inteligentny Timer",
      description: "Śledź swój czas ćwiczeń z precyzyjną analizą postępów",
      color: "from-amber-600 to-orange-600",
    },
    {
      icon: <Brain className='h-8 w-8' />,
      title: "🧠 System Umiejętności",
      description:
        "Rozwijaj technikę, teorię, słuch i kreatywność w strukturalny sposób",
      color: "from-orange-600 to-red-600",
    },
    {
      icon: <Trophy className='h-8 w-8' />,
      title: "🏆 Osiągnięcia & Ranking",
      description: "Zdobywaj punkty, odblokuj osiągnięcia i rywalizuj z innymi",
      color: "from-yellow-600 to-amber-600",
    },
    {
      icon: <BookOpen className='h-8 w-8' />,
      title: "📚 Biblioteka Utworów",
      description: "Ucz się ulubionych piosenek z systemem postępów",
      color: "from-amber-700 to-yellow-700",
    },
    {
      icon: <Activity className='h-8 w-8' />,
      title: "📊 Analiza Aktywności",
      description: "Szczegółowe wykresy i statystyki Twojej praktyki",
      color: "from-orange-700 to-amber-700",
    },
    {
      icon: <Users className='h-8 w-8' />,
      title: "👥 Społeczność",
      description: "Dołącz do społeczności gitarzystów i dziel się postępami",
      color: "from-red-600 to-orange-600",
    },
  ];

  const stats = [
    { number: "10K+", label: "Aktywnych Użytkowników" },
    { number: "50K+", label: "Godzin Ćwiczeń" },
    { number: "1K+", label: "Utworów w Bazie" },
    { number: "95%", label: "Zadowolonych Użytkowników" },
  ];

  const testimonials = [
    {
      name: "Michał K.",
      level: "Level 47 🎸",
      text: "Dzięki CwiczymyRazem moja gra na gitarze znacznie się poprawiła. System punktów motywuje do codziennej praktyki!",
      avatar: "🎸",
    },
    {
      name: "Anna S.",
      level: "Level 32 🎵",
      text: "Uwielbiam system umiejętności - wreszcie wiem nad czym pracować i widzę swoje postępy!",
      avatar: "🎵",
    },
    {
      name: "Tomasz W.",
      level: "Level 58 🏆",
      text: "Społeczność jest niesamowita. Ranking motywuje, a inne osoby dzielą się świetnymi radami.",
      avatar: "🏆",
    },
  ];

  const faqQuestions: faqQuestionInterface[] = [
    {
      title: "Czy Practice Together jest naprawdę darmowe?",
      message:
        "Tak! Practice Together jest w pełni darmowe. Wszystkie funkcje, śledzenie postępów, ćwiczenia i gamifikacja są dostępne bez żadnych opłat.",
    },
    {
      title: "Jak działa śledzenie postępów?",
      message:
        "Aplikacja automatycznie śledzi Twoje ćwiczenia, czas praktyki i postępy w różnych umiejętnościach. Otrzymujesz szczegółowe raporty i statystyki, które pokazują Twój rozwój.",
    },
    {
      title: "Czy mogę tworzyć własne ćwiczenia?",
      message:
        "Oczywiście! Oprócz gotowych planów ćwiczeń możesz tworzyć własne, dostosowane do Twoich potrzeb i celów muzycznych.",
    },
    {
      title: "Jak działa system gamifikacji?",
      message:
        "Za regularne ćwiczenia otrzymujesz punkty, odblokowujesz nowe umiejętności i osiągnięcia. System motywuje do codziennej praktyki i pomaga budować nawyki.",
    },
    {
      title: "Czy potrzebuję specjalnego sprzętu?",
      message:
        "Nie! Wystarczy gitara i urządzenie z dostępem do internetu. Practice Together działa na telefonach, tabletach i komputerach.",
    },
  ];

  return (
    <>
      <Head>
        <title>Ćwiczymy Razem - Naucz się grać na gitarze</title>
        <meta
          name='description'
          content='Inteligentna platforma do nauki gitary z systemem postępów, społecznością i tysiącami utworów.'
        />
      </Head>

      <div className='min-h-screen bg-zinc-950'>
        {/* Animated Background Grid */}
        <div className='pointer-events-none fixed inset-0 opacity-5'>
          <div
            className='h-full w-full'
            style={{
              backgroundImage: `
                 linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
               `,
              backgroundSize: "100px 100px",
            }}></div>
        </div>

        {/* Floating Particles */}
        <div className='pointer-events-none fixed inset-0 overflow-hidden'>
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className='absolute h-1 w-1 animate-pulse rounded-full bg-cyan-400/30'
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
        {/* Hero Section - Enhanced Futuristic Design */}
        <section className='relative min-h-screen overflow-hidden bg-zinc-950'>
          {/* Hero Image Background - Mobile Optimized */}
          <div className='absolute right-0 top-0 h-full w-full sm:w-4/5 md:w-2/3 lg:w-3/4 xl:w-4/5'>
            <Image
              src='/images/hero-image.png'
              alt='Guitarist'
              fill
              className='object-cover object-center sm:object-right'
              priority
              sizes='(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 67vw, (max-width: 1280px) 75vw, 80vw'
            />
            {/* Lighter Gradient Overlay for Better Visibility */}
            <div className='absolute inset-0 z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent sm:via-zinc-950/50'></div>
            <div className='absolute inset-0 z-10 bg-gradient-to-t from-zinc-950/30 via-transparent to-transparent'></div>
          </div>

          {/* Left Side Enhanced Background - Mobile Optimized */}
          <div className='z-5 absolute left-0 top-0 h-full w-full bg-gradient-to-r from-zinc-950 to-zinc-950/80 sm:w-1/5 sm:to-zinc-950/95 md:w-1/3 lg:w-1/4 xl:w-1/5'></div>

          {/* Enhanced Animated Elements */}
          <div className='absolute inset-0 z-20 overflow-hidden'>
            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className='absolute animate-pulse rounded-full bg-cyan-400/30'
                style={{
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  left: `${Math.random() * 50}%`, // Adjusted for responsive layout
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${3 + Math.random() * 3}s`,
                }}
              />
            ))}

            {/* Floating Lines */}
            {[...Array(3)].map((_, i) => (
              <div
                key={`line-${i}`}
                className='absolute h-px animate-pulse bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent'
                style={{
                  width: `${100 + Math.random() * 200}px`,
                  left: `${Math.random() * 45}%`, // Adjusted for responsive layout
                  top: `${20 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${4 + Math.random() * 2}s`,
                  transform: `rotate(${Math.random() * 30 - 15}deg)`,
                }}
              />
            ))}
          </div>

          {/* Subtle Glow Effects */}
          <div className='z-5 bg-cyan-400/3 absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full blur-3xl'></div>
          <div className='bg-cyan-400/2 z-5 absolute left-1/4 top-1/3 h-64 w-64 rounded-full blur-2xl'></div>

          {/* Split Layout Container */}
          <div className='relative flex min-h-screen items-center'>
            {/* Left Side - Content */}
            <div className='relative z-30 w-full px-4 py-8 sm:px-8 sm:py-0 md:w-3/5 lg:w-1/2 lg:px-12 xl:w-2/5 xl:px-16'>
              <div className='max-w-2xl'>
                {/* Logo & Brand - Enhanced */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className='mb-12'>
                  <div className='mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4'>
                    <div className='relative'>
                      <Image
                        src='/images/logo.svg'
                        alt='Logo'
                        width={48}
                        height={48}
                        className='h-10 w-10 brightness-0 invert sm:h-12 sm:w-12'
                        priority
                      />
                      <div className='absolute -inset-2 rounded-xl bg-gradient-to-r from-cyan-400/20 via-cyan-400/10 to-transparent blur-lg'></div>
                    </div>
                    <div>
                      <h1 className='text-3xl font-black tracking-wider text-white drop-shadow-lg sm:text-4xl'>
                        ĆWICZYMY
                      </h1>
                      <p className='text-xs font-bold tracking-[0.3em] text-cyan-400/80 sm:text-sm'>
                        RAZEM
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Main Headline - New Content */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className='mb-6'>
                  <h1 className='mb-4 text-3xl font-black leading-tight tracking-tight text-white drop-shadow-2xl sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'>
                    <span className='relative'>
                      Ćwicz gitarę
                      <div className='absolute -inset-1 -z-10 bg-white/10 blur-2xl'></div>
                    </span>
                    <br />
                    <span className='relative'>
                      skuteczniej
                      <div className='absolute -bottom-3 left-0 h-2 w-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-transparent opacity-80'></div>
                      <div className='absolute -inset-1 -z-10 bg-cyan-400/30 blur-xl'></div>
                    </span>
                    <br />
                    <span className='relative bg-gradient-to-r from-white via-cyan-100 to-cyan-200 bg-clip-text text-transparent'>
                      śledź postępy
                    </span>
                  </h1>
                </motion.div>

                {/* Subheadline */}
                <motion.p
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className='mb-6 max-w-lg text-sm font-light leading-relaxed text-white/80 sm:mb-8 sm:text-base md:mb-10 md:text-lg'>
                  Practice Together to darmowa aplikacja dla gitarzystów, która
                  pomoże Ci rozwijać technikę i budować nawyki.
                </motion.p>

                {/* CTA Buttons - Enhanced Style */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className='flex flex-col gap-4 sm:flex-row'>
                  <Link href='/signup'>
                    <Button className='group relative overflow-hidden rounded-lg border-2 border-cyan-400 bg-gradient-to-r from-cyan-400 to-cyan-300 px-6 py-3 text-sm font-black text-black shadow-2xl transition-all duration-300 hover:scale-105 hover:from-cyan-300 hover:to-cyan-200 hover:shadow-cyan-400/50 sm:rounded-xl sm:px-8 sm:py-4 sm:text-base md:px-10 md:py-5 lg:px-12 lg:py-6 lg:text-lg'>
                      <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                      <span className='relative z-10 flex items-center gap-2 tracking-wider sm:gap-3'>
                        Zacznij za darmo
                        <ChevronRight className='h-4 w-4 transition-transform group-hover:translate-x-2 sm:h-5 sm:w-5 lg:h-6 lg:w-6' />
                      </span>
                    </Button>
                  </Link>
                  <Link href='/login'>
                    <Button
                      variant='outline'
                      className='group relative rounded-lg border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-400/15 to-zinc-900/20 px-6 py-3 text-sm font-bold tracking-wider text-cyan-400 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400 hover:from-cyan-400/25 hover:to-zinc-900/10 hover:shadow-cyan-400/30 sm:rounded-xl sm:px-8 sm:py-4 sm:text-base md:px-10 md:py-5 lg:px-12 lg:py-6 lg:text-lg'>
                      <div className='absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                      <span className='relative z-10'>LOGIN</span>
                    </Button>
                  </Link>
                </motion.div>

                {/* Stats Row - Minimal */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className='mt-16 flex items-center gap-12 border-t border-white/10 pt-8'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-white'>10K+</div>
                    <div className='text-xs font-medium tracking-widest text-white/50'>
                      USERS
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-white'>50K+</div>
                    <div className='text-xs font-medium tracking-widest text-white/50'>
                      HOURS
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-white'>1K+</div>
                    <div className='text-xs font-medium tracking-widest text-white/50'>
                      TRACKS
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Side - Now handled by background image */}
          </div>
        </section>

        {/* Problem → Solution Section */}
        <section className='relative bg-zinc-900/50 py-20 md:py-32'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24'>
              {/* Problem */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className='space-y-6'>
                <h2 className='text-3xl font-bold text-white sm:text-4xl lg:text-5xl'>
                  Dlaczego trudno rozwijać się samemu?
                </h2>
                <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-8 shadow-2xl backdrop-blur-xl'>
                  <div className='flex items-start gap-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20'>
                        <span className='text-2xl'>😔</span>
                      </div>
                    </div>
                    <div>
                      <p className='text-lg italic leading-relaxed text-white/80'>
                        "Trudno utrzymać motywację, śledzić postępy i wiedzieć,
                        czy ćwiczenia naprawdę działają."
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Solution */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className='space-y-6'>
                <h2 className='text-3xl font-bold text-white sm:text-4xl lg:text-5xl'>
                  Jak Practice Together rozwiązuje ten problem?
                </h2>
                <div className='rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 p-8 shadow-2xl backdrop-blur-xl'>
                  <div className='flex items-start gap-4'>
                    <div className='flex-shrink-0'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/20'>
                        <span className='text-2xl'>🚀</span>
                      </div>
                    </div>
                    <div>
                      <p className='text-lg italic leading-relaxed text-white/80'>
                        "Aplikacja zamienia codzienne ćwiczenia w proces z
                        mierzalnym progresem i poczuciem osiągnięcia."
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Funkcje aplikacji - Rzeczywiste funkcje */}
        <section className='relative bg-zinc-950 py-20 md:py-32'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='mb-20 text-center'>
              <h2 className='mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                Poznaj funkcje Practice Together
              </h2>
              <p className='mx-auto max-w-3xl text-xl text-white/70'>
                Sprawdź jak nasze narzędzia pomogą Ci w strukturalnej nauce
                gitary i śledzeniu postępów
              </p>
            </motion.div>

            {/* Main Features Grid */}
            <div className='space-y-24'>
              {/* Feature 1 - Inteligentny Timer */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className='grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16'>
                <div className='space-y-6'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 shadow-lg'>
                      <span className='text-3xl'>⏱️</span>
                    </div>
                    <div>
                      <h3 className='text-3xl font-bold text-white'>
                        Inteligentny Timer
                      </h3>
                      <p className='text-cyan-400'>
                        4 kategorie umiejętności w jednym miejscu
                      </p>
                    </div>
                  </div>

                  <p className='text-lg leading-relaxed text-white/80'>
                    Unikalny timer z animowanymi pierścieniami dla każdej
                    kategorii umiejętności. Ćwicz Technikę, Teorię, Słuch i
                    Kreatywność, a aplikacja automatycznie zapisze Twój czas i
                    postępy w każdej dziedzinie.
                  </p>

                  <div className='space-y-4'>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-red-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>Technika</h4>
                        <p className='text-white/70'>
                          Palcowanie, fingerpicking, strumming i inne aspekty
                          techniczne
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-blue-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>Teoria</h4>
                        <p className='text-white/70'>
                          Akordy, skale, harmonia i wiedza teoretyczna
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-cyan-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Słuch i Kreatywność
                        </h4>
                        <p className='text-white/70'>
                          Rozpoznawanie nut, improwizacja i twórcze podejście
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Representation - Timer */}
                <div className='relative'>
                  <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-8 backdrop-blur-xl'>
                    <div className='mb-6 text-center'>
                      <h4 className='mb-4 text-lg font-semibold text-white'>
                        Aktywna sesja ćwiczeń
                      </h4>

                      {/* Mock Timer Display - Matching real app */}
                      <div className='relative mx-auto mb-6 h-64 w-64'>
                        {/* Dark background with glow */}
                        <div
                          className='absolute inset-0 rounded-full bg-black/80'
                          style={{
                            background:
                              "radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)",
                            boxShadow:
                              "0 0 40px 5px #FF525230, inset 0 0 20px 0px #FF525220",
                          }}
                        />

                        {/* Animated skill rings - matching exact layout */}
                        <svg
                          className='absolute inset-0 -rotate-90 transform'
                          width='100%'
                          height='100%'
                          viewBox='0 0 264 264'
                          style={{ zIndex: 10 }}>
                          {/* Technique ring (active) */}
                          <g style={{ filter: "drop-shadow(0 0 5px #FF5252)" }}>
                            <circle
                              cx='132'
                              cy='132'
                              r='120'
                              stroke='#FF5252'
                              strokeWidth='7'
                              fill='none'
                              opacity='0.15'
                              style={{
                                transition:
                                  "opacity 0.5s ease, stroke-width 0.5s ease",
                              }}
                            />
                            <circle
                              cx='132'
                              cy='132'
                              r='120'
                              stroke='#FF5252'
                              strokeWidth='7'
                              fill='none'
                              strokeLinecap='round'
                              style={{
                                strokeDasharray: "754.0",
                                strokeDashoffset: "452.4",
                                transition: "all 0.5s ease",
                                opacity: "1",
                                filter: "brightness(1.1)",
                              }}
                            />
                          </g>
                          {/* Theory ring */}
                          <g>
                            <circle
                              cx='132'
                              cy='132'
                              r='108'
                              stroke='#2196F3'
                              strokeWidth='3'
                              fill='none'
                              opacity='0.05'
                              style={{
                                transition:
                                  "opacity 0.5s ease, stroke-width 0.5s ease",
                              }}
                            />
                            <circle
                              cx='132'
                              cy='132'
                              r='108'
                              stroke='#2196F3'
                              strokeWidth='3'
                              fill='none'
                              strokeLinecap='round'
                              style={{
                                strokeDasharray: "678.6",
                                strokeDashoffset: "610.7",
                                transition: "all 0.5s ease",
                                opacity: "0.2",
                              }}
                            />
                          </g>
                          {/* Hearing ring */}
                          <g>
                            <circle
                              cx='132'
                              cy='132'
                              r='96'
                              stroke='#4CAF50'
                              strokeWidth='3'
                              fill='none'
                              opacity='0.05'
                              style={{
                                transition:
                                  "opacity 0.5s ease, stroke-width 0.5s ease",
                              }}
                            />
                            <circle
                              cx='132'
                              cy='132'
                              r='96'
                              stroke='#4CAF50'
                              strokeWidth='3'
                              fill='none'
                              strokeLinecap='round'
                              style={{
                                strokeDasharray: "603.2",
                                strokeDashoffset: "543.0",
                                transition: "all 0.5s ease",
                                opacity: "0.2",
                              }}
                            />
                          </g>
                          {/* Creativity ring */}
                          <g>
                            <circle
                              cx='132'
                              cy='132'
                              r='84'
                              stroke='#9C27B0'
                              strokeWidth='3'
                              fill='none'
                              opacity='0.05'
                              style={{
                                transition:
                                  "opacity 0.5s ease, stroke-width 0.5s ease",
                              }}
                            />
                            <circle
                              cx='132'
                              cy='132'
                              r='84'
                              stroke='#9C27B0'
                              strokeWidth='3'
                              fill='none'
                              strokeLinecap='round'
                              style={{
                                strokeDasharray: "527.8",
                                strokeDashoffset: "475.0",
                                transition: "all 0.5s ease",
                                opacity: "0.2",
                              }}
                            />
                          </g>
                        </svg>

                        {/* Central Timer Display */}
                        <div className='absolute inset-0 flex flex-col items-center justify-center rounded-full text-white'>
                          <div className='text-center'>
                            <p className='font-sans text-6xl font-semibold tracking-wider'>
                              25:30
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Category buttons - matching real CategoryBox */}
                      <div className='grid grid-cols-2 gap-3'>
                        {/* Technique - Active */}
                        <div
                          className='relative overflow-hidden rounded-xl border-[0.5px] bg-[#171717] p-5 text-white transition-all duration-300'
                          style={{
                            borderColor: "#FF525250",
                            boxShadow: "0 0 12px 4px #FF525230",
                            background:
                              "linear-gradient(135deg, #171717 0%, #FF525210 45%, #FF525205 55%, #171717 100%)",
                          }}>
                          <span className='absolute right-3 top-3 z-10 inline-block h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-sm' />
                          <div className='relative z-10 mb-4 flex items-center gap-3'>
                            <div
                              className='flex h-10 w-10 items-center justify-center rounded-full opacity-100 transition-all duration-300'
                              style={{
                                backgroundColor: "#FF525230",
                                border: "1px solid #FF525250",
                              }}>
                              <span className='text-red-400'>🎸</span>
                            </div>
                            <span className='text-sm font-medium text-white md:text-base'>
                              Technika
                            </span>
                          </div>
                          <div className='relative z-10 mb-6 flex items-end justify-between'>
                            <div className='flex items-baseline gap-1'>
                              <h3 className='text-xl font-bold tracking-wide text-white md:text-3xl'>
                                0:45
                              </h3>
                            </div>
                            <div className='flex items-center gap-1 text-base'>
                              <span
                                className='rounded-md px-2 py-0.5 text-sm font-medium'
                                style={{
                                  background: "#FF525220",
                                  color: "#FF5252",
                                }}>
                                40%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Theory */}
                        <div
                          className='relative overflow-hidden rounded-xl border-[0.5px] bg-[#171717] p-5 text-white transition-all duration-300'
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.05)",
                          }}>
                          <div className='relative z-10 mb-4 flex items-center gap-3'>
                            <div
                              className='flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition-all duration-300'
                              style={{
                                backgroundColor: "rgba(100, 100, 100, 0.15)",
                                border: "1px solid rgba(150, 150, 150, 0.2)",
                              }}>
                              <span className='text-gray-400'>📚</span>
                            </div>
                            <span className='text-sm font-medium text-gray-300 md:text-base'>
                              Teoria
                            </span>
                          </div>
                          <div className='relative z-10 mb-6 flex items-end justify-between'>
                            <div className='flex items-baseline gap-1'>
                              <h3 className='text-xl font-bold tracking-wide text-gray-200 md:text-3xl'>
                                0:32
                              </h3>
                            </div>
                            <div className='flex items-center gap-1 text-base'>
                              <span className='rounded-md bg-gray-700/30 px-2 py-0.5 text-sm font-medium text-gray-400'>
                                18%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Hearing */}
                        <div
                          className='relative overflow-hidden rounded-xl border-[0.5px] bg-[#171717] p-5 text-white transition-all duration-300'
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.05)",
                          }}>
                          <div className='relative z-10 mb-4 flex items-center gap-3'>
                            <div
                              className='flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition-all duration-300'
                              style={{
                                backgroundColor: "rgba(100, 100, 100, 0.15)",
                                border: "1px solid rgba(150, 150, 150, 0.2)",
                              }}>
                              <span className='text-gray-400'>👂</span>
                            </div>
                            <span className='text-sm font-medium text-gray-300 md:text-base'>
                              Słuch
                            </span>
                          </div>
                          <div className='relative z-10 mb-6 flex items-end justify-between'>
                            <div className='flex items-baseline gap-1'>
                              <h3 className='text-xl font-bold tracking-wide text-gray-200 md:text-3xl'>
                                0:28
                              </h3>
                            </div>
                            <div className='flex items-center gap-1 text-base'>
                              <span className='rounded-md bg-gray-700/30 px-2 py-0.5 text-sm font-medium text-gray-400'>
                                16%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Creativity */}
                        <div
                          className='relative overflow-hidden rounded-xl border-[0.5px] bg-[#171717] p-5 text-white transition-all duration-300'
                          style={{
                            borderColor: "rgba(255, 255, 255, 0.05)",
                          }}>
                          <div className='relative z-10 mb-4 flex items-center gap-3'>
                            <div
                              className='flex h-10 w-10 items-center justify-center rounded-full opacity-80 transition-all duration-300'
                              style={{
                                backgroundColor: "rgba(100, 100, 100, 0.15)",
                                border: "1px solid rgba(150, 150, 150, 0.2)",
                              }}>
                              <span className='text-gray-400'>🎨</span>
                            </div>
                            <span className='text-sm font-medium text-gray-300 md:text-base'>
                              Kreatywność
                            </span>
                          </div>
                          <div className='relative z-10 mb-6 flex items-end justify-between'>
                            <div className='flex items-baseline gap-1'>
                              <h3 className='text-xl font-bold tracking-wide text-gray-200 md:text-3xl'>
                                0:15
                              </h3>
                            </div>
                            <div className='flex items-center gap-1 text-base'>
                              <span className='rounded-md bg-gray-700/30 px-2 py-0.5 text-sm font-medium text-gray-400'>
                                8%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2 - System Umiejętności */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className='grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16'>
                {/* Visual Representation First */}
                <div className='order-2 lg:order-1'>
                  <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-8 backdrop-blur-xl'>
                    <h4 className='mb-6 text-lg font-semibold text-white'>
                      Drzewo umiejętności
                    </h4>

                    {/* Real Skill Tree Preview */}
                    <div className='space-y-4'>
                      {/* Available Points */}
                      <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-semibold text-white'>
                            Dostępne punkty:
                          </span>
                          <div className='rounded border border-emerald-500/30 bg-emerald-900/40 px-2 py-1 text-xs font-bold text-emerald-200'>
                            +5
                          </div>
                        </div>
                      </div>

                      {/* Skill Categories */}
                      <div className='grid grid-cols-2 gap-3'>
                        <div className='rounded-lg border border-red-500/30 bg-red-500/10 p-3'>
                          <div className='mb-2 flex items-center gap-2'>
                            <div className='h-3 w-3 rounded-full bg-red-400'></div>
                            <span className='text-sm font-semibold text-red-400'>
                              Technika
                            </span>
                            <div className='ml-auto rounded bg-red-900/40 px-1.5 py-0.5 text-xs text-red-200'>
                              +2
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-xs text-white/70'>
                              Podstawy palcowania
                            </div>
                            <div className='text-xs text-white/70'>
                              Akordy barré
                            </div>
                          </div>
                        </div>

                        <div className='rounded-lg border border-blue-500/30 bg-blue-500/10 p-3'>
                          <div className='mb-2 flex items-center gap-2'>
                            <div className='h-3 w-3 rounded-full bg-blue-400'></div>
                            <span className='text-sm font-semibold text-blue-400'>
                              Teoria
                            </span>
                            <div className='ml-auto rounded bg-blue-900/40 px-1.5 py-0.5 text-xs text-blue-200'>
                              +1
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-xs text-white/70'>
                              Budowa akordów
                            </div>
                            <div className='text-xs text-white/70'>
                              Skale durowe
                            </div>
                          </div>
                        </div>

                        <div className='rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3'>
                          <div className='mb-2 flex items-center gap-2'>
                            <div className='h-3 w-3 rounded-full bg-cyan-400'></div>
                            <span className='text-sm font-semibold text-cyan-400'>
                              Słuch
                            </span>
                            <div className='ml-auto rounded bg-cyan-900/40 px-1.5 py-0.5 text-xs text-cyan-200'>
                              +1
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-xs text-white/70'>
                              Rozpoznawanie interwałów
                            </div>
                            <div className='text-xs text-white/70'>
                              Dyktando rytmiczne
                            </div>
                          </div>
                        </div>

                        <div className='rounded-lg border border-purple-500/30 bg-purple-500/10 p-3'>
                          <div className='mb-2 flex items-center gap-2'>
                            <div className='h-3 w-3 rounded-full bg-purple-400'></div>
                            <span className='text-sm font-semibold text-purple-400'>
                              Kreatywność
                            </span>
                            <div className='ml-auto rounded bg-purple-900/40 px-1.5 py-0.5 text-xs text-purple-200'>
                              +1
                            </div>
                          </div>
                          <div className='space-y-1'>
                            <div className='text-xs text-white/70'>
                              Improwizacja bluesowa
                            </div>
                            <div className='text-xs text-white/70'>
                              Tworzenie riffów
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='order-1 space-y-6 lg:order-2'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/30 bg-gradient-to-br from-purple-900/20 to-purple-800/10 shadow-lg'>
                      <span className='text-3xl'>🧠</span>
                    </div>
                    <div>
                      <h3 className='text-3xl font-bold text-white'>
                        System Umiejętności
                      </h3>
                      <p className='text-purple-400'>
                        Punkty umiejętności i rozwój
                      </p>
                    </div>
                  </div>

                  <p className='text-lg leading-relaxed text-white/80'>
                    Za regularne ćwiczenia otrzymujesz punkty umiejętności,
                    które możesz wydać na odblokowanie nowych zdolności w 4
                    kategoriach. Każda umiejętność ma swój opis i wymogi,
                    tworząc strukturalną ścieżkę rozwoju.
                  </p>

                  <div className='space-y-4'>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-purple-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Zdobywaj punkty za ćwiczenia
                        </h4>
                        <p className='text-white/70'>
                          Każda sesja ćwiczeń daje punkty w odpowiedniej
                          kategorii
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-purple-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Odblokuj nowe umiejętności
                        </h4>
                        <p className='text-white/70'>
                          Wydawaj punkty na konkretne umiejętności w każdej
                          kategorii
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-purple-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Śledź swój progres
                        </h4>
                        <p className='text-white/70'>
                          Zobacz które umiejętności opanowałeś i co możesz
                          jeszcze rozwijać
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 3 - Biblioteka Utworów */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className='grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16'>
                <div className='space-y-6'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-900/20 to-amber-800/10 shadow-lg'>
                      <span className='text-3xl'>📚</span>
                    </div>
                    <div>
                      <h3 className='text-3xl font-bold text-white'>
                        Biblioteka Utworów
                      </h3>
                      <p className='text-amber-400'>
                        System zarządzania utworami
                      </p>
                    </div>
                  </div>

                  <p className='text-lg leading-relaxed text-white/80'>
                    Zaawansowana tabela utworów z systemem filtrów, ocen
                    trudności i statusów nauki. Każdy utwór ma tier (S, A, B, C,
                    D), oceny użytkowników i możliwość śledzenia postępów w
                    nauce.
                  </p>

                  <div className='space-y-4'>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-amber-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          System statusów
                        </h4>
                        <p className='text-white/70'>
                          "Chcę nauczyć", "Uczę się", "Nauczone" - organizuj
                          swoją naukę
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-amber-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Filtry i wyszukiwanie
                        </h4>
                        <p className='text-white/70'>
                          Filtruj po trudności, tier'ze, statusie i wyszukuj po
                          nazwie
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-amber-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Oceny i tier'y
                        </h4>
                        <p className='text-white/70'>
                          System tier'ów S-D i oceny trudności od społeczności
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Representation - Songs Table */}
                <div className='relative'>
                  <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-xl'>
                    <div className='mb-4 flex items-center justify-between'>
                      <h4 className='text-lg font-semibold text-white'>
                        Tabela utworów
                      </h4>
                      <div className='rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm text-amber-300'>
                        1,247 utworów
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className='mb-3 grid grid-cols-4 gap-2 rounded-lg bg-zinc-800/50 p-2 text-xs font-semibold text-zinc-400'>
                      <div>Artysta</div>
                      <div>Tytuł</div>
                      <div>Tier</div>
                      <div>Status</div>
                    </div>

                    {/* Table Rows */}
                    <div className='space-y-2'>
                      <div className='grid grid-cols-4 gap-2 rounded-lg border border-zinc-700/30 bg-emerald-500/5 p-2 text-sm'>
                        <div className='text-white'>Oasis</div>
                        <div className='text-white'>Wonderwall</div>
                        <div className='flex items-center gap-1'>
                          <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
                          <span className='font-bold text-cyan-400'>A</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <div className='h-2 w-2 rounded-full bg-emerald-400'></div>
                          <span className='text-xs text-emerald-400'>
                            Nauczone
                          </span>
                        </div>
                      </div>

                      <div className='grid grid-cols-4 gap-2 rounded-lg border border-zinc-700/30 bg-amber-500/5 p-2 text-sm'>
                        <div className='text-white'>Eagles</div>
                        <div className='text-white'>Hotel California</div>
                        <div className='flex items-center gap-1'>
                          <div className='h-2 w-2 rounded-full bg-amber-400'></div>
                          <span className='font-bold text-amber-400'>B</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <div className='h-2 w-2 rounded-full bg-amber-400'></div>
                          <span className='text-xs text-amber-400'>
                            Uczę się
                          </span>
                        </div>
                      </div>

                      <div className='grid grid-cols-4 gap-2 rounded-lg border border-zinc-700/30 bg-blue-500/5 p-2 text-sm'>
                        <div className='text-white'>Led Zeppelin</div>
                        <div className='text-white'>Stairway to Heaven</div>
                        <div className='flex items-center gap-1'>
                          <div className='h-2 w-2 rounded-full bg-red-400'></div>
                          <span className='font-bold text-red-400'>S</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <div className='h-2 w-2 rounded-full bg-blue-400'></div>
                          <span className='text-xs text-blue-400'>
                            Chcę nauczyć
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Filters preview */}
                    <div className='mt-4 flex flex-wrap gap-2'>
                      <div className='rounded border border-zinc-600/50 bg-zinc-800/30 px-2 py-1 text-xs text-zinc-400'>
                        Wszystkie statusy
                      </div>
                      <div className='rounded border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-xs text-amber-300'>
                        Tier: B
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 4 - Activity Log */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className='grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16'>
                {/* Visual Representation First */}
                <div className='order-2 lg:order-1'>
                  <div className='rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-8 backdrop-blur-xl'>
                    <div className='mb-6 flex items-center justify-between'>
                      <h4 className='text-lg font-semibold text-white'>
                        Activity Log
                      </h4>
                      <div className='flex gap-1 rounded-lg bg-white/10 p-1'>
                        <button className='rounded-md bg-white/20 px-2 py-1 text-xs font-medium text-white'>
                          2024
                        </button>
                        <button className='rounded-md px-2 py-1 text-xs font-medium text-white/70 hover:bg-white/10'>
                          2023
                        </button>
                      </div>
                    </div>

                    {/* Real Activity Calendar */}
                    <div className='space-y-4'>
                      {/* Days of week labels - positioned on left */}
                      <div className='text-xs text-white/70'>
                        <div className='grid grid-flow-col grid-rows-7 gap-1'>
                          <p className='row-span-3 mr-3 text-right'>Pn</p>
                          <p className='row-span-3 mr-3 text-right'>Śr</p>
                          <p className='mr-3 text-right'>Nd</p>

                          {/* Calendar Grid - continuous layout like real app */}
                          {Array.from({ length: 91 }, (_, i) => {
                            const intensity = Math.random();
                            let bgColor = "bg-white/10"; // default empty

                            if (intensity > 0.7) {
                              bgColor = "bg-red-500";
                            } else if (intensity > 0.5) {
                              bgColor = "bg-red-600/80";
                            } else if (intensity > 0.3) {
                              bgColor = "bg-red-700/60";
                            } else if (intensity > 0.15) {
                              bgColor = "bg-red-800/40";
                            }

                            return (
                              <div
                                key={i}
                                className={`h-3 w-3 rounded-sm ${bgColor} m-[0.2rem]`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Legend like in real app */}
                      <div className='flex flex-wrap gap-4 text-xs text-white/70'>
                        <div className='flex items-center gap-2'>
                          <div className='relative h-3 w-3 rounded-sm bg-red-500'>
                            <div className='absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white' />
                          </div>
                          <span>Z tytułem</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='relative h-3 w-3 rounded-sm bg-red-500'>
                            <div className='absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white' />
                          </div>
                          <span>Data wsteczna</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className='grid grid-cols-2 gap-4 border-t border-zinc-700/30 pt-4'>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-white'>
                            127
                          </div>
                          <div className='text-xs text-white/60'>
                            Dni ćwiczeń
                          </div>
                        </div>
                        <div className='text-center'>
                          <div className='text-2xl font-bold text-white'>
                            89h
                          </div>
                          <div className='text-xs text-white/60'>
                            Łączny czas
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='order-1 space-y-6 lg:order-2'>
                  <div className='flex items-center gap-4'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 shadow-lg'>
                      <span className='text-3xl'>📅</span>
                    </div>
                    <div>
                      <h3 className='text-3xl font-bold text-white'>
                        Activity Log
                      </h3>
                      <p className='text-cyan-400'>
                        Kalendarz Twojej aktywności
                      </p>
                    </div>
                  </div>

                  <p className='text-lg leading-relaxed text-white/80'>
                    Kalendarz aktywności pokazuje Twoją historię ćwiczeń w
                    postaci kolorowych kwadratów. Czerwone kwadraty oznaczają
                    dni z ćwiczeniami, a różne odcienie pokazują intensywność.
                    Możesz przeglądać różne lata i śledzić swoją regularność.
                  </p>

                  <div className='space-y-4'>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-cyan-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Czerwone kwadraty = dni ćwiczeń
                        </h4>
                        <p className='text-white/70'>
                          Każdy dzień z ćwiczeniami jest oznaczony czerwonym
                          kwadratem
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-cyan-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>Wybór roku</h4>
                        <p className='text-white/70'>
                          Przeglądaj swoją aktywność z 2023, 2024 i kolejnych
                          lat
                        </p>
                      </div>
                    </div>
                    <div className='flex items-start gap-3'>
                      <div className='mt-2 h-2 w-2 rounded-full bg-cyan-400'></div>
                      <div>
                        <h4 className='font-semibold text-white'>
                          Szczegóły sesji
                        </h4>
                        <p className='text-white/70'>
                          Kliknij na kwadrat aby zobaczyć szczegóły ćwiczeń z
                          danego dnia
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Jak to działa - 3 kroki */}
        <section className='relative bg-zinc-900/50 py-20 md:py-32'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='mb-16 text-center'>
              <h2 className='mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                Zacznij w 3 prostych krokach
              </h2>
            </motion.div>

            {/* Steps */}
            <div className='grid grid-cols-1 gap-12 md:grid-cols-3'>
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className='text-center'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg'>
                    <span className='text-3xl font-bold'>1</span>
                  </div>
                </div>
                <h3 className='mb-4 text-2xl font-bold text-white'>
                  Zarejestruj się w aplikacji
                </h3>
                <p className='leading-relaxed text-white/70'>
                  Stwórz darmowe konto i rozpocznij swoją muzyczną podróż z
                  Practice Together.
                </p>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className='text-center'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg'>
                    <span className='text-3xl font-bold'>2</span>
                  </div>
                </div>
                <h3 className='mb-4 text-2xl font-bold text-white'>
                  Wybierz lub stwórz plan ćwiczeń
                </h3>
                <p className='leading-relaxed text-white/70'>
                  Skorzystaj z gotowych planów lub stwórz własny program
                  dostosowany do Twoich celów.
                </p>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className='text-center'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg'>
                    <span className='text-3xl font-bold'>3</span>
                  </div>
                </div>
                <h3 className='mb-4 text-2xl font-bold text-white'>
                  Ćwicz i obserwuj swój progres
                </h3>
                <p className='leading-relaxed text-white/70'>
                  Regularnie ćwicz i śledź swoje postępy dzięki szczegółowym
                  statystykom i raportom.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Cennik / dostępność */}
        <section className='relative bg-zinc-950 py-20 md:py-32'>
          <div className='mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8'>
            {/* Section Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='space-y-8'>
              <h2 className='text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                Darmowy dostęp dla każdego
              </h2>

              <div className='mx-auto max-w-2xl'>
                <p className='text-xl italic leading-relaxed text-white/80'>
                  "Practice Together jest całkowicie darmowa – ćwicz, rozwijaj
                  się i baw muzyką bez żadnych opłat."
                </p>
              </div>

              {/* Features List */}
              <div className='mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                <div className='flex flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/50 text-white shadow-lg'>
                    <span className='text-2xl'>✓</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>Bez opłat</h3>
                  <p className='text-center text-sm text-white/70'>
                    Wszystkie funkcje dostępne za darmo
                  </p>
                </div>

                <div className='flex flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/50 text-white shadow-lg'>
                    <span className='text-2xl'>∞</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>Bez limitów</h3>
                  <p className='text-center text-sm text-white/70'>
                    Nieograniczone ćwiczenia i śledzenie
                  </p>
                </div>

                <div className='flex flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/50 text-white shadow-lg'>
                    <span className='text-2xl'>🚫</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>Bez reklam</h3>
                  <p className='text-center text-sm text-white/70'>
                    Czyste doświadczenie użytkownika
                  </p>
                </div>

                <div className='flex flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-900/50 text-white shadow-lg'>
                    <span className='text-2xl'>🎸</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>
                    Pełny dostęp
                  </h3>
                  <p className='text-center text-sm text-white/70'>
                    Wszystkie narzędzia i funkcje
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className='relative bg-zinc-900/50 py-20 md:py-32'>
          <div className='mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8'>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='space-y-8'>
              <h2 className='text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                Dołącz teraz i zacznij ćwiczyć skuteczniej
              </h2>

              <p className='mx-auto max-w-2xl text-xl leading-relaxed text-white/80'>
                Rozpocznij swoją muzyczną podróż już dziś. Darmowe konto, pełny
                dostęp, natychmiastowy start.
              </p>

              {/* CTA Button */}
              <div className='pt-8'>
                <Link href='/signup'>
                  <Button className='group relative overflow-hidden rounded-xl border-2 border-cyan-400 bg-gradient-to-r from-cyan-400 to-cyan-300 px-12 py-6 text-lg font-black text-black shadow-2xl transition-all duration-300 hover:scale-105 hover:from-cyan-300 hover:to-cyan-200 hover:shadow-cyan-400/50'>
                    <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                    <span className='relative z-10 flex items-center gap-3 tracking-wider'>
                      Zacznij za darmo
                      <ChevronRight className='h-6 w-6 transition-transform group-hover:translate-x-2' />
                    </span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className='relative bg-zinc-950 py-20 md:py-32'>
          <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='mb-16 text-center'>
              <h2 className='mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                Najczęściej zadawane pytania
              </h2>
            </motion.div>

            {/* Custom FAQ for Landing Page */}
            <div className='space-y-6'>
              {faqQuestions.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className='group'>
                  <div className='relative rounded-2xl border border-zinc-700/50 bg-zinc-900/30 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/30 hover:from-zinc-900/40 hover:to-zinc-900/20'>
                    {/* Corner Accents */}
                    <div className='absolute -left-2 -top-2 h-4 w-4 rounded-tl-lg border-l-2 border-t-2 border-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                    <div className='absolute -right-2 -top-2 h-4 w-4 rounded-tr-lg border-r-2 border-t-2 border-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>

                    <h3 className='mb-4 text-xl font-bold text-white'>
                      {faq.title}
                    </h3>
                    <p className='leading-relaxed text-white/80'>
                      {faq.message}
                    </p>

                    {/* Bottom Accents */}
                    <div className='absolute -bottom-2 -left-2 h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                    <div className='absolute -bottom-2 -right-2 h-4 w-4 rounded-br-lg border-b-2 border-r-2 border-cyan-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100'></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className='relative bg-zinc-900 py-16'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col items-center justify-between gap-8 sm:flex-row'>
              {/* Logo */}
              <div className='flex items-center gap-4'>
                <Image
                  src='/images/logo.svg'
                  alt='Logo'
                  width={32}
                  height={32}
                  className='h-8 w-8 brightness-0 invert'
                />
                <div>
                  <span className='text-xl font-bold text-white'>
                    Practice Together
                  </span>
                  <div className='text-sm text-gray-400'>
                    Ćwicz gitarę skuteczniej
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className='flex items-center gap-8 text-sm text-gray-400'>
                <Link
                  href='/contact'
                  className='transition-colors hover:text-white'>
                  Kontakt
                </Link>
                <Link
                  href='/privacy'
                  className='transition-colors hover:text-white'>
                  Polityka prywatności
                </Link>
                <Link
                  href='/faq'
                  className='transition-colors hover:text-white'>
                  FAQ
                </Link>
                <Link href='#' className='transition-colors hover:text-white'>
                  Social media
                </Link>
              </div>
            </div>

            {/* Copyright */}
            <div className='mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-500'>
              © 2024 Practice Together. Wszystkie prawa zastrzeżone.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "pl", ["common", "profile"])),
    },
  };
}
