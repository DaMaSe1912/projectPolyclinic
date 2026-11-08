import React from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'filter'
    | 'filter-active'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'neutral';
  interactive?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'neutral',
  interactive = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    filter: 'bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]',
    'filter-active': 'bg-[#0F172A] text-white border-none',
    success: 'bg-[#22C55E15] text-[#16A34A] border-none',
    warning: 'bg-[#EAB30815] text-[#CA8A04] border-none',
    error: 'bg-[#EF444415] text-[#DC2626] border-none',
    info: 'bg-[#0EA5E915] text-[#0284C7] border-none',
    neutral: 'bg-[#F1F5F9] text-[#475569] border-none',
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all'
    : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-[12px] py-[4px] rounded-[4px] text-[12px] font-medium uppercase tracking-[0.5px] select-none ${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
