import React, { useState } from 'react';
import { ShieldAlert, X, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { moderationService } from '../../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'need' | 'post' | 'collaboration' | 'user';
  targetId: string;
  targetTitle?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for the report');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await moderationService.createReport({
        targetType,
        targetId,
        reason: reason.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-rose-300 bg-white p-6 md:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-plum-400 hover:text-plum-900 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-semantic-error mb-4">
          <div className="p-2.5 rounded-2xl bg-semantic-error-bg border border-rose-300">
            <ShieldAlert className="w-6 h-6 text-semantic-error" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-plum-900">Report Safety Concern</h3>
            <p className="text-xs text-plum-600">
              Escalate content to event safety officers and moderators
            </p>
          </div>
        </div>

        {targetTitle && (
          <div className="p-3 rounded-xl bg-plum-100 border border-plum-200 mb-4 text-xs text-plum-800">
            <span className="text-plum-500">Target: </span>
            <span className="font-bold text-plum-900">{targetTitle}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-2xl bg-semantic-success-bg border border-semantic-success-border text-semantic-success text-xs flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-semantic-success shrink-0" />
            <p className="font-semibold">
              Report submitted successfully. Our moderator team has queued it for review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-plum-900">
                Reason for Report <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this content violates community guidelines (harassment, spam, fraudulent skill representation, abusive behavior)..."
                className="w-full bg-white border border-plum-200 text-plum-900 placeholder-plum-400 text-xs rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-500 transition shadow-plum-sm"
              />
              {error && <p className="text-xs text-rose-600 font-medium">• {error}</p>}
            </div>

            <p className="text-[11px] text-plum-500 leading-relaxed">
              DropZone strictly enforces fair play and respectful collaboration at all events. Reports
              create an immutable audit record for the organizing committee.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-plum-200">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                className="bg-semantic-error hover:bg-rose-700 text-white shadow-plum-sm"
                rightIcon={<Send className="w-4 h-4" />}
              >
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
