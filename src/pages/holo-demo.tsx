import { AchievementCard } from "feature/achievements/components/AchievementCard";
import type { AchievementList } from "feature/achievements/achievementsData";

const demoAchievements: { rarity: string; ids: AchievementList[] }[] = [
  { rarity: "Common", ids: ["time_1", "points_1", "day_1", "session_1"] },
  { rarity: "Rare", ids: ["balance", "doctor", "record", "diamond"] },
  { rarity: "Very Rare", ids: ["time_3", "fire", "wizard", "medal"] },
  { rarity: "Epic", ids: ["lvl100", "fireSession", "batteryHearth", "100days"] },
];

export default function HoloDemo() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-8'>
      <h1 className='mb-8 text-center text-4xl font-bold text-white'>
        Pokemon Holographic Card Effects Demo
      </h1>
      <p className='mb-12 text-center text-lg text-gray-300'>
        Hover over the cards to see the holographic effects
      </p>

      {demoAchievements.map(({ rarity, ids }) => (
        <div key={rarity} className='mb-12'>
          <h2 className='mb-6 text-2xl font-semibold text-white'>{rarity}</h2>
          <div className='flex flex-wrap gap-8'>
            {ids.map((id) => (
              <div key={id} className='flex flex-col items-center'>
                <AchievementCard id={id} />
                <span className='mt-2 text-sm text-gray-400'>{id}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
