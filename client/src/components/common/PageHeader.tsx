import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-plum-200 mb-8 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-black text-plum-900 tracking-tight brand-font">
            {title}
          </h1>
          {badge && (
            <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-rose-300/50 text-plum-900 border border-rose-300">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-plum-600 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
};

export default PageHeader;
