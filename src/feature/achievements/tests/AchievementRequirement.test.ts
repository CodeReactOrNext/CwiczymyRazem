import { describe, it, expect } from 'vitest';
import { AchievementRequirement } from '../utils/AchievementRequirement';
import { AchievementContext } from '../types';

const createMockContext = (overrides: Partial<AchievementContext> = {}): AchievementContext => ({
  statistics: {
    time: {
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
      longestSession: 0,
    },
    lvl: 1,
    currentLevelMaxPoints: 100,
    points: 0,
    sessionCount: 0,
    habitsCount: 0,
    dayWithoutBreak: 0,
    maxPoints: 0,
    achievements: [],
    actualDayWithoutBreak: 0,
    lastReportDate: '',
    guitarStartDate: null,
    availablePoints: {
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
    },
    ...overrides?.statistics,
  },
  reportData: {
    reportDate: new Date(),
    totalPoints: 0,
    bonusPoints: {
      additionalPoints: 0,
      habitsCount: 0,
      multiplier: 1,
      time: 0,
      timePoints: 0,
    },
    skillPointsGained: {
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
    },
    ...overrides?.reportData,
  },
  inputData: {
    habbits: [],
    ...overrides?.inputData,
  } as any,
  songLists: {
    wantToLearn: [],
    learned: [],
    learning: [],
    ...overrides?.songLists,
  },
  ...overrides,
});

describe('AchievementRequirement', () => {
  describe('songCount', () => {
    it('should return true if song count is equal to or greater than min', () => {
      const check = AchievementRequirement.songCount('learned', 5);
      const ctx = createMockContext({
        songLists: { learned: ['1', '2', '3', '4', '5'], wantToLearn: [], learning: [] }
      });
      expect(check(ctx)).toBe(true);
    });

    it('should return false if song count is less than min', () => {
      const check = AchievementRequirement.songCount('learned', 5);
      const ctx = createMockContext({
        songLists: { learned: ['1', '2', '3'], wantToLearn: [], learning: [] }
      });
      expect(check(ctx)).toBe(false);
    });
  });

  describe('statThreshold', () => {
    it('should return true if stat is equal to or greater than min', () => {
      const check = AchievementRequirement.statThreshold('lvl', 10);
      const ctx = createMockContext({
        statistics: { lvl: 10 } as any
      });
      expect(check(ctx)).toBe(true);
    });

    it('should return false if stat is less than min', () => {
      const check = AchievementRequirement.statThreshold('lvl', 10);
      const ctx = createMockContext({
        statistics: { lvl: 9 } as any
      });
      expect(check(ctx)).toBe(false);
    });
  });

  describe('statTimeThreshold', () => {
    it('should return true if time stat is equal to or greater than min', () => {
      const check = AchievementRequirement.statTimeThreshold('technique', 1000);
      const ctx = createMockContext({
        statistics: { time: { technique: 1000 } } as any
      });
      expect(check(ctx)).toBe(true);
    });
  });

  describe('totalTimeThreshold', () => {
    it('should sum all times and compare with threshold', () => {
      const check = AchievementRequirement.totalTimeThreshold(100);
      const ctx = createMockContext({
        statistics: {
          time: {
            technique: 30,
            theory: 30,
            hearing: 20,
            creativity: 20,
          }
        } as any
      });
      expect(check(ctx)).toBe(true);
    });
  });

  describe('habitPresent', () => {
    it('should return true if habit is in inputData', () => {
      const check = AchievementRequirement.habitPresent('metronome' as any);
      const ctx = createMockContext({
        inputData: { habbits: ['metronome'] } as any
      });
      expect(check(ctx)).toBe(true);
    });
  });
});
