import React from 'react';
import { Inbox, Compass } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No posts in this zone yet',
  description = 'Be the first pioneer to drop an event, question, or meetup in this local perimeter.',
  icon,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-plum-200 bg-white shadow-plum-sm ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-plum-100 border border-plum-200 flex items-center justify-center text-rose-500 mb-4 shadow-plum-sm">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-bold text-plum-900 mb-1.5 brand-font">{title}</h3>
      <p className="text-sm text-plum-600 max-w-md mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={<Compass className="w-4 h-4" />}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
