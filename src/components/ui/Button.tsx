import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'sage';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium font-body transition-all duration-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer select-none active:scale-[0.98]';

  const variantStyles = {
    primary:
      'bg-[#0F172A] text-white hover:bg-[#1E293B] hover:shadow-md focus:ring-[#0F172A] border-none shadow-sm',
    secondary:
      'bg-white text-[#0F172A] border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-300 shadow-sm',
    ghost:
      'bg-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus:ring-[#64748B] border-none',
    destructive:
      'bg-[#EF4444] text-white hover:bg-[#DC2626] hover:shadow-md focus:ring-[#EF4444] border-none shadow-sm',
    sage:
      'bg-[#0D9488] text-white hover:bg-[#0F766E] hover:shadow-md focus:ring-[#0D9488] border-none shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-xs sm:text-[13px] px-2.5 py-1.5 sm:px-3.5 sm:py-2 min-h-[34px] sm:min-h-[38px] rounded-lg sm:rounded-xl',
    md: 'text-[14px] px-[22px] py-[10px] min-h-[44px]',
    lg: 'text-[16px] px-[28px] py-[12px] min-h-[48px]',
  };

  const disabledStyles = disabled || isLoading
    ? 'opacity-40 cursor-not-allowed hover:bg-none pointer-events-none'
    : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Memproses...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
