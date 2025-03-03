import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaClock, FaList, FaRandom } from "react-icons/fa";

interface PracticeModeSelectorProps {
  onSelectMode: (mode: "timer" | "plan" | "auto") => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const PracticeModeSelector = ({
  onSelectMode,
}: PracticeModeSelectorProps) => {
  const { t } = useTranslation(["common", "timer"]);

  const modes = [
    {
      id: "timer" as const,
      icon: FaClock,
      title: t("timer:modes.timer.title" as any),
      description: t("timer:modes.timer.description" as any),
      gradient:
        "from-slate-500/5 to-slate-600/5 hover:from-slate-500/10 hover:to-slate-600/10",
      iconColor: "text-slate-700",
      onClick: () => onSelectMode("timer"),
    },
    {
      id: "plan" as const,
      icon: FaList,
      title: t("timer:modes.plan.title" as any),
      description: t("timer:modes.plan.description" as any),
      gradient:
        "from-slate-400/5 to-slate-500/5 hover:from-slate-400/10 hover:to-slate-500/10",
      iconColor: "text-slate-700",
      onClick: () => onSelectMode("plan"),
    },
    {
      id: "auto" as const,
      icon: FaRandom,
      title: t("timer:modes.auto.title" as any),
      description: t("timer:modes.auto.description" as any),
      gradient:
        "from-slate-300/5 to-slate-400/5 hover:from-slate-300/10 hover:to-slate-400/10",
      iconColor: "text-slate-700",
      onClick: () => onSelectMode("auto"),
    },
  ] as const;

  return (
    <div className='container mx-auto max-w-5xl py-12 font-openSans'>
      <motion.div
        initial='hidden'
        animate='show'
        variants={container}
        className='space-y-8'>
        <div className='text-center'>
          <motion.h1
            className='text-4xl font-bold tracking-tight'
            variants={item}>
            {t("timer:select_practice_mode" as any)}
          </motion.h1>
          <motion.p
            className='mt-3 text-lg text-muted-foreground'
            variants={item}>
            {t("timer:choose_practice_description" as any)}
          </motion.p>
        </div>

        <motion.div className='grid gap-6 md:grid-cols-3' variants={item}>
          {modes.map((mode) => (
            <Card
              key={mode.id}
              className='group relative overflow-hidden border border-border/40 bg-background transition-all duration-300 hover:shadow-lg'
              onClick={mode.onClick}>
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} transition-all duration-300`}
              />

              <div className='relative z-10 flex cursor-pointer flex-col items-center p-8'>
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 ${mode.iconColor}`}>
                  <mode.icon className='h-8 w-8' />
                </div>

                <h2 className='mb-3 text-2xl font-semibold tracking-tight text-foreground'>
                  {mode.title}
                </h2>

                <p className='text-center text-sm text-muted-foreground'>
                  {mode.description}
                </p>

                <Button
                  className='mt-6 w-full bg-white text-slate-900 shadow-sm transition-all duration-300 group-hover:translate-y-1 hover:bg-white/90'
                  variant='outline'>
                  {t("common:select" as any)}
                </Button>
              </div>
            </Card>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};
