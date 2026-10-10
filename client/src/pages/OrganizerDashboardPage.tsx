import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Radio,
  Send,
  Users,
  Shield,
  Layers,
  Sparkles,
  QrCode,
  AlertTriangle,
  RefreshCw,
  Megaphone,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingState } from '../components/common/LoadingState';
import { analyticsService, zoneService } from '../services/api';
import { useZone } from '../context/ZoneContext';
import type { Zone, EventAnalytics } from '../types';

export const OrganizerDashboardPage: React.FC = () => {
  const { currentZone, zones: contextZones, setCurrentZone } = useZone();
  const [zones, setZones] = useState<Zone[]>(contextZones || []);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    currentZone?._id || (currentZone as any)?.id || ''
  );
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Announcement Form State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  useEffect(() => {
    if (contextZones && contextZones.length > 0) {
      setZones(contextZones);
      if (!selectedZoneId) {
        const active = currentZone || contextZones.find((z) => z.type === 'hackathon') || contextZones[0];
        setSelectedZoneId(active._id || (active as any).id);
      }
    } else {
      zoneService
        .getAllZones()
        .then((data) => {
          setZones(data);
          if (data.length > 0 && !selectedZoneId) {
            const defaultZone = currentZone || data.find((z) => z.type === 'hackathon') || data[0];
            setSelectedZoneId(defaultZone._id || (defaultZone as any).id);
          }
        })
        .catch(() => setIsLoading(false));
    }
  }, [contextZones, currentZone]);

  const fetchAnalytics = async () => {
    if (!selectedZoneId) return;
    setIsLoading(true);
    try {
      const data = await analyticsService.getEventAnalytics(selectedZoneId);
      setAnalytics(data);
    } catch (err) {
      console.warn('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedZoneId) {
      fetchAnalytics();
    }
  }, [selectedZoneId]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneId || !announcementTitle.trim() || !announcementContent.trim()) {
      setBroadcastError('Please provide both title and announcement content');
      return;
    }

    setIsBroadcasting(true);
    setBroadcastError(null);
    setBroadcastSuccess(false);

    try {
      await zoneService.addAnnouncement(selectedZoneId, {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
      });
      setBroadcastSuccess(true);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setTimeout(() => setBroadcastSuccess(false), 3000);
    } catch (err: any) {
      setBroadcastError(err.message || 'Failed to broadcast announcement');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const selectedZone = zones.find((z) => z._id === selectedZoneId);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Organizer Outcome Telemetry"
          subtitle="Real database metrics tracking need-to-action velocity, match acceptance, and task resolution."
          badge="Live Audit"
        />

        {/* Zone Selector */}
        <div className="shrink-0">
          <select
            value={selectedZoneId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedZoneId(newId);
              const matched = zones.find((z) => (z._id || (z as any).id) === newId);
              if (matched) setCurrentZone(matched);
            }}
            className="bg-white border border-plum-200 text-plum-900 text-xs rounded-2xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 shadow-sm"
          >
            {zones.map((z) => {
              const zid = z._id || (z as any).id;
              return (
                <option key={zid} value={zid}>
                  {z.name} ({z.type.toUpperCase()})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20">
          <LoadingState
            message="Aggregating Real Event Analytics..."
            submessage="Scanning database collections for needs, offers, and resolution records"
          />
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          {/* 1. TOP-LINE IMPACT METRIC CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Match Acceptance Rate */}
            <div className="p-5 rounded-3xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
              <div className="flex items-center justify-between text-xs text-plum-500">
                <span className="font-semibold">Match Acceptance</span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-rose-600 font-mono">
                {analytics.matchAcceptanceRate}%
              </p>
              <p className="text-[10px] text-plum-400">Needs leading to bilateral room</p>
            </div>

            {/* Task Resolution Rate */}
            <div className="p-5 rounded-3xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
              <div className="flex items-center justify-between text-xs text-plum-500">
                <span className="font-semibold">Task Resolution Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-700 font-mono">
                {analytics.taskResolutionRate}%
              </p>
              <p className="text-[10px] text-plum-400">Accepted tasks confirmed RESOLVED</p>
            </div>

            {/* Median Time to Resolution */}
            <div className="p-5 rounded-3xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
              <div className="flex items-center justify-between text-xs text-plum-500">
                <span className="font-semibold">Median Resolution</span>
                <Clock className="w-4 h-4 text-plum-700" />
              </div>
              <p className="text-3xl font-black text-plum-900 font-mono">
                {analytics.medianResolutionMinutes}m
              </p>
              <p className="text-[10px] text-plum-400">Time from room start to resolve</p>
            </div>

            {/* Active Helper Capacity */}
            <div className="p-5 rounded-3xl bg-white border border-plum-200 space-y-1 shadow-plum-sm">
              <div className="flex items-center justify-between text-xs text-plum-500">
                <span className="font-semibold">Active Helper Pool</span>
                <Users className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-3xl font-black text-rose-600 font-mono">
                {analytics.activeOffers} Helpers
              </p>
              <p className="text-[10px] text-plum-400">Indexed for immediate matching</p>
            </div>
          </div>

          {/* 2. ACTIVITY LIFECYCLE DISTRIBUTION & CONTEXTPASS CARD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lifecycle Breakdown Box */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-plum-700 flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4 text-rose-500" />
                <span>Request State Machine Distribution</span>
              </h3>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-semibold text-plum-900">Total Needs Broadcasted</span>
                  </div>
                  <span className="font-mono font-bold text-rose-600">{analytics.totalNeeds}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-plum-900">Open in Match Candidate Pool</span>
                  </div>
                  <span className="font-mono font-bold text-amber-700">{analytics.openNeeds}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-plum-700" />
                    <span className="font-semibold text-plum-900">Active Collaboration Rooms</span>
                  </div>
                  <span className="font-mono font-bold text-plum-900">
                    {analytics.activeCollaborations}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-plum-900">Successfully Resolved Tasks</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700">{analytics.resolvedNeeds}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-plum-400" />
                    <span className="font-semibold text-plum-900">Expired & Server-Purged</span>
                  </div>
                  <span className="font-mono font-bold text-plum-500">{analytics.expiredNeeds}</span>
                </div>
              </div>
            </div>

            {/* ContextPass QR & Access Onboarding Card */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-plum-700 flex items-center gap-2 font-mono">
                <QrCode className="w-4 h-4 text-rose-500" />
                <span>ContextPass Onboarding Pass</span>
              </h3>

              <div className="p-5 rounded-2xl bg-plum-50/70 border border-plum-100 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-28 h-28 rounded-2xl bg-white p-2.5 flex items-center justify-center shrink-0 shadow-sm border border-plum-200">
                  {/* Decorative QR code mock representation */}
                  <div className="w-full h-full border-4 border-plum-900 rounded-lg p-1.5 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 bg-plum-900 rounded-sm" />
                      <div className="w-4 h-4 bg-plum-900 rounded-sm" />
                    </div>
                    <div className="text-[8px] font-mono font-black text-center text-plum-900">
                      DROPZONE
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 bg-plum-900 rounded-sm" />
                      <div className="w-2 h-2 bg-rose-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-plum-900 text-sm">
                    {selectedZone?.name || 'Global Hackathon Arena'}
                  </p>
                  <p className="text-plum-600">
                    Attendees scan to verify physical context. Zero app-store installation required.
                  </p>
                  <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                    <span className="text-plum-500 font-semibold">Join Pass Code:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-plum-100 border border-plum-200 text-plum-900 font-bold">
                      {selectedZone?.joinCode || 'SAMARTHA2026'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-plum-500 leading-relaxed">
                * Location verified on-device. Coordinates are never persistently broadcasted or logged.
                Public visitors can view broadcast announcements; requests and rooms require verified
                ContextPass membership.
              </p>
            </div>
          </div>

          {/* 3. BROADCAST OFFICIAL ANNOUNCEMENT FORM */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md space-y-4">
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider font-mono">
              <Megaphone className="w-4 h-4" />
              <span>Broadcast Official Announcement</span>
            </div>
            <p className="text-xs text-plum-600">
              Publish a verified broadcast to all attendees in this zone (e.g. food alerts, milestone
              reminders, mentor updates).
            </p>

            {broadcastSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Announcement broadcasted successfully to all zone participants!</span>
              </div>
            )}

            {broadcastError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{broadcastError}</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4">
              <Input
                placeholder="Announcement Headline (e.g. Dinner Served at Cafeteria Pod B)"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Detailed announcement context for attendees..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition shadow-sm"
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isBroadcasting}
                  rightIcon={<Send className="w-4 h-4" />}
                >
                  Broadcast to Zone
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrganizerDashboardPage;
