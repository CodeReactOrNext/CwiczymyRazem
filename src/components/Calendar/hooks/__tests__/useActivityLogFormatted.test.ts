import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react-hooks';
import { useActivityLogFormatted } from '../useActivityLogFormatted';
import type { ReportListInterface } from 'types/api.types';

describe('useActivityLogFormatted', () => {
  it('should return empty array when reportList is null', () => {
    const { result } = renderHook(() => useActivityLogFormatted(null));
    
    expect(result.current.formattedReports).toEqual([]);
  });

  it('should format reports with time summary properly', () => {
    const mockReports = [
      {
        date: new Date('2023-01-01'),
        timeSumary: {
          techniqueTime: 30,
          theoryTime: 20,
          hearingTime: 15,
          creativityTime: 10,
          sumTime: 75
        }
      },
      {
        date: new Date('2023-01-02'),
        timeSumary: {
          techniqueTime: 45,
          theoryTime: 0,
          hearingTime: 30,
          creativityTime: 15,
          sumTime: 90
        }
      }
    ] as ReportListInterface[];

    const { result } = renderHook(() => useActivityLogFormatted(mockReports));
    
    expect(result.current.formattedReports).toEqual([
      {
        date: mockReports[0].date,
        techniqueTime: 30,
        theoryTime: 20,
        hearingTime: 15,
        creativityTime: 10
      },
      {
        date: mockReports[1].date,
        techniqueTime: 45,
        theoryTime: 0,
        hearingTime: 30,
        creativityTime: 15
      }
    ]);
  });

  it('should handle missing timeSumary properties by defaulting to zero', () => {
    const mockReports = [
      {
        date: new Date('2023-01-01'),
        timeSumary: {
          techniqueTime: 30,
          // missing other properties
        }
      },
      {
        date: new Date('2023-01-02'),
        // missing timeSumary entirely
      }
    ] as ReportListInterface[];

    const { result } = renderHook(() => useActivityLogFormatted(mockReports));
    
    expect(result.current.formattedReports).toEqual([
      {
        date: mockReports[0].date,
        techniqueTime: 30,
        theoryTime: 0,
        hearingTime: 0,
        creativityTime: 0
      },
      {
        date: mockReports[1].date,
        techniqueTime: 0,
        theoryTime: 0,
        hearingTime: 0,
        creativityTime: 0
      }
    ]);
  });
}); 