import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'cozy' | 'soft';
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
    default: 'bg-white border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)]',
    elevated: 'bg-white border border-teal-100/80 shadow-[0_12px_32px_-4px_rgba(13,148,136,0.08),0_4px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_18px_40px_-6px_rgba(13,148,136,0.12)]',
    cozy: 'bg-[#FAFBFC] border border-slate-200/80 shadow-sm hover:shadow-md',
    soft: 'bg-[#F0FDFA] border border-teal-100 shadow-sm',
  };

  return (
    <div
      className={`rounded-2xl sm:rounded-[24px] overflow-hidden transition-all duration-300 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {headerStrip && (
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <span className="font-headline font-semibold text-sm tracking-wide">
            {headerStrip}
          </span>
          {headerStripAction}
        </div>
      )}
      <div className="p-6 sm:p-7">{children}</div>
    </div>
  );
};
