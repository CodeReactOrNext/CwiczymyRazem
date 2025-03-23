import { describe, expect,it } from 'vitest';

import { formatDateKey, getEmptySlots, processRawReports } from '../activityLog.utils';

describe('activityLog.utils', () => {
  describe('getEmptySlots', () => {
    it('should return empty array when no slots needed', () => {
      // Sunday has index 6, which equals numOfDayWhereUiStart, so no slots needed
      const result = getEmptySlots(6);
      expect(result).toEqual([]);
    });

    it('should return correct number of empty slots', () => {
      // Monday has index 1, so 6-1=5 slots needed
      const result = getEmptySlots(1);
      expect(result.length).toBe(5);
      
      // Each slot should have a date and undefined report
      result.forEach((slot) => {
        expect(slot).toHaveProperty('date');
        expect(slot.date).toBeInstanceOf(Date);
        expect(slot.report).toBeUndefined();
      });
    });
  });

  describe('formatDateKey', () => {
    it('should format date components correctly', () => {
      expect(formatDateKey(2023, 0, 1)).toBe('2023-01-01');
      expect(formatDateKey(2023, 11, 31)).toBe('2023-12-31');
      expect(formatDateKey(2023, 8, 9)).toBe('2023-09-09');
    });

    it('should handle single-digit month and day with padding', () => {
      expect(formatDateKey(2023, 0, 1)).toBe('2023-01-01');
    });
  });

  describe('processRawReports', () => {
    it('should process raw reports into the correct format', () => {
      const rawReports = [
        {
          reportDate: { seconds: 1672531200 }, // 2023-01-01
          totalPoints: 10,
          bonusPoints: { time: 30 },
          isDateBackReport: false,
          exceriseTitle: 'Exercise 1',
          timeSumary: {
            techniqueTime: 10,
            theoryTime: 10,
            hearingTime: 5,
            creativityTime: 5,
            sumTime: 30
          }
        }
      ];

      const result = processRawReports(rawReports);
      
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(expect.objectContaining({
        points: 10,
        totalTime: 30,
        isDateBackReport: false,
        exceriseTitle: 'Exercise 1'
      }));
      
      // Check date formatting
      expect(result[0].date).toBeInstanceOf(Date);
      
      // Check time summary
      expect(result[0].timeSumary).toEqual({
        techniqueTime: 10,
        theoryTime: 10,
        hearingTime: 5,
        creativityTime: 5,
        sumTime: 30
      });
    });

    it('should combine multiple reports from the same day', () => {
      const sameDay = 1672531200; // 2023-01-01
      const rawReports = [
        {
          reportDate: { seconds: sameDay },
          totalPoints: 10,
          bonusPoints: { time: 30 },
          isDateBackReport: false,
          exceriseTitle: 'Exercise 1',
          timeSumary: {
            techniqueTime: 10,
            theoryTime: 10,
            hearingTime: 5,
            creativityTime: 5,
            sumTime: 30
          }
        },
        {
          reportDate: { seconds: sameDay },
          totalPoints: 15,
          bonusPoints: { time: 40 },
          isDateBackReport: false,
          exceriseTitle: 'Exercise 2',
          timeSumary: {
            techniqueTime: 15,
            theoryTime: 10,
            hearingTime: 10,
            creativityTime: 5,
            sumTime: 40
          }
        }
      ];

      const result = processRawReports(rawReports);
      
      // Reports should be combined
      expect(result.length).toBe(1);
      
      // Points should be added
      expect(result[0].points).toBe(25); // 10 + 15
      
      // Time should be added
      expect(result[0].totalTime).toBe(70); // 30 + 40
      
      // Titles should be concatenated
      expect(result[0].exceriseTitle).toBe('Exercise 2  Exercise 1');
      
      // Time summary should be summed
      expect(result[0].timeSumary).toEqual({
        techniqueTime: 25, // 10 + 15
        theoryTime: 20, // 10 + 10
        hearingTime: 15, // 5 + 10
        creativityTime: 10, // 5 + 5
        sumTime: 70 // 30 + 40
      });
    });

    it('should handle missing timeSumary in reports', () => {
      const rawReports = [
        {
          reportDate: { seconds: 1672531200 }, // 2023-01-01
          totalPoints: 10,
          bonusPoints: { time: 30 },
          isDateBackReport: false,
          exceriseTitle: 'Exercise 1',
          // No timeSumary
        },
        {
          reportDate: { seconds: 1672531200 }, // 2023-01-01
          totalPoints: 15,
          bonusPoints: { time: 40 },
          isDateBackReport: false,
          exceriseTitle: 'Exercise 2',
          timeSumary: {
            techniqueTime: 15,
            theoryTime: 10,
            hearingTime: 10,
            creativityTime: 5,
            sumTime: 40
          }
        }
      ];

      const result = processRawReports(rawReports);
      
      // Second report's timeSumary should be used
      expect(result[0].timeSumary).toEqual({
        techniqueTime: 15,
        theoryTime: 10,
        hearingTime: 10,
        creativityTime: 5,
        sumTime: 40
      });
    });
  });
}); 