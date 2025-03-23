import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useActivityLogReports } from '../useActivityLogReports';
import { firebaseGetUserRaprotsLogs } from 'feature/logs/services/getUserRaprotsLogs.service';
import * as utils from '../../activityLog.utils';
import type { MockedFunction } from 'vitest';

// Mock the dependencies
vi.mock('feature/logs/services/getUserRaprotsLogs.service');
vi.mock('../../activityLog.utils');

describe('useActivityLogReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch reports when userAuth is empty', async () => {
    // Setup the mock
    const mockedFirebaseGet = firebaseGetUserRaprotsLogs as MockedFunction<typeof firebaseGetUserRaprotsLogs>;
    
    // Render the hook with empty userAuth
    renderHook(() => useActivityLogReports(''));
    
    // Expect that the firebase function wasn't called
    expect(mockedFirebaseGet).not.toHaveBeenCalled();
  });

  it('should fetch and process reports on initial render with valid userAuth', async () => {
    // Setup mocks
    const mockRawReports = [
      { reportDate: { seconds: 1672531200 }, totalPoints: 10 }, // Jan 1, 2023
      { reportDate: { seconds: 1673136000 }, totalPoints: 15 }  // Jan 8, 2023
    ];
    const mockProcessedReports = [
      { date: new Date('2023-01-01'), points: 10 },
      { date: new Date('2023-01-08'), points: 15 }
    ];
    
    const mockedFirebaseGet = firebaseGetUserRaprotsLogs as MockedFunction<typeof firebaseGetUserRaprotsLogs>;
    mockedFirebaseGet.mockResolvedValue(mockRawReports);
    
    const mockedProcessRawReports = utils.processRawReports as MockedFunction<typeof utils.processRawReports>;
    mockedProcessRawReports.mockReturnValue(mockProcessedReports);
    
    // Use waitFor to wait for the async operation to complete
    const { result, waitForNextUpdate } = renderHook(() => useActivityLogReports('test-user-id'));
    
    // Wait for the useEffect to complete
    await waitForNextUpdate();
    
    // Check that the correct functions were called
    expect(mockedFirebaseGet).toHaveBeenCalledWith('test-user-id');
    expect(mockedProcessRawReports).toHaveBeenCalledWith(mockRawReports);
    
    // Check that the hook returns the processed reports
    expect(result.current.reportList).toEqual(mockProcessedReports);
  });

  it('should not fetch reports again if reportList is already populated', async () => {
    // Setup mocks
    const mockedFirebaseGet = firebaseGetUserRaprotsLogs as MockedFunction<typeof firebaseGetUserRaprotsLogs>;
    
    // First render to populate reportList
    const { rerender } = renderHook(
      ({ userAuth }) => useActivityLogReports(userAuth),
      { initialProps: { userAuth: 'test-user-id' } }
    );
    
    // Clear previous calls to check if it's called again
    mockedFirebaseGet.mockClear();
    
    // Rerender with the same props
    rerender({ userAuth: 'test-user-id' });
    
    // Firebase get should not be called again
    expect(mockedFirebaseGet).not.toHaveBeenCalled();
  });
}); 