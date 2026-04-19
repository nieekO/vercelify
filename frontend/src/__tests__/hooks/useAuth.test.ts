import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../services/api', () => ({
  default: { get: mockGet, post: mockPost },
}));

import { useAuth } from '../../hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('sets isAuthenticated to false when no token in localStorage', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });

  it('verifies token and sets isAuthenticated true on success', async () => {
    localStorage.setItem('vercelify_token', 'valid-token');
    mockGet.mockResolvedValue({ data: { valid: true } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('/auth/verify');
  });

  it('sets isAuthenticated false when verify returns valid: false', async () => {
    localStorage.setItem('vercelify_token', 'expired-token');
    mockGet.mockResolvedValue({ data: { valid: false } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });

  it('sets isAuthenticated false when verify throws', async () => {
    localStorage.setItem('vercelify_token', 'token');
    mockGet.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
  });

  it('login() POSTs password, stores token, sets authenticated', async () => {
    mockPost.mockResolvedValue({ data: { token: 'new-jwt' } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => result.current.isAuthenticated !== null);

    await act(async () => {
      await result.current.login('my-password');
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/login', { password: 'my-password' });
    expect(localStorage.getItem('vercelify_token')).toBe('new-jwt');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('login() throws when API returns error', async () => {
    mockPost.mockRejectedValue(new Error('Invalid password'));

    const { result } = renderHook(() => useAuth());
    await waitFor(() => result.current.isAuthenticated !== null);

    await expect(
      act(async () => { await result.current.login('wrong'); }),
    ).rejects.toThrow('Invalid password');
    expect(localStorage.getItem('vercelify_token')).toBeNull();
  });

  it('logout() removes token and sets isAuthenticated false', async () => {
    localStorage.setItem('vercelify_token', 'token');
    mockGet.mockResolvedValue({ data: { valid: true } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => result.current.logout());

    expect(localStorage.getItem('vercelify_token')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
