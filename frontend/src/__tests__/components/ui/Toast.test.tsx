import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../../../components/ui/Toast';

function ToastTrigger({ type }: { type?: 'success' | 'error' }) {
  const { toast } = useToast();
  return (
    <button onClick={() => toast('Test message', type)}>Show Toast</button>
  );
}

describe('ToastProvider / useToast', () => {
  it('renders children', () => {
    render(<ToastProvider><p>hello</p></ToastProvider>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('shows a success toast when toast() is called', async () => {
    render(<ToastProvider><ToastTrigger /></ToastProvider>);
    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    render(<ToastProvider><ToastTrigger type="error" /></ToastProvider>);
    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
    // error icon should be present
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('removes toast when X button is clicked', async () => {
    render(<ToastProvider><ToastTrigger /></ToastProvider>);
    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    const closeBtn = screen.getAllByRole('button').find(b => b !== screen.getByText('Show Toast'))!;
    await userEvent.click(closeBtn);
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after 4 seconds', async () => {
    vi.useFakeTimers();
    render(<ToastProvider><ToastTrigger /></ToastProvider>);
    await userEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4001);
    });

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('useToast returns no-op toast when used outside provider', () => {
    function Outside() {
      const { toast } = useToast();
      return <button onClick={() => toast('noop')}>Test</button>;
    }
    render(<Outside />);
    // Should not throw
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
