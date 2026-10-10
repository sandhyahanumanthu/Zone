import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '../common/Button';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';
import { matchService } from '../../services/api';
import type { Need, MatchCandidate } from '../../types';

interface MatchDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  need: Need | null;
}

export const MatchDiscoveryModal: React.FC<MatchDiscoveryModalProps> = ({
  isOpen,
  onClose,
  need,
}) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!need) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await matchService.getMatchesForNeed(need._id);
      setMatches(data);
      if (data.length > 0) {
        setExpandedOfferId(data[0].offerId); // Auto-expand top match
      }
    } catch (err: any) {
      setError(err.message || 'Unable to compute matches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && need) {
      fetchMatches();
    }
  }, [isOpen, need]);

  if (!isOpen || !need) return null;

  const handleAcceptMatch = async (offerId: string) => {
    setAcceptingOfferId(offerId);
    try {
      const result = await matchService.acceptMatch(need._id, offerId);
      onClose();
      // Navigate to the newly opened temporary collaboration room
      navigate(`/collaborations/${result.collaborationId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to accept match');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-semantic-success border-semantic-success-border bg-semantic-success-bg shadow-sm';
    if (score >= 65) return 'text-rose-600 border-rose-300 bg-rose-50 shadow-sm';
    return 'text-semantic-warning border-semantic-warning-border bg-semantic-warning-bg shadow-sm';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 glass-panel rounded-3xl border border-plum-200 bg-white p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-plum-400 hover:text-plum-900 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Explainable Matching Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-plum-900 brand-font">
            Candidate Helpers for Your Request
          </h2>

          {/* Resolved or Stale Lifecycle Notice */}
          {need.status === 'RESOLVED' && (
            <div className="p-4 rounded-2xl bg-semantic-success-bg border border-semantic-success-border text-semantic-success text-xs flex items-start gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-semantic-success shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-plum-900 text-sm">Item Found — This request has been resolved.</p>
                <p className="text-plum-700 mt-0.5">
                  This item has already been marked as resolved or found. No further helper matches or claims are being accepted.
                </p>
              </div>
            </div>
          )}

          {need.status === 'EXPIRED' && (
            <div className="p-4 rounded-2xl bg-semantic-warning-bg border border-semantic-warning-border text-semantic-warning text-xs flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-semantic-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-plum-900 text-sm">Expired — This request is no longer active.</p>
                <p className="text-plum-700 mt-0.5">
                  The request duration has passed and this item has been archived.
                </p>
              </div>
            </div>
          )}

          {need.status === 'IN_PROGRESS' && (
            <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 text-xs flex items-start gap-3 shadow-sm">
              <Sparkles className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-plum-900 text-sm">In Progress — Already Claimed</p>
                <p className="text-plum-700 mt-0.5">
                  A helper is actively working on this request in a live collaboration workspace.
                </p>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-plum-100/60 border border-plum-200 text-xs text-plum-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-plum-900">Need: {need.title}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                need.status === 'RESOLVED' ? 'bg-semantic-success-bg text-semantic-success border border-semantic-success-border' :
                need.status === 'IN_PROGRESS' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                need.status === 'EXPIRED' ? 'bg-semantic-warning-bg text-semantic-warning border border-semantic-warning-border' :
                'bg-rose-300/60 text-plum-900 border border-rose-300'
              }`}>
                Status: {need.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full bg-white text-[10px] text-rose-600 font-mono font-semibold border border-plum-200">
                {need.category}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white text-[10px] text-plum-700 font-mono border border-plum-200">
                Duration: {need.estimatedDurationMinutes}m
              </span>
              {need.requiredSkills?.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full bg-rose-100 border border-rose-300 text-[10px] text-rose-700 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="py-12">
            <LoadingState
              message="Evaluating Candidate Offers..."
              submessage="Executing multi-factor scoring against skills (40%), availability (30%), category (20%), and capacity (10%)"
            />
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-semantic-error-bg border border-semantic-error-border text-semantic-error text-xs flex items-center justify-between">
            <span>• {error}</span>
            <Button size="sm" variant="ghost" onClick={fetchMatches}>
              Retry
            </Button>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No active helper offers currently match this need"
              description="Helpers in this zone haven't published matching skills yet, or are currently engaged on active tasks. Your request remains live in the event pool for incoming helpers."
            />
          </div>
        ) : (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs text-plum-600 px-1">
              <span>Found {matches.length} Compatible Helper(s)</span>
              <span className="text-[11px] font-mono text-rose-600 font-semibold">Ranked by Composite Compatibility</span>
            </div>

            {matches.map((candidate) => {
              const isExpanded = expandedOfferId === candidate.offerId;
              const isAccepting = acceptingOfferId === candidate.offerId;

              return (
                <div
                  key={candidate.offerId}
                  className="rounded-2xl border border-plum-200 bg-plum-100/40 p-5 space-y-4 hover:border-rose-300 transition-all shadow-plum-sm"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-plum-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                        {candidate.helper.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-plum-900 flex items-center gap-2">
                          <span>{candidate.helper.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white text-plum-700 border border-plum-200 uppercase">
                            {candidate.helper.role}
                          </span>
                        </h4>
                        <p className="text-xs text-plum-600 line-clamp-1 mt-0.5">
                          {candidate.helper.bio || 'Available helper in the event arena'}
                        </p>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-2xl border text-center shrink-0 ${getScoreColor(
                        candidate.score
                      )}`}
                    >
                      <p className="text-base font-black font-mono leading-none">
                        {candidate.score}%
                      </p>
                      <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5">Match</p>
                    </div>
                  </div>

                  {/* Skills Tag Strip */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {candidate.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-lg bg-semantic-success-bg border border-semantic-success-border text-[10px] text-semantic-success font-semibold"
                      >
                        ✓ {s}
                      </span>
                    ))}
                    {candidate.missingSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-lg bg-white border border-plum-200 text-[10px] text-plum-500"
                      >
                        – {s}
                      </span>
                    ))}
                    <span className="text-[10px] text-plum-600 ml-auto flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-rose-500" />
                      {candidate.availableMinutes}m available
                    </span>
                  </div>

                  {/* Explainable Reasons Accordion */}
                  <div className="pt-2 border-t border-plum-200 space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOfferId(isExpanded ? null : candidate.offerId)
                      }
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Why this match? (Explainable Breakdown)</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-3.5 rounded-xl bg-white border border-plum-200 space-y-2.5 text-xs animate-fade-in shadow-plum-sm">
                        {/* Score Breakdown Bars */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                          <div className="p-2 rounded-lg bg-plum-100/60 border border-plum-200">
                            <span className="text-plum-600">Skills (40%): </span>
                            <span className="font-bold text-plum-900">
                              {candidate.scoreBreakdown.skills}%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-plum-100/60 border border-plum-200">
                            <span className="text-plum-600">Avail (30%): </span>
                            <span className="font-bold text-plum-900">
                              {candidate.scoreBreakdown.availability}%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-plum-100/60 border border-plum-200">
                            <span className="text-plum-600">Category (20%): </span>
                            <span className="font-bold text-plum-900">
                              {candidate.scoreBreakdown.category}%
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-plum-100/60 border border-plum-200">
                            <span className="text-plum-600">Capacity (10%): </span>
                            <span className="font-bold text-plum-900">
                              {candidate.scoreBreakdown.workload}%
                            </span>
                          </div>
                        </div>

                        {/* Explicit Reasons List */}
                        <ul className="space-y-1 text-plum-700 text-[11px]">
                          {candidate.reasons.map((r, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2 flex items-center justify-end gap-3">
                    {need.status !== 'OPEN' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-plum-500 italic font-mono">
                          {need.status === 'RESOLVED'
                            ? 'Item Found — No further claims accepted'
                            : need.status === 'IN_PROGRESS'
                            ? 'Already claimed — In active collaboration'
                            : 'Request is no longer active'}
                        </span>
                        <Button variant="ghost" size="sm" disabled>
                          Unavailable
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isAccepting}
                        onClick={() => handleAcceptMatch(candidate.offerId)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="shadow-rose-glow"
                      >
                        Accept & Start Collaboration
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-plum-200 flex items-center justify-between text-[11px] text-plum-600">
          <div className="flex items-center gap-1 text-rose-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Two-Way Consent Guarantee: Workspaces open only upon mutual acceptance</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MatchDiscoveryModal;
