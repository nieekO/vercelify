import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { vi } from 'vitest';

const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../services/api', () => ({
  default: { get: mockGet, delete: mockDelete },
}));

import { useProjects, useProject, useDeleteProject } from '../../hooks/useProjects';

const PROJECT = {
  id: 'p1', name: 'test', environment: 'production', createdAt: '2024-01-01',
  coolifyProjectUuid: 'c', appServiceUuid: 'a', supabaseServiceUuid: 's',
  appUrl: '', supabaseStudioUrl: '', supabaseAnonKey: '', gitRepo: 'u/r',
  gitBranch: 'main', buildCommand: '', outputDir: '', port: 3000, supabaseSchemas: [],
};

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useProjects', () => {
  it('fetches and returns the projects list', async () => {
    mockGet.mockResolvedValue({ data: [PROJECT] });
    const { result } = renderHook(() => useProjects(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([PROJECT]);
    expect(mockGet).toHaveBeenCalledWith('/projects');
  });

  it('returns error state when fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useProjects(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useProject', () => {
  it('fetches a single project by id', async () => {
    mockGet.mockResolvedValue({ data: PROJECT });
    const { result } = renderHook(() => useProject('p1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(PROJECT);
    expect(mockGet).toHaveBeenCalledWith('/projects/p1');
  });

  it('does not fetch when id is empty', () => {
    const { result } = renderHook(() => useProject(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useDeleteProject', () => {
  it('calls DELETE and invalidates project queries', async () => {
    mockDelete.mockResolvedValue({ data: { success: true } });
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('p1');
    });

    expect(mockDelete).toHaveBeenCalledWith('/projects/p1');
  });

  it('propagates error from DELETE', async () => {
    mockDelete.mockRejectedValue(new Error('forbidden'));
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('p1')).rejects.toThrow('forbidden');
    });
  });
});
