import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  headerStrip?: string;
  headerStripAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  headerStrip,
  headerStripAction,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border border-[#E2E8F0] shadow-none',
    elevated: 'bg-white border-none shadow-[0_4px_16px_rgba(15,23,42,0.07)]',
  };

  return (
    <div
      className={`rounded-[8px] overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {headerStrip && (
        <div className="bg-[#0F172A] text-white px-6 py-3 flex items-center justify-between">
          <span className="font-headline font-semibold text-sm tracking-wide uppercase">
            {headerStrip}
          </span>
          {headerStripAction}
        </div>
      )}
      <div className={headerStrip ? 'p-6' : 'p-6'}>{children}</div>
    </div>
  );
};
