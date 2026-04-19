import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ConfirmDeleteModal } from '../../../components/ui/Modal';

describe('Modal', () => {
  it('does not render when open is false', () => {
    render(<Modal open={false} onClose={() => {}} title="Test"><p>content</p></Modal>);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders title and children when open', () => {
    render(<Modal open onClose={() => {}} title="My Modal"><p>Modal body</p></Modal>);
    expect(screen.getByText('My Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();
  });

  it('calls onClose when clicking the backdrop', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="T"><p>body</p></Modal>);
    const backdrop = document.querySelector('.absolute.inset-0') as HTMLElement;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the X button', async () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="T"><p>body</p></Modal>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    projectName: 'my-project',
  };

  it('renders the project name for confirmation', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('my-project')).toBeInTheDocument();
  });

  it('Delete button is disabled until correct name is typed', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('enables Delete button after typing exact project name', async () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'my-project');
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn).not.toBeDisabled();
  });

  it('calls onConfirm when Delete is clicked with correct name', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.type(screen.getByRole('textbox'), 'my-project');
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when loading prop is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading />);
    // Button has loading spinner (disabled state)
    const btns = screen.getAllByRole('button');
    const deleteBtn = btns.find(b => b.textContent?.toLowerCase().includes('delete'));
    expect(deleteBtn).toBeDisabled();
  });
});
