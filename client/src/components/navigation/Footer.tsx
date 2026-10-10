import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Radio, Lock, Terminal } from 'lucide-react';
import { Logo } from '../common/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-plum-200 bg-plum-100/70 text-plum-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" />
            <p className="text-sm text-plum-700 max-w-sm leading-relaxed font-medium">
              Connect Locally. Collaborate Instantly. Stay Private.
            </p>
            <p className="text-xs text-plum-500 max-w-md leading-relaxed">
              DropZone provides ephemeral, geofenced micro-communities for university campuses,
              hackathons, and transit hubs without storing or broadcasting precise GPS coordinates.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-rose-600">
              <span className="inline-flex items-center gap-1 bg-white border border-plum-200 px-2.5 py-1 rounded-md shadow-plum-sm font-medium">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                Zero Coordinate Broadcast
              </span>
              <span className="inline-flex items-center gap-1 bg-white border border-plum-200 px-2.5 py-1 rounded-md shadow-plum-sm font-medium">
                <Radio className="w-3.5 h-3.5 text-plum-600" />
                Auto-Expiring Posts
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-plum-900 tracking-wider uppercase brand-font">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-rose-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/zones" className="hover:text-rose-600 transition-colors">
                  Explore Zones
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-rose-600 transition-colors">
                  Feed Dashboard
                </Link>
              </li>
              <li>
                <Link to="/create-post" className="hover:text-rose-600 transition-colors">
                  Create Local Post
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-rose-600 transition-colors">
                  User Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Governance */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-plum-900 tracking-wider uppercase brand-font">
              Trust & Privacy
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-rose-600 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>Privacy Policy (Draft)</span>
                </Link>
              </li>
              <li>
                <span className="text-plum-400 text-xs">Community Guidelines (Pending)</span>
              </li>
              <li>
                <span className="text-plum-400 text-xs">Moderator Toolkit (Phase 3)</span>
              </li>
              <li className="pt-2">
                <div className="text-xs text-plum-500">
                  <p className="font-semibold text-plum-700 mb-1">Developer Inquiries:</p>
                  <p className="font-mono text-[11px] text-plum-600">dev-contact@dropzone.local</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-plum-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-plum-500">
          <p>© {new Date().getFullYear()} DropZone Project. Built with React, Vite, TypeScript & Tailwind CSS.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] text-plum-600 font-medium">
              <Terminal className="w-3.5 h-3.5 text-rose-500" />
              API: <span className="font-mono text-rose-600 font-semibold">/api/v1</span>
            </span>
            <Link to="/privacy" className="hover:text-plum-800 underline">
              Draft Data Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
