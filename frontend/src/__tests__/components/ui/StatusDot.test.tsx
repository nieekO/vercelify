import { render, screen } from '@testing-library/react';
import { StatusDot } from '../../../components/ui/StatusDot';

describe('StatusDot', () => {
  it.each([
    ['running', '#00C853'],
    ['healthy', '#00C853'],
    ['ready', '#00C853'],
    ['success', '#00C853'],
    ['building', '#F5A623'],
    ['deploying', '#F5A623'],
    ['starting', '#F5A623'],
    ['error', '#EE0000'],
    ['failed', '#EE0000'],
    ['stopped', '#737373'],
    ['idle', '#737373'],
    ['unknown-xyz', '#737373'],
  ])('renders correct colour for status "%s"', (status, color) => {
    render(<StatusDot status={status} />);
    const dot = screen.getByRole('presentation', { hidden: true }) ?? document.querySelector('span');
    const span = document.querySelector('span')!;
    expect(span.style.backgroundColor).toBe(color);
  });

  it('applies pulse animation for building status', () => {
    render(<StatusDot status="building" />);
    const span = document.querySelector('span')!;
    expect(span.className).toContain('animate-pulse');
  });

  it('does not apply pulse for non-warning status', () => {
    render(<StatusDot status="running" />);
    const span = document.querySelector('span')!;
    expect(span.className).not.toContain('animate-pulse');
  });

  it('applies custom className', () => {
    render(<StatusDot status="running" className="custom-class" />);
    const span = document.querySelector('span')!;
    expect(span.className).toContain('custom-class');
  });

  it('handles uppercase status via case-insensitive matching', () => {
    render(<StatusDot status="RUNNING" />);
    const span = document.querySelector('span')!;
    expect(span.style.backgroundColor).toBe('#00C853');
  });
});
