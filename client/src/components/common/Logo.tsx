import React from 'react';
import { MapPin, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  asLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  asLink = true,
}) => {
  const sizeClasses = {
    sm: {
      icon: 'w-5 h-5',
      text: 'text-lg',
      wrapper: 'gap-2',
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    md: {
      icon: 'w-6 h-6',
      text: 'text-2xl',
      wrapper: 'gap-2.5',
      badge: 'text-[10px] px-2 py-0.5',
    },
    lg: {
      icon: 'w-8 h-8',
      text: 'text-3xl md:text-4xl',
      wrapper: 'gap-3.5',
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const currentSize = sizeClasses[size];

  const content = (
    <div className={`inline-flex items-center ${currentSize.wrapper} ${className} group`}>
      {/* Location Pin & Pulse Community Icon */}
      <div className="relative flex items-center justify-center">
        <div className="relative flex items-center justify-center p-2 rounded-xl bg-plum-900 border border-plum-800 shadow-plum-md group-hover:bg-plum-850 transition-colors">
          <MapPin className={`${currentSize.icon} text-rose-400 group-hover:text-rose-300 transition-colors`} />
          <Radio className="absolute w-3 h-3 text-rose-300 animate-ping opacity-75" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-tight brand-font text-plum-900 ${currentSize.text}`}>
            Drop<span className="text-rose-500">Zone</span>
          </span>
          <span className={`rounded-full font-bold tracking-wide uppercase bg-rose-300/60 text-plum-900 border border-rose-300 ${currentSize.badge}`}>
            v1.0
          </span>
        </div>
        {showTagline && (
          <span className="text-xs text-plum-500 font-medium">
            Find What You Need. Offer What You Can. Get Things Done.
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
