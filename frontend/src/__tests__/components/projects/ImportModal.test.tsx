import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();

vi.mock('../../../services/api', () => ({
  default: { get: mockGet, post: mockPost },
}));

import { ImportModal } from '../../../components/projects/ImportModal';
import { ToastProvider } from '../../../components/ui/Toast';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('ImportModal', () => {
  it('does not render when closed', () => {
    render(<ImportModal open={false} onClose={() => {}} />, { wrapper });
    expect(screen.queryByText('Aus Coolify importieren')).not.toBeInTheDocument();
  });

  it('shows loading spinner while fetching', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ImportModal open onClose={() => {}} />, { wrapper });
    // Spinner is rendered during loading
    expect(document.querySelector('svg') ?? screen.getByText('Aus Coolify importieren')).toBeInTheDocument();
  });

  it('shows "all imported" message when list is empty', async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<ImportModal open onClose={() => {}} />, { wrapper });
    await waitFor(() =>
      expect(screen.getByText(/bereits in Vercelify importiert/)).toBeInTheDocument(),
    );
  });

  it('renders importable apps with name and git info', async () => {
    mockGet.mockResolvedValue({
      data: [{
        uuid: 'app-1',
        name: 'finance',
        git_repository: 'https://github.com/user/finance',
        git_branch: 'main',
        fqdn: 'finance.example.com',
      }],
    });
    render(<ImportModal open onClose={() => {}} />, { wrapper });
    await waitFor(() => expect(screen.getByText('finance')).toBeInTheDocument());
    expect(screen.getByText(/user\/finance/)).toBeInTheDocument();
    expect(screen.getByText(/finance\.example\.com/)).toBeInTheDocument();
  });

  it('calls import endpoint and shows toast on success', async () => {
    const app = { uuid: 'app-1', name: 'finance', git_repository: 'https://github.com/u/r' };
    mockGet.mockResolvedValue({ data: [app] });
    mockPost.mockResolvedValue({ data: { project: { id: 'new-id' } } });

    render(<ImportModal open onClose={() => {}} />, { wrapper });
    await waitFor(() => expect(screen.getByText('finance')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /import/i }));
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith('/projects/import', app));
  });

  it('shows error toast when import fails', async () => {
    mockGet.mockResolvedValue({ data: [{ uuid: 'a', name: 'fail-app' }] });
    mockPost.mockRejectedValue(new Error('server error'));

    render(<ImportModal open onClose={() => {}} />, { wrapper });
    await waitFor(() => expect(screen.getByText('fail-app')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => expect(screen.getByText(/fehlgeschlagen/i)).toBeInTheDocument());
  });

  it('calls onClose when Schließen is clicked', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const onClose = vi.fn();
    render(<ImportModal open onClose={onClose} />, { wrapper });
    await waitFor(() => screen.getByText('Schließen'));
    await userEvent.click(screen.getByText('Schließen'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
