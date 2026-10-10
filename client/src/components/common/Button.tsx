import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-4.5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-bold',
  };

  const variantStyles = {
    primary:
      'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-glow hover:shadow-[0_6px_22px_rgba(217,108,157,0.45)] focus-visible:ring-rose-400 border border-rose-400/40 hover:brightness-105',
    secondary:
      'bg-white text-plum-900 hover:bg-plum-100/80 border border-plum-200 hover:border-plum-300 focus-visible:ring-plum-400 shadow-plum-sm',
    outline:
      'bg-transparent text-rose-600 border border-rose-300 hover:border-rose-400 hover:bg-rose-50 focus-visible:ring-rose-400 shadow-plum-sm',
    ghost:
      'bg-transparent text-plum-700 hover:text-plum-900 hover:bg-plum-100/70 focus-visible:ring-plum-300',
    danger:
      'bg-semantic-error hover:bg-rose-700 text-white border border-rose-600/40 shadow-sm focus-visible:ring-rose-400',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
