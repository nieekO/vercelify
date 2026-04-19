import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { Login } from '../../pages/Login';

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the password input and sign-in button', () => {
    renderLogin();
    expect(screen.getByRole('textbox', { hidden: true }) ?? screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the Vercelify heading', () => {
    renderLogin();
    expect(screen.getByText('Vercelify')).toBeInTheDocument();
  });

  it('calls login() and navigates to / on successful submit', async () => {
    mockLogin.mockResolvedValue(undefined);
    renderLogin();

    const input = screen.getByPlaceholderText('••••••••');
    await userEvent.type(input, 'correct-password');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('correct-password'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid password'));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Invalid password')).toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables button while loading', async () => {
    let resolve!: () => void;
    mockLogin.mockReturnValue(new Promise(r => { resolve = r; }));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    resolve();
  });

  it('clears error message when resubmitting', async () => {
    mockLogin
      .mockRejectedValueOnce(new Error('wrong'))
      .mockResolvedValue(undefined);

    renderLogin();
    const input = screen.getByPlaceholderText('••••••••');
    await userEvent.type(input, 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => screen.getByText('Invalid password'));

    await userEvent.clear(input);
    await userEvent.type(input, 'correct');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });
});
