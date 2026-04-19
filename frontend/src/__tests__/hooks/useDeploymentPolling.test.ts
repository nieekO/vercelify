import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({ default: { get: vi.fn() } }));

import api from '../../services/api';
import { useDeploymentPolling } from '../../hooks/useDeploymentPolling';

const mockGet = vi.mocked(api.get);

describe('useDeploymentPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGet.mockResolvedValue({ data: [{ uuid: 'd1', status: 'success' }] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty array when not active', () => {
    const { result } = renderHook(() => useDeploymentPolling('app-uuid', false));
    expect(result.current).toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty array when appUuid is undefined', () => {
    const { result } = renderHook(() => useDeploymentPolling(undefined, true));
    expect(result.current).toEqual([]);
  });

  it('polls the deployments endpoint when active', async () => {
    const { result } = renderHook(() => useDeploymentPolling('app-uuid', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
    });

    expect(mockGet).toHaveBeenCalledWith('/deployments?app=app-uuid&limit=5');
    expect(result.current).toEqual([{ uuid: 'd1', status: 'success' }]);
  });

  it('handles paginated data.data response', async () => {
    mockGet.mockResolvedValue({ data: { data: [{ uuid: 'd2' }] } });
    const { result } = renderHook(() => useDeploymentPolling('app-uuid', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
    });

    expect(result.current).toEqual([{ uuid: 'd2' }]);
  });

  it('ignores API errors silently', async () => {
    mockGet.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useDeploymentPolling('app-uuid', true));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
    });

    expect(result.current).toEqual([]);
  });

  it('stops polling on unmount', async () => {
    const { unmount } = renderHook(() => useDeploymentPolling('app-uuid', true));
    unmount();

    const callsBefore = mockGet.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(mockGet.mock.calls.length).toBe(callsBefore);
  });
});
