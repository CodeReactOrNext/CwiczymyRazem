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

      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black'>
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
        <section className='relative min-h-screen overflow-hidden bg-black'>
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
            <div className='absolute inset-0 z-10 bg-gradient-to-r from-black via-black/40 to-transparent sm:via-black/50'></div>
            <div className='absolute inset-0 z-10 bg-gradient-to-t from-black/30 via-transparent to-transparent'></div>
          </div>

          {/* Left Side Enhanced Background - Mobile Optimized */}
          <div className='z-5 absolute left-0 top-0 h-full w-full bg-gradient-to-r from-black to-black/80 sm:w-1/5 sm:to-black/95 md:w-1/3 lg:w-1/4 xl:w-1/5'></div>

          {/* Enhanced Animated Elements */}
          <div className='absolute inset-0 z-20 overflow-hidden'>
            {/* Floating Particles */}
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className='absolute animate-pulse rounded-full bg-cyan-400/20'
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
          <div className='z-5 absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl'></div>
          <div className='bg-cyan-400/3 z-5 absolute left-1/4 top-1/3 h-64 w-64 rounded-full blur-2xl'></div>

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
                      <div className='flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-400/25 to-cyan-900/20 shadow-2xl backdrop-blur-xl sm:h-14 sm:w-14'>
                        <Image
                          src='/images/logo.svg'
                          alt='Logo'
                          width={28}
                          height={28}
                          className='h-6 w-6 sm:h-7 sm:w-7'
                          priority
                        />
                      </div>
                      <div className='absolute -inset-2 rounded-xl bg-gradient-to-r from-cyan-400/30 via-cyan-400/15 to-transparent blur-lg'></div>
                      <div className='absolute -inset-1 rounded-xl bg-cyan-400/20 blur-sm'></div>
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
                      <div className='absolute -inset-1 -z-10 bg-cyan-400/20 blur-xl'></div>
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
                      className='group relative rounded-lg border-2 border-cyan-400/60 bg-gradient-to-br from-cyan-400/15 to-black/20 px-6 py-3 text-sm font-bold tracking-wider text-cyan-400 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400 hover:from-cyan-400/25 hover:to-black/10 hover:shadow-cyan-400/30 sm:rounded-xl sm:px-8 sm:py-4 sm:text-base md:px-10 md:py-5 lg:px-12 lg:py-6 lg:text-lg'>
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
        <section className='relative bg-gradient-to-br from-gray-900 via-slate-900 to-black py-20 md:py-32'>
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
                <div className='rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-xl'>
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

        {/* Funkcje aplikacji */}
        <section className='relative bg-gradient-to-br from-slate-900 via-gray-900 to-black py-20 md:py-32'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className='mb-16 text-center'>
              <h2 className='mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl'>
                Co znajdziesz w Practice Together?
              </h2>
            </motion.div>

            {/* Features Grid */}
            <div className='grid grid-cols-1 gap-12 md:grid-cols-3'>
              {/* Feature 1 - Śledzenie postępów */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className='text-center'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black shadow-lg'>
                    <span className='text-3xl'>📊</span>
                  </div>
                </div>
                <h3 className='mb-4 text-2xl font-bold text-white'>
                  Śledzenie postępów
                </h3>
                <p className='leading-relaxed text-white/70'>
                  Raporty i statystyki z ćwiczeń, które pokazują Twój
                  rzeczywisty progres w nauce gitary.
                </p>
              </motion.div>

              {/* Feature 2 - Ćwiczenia gitarowe */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className='text-center'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black shadow-lg'>
                    <span className='text-3xl'>🎸</span>
                  </div>
                </div>
                <h3 className='mb-4 text-2xl font-bold text-white'>
                  Ćwiczenia gitarowe
                </h3>
                <p className='leading-relaxed text-white/70'>
                  Gotowe plany treningowe oraz możliwość tworzenia własnych
                  ćwiczeń dostosowanych do Twoich potrzeb.
                </p>
              </motion.div>

              {/* Feature 3 - Gamifikacja */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className='text-center'>
                <div className='mb-6 flex justify-center'>
                  <div className='flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black shadow-lg'>
                    <span className='text-3xl'>🏆</span>
                  </div>
                </div>
                <h3 className='mb-4 text-2xl font-bold text-white'>
                  Gamifikacja
                </h3>
                <p className='leading-relaxed text-white/70'>
                  Odblokowywanie umiejętności i osiągnięcia, które motywują do
                  regularnych ćwiczeń.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Jak to działa - 3 kroki */}
        <section className='relative bg-gradient-to-br from-gray-900 via-slate-900 to-black py-20 md:py-32'>
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
                  <div className='flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'>
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
        <section className='relative bg-gradient-to-br from-slate-900 via-gray-900 to-black py-20 md:py-32'>
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
                <div className='flex flex-col items-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black text-white shadow-lg'>
                    <span className='text-2xl'>✓</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>Bez opłat</h3>
                  <p className='text-center text-sm text-white/70'>
                    Wszystkie funkcje dostępne za darmo
                  </p>
                </div>

                <div className='flex flex-col items-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black text-white shadow-lg'>
                    <span className='text-2xl'>∞</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>Bez limitów</h3>
                  <p className='text-center text-sm text-white/70'>
                    Nieograniczone ćwiczenia i śledzenie
                  </p>
                </div>

                <div className='flex flex-col items-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black text-white shadow-lg'>
                    <span className='text-2xl'>🚫</span>
                  </div>
                  <h3 className='mb-2 font-semibold text-white'>Bez reklam</h3>
                  <p className='text-center text-sm text-white/70'>
                    Czyste doświadczenie użytkownika
                  </p>
                </div>

                <div className='flex flex-col items-center rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur-xl'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-gradient-to-br from-cyan-900 to-black text-white shadow-lg'>
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
        <section className='relative bg-gradient-to-br from-gray-900 to-black py-20 md:py-32'>
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
        <section className='relative bg-gradient-to-br from-gray-900 via-slate-900 to-black py-20 md:py-32'>
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
                  <div className='relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/30 hover:from-white/15 hover:to-white/10'>
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
        <footer className='relative bg-gray-900 py-16'>
          <div className='mx-auto max-w-6xl px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col items-center justify-between gap-8 sm:flex-row'>
              {/* Logo */}
              <div className='flex items-center gap-4'>
                <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg'>
                  <Image
                    src='/images/logo.svg'
                    alt='Logo'
                    width={24}
                    height={24}
                    className='h-6 w-6 text-white'
                  />
                </div>
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
