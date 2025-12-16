import { BookOpen, CheckCircle2, ListMusic } from "lucide-react";

export const STATUS_CONFIG = {
  wantToLearn: {
    icon: ListMusic,
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/10",
    borderColor: "border-zinc-400/20",
    bgHover: "hover:bg-zinc-400/20",
  },
  learning: {
    icon: BookOpen,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
    bgHover: "hover:bg-amber-400/20",
  },
  learned: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    bgHover: "hover:bg-green-500/20",
  },
} as const;
