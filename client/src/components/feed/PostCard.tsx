import React, { useState } from 'react';
import { Clock, ThumbsUp, MessageSquare, Flag, MapPin, ShieldAlert, Sparkles } from 'lucide-react';
import type { Post } from '../../types';
import { formatExpiryCountdown, formatRelativeTime } from '../../utils/dateUtils';

interface PostCardProps {
  post: Post;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, className = '' }) => {
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [reported, setReported] = useState(false);

  const expiry = formatExpiryCountdown(post.expiresAt);

  const authorName = typeof post.authorId === 'object' ? post.authorId.name : 'Zone Resident';
  const authorRole = typeof post.authorId === 'object' ? post.authorId.role : 'user';
  const zoneName = typeof post.zoneId === 'object' ? post.zoneId.name : 'Local Perimeter';

  const categoryColors: Record<string, string> = {
    'Events': 'bg-rose-300/40 text-plum-900 border-rose-300',
    'Lost & Found': 'bg-semantic-warning-bg text-semantic-warning border-semantic-warning-border',
    'Study Groups': 'bg-plum-100 text-plum-800 border-plum-200',
    'Team Up': 'bg-semantic-success-bg text-semantic-success border-semantic-success-border',
    'Questions': 'bg-rose-100 text-rose-700 border-rose-300',
    'All': 'bg-plum-100 text-plum-800 border-plum-200',
  };

  const handleUpvote = () => {
    if (hasUpvoted) {
      setUpvotes((prev) => prev - 1);
      setHasUpvoted(false);
    } else {
      setUpvotes((prev) => prev + 1);
      setHasUpvoted(true);
    }
  };

  const handleReport = () => {
    setReported(true);
    setTimeout(() => {
      alert('Report submitted: This notice has been flagged for community moderation.');
    }, 100);
  };

  return (
    <article
      className={`glass-card relative group rounded-3xl p-6 transition-all duration-300 border border-plum-200 hover:border-rose-400 bg-white shadow-plum-sm ${className}`}
    >
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pill */}
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border shadow-sm ${
              categoryColors[post.category] || 'bg-plum-100 text-plum-800 border-plum-200'
            }`}
          >
            {post.category}
          </span>

          {/* Zone Badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-plum-700 bg-plum-100/80 px-2.5 py-0.5 rounded-lg border border-plum-200">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span className="truncate max-w-[140px] md:max-w-[220px]">{zoneName}</span>
          </span>

          {/* Preview Post Badge if Mock */}
          {post.isMock && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-medium text-plum-700 bg-rose-200/60 px-2 py-0.5 rounded-md border border-rose-300"
              title="Illustrative preview post"
            >
              <Sparkles className="w-2.5 h-2.5 text-rose-500" />
              Preview Post
            </span>
          )}
        </div>

        {/* Temporary Post Expiry Counter */}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
            expiry.isUrgent
              ? 'bg-semantic-error-bg text-semantic-error border-semantic-error-border animate-pulse'
              : 'bg-plum-100/80 text-plum-700 border-plum-200'
          }`}
          title="Content vanishes automatically upon expiration"
        >
          <Clock className={`w-3.5 h-3.5 ${expiry.isUrgent ? 'text-semantic-error' : 'text-rose-500'}`} />
          <span className="font-mono text-[11px]">{expiry.text}</span>
        </div>
      </div>

      {/* Post Title */}
      <h3 className="text-base sm:text-lg font-bold text-plum-900 group-hover:text-rose-600 transition-colors mb-2 brand-font">
        {post.title}
      </h3>

      {/* Post Content */}
      <p className="text-sm text-plum-700 leading-relaxed mb-4 whitespace-pre-line">
        {post.content}
      </p>

      {/* Bottom Footer Details */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-plum-200 text-xs text-plum-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-plum-700 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
            {authorName.charAt(0)}
          </div>
          <span className="font-semibold text-plum-800">{authorName}</span>
          {authorRole === 'moderator' && (
            <span className="text-[9px] uppercase font-bold text-plum-900 bg-rose-300/60 px-1.5 py-0.2 rounded border border-rose-300">
              Mod
            </span>
          )}
          <span>•</span>
          <span className="text-plum-500 font-mono text-[11px]">{formatRelativeTime(post.createdAt)}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpvote}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
              hasUpvoted
                ? 'bg-rose-100 text-rose-700 border-rose-300 shadow-rose-glow-sm'
                : 'bg-plum-100/70 text-plum-700 hover:text-plum-900 border-plum-200 hover:border-plum-300'
            }`}
            aria-label="Upvote post"
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'text-rose-600 fill-rose-600' : ''}`} />
            <span>{upvotes}</span>
          </button>

          <button
            onClick={() => alert('Discussion thread modal: Active in this zone perimeter.')}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-plum-100/70 text-plum-700 hover:text-plum-900 transition-colors border border-plum-200 hover:border-plum-300"
            aria-label="View replies"
          >
            <MessageSquare className="w-3.5 h-3.5 text-plum-500" />
            <span>{post.repliesCount || 0}</span>
          </button>

          <button
            onClick={handleReport}
            className={`p-1.5 rounded-xl text-xs transition-colors border ${
              reported
                ? 'text-semantic-error bg-semantic-error-bg border-semantic-error-border'
                : 'text-plum-400 hover:text-semantic-error bg-plum-100/40 border-plum-200 hover:border-rose-300'
            }`}
            title="Report this post"
            aria-label="Report this post"
          >
            {reported ? <ShieldAlert className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
