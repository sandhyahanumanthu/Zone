import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Connection Unavailable',
  message = 'Unable to establish connection with the DropZone API cluster. Verify that the backend server is running.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-8 rounded-3xl border border-rose-300 bg-semantic-error-bg text-center flex flex-col items-center justify-center shadow-plum-sm ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 text-semantic-error flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-plum-900 mb-1 brand-font">{title}</h3>
      <p className="text-xs text-plum-700 max-w-md mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-400 text-rose-600 hover:bg-rose-100"
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
