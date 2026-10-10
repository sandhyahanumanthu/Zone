import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  ShieldCheck,
  RefreshCw,
  Database,
  Radio,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Calendar,
  Globe,
  Clock,
  Info,
  Settings,
  ShieldAlert,
  X,
  Edit3,
} from 'lucide-react';
import { ZoneCard } from '../components/zones/ZoneCard';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { zoneService } from '../services/api';
import { MOCK_ZONES } from '../data/mockData';
import { useZone } from '../context/ZoneContext';
import { useAuth } from '../context/AuthContext';
import type { Zone } from '../types';
import {
  getZoneLifecycleStatus,
  getZoneRelevanceExplanation,
  getZoneBoundaryDescription,
  getDirectionsUrl,
  calculateHaversineDistance,
  formatDistanceResult,
} from '../utils/zoneUtils';

export const ZoneDiscoveryPage: React.FC = () => {
  const { user } = useAuth();
  const {
    currentZone,
    setCurrentZone,
    locationState,
    locationPreference,
    userCoords,
    isLocationLoading,
    locationErrorMessage,
    locationInstructions,
    requestUserLocation,
    stopUsingLocation,
    toggleLocationPreference,
    calculateDistanceToZone,
  } = useZone();

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isUsingLiveDb, setIsUsingLiveDb] = useState(false);

  // Selected Zone detail view state (defaults to currentZone or first zone)
  const [activeZoneDetail, setActiveZoneDetail] = useState<Zone | null>(null);

  // Organizer Edit Location Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editVenueName, setEditVenueName] = useState('');
  const [editVenueAddress, setEditVenueAddress] = useState('');
  const [editBoundaryType, setEditBoundaryType] = useState<'radius' | 'unspecified' | 'virtual'>('radius');
  const [editRadiusMeters, setEditRadiusMeters] = useState(300);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isOrganizer = user?.role === 'organizer' || user?.role === 'moderator';

  const zoneTypes: { label: string; value: string }[] = [
    { label: 'All Perimeters', value: 'all' },
    { label: 'Campus Quads', value: 'campus' },
    { label: 'Hackathons', value: 'hackathon' },
    { label: 'Events & Fests', value: 'event' },
    { label: 'Transit Hubs', value: 'transit' },
    { label: 'Local Communities', value: 'community' },
  ];

  const fetchZones = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const data = await zoneService.getAllZones(selectedType !== 'all' ? selectedType : undefined);
      if (data && data.length > 0) {
        setZones(data);
        setIsUsingLiveDb(true);
        if (!activeZoneDetail) {
          const matched = currentZone
            ? data.find((z) => (z._id || (z as any).id) === (currentZone._id || (currentZone as any).id))
            : data[0];
          setActiveZoneDetail(matched || data[0]);
        }
      } else {
        setZones(MOCK_ZONES);
        setIsUsingLiveDb(false);
        if (!activeZoneDetail) setActiveZoneDetail(MOCK_ZONES[0]);
      }
    } catch (err: any) {
      setApiError(err.message || 'Unable to connect to DropZone backend');
      setIsUsingLiveDb(false);
      setZones(MOCK_ZONES);
      if (!activeZoneDetail) setActiveZoneDetail(MOCK_ZONES[0]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, [selectedType]);

  useEffect(() => {
    if (currentZone && !activeZoneDetail) {
      setActiveZoneDetail(currentZone);
    }
  }, [currentZone]);

  const handleSelectZone = (zone: Zone) => {
    setCurrentZone(zone);
    setActiveZoneDetail(zone);
  };

  const openEditModal = (zone: Zone) => {
    setActiveZoneDetail(zone);
    setEditVenueName(zone.venueName || '');
    setEditVenueAddress(zone.venueAddress || '');
    setEditBoundaryType(zone.boundaryType || (zone.isVirtual ? 'virtual' : 'radius'));
    setEditRadiusMeters(zone.radiusMeters || zone.radius || 300);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeZoneDetail) return;

    setIsSavingLocation(true);
    setEditError(null);

    try {
      const zoneId = activeZoneDetail._id || (activeZoneDetail as any).id;
      const updated = await zoneService.updateZoneLocation(zoneId, {
        venueName: editVenueName.trim(),
        venueAddress: editVenueAddress.trim(),
        boundaryType: editBoundaryType,
        radiusMeters: editRadiusMeters,
        isVirtual: editBoundaryType === 'virtual',
      });

      // Update state in lists and context
      setZones((prev) =>
        prev.map((z) => ((z._id || (z as any).id) === zoneId ? { ...z, ...updated } : z))
      );
      setActiveZoneDetail(updated);
      if (currentZone && (currentZone._id || (currentZone as any).id) === zoneId) {
        setCurrentZone(updated);
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update zone location configuration');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const filteredZones = zones.filter((z) => {
    const matchesSearch =
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (z.venueName && z.venueName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (z.venueAddress && z.venueAddress.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || z.type === selectedType;
    return matchesSearch && matchesType;
  });

  const selectedZone = activeZoneDetail || currentZone || zones[0] || null;
  const selectedLifecycle = selectedZone ? getZoneLifecycleStatus(selectedZone) : null;
  const selectedBoundaryDesc = selectedZone ? getZoneBoundaryDescription(selectedZone) : '';
  const selectedRelevance = selectedZone ? getZoneRelevanceExplanation(selectedZone) : '';
  const selectedDirectionsUrl = selectedZone ? getDirectionsUrl(selectedZone) : null;
  const selectedDistance = selectedZone ? calculateDistanceToZone(selectedZone) : null;
  const isSelectedVirtual = selectedZone?.isVirtual || selectedZone?.boundaryType === 'virtual';

  // Explicit Location State label & badge generator
  const renderLocationStatePill = () => {
    switch (locationState) {
      case 'permission_granted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Permission Granted</span>
          </span>
        );
      case 'permission_denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Permission Denied or Blocked</span>
          </span>
        );
      case 'permission_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Permission Required</span>
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Location Unavailable</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Location Error</span>
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-plum-50 border border-plum-200 text-plum-600">
            <Settings className="w-3.5 h-3.5 text-plum-500" />
            <span>Location Preference Disabled</span>
          </span>
        );
      case 'not_requested':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-plum-50 border border-plum-200 text-plum-700">
            <Compass className="w-3.5 h-3.5 text-rose-500" />
            <span>Location Not Requested</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Explore Zones"
        subtitle="Discover verified geofenced communities and event arenas. Verify on-device proximity or explore any venue."
        badge="Spatial Perimeters"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchZones}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh Zones
            </Button>
          </div>
        }
      />

      {/* 1. VISIBLE LOCATION CONTROLS BAR (Beside Discovery Section) */}
      <div className="bg-white/90 backdrop-blur-sm p-5 md:p-6 rounded-3xl border border-plum-200/80 space-y-4 shadow-plum-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <h3 className="text-sm font-bold text-plum-900 flex items-center gap-2">
                <span>Location Services & Proximity Controls</span>
              </h3>
              {renderLocationStatePill()}
            </div>
            <p className="text-xs text-plum-600 leading-relaxed max-w-2xl">
              DropZone never harvests or stores your GPS on any server. Distance is calculated purely on-device
              against known venue coordinates when you explicitly grant access.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {locationState === 'permission_granted' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={stopUsingLocation}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                Stop Using Location
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => requestUserLocation()}
                isLoading={isLocationLoading}
                leftIcon={<Navigation className="w-3.5 h-3.5" />}
              >
                Use My Location
              </Button>
            )}

            <button
              type="button"
              onClick={() => toggleLocationPreference(locationPreference !== 'enabled')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-plum-200 bg-plum-50 text-plum-700 hover:bg-plum-100 transition shadow-sm"
              title="Toggle site-level location preference"
            >
              App Preference: {locationPreference === 'enabled' ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Permission Denied / Blocked Instructions */}
        {locationState === 'permission_denied' && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-rose-900">
                Browser Location Permission Blocked
              </p>
              <p className="text-rose-700 leading-relaxed">
                {locationInstructions ||
                  'Your browser has blocked location access for this site. To enable distance calculations, click the padlock/settings icon beside the URL in your browser address bar and set Location to "Allow".'}
              </p>
              <p className="text-[11px] text-rose-600 pt-0.5">
                Manual event discovery and venue search remain fully functional below.
              </p>
            </div>
          </div>
        )}

        {locationErrorMessage && locationState !== 'permission_denied' && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationErrorMessage}</span>
          </div>
        )}
      </div>

      {/* 2. SELECTED ZONE LOCATION SECTION */}
      {selectedZone && selectedLifecycle && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-plum-100 pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-plum-100 text-plum-800 border border-plum-200">
                  {selectedZone.type.toUpperCase()}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedLifecycle.badgeClass}`}>
                  Zone Status: {selectedLifecycle.label}
                </span>
                {isSelectedVirtual && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    Online Zone
                  </span>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-black text-plum-900 brand-font flex items-center gap-3">
                <span>{selectedZone.name}</span>
              </h2>

              <p className="text-xs sm:text-sm text-plum-600 max-w-2xl leading-relaxed">
                {selectedZone.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleSelectZone(selectedZone)}
                leftIcon={<Compass className="w-4 h-4" />}
              >
                {(currentZone?._id || (currentZone as any)?.id) === (selectedZone._id || (selectedZone as any)?.id)
                  ? 'Currently Active Zone'
                  : 'Select as Active Zone'}
              </Button>

              {selectedDirectionsUrl && (
                <a
                  href={selectedDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-plum-200 text-plum-700 hover:text-plum-900 hover:border-rose-300 transition shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5 text-rose-500" />
                  <span>Get Directions</span>
                  <ExternalLink className="w-3 h-3 text-plum-400" />
                </a>
              )}

              {isOrganizer && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openEditModal(selectedZone)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5 text-plum-600" />}
                >
                  Configure Location
                </Button>
              )}
            </div>
          </div>

          {/* Structured Location Information Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-plum-700 font-mono mb-3">
              Zone Location & Geographic Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Event & Venue */}
              <div className="p-4 rounded-2xl bg-plum-50/60 border border-plum-100 space-y-1">
                <span className="text-[10px] font-bold text-plum-500 uppercase tracking-wider">
                  Event / Venue Name
                </span>
                <p className="text-sm font-bold text-plum-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{selectedZone.venueName || selectedZone.name}</span>
                </p>
                <p className="text-[11px] text-plum-600 line-clamp-2">
                  {selectedZone.venueAddress || (isSelectedVirtual ? 'Distributed online environment' : 'Venue address on file with organizer')}
                </p>
              </div>

              {/* Coverage & Boundaries */}
              <div className="p-4 rounded-2xl bg-plum-50/60 border border-plum-100 space-y-1">
                <span className="text-[10px] font-bold text-plum-500 uppercase tracking-wider">
                  Coverage Boundary
                </span>
                <p className="text-sm font-bold text-plum-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-plum-700 shrink-0" />
                  <span>{selectedBoundaryDesc}</span>
                </p>
                <p className="text-[11px] text-plum-500 font-mono">
                  {isSelectedVirtual
                    ? 'Accessible worldwide'
                    : `Coordinates: ${(selectedZone.centerLatitude ?? 0).toFixed(4)}°N, ${(selectedZone.centerLongitude ?? 0).toFixed(4)}°E`}
                </p>
              </div>

              {/* Real Distance Output */}
              <div className="p-4 rounded-2xl bg-plum-50/60 border border-plum-100 space-y-1">
                <span className="text-[10px] font-bold text-plum-500 uppercase tracking-wider">
                  Your Distance
                </span>
                {isSelectedVirtual ? (
                  <p className="text-sm font-bold text-rose-600">Online Zone (Zero travel)</p>
                ) : selectedDistance ? (
                  <p className="text-sm font-bold text-emerald-700 font-mono">
                    {selectedDistance.formattedText}
                  </p>
                ) : locationState === 'permission_denied' ? (
                  <p className="text-xs text-rose-700">Location permission blocked</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-plum-500">Available after location permission is granted</p>
                    <button
                      type="button"
                      onClick={() => requestUserLocation()}
                      disabled={isLocationLoading}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold underline"
                    >
                      {isLocationLoading ? 'Detecting...' : 'Use My Location'}
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-plum-400">
                  {userCoords ? 'Calculated on-device via Haversine' : 'GPS coordinates not harvested'}
                </p>
              </div>

              {/* Schedule Windows */}
              <div className="p-4 rounded-2xl bg-plum-50/60 border border-plum-100 space-y-1">
                <span className="text-[10px] font-bold text-plum-500 uppercase tracking-wider">
                  Zone Schedule
                </span>
                <div className="flex items-center gap-2 text-xs text-plum-800">
                  <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>
                    Start: {selectedZone.startDate ? new Date(selectedZone.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Active now'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-plum-500">
                  <Clock className="w-3.5 h-3.5 text-plum-400 shrink-0" />
                  <span>
                    End: {selectedZone.endDate ? new Date(selectedZone.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Continuous'}
                  </span>
                </div>
              </div>

              {/* Relevance Explanation */}
              <div className="p-4 rounded-2xl bg-plum-50/60 border border-plum-100 space-y-1 md:col-span-2">
                <span className="text-[10px] font-bold text-plum-500 uppercase tracking-wider">
                  Zone Relevance
                </span>
                <p className="text-xs text-plum-700 leading-relaxed">
                  {selectedRelevance}
                </p>
                <p className="text-[10px] text-plum-500">
                  Selecting this zone adapts your Need-to-Action feed and connects you to active helpers inside this perimeter.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SEARCH & CATEGORY FILTER TOOLBAR */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-plum-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by zone name, venue, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 shadow-sm transition"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-plum-600 font-medium">
            <Database className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {isUsingLiveDb ? `Live Database (${zones.length} zones)` : 'Demo Zones'}
            </span>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {zoneTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedType === type.value
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white text-plum-700 hover:text-plum-900 hover:bg-plum-50 border border-plum-200 shadow-sm'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. GRID OF ALL ZONES */}
      <div>
        {isLoading ? (
          <LoadingState
            message="Discovering eligible zones..."
            submessage="Querying DropZone geofenced perimeter coordinates"
          />
        ) : filteredZones.length === 0 ? (
          <EmptyState
            title="No matching zones found"
            description="Try searching with a different keyword or reset category filters."
            actionText="Reset Filters"
            onAction={() => {
              setSelectedType('all');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredZones.map((zone) => {
              const zoneId = zone._id || (zone as any).id;
              const isSelected =
                activeZoneDetail &&
                (activeZoneDetail._id || (activeZoneDetail as any).id) === zoneId;

              return (
                <ZoneCard
                  key={zoneId || zone.name}
                  zone={zone}
                  isSelected={isSelected}
                  onSelectZone={handleSelectZone}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ORGANIZER LOCATION CONFIGURATION MODAL */}
      {isEditModalOpen && activeZoneDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-plum-200 shadow-plum-xl p-6 md:p-8 space-y-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-plum-400 hover:text-plum-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-plum-900 brand-font flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-500" />
                <span>Configure Zone Location & Venue</span>
              </h3>
              <p className="text-xs text-plum-500 mt-0.5">
                Update venue name, boundary coverage, or address for {activeZoneDetail.name}.
              </p>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-plum-700">
                  Venue / Facility Name
                </label>
                <input
                  type="text"
                  value={editVenueName}
                  onChange={(e) => setEditVenueName(e.target.value)}
                  placeholder="e.g. Lendi Institute of Engineering and Technology"
                  className="w-full bg-white border border-plum-200 text-plum-900 placeholder:text-plum-400 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-plum-700">
                  Venue Address / Physical Location
                </label>
                <input
                  type="text"
                  value={editVenueAddress}
                  onChange={(e) => setEditVenueAddress(e.target.value)}
                  placeholder="e.g. Jonnada, Denkada Mandal, Vizianagaram, AP 535005"
                  className="w-full bg-white border border-plum-200 text-plum-900 placeholder:text-plum-400 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-plum-700">
                    Boundary Type
                  </label>
                  <select
                    value={editBoundaryType}
                    onChange={(e: any) => setEditBoundaryType(e.target.value)}
                    className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                  >
                    <option value="radius">Geographic Radius</option>
                    <option value="unspecified">Unspecified Venue Area</option>
                    <option value="virtual">Online Zone (Virtual)</option>
                  </select>
                </div>

                {editBoundaryType === 'radius' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-plum-700">
                      Coverage Radius (Meters)
                    </label>
                    <input
                      type="number"
                      min={50}
                      max={50000}
                      value={editRadiusMeters}
                      onChange={(e) => setEditRadiusMeters(parseInt(e.target.value, 10) || 300)}
                      className="w-full bg-white border border-plum-200 text-plum-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-plum-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingLocation}
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneDiscoveryPage;
