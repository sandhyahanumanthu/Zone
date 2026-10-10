import React from 'react';
import { Radio } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Scanning zone frequency...',
  submessage = 'Connecting to geofenced mesh network',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative mb-6">
        {/* Radar ping effect */}
        <div className="w-16 h-16 rounded-full bg-rose-400/20 animate-ping absolute inset-0"></div>
        <div className="w-16 h-16 rounded-full bg-rose-300/30 animate-pulse absolute inset-0"></div>
        <div className="relative w-16 h-16 rounded-full bg-white border border-rose-300 flex items-center justify-center shadow-plum-md">
          <Radio className="w-7 h-7 text-rose-500 animate-spin text-center" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h3 className="text-base font-bold text-plum-900 tracking-wide mb-1 brand-font">{message}</h3>
      <p className="text-xs text-plum-600 max-w-sm">{submessage}</p>
    </div>
  );
};

export default LoadingState;
