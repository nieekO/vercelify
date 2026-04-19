import { render, screen } from '@testing-library/react';
import { Badge } from '../../../components/ui/Badge';

describe('Badge', () => {
  it('capitalises status as label when no label provided', () => {
    render(<Badge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('uses custom label when provided', () => {
    render(<Badge status="running" label="Online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.queryByText('Running')).not.toBeInTheDocument();
  });

  it('renders a StatusDot alongside the text', () => {
    render(<Badge status="building" />);
    const span = document.querySelector('span')!;
    expect(span).toBeInTheDocument();
  });

  it('renders error badge', () => {
    render(<Badge status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
