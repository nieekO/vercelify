import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderOpen, Rocket, Database, Server } from 'lucide-react';

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview'    },
  { to: '/projects',    icon: FolderOpen,       label: 'Projects'    },
  { to: '/deployments', icon: Rocket,           label: 'Deploys'     },
  { to: '/services',    icon: Database,         label: 'Services'    },
  { to: '/servers',     icon: Server,           label: 'Servers'     },
];

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex justify-around bg-gray-950 border border-[rgba(255,255,255,0.15)] rounded-[8px] py-2 px-2">
      {nav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[6px] text-xs transition-colors ${
              isActive ? 'text-white bg-gray-800' : 'text-gray-500'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
