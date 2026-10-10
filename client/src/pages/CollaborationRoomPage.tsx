import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Send,
  User as UserIcon,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  XCircle,
  FileCheck2,
  Lock,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { ReportModal } from '../components/modals/ReportModal';
import { useAuth } from '../context/AuthContext';
import { collaborationService } from '../services/api';
import type { Collaboration } from '../types';

export const CollaborationRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [collab, setCollab] = useState<Collaboration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes state
  const [noteText, setNoteText] = useState('');
  const [isSendingNote, setIsSendingNote] = useState(false);

  // Resolve state
  const [isResolving, setIsResolving] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Time remaining countdown
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  const fetchCollaboration = async () => {
    if (!id) return;
    try {
      const data = await collaborationService.getCollaboration(id);
      setCollab(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to access collaboration room');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaboration();

    // Poll every 4 seconds for real-time collaborative note updates
    const interval = setInterval(fetchCollaboration, 4000);
    return () => clearInterval(interval);
  }, [id]);

  // Update countdown timer every second
  useEffect(() => {
    if (!collab?.deadline) return;

    const timer = setInterval(() => {
      const diff = new Date(collab.deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('Deadline Reached');
      } else {
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [collab?.deadline]);

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteText.trim()) return;

    setIsSendingNote(true);
    try {
      await collaborationService.addNote(id, noteText.trim());
      setNoteText('');
      fetchCollaboration();
    } catch (err: any) {
      alert(err.message || 'Failed to post note');
    } finally {
      setIsSendingNote(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!id) return;
    setIsResolving(true);
    try {
      await collaborationService.resolveCollaboration(id, resolveOutcome.trim());
      setShowResolveModal(false);
      fetchCollaboration();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve collaboration');
    } finally {
      setIsResolving(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!id || !confirm('Are you sure you want to exit this collaboration room?')) return;
    try {
      await collaborationService.leaveCollaboration(id);
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Failed to leave room');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState
          message="Entering Private Collaboration Workspace..."
          submessage="Restoring bilateral cryptographic room session"
        />
      </div>
    );
  }

  if (error || !collab) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <ErrorState
          title="Access Restricted"
          message={error || 'Collaboration room could not be found'}
          onRetry={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  const isRequester = collab.requesterId._id === user?._id;
  const needObj: any = collab.needId || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-plum-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white border border-plum-200 text-plum-600 hover:text-plum-900 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider font-mono">
                {collab.zoneId?.name || 'Hackathon Arena'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  collab.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : collab.status === 'RESOLVED'
                    ? 'bg-plum-100 text-plum-800 border border-plum-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                ● {collab.status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-plum-900 brand-font line-clamp-1">
              {needObj.title || 'Collaborative Task Workspace'}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {collab.status === 'ACTIVE' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowResolveModal(true)}
              leftIcon={<FileCheck2 className="w-4 h-4" />}
            >
              Mark Task Resolved
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportModal(true)}
            leftIcon={<ShieldAlert className="w-4 h-4 text-rose-500" />}
            className="text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100"
          >
            Report
          </Button>

          {collab.status === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              className="text-plum-600 hover:text-plum-900"
            >
              Leave
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Task Context & Collaborative Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Task Overview & Participants */}
        <div className="lg:col-span-5 space-y-6">
          {/* Synchronized Countdown Timer Card */}
          <div className="p-5 rounded-3xl bg-white border border-rose-200 shadow-plum-md space-y-2">
            <div className="flex items-center justify-between text-xs text-plum-500">
              <span className="flex items-center gap-1.5 text-rose-600 font-semibold uppercase tracking-wider text-[11px]">
                <Clock className="w-3.5 h-3.5" /> Synchronized Task Timer
              </span>
              <span className="text-[10px] font-mono text-plum-400">Server-enforced</span>
            </div>
            <p className="text-2xl md:text-3xl font-black text-plum-900 font-mono tracking-tight">
              {collab.status === 'RESOLVED' ? 'Task Completed' : timeLeftStr || 'Calculating...'}
            </p>
            <p className="text-[11px] text-plum-500">
              Deadline: {new Date(collab.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Task Summary Card */}
          <div className="p-6 rounded-3xl bg-white border border-plum-200 space-y-4 shadow-plum-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-600 font-mono">
              Task Specification
            </h3>
            <p className="text-xs text-plum-800 leading-relaxed">
              {needObj.description || 'Collaborative debugging and implementation task.'}
            </p>

            <div className="space-y-2 pt-2 border-t border-plum-100">
              <span className="text-[11px] text-plum-500 font-semibold">Required Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {needObj.requiredSkills?.map((s: string) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-lg bg-plum-100 border border-plum-200 text-[10px] text-plum-800 font-mono font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Accepted Participants Cards */}
          <div className="p-6 rounded-3xl bg-white border border-plum-200 space-y-4 shadow-plum-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-plum-600 font-mono">
              Active Room Collaborators
            </h3>

            <div className="space-y-3">
              {/* Requester Card */}
              <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 font-bold text-xs shrink-0">
                    {collab.requesterId.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-plum-900 flex items-center gap-1.5">
                      <span>{collab.requesterId.name}</span>
                      {isRequester && (
                        <span className="text-[9px] text-rose-600 font-mono font-bold">(You)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-plum-500">Task Owner (Requester)</p>
                  </div>
                </div>
              </div>

              {/* Helper Card */}
              <div className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-plum-200 border border-plum-300 flex items-center justify-center text-plum-900 font-bold text-xs shrink-0">
                    {collab.helperId.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-plum-900 flex items-center gap-1.5">
                      <span>{collab.helperId.name}</span>
                      {!isRequester && (
                        <span className="text-[9px] text-rose-600 font-mono font-bold">(You)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-plum-500">Matched Helper</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Collaborative Notes & Action Log */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-plum-200 shadow-plum-md flex flex-col h-[650px]">
          {/* Thread Header */}
          <div className="flex items-center justify-between border-b border-plum-100 pb-4 mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-plum-900">
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <span>Shared Task Notes & Direct Coordination</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Synchronized</span>
            </span>
          </div>

          {/* Notes Message Feed */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
            {collab.notes.length === 0 ? (
              <div className="py-20 text-center text-xs text-plum-400 italic">
                Workspace opened. Post git branches, table locations, or debugging updates below.
              </div>
            ) : (
              collab.notes.map((note) => {
                const isMyNote = note.senderId === user?._id;
                return (
                  <div
                    key={note._id}
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                      isMyNote
                        ? 'bg-rose-50/70 border-rose-200 ml-8'
                        : 'bg-plum-50/60 border-plum-100 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-plum-900 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isMyNote ? 'bg-rose-500' : 'bg-plum-700'
                          }`}
                        />
                        <span>{note.senderName}</span>
                      </span>
                      <span className="text-plum-400 font-mono text-[10px]">
                        {new Date(note.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-plum-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Box or Resolved State */}
          {collab.status === 'ACTIVE' ? (
            <form onSubmit={handleSendNote} className="pt-4 border-t border-plum-100 flex gap-2">
              <input
                type="text"
                placeholder="Share table position, code snippets, or notes..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition"
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSendingNote}
                rightIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </form>
          ) : (
            <div className="pt-4 border-t border-plum-100 p-3.5 rounded-2xl bg-plum-100 border border-plum-200 text-center text-xs text-plum-900">
              <span className="font-bold">Collaboration Archived.</span> Task marked as {collab.status}.
            </div>
          )}
        </div>
      </div>

      {/* Task Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-plum-200 p-6 md:p-8 shadow-plum-xl">
            <h3 className="text-lg font-bold text-plum-900 mb-2 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-rose-500" />
              <span>Confirm Task Resolution</span>
            </h3>
            <p className="text-xs text-plum-600 mb-4">
              Recording completion transitions the task state to RESOLVED and credits both
              collaborators in event outcome analytics.
            </p>

            <textarea
              rows={3}
              placeholder="Optional summary outcome (e.g. Bug resolved, FastAPI Docker container running)..."
              value={resolveOutcome}
              onChange={(e) => setResolveOutcome(e.target.value)}
              className="w-full bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400 transition mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowResolveModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isResolving}
                onClick={handleConfirmResolve}
              >
                Confirm Resolution
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="collaboration"
        targetId={collab._id}
        targetTitle={needObj.title}
      />
    </div>
  );
};

export default CollaborationRoomPage;
