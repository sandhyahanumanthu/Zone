import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  User as UserIcon,
  Shield,
  MapPin,
  Activity,
  Radio,
  LogOut,
} from 'lucide-react';
import type { Zone, HealthCheckResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentZone?: Zone | null;
  health?: HealthCheckResponse | null;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentZone,
  health,
  className = '',
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const links = [
    { name: 'Need-to-Action Feed', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Create Need / Offer', path: '/create-post', icon: <PlusCircle className="w-4 h-4" /> },
    { name: 'Organizer Metrics', path: '/organizer', icon: <Activity className="w-4 h-4" /> },
    { name: 'Moderation Queue', path: '/moderation', icon: <Shield className="w-4 h-4" /> },
    { name: 'Explore Zones', path: '/zones', icon: <Compass className="w-4 h-4" /> },
    { name: 'User Profile', path: '/profile', icon: <UserIcon className="w-4 h-4" /> },
    { name: 'Privacy Policy', path: '/privacy', icon: <Radio className="w-4 h-4" /> },
  ];

  return (
    <aside
      className={`w-64 shrink-0 rounded-2xl border border-plum-800 bg-plum-900 text-white shadow-plum-lg p-4 flex flex-col justify-between ${className}`}
    >
      <div className="space-y-6">
        {/* User Status / Profile Card */}
        {isAuthenticated && user ? (
          <div className="p-3.5 rounded-xl bg-plum-950/80 border border-plum-750 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-plum-700 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-plum-300 truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-plum-800 flex items-center justify-between text-[10px]">
              <span className="font-semibold uppercase tracking-wider text-rose-400">
                {user.role}
              </span>
              <button
                onClick={() => logout()}
                className="text-plum-300 hover:text-rose-300 transition-colors flex items-center gap-1 font-medium"
                title="Log out"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Zone Status Pill */
          <div className="p-3.5 rounded-xl bg-plum-950/80 border border-plum-750 shadow-sm">
            <div className="flex items-center justify-between text-xs text-plum-300 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-rose-300">
                Active Zone
              </span>
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  {currentZone ? currentZone.name : 'Tech Campus Hub'}
                </p>
                <p className="text-[11px] text-plum-300 mt-0.5">
                  {currentZone
                    ? `${currentZone.radiusMeters || currentZone.radius || 450}m geofence radius`
                    : '450m geofence radius'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-plum-400 mb-2">
            Navigation
          </p>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-rose-300 text-plum-900 font-bold shadow-sm'
                    : 'text-plum-200 hover:text-white hover:bg-plum-800/70'
                }`
              }
            >
              {link.icon}
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Backend & Database Telemetry Widget */}
      <div className="pt-4 border-t border-plum-800">
        <div className="p-3 rounded-xl bg-plum-950/80 border border-plum-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-plum-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              API Telemetry
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-plum-300">
              <span>Database:</span>
              <span
                className={`font-mono font-medium ${
                  health?.database === 'connected' ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {health?.database || 'Standby'}
              </span>
            </div>
            <div className="flex justify-between text-plum-300">
              <span>Endpoint:</span>
              <span className="font-mono text-rose-300">:5000/api</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
