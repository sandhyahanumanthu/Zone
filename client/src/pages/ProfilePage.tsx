import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Calendar,
  Shield,
  Edit3,
  CheckCircle2,
  Lock,
  Trash2,
  AlertCircle,
  LogIn,
  Navigation,
  Compass,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { PostCard } from '../components/feed/PostCard';
import { useAuth } from '../context/AuthContext';
import { useZone } from '../context/ZoneContext';
import { MOCK_USER, MOCK_POSTS } from '../data/mockData';
import type { Post } from '../types';

export const ProfilePage: React.FC = () => {
  const { user: authUser, isAuthenticated, updateProfile } = useAuth();
  const {
    locationState,
    locationPreference,
    userCoords,
    isLocationLoading,
    locationErrorMessage,
    locationInstructions,
    requestUserLocation,
    stopUsingLocation,
    toggleLocationPreference,
  } = useZone();

  // Fallback to MOCK_USER for preview if unauthenticated
  const currentUser = authUser || MOCK_USER;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Privacy toggles
  const [ghostMode, setGhostMode] = useState(false);
  const [anonymousPosts, setAnonymousPosts] = useState(true);
  const [notifyOnExpire, setNotifyOnExpire] = useState(true);

  // Sync edit form when user changes
  useEffect(() => {
    if (authUser) {
      setEditName(authUser.name);
      setEditBio(authUser.bio || '');
    }
  }, [authUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (isAuthenticated) {
      setIsSaving(true);
      try {
        await updateProfile({
          name: editName.trim(),
          bio: editBio.trim(),
        });
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: any) {
        setSaveError(err.message || 'Failed to update profile in database.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Local preview mode
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const userPosts: Post[] = [MOCK_POSTS[0], MOCK_POSTS[1]];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <PageHeader
        title="User Profile"
        subtitle="Manage your identity, ephemeral activity, and privacy settings across DropZone perimeters."
        badge={isAuthenticated ? 'Verified Profile' : 'Preview Mode'}
      />

      {/* Authentication Notice if guest */}
      {!isAuthenticated && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start justify-between gap-3 flex-wrap">
          <p className="leading-relaxed">
            <span className="font-semibold text-rose-800">Viewing Preview Profile:</span> You are
            currently browsing as a guest. Sign in to link your profile with MongoDB and persist
            custom bios.
          </p>
          <Link to="/login">
            <Button variant="outline" size="sm" leftIcon={<LogIn className="w-3.5 h-3.5" />}>
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="rounded-3xl p-6 md:p-8 bg-white border border-plum-200 shadow-plum-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Placeholder */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-plum-900 border-2 border-plum-700 flex items-center justify-center text-white text-2xl font-black shadow-plum-sm">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white font-bold"
                title="Online in local perimeter"
              >
                ✓
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl md:text-2xl font-bold text-plum-900 brand-font">
                  {currentUser.name}
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-plum-100 text-plum-800 border border-plum-200">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-plum-600 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-plum-400" />
                <span>{currentUser.email}</span>
              </p>
              <p className="text-xs text-plum-600 flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>
                  Member since{' '}
                  {currentUser.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '2026'}
                </span>
              </p>
            </div>
          </div>

          <Button
            variant={isEditing ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </Button>
        </div>

        {/* Bio or Edit Form */}
        <div className="mt-6 pt-6 border-t border-plum-100">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
              <Input
                label="Display Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-plum-700">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Share a brief description of your campus or community interests..."
                  className="w-full bg-white border border-plum-200 text-plum-900 placeholder:text-plum-400 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 shadow-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                  Save Profile to MongoDB
                </Button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-plum-500 mb-1">
                Bio & Interests
              </p>
              <p className="text-sm text-plum-800 leading-relaxed max-w-2xl">
                {currentUser.bio || 'No bio provided yet. Click Edit Profile to add one.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy & Governance Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-plum-900 brand-font">Privacy Safeguards</h3>
          </div>
          <p className="text-xs text-plum-600 leading-relaxed">
            Customize how your presence and temporary activity are treated across physical zones.
          </p>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-plum-900">Ghost Mode</p>
                <p className="text-[11px] text-plum-500">Browse zone feeds without showing active member status</p>
              </div>
              <input
                type="checkbox"
                checked={ghostMode}
                onChange={(e) => setGhostMode(e.target.checked)}
                className="w-4 h-4 rounded border-plum-300 text-rose-500 focus:ring-rose-400"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-plum-900">Hide Author Identity</p>
                <p className="text-[11px] text-plum-500">Post with randomized pseudo-anonymous handles</p>
              </div>
              <input
                type="checkbox"
                checked={anonymousPosts}
                onChange={(e) => setAnonymousPosts(e.target.checked)}
                className="w-4 h-4 rounded border-plum-300 text-rose-500 focus:ring-rose-400"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 cursor-pointer">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-plum-900">Expiration Warning Alerts</p>
                <p className="text-[11px] text-plum-500">Notify 15 minutes before your temporary post expires</p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnExpire}
                onChange={(e) => setNotifyOnExpire(e.target.checked)}
                className="w-4 h-4 rounded border-plum-300 text-rose-500 focus:ring-rose-400"
              />
            </label>
          </div>
        </div>

        {/* SETTINGS -> PRIVACY & LOCATION */}
        <div className="p-6 rounded-3xl bg-white border border-plum-200 shadow-plum-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-plum-700" />
              <h3 className="text-base font-bold text-plum-900 brand-font">Settings → Privacy & Location</h3>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-plum-100 text-plum-800 border border-plum-200 font-semibold">
              Client-Only
            </span>
          </div>

          <p className="text-xs text-plum-600 leading-relaxed">
            Separate website preference from browser-level permissions. Your precise GPS is never stored on our servers.
          </p>

          {/* Explicit States Badge & Details */}
          <div className="p-4 rounded-2xl bg-plum-50/70 border border-plum-100 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-plum-200/60">
              <span className="text-plum-600">Current Status:</span>
              <div>
                {locationState === 'permission_granted' && (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Permission Granted
                  </span>
                )}
                {locationState === 'permission_denied' && (
                  <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Permission Denied or Blocked
                  </span>
                )}
                {locationState === 'permission_required' && (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Permission Required
                  </span>
                )}
                {locationState === 'unavailable' && (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Location Unavailable
                  </span>
                )}
                {locationState === 'error' && (
                  <span className="text-rose-700 font-semibold inline-flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Location Error
                  </span>
                )}
                {locationState === 'disabled' && (
                  <span className="text-plum-500 font-semibold inline-flex items-center gap-1">
                    <Settings className="w-3.5 h-3.5 text-plum-400" />
                    Location Preference Disabled
                  </span>
                )}
                {locationState === 'not_requested' && (
                  <span className="text-rose-600 font-semibold inline-flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-rose-500" />
                    Location Not Requested
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-plum-200/60">
              <span className="text-plum-600">Application Preference:</span>
              <button
                type="button"
                onClick={() => toggleLocationPreference(locationPreference !== 'enabled')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  locationPreference === 'enabled'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-white text-plum-700 border border-plum-200 shadow-sm'
                }`}
              >
                {locationPreference === 'enabled' ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
              </button>
            </div>

            <div className="flex justify-between py-1 border-b border-plum-200/60">
              <span className="text-plum-600">Memory Coordinates:</span>
              <span className="text-rose-600 font-mono font-semibold">
                {userCoords
                  ? `${userCoords.latitude.toFixed(3)}°N, ${userCoords.longitude.toFixed(3)}°E`
                  : 'Cleared (None stored)'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-plum-600">Server Coordinate Storage:</span>
              <span className="text-emerald-700 font-mono font-bold">Zero Storage (Guaranteed)</span>
            </div>
          </div>

          {/* Browser Instructions if Blocked */}
          {locationState === 'permission_denied' && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 space-y-1">
              <p className="font-bold text-rose-900">Browser-Level Permission Blocked</p>
              <p className="text-rose-700">
                {locationInstructions ||
                  'To unblock location, click the site lock/settings icon in your browser address bar and enable Location access for this website.'}
              </p>
            </div>
          )}

          {/* Explanation when switched OFF */}
          <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 text-[11px] text-plum-600 space-y-1 leading-relaxed">
            <p className="font-semibold text-plum-900">When Preference is Switched OFF:</p>
            <p>
              • All device coordinates are immediately cleared from memory.
              <br />
              • Any active geolocation tracking is stopped.
              <br />
              • Future automatic location requests are halted.
              <br />
              • Manual zone discovery and event participation continue working smoothly.
              <br />
              <span className="text-plum-500 italic">
                * Note: Toggling this site preference OFF does not revoke browser-level permission; manage browser permissions via your browser settings.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {locationState === 'permission_granted' ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={stopUsingLocation}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Clear Location & Stop Usage
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => requestUserLocation()}
                isLoading={isLocationLoading}
                leftIcon={<Navigation className="w-3.5 h-3.5" />}
              >
                Request Geolocation Check
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* User's Recent Posts Preview */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-plum-900 brand-font">
            Active Ephemeral Posts ({userPosts.length})
          </h3>
          <span className="text-xs text-plum-500">Auto-expires according to post duration</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {userPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
