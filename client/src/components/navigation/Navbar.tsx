import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Compass, PlusCircle, LayoutDashboard, Shield, Activity, LogOut, User, Radio } from 'lucide-react';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { healthService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useZone } from '../../context/ZoneContext';
import type { HealthCheckResponse } from '../../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentZone } = useZone();
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    healthService
      .checkHealth()
      .then((data) => {
        if (mounted) setHealth(data);
      })
      .catch(() => {
        if (mounted) {
          setHealth({
            status: 'unhealthy',
            service: 'DropZone API',
            database: 'disconnected',
            message: 'Server offline or standby',
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Need Feed', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Create Need/Offer', path: '/create-post', icon: <PlusCircle className="w-4 h-4" /> },
    { name: 'Organizer Metrics', path: '/organizer', icon: <Activity className="w-4 h-4" /> },
    { name: 'Explore Zones', path: '/zones', icon: <Compass className="w-4 h-4" /> },
    { name: 'Privacy Policy', path: '/privacy', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-plum-200 shadow-plum-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo */}
          <Logo size="md" />

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-rose-600 bg-rose-300/40 border border-rose-300 font-semibold shadow-sm'
                      : 'text-plum-900/75 hover:text-plum-900 hover:bg-plum-100/70'
                  }`
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Server Status & Auth Profile / CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* Active Spatial Perimeter Pill */}
            {currentZone && (
              <Link
                to="/zones"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono bg-plum-100/80 border border-plum-200 hover:border-rose-400 text-plum-900 transition-all shadow-sm group"
                title={`Active Zone: ${currentZone.name} (${currentZone.radiusMeters || currentZone.radius || 450}m)`}
              >
                <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                <span className="truncate max-w-[130px] font-semibold">{currentZone.name}</span>
                <span className="text-plum-400">•</span>
                <span className="text-rose-600 font-medium">{currentZone.radiusMeters || currentZone.radius || 450}m</span>
              </Link>
            )}

            {/* Live Backend Connection Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-plum-100/80 border border-plum-200"
              title={
                health?.status === 'ok'
                  ? 'DropZone API connected to MongoDB'
                  : 'DropZone API offline or standby mode'
              }
            >
              <Activity className="w-3 h-3 text-plum-500" />
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.status === 'ok'
                    ? 'bg-emerald-600 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-plum-700">
                {health?.status === 'ok' ? 'API Live' : 'API Standby'}
              </span>
            </div>

            {/* Authenticated User Menu */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-plum-200">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-plum-100 hover:bg-plum-200/70 border border-plum-200 transition-colors"
                  title="View your profile"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-rose-500 to-plum-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-plum-900 truncate max-w-[120px]">
                    {user.name}
                  </span>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  title="Sign out of DropZone"
                  leftIcon={<LogOut className="w-3.5 h-3.5 text-plum-500" />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              /* Unauthenticated CTAs */
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>

                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="p-2 rounded-xl text-plum-600 hover:text-plum-900 hover:bg-plum-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              aria-label="Toggle Navigation Menu"
            >
              {isOpen ? <X className="w-6 h-6 text-rose-500" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden border-b border-plum-200 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-plum-lg">
          <div className="flex items-center justify-between py-2 border-b border-plum-200 text-xs text-plum-600">
            <span>DropZone Network Status</span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                health?.status === 'ok' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              {health?.status === 'ok' ? 'Backend Live' : 'Backend Standby'}
            </span>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-rose-300/40 text-rose-700 font-bold border border-rose-300'
                      : 'text-plum-800 hover:bg-plum-100 hover:text-plum-900'
                  }`
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="pt-3 border-t border-plum-200">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-plum-100 text-xs text-plum-900 font-medium"
                >
                  <User className="w-4 h-4 text-rose-500" />
                  <span>Signed in as <strong>{user.name}</strong> ({user.email})</span>
                </Link>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
