import { useEffect, useState } from "react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "assets/components/ui/chart"
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme"
import { useTranslation } from "react-i18next"
import type { CategoryKeys } from "components/Charts/ActivityChart"
import type { GuitarSkill, UserSkills } from "../skills.types"

interface SkillRadarChartProps {
  category: CategoryKeys
  skills: GuitarSkill[]
  userSkills: UserSkills
}

export function SkillRadarChart({ category, skills, userSkills }: SkillRadarChartProps) {
  const { t } = useTranslation("skills")
  const theme = getSkillTheme(category)
  const [isMobile, setIsMobile] = useState(false)
  const [chartRadius, setChartRadius] = useState("65%")
  const [fontSize, setFontSize] = useState(11)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setChartRadius("65%") // Increased from 55% since icons are compact
        setFontSize(9)
        setIsMobile(true)
      } else {
        setChartRadius("75%")
        setFontSize(11)
        setIsMobile(false)
      }
    }

    // Initial check
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const chartData = skills.map((skill) => ({
    subject: skill.name || t(`skills.${skill.id}.name` as any),
    points: userSkills.unlockedSkills[skill.id] || 0,
    fullMark: 50, 
    icon: skill.icon
  }))

  const chartConfig = {
    points: {
      label: "Points",
      color: theme.line, 
    },
  } satisfies ChartConfig

  const CustomTick = ({ payload, x, y, textAnchor, ...props }: any) => {
    const data = chartData[payload.index];
    const Icon = data?.icon;

    if (isMobile && Icon) {
        return (
            <g transform={`translate(${x},${y})`}>
                <foreignObject x={-15} y={-15} width={30} height={30}>
                  <div className="flex h-full w-full items-center justify-center text-zinc-400">
                    <Icon className="h-6 w-6" />
                  </div>
                </foreignObject>
            </g>
        );
    }

    return (
        <text
            {...props}
            x={x}
            y={y}
            textAnchor={textAnchor}
            fill="#a1a1aa"
            fontSize={fontSize}
        >
            <tspan dy="0.3em">{payload.value}</tspan>
        </text>
    );
  }

  return (
    <div className="flex justify-center items-center w-full h-full min-h-[250px] relative">
       {/* Background Glow */}
       <div
        className="absolute inset-0  pointer-events-none "
      />
      
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[300px] w-full bg-transparent"
      >
        <RadarChart data={chartData} outerRadius={chartRadius} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <PolarGrid className="stroke-zinc-800" />
          <PolarAngleAxis 
             dataKey="subject" 
             tick={(props) => <CustomTick {...props} />}
          />
          <Radar
            dataKey="points"
            fill={theme.line}
            fillOpacity={0.3}
            stroke={theme.line}
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  )
}
