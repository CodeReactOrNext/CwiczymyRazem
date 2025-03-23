import { act,renderHook } from '@testing-library/react-hooks';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { useActivityLog } from '../useActivityLog';
import { useActivityLogData } from '../useActivityLogData';
import { useActivityLogFormatted } from '../useActivityLogFormatted';
import { useActivityLogReports } from '../useActivityLogReports';
import { useActivityLogYear } from '../useActivityLogYear';

// Mock all the dependent hooks
vi.mock('../useActivityLogYear');
vi.mock('../useActivityLogReports');
vi.mock('../useActivityLogData');
vi.mock('../useActivityLogFormatted');

describe('useActivityLog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    (useActivityLogYear as any).mockReturnValue({
      year: 2023,
      setYear: vi.fn()
    });
    
    (useActivityLogReports as any).mockReturnValue({
      reportList: [{ id: 1, date: new Date() }]
    });
    
    (useActivityLogData as any).mockReturnValue({
      activityData: [{ date: new Date(), report: { id: 1 } }]
    });
    
    (useActivityLogFormatted as any).mockReturnValue({
      formattedReports: [{ date: new Date(), techniqueTime: 30 }]
    });
  });

  it('should compose data from all hooks correctly', () => {
    const mockSetYear = vi.fn();
    (useActivityLogYear as any).mockReturnValue({
      year: 2023,
      setYear: mockSetYear
    });
    
    const mockReportList = [{ id: 1, date: new Date() }];
    (useActivityLogReports as any).mockReturnValue({
      reportList: mockReportList
    });
    
    const mockActivityData = [{ date: new Date(), report: { id: 1 } }];
    (useActivityLogData as any).mockReturnValue({
      activityData: mockActivityData
    });
    
    const mockFormattedReports = [{ date: new Date(), techniqueTime: 30 }];
    (useActivityLogFormatted as any).mockReturnValue({
      formattedReports: mockFormattedReports
    });

    // Render the hook
    const { result } = renderHook(() => useActivityLog('test-user-id'));
    
    // Check if all dependent hooks were called with correct parameters
    expect(useActivityLogYear).toHaveBeenCalled();
    expect(useActivityLogReports).toHaveBeenCalledWith('test-user-id');
    expect(useActivityLogData).toHaveBeenCalledWith(mockReportList, 2023);
    expect(useActivityLogFormatted).toHaveBeenCalledWith(mockReportList);
    
    // Check if the returned data is correctly composed
    expect(result.current).toEqual({
      reportList: mockFormattedReports,
      year: 2023,
      setYear: mockSetYear,
      datasWithReports: mockActivityData
    });
  });

  it('should proxy the setYear function correctly', () => {
    const mockSetYear = vi.fn();
    (useActivityLogYear as any).mockReturnValue({
      year: 2023,
      setYear: mockSetYear
    });

    // Render the hook
    const { result } = renderHook(() => useActivityLog('test-user-id'));
    
    // Call the setYear function
    act(() => {
      result.current.setYear(2024);
    });
    
    // Check if the original setYear was called with the right parameter
    expect(mockSetYear).toHaveBeenCalledWith(2024);
  });

  it('should handle empty userAuth gracefully', () => {
    // Setup mock for empty user
    (useActivityLogReports as any).mockReturnValue({
      reportList: null
    });
    
    (useActivityLogData as any).mockReturnValue({
      activityData: []
    });
    
    (useActivityLogFormatted as any).mockReturnValue({
      formattedReports: []
    });

    // Render the hook with empty userAuth
    const { result } = renderHook(() => useActivityLog(''));
    
    // Check if the hook handles empty data correctly
    expect(result.current.reportList).toEqual([]);
    expect(result.current.datasWithReports).toEqual([]);
  });
}); 