export const categoryColors = {
  technique: "bg-blue-100 text-blue-800 border-blue-200",
  theory: "bg-emerald-100 text-emerald-800 border-emerald-200",
  creativity: "bg-purple-100 text-purple-800 border-purple-200",
  hearing: "bg-orange-100 text-orange-800 border-orange-200",
} as const;

export const categoryGradients = {
  technique:
    "from-blue-500/5 via-transparent to-indigo-500/5 hover:from-blue-500/10 hover:to-indigo-500/10",
  theory:
    "from-emerald-500/5 via-transparent to-green-500/5 hover:from-emerald-500/10 hover:to-green-500/10",
  creativity:
    "from-purple-500/5 via-transparent to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10",
  hearing:
    "from-orange-500/5 via-transparent to-amber-500/5 hover:from-orange-500/10 hover:to-amber-500/10",
} as const; 