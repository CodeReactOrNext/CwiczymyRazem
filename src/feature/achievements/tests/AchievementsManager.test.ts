import { describe, expect, it, vi } from 'vitest';

import type { AchievementContext, AchievementsDataInterface } from '../types';
import { AchievementManager } from '../utils/AchievementsManager';

vi.mock('../data/achievementsData', () => ({
  achievementsData: [
    {
      id: 'time_1',
      check: (ctx: AchievementContext) => ctx.statistics.points >= 10,
    },
    {
      id: 'points_1',
      check: (ctx: AchievementContext) => ctx.statistics.points >= 100,
    }
  ] as Partial<AchievementsDataInterface>[]
}));

describe('AchievementManager', () => {
  const createMockContext = (overrides: any = {}): AchievementContext => ({
    statistics: {
      achievements: [],
      points: 0,
      ...overrides?.statistics,
    },
    ...overrides,
  } as AchievementContext);

  it('should return newly earned achievements that pass the check', () => {
    const ctx = createMockContext({
      statistics: {
        achievements: [],
        points: 50
      }
    });

    const newlyEarned = AchievementManager.getNewlyEarned(ctx);

    expect(newlyEarned).toEqual(['time_1']);
  });

  it('should NOT return achievements that were already earned', () => {
    const ctx = createMockContext({
      statistics: {
        achievements: ['time_1'],
        points: 50
      }
    });

    const newlyEarned = AchievementManager.getNewlyEarned(ctx);

    expect(newlyEarned).toEqual([]);
  });

  it('should return multiple new achievements if they pass the check', () => {
    const ctx = createMockContext({
      statistics: {
        achievements: [],
        points: 150
      }
    });

    const newlyEarned = AchievementManager.getNewlyEarned(ctx);

    expect(newlyEarned).toContain('time_1');
    expect(newlyEarned).toContain('points_1');
    expect(newlyEarned.length).toBe(2);
  });

  it('should return empty array if no achievements pass the check', () => {
    const ctx = createMockContext({
      statistics: {
        achievements: [],
        points: 5
      }
    });

    const newlyEarned = AchievementManager.getNewlyEarned(ctx);
    expect(newlyEarned).toEqual([]);
  });
});
