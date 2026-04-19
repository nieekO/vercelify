import { render } from '@testing-library/react';
import { StatusDot } from '../../../components/ui/StatusDot';

describe('StatusDot', () => {
  it.each([
    ['running',     'rgb(0, 200, 83)'],
    ['healthy',     'rgb(0, 200, 83)'],
    ['ready',       'rgb(0, 200, 83)'],
    ['success',     'rgb(0, 200, 83)'],
    ['building',    'rgb(245, 166, 35)'],
    ['deploying',   'rgb(245, 166, 35)'],
    ['starting',    'rgb(245, 166, 35)'],
    ['error',       'rgb(238, 0, 0)'],
    ['failed',      'rgb(238, 0, 0)'],
    ['stopped',     'rgb(115, 115, 115)'],
    ['idle',        'rgb(115, 115, 115)'],
    ['unknown-xyz', 'rgb(115, 115, 115)'],
  ])('renders correct colour for status "%s"', (status, color) => {
    const { container } = render(<StatusDot status={status} />);
    const span = container.querySelector('span')!;
    expect(span.style.backgroundColor).toBe(color);
  });

  it('applies pulse animation for building status', () => {
    const { container } = render(<StatusDot status="building" />);
    expect(container.querySelector('span')!.className).toContain('animate-pulse');
  });

  it('does not apply pulse for non-warning status', () => {
    const { container } = render(<StatusDot status="running" />);
    expect(container.querySelector('span')!.className).not.toContain('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<StatusDot status="running" className="custom-class" />);
    expect(container.querySelector('span')!.className).toContain('custom-class');
  });

  it('handles uppercase status via case-insensitive matching', () => {
    const { container } = render(<StatusDot status="RUNNING" />);
    expect(container.querySelector('span')!.style.backgroundColor).toBe('rgb(0, 200, 83)');
  });
});
