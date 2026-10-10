import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  highlight?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
  highlight = false,
}) => {
  return (
    <div
      className={`glass-card relative group p-7 rounded-3xl transition-all duration-300 border ${
        highlight
          ? 'border-rose-400 shadow-rose-glow-sm bg-white'
          : 'border-plum-200 hover:border-rose-300'
      }`}
    >
      {badge && (
        <span className="absolute top-5 right-5 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-rose-300/50 text-plum-900 border border-rose-300">
          {badge}
        </span>
      )}

      <div className="w-12 h-12 rounded-2xl bg-plum-100 border border-plum-200 flex items-center justify-center text-rose-500 group-hover:text-rose-600 group-hover:border-rose-400 group-hover:scale-105 transition-all duration-300 mb-5 shadow-plum-sm">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-plum-900 mb-2 brand-font group-hover:text-rose-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-plum-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
