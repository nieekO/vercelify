import { Link, useLocation } from 'react-router-dom';

const labels: Record<string, string> = {
  '':            'Overview',
  'projects':    'Projects',
  'deployments': 'Deployments',
  'services':    'Services',
  'servers':     'Servers',
  'settings':    'Settings',
  'new':         'New Project',
};

export function Header() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  const crumbs = [
    { label: 'Vercelify', path: '/' },
    ...parts.map((part, i) => ({
      label: labels[part] || part,
      path: '/' + parts.slice(0, i + 1).join('/'),
    })),
  ];

  return (
    <header className="h-14 border-b border-[rgba(255,255,255,0.08)] flex items-center px-6 flex-shrink-0">
      <nav className="flex items-center gap-1">
        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-700 text-xs">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="text-xs text-gray-400">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}
