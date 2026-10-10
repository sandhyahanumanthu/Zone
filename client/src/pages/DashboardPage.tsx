import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Radio,
  Search,
  Database,
  RefreshCw,
  MapPin,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Users,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { CategoryFilter } from '../components/common/CategoryFilter';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { MatchDiscoveryModal } from '../components/modals/MatchDiscoveryModal';
import { needService, offerService, zoneService, healthService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useZone } from '../context/ZoneContext';
import type { Need, Offer, Zone, NeedCategory } from '../types';

export const CATEGORIES_WITH_ALL: string[] = [
  'All',
  'Coding & Debugging',
  'Technical Help',
  'Team Formation',
  'UI/UX Design',
  'Hardware & IoT',
  'Event Questions',
  'Lost & Found',
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentZone, setCurrentZone, zones } = useZone();

  const [activeTab, setActiveTab] = useState<'needs' | 'helpers' | 'announcements'>('needs');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [needs, setNeeds] = useState<Need[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resolvingNeedId, setResolvingNeedId] = useState<string | null>(null);

  // Match Modal
  const [selectedNeedForMatch, setSelectedNeedForMatch] = useState<Need | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // ContextPass Join State
  const [isJoined, setIsJoined] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const getEffectiveZoneId = () => {
    if (!currentZone) return null;
    return currentZone._id || (currentZone as any).id || null;
  };

  const fetchData = async () => {
    const zoneId = getEffectiveZoneId();
    if (!zoneId) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const [needsData, offersData, freshZone] = await Promise.all([
        needService.getNeeds({
          zoneId,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          status: statusFilter === 'resolved' ? 'RESOLVED' : undefined,
          includeResolved: statusFilter !== 'active',
        }),
        offerService.getOffers(zoneId, statusFilter === 'all'),
        zoneService.getZoneById(zoneId).catch(() => null),
      ]);

      setNeeds(needsData);
      setOffers(offersData);
      if (freshZone) {
        setCurrentZone(freshZone);
      }
    } catch (err: any) {
      setApiError(err.message || 'Error fetching zone data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentZone) {
      fetchData();
    }
  }, [currentZone?._id, (currentZone as any)?.id, selectedCategory, statusFilter]);

  const handleResolveNeed = async (need: Need) => {
    const isLostFound = need.category === 'Lost & Found';
    const confirmMsg = isLostFound
      ? 'Confirm that this lost item was found? This will close the request and prevent further claims.'
      : 'Mark this request as resolved? This will close the collaboration.';

    if (!window.confirm(confirmMsg)) return;

    setResolvingNeedId(need._id);
    try {
      await needService.resolveNeed(
        need._id,
        isLostFound ? 'Item reported found by owner' : 'Resolved by requester'
      );
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve request');
    } finally {
      setResolvingNeedId(null);
    }
  };

  const handleJoinContext = async () => {
    const zoneId = getEffectiveZoneId();
    if (!zoneId) return;
    setIsJoining(true);
    try {
      await zoneService.joinZone(zoneId);
      setIsJoined(true);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to join context');
    } finally {
      setIsJoining(false);
    }
  };

  const filteredNeeds = needs.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.requiredSkills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOffers = offers.filter((o) =>
    (o.skills || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const announcements = currentZone?.announcements || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. HERO CONTEXT BANNER */}
      {currentZone && (
        <div className="relative rounded-3xl p-6 md:p-8 glass-card bg-white border border-plum-200 shadow-plum-md overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-300/25 via-plum-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold tracking-wider uppercase text-rose-600 font-mono">
                  Active ContextPass Perimeter
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-plum-100 text-plum-900 border border-plum-200">
                  {currentZone.type.toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-semantic-success-bg text-semantic-success border border-semantic-success-border">
                  Verified Participant
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-plum-900 brand-font flex items-center gap-3">
                <span>{currentZone.name}</span>
              </h1>

              <p className="text-xs sm:text-sm text-plum-600 max-w-xl leading-relaxed">
                {currentZone.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/create-post">
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  className="shadow-rose-glow"
                >
                  Create Need / Offer
                </Button>
              </Link>

              <Link to="/organizer">
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<TrendingUp className="w-4 h-4" />}
                >
                  Organizer Metrics
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-plum-200">
            <div className="p-3.5 rounded-2xl bg-plum-100/70 border border-plum-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-plum-600">
                <span>Active Needs</span>
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-base sm:text-xl font-bold text-plum-900 font-mono">
                {needs.length} Requests
              </p>
              <p className="text-[10px] text-rose-600 font-medium">In this zone</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-plum-100/70 border border-plum-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-plum-600">
                <span>Available Helpers</span>
                <Users className="w-3.5 h-3.5 text-plum-700" />
              </div>
              <p className="text-base sm:text-xl font-bold text-plum-900 font-mono">
                {offers.length} Helpers
              </p>
              <p className="text-[10px] text-plum-700 font-medium">Ready for matching</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-plum-100/70 border border-plum-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-plum-600">
                <span>Perimeter Radius</span>
                <Radio className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <p className="text-base sm:text-xl font-bold text-plum-900 font-mono">
                {currentZone.radiusMeters}m
              </p>
              <p className="text-[10px] text-rose-600 font-medium">On-device estimated</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-plum-100/70 border border-plum-200 space-y-1">
              <div className="flex items-center justify-between text-xs text-plum-600">
                <span>Privacy Guard</span>
                <Shield className="w-3.5 h-3.5 text-semantic-success" />
              </div>
              <p className="text-base sm:text-xl font-bold text-semantic-success font-mono">Zero Baggage</p>
              <p className="text-[10px] text-plum-500">Vanishes upon resolution</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB NAVIGATION: NEEDS vs HELPERS vs ANNOUNCEMENTS */}
      <div className="flex items-center justify-between border-b border-plum-200 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('needs')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'needs'
                ? 'bg-rose-500 text-white border border-rose-500 shadow-rose-glow'
                : 'text-plum-700 hover:text-plum-900 bg-white border border-plum-200 shadow-plum-sm'
            }`}
          >
            Active Needs ({needs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('helpers')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'helpers'
                ? 'bg-rose-500 text-white border border-rose-500 shadow-rose-glow'
                : 'text-plum-700 hover:text-plum-900 bg-white border border-plum-200 shadow-plum-sm'
            }`}
          >
            Available Helpers ({offers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'announcements'
                ? 'bg-rose-500 text-white border border-rose-500 shadow-rose-glow'
                : 'text-plum-700 hover:text-plum-900 bg-white border border-plum-200 shadow-plum-sm'
            }`}
          >
            Announcements ({announcements.length})
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 text-plum-600 ${isLoading ? 'animate-spin' : ''}`} />}
          className="shadow-plum-sm bg-white border border-plum-200"
        >
          Refresh
        </Button>
      </div>

      {/* 3. SEARCH & CATEGORY FILTER */}
      {activeTab === 'needs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-plum-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search needs by title, skill, or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-xl pl-9 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-500 shadow-plum-sm"
              />
            </div>

            {/* Lifecycle Status Sub-filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === 'active'
                    ? 'bg-rose-300/60 text-plum-900 border border-rose-300 font-bold shadow-sm'
                    : 'bg-white text-plum-600 hover:text-plum-900 border border-plum-200 shadow-plum-sm'
                }`}
              >
                Active Requests
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === 'resolved'
                    ? 'bg-semantic-success-bg text-semantic-success border border-semantic-success-border font-bold shadow-sm'
                    : 'bg-white text-plum-600 hover:text-plum-900 border border-plum-200 shadow-plum-sm'
                }`}
              >
                Resolved / Found History
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === 'all'
                    ? 'bg-plum-200 text-plum-900 border border-plum-300 font-bold shadow-sm'
                    : 'bg-white text-plum-600 hover:text-plum-900 border border-plum-200 shadow-plum-sm'
                }`}
              >
                All Records
              </button>
            </div>
          </div>

          <CategoryFilter
            categories={CATEGORIES_WITH_ALL as any}
            activeCategory={selectedCategory as any}
            onSelectCategory={(c) => setSelectedCategory(c)}
          />
        </div>
      )}

      {/* 4. CONTENT SECTIONS */}
      {isLoading ? (
        <div className="py-20">
          <LoadingState
            message="Connecting to Need-to-Action Network..."
            submessage="Retrieving active requests and helper offers for this event zone"
          />
        </div>
      ) : activeTab === 'needs' ? (
        filteredNeeds.length === 0 ? (
          <EmptyState
            title={
              statusFilter === 'resolved'
                ? `No resolved requests in ${selectedCategory}`
                : `No active needs in ${selectedCategory}`
            }
            description={
              statusFilter === 'resolved'
                ? 'Resolved items and found requests will appear here once marked completed.'
                : 'Be the first to publish a collaboration request for fellow participants in this space.'
            }
            actionText={statusFilter === 'resolved' ? undefined : 'Create Need'}
            onAction={statusFilter === 'resolved' ? undefined : () => navigate('/create-post')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredNeeds.map((need) => {
              const requesterObj: any = need.requesterId || {};
              const isOwner = requesterObj._id === user?._id || requesterObj === user?._id;
              const isOrganizer = user?.role === 'organizer';
              const hasActiveCollab = !!need.activeCollaborationId;
              const isResolved = need.status === 'RESOLVED';
              const isExpired = need.status === 'EXPIRED';
              const isCancelled = need.status === 'CANCELLED';
              const isLostFound = need.category === 'Lost & Found';

              return (
                <div
                  key={need._id}
                  className={`rounded-3xl glass-card bg-white border p-6 space-y-4 transition-all shadow-plum-sm ${
                    isResolved
                      ? 'border-semantic-success-border bg-semantic-success-bg/20'
                      : isExpired || isCancelled
                      ? 'border-plum-200 bg-plum-100/40 opacity-80'
                      : 'border-plum-200 hover:border-rose-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                          {need.category}
                        </span>

                        {/* Explicit Status Badges */}
                        {isResolved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-semantic-success-bg text-semantic-success border border-semantic-success-border inline-flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-semantic-success" />
                            <span>
                              {isLostFound
                                ? 'Item Found — This request has been resolved.'
                                : 'Request Resolved — No further responses are needed.'}
                            </span>
                          </span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-plum-100 text-plum-600 border border-plum-200 font-mono">
                            Expired — This request is no longer active.
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-semantic-error-bg text-semantic-error border border-semantic-error-border font-mono">
                            Cancelled by Owner.
                          </span>
                        ) : (
                          <>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                                need.urgency === 'urgent'
                                  ? 'bg-semantic-error-bg text-semantic-error border border-semantic-error-border'
                                  : 'bg-plum-100 text-plum-700 border border-plum-200'
                              }`}
                            >
                              {need.urgency}
                            </span>

                            <span className="text-[11px] text-plum-600 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-rose-500" />
                              Est: {need.estimatedDurationMinutes}m
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-plum-900 pt-1 brand-font">{need.title}</h3>
                      <p className="text-xs text-plum-700 leading-relaxed">{need.description}</p>

                      {/* Informational Banner for Resolved or Inactive Records */}
                      {isResolved && (
                        <div className="p-2.5 rounded-xl bg-semantic-success-bg/60 border border-semantic-success-border text-[11px] text-semantic-success flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-semantic-success shrink-0" />
                          <span>
                            {isLostFound
                              ? 'This item has already been reported as found. No further claims are being accepted.'
                              : 'Request Resolved — No further responses are needed.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="shrink-0 pt-2 sm:pt-0 flex items-center gap-2 flex-wrap">
                      {isResolved ? (
                        <span className="text-xs font-semibold text-semantic-success bg-semantic-success-bg px-3 py-1.5 rounded-xl border border-semantic-success-border">
                          Resolved
                        </span>
                      ) : isExpired || isCancelled ? (
                        <span className="text-xs font-semibold text-plum-400 bg-plum-100 px-3 py-1.5 rounded-xl border border-plum-200">
                          Archived
                        </span>
                      ) : hasActiveCollab ? (
                        <Link to={`/collaborations/${need.activeCollaborationId}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="shadow-rose-glow"
                          >
                            Enter Active Room
                          </Button>
                        </Link>
                      ) : (
                        <>
                          {(isOwner || isOrganizer) && (
                            <Button
                              variant="outline"
                              size="sm"
                              isLoading={resolvingNeedId === need._id}
                              onClick={() => handleResolveNeed(need)}
                              className="border-semantic-success text-semantic-success hover:bg-semantic-success-bg text-xs"
                            >
                              {isLostFound ? 'Mark Found' : 'Mark Resolved'}
                            </Button>
                          )}

                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedNeedForMatch(need);
                              setIsMatchModalOpen(true);
                            }}
                            leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                            className="shadow-rose-glow"
                          >
                            Find Matches
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Skills tags and Requester footer */}
                  <div className="pt-3 border-t border-plum-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {need.requiredSkills?.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-lg bg-plum-100 border border-plum-200 text-[10px] text-plum-800 font-mono font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {(!need.requiredSkills || need.requiredSkills.length === 0) && (
                        <span className="text-[10px] text-plum-400 italic">General assistance request</span>
                      )}
                    </div>

                    <div className="text-[11px] text-plum-500 flex items-center gap-2">
                      <span>By <strong>{requesterObj?.name || 'Participant'}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-plum-500">
                        {isResolved
                          ? `Resolved ${new Date(need.resolvedAt || need.updatedAt || '').toLocaleDateString()}`
                          : `Expires ${new Date(need.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activeTab === 'helpers' ? (
        filteredOffers.length === 0 ? (
          <EmptyState
            title="No helpers currently active"
            description="Publish an offer with your skills and availability to assist fellow participants."
            actionText="Publish Offer"
            onAction={() => navigate('/create-post')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => {
              const helperObj: any = offer.helperId || {};
              const isAtCapacity = (offer.activeTaskCount || 0) >= (offer.maxConcurrentTasks || 1);
              const isExpired = new Date(offer.expiresAt) < new Date();

              return (
                <div
                  key={offer._id}
                  className={`p-6 rounded-3xl glass-card bg-white border space-y-4 shadow-plum-sm ${
                    isAtCapacity
                      ? 'border-semantic-warning-border'
                      : isExpired
                      ? 'border-plum-200 opacity-75'
                      : 'border-plum-200 hover:border-rose-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-plum-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {helperObj.name?.charAt(0) || 'H'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-plum-900">{helperObj.name}</h4>
                        <p className="text-[11px] text-plum-600 line-clamp-1">{helperObj.bio || 'Peer helper'}</p>
                      </div>
                    </div>

                    {/* Real capacity / availability status badge */}
                    {isAtCapacity ? (
                      <span className="px-2.5 py-1 rounded-xl bg-semantic-warning-bg border border-semantic-warning-border text-[10px] font-mono text-semantic-warning font-bold">
                        Already Claimed
                      </span>
                    ) : isExpired ? (
                      <span className="px-2.5 py-1 rounded-xl bg-plum-100 border border-plum-200 text-[10px] font-mono text-plum-500">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-100 border border-rose-300 text-[10px] font-mono text-rose-700 font-semibold">
                        {offer.availabilityMinutes}m available
                      </span>
                    )}
                  </div>

                  {isAtCapacity && (
                    <p className="text-[11px] text-semantic-warning bg-semantic-warning-bg/60 p-2 rounded-xl border border-semantic-warning-border">
                      Already Claimed — This helper is currently at maximum capacity ({offer.activeTaskCount}/{offer.maxConcurrentTasks} tasks).
                    </p>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-plum-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-plum-500">
                      Offered Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {offer.skills?.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-0.5 rounded-lg bg-plum-100 border border-plum-200 text-[10px] text-plum-800 font-mono font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Announcements Feed */
        announcements.length === 0 ? (
          <EmptyState
            title="No official announcements yet"
            description="Event organizers have not published any broadcasts for this zone."
          />
        ) : (
          <div className="space-y-3">
            {announcements.map((ann, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl glass-card bg-semantic-warning-bg/40 border border-semantic-warning-border space-y-2 shadow-plum-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-semantic-warning" />
                    <h4 className="font-bold text-plum-900 text-sm brand-font">{ann.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-plum-500">
                    {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-plum-700 leading-relaxed">{ann.content}</p>
                <p className="text-[10px] text-plum-500 pt-1">
                  Broadcasted by: <span className="text-plum-900 font-bold">{ann.authorName}</span>
                </p>
              </div>
            ))}
          </div>
        )
      )}

      {/* Match Discovery Modal */}
      {selectedNeedForMatch && (
        <MatchDiscoveryModal
          isOpen={isMatchModalOpen}
          onClose={() => {
            setIsMatchModalOpen(false);
            setSelectedNeedForMatch(null);
          }}
          need={selectedNeedForMatch}
        />
      )}
    </div>
  );
};

export default DashboardPage;
