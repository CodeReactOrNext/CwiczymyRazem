import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useActivityLogData } from '../useActivityLogData';
import * as utils from '../../activityLog.utils';
import type { ReportListInterface } from 'types/api.types';

// Mock the utils functions used in the hook
vi.mock('../../activityLog.utils', () => ({
  formatDateKey: vi.fn((year, month, day) => `${year}-${month + 1}-${day}`),
  getEmptySlots: vi.fn(() => [
    { date: new Date(), report: undefined },
    { date: new Date(), report: undefined }
  ])
}));

describe('useActivityLogData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when reportList is null', () => {
    const { result } = renderHook(() => useActivityLogData(null, 2023));
    
    expect(result.current.activityData).toEqual([]);
  });

  it('should process report list into calendar data structure', () => {
    // Creating mock reports for January 1st and January 15th
    const mockReports = [
      {
        date: new Date('2023-01-01T00:00:00.000Z'),
        points: 10,
        timeSumary: { techniqueTime: 30, theoryTime: 20, hearingTime: 15, creativityTime: 10, sumTime: 75 }
      },
      {
        date: new Date('2023-01-15T00:00:00.000Z'),
        points: 15,
        timeSumary: { techniqueTime: 25, theoryTime: 15, hearingTime: 10, creativityTime: 5, sumTime: 55 }
      }
    ] as ReportListInterface[];

    const { result } = renderHook(() => useActivityLogData(mockReports, 2023));
    
    // We're testing if getEmptySlots was called at the beginning of the year
    expect(utils.getEmptySlots).toHaveBeenCalledWith(expect.any(Number));
    
    // The activityData should have entries for all days in the year plus empty slots
    // 365 days in 2023 + 2 empty slots = 367
    // This assumes non-leap year and that getEmptySlots returns 2 slots in our mock
    const expectedLength = 365 + 2; 
    expect(result.current.activityData.length).toBe(expectedLength);
    
    // Check if the reports are correctly mapped to their dates
    const jan1Data = result.current.activityData.find(
      item => item.date.getMonth() === 0 && item.date.getDate() === 1
    );
    const jan15Data = result.current.activityData.find(
      item => item.date.getMonth() === 0 && item.date.getDate() === 15
    );
    
    expect(jan1Data?.report).toBe(mockReports[0]);
    expect(jan15Data?.report).toBe(mockReports[1]);
  });

  it('should regenerate calendar data when year changes', () => {
    const mockReports = [
      { date: new Date('2023-01-01T00:00:00.000Z') }
    ] as ReportListInterface[];

    // Initial render with 2023
    const { result, rerender } = renderHook(
      ({ reportList, year }) => useActivityLogData(reportList, year),
      { initialProps: { reportList: mockReports, year: 2023 } }
    );
    
    // First call
    expect(utils.getEmptySlots).toHaveBeenCalledTimes(1);
    
    // Rerender with different year
    rerender({ reportList: mockReports, year: 2024 });
    
    // getEmptySlots should be called again for the new year
    expect(utils.getEmptySlots).toHaveBeenCalledTimes(2);
  });
}); 