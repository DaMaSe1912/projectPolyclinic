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
    'inline-flex items-center justify-center font-medium font-body transition-colors rounded-[8px] focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] cursor-pointer select-none';

  const variantStyles = {
    primary:
      'bg-[#0F172A] text-white hover:bg-[#020617] focus:ring-[#0F172A] border-none shadow-sm',
    secondary:
      'bg-transparent text-[#0F172A] border border-[#0F172A] hover:bg-[#0F172A0A] focus:ring-[#0F172A]',
    ghost:
      'bg-transparent text-[#475569] hover:bg-[#F1F5F9] focus:ring-[#64748B] border-none',
    destructive:
      'bg-[#EF4444] text-white hover:bg-[#DC2626] focus:ring-[#EF4444] border-none shadow-sm',
    sage:
      'bg-[#059669] text-white hover:bg-[#047857] focus:ring-[#059669] border-none shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-[14px] px-[14px] py-[6px] h-[36px]',
    md: 'text-[14px] px-[22px] py-[10px] h-[44px]',
    lg: 'text-[16px] px-[28px] py-[12px] h-[48px]',
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
