import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserX,
  FileX,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { moderationService } from '../services/api';
import type { Report, User } from '../types';

export const ModerationPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [queueData, blockedData] = await Promise.all([
        moderationService.getModerationQueue('pending'),
        moderationService.getBlockedUsers().catch(() => []),
      ]);
      setReports(queueData);
      setBlockedUsers(blockedData);
    } catch (err: any) {
      console.warn('Moderation fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (
    reportId: string,
    status: 'reviewed' | 'dismissed',
    actionTaken: 'none' | 'flagged_content' | 'removed_content' | 'deactivated_user'
  ) => {
    try {
      await moderationService.moderateReport(reportId, {
        status,
        actionTaken,
        moderatorNotes: `Action ${actionTaken} applied by logged-in moderator.`,
      });
      setActionFeedback(`Report ${reportId.slice(-6)} marked as ${status} (Action: ${actionTaken}).`);
      setTimeout(() => setActionFeedback(null), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Safety & Moderation Audit Queue"
          subtitle="Review reported needs, inappropriate messages, and enforce community guidelines."
          badge="Audit Trail"
        />

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchData}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="self-start sm:self-auto"
        >
          Refresh Queue
        </Button>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20">
          <LoadingState
            message="Loading Pending Moderation Flags..."
            submessage="Verifying safety queue credentials and audit records"
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Reports Queue List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-plum-500 px-1">
              <span className="font-bold uppercase tracking-wider text-plum-900 font-mono">
                Pending Flags ({reports.length})
              </span>
              <span className="font-mono text-rose-600 font-semibold">Strict Human-in-the-Loop Verification</span>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                title="Moderation Queue is Clean"
                description="Zero pending flags or reported content in the system. Community interactions are healthy."
              />
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="p-5 rounded-3xl bg-white border border-plum-200 space-y-3 shadow-plum-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-plum-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-800 border border-rose-200 font-mono">
                          {report.targetType}
                        </span>
                        <span className="text-xs font-mono text-plum-500">
                          ID: {report.targetId}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-plum-400">
                        Reported {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-plum-900">Flagged Reason:</p>
                      <p className="text-xs text-rose-900 bg-rose-50/70 p-3 rounded-xl border border-rose-200 leading-relaxed">
                        "{report.reason}"
                      </p>
                    </div>

                    {report.reporterId && (
                      <p className="text-[11px] text-plum-600">
                        Filed by: <strong className="text-plum-900">{report.reporterId.name}</strong> ({report.reporterId.email})
                      </p>
                    )}

                    {/* Moderation Actions Bar */}
                    <div className="pt-3 border-t border-plum-100 flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAction(report._id, 'dismissed', 'none')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-plum-500" />}
                      >
                        Dismiss Flag
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAction(report._id, 'reviewed', 'removed_content')}
                        leftIcon={<FileX className="w-3.5 h-3.5 text-amber-600" />}
                        className="text-amber-800 border-amber-200 hover:bg-amber-50"
                      >
                        Remove Content
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAction(report._id, 'reviewed', 'deactivated_user')}
                        leftIcon={<UserX className="w-3.5 h-3.5" />}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Deactivate User
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blocked Users Section */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-plum-200 space-y-4 shadow-plum-md">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-plum-700 font-mono">
              <Lock className="w-4 h-4 text-rose-500" />
              <span>Your Blocked Users Pool ({blockedUsers.length})</span>
            </div>
            <p className="text-xs text-plum-600">
              Blocked users are immediately excluded from your match candidate algorithms and cannot
              enter private collaboration rooms with you.
            </p>

            {blockedUsers.length === 0 ? (
              <p className="text-xs text-plum-400 italic">No blocked users.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {blockedUsers.map((bu) => (
                  <div
                    key={bu._id}
                    className="p-3.5 rounded-2xl bg-plum-50/70 border border-plum-100 text-xs flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 border border-rose-200">
                      {bu.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-plum-900 truncate">{bu.name}</p>
                      <p className="text-[10px] text-plum-500 truncate">{bu.bio || 'Blocked peer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationPage;
