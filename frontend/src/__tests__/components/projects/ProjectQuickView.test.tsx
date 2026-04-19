import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

const mockPost = vi.fn();
vi.mock('../../../services/api', () => ({ default: { post: mockPost } }));

import { ProjectQuickView } from '../../../components/projects/ProjectQuickView';
import { ToastProvider } from '../../../components/ui/Toast';
import { VercelifyProject } from '../../../types';

const PROJECT: VercelifyProject = {
  id: 'p1', name: 'finance', environment: 'production', createdAt: '2024-01-15T00:00:00Z',
  coolifyProjectUuid: 'cp', appServiceUuid: 'app-uuid', supabaseServiceUuid: 'ss',
  appUrl: 'https://finance.example.com', supabaseStudioUrl: 'https://studio.example.com',
  supabaseAnonKey: 'anon', gitRepo: 'user/finance', gitBranch: 'main',
  buildCommand: 'npm run build', outputDir: 'dist', port: 3000,
  supabaseSchemas: ['finance-dev', 'finance-test'],
};

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProjectQuickView', () => {
  it('renders nothing when project is null', () => {
    render(<ProjectQuickView project={null} onClose={() => {}} />, { wrapper });
    expect(screen.queryByText('finance')).not.toBeInTheDocument();
  });

  it('renders project name and environment', () => {
    render(<ProjectQuickView project={PROJECT} onClose={() => {}} />, { wrapper });
    expect(screen.getByText('finance')).toBeInTheDocument();
    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('renders app URL as clickable link', () => {
    render(<ProjectQuickView project={PROJECT} onClose={() => {}} />, { wrapper });
    expect(screen.getByText('https://finance.example.com')).toBeInTheDocument();
  });

  it('renders git repo and branch', () => {
    render(<ProjectQuickView project={PROJECT} onClose={() => {}} />, { wrapper });
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText(/user\/finance/)).toBeInTheDocument();
  });

  it('renders Supabase link and schema badges', () => {
    render(<ProjectQuickView project={PROJECT} onClose={() => {}} />, { wrapper });
    expect(screen.getByText(/Supabase Studio/)).toBeInTheDocument();
    expect(screen.getByText('finance-dev')).toBeInTheDocument();
    expect(screen.getByText('finance-test')).toBeInTheDocument();
  });

  it('shows fallback when appUrl is empty', () => {
    const noUrl = { ...PROJECT, appUrl: '' };
    render(<ProjectQuickView project={noUrl} onClose={() => {}} />, { wrapper });
    expect(screen.getByText(/kein URL/i)).toBeInTheDocument();
  });

  it('hides Supabase section when no studioUrl', () => {
    const noSupabase = { ...PROJECT, supabaseStudioUrl: '' };
    render(<ProjectQuickView project={noSupabase} onClose={() => {}} />, { wrapper });
    expect(screen.queryByText(/Supabase Studio/)).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(<ProjectQuickView project={PROJECT} onClose={onClose} />, { wrapper });
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', async () => {
    const onClose = vi.fn();
    render(<ProjectQuickView project={PROJECT} onClose={onClose} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { hidden: true, name: '' }));
    // find the X button specifically
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('triggers deploy mutation on Deploy button click', async () => {
    mockPost.mockResolvedValue({ data: {} });
    render(<ProjectQuickView project={PROJECT} onClose={() => {}} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: /deploy/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/applications/app-uuid/deploy'));
  });

  it('shows error toast when deploy fails', async () => {
    mockPost.mockRejectedValue(new Error('deploy failed'));
    render(<ProjectQuickView project={PROJECT} onClose={() => {}} />, { wrapper });
    await userEvent.click(screen.getByRole('button', { name: /deploy/i }));
    await waitFor(() => expect(screen.getByText(/fehlgeschlagen/i)).toBeInTheDocument());
  });
});
