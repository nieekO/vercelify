import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Rocket, Database, Server,
  Settings, ChevronLeft, ChevronRight, LogOut, Triangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/',           icon: LayoutDashboard, label: 'Overview'    },
  { to: '/projects',   icon: FolderOpen,       label: 'Projects'    },
  { to: '/deployments',icon: Rocket,           label: 'Deployments' },
  { to: '/services',   icon: Database,         label: 'Services'    },
  { to: '/servers',    icon: Server,           label: 'Servers'     },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="flex flex-col h-full border-r border-[rgba(255,255,255,0.08)] bg-[#000000] transition-all duration-200"
      style={{ width: collapsed ? 56 : 240, flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[rgba(255,255,255,0.08)] flex-shrink-0">
        <Triangle size={16} className="text-white flex-shrink-0" fill="white" />
        {!collapsed && <span className="font-semibold tracking-tight text-sm">Vercelify</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-sm transition-colors relative ${
                isActive
                  ? 'text-white before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:bg-white'
                  : 'text-gray-500 hover:text-white'
              }`
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[rgba(255,255,255,0.08)] py-2 flex-shrink-0">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              isActive ? 'text-white' : 'text-gray-500 hover:text-white'
            }`
          }
        >
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-white w-full transition-colors"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:text-gray-400 w-full transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
